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
    """GET /?limit=N — история вступительных сводок смены из бота Max, сортировка по дате отчёта (новые сверху)."""
    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 100)), 500)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.shift_logs ORDER BY report_date DESC, created_at DESC LIMIT %s",
        (limit,)
    )
    rows = cur.fetchall()
    conn.close()
    return ok({"logs": [dict(r) for r in rows]})


def handler(event: dict, context) -> dict:
    """Чтение истории вступительных сводок смены (shift_logs), приходящих из бота Max. GET /?limit=N — список записей."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    if method == "GET":
        return route_list(event)

    return {"statusCode": 405, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": "Метод не поддерживается"})}
