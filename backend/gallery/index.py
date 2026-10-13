"""
Галерея фотографий — получение, добавление, удаление и сортировка фото.
GET  / — список всех фото
POST / — добавить фото (base64)
DELETE /?id=N — удалить фото
PUT  / — обновить порядок фото (body: {order: [id1, id2, ...]})
PUT  / — изменить метки (body: {ids: [..], tags: [..], mode: "add"|"remove"|"set"})
GET  /?tag=donate — только фото с указанной меткой
"""
import json
import os
import uuid
import base64
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def clean_tags(raw) -> list:
    result = []
    for t in raw or []:
        t = str(t).strip().lower().lstrip("#")[:30]
        if t and t not in result:
            result.append(t)
    return result[:20]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        conn = get_db()
        cur = conn.cursor()
        tag = ((event.get("queryStringParameters") or {}).get("tag") or "").strip().lower()
        if tag:
            cur.execute(
                "SELECT id, title, photo_url, sort_order, created_at, tags FROM gallery WHERE %s = ANY(tags) ORDER BY sort_order ASC, created_at DESC",
                (tag,),
            )
        else:
            cur.execute("SELECT id, title, photo_url, sort_order, created_at, tags FROM gallery ORDER BY sort_order ASC, created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        photos = [
            {"id": r[0], "title": r[1], "photo_url": r[2], "sort_order": r[3], "created_at": r[4].isoformat(), "tags": list(r[5] or [])}
            for r in rows
        ]
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"photos": photos}),
            "isBase64Encoded": False,
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        photo_b64 = body.get("photo", "")
        title = body.get("title", "")
        tags = clean_tags(body.get("tags"))

        ext = "jpg"
        data_str = photo_b64
        if "," in photo_b64:
            header, data_str = photo_b64.split(",", 1)
            if "png" in header:
                ext = "png"
            elif "webp" in header:
                ext = "webp"

        img_bytes = base64.b64decode(data_str)
        key_id = os.environ["AWS_ACCESS_KEY_ID"]
        filename = f"gallery/{uuid.uuid4()}.{ext}"

        s3 = get_s3()
        s3.put_object(Bucket="files", Key=filename, Body=img_bytes, ContentType=f"image/{ext}")
        photo_url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{filename}"

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO gallery (title, photo_url, tags) VALUES (%s, %s, %s) RETURNING id",
            (title, photo_url, tags),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"id": new_id, "photo_url": photo_url}),
            "isBase64Encoded": False,
        }

    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        photo_id = int(params.get("id", 0))
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM gallery WHERE id = %s", (photo_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True}),
            "isBase64Encoded": False,
        }

    if method == "PUT":
        body = json.loads(event.get("body") or "{}")
        conn = get_db()
        cur = conn.cursor()
        if "ids" in body:
            ids = [int(i) for i in body.get("ids", [])]
            tags = clean_tags(body.get("tags"))
            mode = body.get("mode", "set")
            if mode == "add":
                cur.execute("UPDATE gallery SET tags = (SELECT ARRAY(SELECT DISTINCT unnest(tags || %s::text[]))) WHERE id = ANY(%s)", (tags, ids))
            elif mode == "remove":
                cur.execute("UPDATE gallery SET tags = (SELECT COALESCE(array_agg(t), '{}') FROM unnest(tags) t WHERE NOT t = ANY(%s::text[])) WHERE id = ANY(%s)", (tags, ids))
            else:
                cur.execute("UPDATE gallery SET tags = %s WHERE id = ANY(%s)", (tags, ids))
            conn.commit()
            cur.close()
            conn.close()
            return {
                "statusCode": 200,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True}),
                "isBase64Encoded": False,
            }
        order = body.get("order", [])
        for idx, photo_id in enumerate(order):
            cur.execute("UPDATE gallery SET sort_order = %s WHERE id = %s", (idx, photo_id))
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True}),
            "isBase64Encoded": False,
        }

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed", "isBase64Encoded": False}