import json
import os
import uuid
import base64
from urllib.request import urlopen, Request
from urllib.error import URLError

YOOKASSA_API = "https://api.yookassa.ru/v3/payments"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

RETURN_URL = "https://spasenienadezhdi.ru/donate"


def handler(event: dict, context) -> dict:
    """Создаёт платёж в ЮКасса и перенаправляет жертвователя на страницу оплаты."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "")
    secret_key = os.environ.get("YOOKASSA_SECRET_KEY", "")
    if not shop_id or not secret_key:
        return {"statusCode": 302, "headers": {**CORS, "Location": RETURN_URL}, "body": ""}

    params = event.get("queryStringParameters") or {}
    amount = float(params.get("amount", "100"))
    if amount < 1:
        amount = 100.0

    idempotence_key = str(uuid.uuid4())
    payload = {
        "amount": {"value": f"{amount:.2f}", "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": RETURN_URL},
        "description": "Пожертвование АНО Спасение надежды",
        "capture": True,
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

    confirmation_url = RETURN_URL
    try:
        with urlopen(req) as resp:
            data = json.loads(resp.read().decode())
        confirmation_url = data.get("confirmation", {}).get("confirmation_url", RETURN_URL)
    except URLError:
        pass

    return {"statusCode": 302, "headers": {**CORS, "Location": confirmation_url}, "body": ""}
