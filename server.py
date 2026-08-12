#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
律师工作台 —— 完整后端（Python 标准库，零依赖）
- 鉴权：HMAC 自签 token（类 JWT，HS256）
- 持久化：内置 sqlite3（data.db）
- 权限：所有数据按 user_id 隔离，用户仅可见自己的数据
- 同步：本地优先 + 服务端权威。前端登录后 GET /api/bootstrap 拉取全量，
        每次变更 PUT /api/sync 推送全量（last-write-wins，适合单用户多端）。
- 静态托管：同源返回前端文件，免 CORS。
"""

import http.server
import socketserver
import sqlite3
import json
import os
import hashlib
import hmac
import base64
import time
import secrets
import threading
from urllib.parse import urlparse

# ── P0-1: AES-256-GCM 加密（优先用 cryptography 库）──────────────────────
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, "data.db")
SECRET_FILE = os.path.join(ROOT, "secret.txt")
PORT = int(os.environ.get("PORT", "8080"))
TOKEN_TTL = 60 * 60 * 24 * 7  # 7 天

KINDS = ("cases", "documents", "searches", "events", "finances", "messages", "docVersions", "settings", "auditLogs")
_lock = threading.Lock()

# ---------------------------------------------------------------------------
# 密钥（重启后保持一致，避免 token 失效）
# ---------------------------------------------------------------------------
def load_secret():
    if os.path.exists(SECRET_FILE):
        with open(SECRET_FILE, "r", encoding="utf-8") as f:
            s = f.read().strip()
            if s:
                return s
    s = secrets.token_hex(32)
    with open(SECRET_FILE, "w", encoding="utf-8") as f:
        f.write(s)
    os.chmod(SECRET_FILE, 0o600)
    return s

SECRET = load_secret()

# ── P0-1: 加密密钥派生 ────────────────────────────────────────────────────
def _derive_key(uid):
    """从主密钥 + user_id 派生用户独立加密密钥"""
    if not HAS_CRYPTO:
        return None
    salt = hashlib.sha256(f"goodlawyer-uid-{uid}".encode()).digest()[:16]
    return hashlib.pbkdf2_hmac("sha256", SECRET.encode(), salt, 100000, dklen=32)

_USER_KEYS = {}

def get_user_key(uid):
    """缓存用户加密密钥"""
    if uid not in _USER_KEYS:
        _USER_KEYS[uid] = _derive_key(uid)
    return _USER_KEYS[uid]

def encrypt_payload(plaintext, uid):
    """AES-256-GCM 加密，输出 base64(nonce+ct+tag)"""
    key = get_user_key(uid)
    if not key:
        # 降级：明文标记
        return "__PLAIN__" + base64.urlsafe_b64encode(plaintext.encode()).decode()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.urlsafe_b64encode(nonce + ct).decode()

def decrypt_payload(ciphertext, uid):
    """解密 payload"""
    if ciphertext.startswith("__PLAIN__"):
        raw = base64.urlsafe_b64decode(ciphertext[len("__PLAIN__"):])
        return raw.decode("utf-8")
    key = get_user_key(uid)
    if not key:
        raise RuntimeError("cryptography 库未安装，无法解密旧数据")
    raw = base64.urlsafe_b64decode(ciphertext.encode())
    nonce, ct = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, None).decode("utf-8")

def migrate_plaintext(uid):
    """迁移用户已有明文数据到加密格式"""
    conn = get_db()
    c = conn.cursor()
    migrated = 0
    for k in KINDS:
        c.execute("SELECT payload FROM data WHERE user_id=? AND kind=?", (uid, k))
        row = c.fetchone()
        if row and not row["payload"].startswith("__ENC__") and not row["payload"].startswith("__PLAIN__"):
            try:
                plain = row["payload"]
                enc = encrypt_payload(plain, uid)
                enc = "__ENC__" + enc  # 标记已加密
                c.execute("UPDATE data SET payload=? WHERE user_id=? AND kind=?", (enc, uid, k))
                migrated += 1
            except Exception:
                pass
    conn.commit()
    conn.close()
    return migrated

# ---------------------------------------------------------------------------
# 数据库
# ---------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            pw_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL)"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS sharing(
            case_id TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            shared_with INTEGER NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY(case_id, shared_with))"""
    )
    c.execute(
        """CREATE TABLE IF NOT EXISTS data(
            user_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY(user_id, kind))"""
    )
    conn.commit()
    conn.close()

# ---------------------------------------------------------------------------
# 密码 & Token
# ---------------------------------------------------------------------------
def hash_pw(pw, salt):
    return hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt.encode("utf-8"), 100000).hex()

def make_token(uid):
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.urlsafe_b64encode(json.dumps({"uid": uid, "exp": int(time.time()) + TOKEN_TTL}).encode()).decode().rstrip("=")
    sig = base64.urlsafe_b64encode(
        hmac.new(SECRET.encode(), (header + "." + payload).encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")
    return header + "." + payload + "." + sig

def _pad(s):
    return s + "=" * (-len(s) % 4)

def verify_token(tok):
    if not tok:
        return None
    try:
        parts = tok.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        expected = base64.urlsafe_b64encode(
            hmac.new(SECRET.encode(), (header + "." + payload).encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        if not hmac.compare_digest(expected, sig):
            return None
        data = json.loads(base64.urlsafe_b64decode(_pad(payload)).decode())
        if data.get("exp", 0) < int(time.time()):
            return None
        return data["uid"]
    except Exception:
        return None

# ---------------------------------------------------------------------------
# 共享与权限
# ---------------------------------------------------------------------------
def get_username(uid):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT username FROM users WHERE id=?", (uid,))
    row = c.fetchone()
    conn.close()
    return row["username"] if row else None

def get_user_id(username):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username=?", (username,))
    row = c.fetchone()
    conn.close()
    return row["id"] if row else None

def share_case(owner_id, target_username, case_id, role):
    """分享案件给目标用户"""
    if role not in ("editor", "viewer"):
        return None, "无效的角色（应为 editor 或 viewer）"
    target_id = get_user_id(target_username)
    if not target_id:
        return None, "用户不存在"
    if target_id == owner_id:
        return None, "不能分享给自己"
    # 验证案件属于 owner
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT payload FROM data WHERE user_id=? AND kind='cases'", (owner_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None, "您没有可分享的案件"
    raw = row["payload"]
    if raw.startswith("__ENC__"):
        raw = raw[len("__ENC__"):]
    try:
        cases = json.loads(decrypt_payload(raw, owner_id))
        case = next((x for x in cases if x.get("id") == case_id), None)
        if not case:
            conn.close()
            return None, "案件不存在或不属于您"
    except Exception:
        conn.close()
        return None, "解密案件数据失败"
    
    # 写入 sharing 表
    c.execute(
        "INSERT OR REPLACE INTO sharing(case_id, owner_id, shared_with, role, created_at) VALUES(?,?,?,?,?)",
        (case_id, owner_id, target_id, role, time.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()
    return {"ok": True, "shared_with": target_id, "username": target_username, "role": role}, None

def unshare_case(owner_id, target_username, case_id):
    """取消分享"""
    target_id = get_user_id(target_username)
    if not target_id:
        return None, "用户不存在"
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "DELETE FROM sharing WHERE case_id=? AND owner_id=? AND shared_with=?",
        (case_id, owner_id, target_id)
    )
    conn.commit()
    conn.close()
    return {"ok": True}, None

def list_my_shares(uid):
    """列出我分享出去的案件"""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT case_id, shared_with, role, created_at FROM sharing WHERE owner_id=?", (uid,))
    rows = c.fetchall()
    result = []
    for r in rows:
        result.append({
            "case_id": r["case_id"],
            "shared_with": r["shared_with"],
            "username": get_username(r["shared_with"]),
            "role": r["role"],
            "created_at": r["created_at"]
        })
    conn.close()
    return result

def list_shared_with_me(uid):
    """列出别人共享给我的案件"""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT case_id, owner_id, role, created_at FROM sharing WHERE shared_with=?", (uid,))
    rows = c.fetchall()
    result = []
    for r in rows:
        result.append({
            "case_id": r["case_id"],
            "owner_id": r["owner_id"],
            "owner_name": get_username(r["owner_id"]),
            "role": r["role"],
            "created_at": r["created_at"]
        })
    conn.close()
    return result

def get_shared_data(uid):
    """获取别人共享给当前用户的案件数据（明文）"""
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT case_id, owner_id, role FROM sharing WHERE shared_with=?", (uid,))
    shares = c.fetchall()
    
    result = {
        "cases": [],
        "documents": [],
        "events": [],
        "finances": [],
        "messages": []
    }
    
    for share in shares:
        case_id = share["case_id"]
        owner_id = share["owner_id"]
        role = share["role"]
        
        # 从 owner 数据中提取关联数据
        for kind in ["cases", "documents", "events", "finances", "messages"]:
            c.execute("SELECT payload FROM data WHERE user_id=? AND kind=?", (owner_id, kind))
            row = c.fetchone()
            if not row:
                continue
            raw = row["payload"]
            if raw.startswith("__ENC__"):
                raw = raw[len("__ENC__"):]
            try:
                items = json.loads(decrypt_payload(raw, owner_id))
                if kind == "cases":
                    filtered = [item for item in items if item.get("id") == case_id]
                    for item in filtered:
                        item["_shared_role"] = role
                        item["_shared_from"] = owner_id
                    result["cases"].extend(filtered)
                elif kind in ("documents", "events", "finances", "messages"):
                    filtered = [item for item in items if item.get("caseId") == case_id]
                    for item in filtered:
                        item["_shared_role"] = role
                        item["_shared_from"] = owner_id
                    result[kind].extend(filtered)
            except Exception:
                pass
    
    conn.close()
    return result
def create_user(username, password):
    if not username or not password:
        return None, "用户名和密码不能为空"
    if len(password) < 8:
        return None, "密码至少 8 位"
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return None, "密码须包含字母和数字"
    with _lock:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT id FROM users WHERE username=?", (username,))
        if c.fetchone():
            conn.close()
            return None, "该用户名已存在"
        salt = secrets.token_hex(8)
        pw_hash = hash_pw(password, salt)
        c.execute(
            "INSERT INTO users(username, pw_hash, salt, created_at) VALUES(?,?,?,?)",
            (username, pw_hash, salt, time.strftime("%Y-%m-%d %H:%M:%S")),
        )
        uid = c.lastrowid
        conn.commit()
        conn.close()
        return uid, None

def auth_user(username, password):
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, pw_hash, salt FROM users WHERE username=?", (username,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None, "用户不存在"
    uid, pw_hash, salt = row
    if not hmac.compare_digest(pw_hash, hash_pw(password, salt)):
        return None, "密码错误"
    return uid, None

def bootstrap(uid):
    # 首次拉取时自动迁移旧明文数据
    migrate_plaintext(uid)
    conn = get_db()
    c = conn.cursor()
    out = {}
    for k in KINDS:
        c.execute("SELECT payload FROM data WHERE user_id=? AND kind=?", (uid, k))
        row = c.fetchone()
        raw_payload = row["payload"] if row else None
        if raw_payload and raw_payload.startswith("__ENC__"):
            raw_payload = raw_payload[len("__ENC__"):]
        try:
            plain = decrypt_payload(raw_payload, uid) if raw_payload else ("{}" if k == "settings" else "[]")
            out[k] = json.loads(plain)
        except (json.JSONDecodeError, Exception):
            out[k] = {} if k == "settings" else []
    
    # 合并别人共享给我的数据
    shared = get_shared_data(uid)
    for k in ["cases", "documents", "events", "finances", "messages"]:
        if shared.get(k):
            out[k] = out.get(k, []) + shared[k]
    
    conn.close()
    return out

def sync(uid, body):
    with _lock:
        conn = get_db()
        c = conn.cursor()
        now = time.strftime("%Y-%m-%d %H:%M:%S")
        for k in KINDS:
            if k in body:
                val = body[k]
                plain = json.dumps(val, ensure_ascii=False)
                enc = "__ENC__" + encrypt_payload(plain, uid)
                c.execute(
                    "INSERT INTO data(user_id, kind, payload, updated_at) VALUES(?,?,?,?) "
                    "ON CONFLICT(user_id, kind) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
                    (uid, k, enc, now),
                )
        conn.commit()
        conn.close()
    return True

# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "LawWorkbench/1.0"

    def _cors(self):
        origin = self.headers.get("Origin", "")
        # 允许同源请求；若需要跨域部署，可在此配置允许的 origin
        allow = origin if origin else "*"
        self.send_header("Access-Control-Allow-Origin", allow)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send(self, code, obj=None, ctype="application/json; charset=utf-8"):
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if obj is not None:
            self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def _body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            return {}
        if length > 10 * 1024 * 1024:  # 10MB limit
            return {"_error": "payload too large"}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return {}

    def _uid(self):
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            return verify_token(auth[7:].strip())
        return None

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        path = u.path
        # ── P0-3: 服务端时间接口 ──────────────────────────────────────────
        if path == "/api/time":
            self._send(200, {
                "now": time.strftime("%Y-%m-%d %H:%M:%S"),
                "ts": int(time.time()),
                "tz": time.strftime("%Z")
            })
            return
        if path == "/api/health":
            self._send(200, {"ok": True, "crypto": HAS_CRYPTO})
            return
        if path == "/api/bootstrap":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            data = bootstrap(uid)
            data["_localVersion"] = int(time.time())
            self._send(200, data)
            return
        if path == "/api/shares":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            self._send(200, {
                "my_shares": list_my_shares(uid),
                "shared_with_me": list_shared_with_me(uid)
            })
            return
        if path == "/api/users/search":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            q = u.query
            params = dict(p.split("=", 1) for p in q.split("&") if "=" in p)
            username = params.get("q", "").strip()
            if not username:
                self._send(200, {"users": []})
                return
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, username FROM users WHERE username LIKE ? AND id != ? LIMIT 10",
                      (f"%{username}%", uid))
            users = [{"id": r["id"], "username": r["username"]} for r in c.fetchall()]
            conn.close()
            self._send(200, {"users": users})
            return
        # 静态文件
        self.serve_static(path)
        return

    def do_POST(self):
        u = urlparse(self.path)
        path = u.path
        if path == "/api/register":
            b = self._body()
            uid, err = create_user(b.get("username", "").strip(), b.get("password", ""))
            if err:
                self._send(400, {"error": err})
                return
            self._send(200, {"token": make_token(uid), "uid": uid})
            return
        if path == "/api/login":
            b = self._body()
            uid, err = auth_user(b.get("username", "").strip(), b.get("password", ""))
            if err:
                self._send(401, {"error": err})
                return
            self._send(200, {"token": make_token(uid), "uid": uid})
            return
        if path == "/api/share":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            b = self._body()
            result, err = share_case(
                uid,
                b.get("username", "").strip(),
                b.get("case_id", "").strip(),
                b.get("role", "viewer")
            )
            if err:
                self._send(400, {"error": err})
                return
            self._send(200, result)
            return
        self._send(404, {"error": "not found"})
        return

    def do_DELETE(self):
        u = urlparse(self.path)
        path = u.path
        if path.startswith("/api/share/"):
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            # /api/share/{case_id}/{username}
            parts = path.split("/")
            if len(parts) >= 5:
                case_id = parts[3]
                username = parts[4]
                result, err = unshare_case(uid, username, case_id)
                if err:
                    self._send(400, {"error": err})
                    return
                self._send(200, result)
                return
            self._send(400, {"error": "无效的请求"})
            return
        self._send(404, {"error": "not found"})
        return

    def do_PUT(self):
        u = urlparse(self.path)
        path = u.path
        if path == "/api/sync":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            b = self._body()
            sync(uid, b)
            server_version = int(time.time())
            self._send(200, {"ok": True, "synced_at": server_version, "serverVersion": server_version})
            return
        self._send(404, {"error": "not found"})
        return

    # ---- 静态文件 ----
    MIME = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon",
        ".txt": "text/plain; charset=utf-8",
    }

    def serve_static(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        # 防目录穿越
        rel = os.path.normpath(path).lstrip("/\\")
        full = os.path.join(ROOT, rel)
        if not os.path.abspath(full).startswith(os.path.abspath(ROOT)):
            self._send(403, {"error": "forbidden"})
            return
        if not os.path.isfile(full):
            self._send(404, {"error": "not found"})
            return
        ext = os.path.splitext(full)[1].lower()
        ctype = self.MIME.get(ext, "application/octet-stream")
        try:
            with open(full, "rb") as f:
                data = f.read()
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self._send(500, {"error": str(e)})

    def log_message(self, fmt, *args):
        # 精简日志
        pass

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def main():
    init_db()
    if not HAS_CRYPTO:
        print("警告：cryptography 库未安装，数据将以明文存储。安装：pip install cryptography")
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"律师工作台后端已启动： http://localhost:{PORT}/  (数据库：{DB})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        httpd.shutdown()

if __name__ == "__main__":
    main()
