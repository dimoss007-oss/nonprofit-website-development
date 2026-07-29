import json
import os
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-User-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def ask_gemini(prompt: str) -> str:
    api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not api_key:
        return "ИИ временно недоступен: не настроен ключ Gemini."
    system_prompt = "Ты — ассистент кризисного центра «Спасение надежды». Помогаешь составлять отчёты и отвечаешь на вопросы сотрудников о резидентах кратко и по делу, на русском языке."
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{GEMINI_URL}?key={api_key}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        body_text = ""
        try:
            body_text = e.read().decode("utf-8")[:300]
        except Exception:
            pass
        print(f"Gemini HTTPError {e.code}: {body_text}")
        if e.code == 429:
            return f"ИИ недоступен: превышен лимит запросов Gemini (429). Ответ сервиса: {body_text or 'нет деталей'}"
        if e.code in (401, 403):
            return f"ИИ недоступен: неверный API-ключ Gemini ({e.code}). Ответ сервиса: {body_text or 'нет деталей'}"
        return f"Ошибка обращения к ИИ: {e.code}. {body_text}"
    except Exception as e:
        print(f"Gemini error: {e}")
        return f"Ошибка обращения к ИИ: {e}"


def handler(event: dict, context) -> dict:
    """Чат отчётов/задач с привязкой к пациенту (тег) и AI-ответами Gemini. GET /?tag=&type=&limit=&offset= — лента, POST / — новое сообщение (опционально use_ai=true для ответа ИИ)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == "GET":
        limit = int(params.get("limit", 50))
        offset = int(params.get("offset", 0))
        msg_type = params.get("type")
        tag = params.get("tag")

        conditions = []
        values = []
        if msg_type:
            conditions.append("type = %s")
            values.append(msg_type)
        if tag:
            conditions.append("tags @> %s::jsonb")
            values.append(json.dumps([tag]))

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        values.extend([limit, offset])
        cur.execute(
            f"SELECT * FROM {SCHEMA}.chat_messages {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            values,
        )
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"messages": list(reversed(rows))})

    body = json.loads(event.get("body") or "{}")

    if method == "POST":
        content = (body.get("content") or "").strip()
        if not content:
            conn.close()
            return err("Текст сообщения обязателен")

        msg_type = body.get("type") or "post"
        if msg_type not in ("post", "report", "task", "note", "ai"):
            msg_type = "post"
        author = body.get("author") or "Сотрудник"
        author_id = body.get("author_id")
        media = body.get("media") or []
        tags = body.get("tags") or []
        mentions = body.get("mentions") or []
        use_ai = bool(body.get("use_ai"))

        cur.execute(
            f"""INSERT INTO {SCHEMA}.chat_messages (type, author, author_id, content, media, tags, mentions)
                VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (msg_type, author, author_id, content, json.dumps(media), json.dumps(tags), json.dumps(mentions)),
        )
        user_message = dict(cur.fetchone())
        conn.commit()

        ai_message = None
        if use_ai:
            answer = ask_gemini(content)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.chat_messages (type, author, author_id, content, media, tags, mentions)
                    VALUES ('ai','Gemini AI',NULL,%s,%s,%s,%s) RETURNING *""",
                (answer, json.dumps([]), json.dumps(tags), json.dumps([])),
            )
            ai_message = dict(cur.fetchone())
            conn.commit()

        conn.close()
        result = {"message": user_message}
        if ai_message:
            result["ai_message"] = ai_message
        return ok(result, 201)

    conn.close()
    return err("Метод не поддерживается", 405)