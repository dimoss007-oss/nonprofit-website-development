import json
import os
import re
import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

YANDEX_SYSTEM_PROMPT = (
    "Ты — опытный клинический психолог в реабилитационном центре АНО «Спасение надежды». "
    "Твоя задача: проанализировать ежедневный отчёт дежурного о поведении резидента. "
    "Выдели скрытые паттерны поведения, признаки надвигающегося кризиса, эмоциональные качели или, "
    "наоборот, позитивную динамику. Не ставь медицинских диагнозов. Сформируй краткую аналитическую "
    "сводку строго в 3–4 предложениях. Используй Markdown для выделения ключевых тезисов."
)

DAYS_WINDOW = 3


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def anonymize_names(text: str, patient: dict, children: list) -> str:
    """Вырезает из текста реальные ФИО пациента и его детей перед отправкой во внешний API,
    заменяя их на нейтральный шаблон [Резидент], чтобы персональные данные не покидали контур."""
    if not text:
        return text

    result = text
    names = set()

    for field in ("first_name", "last_name", "middle_name", "alias"):
        v = (patient or {}).get(field)
        if v and len(v.strip()) > 1:
            names.add(v.strip())

    for child in children or []:
        for field in ("first_name", "last_name", "middle_name"):
            v = child.get(field)
            if v and len(v.strip()) > 1:
                names.add(v.strip())

    for name in sorted(names, key=len, reverse=True):
        result = re.sub(re.escape(name), "[Резидент]", result, flags=re.IGNORECASE)

    result = re.sub(r"\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]*\.?", "[Резидент]", result)

    return result


def get_system_prompt(cur, schema: str) -> str:
    """Достаёт актуальный системный промпт для YandexGPT из настроек CRM (редактируется админом в UI).
    Если в БД пусто — используется промпт по умолчанию."""
    try:
        cur.execute(f"SELECT yandexgpt_system_prompt FROM {schema}.crm_settings WHERE id = 1")
        row = cur.fetchone()
        if row:
            value = row["yandexgpt_system_prompt"] if isinstance(row, dict) else row[0]
            if value and value.strip():
                return value.strip()
    except Exception as e:
        print(f"get_system_prompt error: {e}")
    return YANDEX_SYSTEM_PROMPT


def ask_yandex_gpt(prompt: str, system_prompt: str = YANDEX_SYSTEM_PROMPT) -> str | None:
    """Запрос к YandexGPT Pro для генерации аналитической сводки по анонимизированному тексту.
    Возвращает None при ошибке, чтобы не засорять историю сводок текстами с ошибками."""
    folder_id = (os.environ.get("YANDEX_FOLDER_ID") or "").strip()
    api_key = (os.environ.get("YANDEX_API_KEY") or "").strip()
    if not folder_id or not api_key:
        print("YandexGPT cron: ключи не настроены")
        return None

    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.3, "maxTokens": 250},
        "messages": [
            {"role": "system", "text": system_prompt},
            {"role": "user", "text": prompt},
        ],
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Api-Key {api_key}"}

    try:
        response = requests.post(YANDEX_GPT_URL, headers=headers, json=payload, timeout=25)
        if not response.ok:
            print(f"YandexGPT HTTP {response.status_code}: {response.text[:500]}")
            return None
        return response.json()["result"]["alternatives"][0]["message"]["text"]
    except requests.exceptions.RequestException as e:
        print(f"YandexGPT error: {e}")
        return None


def handler(event: dict, context) -> dict:
    """Cron-функция: каждую ночь формирует свежую AI-сводку (YandexGPT Pro) по всем активным резидентам
    (без даты выписки) на основе отчётов дежурных за последние 3 дня и сохраняет в историю сводок пациента."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"SELECT * FROM {SCHEMA}.patients WHERE discharge_date IS NULL ORDER BY id")
    patients = cur.fetchall()

    system_prompt = get_system_prompt(cur, SCHEMA)

    generated = 0
    skipped = 0
    errors = 0

    for patient in patients:
        patient = dict(patient)
        pid = patient["id"]

        cur.execute(f"SELECT * FROM {SCHEMA}.patient_children WHERE patient_id = %s", (pid,))
        children = [dict(c) for c in cur.fetchall()]

        cur.execute(
            f"""SELECT report_date, problems_identified, actions_taken, results, notes
                FROM {SCHEMA}.patient_daily_reports
                WHERE patient_id = %s AND report_date >= CURRENT_DATE - %s::interval
                ORDER BY report_date ASC""",
            (pid, f"{DAYS_WINDOW} days"),
        )
        reports = [dict(r) for r in cur.fetchall()]

        if not reports:
            skipped += 1
            continue

        lines = []
        for r in reports:
            parts = [p for p in (r.get("problems_identified"), r.get("actions_taken"), r.get("results"), r.get("notes")) if p]
            if parts:
                lines.append(f"{r['report_date']}: " + " ".join(parts))

        if not lines:
            skipped += 1
            continue

        raw_text = "\n".join(lines)
        anonymized_text = anonymize_names(raw_text, patient, children)

        summary_text = ask_yandex_gpt(anonymized_text, system_prompt)
        if not summary_text:
            errors += 1
            continue

        cur.execute(
            f"INSERT INTO {SCHEMA}.patient_ai_summaries (patient_id, summary_text, source) VALUES (%s, %s, 'yandex_gpt')",
            (pid, summary_text),
        )
        conn.commit()
        generated += 1

    conn.close()

    return ok({"total_active": len(patients), "generated": generated, "skipped_no_reports": skipped, "errors": errors})