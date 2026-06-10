import json
import os
import hashlib
import hmac
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_master(login: str, password: str) -> bool:
    master_login = os.environ.get("ADMIN_LOGIN", "")
    master_password = os.environ.get("ADMIN_PASSWORD", "")
    return hmac.compare_digest(login, master_login) and hmac.compare_digest(password, master_password)

def handler(event: dict, context) -> dict:
    """Управление пользователями админ-панели и авторизация с ролями."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    # ── Авторизация ──────────────────────────────────────
    if method == "POST" and body.get("action") == "login":
        login = body.get("login", "")
        password = body.get("password", "")

        # Сначала проверяем мастер-аккаунт (из секретов) — он всегда admin
        if verify_master(login, password):
            return ok({"ok": True, "role": "admin", "full_name": "Администратор", "login": login})

        # Затем проверяем таблицу пользователей
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT * FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
        user = cur.fetchone()
        conn.close()

        if not user:
            return ok({"ok": False, "error": "Неверный логин или пароль"}, 401)

        if not hmac.compare_digest(hash_password(password), user["password_hash"]):
            return ok({"ok": False, "error": "Неверный логин или пароль"}, 401)

        return ok({"ok": True, "role": user["role"], "full_name": user["full_name"] or login, "login": login})

    # ── Все остальные действия требуют мастер-аккаунта ──
    auth_login = body.get("auth_login", "")
    auth_password = body.get("auth_password", "")
    if not verify_master(auth_login, auth_password):
        return err("Нет прав", 403)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Список пользователей
    if method == "GET":
        cur.execute(f"SELECT id, login, role, full_name, created_at FROM {SCHEMA}.admin_users ORDER BY created_at")
        users = cur.fetchall()
        conn.close()
        return ok({"users": [dict(u) for u in users]})

    if method == "POST":
        action = body.get("action")

        # Создать пользователя
        if action == "create":
            login = body.get("login", "").strip()
            password = body.get("password", "").strip()
            role = body.get("role", "user")
            full_name = body.get("full_name", "").strip()

            if not login or not password:
                return err("Логин и пароль обязательны")
            if role not in ("admin", "user"):
                return err("Неверная роль")

            cur.execute(f"SELECT id FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
            if cur.fetchone():
                return err("Пользователь с таким логином уже существует")

            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_users (login, password_hash, role, full_name) VALUES (%s,%s,%s,%s) RETURNING id, login, role, full_name, created_at",
                (login, hash_password(password), role, full_name or None)
            )
            user = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"user": dict(user)}, 201)

        # Изменить роль / имя
        if action == "update":
            user_id = body.get("user_id")
            role = body.get("role")
            full_name = body.get("full_name", "")
            new_password = body.get("new_password", "").strip()

            if role and role not in ("admin", "user"):
                return err("Неверная роль")

            if new_password:
                cur.execute(
                    f"UPDATE {SCHEMA}.admin_users SET role=COALESCE(%s,role), full_name=%s, password_hash=%s WHERE id=%s RETURNING id, login, role, full_name",
                    (role, full_name or None, hash_password(new_password), user_id)
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.admin_users SET role=COALESCE(%s,role), full_name=%s WHERE id=%s RETURNING id, login, role, full_name",
                    (role, full_name or None, user_id)
                )
            user = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"user": dict(user)})

        # Удалить пользователя
        if action == "delete":
            user_id = body.get("user_id")
            cur.execute(f"DELETE FROM {SCHEMA}.admin_users WHERE id=%s", (user_id,))
            conn.commit()
            conn.close()
            return ok({"success": True})

    conn.close()
    return err("Метод не поддерживается", 405)
