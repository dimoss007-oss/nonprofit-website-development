import json
import os
from datetime import date, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

SCALES = ("mood", "anxiety", "sleep", "appetite", "social_activity", "aggression")
# Для этих шкал НИЗКОЕ значение — тревожный сигнал (плохое настроение, сон, аппетит, соц. активность)
LOW_IS_BAD = ("mood", "sleep", "appetite", "social_activity")
# Для этих шкал ВЫСОКОЕ значение — тревожный сигнал (тревожность, агрессия)
HIGH_IS_BAD = ("anxiety", "aggression")

LABELS = {
    "mood": "Настроение",
    "anxiety": "Тревожность",
    "sleep": "Сон",
    "appetite": "Аппетит",
    "social_activity": "Социальная активность",
    "aggression": "Агрессия",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def calc_risk(report: dict, history: list) -> tuple:
    """Считает маркеры риска по прозрачным правилам: критические разовые значения + устойчивый тренд ухудшения за последние 3 дня."""
    markers = []

    for scale in LOW_IS_BAD:
        v = report[scale]
        if v <= 1:
            markers.append(f"{LABELS[scale]}: критически низкий показатель ({v}/5)")
        elif v == 2:
            markers.append(f"{LABELS[scale]}: сниженный показатель ({v}/5)")

    for scale in HIGH_IS_BAD:
        v = report[scale]
        if v >= 5:
            markers.append(f"{LABELS[scale]}: критически высокий показатель ({v}/5)")
        elif v == 4:
            markers.append(f"{LABELS[scale]}: повышенный показатель ({v}/5)")

    recent = history[-3:] if len(history) >= 3 else []
    if len(recent) == 3:
        for scale in LOW_IS_BAD:
            vals = [r[scale] for r in recent] + [report[scale]]
            if all(vals[i] >= vals[i + 1] for i in range(len(vals) - 1)) and vals[0] > vals[-1]:
                markers.append(f"{LABELS[scale]}: устойчивое снижение 3+ дня подряд")
        for scale in HIGH_IS_BAD:
            vals = [r[scale] for r in recent] + [report[scale]]
            if all(vals[i] <= vals[i + 1] for i in range(len(vals) - 1)) and vals[0] < vals[-1]:
                markers.append(f"{LABELS[scale]}: устойчивый рост 3+ дня подряд")

    has_critical = any(report[s] <= 1 for s in LOW_IS_BAD) or any(report[s] >= 5 for s in HIGH_IS_BAD)
    has_trend = any("устойчив" in m for m in markers)

    if has_critical:
        level = "high"
    elif has_trend or len(markers) >= 2:
        level = "attention"
    else:
        level = "none"

    return markers, level


def route_create(event: dict) -> dict:
    """POST / — сохранить ежедневный отчёт по пациенту и рассчитать маркеры риска."""
    body = json.loads(event.get("body") or "{}")

    patient_id = body.get("patient_id")
    author = (body.get("author") or "").strip()
    report_date = body.get("report_date") or date.today().isoformat()

    if not patient_id or not author:
        return err("Поля patient_id и author обязательны")

    scale_values = {}
    for scale in SCALES:
        v = body.get(scale)
        if v is None or not isinstance(v, int) or not (1 <= v <= 5):
            return err(f"Поле {scale} должно быть целым числом от 1 до 5")
        scale_values[scale] = v

    notes = (body.get("notes") or "").strip()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    since = (date.fromisoformat(report_date) - timedelta(days=10)).isoformat()
    cur.execute(
        f"""SELECT * FROM {SCHEMA}.patient_daily_reports
            WHERE patient_id = %s AND report_date >= %s AND report_date < %s
            ORDER BY report_date ASC""",
        (patient_id, since, report_date),
    )
    history = [dict(r) for r in cur.fetchall()]

    markers, risk_level = calc_risk(scale_values, history)

    cur.execute(
        f"""INSERT INTO {SCHEMA}.patient_daily_reports
            (patient_id, author, report_date, mood, anxiety, sleep, appetite, social_activity, aggression, notes, risk_markers, risk_level)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (patient_id, report_date, author) DO UPDATE SET
                mood=EXCLUDED.mood, anxiety=EXCLUDED.anxiety, sleep=EXCLUDED.sleep,
                appetite=EXCLUDED.appetite, social_activity=EXCLUDED.social_activity,
                aggression=EXCLUDED.aggression, notes=EXCLUDED.notes,
                risk_markers=EXCLUDED.risk_markers, risk_level=EXCLUDED.risk_level
            RETURNING *""",
        (
            patient_id, author, report_date,
            scale_values["mood"], scale_values["anxiety"], scale_values["sleep"],
            scale_values["appetite"], scale_values["social_activity"], scale_values["aggression"],
            notes, json.dumps(markers), risk_level,
        ),
    )
    report = dict(cur.fetchone())
    conn.commit()
    conn.close()

    return ok({"report": report}, 201)


def route_list(event: dict, patient_id: str) -> dict:
    """GET /?patient_id=N — вся история отчётов по пациенту для дашборда динамики."""
    params = event.get("queryStringParameters") or {}
    limit = min(int(params.get("limit", 60)), 200)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        f"""SELECT * FROM {SCHEMA}.patient_daily_reports
            WHERE patient_id = %s
            ORDER BY report_date DESC LIMIT %s""",
        (patient_id, limit),
    )
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return ok({"reports": list(reversed(rows))})


def handler(event: dict, context) -> dict:
    """База ежедневных психологических отчётов по резидентам. POST / — сохранить отчёт (расчёт маркеров риска по правилам, без внешних ИИ);
    GET /?patient_id=N — история отчётов пациента для дашборда динамики."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "POST":
        return route_create(event)

    if method == "GET":
        patient_id = (params.get("patient_id") or "").strip()
        if not patient_id:
            return err("Параметр patient_id обязателен")
        return route_list(event, patient_id)

    return err("Метод не поддерживается", 405)
