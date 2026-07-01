import json
import os
import psycopg2  # noqa

def handler(event: dict, context) -> dict:
    """CRUD для госорганов: организации, контакты, документы."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    def ok(data):
        return {"statusCode": 200, "headers": {**cors, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

    def err(msg, code=400):
        return {"statusCode": code, "headers": cors, "body": json.dumps({"error": msg})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    qtype = params.get("type", "agencies")
    body = json.loads(event.get("body") or "{}") if method in ("POST", "PUT") else {}

    # ── GET ──────────────────────────────────────────────────────────────────
    if method == "GET":
        if qtype == "agencies":
            cur.execute("""
                SELECT id, name, phone, address, service_phone,
                       contact_person, contact_phone, has_contact,
                       email, working_hours, notes, created_at
                FROM gov_agencies WHERE archived = FALSE ORDER BY name ASC
            """)
            cols = ["id","name","phone","address","service_phone",
                    "contact_person","contact_phone","has_contact",
                    "email","working_hours","notes","created_at"]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return ok({"agencies": rows})

        if qtype == "documents":
            agency_id = int(params.get("agency_id", 0))
            cur.execute("""
                SELECT id, agency_id, title, url, notes, doc_date, created_at
                FROM gov_agency_documents
                WHERE agency_id = %s AND archived = FALSE ORDER BY created_at DESC
            """, (agency_id,))
            cols = ["id","agency_id","title","url","notes","doc_date","created_at"]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return ok({"documents": rows})

    # ── POST ─────────────────────────────────────────────────────────────────
    if method == "POST":
        if qtype == "agency":
            aid = body.get("id")
            has_contact = bool(body.get("has_contact", False))
            if aid:
                cur.execute("""
                    UPDATE gov_agencies SET name=%s, phone=%s, address=%s,
                           service_phone=%s, contact_person=%s, contact_phone=%s,
                           has_contact=%s, email=%s, working_hours=%s, notes=%s
                    WHERE id=%s RETURNING id
                """, (body.get("name"), body.get("phone"), body.get("address"),
                      body.get("service_phone"), body.get("contact_person"),
                      body.get("contact_phone"), has_contact,
                      body.get("email"), body.get("working_hours"), body.get("notes"), aid))
            else:
                cur.execute("""
                    INSERT INTO gov_agencies (name, phone, address, service_phone, contact_person, contact_phone, has_contact, email, working_hours, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                """, (body.get("name"), body.get("phone"), body.get("address"),
                      body.get("service_phone"), body.get("contact_person"),
                      body.get("contact_phone"), has_contact,
                      body.get("email"), body.get("working_hours"), body.get("notes")))
            new_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return ok({"id": new_id})

        if qtype == "document":
            cur.execute("""
                INSERT INTO gov_agency_documents (agency_id, title, url, notes, doc_date)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (body.get("agency_id"), body.get("title"), body.get("url"),
                  body.get("notes"), body.get("doc_date") or None))
            new_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return ok({"id": new_id})

        if qtype == "toggle_contact":
            aid = int(body.get("id", 0))
            value = bool(body.get("has_contact", False))
            cur.execute("UPDATE gov_agencies SET has_contact = %s WHERE id = %s", (value, aid))
            conn.commit(); cur.close(); conn.close()
            return ok({"ok": True})

        if qtype == "archive_agency":
            aid = int(body.get("id", 0))
            cur.execute("UPDATE gov_agencies SET archived = TRUE WHERE id = %s", (aid,))
            conn.commit(); cur.close(); conn.close()
            return ok({"ok": True})

        if qtype == "archive_document":
            did = int(body.get("id", 0))
            cur.execute("UPDATE gov_agency_documents SET archived = TRUE WHERE id = %s", (did,))
            conn.commit(); cur.close(); conn.close()
            return ok({"ok": True})

        if qtype == "contact":
            cid = body.get("id")
            if cid:
                cur.execute("""
                    UPDATE gov_agency_contacts SET name=%s, phone=%s, role=%s WHERE id=%s RETURNING id
                """, (body.get("name"), body.get("phone"), body.get("role"), cid))
            else:
                cur.execute("""
                    INSERT INTO gov_agency_contacts (agency_id, name, phone, role)
                    VALUES (%s, %s, %s, %s) RETURNING id
                """, (body.get("agency_id"), body.get("name"), body.get("phone"), body.get("role")))
            new_id = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return ok({"id": new_id})

        if qtype == "archive_contact":
            cid = int(body.get("id", 0))
            cur.execute("UPDATE gov_agency_contacts SET archived = TRUE WHERE id = %s", (cid,))
            conn.commit(); cur.close(); conn.close()
            return ok({"ok": True})

    if method == "GET":
        if qtype == "contacts":
            agency_id = int(params.get("agency_id", 0))
            cur.execute("""
                SELECT id, agency_id, name, phone, role, created_at
                FROM gov_agency_contacts
                WHERE agency_id = %s AND archived = FALSE ORDER BY created_at ASC
            """, (agency_id,))
            cols = ["id","agency_id","name","phone","role","created_at"]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.close(); conn.close()
            return ok({"contacts": rows})

    cur.close(); conn.close()
    return err("Unknown request", 404)