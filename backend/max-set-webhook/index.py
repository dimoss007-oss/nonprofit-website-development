import json
import os
import requests

MAX_API_URL = "https://botapi.max.ru"

def handler(event: dict, context) -> dict:
    """Регистрация webhook для Max бота учёта финансов."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    token = os.environ.get('MAX_BOT_TOKEN', '')
    webhook_url = "https://functions.poehali.dev/147b61f7-fbe1-4676-862a-8bf01c1e68cb"

    resp = requests.post(
        f"{MAX_API_URL}/subscriptions",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": webhook_url}
    )

    print(f"Set webhook status: {resp.status_code}, body: {resp.text}, token_len: {len(token)}")

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({
            'ok': True,
            'status': resp.status_code,
            'response': resp.json() if resp.text else {}
        })
    }