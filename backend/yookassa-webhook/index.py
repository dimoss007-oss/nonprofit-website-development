import json
import os
import base64
import psycopg2
from urllib.request import urlopen, Request

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


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
            WHERE order_comment LIKE %s AND status = 'pending'""",
        (new_status, new_status, f"yookassa:{payment_id}%")
    )
    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}