#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据加密存储模块 —— Fernet (AES-128-CBC + HMAC-SHA256) 对称加密
- 使用 cryptography.fernet，工业级实现
- 每个用户独立密钥（基于主密钥 HMAC-SHA256 派生）
- 明文数据自动向后兼容（无 ENC:v1: 前缀时直接返回）
"""

import os
import base64
import hmac as _hmac
import hashlib
import json
import secrets as _secrets
import threading
from cryptography.fernet import Fernet, InvalidToken

ROOT = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(ROOT, "encryption_key.txt")
ENCRYPTED_PREFIX = "ENC:v1:"

_fernet_cache = {}
_fernet_lock = threading.Lock()

# ---------------------------------------------------------------------------
# 密钥管理
# ---------------------------------------------------------------------------
def load_encryption_key():
    """加载或生成主加密密钥（64 字符 hex = 32 字节）"""
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r", encoding="utf-8") as f:
            s = f.read().strip()
            if s and len(s) == 64:
                return s
    s = _secrets.token_hex(32)
    with open(KEY_FILE, "w", encoding="utf-8") as f:
        f.write(s)
    os.chmod(KEY_FILE, 0o600)
    return s

def _derive_fernet_key(uid):
    """从主密钥为每个用户派生 Fernet 密钥（32 bytes -> base64url）"""
    master = bytes.fromhex(load_encryption_key())
    dk = _hmac.new(master, f"goodlawyer:uid:{uid}:enc:v1".encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(dk)

def _get_fernet(uid):
    with _fernet_lock:
        if uid not in _fernet_cache:
            _fernet_cache[uid] = Fernet(_derive_fernet_key(uid))
        return _fernet_cache[uid]

def derive_user_key(uid):
    """兼容旧调用：返回原始 32 字节派生密钥"""
    return _hmac.new(
        bytes.fromhex(load_encryption_key()),
        f"goodlawyer:uid:{uid}:enc:v1".encode(), hashlib.sha256
    ).digest()

def is_encrypted(payload):
    """检查 payload 是否已加密"""
    return isinstance(payload, str) and payload.startswith(ENCRYPTED_PREFIX)

# ---------------------------------------------------------------------------
# 公开 API
# ---------------------------------------------------------------------------
def encrypt_payload(plaintext, uid):
    """加密 payload，返回 'ENC:v1:<fernet-token>' 格式"""
    if not isinstance(plaintext, str):
        plaintext = json.dumps(plaintext, ensure_ascii=False)
    token = _get_fernet(uid).encrypt(plaintext.encode("utf-8")).decode("ascii")
    return ENCRYPTED_PREFIX + token

def decrypt_payload(stored, uid):
    """解密 payload。非加密格式原样返回（向后兼容）。"""
    if not is_encrypted(stored):
        return stored
    try:
        return _get_fernet(uid).decrypt(
            stored[len(ENCRYPTED_PREFIX):].encode("ascii")
        ).decode("utf-8")
    except (InvalidToken, Exception) as e:
        raise ValueError(f"Decryption failed: {e}")

def encrypt_all_payloads(plaintext_payloads, uid):
    """批量加密多个 kind 的 payload"""
    return {k: encrypt_payload(v, uid) for k, v in plaintext_payloads.items() if v is not None}

def migrate_plaintext(uid):
    """迁移指定用户的所有明文 payload 到加密格式"""
    import sqlite3
    db_path = os.path.join(ROOT, "data.db")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT kind, payload FROM data WHERE user_id=?", (uid,))
    rows = c.fetchall()
    migrated = 0
    for kind, payload in rows:
        if not is_encrypted(payload):
            c.execute("UPDATE data SET payload=? WHERE user_id=? AND kind=?",
                      (encrypt_payload(payload, uid), uid, kind))
            migrated += 1
    conn.commit()
    conn.close()
    return migrated

def migrate_all_users():
    """迁移所有用户的数据"""
    import sqlite3
    db_path = os.path.join(ROOT, "data.db")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT DISTINCT user_id FROM data")
    uids = [r[0] for r in c.fetchall()]
    conn.close()
    return sum(migrate_plaintext(uid) for uid in uids)

# ---------------------------------------------------------------------------
# 测试
# ---------------------------------------------------------------------------
def test_encryption():
    test_uid = 999
    test_data = '{"cases": [{"id": "test", "title": "Test Case"}]}'
    encrypted = encrypt_payload(test_data, test_uid)
    assert encrypted.startswith(ENCRYPTED_PREFIX), "加密格式错误"
    decrypted = decrypt_payload(encrypted, test_uid)
    assert decrypted == test_data, "解密结果不匹配"
    plain = '{"test": "data"}'
    assert decrypt_payload(plain, test_uid) == plain, "非加密格式应原样返回"
    print("crypto: 加密/解密测试通过")

if __name__ == "__main__":
    test_encryption()
