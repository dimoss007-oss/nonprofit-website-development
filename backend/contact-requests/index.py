import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    """Список заявок с сайта для админ-панели."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Список заявок
    if method == "GET":
        status_filter = params.get("status")
        if status_filter:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.contact_requests WHERE status = %s ORDER BY created_at DESC",
                (status_filter,)
            )
        else:
            cur.execute(f"SELECT * FROM {SCHEMA}.contact_requests ORDER BY created_at DESC")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"requests": rows})

    # Обновить статус
    if method == "POST":
        action = body.get("action")

        if action == "update_status":
            req_id = body.get("id")
            status = body.get("status")
            if status not in ("new", "in_progress", "done"):
                conn.close()
                return err("Неверный статус")
            cur.execute(
                f"UPDATE {SCHEMA}.contact_requests SET status=%s WHERE id=%s RETURNING *",
                (status, req_id)
            )
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"request": dict(row)})

        if action == "delete":
            req_id = body.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.contact_requests WHERE id=%s", (req_id,))
            conn.commit()
            conn.close()
            return ok({"success": True})

    conn.close()
    return err("Метод не поддерживается", 405)
