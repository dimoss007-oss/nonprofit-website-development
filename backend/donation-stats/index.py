import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    """Публичная статистика пожертвований: сумма за всё время, за месяц и число жертвователей."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"""SELECT COALESCE(SUM(amount), 0),
                   COUNT(*),
                   COUNT(DISTINCT LOWER(user_email)),
                   COALESCE(SUM(amount) FILTER (WHERE COALESCE(paid_at, created_at) >= date_trunc('month', NOW())), 0)
            FROM {schema}.orders WHERE status = 'paid'"""
    )
    total, payments, donors, month = cur.fetchone()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300'},
        'body': json.dumps({
            'total': int(total),
            'payments': int(payments),
            'donors': int(donors),
            'month': int(month),
        }),
    }
