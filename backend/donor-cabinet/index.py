import json

from psycopg2.extras import RealDictCursor

import admin
import auth
import cabinet
from common import CORS, err, get_conn

PUBLIC_POST = {
    "request_code": auth.request_code,
    "verify_code": auth.verify_code,
}

CABINET_POST = {
    "logout": lambda cur, conn, event, body: auth.logout(cur, conn, event, body),
    "mark_read": cabinet.mark_read,
    "update_profile": cabinet.update_profile,
    "certificate": cabinet.certificate,
    "tax_statement": cabinet.tax_statement,
}

CABINET_GET = {
    "overview": cabinet.get_overview,
    "messages": cabinet.get_messages,
    "feed": cabinet.get_feed,
    "rating": cabinet.get_rating,
    "year_summary": cabinet.year_summary,
    "public": lambda cur, conn, event, params: cabinet.public_info(cur, conn, event, params),
}


def handler(event: dict, context) -> dict:
    """Личный кабинет жертвователя. Вход по коду из письма, статистика, уровни, достижения, рейтинг,
    сообщения, закрытая лента, сертификат и справка в PDF. POST с action=admin_* доступен только
    сотрудникам фандрайзинга: достижения, уровни, рассылки, подарки, настройки и автонапоминания."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if method == "GET":
            route = CABINET_GET.get(params.get("view", "overview"))
            if not route:
                return err("Неизвестный запрос", 404)
            return route(cur, conn, event, params)

        if method != "POST":
            return err("Метод не поддерживается", 405)

        body = json.loads(event.get("body") or "{}")
        action = body.get("action") or ""

        if action in PUBLIC_POST:
            return PUBLIC_POST[action](cur, conn, event, body)
        if action in CABINET_POST:
            return CABINET_POST[action](cur, conn, event, body)
        if action.startswith("admin_"):
            if not admin.authorize(cur, body):
                return err("Нет прав", 403)
            route = admin.ADMIN_ACTIONS.get(action[len("admin_"):])
            if not route:
                return err("Неизвестное действие", 404)
            return route(cur, conn, body)
        return err("Неизвестное действие", 404)
    finally:
        conn.close()
