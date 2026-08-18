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

SCALES = (
    "scale_emotional", "scale_stress", "scale_sociability", "scale_activity",
    "scale_contact_mother", "scale_contact_peers", "scale_academic", "scale_work",
    "scale_attention", "scale_discipline",
)

TEXT_FIELDS = ("identified_problems", "taken_actions", "results")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def validate_scales(body: dict):
    """Оценки могут отсутствовать (null), но если переданы — должны быть целым числом от 1 до 10."""
    values = {}
    for scale in SCALES:
        if scale not in body:
            values[scale] = None
            continue
        v = body.get(scale)
        if v is None:
            values[scale] = None
            continue
        if not isinstance(v, int) or isinstance(v, bool) or not (1 <= v <= 10):
            return None, err(f"Поле {scale} должно быть целым числом от 1 до 10 или null")
        values[scale] = v
    return values, None


def route_list(event: dict) -> dict:
    """GET /?child_id=N — список отчётов по ребёнку, сортировка по report_date DESC."""
    params = event.get("queryStringParameters") or {}
    child_id = params.get("child_id")
    if not child_id:
        return err("Параметр child_id обязателен")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.child_daily_reports WHERE child_id = %s ORDER BY report_date DESC, created_at DESC",
        (child_id,)
    )
    rows = cur.fetchall()
    conn.close()
    return ok({"reports": [dict(r) for r in rows]})


def route_create(event: dict) -> dict:
    """POST / — создать новый ежедневный отчёт по ребёнку."""
    body = json.loads(event.get("body") or "{}")
    child_id = body.get("child_id")
    if not child_id:
        return err("Поле child_id обязательно")

    scale_values, error = validate_scales(body)
    if error:
        return error

    author = (body.get("author") or "").strip()
    report_date = body.get("report_date")
    text_values = {f: (body.get(f) or "").strip() for f in TEXT_FIELDS}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    columns = ["child_id", "author"] + (["report_date"] if report_date else []) + list(SCALES) + list(TEXT_FIELDS)
    placeholders = ", ".join(["%s"] * len(columns))
    values = [child_id, author] + ([report_date] if report_date else []) + [scale_values[s] for s in SCALES] + [text_values[f] for f in TEXT_FIELDS]

    cur.execute(
        f"INSERT INTO {SCHEMA}.child_daily_reports ({', '.join(columns)}) VALUES ({placeholders}) RETURNING *",
        values
    )
    report = cur.fetchone()
    conn.commit()
    conn.close()
    return ok({"report": dict(report)}, 201)


def route_update(event: dict) -> dict:
    """PUT /?id=N — обновить существующий отчёт."""
    params = event.get("queryStringParameters") or {}
    report_id = params.get("id")
    if not report_id:
        return err("Параметр id обязателен")

    body = json.loads(event.get("body") or "{}")
    scale_values, error = validate_scales(body)
    if error:
        return error

    author = (body.get("author") or "").strip()
    report_date = body.get("report_date")
    text_values = {f: (body.get(f) or "").strip() for f in TEXT_FIELDS}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    set_parts = ["author=%s"]
    values = [author]
    if report_date:
        set_parts.append("report_date=%s")
        values.append(report_date)
    for s in SCALES:
        set_parts.append(f"{s}=%s")
        values.append(scale_values[s])
    for f in TEXT_FIELDS:
        set_parts.append(f"{f}=%s")
        values.append(text_values[f])
    values.append(report_id)

    cur.execute(
        f"UPDATE {SCHEMA}.child_daily_reports SET {', '.join(set_parts)} WHERE id=%s RETURNING *",
        values
    )
    report = cur.fetchone()
    conn.commit()
    conn.close()
    if not report:
        return err("Отчёт не найден", 404)
    return ok({"report": dict(report)})


def route_delete(event: dict) -> dict:
    """DELETE /?id=N — удалить отчёт."""
    params = event.get("queryStringParameters") or {}
    report_id = params.get("id")
    if not report_id:
        return err("Параметр id обязателен")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"DELETE FROM {SCHEMA}.child_daily_reports WHERE id=%s RETURNING id", (report_id,))
    row = cur.fetchone()
    conn.commit()
    conn.close()
    if not row:
        return err("Отчёт не найден", 404)
    return ok({"success": True})


def handler(event: dict, context) -> dict:
    """Ежедневные отчёты по детям пациентов. GET /?child_id=N — список; POST / — создать; PUT /?id=N — обновить; DELETE /?id=N — удалить."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        return route_list(event)
    if method == "POST":
        return route_create(event)
    if method == "PUT":
        return route_update(event)
    if method == "DELETE":
        return route_delete(event)

    return err("Метод не поддерживается", 405)
