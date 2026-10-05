import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Еженедельные отчёты по детям. GET ?child_id=N — список; POST — создать; PUT ?id=N — изменить; DELETE ?id=N — удалить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}") if method in ("POST", "PUT") else {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == "GET":
            child_id = params.get("child_id")
            if not child_id:
                return err("Параметр child_id обязателен")
            cur.execute(
                f"SELECT * FROM {SCHEMA}.child_weekly_reports WHERE child_id = %s ORDER BY week_start DESC, created_at DESC",
                (child_id,),
            )
            return ok({"reports": [dict(r) for r in cur.fetchall()]})

        if method == "POST":
            child_id = body.get("child_id")
            week_start = body.get("week_start")
            text = (body.get("report_text") or "").strip()
            if not child_id or not week_start:
                return err("Поля child_id и week_start обязательны")
            if not text:
                return err("Введите текст отчёта")
            cur.execute(
                f"INSERT INTO {SCHEMA}.child_weekly_reports (child_id, author, week_start, report_text) VALUES (%s,%s,%s,%s) RETURNING *",
                (child_id, (body.get("author") or "").strip() or None, week_start, text),
            )
            row = cur.fetchone()
            conn.commit()
            return ok({"report": dict(row)}, 201)

        if method == "PUT":
            report_id = params.get("id")
            week_start = body.get("week_start")
            text = (body.get("report_text") or "").strip()
            if not report_id:
                return err("Параметр id обязателен")
            if not week_start or not text:
                return err("Поля week_start и report_text обязательны")
            cur.execute(
                f"UPDATE {SCHEMA}.child_weekly_reports SET week_start=%s, report_text=%s, updated_at=NOW() WHERE id=%s RETURNING *",
                (week_start, text, report_id),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err("Отчёт не найден", 404)
            return ok({"report": dict(row)})

        if method == "DELETE":
            report_id = params.get("id")
            if not report_id:
                return err("Параметр id обязателен")
            cur.execute(f"DELETE FROM {SCHEMA}.child_weekly_reports WHERE id=%s RETURNING id", (report_id,))
            row = cur.fetchone()
            conn.commit()
            if not row:
                return err("Отчёт не найден", 404)
            return ok({"success": True})

        return err("Метод не поддерживается", 405)
    finally:
        conn.close()
