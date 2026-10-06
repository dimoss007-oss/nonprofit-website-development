from psycopg2 import errors
from crm_common import SCHEMA, err, ok
from local_summary import analyze_child_data
from yandex_ai import generate_child_yandex_summary


CHILD_SCALES = (
    "scale_emotional", "scale_stress", "scale_sociability", "scale_activity",
    "scale_contact_mother", "scale_contact_peers", "scale_academic", "scale_work",
    "scale_attention", "scale_discipline",
)


def load_latest_scores(cur, conn, ids):
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
            values = [r[s] for s in CHILD_SCALES if r.get(s) is not None]
            scores[r["child_id"]] = round(sum(values) / len(values), 1) if values else None
    except errors.UndefinedTable:
        conn.rollback()
    return scores


def get_children_list(cur, conn, params, body):
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
    latest_scores = load_latest_scores(cur, conn, [c["id"] for c in all_children])
    for c in all_children:
        c["latest_avg_score"] = latest_scores.get(c["id"])
    return ok({"children": all_children})


def get_child(cur, conn, params, body):
    child_id_param = params.get("child_id")
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
    child["latest_avg_score"] = load_latest_scores(cur, conn, [child["id"]]).get(child["id"])
    return ok({"child": child})


def get_child_summaries(cur, conn, params, body):
    child_id_param = params.get("child_id")
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


def add_child(cur, conn, params, body):
    pid = body.get("patient_id")
    cur.execute(
        f"INSERT INTO {SCHEMA}.patient_children (patient_id, last_name, first_name, middle_name, birth_date, previous_education, current_education, extracurriculars, alias) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age",
        (pid, body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None,
         body.get("previous_education"), body.get("current_education"), body.get("extracurriculars"), (body.get("alias") or "").strip() or None)
    )
    child = cur.fetchone()
    conn.commit()
    return ok({"child": dict(child)})


def delete_child(cur, conn, params, body):
    child_id = body.get("child_id")
    # Сначала вычищаем все связанные данные ребёнка, чтобы не было конфликтов внешних ключей
    cur.execute(f"DELETE FROM {SCHEMA}.child_ai_summaries WHERE child_id = %s", (child_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.child_tasks WHERE child_id = %s", (child_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.child_daily_reports WHERE child_id = %s", (child_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.child_weekly_reports WHERE child_id = %s", (child_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.patient_children WHERE id = %s", (child_id,))
    conn.commit()
    return ok({"success": True})


def update_child(cur, conn, params, body):
    child_id = body.get("child_id")
    cur.execute(
        f"UPDATE {SCHEMA}.patient_children SET last_name=%s, first_name=%s, middle_name=%s, birth_date=%s, previous_education=%s, current_education=%s, extracurriculars=%s, alias=%s WHERE id=%s RETURNING *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age",
        (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None,
         body.get("previous_education"), body.get("current_education"), body.get("extracurriculars"), (body.get("alias") or "").strip() or None, child_id)
    )
    child = cur.fetchone()
    conn.commit()
    return ok({"child": dict(child)})


def generate_child_summary(cur, conn, params, body):
    child_id = body.get("child_id")
    if not child_id:
        return err("Поле child_id обязательно")
    summary_text = analyze_child_data(cur, child_id, SCHEMA, days=7)
    return ok({"summary": summary_text})


def generate_child_yandex_summary_action(cur, conn, params, body):
    child_id = body.get("child_id")
    if not child_id:
        return err("Поле child_id обязательно")
    result = generate_child_yandex_summary(cur, child_id, SCHEMA)
    if result.get("error"):
        return err(result["error"], 404)
    return ok(result)


def save_child_summary(cur, conn, params, body):
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
