import base64
import calendar
import json
import os
import uuid
from datetime import datetime
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import psycopg2

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_FAILS = 3
BATCH = 20

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def add_month(dt: datetime) -> datetime:
    month = dt.month % 12 + 1
    year = dt.year + (1 if dt.month == 12 else 0)
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def charge(sub: dict, credentials: str) -> dict:
    description = "Ежемесячное пожертвование АНО Спасение надежды"
    amount = f"{float(sub['amount']):.2f}"
    payload = {
        "amount": {"value": amount, "currency": "RUB"},
        "capture": True,
        "payment_method_id": sub["payment_method_id"],
        "description": description,
        "metadata": {
            "user_name": sub["user_name"],
            "user_email": sub["email"],
            "monthly": "True",
            "subscription_id": str(sub["id"]),
        },
        "receipt": {
            "customer": {"email": sub["email"]},
            "items": [{
                "description": description,
                "quantity": "1.00",
                "amount": {"value": amount, "currency": "RUB"},
                "vat_code": 1,
                "payment_mode": "full_payment",
                "payment_subject": "another",
            }],
        },
    }
    req = Request(
        YOOKASSA_API,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "Idempotence-Key": f"sub-{sub['id']}-{sub['next_charge_at'].strftime('%Y%m%d')}",
        },
        method="POST",
    )
    with urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def handler(event: dict, context) -> dict:
    """Ежемесячные списания по подпискам доноров: берёт созданные подписки, у которых наступила дата, и списывает сумму с сохранённой карты."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    credentials = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f"""SELECT id, email, user_name, amount, payment_method_id, next_charge_at, fail_count, referrer_code
            FROM {SCHEMA}.donor_subscriptions
            WHERE status = 'active' AND next_charge_at <= NOW()
            ORDER BY next_charge_at LIMIT {BATCH}"""
    )
    cols = [c[0] for c in cur.description]
    subs = [dict(zip(cols, r)) for r in cur.fetchall()]

    started = 0
    failed = 0
    for sub in subs:
        try:
            payment = charge(sub, credentials)
            payment_id = payment["id"]
            order_number = f"YK-{datetime.now().strftime('%Y%m%d')}-{payment_id[:8].upper()}"
            cur.execute(
                f"""INSERT INTO {SCHEMA}.orders
                    (order_number, user_name, user_email, amount, status, order_comment, referrer_code)
                    VALUES (%s, %s, %s, %s, 'pending', %s, %s)""",
                (order_number, sub["user_name"], sub["email"], sub["amount"], f"yookassa:{payment_id}|monthly", sub["referrer_code"]),
            )
            cur.execute(
                f"""UPDATE {SCHEMA}.donor_subscriptions
                    SET next_charge_at = %s, last_charge_at = NOW() WHERE id = %s""",
                (add_month(sub["next_charge_at"]), sub["id"]),
            )
            started += 1
        except HTTPError as e:
            body = e.read().decode()[:300]
            print(f"subscription {sub['id']} charge error: {body}")
            fails = sub["fail_count"] + 1
            if fails >= MAX_FAILS:
                cur.execute(
                    f"UPDATE {SCHEMA}.donor_subscriptions SET status = 'failed', fail_count = %s, last_error = %s WHERE id = %s",
                    (fails, body, sub["id"]),
                )
            else:
                cur.execute(
                    f"""UPDATE {SCHEMA}.donor_subscriptions
                        SET fail_count = %s, last_error = %s, next_charge_at = NOW() + INTERVAL '1 day' WHERE id = %s""",
                    (fails, body, sub["id"]),
                )
            failed += 1
        conn.commit()

    cur.close()
    conn.close()
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"due": len(subs), "started": started, "failed": failed})}
