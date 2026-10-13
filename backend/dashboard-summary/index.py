import json
from datetime import datetime, timedelta, timezone

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
}


def build_dashboard_summary() -> dict:
    now = datetime.now(timezone.utc)
    day = lambda d: (now + timedelta(days=d)).date().isoformat()
    return {
        'residents': {'totalActive': 14, 'freeBeds': 6, 'newThisWeek': 2},
        'finance': {
            'monthlyTotalRub': 187500,
            'activeRecurringDonors': 23,
            'trend': 'up',
        },
        'tasks': [
            {
                'id': 't-101',
                'title': 'Подготовить акт приема передачи оборудования по Никольскому и Городищенскому районам',
                'author': 'Василий',
                'date': day(-1),
                'isUrgent': True,
            },
            {
                'id': 't-102',
                'title': 'Провести сверку с Машей по расходам',
                'author': 'Маша',
                'date': day(1),
                'isUrgent': False,
            },
            {
                'id': 't-103',
                'title': 'Отправить отчёт по гранту в администрацию района',
                'author': 'Василий',
                'date': day(3),
                'isUrgent': False,
            },
            {
                'id': 't-104',
                'title': 'Напоминание: продлить подписку на хостинг',
                'author': 'Система',
                'date': day(5),
                'isUrgent': False,
            },
        ],
        'aiReports': {
            'weeklyDigestStatus': 'ready',
            'criticalAlerts': [
                'Резкое ухудшение фона у семьи Ивановых',
                'Повторный срыв по плану терапии у Кати Б.',
            ],
        },
        'system': {
            'lastVkSync': (now - timedelta(hours=3, minutes=12)).isoformat(),
        },
    }


def handler(event: dict, context) -> dict:
    """Единый роутер дашборда админки. action=get_dashboard_summary возвращает агрегированную сводку (моковые данные)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    if not action and event.get('body'):
        action = (json.loads(event['body']) or {}).get('action', '')

    if action == 'get_dashboard_summary':
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(build_dashboard_summary(), ensure_ascii=False),
        }

    return {
        'statusCode': 400,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Неизвестное действие', 'availableActions': ['get_dashboard_summary']}, ensure_ascii=False),
    }
