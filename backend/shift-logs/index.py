import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def route_list(event: dict) -> dict:
    """GET /?limit=N — история вступительных сводок смены из бота Max, сортировка по дате отчёта (новые сверху).
    К каждой сводке подтягивается список пациентов, по которым бот распознал отчёты в тот же день (report_date)."""
    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 100)), 500)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.shift_logs ORDER BY report_date DESC, created_at DESC LIMIT %s",
        (limit,)
    )
    logs = [dict(r) for r in cur.fetchall()]

    if logs:
        dates = sorted({log["report_date"] for log in logs})
        cur.execute(
            f"""SELECT r.patient_id, r.report_date, r.overall_state, r.problems_identified,
                       p.last_name, p.first_name, p.alias
                FROM {SCHEMA}.patient_daily_reports r
                JOIN {SCHEMA}.patients p ON p.id = r.patient_id
                WHERE r.report_date = ANY(%s) AND r.author = %s""",
            (dates, "Max-бот (смена)")
        )
        by_date: dict = {}
        for row in cur.fetchall():
            row = dict(row)
            d = row["report_date"]
            by_date.setdefault(d, []).append({
                "id": row["patient_id"],
                "last_name": row["last_name"],
                "first_name": row["first_name"],
                "alias": row["alias"],
                "overall_state": row["overall_state"],
                "identified_problems": row["problems_identified"],
            })
        for log in logs:
            log["patients"] = by_date.get(log["report_date"], [])

    conn.close()
    return ok({"logs": logs})


def handler(event: dict, context) -> dict:
    """Чтение истории вступительных сводок смены (shift_logs), приходящих из бота Max. GET /?limit=N — список записей."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    if method == "GET":
        return route_list(event)

    return {"statusCode": 405, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": "Метод не поддерживается"})}