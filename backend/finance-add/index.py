import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """Добавляет операцию (POST) или обновляет категорию транзакции (PUT)."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'POST')
    body = json.loads(event.get('body') or '{}')

    db_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    # PUT — обновить категорию существующей транзакции
    if method == 'PUT':
        tx_id = body.get('id')
        if not tx_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'id обязателен'})}
        sets = []
        if 'category' in body:
            cat = (body.get('category') or '').strip()
            sets.append(f"category={'NULL' if not cat else chr(39) + cat.replace(chr(39), chr(39)*2) + chr(39)}")
        if 'description' in body:
            desc = (body.get('description') or '').strip()
            sets.append(f"description={'NULL' if not desc else chr(39) + desc.replace(chr(39), chr(39)*2) + chr(39)}")
        if not sets:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'нечего обновлять'})}
        cur.execute(f"UPDATE {SCHEMA}.finance_transactions SET {', '.join(sets)} WHERE id={int(tx_id)}")
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    # POST — создать новую транзакцию
    tx_type = body.get('type', '')
    amount = body.get('amount')
    description = body.get('description', '').strip()
    category = body.get('category', '').strip()

    if tx_type not in ('income', 'expense') or not amount:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'type и amount обязательны'})}

    amount = float(amount)
    desc_val = f"'{description.replace(chr(39), chr(39)*2)}'" if description else 'NULL'
    cat_val = f"'{category.replace(chr(39), chr(39)*2)}'" if category else 'NULL'

    cur.execute(f"""
        INSERT INTO {SCHEMA}.finance_transactions (user_id, type, amount, description, category)
        VALUES (0, '{tx_type}', {amount}, {desc_val}, {cat_val})
        RETURNING id, created_at
    """)
    row = cur.fetchone()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({
            'ok': True,
            'id': row[0],
            'created_at': row[1].strftime('%d.%m.%Y %H:%M'),
        }),
    }