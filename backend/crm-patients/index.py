import json
import os
from datetime import date
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import errors

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

# Словари корней слов для алгоритмической текстовой сводки (без внешних ИИ-сервисов).
# Совпадают со словарями в max-shift-report-bot/index.py, используемыми для расчёта overall_state.
GREEN_WORDS = [
    "молодец", "справил", "стабильн", "ресурс", "бодрячк",
    "включен", "активн", "помог", "честн", "ровн",
    "умниц", "прогресс", "втягива", "движени", "уверен",
]
YELLOW_WORDS = [
    "устал", "подустал", "вымотал", "сует", "отвлека",
    "нестабильн", "инфантильн", "детск", "качел", "ручник",
    "напряжен", "поникш", "задумчив", "пассивн",
]
RED_WORDS = [
    "жертв", "чёрн", "тёмн", "нечестност", "оправдан",
    "маск", "тяг", "обид", "провал", "агресс",
    "срыв", "корон", "хитр", "грузит", "закрыт",
    "отрицани", "презрени", "угодничеств", "бардак",
    "глухонем", "безответствен",
]
DISCIPLINE_MARKERS = [
    "х2", "пхд", "режим тишины", "последстви", "верёвк",
]


def generate_text_summary(cur, patient_id: int, schema: str, days: int) -> dict:
    """Алгоритмическая (rule-based) текстовая сводка по пациенту за период: без внешних ИИ-сервисов.
    Считает % дней в красной/жёлтой/зелёной зоне по overall_state, находит топ-3 самых частых
    корней-триггеров в текстах отчётов и формирует Markdown-текст (Динамика / Паттерны / Дисциплина)."""
    cur.execute(
        f"""SELECT report_date, overall_state, problems_identified, actions_taken, results, notes
            FROM {schema}.patient_daily_reports
            WHERE patient_id = %s AND report_date >= CURRENT_DATE - %s::interval
            ORDER BY report_date ASC""",
        (patient_id, f"{days} days"),
    )
    reports = cur.fetchall()

    red_count = yellow_count = green_count = 0
    for r in reports:
        score = r.get("overall_state")
        if score is None:
            continue
        if score <= 4:
            red_count += 1
        elif score <= 6:
            yellow_count += 1
        else:
            green_count += 1

    total_scored = red_count + yellow_count + green_count
    red_pct = (red_count / total_scored * 100) if total_scored else 0
    green_pct = (green_count / total_scored * 100) if total_scored else 0

    combined_text = " ".join(
        (r.get("problems_identified") or "") + " " + (r.get("actions_taken") or "") + " " +
        (r.get("results") or "") + " " + (r.get("notes") or "")
        for r in reports
    ).lower()

    word_counts = []
    for w in RED_WORDS + YELLOW_WORDS + GREEN_WORDS + DISCIPLINE_MARKERS:
        c = combined_text.count(w)
        if c > 0:
            word_counts.append((w, c))
    word_counts.sort(key=lambda x: x[1], reverse=True)
    top3 = word_counts[:3]

    discipline_found = any(combined_text.count(w) > 0 for w in DISCIPLINE_MARKERS)

    if total_scored == 0:
        dynamics_block = "🟡 **Динамика:** Недостаточно данных за период для оценки."
    elif red_pct >= 40:
        dynamics_block = "🔴 **Динамика:** Негативная. Преобладает эмоциональный спад, высок риск срыва или саботажа."
    elif green_pct >= 50 and red_pct < 20:
        dynamics_block = "🟢 **Динамика:** Положительная. Пациент стабилен, показывает вовлечённость."
    else:
        dynamics_block = "🟡 **Динамика:** Нестабильная (эмоциональные качели)."

    if top3:
        patterns_str = ", ".join(f"{w} ({c} раз)" for w, c in top3)
        patterns_block = f"⚠️ **Доминирующие паттерны:** {patterns_str}."
    else:
        patterns_block = "⚠️ **Доминирующие паттерны:** Ярко выраженных паттернов не зафиксировано."

    if discipline_found:
        discipline_block = "🛑 **Дисциплина:** Имеются системные нарушения (получены последствия)."
    else:
        discipline_block = "✅ **Дисциплина:** Грубых нарушений не зафиксировано."

    summary_text = "\n\n".join([dynamics_block, patterns_block, discipline_block])

    return {
        "summary_text": summary_text,
        "counts": {"red": red_count, "yellow": yellow_count, "green": green_count},
        "days": days,
    }

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def analyze_patient_data(cur, patient_id, schema, alias, days=7):
    """Локальный генератор текстовой сводки на основе шаблонов и ключевых слов (без внешних ИИ-сервисов)."""
    cur.execute(f"""
        SELECT * FROM {schema}.patient_daily_reports
        WHERE patient_id = %s
          AND report_date >= CURRENT_DATE - %s::interval
        ORDER BY report_date ASC
    """, (patient_id, f"{days} days"))
    reports = cur.fetchall()

    if not reports:
        return "Недостаточно данных за выбранный период для формирования аналитической сводки."

    dict_problems = ['сон', 'аппетит', 'агрес', 'апат', 'конфликт', 'тяг', 'саботаж', 'ссор']
    dict_actions = ['бесед', 'групп', 'психолог', 'дневник', 'задани', 'отстран']
    dict_results_pos = ['осозна', 'успоко', 'стабил', 'принял', 'соглас']
    dict_results_neg = ['отказ', 'игнор', 'отрица']

    found_problems = set()
    found_actions = set()
    pos_results = 0
    neg_results = 0

    overall_sum = 0
    overall_count = 0

    for r in reports:
        p_text = (r.get("problems_identified") or "").lower()
        a_text = (r.get("actions_taken") or "").lower()
        res_text = (r.get("results") or "").lower()

        for word in dict_problems:
            if word in p_text or word in a_text or word in res_text:
                found_problems.add(word)
        for word in dict_actions:
            if word in a_text:
                found_actions.add(word)
        for word in dict_results_pos:
            if word in res_text:
                pos_results += 1
        for word in dict_results_neg:
            if word in res_text:
                neg_results += 1

        score = r.get("overall_state")
        if score is not None:
            overall_sum += score
            overall_count += 1

    text_blocks = []

    if overall_count > 0:
        avg_state = overall_sum / overall_count
        if avg_state >= 8:
            text_blocks.append("находилась в стабильно приподнятом настроении")
        elif avg_state >= 5:
            text_blocks.append("демонстрировала ровный эмоциональный фон")
        else:
            text_blocks.append("эмоциональный фон был преимущественно подавленным")
    else:
        text_blocks.append("состояние требует дополнительной оценки")

    if found_problems:
        text_blocks.append(f"В записях отмечены маркеры рисков: {', '.join(found_problems)}.")
    if found_actions:
        text_blocks.append(f"В качестве мер стабилизации применялись: {', '.join(found_actions)}.")

    if pos_results > 0 or neg_results > 0:
        if pos_results > neg_results:
            text_blocks.append("Реакция на вмешательства персонала преимущественно положительная.")
        elif neg_results > pos_results:
            text_blocks.append("Зафиксировано сопротивление или отсутствие реакции на вмешательства.")
        else:
            text_blocks.append("Реакция на вмешательства смешанная.")

    result_text = f"За последние {days} дней {alias} {text_blocks[0]}. " + " ".join(text_blocks[1:])
    return result_text


def analyze_child_data(cur, child_id, schema, days=7):
    """Локальный генератор текстовой сводки по ребёнку на основе шаблонов, шкал и ключевых слов (без внешних ИИ-сервисов)."""
    cur.execute(f"""
        SELECT * FROM {schema}.child_daily_reports
        WHERE child_id = %s
          AND report_date >= CURRENT_DATE - %s::interval
        ORDER BY report_date ASC
    """, (child_id, f"{days} days"))
    reports = cur.fetchall()

    if not reports:
        return "Недостаточно данных за выбранный период для формирования аналитической сводки."

    dict_problems = ['плач', 'истерик', 'каприз', 'агрес', 'страх', 'тревож', 'замкнут', 'конфликт']
    dict_actions = ['игр', 'бесед', 'успоко', 'отвлек', 'поощр', 'вниман', 'психолог']
    dict_results_pos = ['успоко', 'улыб', 'контакт', 'вовлеч', 'интерес']
    dict_results_neg = ['отказ', 'игнор', 'продолж']

    found_problems = set()
    found_actions = set()
    pos_results = 0
    neg_results = 0

    def avg_scale(field):
        vals = [r[field] for r in reports if r.get(field) is not None]
        return (sum(vals) / len(vals)) if vals else None

    for r in reports:
        p_text = (r.get("identified_problems") or "").lower()
        a_text = (r.get("taken_actions") or "").lower()
        res_text = (r.get("results") or "").lower()

        for word in dict_problems:
            if word in p_text or word in a_text or word in res_text:
                found_problems.add(word)
        for word in dict_actions:
            if word in a_text:
                found_actions.add(word)
        for word in dict_results_pos:
            if word in res_text:
                pos_results += 1
        for word in dict_results_neg:
            if word in res_text:
                neg_results += 1

    avg_emotional = avg_scale("scale_emotional")
    if avg_emotional is not None:
        if avg_emotional >= 8:
            emotional_phrase = "ребёнок демонстрировал позитивный эмоциональный фон"
        elif avg_emotional >= 5:
            emotional_phrase = "ребёнок эмоционально стабилен"
        else:
            emotional_phrase = "у ребёнка наблюдается эмоциональная нестабильность/подавленность"
    else:
        emotional_phrase = "эмоциональное состояние ребёнка требует дополнительной оценки"

    scale_notes = []

    avg_contact_mother = avg_scale("scale_contact_mother")
    if avg_contact_mother is not None and avg_contact_mother < 5:
        scale_notes.append("Зафиксированы сложности в контакте с матерью.")

    discipline_vals = [r["scale_discipline"] for r in reports if r.get("scale_discipline") is not None]
    academic_vals = [r["scale_academic"] for r in reports if r.get("scale_academic") is not None]
    if discipline_vals and academic_vals:
        avg_disc_acad = (sum(discipline_vals) / len(discipline_vals) + sum(academic_vals) / len(academic_vals)) / 2
        if avg_disc_acad < 5:
            scale_notes.append("Отмечаются проблемы с дисциплиной и успеваемостью.")

    problems_part = f"В записях воспитателей отмечались триггеры: {', '.join(found_problems)}." if found_problems else ""
    actions_part = f"Применялись методы: {', '.join(found_actions)}." if found_actions else ""

    results_part = ""
    if pos_results > 0 or neg_results > 0:
        if pos_results > neg_results:
            results_part = "Реакция преимущественно положительная."
        elif neg_results > pos_results:
            results_part = "Зафиксировано сопротивление или отсутствие реакции."
        else:
            results_part = "Реакция смешанная."

    text = f"За последние {days} дней {emotional_phrase}."
    if scale_notes:
        text += " " + " ".join(scale_notes)
    if problems_part:
        text += " " + problems_part
    if actions_part:
        text += " " + actions_part
    if results_part:
        text += " " + results_part

    return text


def handler(event: dict, context) -> dict:
    """CRM: управление пациентами. GET /? — список, GET /?id=N — карточка, POST / — создать, PUT /?id=N — обновить,
    GET /?id=N&view=text_summary&days=7 — алгоритмическая текстовая сводка за период (без внешних ИИ-сервисов)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    patient_id = params.get("id")
    child_id_param = params.get("child_id")
    view = params.get("view")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    child_scales = (
        "scale_emotional", "scale_stress", "scale_sociability", "scale_activity",
        "scale_contact_mother", "scale_contact_peers", "scale_academic", "scale_work",
        "scale_attention", "scale_discipline",
    )

    def load_latest_scores(ids):
        """Средний балл по последнему ежедневному отчёту для каждого ребёнка из списка id."""
        scores = {}
        if not ids:
            return scores
        try:
            cur.execute(
                f"""SELECT DISTINCT ON (child_id) * FROM {SCHEMA}.child_daily_reports
                    WHERE child_id = ANY(%s)
                    ORDER BY child_id, report_date DESC, created_at DESC""",
                (ids,)
            )
            for r in cur.fetchall():
                values = [r[s] for s in child_scales if r.get(s) is not None]
                scores[r["child_id"]] = round(sum(values) / len(values), 1) if values else None
        except errors.UndefinedTable:
            conn.rollback()
        return scores

    if method == "GET":
        if view == "text_summary" and patient_id:
            try:
                days = int(params.get("days", 7))
            except (TypeError, ValueError):
                days = 7
            days = max(1, min(days, 90))
            result = generate_text_summary(cur, patient_id, SCHEMA, days)
            return ok(result)

        if view == "children":
            cur.execute(f"""
                SELECT c.*, EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date))::int AS current_age,
                       p.id AS patient_id, p.last_name AS patient_last_name, p.first_name AS patient_first_name,
                       p.middle_name AS patient_middle_name, p.alias AS patient_alias, p.discharge_date AS patient_discharge_date
                FROM {SCHEMA}.patient_children c
                JOIN {SCHEMA}.patients p ON p.id = c.patient_id
                WHERE p.discharge_date IS NULL AND (p.care_stage IS NULL OR p.care_stage = 'inpatient')
                ORDER BY c.last_name, c.first_name
            """)
            all_children = [dict(c) for c in cur.fetchall()]
            latest_scores = load_latest_scores([c["id"] for c in all_children])
            for c in all_children:
                c["latest_avg_score"] = latest_scores.get(c["id"])
            return ok({"children": all_children})

        if view == "child" and child_id_param:
            cur.execute(f"""
                SELECT c.*, EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date))::int AS current_age,
                       p.id AS patient_id, p.last_name AS patient_last_name, p.first_name AS patient_first_name,
                       p.middle_name AS patient_middle_name, p.alias AS patient_alias, p.discharge_date AS patient_discharge_date
                FROM {SCHEMA}.patient_children c
                JOIN {SCHEMA}.patients p ON p.id = c.patient_id
                WHERE c.id = %s
            """, (child_id_param,))
            child = cur.fetchone()
            if not child:
                return err("Ребёнок не найден", 404)
            child = dict(child)
            child["latest_avg_score"] = load_latest_scores([child["id"]]).get(child["id"])
            return ok({"child": child})

        if child_id_param:
            summaries = []
            try:
                cur.execute(
                    f"SELECT id, child_id, summary_text, created_at FROM {SCHEMA}.child_ai_summaries WHERE child_id = %s ORDER BY created_at DESC",
                    (child_id_param,)
                )
                summaries = cur.fetchall()
            except errors.UndefinedTable:
                conn.rollback()
            return ok({"summaries": [dict(s) for s in summaries]})

        if patient_id:
            cur.execute(f"SELECT * FROM {SCHEMA}.patients WHERE id = %s", (patient_id,))
            patient = cur.fetchone()
            if not patient:
                return err("Пациент не найден", 404)
            cur.execute(
                f"SELECT *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age FROM {SCHEMA}.patient_children WHERE patient_id = %s ORDER BY birth_date",
                (patient_id,)
            )
            children = [dict(c) for c in cur.fetchall()]

            child_scales = (
                "scale_emotional", "scale_stress", "scale_sociability", "scale_activity",
                "scale_contact_mother", "scale_contact_peers", "scale_academic", "scale_work",
                "scale_attention", "scale_discipline",
            )
            child_ids = [c["id"] for c in children]
            latest_scores = {}
            if child_ids:
                try:
                    cur.execute(
                        f"""SELECT DISTINCT ON (child_id) * FROM {SCHEMA}.child_daily_reports
                            WHERE child_id = ANY(%s)
                            ORDER BY child_id, report_date DESC, created_at DESC""",
                        (child_ids,)
                    )
                    latest_reports = cur.fetchall()
                    for r in latest_reports:
                        values = [r[s] for s in child_scales if r.get(s) is not None]
                        latest_scores[r["child_id"]] = round(sum(values) / len(values), 1) if values else None
                except errors.UndefinedTable:
                    conn.rollback()

            for c in children:
                c["latest_avg_score"] = latest_scores.get(c["id"])

            cur.execute(f"SELECT * FROM {SCHEMA}.patient_documents WHERE patient_id = %s ORDER BY uploaded_at DESC", (patient_id,))
            documents = cur.fetchall()
            cur.execute(
                f"SELECT risk_level, report_date FROM {SCHEMA}.patient_daily_reports WHERE patient_id = %s ORDER BY report_date DESC, created_at DESC LIMIT 1",
                (patient_id,)
            )
            latest_dynamics = cur.fetchone()
            cur.execute(f"SELECT * FROM {SCHEMA}.patient_tasks WHERE patient_id = %s ORDER BY created_at DESC", (patient_id,))
            tasks = cur.fetchall()

            cur.execute(
                f"SELECT COUNT(*) AS cnt FROM {SCHEMA}.patient_daily_reports WHERE patient_id = %s AND author = %s",
                (patient_id, "Max-бот (смена)")
            )
            shift_reports_count = cur.fetchone()["cnt"]

            alias = patient.get("alias") or f"{patient.get('first_name', '')} {patient.get('last_name', '')}".strip() or "Пациент"
            advanced_local_summary = analyze_patient_data(cur, patient_id, SCHEMA, alias, days=7)

            saved_summaries = []
            try:
                cur.execute(f"SELECT id, summary_text, created_at FROM {SCHEMA}.patient_ai_summaries WHERE patient_id = %s ORDER BY created_at DESC", (patient_id,))
                saved_summaries = cur.fetchall()
            except errors.UndefinedTable:
                conn.rollback()

            return ok({
                "patient": dict(patient),
                "children": children,
                "documents": [dict(d) for d in documents],
                "latest_risk_level": latest_dynamics["risk_level"] if latest_dynamics else None,
                "shift_reports_count": shift_reports_count,
                "tasks": [dict(t) for t in tasks],
                "advanced_local_summary": advanced_local_summary,
                "saved_summaries": [dict(s) for s in saved_summaries]
            })
        else:
            search = params.get("search", "")
            latest_risk_cte = f"""
                latest_risk AS (
                    SELECT DISTINCT ON (patient_id) patient_id, risk_level
                    FROM {SCHEMA}.patient_daily_reports
                    ORDER BY patient_id, report_date DESC, created_at DESC
                ),
                recent_states AS (
                    SELECT patient_id, json_agg(json_build_object('date', report_date, 'value', overall_state) ORDER BY report_date) AS state_history
                    FROM (
                        SELECT patient_id, report_date, overall_state,
                               ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY report_date DESC, created_at DESC) AS rn
                        FROM {SCHEMA}.patient_daily_reports
                        WHERE overall_state IS NOT NULL
                    ) t
                    WHERE rn <= 10
                    GROUP BY patient_id
                )
            """
            if search:
                cur.execute(
                    f"""WITH {latest_risk_cte}
                        SELECT p.*, COUNT(c.id) as children_count, lr.risk_level,
                               (SELECT state_history FROM recent_states rs WHERE rs.patient_id = p.id) AS state_history
                        FROM {SCHEMA}.patients p
                        LEFT JOIN {SCHEMA}.patient_children c ON c.patient_id = p.id
                        LEFT JOIN latest_risk lr ON lr.patient_id = p.id
                        WHERE p.last_name ILIKE %s OR p.first_name ILIKE %s OR p.middle_name ILIKE %s
                        GROUP BY p.id, lr.risk_level
                        ORDER BY (p.discharge_date IS NULL) DESC, p.created_at DESC""",
                    (f"%{search}%", f"%{search}%", f"%{search}%")
                )
            else:
                cur.execute(
                    f"""WITH {latest_risk_cte}
                        SELECT p.*, COUNT(c.id) as children_count, lr.risk_level,
                               (SELECT state_history FROM recent_states rs WHERE rs.patient_id = p.id) AS state_history
                        FROM {SCHEMA}.patients p
                        LEFT JOIN {SCHEMA}.patient_children c ON c.patient_id = p.id
                        LEFT JOIN latest_risk lr ON lr.patient_id = p.id
                        GROUP BY p.id, lr.risk_level
                        ORDER BY (p.discharge_date IS NULL) DESC, p.created_at DESC"""
                )
            rows = cur.fetchall()
            return ok({"patients": [dict(r) for r in rows]})

    body = json.loads(event.get("body") or "{}")

    if method == "POST":
        action = body.get("action")

        if action == "delete_patient":
            pid = body.get("patient_id")

            # Полная зачистка всех связанных таблиц (порядок не важен, главное - до удаления самого пациента)
            cur.execute(f"DELETE FROM {SCHEMA}.patient_ai_summaries WHERE patient_id = %s", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.patient_tasks WHERE patient_id = %s", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.patient_daily_reports WHERE patient_id = %s", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.patient_documents WHERE patient_id = %s", (pid,))
            # Данные детей пациента тоже нужно зачистить перед удалением самих детей
            cur.execute(f"DELETE FROM {SCHEMA}.child_ai_summaries WHERE child_id IN (SELECT id FROM {SCHEMA}.patient_children WHERE patient_id = %s)", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.child_tasks WHERE child_id IN (SELECT id FROM {SCHEMA}.patient_children WHERE patient_id = %s)", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.child_daily_reports WHERE child_id IN (SELECT id FROM {SCHEMA}.patient_children WHERE patient_id = %s)", (pid,))
            cur.execute(f"DELETE FROM {SCHEMA}.patient_children WHERE patient_id = %s", (pid,))

            # Теперь базу ничего не держит, и можно безопасно удалить саму карточку
            cur.execute(f"DELETE FROM {SCHEMA}.patients WHERE id = %s", (pid,))
            conn.commit()
            return ok({"success": True})

        if action == "delete_document":
            doc_id = body.get("document_id")
            cur.execute(f"DELETE FROM {SCHEMA}.patient_documents WHERE id = %s RETURNING file_url", (doc_id,))
            row = cur.fetchone()
            conn.commit()
            return ok({"success": True, "file_url": row["file_url"] if row else None})

        if action == "add_child":
            pid = body.get("patient_id")
            cur.execute(
                f"INSERT INTO {SCHEMA}.patient_children (patient_id, last_name, first_name, middle_name, birth_date, previous_education, current_education, extracurriculars) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age",
                (pid, body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None,
                 body.get("previous_education"), body.get("current_education"), body.get("extracurriculars"))
            )
            child = cur.fetchone()
            conn.commit()
            return ok({"child": dict(child)})

        if action == "delete_child":
            child_id = body.get("child_id")
            # Сначала вычищаем все связанные данные ребёнка, чтобы не было конфликтов внешних ключей
            cur.execute(f"DELETE FROM {SCHEMA}.child_ai_summaries WHERE child_id = %s", (child_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.child_tasks WHERE child_id = %s", (child_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.child_daily_reports WHERE child_id = %s", (child_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.patient_children WHERE id = %s", (child_id,))
            conn.commit()
            return ok({"success": True})

        if action == "update_child":
            child_id = body.get("child_id")
            cur.execute(
                f"UPDATE {SCHEMA}.patient_children SET last_name=%s, first_name=%s, middle_name=%s, birth_date=%s, previous_education=%s, current_education=%s, extracurriculars=%s WHERE id=%s RETURNING *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age",
                (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None,
                 body.get("previous_education"), body.get("current_education"), body.get("extracurriculars"), child_id)
            )
            child = cur.fetchone()
            conn.commit()
            return ok({"child": dict(child)})

        if action == "add_task":
            pid = body.get("patient_id")
            description = (body.get("description") or "").strip()
            task_type = body.get("task_type") or "main"
            if task_type not in ("main", "additional"):
                return err("task_type должен быть main или additional")
            if not pid or not description:
                return err("Поля patient_id и description обязательны")
            cur.execute(
                f"INSERT INTO {SCHEMA}.patient_tasks (patient_id, description, deadline, status, task_type) VALUES (%s,%s,%s,'active',%s) RETURNING *",
                (pid, description, body.get("deadline") or None, task_type)
            )
            task = cur.fetchone()
            conn.commit()
            return ok({"task": dict(task)}, 201)

        if action == "complete_task":
            task_id = body.get("task_id")
            cur.execute(
                f"UPDATE {SCHEMA}.patient_tasks SET status='completed', completed_at=NOW() WHERE id=%s RETURNING *",
                (task_id,)
            )
            task = cur.fetchone()
            if not task:
                return err("Задание не найдено", 404)
            conn.commit()
            return ok({"task": dict(task)})

        if action == "set_care_stage":
            pid = body.get("patient_id")
            stage = body.get("care_stage")
            if stage not in ("inpatient", "posttreatment"):
                return err("care_stage должен быть inpatient или posttreatment")
            if stage == "posttreatment":
                stage_since = body.get("care_stage_since") or date.today().isoformat()
            else:
                stage_since = None
            cur.execute(
                f"UPDATE {SCHEMA}.patients SET care_stage=%s, care_stage_since=%s, updated_at=NOW() WHERE id=%s RETURNING *",
                (stage, stage_since, pid)
            )
            patient = cur.fetchone()
            conn.commit()
            return ok({"patient": dict(patient)})

        if action == "update_care_stage_since":
            pid = body.get("patient_id")
            stage_since = body.get("care_stage_since")
            if not stage_since:
                return err("Поле care_stage_since обязательно")
            cur.execute(
                f"UPDATE {SCHEMA}.patients SET care_stage_since=%s, updated_at=NOW() WHERE id=%s AND care_stage='posttreatment' RETURNING *",
                (stage_since, pid)
            )
            patient = cur.fetchone()
            conn.commit()
            if not patient:
                return err("Пациент не найден или не находится на амбулаторной программе", 404)
            return ok({"patient": dict(patient)})

        if action == "save_local_summary":
            pid = body.get("patient_id")
            summary_text = (body.get("summary_text") or "").strip()
            if not pid or not summary_text:
                return err("Поля patient_id и summary_text обязательны")

            cur.execute(
                f"INSERT INTO {SCHEMA}.patient_ai_summaries (patient_id, summary_text) VALUES (%s, %s) RETURNING id, patient_id, summary_text, created_at",
                (pid, summary_text)
            )
            summary = cur.fetchone()
            conn.commit()
            return ok({"summary": dict(summary)}, 201)

        if action == "generate_child_summary":
            child_id = body.get("child_id")
            if not child_id:
                return err("Поле child_id обязательно")
            summary_text = analyze_child_data(cur, child_id, SCHEMA, days=7)
            return ok({"summary": summary_text})

        if action == "save_child_summary":
            child_id = body.get("child_id")
            summary_text = (body.get("summary_text") or "").strip()
            if not child_id or not summary_text:
                return err("Поля child_id и summary_text обязательны")

            cur.execute(
                f"INSERT INTO {SCHEMA}.child_ai_summaries (child_id, summary_text) VALUES (%s, %s) RETURNING id, child_id, summary_text, created_at",
                (child_id, summary_text)
            )
            summary = cur.fetchone()
            conn.commit()
            return ok({"summary": dict(summary)}, 201)

        cur.execute(
            f"INSERT INTO {SCHEMA}.patients (last_name, first_name, middle_name, alias, birth_date, address, admission_date, discharge_date, case_description, passport_series, passport_number, passport_issued_date, passport_issued_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
            (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("alias"),
             body.get("birth_date") or None, body.get("address"), body.get("admission_date") or None,
             body.get("discharge_date") or None, body.get("case_description"),
             body.get("passport_series"), body.get("passport_number"),
             body.get("passport_issued_date") or None, body.get("passport_issued_by"))
        )
        patient = cur.fetchone()
        conn.commit()
        return ok({"patient": dict(patient)}, 201)

    if method == "PUT" and patient_id:
        cur.execute(
            f"UPDATE {SCHEMA}.patients SET last_name=%s, first_name=%s, middle_name=%s, alias=%s, birth_date=%s, address=%s, admission_date=%s, discharge_date=%s, case_description=%s, passport_series=%s, passport_number=%s, passport_issued_date=%s, passport_issued_by=%s, updated_at=NOW() WHERE id=%s RETURNING *",
            (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("alias"),
             body.get("birth_date") or None, body.get("address"), body.get("admission_date") or None,
             body.get("discharge_date") or None, body.get("case_description"),
             body.get("passport_series"), body.get("passport_number"),
             body.get("passport_issued_date") or None, body.get("passport_issued_by"), patient_id)
        )
        patient = cur.fetchone()
        conn.commit()
        return ok({"patient": dict(patient)})

    return err("Метод не поддерживается", 405)