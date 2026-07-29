import json
import os
from datetime import datetime, timezone

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

ALLOWED_TYPES = ("report", "task", "note")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def ask_gemini(resident_id: str, content: str) -> str:
    api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not api_key:
        return "ИИ временно недоступен: не настроен ключ Gemini."

    prompt = (
        f"Ты — эксперт-психолог и методолог реабилитационного центра. "
        f"Проанализируй отчёт по резиденту: {resident_id}, выдели маркеры динамики и риски. "
        f"Отчёт: {content}"
    )
    payload = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    })

    try:
        resp = requests.post(
            f"{GEMINI_URL}?key={api_key}",
            data=payload,
            headers={"Content-Type": "application/json"},
            timeout=25,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.HTTPError as e:
        body_text = (e.response.text or "")[:300] if e.response is not None else ""
        code = e.response.status_code if e.response is not None else 0
        print(f"Gemini HTTPError {code}: {body_text}")
        if code == 429:
            return f"ИИ недоступен: превышен лимит запросов Gemini (429). Ответ сервиса: {body_text or 'нет деталей'}"
        if code in (401, 403):
            return f"ИИ недоступен: неверный API-ключ Gemini ({code}). Ответ сервиса: {body_text or 'нет деталей'}"
        return f"Ошибка обращения к ИИ: {code}. {body_text}"
    except Exception as e:
        print(f"Gemini error: {e}")
        return f"Ошибка обращения к ИИ: {e}"


def send_sheet_backup(record: dict):
    webhook_url = (os.environ.get("GOOGLE_SHEET_WEBHOOK_URL") or "").strip()
    if not webhook_url:
        print("GOOGLE_SHEET_WEBHOOK_URL не настроен, бэкап пропущен")
        return
    try:
        requests.post(webhook_url, json=record, timeout=8)
    except Exception as e:
        print(f"Ошибка отправки бэкапа в Google Таблицу: {e}")


def route_messages(event: dict) -> dict:
    """POST /api/bot/messages — приём отчёта от бота, анализ Gemini, сохранение и бэкап."""
    body = json.loads(event.get("body") or "{}")

    author = (body.get("author") or "").strip()
    resident_id = str(body.get("resident_id") or "").strip()
    msg_type = (body.get("type") or "report").strip()
    content = (body.get("content") or "").strip()

    if not author or not resident_id or not content:
        return err("Поля author, resident_id и content обязательны")
    if msg_type not in ALLOWED_TYPES:
        msg_type = "report"

    ai_analysis = ask_gemini(resident_id, content)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"""INSERT INTO {SCHEMA}.chat_messages (type, author, content, resident_key, tags)
            VALUES (%s,%s,%s,%s,%s) RETURNING *""",
        (msg_type, author, content, resident_id, json.dumps([f"resident-{resident_id}"])),
    )
    user_message = dict(cur.fetchone())

    cur.execute(
        f"""INSERT INTO {SCHEMA}.chat_messages (type, author, content, resident_key, tags)
            VALUES ('ai','Gemini AI',%s,%s,%s) RETURNING *""",
        (ai_analysis, resident_id, json.dumps([f"resident-{resident_id}"])),
    )
    ai_message = dict(cur.fetchone())
    conn.commit()
    conn.close()

    send_sheet_backup({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "author": author,
        "resident_id": resident_id,
        "type": msg_type,
        "content": content,
        "ai_analysis": ai_analysis,
    })

    return ok({"ai_analysis": ai_analysis, "message": user_message, "ai_message": ai_message}, 201)


def route_history(event: dict, resident_id: str) -> dict:
    """GET /api/bot/history/{resident_id} — последние записи по резиденту."""
    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 10)), 50)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"""SELECT * FROM {SCHEMA}.chat_messages
            WHERE resident_key = %s
            ORDER BY created_at DESC LIMIT %s""",
        (resident_id, limit),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"resident_id": resident_id, "history": list(reversed(rows))})


def handler(event: dict, context) -> dict:
    """Хаб бота: POST ?route=messages — приём отчёта, анализ Gemini, сохранение и бэкап в Google Таблицу;
    GET ?route=history&resident_id=... — история последних записей по резиденту."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    route = params.get("route", "")

    if method == "POST" and route in ("", "messages"):
        return route_messages(event)

    if method == "GET" and route == "history":
        resident_id = (params.get("resident_id") or "").strip()
        if not resident_id:
            return err("Параметр resident_id обязателен")
        return route_history(event, resident_id)

    return err("Неизвестный маршрут. Используйте POST ?route=messages или GET ?route=history&resident_id=...", 404)
