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


def handler(event: dict, context) -> dict:
    """CRM: управление пациентами. GET /? — список, GET /?id=N — карточка, POST / — создать, PUT /?id=N — обновить"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    patient_id = params.get("id")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == "GET":
        if patient_id:
            cur.execute(f"SELECT * FROM {SCHEMA}.patients WHERE id = %s", (patient_id,))
            patient = cur.fetchone()
            if not patient:
                return err("Пациент не найден", 404)
            cur.execute(f"SELECT * FROM {SCHEMA}.patient_children WHERE patient_id = %s ORDER BY birth_date", (patient_id,))
            children = cur.fetchall()
            cur.execute(f"SELECT * FROM {SCHEMA}.patient_documents WHERE patient_id = %s ORDER BY uploaded_at DESC", (patient_id,))
            documents = cur.fetchall()
            cur.execute(
                f"SELECT risk_level, report_date FROM {SCHEMA}.patient_daily_reports WHERE patient_id = %s ORDER BY report_date DESC, created_at DESC LIMIT 1",
                (patient_id,)
            )
            latest_dynamics = cur.fetchone()
            cur.execute(f"SELECT * FROM {SCHEMA}.patient_tasks WHERE patient_id = %s ORDER BY created_at DESC", (patient_id,))
            tasks = cur.fetchall()

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
                "children": [dict(c) for c in children],
                "documents": [dict(d) for d in documents],
                "latest_risk_level": latest_dynamics["risk_level"] if latest_dynamics else None,
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
                )
            """
            if search:
                cur.execute(
                    f"""WITH {latest_risk_cte}
                        SELECT p.*, COUNT(c.id) as children_count, lr.risk_level
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
                        SELECT p.*, COUNT(c.id) as children_count, lr.risk_level
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
                f"INSERT INTO {SCHEMA}.patient_children (patient_id, last_name, first_name, middle_name, birth_date) VALUES (%s,%s,%s,%s,%s) RETURNING *",
                (pid, body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None)
            )
            child = cur.fetchone()
            conn.commit()
            return ok({"child": dict(child)})

        if action == "delete_child":
            child_id = body.get("child_id")
            cur.execute(f"DELETE FROM {SCHEMA}.patient_children WHERE id = %s", (child_id,))
            conn.commit()
            return ok({"success": True})

        if action == "update_child":
            child_id = body.get("child_id")
            cur.execute(
                f"UPDATE {SCHEMA}.patient_children SET last_name=%s, first_name=%s, middle_name=%s, birth_date=%s WHERE id=%s RETURNING *",
                (body.get("last_name"), body.get("first_name"), body.get("middle_name"), body.get("birth_date") or None, child_id)
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
            stage_since = date.today().isoformat() if stage == "posttreatment" else None
            cur.execute(
                f"UPDATE {SCHEMA}.patients SET care_stage=%s, care_stage_since=%s, updated_at=NOW() WHERE id=%s RETURNING *",
                (stage, stage_since, pid)
            )
            patient = cur.fetchone()
            conn.commit()
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