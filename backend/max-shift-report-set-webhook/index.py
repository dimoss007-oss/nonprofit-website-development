import json
import os

import requests

MAX_API_URL = "https://platform-api.max.ru"


def handler(event: dict, context) -> dict:
    """Регистрирует webhook бота Max для приёма ежедневных отчётов смены (max-shift-report-bot). v2"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = os.environ.get("MAX_SHIFT_REPORT_BOT_TOKEN", "").strip()
    webhook_url = "https://functions.poehali.dev/24f88fa1-d8fc-458b-9001-d1e8e5cb3e2c"

    if not token:
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": False, "error": "MAX_SHIFT_REPORT_BOT_TOKEN не задан"})}

    try:
        token.encode("latin-1")
    except UnicodeEncodeError:
        bad_chars = sorted({c for c in token if ord(c) > 255})
        return {"statusCode": 200, "headers": cors, "body": json.dumps({
            "ok": False,
            "error": "Токен содержит недопустимые символы (не ASCII). Проверьте, что скопирован именно API-токен бота, без лишних пробелов/кавычек.",
            "debug_len": len(token),
            "debug_bad_chars": [f"U+{ord(c):04X}" for c in bad_chars],
        })}

    # secret передаётся Max в заголовке X-Max-Bot-Api-Secret с каждым webhook-запросом —
    # используем сам токен бота, чтобы max-shift-report-bot мог свериться с MAX_SHIFT_REPORT_BOT_TOKEN.
    resp = requests.post(
        f"{MAX_API_URL}/subscriptions",
        headers={"Authorization": token},
        json={"url": webhook_url, "secret": token},
    )

    print(f"Set shift-report webhook status: {resp.status_code}, body: {resp.text}")

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({
            "ok": True,
            "status": resp.status_code,
            "response": resp.json() if resp.text else {},
        }),
    }