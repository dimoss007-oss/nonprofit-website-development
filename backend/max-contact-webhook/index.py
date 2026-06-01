import json
import os
import requests

MAX_API_URL = "https://platform-api.max.ru"


def handler(event: dict, context) -> dict:
    """Регистрация webhook для бота уведомлений о заявках с сайта."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    webhook_url = "https://functions.poehali.dev/138700ec-2c07-45ee-bff3-9278d2ad1f25"

    resp = requests.post(
        f"{MAX_API_URL}/subscriptions",
        headers={"Authorization": token},
        json={"url": webhook_url}
    )
    print(f"Set webhook status={resp.status_code} body={resp.text}")

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"ok": True, "status": resp.status_code, "response": resp.text})
    }