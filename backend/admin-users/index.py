import json
import os
import hashlib
import hmac
import base64
import uuid
import secrets
import requests
import boto3
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

MAX_API_URL = "https://platform-api.max.ru"
RESET_TTL_MIN = 10
RESET_MAX_ATTEMPTS = 5
RESET_RESEND_SEC = 60
RESET_GENERIC = "Если сотрудник найден и подключён к боту Max, код отправлен в мессенджер."

def hash_code(user_id: int, code: str) -> str:
    return hashlib.sha256(f"{user_id}:{code}".encode()).hexdigest()

def send_reset_code(max_chat_id: int, code: str) -> bool:
    token = os.environ.get("MAX_TASKS_BOT_TOKEN", "")
    if not token or not max_chat_id:
        return False
    try:
        r = requests.post(
            f"{MAX_API_URL}/messages",
            params={"user_id": max_chat_id},
            headers={"Authorization": token},
            json={"text": f"🔐 Код для восстановления пароля: {code}\nДействует {RESET_TTL_MIN} минут. Если вы не запрашивали восстановление, проигнорируйте это сообщение."},
            timeout=5,
        )
        print(f"reset code send status={r.status_code}")
        return r.status_code == 200
    except Exception as e:
        print(f"reset code send error: {e}")
        return False

PUBLIC_COLS = "id, login, role, full_name, phone, created_at, permissions, position, photo_url, (max_chat_id IS NOT NULL) AS max_linked"
FULL_COLS = PUBLIC_COLS + ", birth_date, passport_series, passport_number, passport_issued_by, passport_issued_date"

def clean(value):
    value = (value or "").strip() if isinstance(value, str) else value
    return value or None

def handler(event: dict, context) -> dict:
    """Управление сотрудниками админ-панели: авторизация, роли, права, должности, паспортные данные и фото."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    # ── Авторизация ──────────────────────────────────────
    if method == "POST" and body.get("action") == "login":
        login = body.get("login", "")
        password = body.get("password", "")

        if verify_master(login, password):
            return ok({"ok": True, "role": "admin", "full_name": "Администратор", "login": login, "permissions": None})

        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT * FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
        user = cur.fetchone()
        conn.close()

        if not user:
            return ok({"ok": False, "error": "Неверный логин или пароль"}, 401)

        if not hmac.compare_digest(hash_password(password), user["password_hash"]):
            return ok({"ok": False, "error": "Неверный логин или пароль"}, 401)

        return ok({"ok": True, "role": user["role"], "full_name": user["full_name"] or login, "login": login, "permissions": user.get("permissions")})

    # ── Восстановление пароля через Max ──────────────────
    if method == "POST" and body.get("action") == "request_reset":
        login = (body.get("login") or "").strip()
        if not login:
            return err("Укажите логин")
        conn = get_conn()
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT id, max_chat_id FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
        user = cur.fetchone()
        if user and user["max_chat_id"]:
            cur.execute(
                f"SELECT 1 FROM {SCHEMA}.password_resets WHERE user_id = %s AND created_at > NOW() - (%s || ' seconds')::interval",
                (user["id"], str(RESET_RESEND_SEC)),
            )
            if not cur.fetchone():
                code = f"{secrets.randbelow(1000000):06d}"
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.password_resets (user_id, code_hash, expires_at, attempts, created_at)
                        VALUES (%s, %s, NOW() + (%s || ' minutes')::interval, 0, NOW())
                        ON CONFLICT (user_id) DO UPDATE SET code_hash = EXCLUDED.code_hash,
                            expires_at = EXCLUDED.expires_at, attempts = 0, created_at = NOW()""",
                    (user["id"], hash_code(user["id"], code), str(RESET_TTL_MIN)),
                )
                send_reset_code(user["max_chat_id"], code)
        conn.close()
        return ok({"ok": True, "message": RESET_GENERIC})

    if method == "POST" and body.get("action") == "confirm_reset":
        login = (body.get("login") or "").strip()
        code = (body.get("code") or "").strip()
        new_password = (body.get("new_password") or "").strip()
        if not login or not code or not new_password:
            return err("Заполните все поля")
        if len(new_password) < 6:
            return err("Пароль должен быть не короче 6 символов")
        conn = get_conn()
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            f"""SELECT u.id, r.code_hash, r.attempts, (r.expires_at > NOW()) AS alive
                FROM {SCHEMA}.admin_users u JOIN {SCHEMA}.password_resets r ON r.user_id = u.id
                WHERE u.login = %s""",
            (login,),
        )
        row = cur.fetchone()
        bad = "Неверный или просроченный код"
        if not row or not row["alive"] or row["attempts"] >= RESET_MAX_ATTEMPTS:
            conn.close()
            return err(bad, 400)
        if not hmac.compare_digest(hash_code(row["id"], code), row["code_hash"]):
            cur.execute(f"UPDATE {SCHEMA}.password_resets SET attempts = attempts + 1 WHERE user_id = %s", (row["id"],))
            conn.close()
            return err(bad, 400)
        cur.execute(f"UPDATE {SCHEMA}.admin_users SET password_hash = %s WHERE id = %s", (hash_password(new_password), row["id"]))
        cur.execute(f"UPDATE {SCHEMA}.password_resets SET expires_at = NOW() - interval '1 second' WHERE user_id = %s", (row["id"],))
        conn.close()
        return ok({"ok": True})

    # ── Список пользователей ──────────────────────────────
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT {PUBLIC_COLS} FROM {SCHEMA}.admin_users ORDER BY created_at")
        users = cur.fetchall()
        conn.close()
        return ok({"users": [dict(u) for u in users]})

    # ── Все остальные действия требуют мастер-аккаунта ──
    auth_login = body.get("auth_login", "")
    auth_password = body.get("auth_password", "")
    if not verify_master(auth_login, auth_password):
        return err("Нет прав", 403)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == "POST":
        action = body.get("action")

        if action == "list_full":
            cur.execute(f"SELECT {FULL_COLS} FROM {SCHEMA}.admin_users ORDER BY created_at")
            users = cur.fetchall()
            conn.close()
            return ok({"users": [dict(u) for u in users]})

        if action == "upload_photo":
            user_id = body.get("user_id")
            file_name = body.get("file_name") or "photo.jpg"
            file_data = body.get("file_data")
            file_type = body.get("file_type") or "image/jpeg"
            if not user_id or not file_data:
                conn.close()
                return err("Обязательные поля: user_id, file_data")
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"
            key = f"staff/{user_id}/photo_{uuid.uuid4().hex[:8]}.{ext}"
            s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev", aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"], aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
            s3.put_object(Bucket="files", Key=key, Body=base64.b64decode(file_data), ContentType=file_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
            cur.execute(f"UPDATE {SCHEMA}.admin_users SET photo_url=%s WHERE id=%s RETURNING id, photo_url", (cdn_url, user_id))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"user": dict(row)} if row else {"error": "Не найден"})

        # Создать пользователя
        if action == "create":
            login = body.get("login", "").strip()
            password = body.get("password", "").strip()
            role = body.get("role", "user")
            full_name = body.get("full_name", "").strip()
            phone = body.get("phone", "").strip()
            permissions = body.get("permissions")

            if not login or not password:
                return err("Логин и пароль обязательны")
            if role not in ("admin", "user"):
                return err("Неверная роль")

            cur.execute(f"SELECT id FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
            if cur.fetchone():
                return err("Пользователь с таким логином уже существует")

            permissions_str = json.dumps(permissions) if permissions is not None else None
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_users (login, password_hash, role, full_name, phone, permissions, position, birth_date, passport_series, passport_number, passport_issued_by, passport_issued_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING {PUBLIC_COLS}",
                (login, hash_password(password), role, full_name or None, phone or None, permissions_str,
                 clean(body.get("position")), clean(body.get("birth_date")), clean(body.get("passport_series")), clean(body.get("passport_number")), clean(body.get("passport_issued_by")), clean(body.get("passport_issued_date")))
            )
            user = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"user": dict(user)}, 201)

        # Обновить пользователя
        if action == "update":
            user_id = body.get("user_id")
            role = body.get("role")
            full_name = body.get("full_name", "")
            phone = body.get("phone", "").strip()
            new_password = body.get("new_password", "").strip()
            permissions = body.get("permissions")

            if role and role not in ("admin", "user"):
                return err("Неверная роль")

            permissions_str = json.dumps(permissions) if permissions is not None else None

            fields = ["role=COALESCE(%s,role)", "full_name=%s", "phone=%s", "permissions=%s", "position=%s", "birth_date=%s", "passport_series=%s", "passport_number=%s", "passport_issued_by=%s", "passport_issued_date=%s"]
            values = [role, full_name or None, phone or None, permissions_str, clean(body.get("position")), clean(body.get("birth_date")), clean(body.get("passport_series")), clean(body.get("passport_number")), clean(body.get("passport_issued_by")), clean(body.get("passport_issued_date"))]
            if new_password:
                fields.append("password_hash=%s")
                values.append(hash_password(new_password))
            values.append(user_id)
            cur.execute(f"UPDATE {SCHEMA}.admin_users SET {', '.join(fields)} WHERE id=%s RETURNING {FULL_COLS}", tuple(values))
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
