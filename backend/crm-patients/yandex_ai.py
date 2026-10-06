from docx import Document as DocxDocument
import io
import os
import re
import requests


YANDEX_RESPONSES_URL = "https://ai.api.cloud.yandex.net/v1/responses"


YANDEX_AGENT_ID = "fvti6fm1qmd437gba827"


YANDEX_SYSTEM_PROMPT = (
    "Ты — опытный клинический психолог в реабилитационном центре АНО «Спасение надежды». "
    "Твоя задача: проанализировать ежедневный отчёт дежурного о поведении резидента. "
    "Выдели скрытые паттерны поведения, признаки надвигающегося кризиса, эмоциональные качели или, "
    "наоборот, позитивную динамику. Не ставь медицинских диагнозов. Сформируй краткую аналитическую "
    "сводку строго в 3–4 предложениях. Используй Markdown для выделения ключевых тезисов."
)


def build_social_status_block(patient: dict) -> str:
    """Формирует текстовый блок с соц.статусом резидента (пособия, бытовые трудности, учёт в ПДН/СОП)
    для подмешивания в промпт Агента, чтобы аналитика и характеристики учитывали эти маркеры и стресс-факторы.
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
    заменяя их на нейтральные шаблоны [Резидент] / [Ребёнок], чтобы персональные данные не покидали контур."""
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

    # Сортируем по убыванию длины, чтобы сначала заменялись полные ФИО, потом отдельные части
    for name in sorted(names, key=len, reverse=True):
        result = re.sub(re.escape(name), "[Резидент]", result, flags=re.IGNORECASE)

    # Дополнительно — общий шаблон "Имя Фамилия" / "Имя Ф." с заглавной буквы, на случай других лиц в тексте
    result = re.sub(r"\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]*\.?", "[Резидент]", result)

    return result


def get_system_prompt(cur, schema: str) -> str:
    """Достаёт актуальный системный промпт для YandexGPT из настроек CRM.
    Если в БД пусто (не настроено администратором) — используется промпт по умолчанию."""
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


def ask_yandex_gpt(prompt: str, system_prompt: str = YANDEX_SYSTEM_PROMPT) -> str:
    """Запрос к Агенту Yandex AI Studio (Agent Atelier, с подключённой базой знаний RAG) через Responses API.
    Текст анонимизированного отчёта подставляется в переменную промпта {{report_text}} и одновременно
    передаётся как input (реальное сообщение), чтобы модель гарантированно его увидела. Инструкции берутся
    из настроек самого агента в Agent Atelier — свой system_prompt поверх них не передаём."""
    api_key = (os.environ.get("YANDEX_AGENT_API_KEY") or "").strip()
    if not api_key:
        return "ИИ временно недоступен: не настроен ключ доступа к Агенту YandexGPT."

    payload = {
        "prompt": {
            "id": YANDEX_AGENT_ID,
            "variables": {"report_text": prompt},
        },
        "input": prompt,
        "max_output_tokens": 2000,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {api_key}",
    }

    try:
        response = requests.post(YANDEX_RESPONSES_URL, headers=headers, json=payload, timeout=55)
        if not response.ok:
            print(f"YandexAgent HTTP {response.status_code}: {response.text[:500]}")
            return f"Ошибка при обращении к Агенту YandexGPT ({response.status_code}): {response.text[:300]}"
        data = response.json()
        text = data.get("output_text")
        if text:
            return text
        for item in data.get("output", []):
            for c in item.get("content", []):
                if c.get("text"):
                    return c["text"]
        return "Агент не вернул текстовый ответ."
    except requests.exceptions.RequestException as e:
        print(f"YandexAgent error: {e}")
        return f"Ошибка при обращении к Агенту YandexGPT: {e}"


def generate_yandex_summary(cur, patient_id: int, schema: str, days: int) -> dict:
    """Формирует промпт из текстов ежедневных отчётов за период, анонимизирует ФИО и отправляет
    в YandexGPT Pro для генерации краткой аналитической сводки (3-4 предложения, Markdown)."""
    cur.execute(f"SELECT * FROM {schema}.patients WHERE id = %s", (patient_id,))
    patient = cur.fetchone()
    if not patient:
        return {"error": "Пациент не найден"}
    patient = dict(patient)

    cur.execute(f"SELECT * FROM {schema}.patient_children WHERE patient_id = %s", (patient_id,))
    children = [dict(c) for c in cur.fetchall()]

    cur.execute(
        f"""SELECT report_date, problems_identified, actions_taken, results, notes
            FROM {schema}.patient_daily_reports
            WHERE patient_id = %s AND report_date >= CURRENT_DATE - %s::interval
            ORDER BY report_date ASC""",
        (patient_id, f"{days} days"),
    )
    reports = [dict(r) for r in cur.fetchall()]

    # Часть текста дежурного бот Max не смог привязать к конкретному пациенту по имени (общие
    # события смены, групповые активности) — этот текст лежит отдельно в shift_logs.log_text.
    # Подмешиваем его как общий контекст смены за тот же период, он может содержать наблюдения,
    # которые распознавание не сумело сопоставить с этим пациентом по имени/алиасу.
    cur.execute(
        f"""SELECT report_date, log_text FROM {schema}.shift_logs
            WHERE report_date >= CURRENT_DATE - %s::interval AND log_text IS NOT NULL AND log_text != ''
            ORDER BY report_date ASC""",
        (f"{days} days",),
    )
    shift_logs = [dict(r) for r in cur.fetchall()]

    if not reports and not shift_logs:
        return {"summary_text": "Недостаточно данных за выбранный период для формирования аналитической сводки."}

    lines = []
    for r in reports:
        parts = [p for p in (r.get("problems_identified"), r.get("actions_taken"), r.get("results"), r.get("notes")) if p]
        if parts:
            lines.append(f"{r['report_date']}: " + " ".join(parts))

    for s in shift_logs:
        lines.append(f"{s['report_date']} (общая сводка смены): {s['log_text']}")

    raw_text = "\n".join(lines)
    if not raw_text.strip():
        return {"summary_text": "За выбранный период дежурные заполнили только числовые оценки, без текстовых заметок (проблемы/действия/результаты/заметки). Для анализа ИИ нужен хотя бы один текстовый комментарий в отчёте.", "days": days}

    anonymized_text = anonymize_names(raw_text, patient, children)

    social_block = build_social_status_block(patient)
    if social_block:
        anonymized_text = f"{social_block}\n\n{anonymized_text}"

    system_prompt = get_system_prompt(cur, schema)
    summary_text = ask_yandex_gpt(anonymized_text, system_prompt)
    return {"summary_text": summary_text, "days": days}


def generate_child_yandex_summary(cur, child_id: int, schema: str) -> dict:
    """Сводка по ребёнку через YandexGPT: ежедневные отчёты за 14 дней и еженедельные за 6 недель.
    Имена ребёнка и мамы вырезаются до отправки во внешний API."""
    cur.execute(f"SELECT * FROM {schema}.patient_children WHERE id = %s", (child_id,))
    child = cur.fetchone()
    if not child:
        return {"error": "Ребёнок не найден"}
    child = dict(child)

    cur.execute(f"SELECT * FROM {schema}.patients WHERE id = %s", (child["patient_id"],))
    mother = cur.fetchone()
    mother = dict(mother) if mother else {}

    cur.execute(
        f"""SELECT report_date, identified_problems, taken_actions, results
            FROM {schema}.child_daily_reports
            WHERE child_id = %s AND report_date >= CURRENT_DATE - INTERVAL '14 days'
            ORDER BY report_date ASC""",
        (child_id,),
    )
    daily = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"""SELECT week_start, report_text
            FROM {schema}.child_weekly_reports
            WHERE child_id = %s AND week_start >= CURRENT_DATE - INTERVAL '42 days'
            ORDER BY week_start ASC""",
        (child_id,),
    )
    weekly = [dict(r) for r in cur.fetchall()]

    lines = []
    for w in weekly:
        lines.append(f"Еженедельный отчёт, неделя с {fmt_ru_date(w['week_start'])}: {w['report_text']}")
    for r in daily:
        parts = [p for p in (r.get("identified_problems"), r.get("taken_actions"), r.get("results")) if p]
        if parts:
            lines.append(f"{fmt_ru_date(r['report_date'])}: " + " ".join(parts))

    if not lines:
        return {"summary_text": "Недостаточно текстовых данных для сводки: нет еженедельных отчётов за последние 6 недель и заполненных ежедневных отчётов за 14 дней."}

    raw_text = "Отчёты по ребёнку (не по взрослому резиденту).\n" + "\n".join(lines)

    for field in ("first_name", "last_name", "middle_name", "alias"):
        v = (child.get(field) or "").strip()
        if len(v) > 1:
            raw_text = re.sub(re.escape(v), "[Ребёнок]", raw_text, flags=re.IGNORECASE)
    anonymized_text = anonymize_names(raw_text, mother, [])

    summary_text = ask_yandex_gpt(anonymized_text, get_system_prompt(cur, schema))
    return {"summary_text": summary_text, "weekly_count": len(weekly), "daily_count": len(daily)}


def fmt_ru_date(d) -> str:
    if not d:
        return ""
    try:
        return d.strftime("%d.%m.%Y")
    except AttributeError:
        return str(d)


def generate_official_characteristic(cur, patient_id: int, schema: str) -> dict:
    """Собирает весь массив отчётов (ежедневные + shift_logs) за период пребывания резидента и отправляет
    Агенту YandexGPT с системной припиской, содержащей ФИО/дату рождения/детей/даты пребывания, для генерации
    официальной характеристики. Данные отчётов анонимизируются перед отправкой (как и в аналитической сводке),
    а итоговый текст возвращается уже с подставленным настоящим ФИО резидента для оформления документа."""
    cur.execute(f"SELECT * FROM {schema}.patients WHERE id = %s", (patient_id,))
    patient = cur.fetchone()
    if not patient:
        return {"error": "Пациент не найден"}
    patient = dict(patient)

    cur.execute(f"SELECT * FROM {schema}.patient_children WHERE patient_id = %s", (patient_id,))
    children = [dict(c) for c in cur.fetchall()]

    admission_date = patient.get("admission_date")
    discharge_date = patient.get("discharge_date")
    stay_from = fmt_ru_date(admission_date) or "не указана"
    stay_to = fmt_ru_date(discharge_date) if discharge_date else "по настоящее время"

    if admission_date:
        cur.execute(
            f"""SELECT report_date, problems_identified, actions_taken, results, notes
                FROM {schema}.patient_daily_reports
                WHERE patient_id = %s AND report_date >= %s
                ORDER BY report_date ASC""",
            (patient_id, admission_date),
        )
    else:
        cur.execute(
            f"""SELECT report_date, problems_identified, actions_taken, results, notes
                FROM {schema}.patient_daily_reports
                WHERE patient_id = %s
                ORDER BY report_date ASC""",
            (patient_id,),
        )
    reports = [dict(r) for r in cur.fetchall()]

    if admission_date:
        cur.execute(
            f"""SELECT report_date, log_text FROM {schema}.shift_logs
                WHERE report_date >= %s AND log_text IS NOT NULL AND log_text != ''
                ORDER BY report_date ASC""",
            (admission_date,),
        )
    else:
        cur.execute(
            f"""SELECT report_date, log_text FROM {schema}.shift_logs
                WHERE log_text IS NOT NULL AND log_text != ''
                ORDER BY report_date ASC""",
        )
    shift_logs = [dict(r) for r in cur.fetchall()]

    if not reports and not shift_logs:
        return {"error": "Недостаточно данных за период пребывания для формирования характеристики"}

    lines = []
    for r in reports:
        parts = [p for p in (r.get("problems_identified"), r.get("actions_taken"), r.get("results"), r.get("notes")) if p]
        if parts:
            lines.append(f"{r['report_date']}: " + " ".join(parts))
    for s in shift_logs:
        lines.append(f"{s['report_date']} (общая сводка смены): {s['log_text']}")

    raw_text = "\n".join(lines)
    if not raw_text.strip():
        return {"error": "За период пребывания дежурные заполнили только числовые оценки, без текстовых заметок. Для формирования характеристики нужен хотя бы один текстовый комментарий в отчётах"}

    full_name = " ".join(p for p in (patient.get("last_name"), patient.get("first_name"), patient.get("middle_name")) if p).strip()

    if children:
        children_info = ", ".join(
            " ".join(p for p in (c.get("last_name"), c.get("first_name")) if p).strip() +
            (f" ({fmt_ru_date(c['birth_date'])})" if c.get("birth_date") else "")
            for c in children
        )
    else:
        children_info = "нет"

    anonymized_reports = anonymize_names(raw_text, patient, children)
    social_block = build_social_status_block(patient)

    instruction = (
        "Сформируй официальную характеристику на резидента.\n"
        f"ФИО: {full_name}\n"
        f"Дата рождения: {fmt_ru_date(patient.get('birth_date')) or 'не указана'}\n"
        f"Дети: {children_info}\n"
        f"Даты пребывания: {stay_from} — {stay_to}\n"
        + (f"{social_block}\n" if social_block else "")
        + f"\n{anonymized_reports}"
    )

    characteristic_text = ask_yandex_gpt(instruction)
    # Итоговый документ должен содержать настоящее ФИО, а не плейсхолдер анонимизации
    characteristic_text = characteristic_text.replace("[Резидент]", full_name)

    return {
        "characteristic_text": characteristic_text,
        "full_name": full_name,
        "birth_date": fmt_ru_date(patient.get("birth_date")),
        "children_info": children_info,
        "stay_from": stay_from,
        "stay_to": stay_to,
    }


def build_characteristic_docx(result: dict) -> bytes:
    """Оборачивает текст характеристики от Агента в готовый .docx файл для скачивания."""
    doc = DocxDocument()
    doc.add_heading("Характеристика", level=1)

    meta = doc.add_paragraph()
    meta.add_run(f"ФИО: {result['full_name']}\n").bold = True
    meta.add_run(f"Дата рождения: {result['birth_date'] or '—'}\n")
    meta.add_run(f"Дети: {result['children_info']}\n")
    meta.add_run(f"Даты пребывания: {result['stay_from']} — {result['stay_to']}")

    doc.add_paragraph("")

    for para in result["characteristic_text"].split("\n"):
        text = para.strip().replace("**", "").replace("##", "").replace("#", "")
        if text:
            doc.add_paragraph(text)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
