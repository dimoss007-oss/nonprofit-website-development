import hashlib
import json
import os
import random
import psycopg2
from datetime import datetime
from urllib.parse import urlencode

ROBOKASSA_URL = "https://auth.robokassa.ru/Merchant/Index.aspx"


def calculate_signature(*args) -> str:
    joined = ":".join(str(a) for a in args)
    return hashlib.md5(joined.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Генерирует прямую ссылку на оплату Robokassa для пожертвования с произвольной суммой."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    merchant_login = os.environ.get("ROBOKASSA_MERCHANT_LOGIN", "")
    password_1 = os.environ.get("ROBOKASSA_PASSWORD_1", "")
    db_url = os.environ.get("DATABASE_URL", "")

    inv_id = random.randint(100000, 2147483647)

    # Сохраняем заказ в БД
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    order_number = f"DON-{datetime.now().strftime('%Y%m%d')}-{inv_id}"
    cur.execute(
        "INSERT INTO orders (order_number, user_name, user_email, user_phone, amount, robokassa_inv_id, status, delivery_address, order_comment) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (order_number, "Жертвователь", "noreply@spasenienadezhdi.ru", "", 0, inv_id, "pending", "", "Пожертвование")
    )
    cur.close()
    conn.close()

    # Сумма 0 — Robokassa покажет поле для ввода суммы
    amount_str = "0.00"
    signature = calculate_signature(merchant_login, amount_str, inv_id, password_1)

    params = {
        "MerchantLogin": merchant_login,
        "OutSum": amount_str,
        "InvoiceID": inv_id,
        "SignatureValue": signature,
        "Culture": "ru",
        "Description": "Пожертвование АНО Спасение надежды",
    }

    payment_url = f"{ROBOKASSA_URL}?{urlencode(params)}"

    return {
        "statusCode": 302,
        "headers": {
            **cors,
            "Location": payment_url,
        },
        "body": "",
    }
