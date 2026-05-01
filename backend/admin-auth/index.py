import json
import os
import hmac

def handler(event: dict, context) -> dict:
    """Проверка логина и пароля для входа в админ панель."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    login = body.get('login', '')
    password = body.get('password', '')

    correct_login = os.environ.get('ADMIN_LOGIN', '') or ''
    correct_password = os.environ.get('ADMIN_PASSWORD', '') or ''

    login_ok = hmac.compare_digest(login, correct_login)
    password_ok = hmac.compare_digest(password, correct_password)

    if login_ok and password_ok:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'Неверный логин или пароль'})}