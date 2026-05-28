import json
import os
import psycopg2


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Возвращает месячную статистику доходов и расходов из таблицы finance_transactions."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    db_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(f"""
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance,
            COUNT(*) AS transactions_count
        FROM {SCHEMA}.finance_transactions
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    months = []
    for row in rows:
        months.append({
            'month': row[0],
            'month_label': row[1],
            'income': float(row[2]),
            'expense': float(row[3]),
            'balance': float(row[4]),
            'transactions_count': row[5],
        })

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'ok': True, 'months': months}),
    }