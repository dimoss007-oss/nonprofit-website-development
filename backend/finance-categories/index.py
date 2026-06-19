import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def handler(event: dict, context) -> dict:
    """CRUD для категорий доходов и расходов. GET — список, POST — создать, DELETE — удалить."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    db_url = os.environ.get('DATABASE_URL', '')
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        tx_type = params.get('type', '')
        if tx_type:
            cur.execute(f"SELECT id, name, type FROM {SCHEMA}.finance_categories WHERE type = '{tx_type}' ORDER BY name")
        else:
            cur.execute(f"SELECT id, name, type FROM {SCHEMA}.finance_categories ORDER BY type, name")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        categories = [{'id': r[0], 'name': r[1], 'type': r[2]} for r in rows]
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True, 'categories': categories})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        name = body.get('name', '').strip()
        tx_type = body.get('type', '')
        if not name or tx_type not in ('income', 'expense'):
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'name и type обязательны'})}
        name_safe = name.replace("'", "''")
        cur.execute(f"INSERT INTO {SCHEMA}.finance_categories (name, type) VALUES ('{name_safe}', '{tx_type}') RETURNING id")
        new_id = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True, 'id': new_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        cat_id = body.get('id')
        name = (body.get('name') or '').strip()
        tx_type = body.get('type', '')
        if not cat_id or not name:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'id и name обязательны'})}
        name_safe = name.replace("'", "''")
        if tx_type in ('income', 'expense'):
            cur.execute(f"UPDATE {SCHEMA}.finance_categories SET name='{name_safe}', type='{tx_type}' WHERE id={int(cat_id)}")
        else:
            cur.execute(f"UPDATE {SCHEMA}.finance_categories SET name='{name_safe}' WHERE id={int(cat_id)}")
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    if method == 'DELETE':
        body = json.loads(event.get('body') or '{}')
        cat_id = body.get('id')
        if not cat_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'id обязателен'})}
        cur.execute(f"DELETE FROM {SCHEMA}.finance_categories WHERE id = {int(cat_id)}")
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'ok': False, 'error': 'Method not allowed'})}