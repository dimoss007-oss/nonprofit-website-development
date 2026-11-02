import hashlib
import hmac
import json
import os
import psycopg2


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def is_admin(cur, schema: str, login: str, password: str) -> bool:
    """Проверяет права администратора: сначала мастер-аккаунт (ADMIN_LOGIN/ADMIN_PASSWORD),
    затем обычные пользователи admin_users с role='admin'. Используется для защиты
    редактирования системного промпта YandexGPT от рядовых сотрудников."""
    if not login or not password:
        return False

    master_login = os.environ.get("ADMIN_LOGIN", "")
    master_password = os.environ.get("ADMIN_PASSWORD", "")
    if master_login and hmac.compare_digest(login, master_login) and hmac.compare_digest(password, master_password):
        return True

    if password.startswith("stk_"):
        try:
            cur.execute(
                f"SELECT u.role FROM {schema}.staff_sessions s JOIN {schema}.admin_users u ON u.id = s.user_id WHERE s.token_hash = %s AND s.expires_at > NOW() AND u.login = %s",
                (hash_password(password), login),
            )
            row = cur.fetchone()
            if not row:
                return False
            return (row["role"] if isinstance(row, dict) else row[0]) == "admin"
        except Exception as e:
            print(f"is_admin token check error: {e}")
            return False

    try:
        cur.execute(f"SELECT password_hash, role FROM {schema}.admin_users WHERE login = %s", (login,))
        user = cur.fetchone()
        if not user:
            return False
        stored_hash = user["password_hash"] if isinstance(user, dict) else user[0]
        role = user["role"] if isinstance(user, dict) else user[1]
        if role != "admin":
            return False
        return hmac.compare_digest(hash_password(password), stored_hash)
    except Exception as e:
        print(f"is_admin check error: {e}")
        return False
