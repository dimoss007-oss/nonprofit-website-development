"""
Воронка фандрайзинга — управление донорами по этапам привлечения.

GET  /                        — все карточки воронки (сгруппированные по этапам)
GET  /?id=N                   — одна карточка
POST /                        — создать / обновить карточку
POST /?move=1&id=N&stage=X    — переместить в другой этап
DELETE /?id=N                 — удалить карточку
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

STAGES = [
    "identified",
    "first_contact",
    "meeting",
    "proposal_sent",
    "negotiation",
    "confirmed",
    "funded",
    "reporting",
    "renewal",
]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
        "isBase64Encoded": False,
    }


def row_to_dict(r, cols):
    d = dict(zip(cols, r))
    if d.get("potential_amount") is not None:
        d["potential_amount"] = float(d["potential_amount"])
    return d


COLS = [
    "id", "name", "donor_type", "donor_category", "stage", "stage_order",
    "contact_person", "phone", "email", "potential_amount", "notes", "manager",
    "last_action_at", "next_action_at", "next_action_note",
    "linked_org_id", "linked_person_id", "created_at", "updated_at",
]


def handler(event: dict, context) -> dict:
    """Воронка фандрайзинга — канбан по этапам привлечения доноров."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": "", "isBase64Encoded": False}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    conn = get_db()
    cur = conn.cursor()

    try:
        if method == "GET":
            card_id = params.get("id")
            if card_id:
                cur.execute(f"SELECT {', '.join(COLS)} FROM funnel_donors WHERE id=%s", (int(card_id),))
                r = cur.fetchone()
                return ok({"card": row_to_dict(r, COLS) if r else None})

            cur.execute(f"SELECT {', '.join(COLS)} FROM funnel_donors ORDER BY stage_order, updated_at DESC")
            rows = [row_to_dict(r, COLS) for r in cur.fetchall()]
            grouped = {s: [] for s in STAGES}
            for r in rows:
                s = r["stage"]
                if s in grouped:
                    grouped[s].append(r)
            return ok({"cards": rows, "grouped": grouped})

        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            # Быстрое перемещение
            if params.get("move") == "1":
                card_id = int(params.get("id", 0))
                new_stage = params.get("stage", "")
                stage_order = STAGES.index(new_stage) + 1 if new_stage in STAGES else 1
                cur.execute("""
                    UPDATE funnel_donors
                    SET stage=%s, stage_order=%s, updated_at=NOW()
                    WHERE id=%s RETURNING id
                """, (new_stage, stage_order, card_id))
                conn.commit()
                return ok({"id": card_id, "stage": new_stage})

            # Создать / обновить карточку
            stage = body.get("stage", "identified")
            stage_order = STAGES.index(stage) + 1 if stage in STAGES else 1
            card_id = body.get("id")

            if card_id:
                cur.execute("""
                    UPDATE funnel_donors SET
                        name=%s, donor_type=%s, donor_category=%s,
                        stage=%s, stage_order=%s,
                        contact_person=%s, phone=%s, email=%s,
                        potential_amount=%s, notes=%s, manager=%s,
                        last_action_at=%s, next_action_at=%s, next_action_note=%s,
                        linked_org_id=%s, linked_person_id=%s,
                        updated_at=NOW()
                    WHERE id=%s RETURNING id
                """, (
                    body.get("name"), body.get("donor_type", "org"),
                    body.get("donor_category", "donation"),
                    stage, stage_order,
                    body.get("contact_person"), body.get("phone"), body.get("email"),
                    body.get("potential_amount") or None,
                    body.get("notes"), body.get("manager"),
                    body.get("last_action_at") or None,
                    body.get("next_action_at") or None,
                    body.get("next_action_note"),
                    body.get("linked_org_id") or None,
                    body.get("linked_person_id") or None,
                    card_id,
                ))
            else:
                cur.execute("""
                    INSERT INTO funnel_donors (
                        name, donor_type, donor_category,
                        stage, stage_order,
                        contact_person, phone, email,
                        potential_amount, notes, manager,
                        last_action_at, next_action_at, next_action_note,
                        linked_org_id, linked_person_id
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING id
                """, (
                    body.get("name"), body.get("donor_type", "org"),
                    body.get("donor_category", "donation"),
                    stage, stage_order,
                    body.get("contact_person"), body.get("phone"), body.get("email"),
                    body.get("potential_amount") or None,
                    body.get("notes"), body.get("manager"),
                    body.get("last_action_at") or None,
                    body.get("next_action_at") or None,
                    body.get("next_action_note"),
                    body.get("linked_org_id") or None,
                    body.get("linked_person_id") or None,
                ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id})

        if method == "DELETE":
            card_id = int(params.get("id", 0))
            cur.execute("DELETE FROM funnel_donors WHERE id=%s", (card_id,))
            conn.commit()
            return ok({"deleted": card_id})

        return ok({"error": "unknown"})

    finally:
        cur.close()
        conn.close()
