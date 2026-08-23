import difflib
import json
import os
import re
from datetime import date

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Max-Bot-Api-Secret",
}

# Локальные словари тональности. Негативные триггеры проверяются первыми (приоритет безопасности).
POSITIVE_WORDS = ["молодец", "хорошо", "зашла", "ровная", "справилась", "движении"]
NEUTRAL_WORDS = ["нормальное", "более менее", "устала", "прежней"]
NEGATIVE_WORDS = ["потухла", "вымоталась", "тяжко", "неохотой", "недовольство", "неуверенности"]

BLOCK_RE = re.compile(r"(\d+)\.\s*(.+?)(?=\n\s*\d+\.\s|\Z)", re.DOTALL)
NAME_RE = re.compile(r"^([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.?)?)\s+(.*)$", re.DOTALL)


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def send_message(chat_id: int, text: str, token: str):
    """Отправляет ответное сообщение в Max, авторизуясь токеном бота."""
    r = requests.post(
        f"{MAX_API_URL}/messages",
        params={"user_id": chat_id},
        headers={"Authorization": token},
        json={"text": text},
    )
    print(f"send_message chat_id={chat_id} status={r.status_code}")


def analyze_sentiment(text: str):
    """Локальный rule-based анализатор тональности по словарям. Возвращает overall_state (1-10) или None, если триггеры не найдены."""
    t = text.lower()
    for w in NEGATIVE_WORDS:
        if w in t:
            return 3
    for w in POSITIVE_WORDS:
        if w in t:
            return 8
    for w in NEUTRAL_WORDS:
        if w in t:
            return 6
    return None


def parse_shift_report(text: str):
    """Разбирает текст отчёта смены на вступительную сводку (всё до "1. ") и пронумерованные блоки по пациентам."""
    intro = ""
    body_text = text

    m = re.search(r"(?m)^\s*1\.\s", text)
    if m:
        intro = text[:m.start()].strip()
        body_text = text[m.start():]
    elif text.strip().startswith("День"):
        intro = text.strip()
        body_text = ""

    blocks = []
    for match in BLOCK_RE.finditer(body_text):
        chunk = match.group(2).strip()
        if not chunk:
            continue
        name_match = NAME_RE.match(chunk)
        if name_match:
            name = name_match.group(1).strip()
            report_text = name_match.group(2).strip()
        else:
            parts = chunk.split(maxsplit=1)
            name = parts[0] if parts else ""
            report_text = parts[1] if len(parts) > 1 else ""
        if name:
            blocks.append({"name": name, "text": report_text})

    return intro, blocks


def normalize_name(s: str) -> str:
    return re.sub(r"[.\s]+", " ", (s or "").strip().lower()).strip()


def match_patient(name: str, patients: list):
    """Fuzzy-сопоставление распознанного имени с пациентом: по alias или связке first_name + первая буква last_name."""
    n = normalize_name(name)
    if not n:
        return None

    candidates = {}
    for p in patients:
        alias_n = normalize_name(p.get("alias") or "")
        if alias_n:
            candidates[alias_n] = p
        first = (p.get("first_name") or "").strip()
        last_initial = (p.get("last_name") or "")[:1].strip()
        if first and last_initial:
            candidates[normalize_name(f"{first} {last_initial}")] = p

    if n in candidates:
        return candidates[n]

    close = difflib.get_close_matches(n, list(candidates.keys()), n=1, cutoff=0.72)
    if close:
        return candidates[close[0]]
    return None


def handler(event: dict, context) -> dict:
    """Webhook-эндпоинт для приёма ежедневных отчётов смены из бота Max. Проверяет секрет вебхука (заголовок X-Max-Bot-Api-Secret),
    парсит текст отчёта (rule-based NLP), сопоставляет пациентов по alias/ФИО и сохраняет оценку состояния + сводку смены."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = os.environ.get("MAX_SHIFT_REPORT_BOT_TOKEN", "")

    headers = event.get("headers") or {}
    headers_lower = {k.lower(): v for k, v in headers.items()}
    incoming_secret = headers_lower.get("x-max-bot-api-secret", "")

    body = json.loads(event.get("body") or "{}")
    if not incoming_secret:
        incoming_secret = body.get("secret", "")

    # Подлинность вебхука: секрет, переданный при регистрации подписки (POST /subscriptions),
    # Max присылает в заголовке X-Max-Bot-Api-Secret каждого запроса. Сверяем с MAX_BOT_TOKEN.
    if not token or incoming_secret != token:
        return err("Недействительный секретный токен вебхука", 401)

    update_type = body.get("update_type", "")
    msg = body.get("message") or {}
    sender = msg.get("sender") or {}
    user_id = sender.get("user_id") or (body.get("user") or {}).get("user_id")
    text = (msg.get("body") or {}).get("text") or ""

    print(f"incoming update_type={update_type} user_id={user_id} text_len={len(text)}")

    if update_type != "message_created" or not user_id or not text.strip():
        return ok({"ok": True})

    chat_id = int(user_id)
    intro, blocks = parse_shift_report(text)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    today = date.today().isoformat()

    if intro:
        cur.execute(
            f"INSERT INTO {SCHEMA}.shift_logs (report_date, log_text) VALUES (%s, %s)",
            (today, intro),
        )

    if not blocks:
        conn.commit()
        conn.close()
        send_message(chat_id, "⚠️ Не удалось распознать пациентов в отчёте. Формат: 1. Имя Ф. текст отчёта", token)
        return ok({"ok": True, "recognized": 0})

    cur.execute(f"SELECT id, first_name, last_name, alias FROM {SCHEMA}.patients WHERE discharge_date IS NULL")
    patients = [dict(r) for r in cur.fetchall()]

    recognized = 0
    unmatched = []

    for block in blocks:
        patient = match_patient(block["name"], patients)
        if not patient:
            unmatched.append(block["name"])
            continue

        overall_state = analyze_sentiment(block["text"])

        cur.execute(
            f"""INSERT INTO {SCHEMA}.patient_daily_reports (patient_id, author, report_date, overall_state, problems_identified)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (patient_id, report_date, author) DO UPDATE SET
                    overall_state = EXCLUDED.overall_state,
                    problems_identified = EXCLUDED.problems_identified""",
            (patient["id"], "Max-бот (смена)", today, overall_state, block["text"]),
        )
        recognized += 1

    conn.commit()
    conn.close()

    reply = f"✅ Отчёт принят. Распознано пациентов: {recognized}."
    if unmatched:
        reply += "\n⚠️ Не распознаны: " + ", ".join(unmatched)

    send_message(chat_id, reply, token)

    return ok({"ok": True, "recognized": recognized, "unmatched": unmatched})