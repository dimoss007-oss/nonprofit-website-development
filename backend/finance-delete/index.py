import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Удаляет операцию по id из таблицы finance_transactions."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    tx_id = body.get('id')

    if not tx_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'id required'})}

    db_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.finance_transactions WHERE id = {int(tx_id)}")
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}
