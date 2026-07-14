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
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def handler(event: dict, context) -> dict:
    """СОП: база семей в социально опасном положении. GET /? — список, GET /?id=N — карточка, POST / — создать, PUT /?id=N — обновить, DELETE /?id=N — удалить"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    family_id = params.get("id")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if method == "GET":
        if family_id:
            cur.execute(f"SELECT * FROM {SCHEMA}.sop_families WHERE id = %s", (family_id,))
            family = cur.fetchone()
            cur.close()
            conn.close()
            if not family:
                return err("Семья не найдена", 404)
            return ok({"family": dict(family)})
        else:
            search = params.get("search", "")
            district = params.get("district", "")
            conditions = []
            values = []
            if search:
                conditions.append("(last_name ILIKE %s OR first_name ILIKE %s OR middle_name ILIKE %s)")
                values += [f"%{search}%", f"%{search}%", f"%{search}%"]
            if district:
                conditions.append("district = %s")
                values.append(district)
            where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
            cur.execute(f"SELECT * FROM {SCHEMA}.sop_families {where} ORDER BY (status = 'active') DESC, created_at DESC", values)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return ok({"families": [dict(r) for r in rows]})

    body = json.loads(event.get("body") or "{}")

    if method == "POST":
        cur.execute(
            f"""INSERT INTO {SCHEMA}.sop_families
                (last_name, first_name, middle_name, phone, email, address, district, case_description, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (body.get("last_name"), body.get("first_name"), body.get("middle_name"),
             body.get("phone"), body.get("email"), body.get("address"), body.get("district"),
             body.get("case_description"), body.get("status") or "active")
        )
        family = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return ok({"family": dict(family)}, 201)

    if method == "PUT" and family_id:
        cur.execute(
            f"""UPDATE {SCHEMA}.sop_families SET
                last_name=%s, first_name=%s, middle_name=%s, phone=%s, email=%s,
                address=%s, district=%s, case_description=%s, status=%s, updated_at=NOW()
                WHERE id=%s RETURNING *""",
            (body.get("last_name"), body.get("first_name"), body.get("middle_name"),
             body.get("phone"), body.get("email"), body.get("address"), body.get("district"),
             body.get("case_description"), body.get("status") or "active", family_id)
        )
        family = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not family:
            return err("Семья не найдена", 404)
        return ok({"family": dict(family)})

    if method == "DELETE" and family_id:
        cur.execute(f"DELETE FROM {SCHEMA}.sop_families WHERE id = %s", (family_id,))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"success": True})

    cur.close()
    conn.close()
    return err("Метод не поддерживается", 405)
