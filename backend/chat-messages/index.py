import json
import os
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"

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


def ask_deepseek(prompt: str) -> str:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return "ИИ временно недоступен: не настроен ключ DeepSeek."
    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Ты — ассистент кризисного центра «Спасение надежды». Помогаешь составлять отчёты и отвечаешь на вопросы сотрудников о резидентах кратко и по делу, на русском языке."},
            {"role": "user", "content": prompt},
        ],
    }).encode("utf-8")
    req = urllib.request.Request(
        DEEPSEEK_URL,
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        if e.code == 402:
            return "ИИ недоступен: на балансе DeepSeek закончились средства. Пополните баланс в личном кабинете platform.deepseek.com."
        if e.code == 401:
            return "ИИ недоступен: неверный API-ключ DeepSeek. Проверьте ключ в настройках проекта."
        return f"Ошибка обращения к ИИ: {e.code}"
    except Exception as e:
        return f"Ошибка обращения к ИИ: {e}"


def handler(event: dict, context) -> dict:
    """Чат отчётов/задач с привязкой к пациенту (тег) и AI-ответами DeepSeek. GET /?tag=&type=&limit=&offset= — лента, POST / — новое сообщение (опционально use_ai=true для ответа ИИ)."""
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
            answer = ask_deepseek(content)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.chat_messages (type, author, author_id, content, media, tags, mentions)
                    VALUES ('ai','DeepSeek AI',NULL,%s,%s,%s,%s) RETURNING *""",
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