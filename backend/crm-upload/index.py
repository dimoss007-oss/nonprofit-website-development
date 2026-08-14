import json
import os
import base64
import uuid
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

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

def handler(event: dict, context) -> dict:
    """CRM: загрузка документов пациента и фото (пациента/ребёнка) в S3.
    target: 'document' (по умолчанию) | 'patient_photo' | 'child_photo'. Для 'child_photo' обязателен child_id."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    raw_body = event.get("body") or ""
    if not raw_body:
        return err("Тело запроса пустое — возможно файл слишком большой (лимит ~10 МБ)")

    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8")

    body = json.loads(raw_body)
    patient_id = body.get("patient_id")
    file_name = body.get("file_name")
    file_data = body.get("file_data")
    file_type = body.get("file_type", "application/octet-stream")
    target = body.get("target", "document")
    child_id = body.get("child_id")

    if not patient_id or not file_name or not file_data:
        return err("Обязательные поля: patient_id, file_name, file_data")
    if target == "child_photo" and not child_id:
        return err("Для target=child_photo обязателен child_id")

    raw = base64.b64decode(file_data)
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"

    if target == "patient_photo":
        key = f"crm/patients/{patient_id}/photo_{uuid.uuid4().hex[:8]}.{ext}"
    elif target == "child_photo":
        key = f"crm/patients/{patient_id}/children/{child_id}/photo_{uuid.uuid4().hex[:8]}.{ext}"
    else:
        key = f"crm/patients/{patient_id}/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=file_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if target == "patient_photo":
        cur.execute(
            f"UPDATE {SCHEMA}.patients SET photo_url = %s WHERE id = %s RETURNING id, photo_url",
            (cdn_url, patient_id),
        )
        row = cur.fetchone()
        conn.commit()
        return ok({"photo_url": row["photo_url"], "patient_id": row["id"]}, 201)

    if target == "child_photo":
        cur.execute(
            f"UPDATE {SCHEMA}.patient_children SET photo_url = %s WHERE id = %s AND patient_id = %s RETURNING id, photo_url",
            (cdn_url, child_id, patient_id),
        )
        row = cur.fetchone()
        conn.commit()
        if not row:
            return err("Ребёнок не найден", 404)
        return ok({"photo_url": row["photo_url"], "child_id": row["id"]}, 201)

    cur.execute(
        f"INSERT INTO {SCHEMA}.patient_documents (patient_id, file_name, file_url, file_type, file_size) VALUES (%s,%s,%s,%s,%s) RETURNING *",
        (patient_id, file_name, cdn_url, file_type, len(raw))
    )
    doc = cur.fetchone()
    conn.commit()

    return ok({"document": dict(doc)}, 201)