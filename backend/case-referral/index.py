import json
import os
import re
import uuid
import base64
import psycopg2
import boto3
import requests

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def cdn_url(key: str) -> str:
    aid = os.environ["AWS_ACCESS_KEY_ID"]
    return f"https://cdn.poehali.dev/projects/{aid}/bucket/{key}"


def get_subscribers(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT chat_id FROM {SCHEMA}.max_contact_subscribers")
    rows = cur.fetchall()
    cur.close()
    return [r[0] for r in rows]


def send_message(chat_id: int, text: str, token: str):
    try:
        requests.post(
            f"{MAX_API_URL}/messages",
            params={"user_id": chat_id},
            headers={"Authorization": token},
            json={"text": text},
            timeout=5,
        )
    except Exception as e:
        print(f"Max notify error: {e}")


def handler(event: dict, context) -> dict:
    """Приём обращений от организаций/специалистов о случаях, требующих помощи, с прикреплёнными документами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")

    organization = (body.get("organization") or "").strip()
    district = (body.get("district") or "").strip()
    responsible_name = (body.get("responsible_name") or "").strip()
    responsible_phone = (body.get("responsible_phone") or "").strip()
    beneficiary_name = (body.get("beneficiary_name") or "").strip()
    beneficiary_phone = (body.get("beneficiary_phone") or "").strip()
    description = (body.get("description") or "").strip()
    files = body.get("files") or []

    if not responsible_name or not description:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "ФИО ответственного и описание случая обязательны"}),
        }

    attachments = []
    bucket = s3()
    for f in files[:10]:
        filename = f.get("filename", "file")
        content_type = f.get("content_type", "application/octet-stream")
        data_b64 = f.get("data")
        if not data_b64:
            continue
        file_data = base64.b64decode(data_b64)
        safe_name = re.sub(r"[^\w.\-]", "_", filename)
        key = f"case-referrals/{uuid.uuid4().hex[:10]}_{safe_name}"
        bucket.put_object(Bucket="files", Key=key, Body=file_data, ContentType=content_type)
        attachments.append({"filename": filename, "url": cdn_url(key)})

    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SCHEMA}.contact_requests
            (name, phone, message, status, request_type, organization, district,
             responsible_name, responsible_phone, beneficiary_name, beneficiary_phone, attachments)
            VALUES (%s,%s,%s,'new','case_referral',%s,%s,%s,%s,%s,%s,%s)
            RETURNING id""",
        (
            responsible_name, responsible_phone or None, description,
            organization or None, district or None,
            responsible_name, responsible_phone or None,
            beneficiary_name or None, beneficiary_phone or None,
            json.dumps(attachments),
        ),
    )
    new_id = cur.fetchone()[0]

    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    text = (
        f"📋 Новое обращение по случаю!\n\n"
        f"🏢 Организация: {organization or '—'}\n"
        f"📍 Район: {district or '—'}\n"
        f"👤 Ответственный: {responsible_name}\n"
        f"📞 Телефон ответственного: {responsible_phone or '—'}\n"
        f"🧑 Благополучатель: {beneficiary_name or '—'}\n"
        f"📞 Телефон благополучателя: {beneficiary_phone or '—'}\n\n"
        f"💬 Описание случая:\n{description}\n\n"
        f"📎 Вложений: {len(attachments)}"
    )
    for chat_id in get_subscribers(conn):
        send_message(chat_id, text, token)

    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "id": new_id}),
    }
