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

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, "data.db")
SECRET_FILE = os.path.join(ROOT, "secret.txt")
PORT = int(os.environ.get("PORT", "8080"))
TOKEN_TTL = 60 * 60 * 24 * 7  # 7 天

KINDS = ("cases", "documents", "searches", "events", "settings")
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
    return s

SECRET = load_secret()

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
# 业务
# ---------------------------------------------------------------------------
def create_user(username, password):
    if not username or not password:
        return None, "用户名和密码不能为空"
    if len(password) < 6:
        return None, "密码至少 6 位"
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
    conn = get_db()
    c = conn.cursor()
    out = {}
    for k in KINDS:
        if k == "settings":
            c.execute("SELECT payload FROM data WHERE user_id=? AND kind=?", (uid, k))
            row = c.fetchone()
            out[k] = json.loads(row["payload"]) if row else {}
        else:
            c.execute("SELECT payload FROM data WHERE user_id=? AND kind=?", (uid, k))
            row = c.fetchone()
            out[k] = json.loads(row["payload"]) if row else []
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
                payload = json.dumps(val, ensure_ascii=False)
                c.execute(
                    "INSERT INTO data(user_id, kind, payload, updated_at) VALUES(?,?,?,?) "
                    "ON CONFLICT(user_id, kind) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at",
                    (uid, k, payload, now),
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
        self.send_header("Access-Control-Allow-Origin", "*")
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
        if path == "/api/health":
            self._send(200, {"ok": True})
            return
        if path == "/api/bootstrap":
            uid = self._uid()
            if not uid:
                self._send(401, {"error": "未登录或登录已过期"})
                return
            self._send(200, bootstrap(uid))
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
            self._send(200, {"ok": True, "synced_at": int(time.time())})
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
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"律师工作台后端已启动： http://localhost:{PORT}/  (数据库：{DB})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        httpd.shutdown()

if __name__ == "__main__":
    main()
