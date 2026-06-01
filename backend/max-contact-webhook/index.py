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

    import json as _json
    func2url_path = "/var/task/func2url.json"
    try:
        with open(func2url_path) as f:
            urls = _json.load(f)
        webhook_url = urls.get("max-contact-bot", "")
    except Exception:
        webhook_url = ""

    if not webhook_url:
        return {
            "statusCode": 500,
            "headers": cors,
            "body": json.dumps({"error": "webhook url not found"})
        }

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
