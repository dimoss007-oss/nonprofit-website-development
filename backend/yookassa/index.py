import json
import os
import uuid
import base64
import psycopg2
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from datetime import datetime

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """Создаёт платёж в ЮКасса и возвращает ссылку на оплату пожертвования."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return err("Method not allowed", 405)

    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    if not shop_id or not secret_key:
        return err("ЮКасса не настроена", 500)

    body = json.loads(event.get("body") or "{}")
    amount = float(body.get("amount", 0))
    user_name = str(body.get("user_name", "Аноним")).strip()
    user_email = str(body.get("user_email", "")).strip()
    success_url = str(body.get("success_url", "")).strip()
    description = str(body.get("description", "Пожертвование АНО Спасение надежды")).strip()

    if amount < 1:
        return err("Сумма должна быть не менее 1 ₽")

    idempotence_key = str(uuid.uuid4())

    payload = {
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "confirmation": {
            "type": "redirect",
            "return_url": success_url or "https://spasenienadezhdi.ru/donate",
        },
        "description": description,
        "capture": True,
        "metadata": {
            "user_name": user_name,
            "user_email": user_email,
        },
    }

    if user_email:
        payload["receipt"] = {
            "customer": {"email": user_email},
            "items": [{
                "description": description,
                "quantity": "1.00",
                "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
                "vat_code": 1,
                "payment_mode": "full_payment",
                "payment_subject": "another",
            }],
        }

    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    req = Request(
        YOOKASSA_API,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "Idempotence-Key": idempotence_key,
        },
        method="POST",
    )

    try:
        with urlopen(req) as resp:
            data = json.loads(resp.read().decode())
    except HTTPError as e:
        error_body = e.read().decode()
        return err(f"ЮКасса: {error_body}", 502)

    payment_id = data.get("id")
    confirmation_url = data.get("confirmation", {}).get("confirmation_url", "")

    # Сохраняем платёж в БД
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    try:
        conn = get_conn()
        cur = conn.cursor()
        order_number = f"YK-{datetime.now().strftime('%Y%m%d')}-{payment_id[:8].upper()}"
        cur.execute(
            f"""INSERT INTO {schema}.orders
                (order_number, user_name, user_email, user_phone, amount, status, order_comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (order_number, user_name, user_email or None, None, round(amount, 2), "pending", f"yookassa:{payment_id}")
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        pass

    return ok({"payment_url": confirmation_url, "payment_id": payment_id})
