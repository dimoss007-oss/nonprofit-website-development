"""
Fundraising CRM — история взаимодействий, кампании, проекты, документы, задачи, метрики.

GET  /?type=interactions&donor_type=X&donor_id=N   — история взаимодействий донора
GET  /?type=campaigns                               — все кампании
GET  /?type=projects                               — все проекты
GET  /?type=documents&donor_type=X&donor_id=N      — документы донора
GET  /?type=documents&campaign_id=N                — документы кампании
GET  /?type=documents&project_id=N                 — документы проекта
GET  /?type=documents&all=1                        — все документы
GET  /?type=tasks&donor_type=X&donor_id=N          — задачи донора
GET  /?type=tasks&all=1                            — все активные задачи
GET  /?type=metrics&donor_type=X&donor_id=N        — метрики донора
GET  /?type=kpi                                    — KPI за периоды

POST /?type=interaction                            — создать/обновить взаимодействие
POST /?type=campaign                               — создать/обновить кампанию
POST /?type=project                                — создать/обновить проект
POST /?type=document                               — создать/обновить документ
POST /?type=task                                   — создать/обновить задачу
POST /?type=task_done&id=N                         — отметить задачу выполненной
POST /?type=metrics                                — сохранить метрики донора

DELETE /?type=interaction&id=N
DELETE /?type=campaign&id=N
DELETE /?type=project&id=N
DELETE /?type=document&id=N
DELETE /?type=task&id=N
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


def rows_to_dicts(cur, float_fields=None):
    cols = [d[0] for d in cur.description]
    rows = []
    for r in cur.fetchall():
        d = dict(zip(cols, r))
        if float_fields:
            for f in float_fields:
                if d.get(f) is not None:
                    d[f] = float(d[f])
        rows.append(d)
    return rows


def handler(event: dict, context) -> dict:
    """Fundraising CRM — история, кампании, проекты, задачи, документы, метрики."""
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

            if qtype == "interactions":
                donor_type = params.get("donor_type")
                donor_id = params.get("donor_id")
                if donor_type and donor_id:
                    cur.execute("""
                        SELECT * FROM donor_interactions
                        WHERE donor_type=%s AND donor_id=%s
                        ORDER BY interaction_date DESC, created_at DESC
                    """, (donor_type, int(donor_id)))
                else:
                    cur.execute("SELECT * FROM donor_interactions ORDER BY interaction_date DESC LIMIT 100")
                return ok({"interactions": rows_to_dicts(cur)})

            if qtype == "campaigns":
                cur.execute("SELECT * FROM fundraising_campaigns ORDER BY created_at DESC")
                return ok({"campaigns": rows_to_dicts(cur, ["budget", "result_amount"])})

            if qtype == "projects":
                cur.execute("SELECT * FROM org_projects ORDER BY created_at DESC")
                rows = rows_to_dicts(cur, ["budget"])
                # Для каждого проекта — доноры и поступления
                for row in rows:
                    cur.execute("""
                        SELECT pd.donor_type, pd.donor_id, pd.amount, pd.notes,
                               COALESCE(o.name, p.full_name) AS donor_name
                        FROM project_donors pd
                        LEFT JOIN donors_orgs o ON pd.donor_type='org' AND pd.donor_id=o.id
                        LEFT JOIN donors_persons p ON pd.donor_type='person' AND pd.donor_id=p.id
                        WHERE pd.project_id=%s
                    """, (row["id"],))
                    row["donors"] = rows_to_dicts(cur, ["amount"])
                return ok({"projects": rows})

            if qtype == "documents":
                donor_type = params.get("donor_type")
                donor_id = params.get("donor_id")
                campaign_id = params.get("campaign_id")
                project_id = params.get("project_id")
                show_all = params.get("all") == "1"

                if show_all:
                    cur.execute("SELECT * FROM donor_documents ORDER BY created_at DESC")
                elif donor_type and donor_id:
                    cur.execute("""
                        SELECT * FROM donor_documents
                        WHERE donor_type=%s AND donor_id=%s
                        ORDER BY created_at DESC
                    """, (donor_type, int(donor_id)))
                elif campaign_id:
                    cur.execute("SELECT * FROM donor_documents WHERE campaign_id=%s ORDER BY created_at DESC", (int(campaign_id),))
                elif project_id:
                    cur.execute("SELECT * FROM donor_documents WHERE project_id=%s ORDER BY created_at DESC", (int(project_id),))
                else:
                    cur.execute("SELECT * FROM donor_documents ORDER BY created_at DESC LIMIT 50")
                return ok({"documents": rows_to_dicts(cur)})

            if qtype == "tasks":
                donor_type = params.get("donor_type")
                donor_id = params.get("donor_id")
                show_all = params.get("all") == "1"

                if show_all:
                    cur.execute("""
                        SELECT dt.*,
                               COALESCE(o.name, p.full_name) AS donor_name
                        FROM donor_tasks dt
                        LEFT JOIN donors_orgs o ON dt.donor_type='org' AND dt.donor_id=o.id
                        LEFT JOIN donors_persons p ON dt.donor_type='person' AND dt.donor_id=p.id
                        WHERE dt.is_done=false
                        ORDER BY dt.due_date ASC NULLS LAST, dt.created_at DESC
                    """)
                elif donor_type and donor_id:
                    cur.execute("""
                        SELECT * FROM donor_tasks
                        WHERE donor_type=%s AND donor_id=%s
                        ORDER BY is_done ASC, due_date ASC NULLS LAST
                    """, (donor_type, int(donor_id)))
                else:
                    cur.execute("""
                        SELECT * FROM donor_tasks
                        WHERE is_done=false
                        ORDER BY due_date ASC NULLS LAST LIMIT 50
                    """)
                return ok({"tasks": rows_to_dicts(cur)})

            if qtype == "metrics":
                donor_type = params.get("donor_type")
                donor_id = params.get("donor_id")
                if donor_type and donor_id:
                    cur.execute("""
                        SELECT * FROM donor_metrics
                        WHERE donor_type=%s AND donor_id=%s
                        LIMIT 1
                    """, (donor_type, int(donor_id)))
                    r = cur.fetchone()
                    if r:
                        cols = [d[0] for d in cur.description]
                        return ok({"metrics": dict(zip(cols, r))})
                    return ok({"metrics": None})
                return ok({"metrics": None})

            if qtype == "kpi":
                cur.execute("""
                    SELECT
                        COALESCE(SUM(amount),0) AS total_year,
                        COALESCE(SUM(CASE WHEN donated_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount END),0) AS total_month,
                        COUNT(DISTINCT CASE WHEN donated_at >= DATE_TRUNC('year', CURRENT_DATE) THEN donor_id END) AS donors_year,
                        COUNT(DISTINCT CASE WHEN donated_at >= DATE_TRUNC('month', CURRENT_DATE) THEN donor_id END) AS donors_month,
                        COUNT(*) AS donations_total,
                        COALESCE(AVG(amount),0) AS avg_donation,
                        COUNT(CASE WHEN is_regular=true THEN 1 END) AS regular_count
                    FROM donor_donations
                """)
                r = cur.fetchone()
                cols = ["total_year","total_month","donors_year","donors_month",
                        "donations_total","avg_donation","regular_count"]
                data = dict(zip(cols, r))
                for f in ["total_year","total_month","avg_donation"]:
                    data[f] = float(data[f])

                # Новые доноры за месяц
                cur.execute("""
                    SELECT COUNT(*) FROM (
                        SELECT donor_type, donor_id FROM donor_donations
                        WHERE donated_at >= DATE_TRUNC('month', CURRENT_DATE)
                        EXCEPT
                        SELECT donor_type, donor_id FROM donor_donations
                        WHERE donated_at < DATE_TRUNC('month', CURRENT_DATE)
                    ) AS new_donors
                """)
                data["new_donors_month"] = cur.fetchone()[0]

                # Повторные пожертвования (доля доноров с >1 пожертвованием)
                cur.execute("""
                    SELECT
                        COUNT(CASE WHEN cnt > 1 THEN 1 END)::float /
                        NULLIF(COUNT(*),0) * 100
                    FROM (
                        SELECT donor_type, donor_id, COUNT(*) AS cnt
                        FROM donor_donations GROUP BY donor_type, donor_id
                    ) AS t
                """)
                r2 = cur.fetchone()[0]
                data["repeat_rate"] = round(float(r2), 1) if r2 else 0.0

                # Воронка — конверсия funded/total в funnel_donors
                cur.execute("SELECT COUNT(*) FROM funnel_donors")
                total_funnel = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM funnel_donors WHERE stage='funded'")
                funded_funnel = cur.fetchone()[0]
                data["funnel_total"] = total_funnel
                data["funnel_funded"] = funded_funnel
                data["funnel_conversion"] = round(funded_funnel / total_funnel * 100, 1) if total_funnel else 0.0

                return ok({"kpi": data})

        # ── POST ─────────────────────────────────────────────────────────────
        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            if qtype == "interaction":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE donor_interactions
                        SET interaction_type=%s, title=%s, description=%s,
                            interaction_date=%s, manager=%s, outcome=%s, next_step=%s
                        WHERE id=%s RETURNING id
                    """, (body.get("interaction_type","comment"), body.get("title"),
                          body.get("description",""), body.get("interaction_date"),
                          body.get("manager"), body.get("outcome"), body.get("next_step"), oid))
                else:
                    cur.execute("""
                        INSERT INTO donor_interactions
                            (donor_type, donor_id, interaction_type, title, description,
                             interaction_date, manager, outcome, next_step)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("donor_type"), body.get("donor_id"),
                          body.get("interaction_type","comment"), body.get("title"),
                          body.get("description",""), body.get("interaction_date"),
                          body.get("manager"), body.get("outcome"), body.get("next_step")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "campaign":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE fundraising_campaigns
                        SET title=%s, goal=%s, budget=%s, start_date=%s, end_date=%s,
                            audience=%s, channel=%s, status=%s,
                            result_amount=%s, result_donors=%s, notes=%s
                        WHERE id=%s RETURNING id
                    """, (body.get("title"), body.get("goal"),
                          body.get("budget") or None, body.get("start_date") or None,
                          body.get("end_date") or None, body.get("audience"),
                          body.get("channel"), body.get("status","planned"),
                          body.get("result_amount") or None,
                          body.get("result_donors") or None,
                          body.get("notes"), oid))
                else:
                    cur.execute("""
                        INSERT INTO fundraising_campaigns
                            (title, goal, budget, start_date, end_date,
                             audience, channel, status, result_amount, result_donors, notes)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("title"), body.get("goal"),
                          body.get("budget") or None, body.get("start_date") or None,
                          body.get("end_date") or None, body.get("audience"),
                          body.get("channel"), body.get("status","planned"),
                          body.get("result_amount") or None,
                          body.get("result_donors") or None,
                          body.get("notes")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "project":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE org_projects
                        SET title=%s, description=%s, start_date=%s, end_date=%s,
                            budget=%s, status=%s, result=%s
                        WHERE id=%s RETURNING id
                    """, (body.get("title"), body.get("description"),
                          body.get("start_date") or None, body.get("end_date") or None,
                          body.get("budget") or None, body.get("status","active"),
                          body.get("result"), oid))
                else:
                    cur.execute("""
                        INSERT INTO org_projects
                            (title, description, start_date, end_date, budget, status, result)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("title"), body.get("description"),
                          body.get("start_date") or None, body.get("end_date") or None,
                          body.get("budget") or None, body.get("status","active"),
                          body.get("result")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "document":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE donor_documents
                        SET doc_type=%s, title=%s, url=%s, notes=%s, doc_date=%s,
                            donor_type=%s, donor_id=%s, campaign_id=%s, project_id=%s
                        WHERE id=%s RETURNING id
                    """, (body.get("doc_type","other"), body.get("title"),
                          body.get("url"), body.get("notes"),
                          body.get("doc_date") or None,
                          body.get("donor_type"), body.get("donor_id") or None,
                          body.get("campaign_id") or None, body.get("project_id") or None,
                          oid))
                else:
                    cur.execute("""
                        INSERT INTO donor_documents
                            (donor_type, donor_id, campaign_id, project_id,
                             doc_type, title, url, notes, doc_date)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("donor_type"), body.get("donor_id") or None,
                          body.get("campaign_id") or None, body.get("project_id") or None,
                          body.get("doc_type","other"), body.get("title"),
                          body.get("url"), body.get("notes"),
                          body.get("doc_date") or None))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "task":
                oid = body.get("id")
                if oid:
                    cur.execute("""
                        UPDATE donor_tasks
                        SET title=%s, task_type=%s, due_date=%s, manager=%s, notes=%s,
                            donor_type=%s, donor_id=%s
                        WHERE id=%s RETURNING id
                    """, (body.get("title"), body.get("task_type","call"),
                          body.get("due_date") or None, body.get("manager"),
                          body.get("notes"),
                          body.get("donor_type"), body.get("donor_id") or None,
                          oid))
                else:
                    cur.execute("""
                        INSERT INTO donor_tasks
                            (donor_type, donor_id, title, task_type, due_date, manager, notes)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (body.get("donor_type"), body.get("donor_id") or None,
                          body.get("title"), body.get("task_type","call"),
                          body.get("due_date") or None, body.get("manager"),
                          body.get("notes")))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            if qtype == "task_done":
                rid = int(params.get("id", 0))
                cur.execute("""
                    UPDATE donor_tasks SET is_done=true, done_at=NOW() WHERE id=%s
                """, (rid,))
                conn.commit()
                return ok({"ok": True})

            if qtype == "metrics":
                dtype = body.get("donor_type")
                did = body.get("donor_id")
                cur.execute("""
                    INSERT INTO donor_metrics
                        (donor_type, donor_id, engagement_level, support_probability,
                         interests, last_contact_at, next_step, next_step_date, updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                    ON CONFLICT (donor_type, donor_id) DO UPDATE SET
                        engagement_level=EXCLUDED.engagement_level,
                        support_probability=EXCLUDED.support_probability,
                        interests=EXCLUDED.interests,
                        last_contact_at=EXCLUDED.last_contact_at,
                        next_step=EXCLUDED.next_step,
                        next_step_date=EXCLUDED.next_step_date,
                        updated_at=NOW()
                    RETURNING id
                """, (dtype, did,
                      body.get("engagement_level", 3),
                      body.get("support_probability", 50),
                      body.get("interests"),
                      body.get("last_contact_at") or None,
                      body.get("next_step"),
                      body.get("next_step_date") or None))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

        # ── DELETE ───────────────────────────────────────────────────────────
        if method == "DELETE":
            rid = int(params.get("id", 0))
            table_map = {
                "interaction": "donor_interactions",
                "campaign": "fundraising_campaigns",
                "project": "org_projects",
                "document": "donor_documents",
                "task": "donor_tasks",
            }
            if qtype in table_map:
                cur.execute(f"DELETE FROM {table_map[qtype]} WHERE id=%s", (rid,))
                conn.commit()
                return ok({"deleted": rid})

        return ok({"error": "unknown request"})

    finally:
        cur.close()
        conn.close()
