import json
import os
import base64
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    """Файлы задач: загрузка в S3, список, удаление."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    # GET — список файлов задачи
    if method == "GET":
        task_id = params.get("task_id")
        if not task_id:
            return err("task_id обязателен")
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            f"SELECT id, task_id, filename, url, size, uploaded_by, created_at FROM {SCHEMA}.task_files WHERE task_id=%s AND archived=false ORDER BY created_at DESC",
            (int(task_id),)
        )
        files = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"files": files})

    # POST — загрузка файла (base64)
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "upload")

        if action == "upload":
            task_id = body.get("task_id")
            filename = body.get("filename", "file")
            content_type = body.get("content_type", "application/octet-stream")
            data_b64 = body.get("data")
            uploaded_by = body.get("uploaded_by") or None

            if not task_id or not data_b64:
                return err("task_id и data обязательны")

            file_data = base64.b64decode(data_b64)
            file_size = len(file_data)

            import re, uuid
            safe_name = re.sub(r"[^\w.\-]", "_", filename)
            key = f"task-files/{task_id}/{uuid.uuid4().hex[:8]}_{safe_name}"

            s3().put_object(
                Bucket="files",
                Key=key,
                Body=file_data,
                ContentType=content_type,
            )

            url = cdn_url(key)

            conn = get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                f"INSERT INTO {SCHEMA}.task_files (task_id, filename, url, size, uploaded_by) VALUES (%s,%s,%s,%s,%s) RETURNING *",
                (int(task_id), filename, url, file_size, uploaded_by)
            )
            file_row = dict(cur.fetchone())
            conn.commit()
            conn.close()
            return ok({"file": file_row})

        if action == "delete":
            file_id = body.get("file_id")
            if not file_id:
                return err("file_id обязателен")
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.task_files SET archived=true WHERE id=%s", (int(file_id),))
            conn.commit()
            conn.close()
            return ok({"ok": True})

    return err("Метод не поддерживается", 405)
