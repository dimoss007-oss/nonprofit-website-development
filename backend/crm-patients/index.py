import json

from psycopg2.extras import RealDictCursor

import children
import patients
import summaries
from crm_common import CORS, get_conn, err


def route_get(cur, conn, params):
    view = params.get("view")
    has_patient = bool(params.get("id"))
    has_child = bool(params.get("child_id"))

    if view == "text_summary" and has_patient:
        return summaries.get_text_summary(cur, conn, params, {})
    if view == "yandex_summary" and has_patient:
        return summaries.get_yandex_summary(cur, conn, params, {})
    if view == "ai_settings":
        return summaries.get_ai_settings(cur, conn, params, {})
    if view == "stats":
        return patients.get_stats(cur, conn, params, {})
    if view == "children":
        return children.get_children_list(cur, conn, params, {})
    if view == "child" and has_child:
        return children.get_child(cur, conn, params, {})
    if has_child:
        return children.get_child_summaries(cur, conn, params, {})
    if has_patient:
        return patients.get_patient_card(cur, conn, params, {})
    return patients.get_patients_list(cur, conn, params, {})


POST_ACTIONS = {
    "delete_patient": patients.delete_patient,
    "delete_document": patients.delete_document,
    "add_task": patients.add_task,
    "complete_task": patients.complete_task,
    "set_care_stage": patients.set_care_stage,
    "update_care_stage_since": patients.update_care_stage_since,
    "add_child": children.add_child,
    "delete_child": children.delete_child,
    "update_child": children.update_child,
    "generate_child_summary": children.generate_child_summary,
    "generate_child_yandex_summary": children.generate_child_yandex_summary_action,
    "save_child_summary": children.save_child_summary,
    "update_ai_settings": summaries.update_ai_settings,
    "generate_and_save_yandex_summary": summaries.generate_and_save_yandex_summary,
    "generate_characteristic_docx": summaries.generate_characteristic_docx,
    "save_local_summary": summaries.save_local_summary,
}


def handler(event: dict, context) -> dict:
    """CRM: пациенты, дети, задачи и ИИ-сводки.
    GET: список пациентов, ?id=N карточка, ?view=children|child|stats|ai_settings|text_summary|yandex_summary.
    POST action=...: delete_patient, delete_document, add_task, complete_task, set_care_stage, update_care_stage_since,
    add_child, update_child, delete_child, generate_child_summary, generate_child_yandex_summary, save_child_summary,
    update_ai_settings, generate_and_save_yandex_summary, generate_characteristic_docx, save_local_summary.
    POST без action — создать пациента; PUT ?id=N — обновить пациента.
    Сводки через YandexGPT отправляются с анонимизированными ФИО."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == "GET":
            return route_get(cur, conn, params)

        body = json.loads(event.get("body") or "{}")

        if method == "POST":
            action = body.get("action")
            if not action:
                return patients.create_patient(cur, conn, params, body)
            route = POST_ACTIONS.get(action)
            if route:
                return route(cur, conn, params, body)
            return patients.create_patient(cur, conn, params, body)

        if method == "PUT" and params.get("id"):
            return patients.update_patient(cur, conn, params, body)

        return err("Метод не поддерживается", 405)
    finally:
        conn.close()
