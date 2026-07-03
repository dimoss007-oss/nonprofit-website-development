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

def notify_user_status(login: str, task: dict, status_label: str, is_co: bool = False):
    chat_id = get_max_chat_id(login)
    if not chat_id:
        return
    title = task.get("title", "")
    icon = {"Новая": "🔄", "В работе": "⚙️", "Выполнена": "✅"}.get(status_label, "📋")
    role = " (соисполнитель)" if is_co else ""
    text = f"{icon} Статус задачи изменён{role}\n\n«{title}»\nНовый статус: {status_label}"
    send_max_notification(chat_id, text)

def notify_assignee_status(task: dict, status_label: str):
    assignee_login = task.get("assignee_login")
    co_assignee_login = task.get("co_assignee_login")
    if assignee_login:
        notify_user_status(assignee_login, task, status_label, is_co=False)
    if co_assignee_login and co_assignee_login != assignee_login:
        notify_user_status(co_assignee_login, task, status_label, is_co=True)

def notify_user(login: str, task: dict, event_type: str, is_co: bool = False):
    chat_id = get_max_chat_id(login)
    if not chat_id:
        return

    title = task.get("title", "")
    priority = PRIORITY_RU.get(task.get("priority", "medium"), "Средний")
    deadline = task.get("deadline")
    created_by = task.get("created_by") or "Администратор"
    deadline_str = f"\n📅 Дедлайн: {deadline}" if deadline else ""
    role = " (соисполнитель)" if is_co else ""

    if event_type == "assigned":
        text = (
            f"📋 Вам назначена новая задача{role}\n\n"
            f"«{title}»\n"
            f"🔺 Приоритет: {priority}{deadline_str}\n"
            f"👤 Назначил: {created_by}"
        )
    elif event_type == "updated":
        text = (
            f"✏️ Задача обновлена{role}\n\n"
            f"«{title}»\n"
            f"🔺 Приоритет: {priority}{deadline_str}"
        )
    else:
        return

    send_max_notification(chat_id, text)

def notify_assignee(task: dict, event_type: str = "assigned"):
    assignee_login = task.get("assignee_login")
    co_assignee_login = task.get("co_assignee_login")
    if assignee_login:
        notify_user(assignee_login, task, event_type, is_co=False)
    if co_assignee_login and co_assignee_login != assignee_login:
        notify_user(co_assignee_login, task, event_type, is_co=True)

def handler(event: dict, context) -> dict:
    """CRUD задач: соисполнитель, дата начала, фильтр видимости по роли."""
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
        login_filter = params.get("login")
        is_admin = params.get("is_admin", "0") == "1"

        ORDER = "ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC NULLS LAST, created_at DESC"
        ORDER_ALL = "ORDER BY CASE status WHEN 'new' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, deadline ASC NULLS LAST, created_at DESC"

        if login_filter and not is_admin:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.tasks WHERE (assignee_login = %s OR co_assignee_login = %s) {ORDER_ALL}",
                (login_filter, login_filter)
            )
        elif status_filter:
            cur.execute(f"SELECT * FROM {SCHEMA}.tasks WHERE status = %s {ORDER}", (status_filter,))
        elif assignee_filter:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.tasks WHERE assignee_login = %s OR co_assignee_login = %s {ORDER}",
                (assignee_filter, assignee_filter)
            )
        else:
            cur.execute(f"SELECT * FROM {SCHEMA}.tasks {ORDER_ALL}")

        tasks = [dict(t) for t in cur.fetchall()]
        conn.close()
        return ok({"tasks": tasks})

    if method == "POST":
        action = body.get("action", "create")

        if action == "create":
            title = body.get("title", "").strip()
            if not title:
                conn.close()
                return err("Название обязательно")
            reminder_frequency = body.get("reminder_frequency") or None
            if reminder_frequency not in (None, "daily", "weekly", "monthly"):
                reminder_frequency = None
            cur.execute(
                f"""INSERT INTO {SCHEMA}.tasks
                    (title, description, assignee_login, assignee_name,
                     co_assignee_login, co_assignee_name,
                     priority, status, start_date, deadline, created_by, reminder_frequency,
                     link_type, link_id)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,'new',%s,%s,%s,%s,%s,%s)
                    RETURNING *""",
                (title,
                 body.get("description") or None,
                 body.get("assignee_login") or None,
                 body.get("assignee_name") or None,
                 body.get("co_assignee_login") or None,
                 body.get("co_assignee_name") or None,
                 body.get("priority", "medium"),
                 body.get("start_date") or None,
                 body.get("deadline") or None,
                 body.get("created_by") or None,
                 reminder_frequency,
                 body.get("link_type") or None,
                 body.get("link_id") or None)
            )
            task = dict(cur.fetchone())
            conn.commit()
            conn.close()
            notify_assignee(task, "assigned")
            return ok({"task": task}, 201)

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

        if action == "update":
            task_id = body.get("task_id")
            cur.execute(f"SELECT assignee_login, co_assignee_login FROM {SCHEMA}.tasks WHERE id=%s", (task_id,))
            old = cur.fetchone()
            old_assignee = old["assignee_login"] if old else None
            old_co_assignee = old["co_assignee_login"] if old else None

            cur.execute(
                f"""UPDATE {SCHEMA}.tasks SET
                    title=%s, description=%s,
                    assignee_login=%s, assignee_name=%s,
                    co_assignee_login=%s, co_assignee_name=%s,
                    priority=%s, start_date=%s, deadline=%s,
                    updated_at=NOW()
                    WHERE id=%s RETURNING *""",
                (body.get("title"),
                 body.get("description") or None,
                 body.get("assignee_login") or None,
                 body.get("assignee_name") or None,
                 body.get("co_assignee_login") or None,
                 body.get("co_assignee_name") or None,
                 body.get("priority", "medium"),
                 body.get("start_date") or None,
                 body.get("deadline") or None,
                 task_id)
            )
            task = dict(cur.fetchone())
            conn.commit()
            conn.close()

            new_assignee = task.get("assignee_login")
            new_co_assignee = task.get("co_assignee_login")

            if new_assignee:
                event = "assigned" if new_assignee != old_assignee else "updated"
                notify_user(new_assignee, task, event, is_co=False)

            if new_co_assignee and new_co_assignee != new_assignee:
                event = "assigned" if new_co_assignee != old_co_assignee else "updated"
                notify_user(new_co_assignee, task, event, is_co=True)

            return ok({"task": task})

        if action == "delete":
            task_id = body.get("task_id")
            cur.execute(f"DELETE FROM {SCHEMA}.tasks WHERE id=%s", (task_id,))
            conn.commit()
            conn.close()
            return ok({"success": True})

    conn.close()
    return err("Метод не поддерживается", 405)