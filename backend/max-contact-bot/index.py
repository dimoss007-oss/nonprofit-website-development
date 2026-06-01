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


def save_subscriber(chat_id: int, username: str):
    db_url = os.environ.get("DATABASE_URL", "")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {schema}.max_contact_subscribers (chat_id, username) "
        f"VALUES ({chat_id}, '{username}') ON CONFLICT (chat_id) DO NOTHING"
    )
    cur.close()
    conn.close()


def handler(event: dict, context) -> dict:
    """Webhook бота Max для уведомлений о заявках с сайта. Принимает /start и сохраняет chat_id."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")
    print(f"max-contact-bot body: {json.dumps(body)}")

    update_type = body.get("update_type", "")

    def get_user_id():
        if update_type == "bot_started":
            return body.get("user_id") or (body.get("user") or {}).get("user_id")
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("user_id")

    def get_username():
        if update_type == "bot_started":
            user = body.get("user") or {}
            return user.get("name") or user.get("login") or ""
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("name") or sender.get("login") or ""

    user_id = get_user_id()
    if not user_id:
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    chat_id = int(user_id)
    username = get_username()

    save_subscriber(chat_id, username)
    send_message(
        chat_id,
        "Привет! Теперь вы будете получать уведомления о новых заявках с сайта «Спасение надежды».",
        token
    )

    return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}
