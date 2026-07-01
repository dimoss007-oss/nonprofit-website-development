import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

PRIORITY_RU = {"low": "Низкий", "medium": "Средний", "high": "Высокий"}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def get_max_chat_id(login: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT max_chat_id FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row and row[0] else None

def send_max_notification(chat_id: int, text: str):
    token = os.environ.get("MAX_TASKS_BOT_TOKEN", "")
    if not token or not chat_id:
        return
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

def notify_assignee_status(task: dict, status_label: str):
    assignee_login = task.get("assignee_login")
    if not assignee_login:
        return
    chat_id = get_max_chat_id(assignee_login)
    if not chat_id:
        return
    title = task.get("title", "")
    icon = {"Новая": "🔄", "В работе": "⚙️", "Выполнена": "✅"}.get(status_label, "📋")
    text = f"{icon} Статус задачи изменён\n\n«{title}»\nНовый статус: {status_label}"
    send_max_notification(chat_id, text)

def notify_assignee(task: dict, event_type: str = "assigned"):
    assignee_login = task.get("assignee_login")
    if not assignee_login:
        return
    chat_id = get_max_chat_id(assignee_login)
    if not chat_id:
        return

    title = task.get("title", "")
    priority = PRIORITY_RU.get(task.get("priority", "medium"), "Средний")
    deadline = task.get("deadline")
    created_by = task.get("created_by") or "Администратор"
    deadline_str = f"\n📅 Дедлайн: {deadline}" if deadline else ""

    if event_type == "assigned":
        text = (
            f"📋 Вам назначена новая задача\n\n"
            f"«{title}»\n"
            f"🔺 Приоритет: {priority}{deadline_str}\n"
            f"👤 Назначил: {created_by}"
        )
    elif event_type == "updated":
        text = (
            f"✏️ Задача обновлена\n\n"
            f"«{title}»\n"
            f"🔺 Приоритет: {priority}{deadline_str}"
        )
    else:
        return

    send_max_notification(chat_id, text)

def handler(event: dict, context) -> dict:
    """CRUD задач для админ-панели с уведомлениями в Max."""
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

    if method == "POST":
        action = body.get("action", "create")

        # Создать задачу
        if action == "create":
            title = body.get("title", "").strip()
            if not title:
                conn.close()
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
            notify_assignee(task, "assigned")
            return ok({"task": task}, 201)

        # Обновить статус
        if action == "update_status":
            task_id = body.get("task_id")
            status = body.get("status")
            if status not in ("new", "in_progress", "done"):
                conn.close()
                return err("Неверный статус")
            cur.execute(f"UPDATE {SCHEMA}.tasks SET status=%s, updated_at=NOW() WHERE id=%s RETURNING *", (status, task_id))
            task = dict(cur.fetchone())
            conn.commit()
            conn.close()
            status_label = {"new": "Новая", "in_progress": "В работе", "done": "Выполнена"}.get(status, status)
            notify_assignee_status(task, status_label)
            return ok({"task": task})

        # Обновить задачу
        if action == "update":
            task_id = body.get("task_id")
            cur.execute(f"SELECT assignee_login FROM {SCHEMA}.tasks WHERE id=%s", (task_id,))
            old = cur.fetchone()
            old_assignee = old["assignee_login"] if old else None

            cur.execute(
                f"""UPDATE {SCHEMA}.tasks SET title=%s, description=%s, assignee_login=%s, assignee_name=%s,
                    priority=%s, deadline=%s, updated_at=NOW() WHERE id=%s RETURNING *""",
                (body.get("title"), body.get("description") or None,
                 body.get("assignee_login") or None, body.get("assignee_name") or None,
                 body.get("priority", "medium"), body.get("deadline") or None, task_id)
            )
            task = dict(cur.fetchone())
            conn.commit()
            conn.close()

            new_assignee = task.get("assignee_login")
            if new_assignee and new_assignee != old_assignee:
                notify_assignee(task, "assigned")
            elif new_assignee and new_assignee == old_assignee:
                notify_assignee(task, "updated")

            return ok({"task": task})

        # Удалить задачу
        if action == "delete":
            task_id = body.get("task_id")
            cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id=%s", (task_id,))
            conn.commit()
            conn.close()
            return ok({"success": True})

    conn.close()
    return err("Метод не поддерживается", 405)