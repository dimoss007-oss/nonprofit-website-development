import json
import os
from datetime import date, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}

SCALES = (
    "overall_state", "contact_children", "contact_surroundings", "contact_staff", "engagement_level",
    "negative_behavior_level", "positive_thinking_level", "tasks_completion",
    "feelings_diary_usage", "self_analysis_usage",
)
# Для этих шкал НИЗКОЕ значение — тревожный сигнал (мало контакта, вовлечённости, позитивного мышления и т.д.)
LOW_IS_BAD = (
    "overall_state", "contact_children", "contact_surroundings", "contact_staff", "engagement_level",
    "positive_thinking_level", "tasks_completion", "feelings_diary_usage", "self_analysis_usage",
)
# Для этих шкал ВЫСОКОЕ значение — тревожный сигнал (негативное поведение)
HIGH_IS_BAD = ("negative_behavior_level",)

LABELS = {
    "overall_state": "Общее состояние",
    "contact_children": "Контакт с детьми",
    "contact_surroundings": "Контакт с окружающими",
    "contact_staff": "Контакт с сотрудниками",
    "engagement_level": "Уровень вовлечённости в процесс",
    "negative_behavior_level": "Уровень проявления негативного поведения",
    "positive_thinking_level": "Уровень применения позитивного мышления",
    "tasks_completion": "Выполнение основных заданий",
    "feelings_diary_usage": "Применение инструмента «Дневник чувств»",
    "self_analysis_usage": "Применение инструмента «Самоанализ»",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def calc_risk(report: dict, history: list) -> tuple:
    """Считает маркеры риска по прозрачным правилам: критические разовые значения + устойчивый тренд ухудшения за последние 3 дня. Шкала 0-10."""
    markers = []

    for scale in LOW_IS_BAD:
        v = report[scale]
        if v <= 2:
            markers.append(f"{LABELS[scale]}: критически низкий показатель ({v}/10)")
        elif v <= 4:
            markers.append(f"{LABELS[scale]}: сниженный показатель ({v}/10)")

    for scale in HIGH_IS_BAD:
        v = report[scale]
        if v >= 9:
            markers.append(f"{LABELS[scale]}: критически высокий показатель ({v}/10)")
        elif v >= 7:
            markers.append(f"{LABELS[scale]}: повышенный показатель ({v}/10)")

    # Историю берём только из отчётов, где уже заполнены новые шкалы (старые записи пропускаем)
    recent_full = [r for r in history if all(r.get(s) is not None for s in SCALES)]
    recent = recent_full[-3:] if len(recent_full) >= 3 else []
    if len(recent) == 3:
        for scale in LOW_IS_BAD:
            vals = [r[scale] for r in recent] + [report[scale]]
            if all(vals[i] >= vals[i + 1] for i in range(len(vals) - 1)) and vals[0] > vals[-1]:
                markers.append(f"{LABELS[scale]}: устойчивое снижение 3+ дня подряд")
        for scale in HIGH_IS_BAD:
            vals = [r[scale] for r in recent] + [report[scale]]
            if all(vals[i] <= vals[i + 1] for i in range(len(vals) - 1)) and vals[0] < vals[-1]:
                markers.append(f"{LABELS[scale]}: устойчивый рост 3+ дня подряд")

    has_critical = any(report[s] <= 2 for s in LOW_IS_BAD) or any(report[s] >= 9 for s in HIGH_IS_BAD)
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
        if v is None or not isinstance(v, int) or not (0 <= v <= 10):
            return err(f"Поле {scale} должно быть целым числом от 0 до 10")
        scale_values[scale] = v

    notes = (body.get("notes") or "").strip()
    problems_identified = (body.get("problems_identified") or "").strip()
    actions_taken = (body.get("actions_taken") or "").strip()
    results = (body.get("results") or "").strip()

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
            (patient_id, author, report_date, mood, anxiety, sleep, appetite, social_activity, aggression,
             overall_state, contact_children, contact_surroundings, contact_staff, engagement_level, negative_behavior_level,
             positive_thinking_level, tasks_completion, feelings_diary_usage, self_analysis_usage,
             notes, risk_markers, risk_level, problems_identified, actions_taken, results)
            VALUES (%s,%s,%s,0,0,0,0,0,0,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (patient_id, report_date, author) DO UPDATE SET
                overall_state=EXCLUDED.overall_state,
                contact_children=EXCLUDED.contact_children, contact_surroundings=EXCLUDED.contact_surroundings,
                contact_staff=EXCLUDED.contact_staff, engagement_level=EXCLUDED.engagement_level,
                negative_behavior_level=EXCLUDED.negative_behavior_level,
                positive_thinking_level=EXCLUDED.positive_thinking_level,
                tasks_completion=EXCLUDED.tasks_completion, feelings_diary_usage=EXCLUDED.feelings_diary_usage,
                self_analysis_usage=EXCLUDED.self_analysis_usage, notes=EXCLUDED.notes,
                risk_markers=EXCLUDED.risk_markers, risk_level=EXCLUDED.risk_level,
                problems_identified=EXCLUDED.problems_identified, actions_taken=EXCLUDED.actions_taken,
                results=EXCLUDED.results
            RETURNING *""",
        (
            patient_id, author, report_date,
            scale_values["overall_state"],
            scale_values["contact_children"], scale_values["contact_surroundings"], scale_values["contact_staff"],
            scale_values["engagement_level"], scale_values["negative_behavior_level"],
            scale_values["positive_thinking_level"], scale_values["tasks_completion"],
            scale_values["feelings_diary_usage"], scale_values["self_analysis_usage"],
            notes, json.dumps(markers), risk_level, problems_identified, actions_taken, results,
        ),
    )
    report = dict(cur.fetchone())
    conn.commit()
    conn.close()

    return ok({"report": report}, 201)


def route_update(event: dict) -> dict:
    """PUT /?id=N — обновить существующий отчёт (включая дату) и пересчитать маркеры риска."""
    params = event.get("queryStringParameters") or {}
    report_id = params.get("id")
    if not report_id:
        return err("Параметр id обязателен")

    body = json.loads(event.get("body") or "{}")
    author = (body.get("author") or "").strip()
    if not author:
        return err("Поле author обязательно")

    scale_values = {}
    for scale in SCALES:
        v = body.get(scale)
        if v is None or not isinstance(v, int) or not (0 <= v <= 10):
            return err(f"Поле {scale} должно быть целым числом от 0 до 10")
        scale_values[scale] = v

    notes = (body.get("notes") or "").strip()
    problems_identified = (body.get("problems_identified") or "").strip()
    actions_taken = (body.get("actions_taken") or "").strip()
    results = (body.get("results") or "").strip()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"SELECT * FROM {SCHEMA}.patient_daily_reports WHERE id = %s", (report_id,))
    existing = cur.fetchone()
    if not existing:
        return err("Отчёт не найден", 404)

    patient_id = existing["patient_id"]
    report_date = body.get("report_date") or existing["report_date"].isoformat()

    since = (date.fromisoformat(report_date) - timedelta(days=10)).isoformat()
    cur.execute(
        f"""SELECT * FROM {SCHEMA}.patient_daily_reports
            WHERE patient_id = %s AND report_date >= %s AND report_date < %s AND id != %s
            ORDER BY report_date ASC""",
        (patient_id, since, report_date, report_id),
    )
    history = [dict(r) for r in cur.fetchall()]

    markers, risk_level = calc_risk(scale_values, history)

    cur.execute(
        f"""UPDATE {SCHEMA}.patient_daily_reports SET
            report_date=%s, overall_state=%s, contact_children=%s, contact_surroundings=%s, contact_staff=%s,
            engagement_level=%s, negative_behavior_level=%s, positive_thinking_level=%s, tasks_completion=%s,
            feelings_diary_usage=%s, self_analysis_usage=%s, notes=%s, risk_markers=%s, risk_level=%s,
            problems_identified=%s, actions_taken=%s, results=%s
            WHERE id=%s RETURNING *""",
        (
            report_date,
            scale_values["overall_state"],
            scale_values["contact_children"], scale_values["contact_surroundings"], scale_values["contact_staff"],
            scale_values["engagement_level"], scale_values["negative_behavior_level"],
            scale_values["positive_thinking_level"], scale_values["tasks_completion"],
            scale_values["feelings_diary_usage"], scale_values["self_analysis_usage"],
            notes, json.dumps(markers), risk_level, problems_identified, actions_taken, results,
            report_id,
        ),
    )
    report = dict(cur.fetchone())
    conn.commit()
    conn.close()

    return ok({"report": report})


def route_delete(event: dict) -> dict:
    """DELETE /?id=N — удалить отчёт."""
    params = event.get("queryStringParameters") or {}
    report_id = params.get("id")
    if not report_id:
        return err("Параметр id обязателен")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(f"DELETE FROM {SCHEMA}.patient_daily_reports WHERE id=%s RETURNING id", (report_id,))
    row = cur.fetchone()
    conn.commit()
    conn.close()
    if not row:
        return err("Отчёт не найден", 404)
    return ok({"success": True})


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
    GET /?patient_id=N — история отчётов пациента для дашборда динамики; PUT /?id=N — обновить отчёт; DELETE /?id=N — удалить отчёт."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "POST":
        return route_create(event)

    if method == "PUT":
        return route_update(event)

    if method == "DELETE":
        return route_delete(event)

    if method == "GET":
        patient_id = (params.get("patient_id") or "").strip()
        if not patient_id:
            return err("Параметр patient_id обязателен")
        return route_list(event, patient_id)

    return err("Метод не поддерживается", 405)