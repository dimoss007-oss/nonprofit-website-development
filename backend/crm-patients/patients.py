from datetime import date
from psycopg2 import errors
from children import load_latest_scores
from crm_common import SCHEMA, err, ok
from local_summary import analyze_patient_data


def get_stats(cur, conn, params, body):
    # "Всего резидентов за текущий год" = поступившие в этом году (admission_date >= 1 января)
    # + переходящие с прошлых лет, кто ещё числится в этом году (admission_date < 1 января ТЕКУЩЕГО года
    # И (discharge_date IS NULL ИЛИ discharge_date >= 1 января текущего года)). Год берётся динамически
    # от текущей даты сервера, пересчитывается на лету при каждом запросе.
    # Дети хранятся как вложенный список без собственных дат поступления/выписки (только patient_id) —
    # поэтому считаем детей у тех же резидентов, что попали в выборку "за текущий год" по датам родителя.
    cur.execute(f"""
        SELECT
            COUNT(DISTINCT p.id) FILTER (WHERE p.admission_date >= date_trunc('year', CURRENT_DATE)) AS admitted_this_year,
            COUNT(DISTINCT p.id) FILTER (
                WHERE p.admission_date < date_trunc('year', CURRENT_DATE)
                  AND (p.discharge_date IS NULL OR p.discharge_date >= date_trunc('year', CURRENT_DATE))
            ) AS carried_over,
            COUNT(c.id) FILTER (WHERE p.admission_date >= date_trunc('year', CURRENT_DATE)) AS children_admitted_this_year,
            COUNT(c.id) FILTER (
                WHERE p.admission_date < date_trunc('year', CURRENT_DATE)
                  AND (p.discharge_date IS NULL OR p.discharge_date >= date_trunc('year', CURRENT_DATE))
            ) AS children_carried_over
        FROM {SCHEMA}.patients p
        LEFT JOIN {SCHEMA}.patient_children c ON c.patient_id = p.id
        WHERE p.admission_date IS NOT NULL
    """)
    row = dict(cur.fetchone())
    admitted = row["admitted_this_year"] or 0
    carried = row["carried_over"] or 0
    children_admitted = row["children_admitted_this_year"] or 0
    children_carried = row["children_carried_over"] or 0
    return ok({
        "year": date.today().year,
        "admitted_this_year": admitted,
        "carried_over": carried,
        "total_residents_this_year": admitted + carried,
        "children_admitted_this_year": children_admitted,
        "children_carried_over": children_carried,
        "total_children_this_year": children_admitted + children_carried,
    })


def get_patient_card(cur, conn, params, body):
    patient_id = params.get("id")
    cur.execute(f"SELECT * FROM {SCHEMA}.patients WHERE id = %s", (patient_id,))
    patient = cur.fetchone()
    if not patient:
        return err("Пациент не найден", 404)
    cur.execute(
        f"SELECT *, EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS current_age FROM {SCHEMA}.patient_children WHERE patient_id = %s ORDER BY birth_date",
        (patient_id,)
    )
    children = [dict(c) for c in cur.fetchall()]

    latest_scores = load_latest_scores(cur, conn, [c["id"] for c in children])

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
        cur.execute(f"SELECT id, summary_text, source, created_at FROM {SCHEMA}.patient_ai_summaries WHERE patient_id = %s ORDER BY created_at DESC", (patient_id,))
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


def get_patients_list(cur, conn, params, body):
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


def delete_patient(cur, conn, params, body):
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
    cur.execute(f"DELETE FROM {SCHEMA}.child_weekly_reports WHERE child_id IN (SELECT id FROM {SCHEMA}.patient_children WHERE patient_id = %s)", (pid,))
    cur.execute(f"DELETE FROM {SCHEMA}.patient_children WHERE patient_id = %s", (pid,))

    # Теперь базу ничего не держит, и можно безопасно удалить саму карточку
    cur.execute(f"DELETE FROM {SCHEMA}.patients WHERE id = %s", (pid,))
    conn.commit()
    return ok({"success": True})


def delete_document(cur, conn, params, body):
    doc_id = body.get("document_id")
    cur.execute(f"DELETE FROM {SCHEMA}.patient_documents WHERE id = %s RETURNING file_url", (doc_id,))
    row = cur.fetchone()
    conn.commit()
    return ok({"success": True, "file_url": row["file_url"] if row else None})


def add_task(cur, conn, params, body):
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


def complete_task(cur, conn, params, body):
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


def set_care_stage(cur, conn, params, body):
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


def update_care_stage_since(cur, conn, params, body):
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


def create_patient(cur, conn, params, body):
    cur.execute(
        f"""INSERT INTO {SCHEMA}.patients (last_name, first_name, middle_name, alias, birth_date, address, admission_date, discharge_date, case_description, passport_series, passport_number, passport_issued_date, passport_issued_by, benefits_status, urgent_needs, needs_resolution_stage, is_pdn, pdn_details, is_sop, sop_details)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
        (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("alias"),
         body.get("birth_date") or None, body.get("address"), body.get("admission_date") or None,
         body.get("discharge_date") or None, body.get("case_description"),
         body.get("passport_series"), body.get("passport_number"),
         body.get("passport_issued_date") or None, body.get("passport_issued_by"),
         body.get("benefits_status") or None, body.get("urgent_needs"), body.get("needs_resolution_stage") or None,
         bool(body.get("is_pdn")), body.get("pdn_details"), bool(body.get("is_sop")), body.get("sop_details"))
    )
    patient = cur.fetchone()
    conn.commit()
    return ok({"patient": dict(patient)}, 201)


def update_patient(cur, conn, params, body):
    patient_id = params.get("id")
    cur.execute(
        f"""UPDATE {SCHEMA}.patients SET last_name=%s, first_name=%s, middle_name=%s, alias=%s, birth_date=%s, address=%s, admission_date=%s, discharge_date=%s, case_description=%s, passport_series=%s, passport_number=%s, passport_issued_date=%s, passport_issued_by=%s,
            benefits_status=%s, urgent_needs=%s, needs_resolution_stage=%s, is_pdn=%s, pdn_details=%s, is_sop=%s, sop_details=%s, updated_at=NOW() WHERE id=%s RETURNING *""",
        (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("alias"),
         body.get("birth_date") or None, body.get("address"), body.get("admission_date") or None,
         body.get("discharge_date") or None, body.get("case_description"),
         body.get("passport_series"), body.get("passport_number"),
         body.get("passport_issued_date") or None, body.get("passport_issued_by"),
         body.get("benefits_status") or None, body.get("urgent_needs"), body.get("needs_resolution_stage") or None,
         bool(body.get("is_pdn")), body.get("pdn_details"), bool(body.get("is_sop")), body.get("sop_details"), patient_id)
    )
    patient = cur.fetchone()
    conn.commit()
    return ok({"patient": dict(patient)})
