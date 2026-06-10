import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    """CRUD задач для админ-панели."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Список задач
    if method == "GET":
        status_filter = params.get("status")
        assignee_filter = params.get("assignee")
        if status_filter:
            cur.execute(f"SELECT * FROM {SCHEMA}.tasks WHERE status = %s ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC NULLS LAST, created_at DESC", (status_filter,))
        elif assignee_filter:
            cur.execute(f"SELECT * FROM {SCHEMA}.tasks WHERE assignee_login = %s ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC NULLS LAST, created_at DESC", (assignee_filter,))
        else:
            cur.execute(f"SELECT * FROM {SCHEMA}.tasks ORDER BY CASE status WHEN 'new' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC NULLS LAST, created_at DESC")
        tasks = [dict(t) for t in cur.fetchall()]
        conn.close()
        return ok({"tasks": tasks})

    # Создать задачу
    if method == "POST":
        action = body.get("action", "create")

        if action == "create":
            title = body.get("title", "").strip()
            if not title:
                return err("Название обязательно")
            cur.execute(
                f"""INSERT INTO {SCHEMA}.tasks (title, description, assignee_login, assignee_name, priority, status, deadline, created_by)
                    VALUES (%s,%s,%s,%s,%s,'new',%s,%s)
                    RETURNING *""",
                (title, body.get("description") or None, body.get("assignee_login") or None,
                 body.get("assignee_name") or None, body.get("priority", "medium"),
                 body.get("deadline") or None, body.get("created_by") or None)
            )
            task = dict(cur.fetchone())
            conn.commit()
            conn.close()
            return ok({"task": task}, 201)

        if action == "update_status":
            task_id = body.get("task_id")
            status = body.get("status")
            if status not in ("new", "in_progress", "done"):
                return err("Неверный статус")
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status=%s, updated_at=NOW() WHERE id=%s RETURNING *", (status, task_id))
            task = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"task": dict(task)})

        if action == "update":
            task_id = body.get("task_id")
            cur.execute(
                f"""UPDATE {SCHEMA}.tasks SET title=%s, description=%s, assignee_login=%s, assignee_name=%s,
                    priority=%s, deadline=%s, updated_at=NOW() WHERE id=%s RETURNING *""",
                (body.get("title"), body.get("description") or None,
                 body.get("assignee_login") or None, body.get("assignee_name") or None,
                 body.get("priority", "medium"), body.get("deadline") or None, task_id)
            )
            task = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"task": dict(task)})

        if action == "delete":
            task_id = body.get("task_id")
            cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id=%s", (task_id,))
            conn.commit()
            conn.close()
            return ok({"success": True})

    conn.close()
    return err("Метод не поддерживается", 405)
