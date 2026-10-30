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

    if method == "GET" and params.get("kind") == "my_feedback":
        login = (params.get("login") or "").strip()
        if not login:
            conn.close()
            return ok({"items": []})
        cur.execute(
            f"SELECT id, category, message, status, created_at, reply, replied_at, reply_seen FROM {SCHEMA}.crm_feedback WHERE author_login = %s ORDER BY created_at DESC LIMIT 30",
            (login,)
        )
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"items": rows})

    if method == "GET" and params.get("kind") == "feedback":
        cur.execute(f"SELECT id, author_name, category, message, status, created_at, reply, replied_at FROM {SCHEMA}.crm_feedback ORDER BY created_at DESC LIMIT 200")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"items": rows})

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

        if action == "feedback":
            message = (body.get("message") or "").strip()
            if not message:
                conn.close()
                return err("Введите сообщение")
            category = body.get("category") if body.get("category") in ("idea", "bug", "question") else "idea"
            name = (body.get("author_name") or "Сотрудник").strip()[:200]
            login = (body.get("author_login") or "").strip()[:100]
            cur.execute(
                f"INSERT INTO {SCHEMA}.crm_feedback (author_name, author_login, category, message) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, login, category, message[:5000])
            )
            new_id = cur.fetchone()["id"]
            conn.commit()
            conn.close()
            return ok({"ok": True, "id": new_id})

        if action == "feedback_reply":
            reply = (body.get("reply") or "").strip()[:1000]
            cur.execute(
                f"UPDATE {SCHEMA}.crm_feedback SET reply=%s, replied_at=CASE WHEN %s = '' THEN NULL ELSE NOW() END, reply_seen=FALSE WHERE id=%s",
                (reply or None, reply, body.get("id"))
            )
            conn.commit()
            conn.close()
            return ok({"ok": True})

        if action == "feedback_seen":
            login = (body.get("login") or "").strip()
            cur.execute(f"UPDATE {SCHEMA}.crm_feedback SET reply_seen=TRUE WHERE author_login=%s AND reply IS NOT NULL", (login,))
            conn.commit()
            conn.close()
            return ok({"ok": True})

        if action == "feedback_status":
            status = body.get("status")
            if status not in ("new", "done"):
                conn.close()
                return err("Неверный статус")
            cur.execute(f"UPDATE {SCHEMA}.crm_feedback SET status=%s WHERE id=%s", (status, body.get("id")))
            conn.commit()
            conn.close()
            return ok({"ok": True})

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
