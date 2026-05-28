import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Возвращает список операций за указанный месяц (month=YYYY-MM)."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    month = params.get('month', '')

    db_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    if month:
        cur.execute(f"""
            SELECT id, type, amount, description, created_at
            FROM {SCHEMA}.finance_transactions
            WHERE TO_CHAR(created_at, 'YYYY-MM') = '{month}'
            ORDER BY created_at DESC
        """)
    else:
        cur.execute(f"""
            SELECT id, type, amount, description, created_at
            FROM {SCHEMA}.finance_transactions
            ORDER BY created_at DESC
            LIMIT 100
        """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    transactions = []
    for row in rows:
        transactions.append({
            'id': row[0],
            'type': row[1],
            'amount': float(row[2]),
            'description': row[3],
            'created_at': row[4].strftime('%d.%m.%Y %H:%M'),
        })

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'ok': True, 'transactions': transactions}),
    }
