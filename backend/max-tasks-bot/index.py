import json
import os
import psycopg2
import requests

MAX_API_URL = "https://platform-api.max.ru"


def send_message(chat_id: int, text: str, token: str):
    r = requests.post(
        f"{MAX_API_URL}/messages",
        params={"user_id": chat_id},
        headers={"Authorization": token},
        json={"text": text}
    )
    print(f"send_message chat_id={chat_id} status={r.status_code}")


def bind_by_login(chat_id: int, login: str) -> bool:
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"UPDATE {schema}.admin_users SET max_chat_id = %s WHERE login = %s", (chat_id, login))
    updated = cur.rowcount
    cur.close()
    conn.close()
    return updated > 0


def bind_by_phone(chat_id: int, phone: str) -> bool:
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) < 7:
        return False
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"SELECT id, phone FROM {schema}.admin_users WHERE phone IS NOT NULL")
    rows = cur.fetchall()
    matched_id = None
    for row in rows:
        row_digits = ''.join(c for c in (row[1] or '') if c.isdigit())
        if len(row_digits) >= 7 and row_digits[-10:] == digits[-10:]:
            matched_id = row[0]
            break
    if matched_id:
        cur.execute(f"UPDATE {schema}.admin_users SET max_chat_id = %s WHERE id = %s", (chat_id, matched_id))
    cur.close()
    conn.close()
    return matched_id is not None


def handler(event: dict, context) -> dict:
    """Webhook бота Max для уведомлений сотрудников о задачах. /bind логин или /bind +7xxxxxxxxxx."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = os.environ.get("MAX_TASKS_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")

    update_type = body.get("update_type", "")

    def get_user_id():
        if update_type == "bot_started":
            return body.get("user_id") or (body.get("user") or {}).get("user_id")
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("user_id")

    def get_text():
        msg = body.get("message") or {}
        return (msg.get("body") or {}).get("text") or ""

    user_id = get_user_id()
    if not user_id:
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    chat_id = int(user_id)
    text = get_text().strip()

    if text.startswith("/bind"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            send_message(chat_id, "Укажите логин или номер телефона:\n/bind ваш_логин\nили\n/bind +79001234567", token)
        else:
            value = parts[1].strip()
            is_phone = value.startswith("+") or (value[0].isdigit() and len(value) >= 7)
            if is_phone:
                if bind_by_phone(chat_id, value):
                    send_message(chat_id, f"✅ Привязка по номеру {value} выполнена! Теперь вы будете получать уведомления о задачах.", token)
                else:
                    send_message(chat_id, f"❌ Сотрудник с номером {value} не найден. Убедитесь, что номер указан в профиле сотрудника.", token)
            else:
                if bind_by_login(chat_id, value):
                    send_message(chat_id, f"✅ Аккаунт «{value}» привязан! Теперь вы будете получать уведомления о задачах.", token)
                else:
                    send_message(chat_id, f"❌ Пользователь «{value}» не найден. Проверьте логин и попробуйте снова.", token)
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    send_message(
        chat_id,
        "Привет! Я буду отправлять уведомления о задачах из админ-панели.\n\n"
        "Чтобы привязать аккаунт, отправьте:\n"
        "/bind ваш_логин\n"
        "или\n"
        "/bind +79001234567 (номер телефона из профиля)",
        token
    )

    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}
