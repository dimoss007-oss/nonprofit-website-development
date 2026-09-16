import json
import os
import re
import time
import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

# Безопасный бюджет времени на один вызов функции (сек). Оставляет запас под пользовательский
# таймаут облачной функции (рекомендовано выставить 60 сек в настройках функции), чтобы платформа
# не обрывала выполнение с ошибкой 504 независимо от того, сколько резидентов накопилось в базе.
TIME_BUDGET_SECONDS = 45

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

YANDEX_RESPONSES_URL = "https://ai.api.cloud.yandex.net/v1/responses"
YANDEX_AGENT_ID = "fvti6fm1qmd437gba827"

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


def build_social_status_block(patient: dict) -> str:
    """Формирует текстовый блок с соц.статусом резидента (пособия, бытовые трудности, учёт в ПДН/СОП)
    для подмешивания в промпт Агента, чтобы ночная аналитика учитывала эти маркеры и стресс-факторы.
    Имена в этом блоке не встречаются, анонимизация не требуется."""
    parts = []
    if patient.get("benefits_status"):
        parts.append(f"Статус пособий: {patient['benefits_status']}")
    if patient.get("urgent_needs"):
        parts.append(f"Насущные бытовые трудности: {patient['urgent_needs']}")
        if patient.get("needs_resolution_stage"):
            parts.append(f"Стадия решения вопроса: {patient['needs_resolution_stage']}")
    if patient.get("is_pdn"):
        details = f" ({patient['pdn_details']})" if patient.get("pdn_details") else ""
        parts.append(f"Состоит на учёте в ПДН{details}")
    if patient.get("is_sop"):
        details = f" ({patient['sop_details']})" if patient.get("sop_details") else ""
        parts.append(f"Семья в социально опасном положении (СОП){details}")
    if not parts:
        return ""
    return "Социальный статус и потребности резидента:\n" + "\n".join(f"- {p}" for p in parts)


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
    """Запрос к Агенту Yandex AI Studio (Agent Atelier, с подключённой базой знаний RAG) через Responses API.
    Текст анонимизированного отчёта подставляется в переменную промпта {{report_text}} и одновременно
    передаётся как input, чтобы модель гарантированно его увидела. Инструкции берутся из настроек
    самого агента в Agent Atelier. Возвращает None при ошибке, чтобы не засорять историю сводок."""
    api_key = (os.environ.get("YANDEX_AGENT_API_KEY") or "").strip()
    if not api_key:
        print("YandexAgent cron: ключ не настроен")
        return None

    payload = {
        "prompt": {
            "id": YANDEX_AGENT_ID,
            "variables": {"report_text": prompt},
        },
        "input": prompt,
        "max_output_tokens": 2000,
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Api-Key {api_key}"}

    try:
        response = requests.post(YANDEX_RESPONSES_URL, headers=headers, json=payload, timeout=55)
        if not response.ok:
            print(f"YandexAgent HTTP {response.status_code}: {response.text[:500]}")
            return None
        data = response.json()
        text = data.get("output_text")
        if text:
            return text
        for item in data.get("output", []):
            for c in item.get("content", []):
                if c.get("text"):
                    return c["text"]
        return None
    except requests.exceptions.RequestException as e:
        print(f"YandexAgent error: {e}")
        return None


def handler(event: dict, context) -> dict:
    """Cron-функция: пакетно формирует свежую AI-сводку (YandexGPT Pro) по активным резидентам (без даты
    выписки) на основе отчётов дежурных за последние 3 дня и сохраняет в историю сводок пациента.
    Обрабатывает резидентов по одному, начиная с тех, у кого сводка самая старая (или отсутствует вовсе),
    и останавливается по бюджету времени TIME_BUDGET_SECONDS — а не по количеству пациентов. Это гарантирует,
    что вызов никогда не упрётся в таймаут облачной функции (504), сколько бы резидентов ни было в базе:
    при росте базы обработка просто равномерно распределится на несколько ночных прогонов подряд, каждый
    резидент рано или поздно получит свежую сводку."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    start_time = time.monotonic()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Резиденты без выписки, упорядоченные так, чтобы в первую очередь обрабатывались те, у кого
    # свежей сводки ещё не было вовсе (NULL — раньше всех), а затем те, у кого она самая старая.
    # Так при нехватке бюджета времени за одну ночь никто не остаётся забытым надолго.
    cur.execute(f"""
        SELECT p.*, (
            SELECT MAX(s.created_at) FROM {SCHEMA}.patient_ai_summaries s
            WHERE s.patient_id = p.id AND s.source = 'yandex_gpt'
        ) AS last_summary_at
        FROM {SCHEMA}.patients p
        WHERE p.discharge_date IS NULL
        ORDER BY last_summary_at ASC NULLS FIRST, p.id ASC
    """)
    patients = cur.fetchall()

    system_prompt = get_system_prompt(cur, SCHEMA)

    # Часть текста дежурного бот Max не смог привязать к конкретному пациенту по имени (общие
    # события смены) — он лежит отдельно в shift_logs.log_text. Загружаем один раз на весь прогон
    # (период одинаков для всех пациентов) и подмешиваем каждому как общий контекст смены.
    cur.execute(
        f"""SELECT report_date, log_text FROM {SCHEMA}.shift_logs
            WHERE report_date >= CURRENT_DATE - %s::interval AND log_text IS NOT NULL AND log_text != ''
            ORDER BY report_date ASC""",
        (f"{DAYS_WINDOW} days",),
    )
    shift_logs = [dict(r) for r in cur.fetchall()]

    generated = 0
    skipped = 0
    errors = 0
    processed = 0
    stopped_by_budget = False

    for patient in patients:
        # Бюджет времени проверяем ПЕРЕД обработкой следующего резидента (а не после), чтобы не начать
        # вызов Агента, для завершения которого может не хватить оставшегося времени функции.
        if time.monotonic() - start_time > TIME_BUDGET_SECONDS:
            stopped_by_budget = True
            break

        patient = dict(patient)
        pid = patient["id"]
        processed += 1

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

        if not reports and not shift_logs:
            skipped += 1
            continue

        lines = []
        for r in reports:
            parts = [p for p in (r.get("problems_identified"), r.get("actions_taken"), r.get("results"), r.get("notes")) if p]
            if parts:
                lines.append(f"{r['report_date']}: " + " ".join(parts))

        for s in shift_logs:
            lines.append(f"{s['report_date']} (общая сводка смены): {s['log_text']}")

        if not lines:
            skipped += 1
            continue

        raw_text = "\n".join(lines)
        anonymized_text = anonymize_names(raw_text, patient, children)

        social_block = build_social_status_block(patient)
        if social_block:
            anonymized_text = f"{social_block}\n\n{anonymized_text}"

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

    return ok({
        "total_active": len(patients),
        "processed": processed,
        "generated": generated,
        "skipped_no_reports": skipped,
        "errors": errors,
        "remaining": max(0, len(patients) - processed),
        "stopped_by_time_budget": stopped_by_budget,
    })