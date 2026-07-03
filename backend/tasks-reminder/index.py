import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from datetime import date, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

PRIORITY_RU = {"low": "Низкий", "medium": "Средний", "high": "Высокий"}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def send_max_notification(chat_id: int, text: str):
    token = os.environ.get("MAX_TASKS_BOT_TOKEN", "")
    if not token or not chat_id:
        return False
    try:
        r = requests.post(
            f"{MAX_API_URL}/messages",
            params={"user_id": chat_id},
            headers={"Authorization": token},
            json={"text": text},
            timeout=5,
        )
        return r.status_code == 200
    except Exception as e:
        print(f"Max notify error: {e}")
        return False

def should_remind(frequency: str, last_reminded_at, today: date) -> bool:
    if not last_reminded_at:
        return True
    last_date = last_reminded_at.date() if hasattr(last_reminded_at, "date") else last_reminded_at
    if frequency == "daily":
        return last_date < today
    if frequency == "weekly":
        return (today - last_date).days >= 7
    if frequency == "monthly":
        return (today - last_date).days >= 30
    return False

def handler(event: dict, context) -> dict:
    """Cron-функция: напоминания в Max о задачах с дедлайном завтра + повторяющиеся напоминания (daily/weekly/monthly)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    today = date.today()
    tomorrow = (today + timedelta(days=1)).isoformat()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        f"""SELECT t.id, t.title, t.priority, t.deadline, t.assignee_login, t.assignee_name,
                   u.max_chat_id
            FROM {SCHEMA}.tasks t
            JOIN {SCHEMA}.admin_users u ON u.login = t.assignee_login
            WHERE t.deadline::date = %s
              AND t.status != 'done'
              AND u.max_chat_id IS NOT NULL""",
        (tomorrow,)
    )
    tasks = cur.fetchall()

    sent = 0
    for t in tasks:
        priority = PRIORITY_RU.get(t["priority"], "Средний")
        text = (
            f"⏰ Напоминание о задаче\n\n"
            f"«{t['title']}»\n"
            f"📅 Дедлайн: завтра ({t['deadline'].strftime('%d.%m.%Y') if hasattr(t['deadline'], 'strftime') else t['deadline']})\n"
            f"🔺 Приоритет: {priority}"
        )
        if send_max_notification(t["max_chat_id"], text):
            sent += 1
            print(f"Reminded: {t['assignee_login']} about task {t['id']}")

    # Повторяющиеся напоминания (не привязаны к дедлайну)
    cur.execute(
        f"""SELECT t.id, t.title, t.priority, t.deadline, t.assignee_login, t.assignee_name,
                   t.reminder_frequency, t.last_reminded_at, u.max_chat_id
            FROM {SCHEMA}.tasks t
            JOIN {SCHEMA}.admin_users u ON u.login = t.assignee_login
            WHERE t.reminder_frequency IS NOT NULL
              AND t.status != 'done'
              AND u.max_chat_id IS NOT NULL"""
    )
    recurring = cur.fetchall()

    recurring_sent = 0
    for t in recurring:
        if not should_remind(t["reminder_frequency"], t["last_reminded_at"], today):
            continue
        priority = PRIORITY_RU.get(t["priority"], "Средний")
        freq_label = {"daily": "ежедневно", "weekly": "раз в неделю", "monthly": "раз в месяц"}.get(t["reminder_frequency"], "")
        deadline_str = ""
        if t["deadline"]:
            deadline_str = f"\n📅 Дедлайн: {t['deadline'].strftime('%d.%m.%Y') if hasattr(t['deadline'], 'strftime') else t['deadline']}"
        text = (
            f"🔁 Повторное напоминание ({freq_label})\n\n"
            f"«{t['title']}»{deadline_str}\n"
            f"🔺 Приоритет: {priority}"
        )
        if send_max_notification(t["max_chat_id"], text):
            recurring_sent += 1
            cur.execute(f"UPDATE {SCHEMA}.tasks SET last_reminded_at = NOW() WHERE id = %s", (t["id"],))
            conn.commit()
            print(f"Recurring reminded: {t['assignee_login']} about task {t['id']}")

    conn.close()

    return ok({"sent": sent, "total": len(tasks), "recurring_sent": recurring_sent, "recurring_total": len(recurring), "date": tomorrow})