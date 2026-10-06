import difflib
import json
import os
import re
from datetime import datetime, timedelta

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

LINE_RE = re.compile(r"^\s*(?:\d+\s*[.)]\s*)?([^\-\u2014\u2013:]{2,40}?)\s*[-\u2014\u2013:]\s*(.+)$")
NAME_CUTOFF = 0.8

DIMINUTIVES = {
    "аня": "анна", "катя": "екатерина", "света": "светлана", "настя": "анастасия",
    "таня": "татьяна", "наташа": "наталья", "саша": "александр", "лена": "елена",
    "оля": "ольга", "женя": "евгений", "дима": "дмитрий", "маша": "мария",
    "юля": "юлия", "надя": "надежда", "люда": "людмила", "вика": "виктория",
    "ксюша": "ксения", "лиза": "елизавета", "даша": "дарья", "паша": "павел",
    "коля": "николай", "миша": "михаил", "вова": "владимир", "гена": "геннадий",
    "толя": "анатолий", "валя": "валентина", "галя": "галина", "тоня": "антонина",
    "стас": "станислав", "сережа": "сергей", "серёжа": "сергей", "мирося": "мирослава",
}


def norm(value: str) -> str:
    return re.sub(r"[.\s]+", " ", (value or "").strip().lower().replace("ё", "е")).strip()


def monday_of(raw: str) -> str:
    d = datetime.strptime(raw[:10], "%Y-%m-%d").date()
    return (d - timedelta(days=d.weekday())).isoformat()


def load_children(cur) -> list:
    cur.execute(
        f"""SELECT c.id, c.first_name, c.last_name, c.middle_name, c.alias,
                   p.first_name AS mother_first_name, p.last_name AS mother_last_name, p.alias AS mother_alias
            FROM {SCHEMA}.patient_children c
            JOIN {SCHEMA}.patients p ON p.id = c.patient_id
            WHERE p.discharge_date IS NULL AND (p.care_stage IS NULL OR p.care_stage = 'inpatient')
            ORDER BY c.last_name, c.first_name"""
    )
    rows = [dict(r) for r in cur.fetchall()]
    for r in rows:
        r["display_name"] = " ".join(x for x in (r["last_name"], r["first_name"]) if x)
        if r.get("alias"):
            r["display_name"] += f" ({r['alias']})"
    return rows


def build_index(children: list) -> dict:
    index = {}
    for c in children:
        first = norm(c["first_name"])
        last = norm(c["last_name"])
        keys = {first}
        alias = norm(c.get("alias") or "")
        if alias:
            keys.add(alias)
        if last:
            keys.update({last, f"{first} {last}", f"{last} {first}", f"{first} {last[:1]}"})
        for key in keys:
            if key:
                index.setdefault(key, []).append(c["id"])
    return index


def expand(name: str) -> str:
    parts = name.split(" ", 1)
    full = DIMINUTIVES.get(parts[0])
    if not full:
        return name
    return f"{full} {parts[1] if len(parts) > 1 else ''}".strip()


def match_children(name: str, index: dict) -> list:
    n = norm(name)
    if not n:
        return []
    variants = [n]
    e = norm(expand(n))
    if e != n:
        variants.append(e)
    for v in variants:
        if v in index:
            return list(dict.fromkeys(index[v]))
    for v in variants:
        close = difflib.get_close_matches(v, list(index.keys()), n=1, cutoff=NAME_CUTOFF)
        if close:
            return list(dict.fromkeys(index[close[0]]))
    return []


def parse_report(text: str, children: list) -> list:
    """Разбирает текст построчно: строка вида «Имя - состояние» начинает блок ребёнка,
    строки без имени дописываются к текущему блоку."""
    index = build_index(children)
    by_id = {c["id"]: c for c in children}
    blocks = []
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        m = LINE_RE.match(line)
        name_part = m.group(1).strip() if m else ""
        words = name_part.split()
        found = match_children(name_part, index) if m and 1 <= len(words) <= 3 else []
        looks_like_name = bool(m) and 1 <= len(words) <= 3 and (bool(found) or name_part[:1].isupper())
        if looks_like_name:
            blocks.append({"name_in_text": name_part, "text": m.group(2).strip(), "candidate_ids": found})
        elif blocks:
            blocks[-1]["text"] += "\n" + line
    result = []
    for b in blocks:
        ids = b["candidate_ids"]
        result.append({
            "name_in_text": b["name_in_text"],
            "text": b["text"],
            "child_id": ids[0] if len(ids) == 1 else None,
            "child_name": by_id[ids[0]]["display_name"] if len(ids) == 1 else None,
            "status": "matched" if len(ids) == 1 else ("ambiguous" if len(ids) > 1 else "unmatched"),
            "candidates": [{"id": i, "name": by_id[i]["display_name"], "mother": by_id[i]["mother_alias"] or by_id[i]["mother_last_name"]} for i in ids],
        })
    return result


def handler(event: dict, context) -> dict:
    """Еженедельные отчёты по детям. GET ?child_id=N — список; POST — создать; PUT ?id=N — изменить; DELETE ?id=N — удалить.
    POST {action: parse} — разбор общего текста по детям; POST {action: import} — сохранение разобранного отчёта."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}") if method in ("POST", "PUT") else {}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == "POST" and body.get("action") in ("parse", "import"):
            action = body["action"]
            week_start = body.get("week_start")
            if not week_start:
                return err("Укажите неделю отчёта")
            week_start = monday_of(week_start)

            if action == "parse":
                text = (body.get("report_text") or "").strip()
                if not text:
                    return err("Вставьте текст отчёта")
                children = load_children(cur)
                items = parse_report(text, children)
                if not items:
                    return err("Не нашёл ни одной строки вида «Имя - состояние». Проверьте формат отчёта")
                return ok({
                    "week_start": week_start,
                    "items": items,
                    "children": [{"id": c["id"], "name": c["display_name"], "mother": c["mother_alias"] or c["mother_last_name"]} for c in children],
                })

            items = body.get("items") or []
            author = (body.get("author") or "").strip() or None
            merged = {}
            for it in items:
                child_id = it.get("child_id")
                text = (it.get("text") or "").strip()
                if child_id and text:
                    merged[int(child_id)] = (merged.get(int(child_id)) + "\n" if int(child_id) in merged else "") + text
            if not merged:
                return err("Нет отчётов для сохранения")
            created = updated = 0
            for child_id, text in merged.items():
                cur.execute(f"SELECT id FROM {SCHEMA}.child_weekly_reports WHERE child_id=%s AND week_start=%s ORDER BY id LIMIT 1", (child_id, week_start))
                existing = cur.fetchone()
                if existing:
                    cur.execute(f"UPDATE {SCHEMA}.child_weekly_reports SET report_text=%s, author=COALESCE(%s, author), updated_at=NOW() WHERE id=%s", (text, author, existing["id"]))
                    updated += 1
                else:
                    cur.execute(f"INSERT INTO {SCHEMA}.child_weekly_reports (child_id, author, week_start, report_text) VALUES (%s,%s,%s,%s)", (child_id, author, week_start, text))
                    created += 1
            conn.commit()
            return ok({"created": created, "updated": updated}, 201)

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
