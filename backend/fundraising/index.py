"""
Фандрайзинг — управление донорами (организации и физлица) и историей пожертвований.

GET  /?type=stats                          — общая статистика
GET  /?type=orgs                           — список организаций
GET  /?type=persons                        — список физлиц
GET  /?type=donations&donor_type=X&donor_id=N  — пожертвования конкретного донора

POST /?type=org                            — создать/обновить организацию
POST /?type=person                         — создать/обновить физлицо
POST /?type=donation                       — добавить пожертвование

DELETE /?type=org&id=N                     — удалить организацию
DELETE /?type=person&id=N                  — удалить физлицо
DELETE /?type=donation&id=N                — удалить пожертвование
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
        "isBase64Encoded": False,
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    qtype = params.get("type", "")

    conn = get_db()
    cur = conn.cursor()

    try:
        # ── GET ──────────────────────────────────────────────────────────────
        if method == "GET":

            if qtype == "stats":
                cur.execute("""
                    SELECT
                        (SELECT COUNT(*) FROM donors_orgs)                         AS orgs_total,
                        (SELECT COUNT(*) FROM donors_orgs WHERE status='active')   AS orgs_active,
                        (SELECT COUNT(*) FROM donors_persons)                      AS persons_total,
                        (SELECT COUNT(*) FROM donors_persons WHERE status='active') AS persons_active,
                        (SELECT COALESCE(SUM(amount),0) FROM donor_donations)      AS donations_total,
                        (SELECT COUNT(*) FROM donor_donations)                     AS donations_count,
                        (SELECT COALESCE(SUM(amount),0) FROM donor_donations
                         WHERE donated_at >= DATE_TRUNC('year', CURRENT_DATE))     AS donations_year,
                        (SELECT COALESCE(SUM(amount),0) FROM donor_donations
                         WHERE donated_at >= DATE_TRUNC('month', CURRENT_DATE))    AS donations_month
                """)
                r = cur.fetchone()
                return ok({
                    "orgs_total": r[0], "orgs_active": r[1],
                    "persons_total": r[2], "persons_active": r[3],
                    "donations_total": float(r[4]), "donations_count": r[5],
                    "donations_year": float(r[6]), "donations_month": float(r[7]),
                })

            if qtype == "orgs":
                cur.execute("""
                    SELECT o.id, o.name, o.phone, o.email, o.website, o.manager,
                           o.status, o.notes, o.created_at,
                           COALESCE(SUM(d.amount),0) AS total_donated,
                           COUNT(d.id) AS donations_count
                    FROM donors_orgs o
                    LEFT JOIN donor_donations d ON d.donor_type='org' AND d.donor_id=o.id
                    GROUP BY o.id
                    ORDER BY o.created_at DESC
                """)
                cols = ["id","name","phone","email","website","manager","status","notes","created_at","total_donated","donations_count"]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                for r in rows:
                    r["total_donated"] = float(r["total_donated"])
                return ok({"orgs": rows})

            if qtype == "persons":
                cur.execute("""
                    SELECT p.id, p.full_name, p.phone, p.email, p.source,
                           p.status, p.notes, p.created_at,
                           COALESCE(SUM(d.amount),0) AS total_donated,
                           COUNT(d.id) AS donations_count
                    FROM donors_persons p
                    LEFT JOIN donor_donations d ON d.donor_type='person' AND d.donor_id=p.id
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                """)
                cols = ["id","full_name","phone","email","source","status","notes","created_at","total_donated","donations_count"]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                for r in rows:
                    r["total_donated"] = float(r["total_donated"])
                return ok({"persons": rows})

            if qtype == "donations":
                donor_type = params.get("donor_type", "")
                donor_id = int(params.get("donor_id", 0))
                cur.execute("""
                    SELECT id, donor_type, donor_id, amount, donated_at, comment, created_at
                    FROM donor_donations
                    WHERE donor_type=%s AND donor_id=%s
                    ORDER BY donated_at DESC
                """, (donor_type, donor_id))
                cols = ["id","donor_type","donor_id","amount","donated_at","comment","created_at"]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                for r in rows:
                    r["amount"] = float(r["amount"])
                return ok({"donations": rows})

        # ── POST ─────────────────────────────────────────────────────────────
        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            if qtype == "org":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE donors_orgs SET name=%s, phone=%s, email=%s, website=%s,
                               manager=%s, status=%s, notes=%s WHERE id=%s RETURNING id
                    """, (body.get("name"), body.get("phone"), body.get("email"),
                          body.get("website"), body.get("manager"),
                          body.get("status","active"), body.get("notes"), oid))
                else:
                    cur.execute("""
                        INSERT INTO donors_orgs (name,phone,email,website,manager,status,notes)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("name"), body.get("phone"), body.get("email"),
                          body.get("website"), body.get("manager"),
                          body.get("status","active"), body.get("notes")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "person":
                pid = body.get("id")
                if pid:
                    cur.execute("""
                        UPDATE donors_persons SET full_name=%s, phone=%s, email=%s,
                               source=%s, status=%s, notes=%s WHERE id=%s RETURNING id
                    """, (body.get("full_name"), body.get("phone"), body.get("email"),
                          body.get("source"), body.get("status","active"),
                          body.get("notes"), pid))
                else:
                    cur.execute("""
                        INSERT INTO donors_persons (full_name,phone,email,source,status,notes)
                        VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("full_name"), body.get("phone"), body.get("email"),
                          body.get("source"), body.get("status","active"), body.get("notes")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "donation":
                cur.execute("""
                    INSERT INTO donor_donations (donor_type, donor_id, amount, donated_at, comment)
                    VALUES (%s,%s,%s,%s,%s) RETURNING id
                """, (body.get("donor_type"), body.get("donor_id"),
                      body.get("amount"), body.get("donated_at"), body.get("comment")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

        # ── DELETE ───────────────────────────────────────────────────────────
        if method == "DELETE":
            rid = int(params.get("id", 0))

            if qtype == "org":
                cur.execute("DELETE FROM donor_donations WHERE donor_type='org' AND donor_id=%s", (rid,))
                cur.execute("DELETE FROM donors_orgs WHERE id=%s", (rid,))
            elif qtype == "person":
                cur.execute("DELETE FROM donor_donations WHERE donor_type='person' AND donor_id=%s", (rid,))
                cur.execute("DELETE FROM donors_persons WHERE id=%s", (rid,))
            elif qtype == "donation":
                cur.execute("DELETE FROM donor_donations WHERE id=%s", (rid,))

            conn.commit()
            return ok({"ok": True})

    finally:
        cur.close()
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": "Method Not Allowed", "isBase64Encoded": False}
