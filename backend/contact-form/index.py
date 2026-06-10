import json
import os
import psycopg2
import requests

MAX_API_URL = "https://platform-api.max.ru"


def get_subscribers(db_url: str, schema: str):
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"SELECT chat_id FROM {schema}.max_contact_subscribers")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [r[0] for r in rows]


def send_message(chat_id: int, text: str, token: str):
    r = requests.post(
        f"{MAX_API_URL}/messages",
        params={"user_id": chat_id},
        headers={"Authorization": token},
        json={"text": text}
    )
    print(f"send_message chat_id={chat_id} status={r.status_code}")


def handler(event: dict, context) -> dict:
    """Обработка формы 'Написать нам' — рассылает уведомление в Max всем подписчикам бота."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    body = json.loads(event.get("body") or "{}")
    name = body.get("name", "").strip()
    email = body.get("email", "").strip()
    phone = body.get("phone", "").strip()
    subject = body.get("subject", "").strip()
    message = body.get("message", "").strip()

    if not name or not message:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "Имя и сообщение обязательны"})
        }

    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    db_url = os.environ.get("DATABASE_URL", "")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")

    # Сохраняем заявку в БД
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {schema}.contact_requests (name, phone, email, subject, message) VALUES (%s,%s,%s,%s,%s)",
        (name, phone or None, email or None, subject or None, message)
    )
    cur.close()
    conn.close()

    text = (
        f"📩 Новая заявка с сайта!\n\n"
        f"👤 Имя: {name}\n"
        f"📞 Телефон: {phone or '—'}\n"
        f"📧 Email: {email or '—'}\n"
        f"📌 Тема: {subject or '—'}\n\n"
        f"💬 Сообщение:\n{message}"
    )

    subscribers = get_subscribers(db_url, schema)
    print(f"Sending to {len(subscribers)} subscribers")
    for chat_id in subscribers:
        send_message(chat_id, text, token)

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"ok": True})
    }