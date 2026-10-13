import json
import os
import base64
import calendar
import re
import psycopg2
from datetime import datetime
from urllib.request import urlopen, Request

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def add_month(dt: datetime) -> datetime:
    month = dt.month % 12 + 1
    year = dt.year + (1 if dt.month == 12 else 0)
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def save_subscription(cur, schema: str, payment: dict, payment_id: str):
    meta = payment.get("metadata") or {}
    method = payment.get("payment_method") or {}
    email = str(meta.get("user_email", "")).strip().lower()
    if meta.get("subscription_id") or str(meta.get("monthly")) != "True":
        return
    if not email or not method.get("saved") or not method.get("id"):
        return
    card = method.get("card") or {}
    cur.execute(
        f"SELECT referrer_code FROM {schema}.orders WHERE order_comment LIKE %s LIMIT 1",
        (f"yookassa:{payment_id}%",),
    )
    row = cur.fetchone()
    cur.execute(
        f"""INSERT INTO {schema}.donor_subscriptions
            (email, user_name, amount, payment_method_id, first_payment_id, card_last4, card_type,
             status, next_charge_at, last_charge_at, referrer_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', %s, NOW(), %s)
            ON CONFLICT (first_payment_id) DO NOTHING""",
        (email, str(meta.get("user_name") or "Аноним")[:255], float(payment["amount"]["value"]), method["id"],
         payment_id, card.get("last4"), card.get("card_type"), add_month(datetime.utcnow()), row[0] if row else None),
    )


def handler(event: dict, context) -> dict:
    """Вебхук от ЮКасса: подтверждает успешную оплату и обновляет статус заказа."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    event_type = body.get("event", "")
    obj = body.get("object", {})

    if event_type not in ("payment.succeeded", "payment.canceled"):
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    payment_id = obj.get("id", "")
    if not payment_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "no payment id"})}

    # Верифицируем платёж через API ЮКасса
    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()

    req = Request(
        f"{YOOKASSA_API}/{payment_id}",
        headers={"Authorization": f"Basic {credentials}"},
        method="GET",
    )
    with urlopen(req) as resp:
        payment = json.loads(resp.read().decode())

    status = payment.get("status")  # "succeeded" / "canceled" / "pending"
    new_status = "paid" if status == "succeeded" else "cancelled"

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""UPDATE {schema}.orders
            SET status = %s, updated_at = NOW(), paid_at = CASE WHEN %s = 'paid' THEN NOW() ELSE paid_at END
            WHERE order_comment LIKE %s AND status = 'pending'
            RETURNING amount, order_comment""",
        (new_status, new_status, f"yookassa:{payment_id}%")
    )
    if new_status == "paid":
        for amount, comment in cur.fetchall():
            m = re.search(r"\|gid:(\d+)", comment or "")
            if m:
                cur.execute(
                    f"UPDATE {schema}.fundraising_goals SET collected_amount = collected_amount + %s WHERE id = %s",
                    (amount, int(m.group(1))),
                )
    meta = payment.get("metadata") or {}
    if meta.get("subscription_id"):
        if status == "succeeded":
            cur.execute(f"UPDATE {schema}.donor_subscriptions SET fail_count = 0, last_error = NULL WHERE id = %s", (int(meta["subscription_id"]),))
    if status == "succeeded":
        save_subscription(cur, schema, payment, payment_id)
    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}