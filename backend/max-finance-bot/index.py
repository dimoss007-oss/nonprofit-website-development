import json
import os
import re
import requests
import psycopg2

MAX_API_URL = "https://platform-api.max.ru"

def send_message(chat_id: int, text: str, token: str):
    r = requests.post(
        f"{MAX_API_URL}/messages",
        params={"user_id": chat_id},
        headers={"Authorization": token},
        json={"text": text}
    )
    print(f"send_message chat_id={chat_id} status={r.status_code} body={r.text[:200]}")

def db_query(db_url: str, sql: str):
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall() if cur.description else []
    cur.close()
    conn.close()
    return rows

def db_execute(db_url: str, sql: str):
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    cur.close()
    conn.close()

def get_balance(user_id: int, db_url: str) -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    rows = db_query(
        db_url,
        f"""SELECT
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0),
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
            FROM {schema}.finance_transactions
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())"""
    )
    balance, income, expense = rows[0]
    return (
        f"Оборот за текущий месяц:\n"
        f"Баланс: {balance:,.2f} руб.\n"
        f"Доходы: {income:,.2f} руб.\n"
        f"Расходы: {expense:,.2f} руб."
    )

def get_total_balance(user_id: int, db_url: str) -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    rows = db_query(
        db_url,
        f"""SELECT
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0),
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
            FROM {schema}.finance_transactions"""
    )
    balance, income, expense = rows[0]
    return (
        f"Общий баланс за всё время:\n"
        f"Баланс: {balance:,.2f} руб.\n"
        f"Доходы: {income:,.2f} руб.\n"
        f"Расходы: {expense:,.2f} руб."
    )

def get_history(user_id: int, db_url: str) -> str:
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    rows = db_query(db_url, f"SELECT type, amount, description, created_at FROM {schema}.finance_transactions ORDER BY created_at DESC LIMIT 10")
    if not rows:
        return "История пуста. Добавь первую запись!"
    lines = ["Последние 10 операций:\n"]
    for t, amount, desc, created_at in rows:
        sign = "+" if t == "income" else "-"
        date_str = created_at.strftime("%d.%m %H:%M")
        label = desc or ("доход" if t == "income" else "расход")
        lines.append(f"{sign}{float(amount):,.2f} руб. — {label} ({date_str})")
    return "\n".join(lines)

def parse_transaction(text: str):
    text = text.strip()
    match = re.match(r'^([+-])\s*(\d+(?:[.,]\d{1,2})?)(.*)$', text)
    if not match:
        return None
    sign, amount_str, description = match.groups()
    amount = float(amount_str.replace(',', '.'))
    t = "income" if sign == "+" else "expense"
    return t, amount, description.strip() or None

def handler(event: dict, context) -> dict:
    """Webhook для Max-бота учёта доходов и расходов."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    token = os.environ.get('MAX_BOT_TOKEN', '')
    db_url = os.environ.get('DATABASE_URL', '')
    print(f"token present={bool(token)} len={len(token)} starts={token[:10] if token else 'EMPTY'}")

    body = json.loads(event.get('body') or '{}')
    print(f"Max webhook body: {json.dumps(body)}")

    update_type = body.get('update_type', '')

    if update_type == 'bot_started':
        user_id = body.get('user_id') or (body.get('user') or {}).get('user_id')
        chat_id = body.get('chat_id') or user_id
        if user_id and chat_id:
            welcome = (
                "Привет! Я помогу вести учёт доходов и расходов.\n\n"
                "Как добавить запись:\n"
                "+5000 зарплата — доход\n"
                "-1200 продукты — расход\n\n"
                "Команды:\n"
                "/balance — баланс за текущий месяц\n"
                "/total — общий баланс за всё время\n"
                "/history — последние 10 операций\n"
                "/clear — удалить все записи"
            )
            send_message(chat_id, welcome, token)
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    message = body.get('message') or {}
    if not message:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    sender = message.get('sender') or {}
    user_id = sender.get('user_id')
    chat_id = user_id

    body_msg = message.get('body') or {}
    text = body_msg.get('text', '').strip()

    if not user_id or not text:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    uid = int(user_id)

    if text in ('/start', 'start', 'помощь', '/help'):
        reply = (
            "Привет! Я помогу вести учёт доходов и расходов.\n\n"
            "Как добавить запись:\n"
            "+5000 зарплата — доход\n"
            "-1200 продукты — расход\n\n"
            "Команды:\n"
            "/balance — баланс за текущий месяц\n"
            "/total — общий баланс за всё время\n"
            "/history — последние 10 операций\n"
            "/clear — удалить все записи"
        )
    elif text in ('/balance', 'баланс', 'balance'):
        reply = get_balance(uid, db_url)
    elif text in ('/total', 'итого', 'total'):
        reply = get_total_balance(uid, db_url)
    elif text in ('/history', 'история', 'history'):
        reply = get_history(uid, db_url)
    elif text in ('/clear', 'очистить', 'clear'):
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        db_execute(db_url, f"DELETE FROM {schema}.finance_transactions WHERE user_id = {uid}")
        reply = "Все записи удалены."
    else:
        parsed = parse_transaction(text)
        if parsed:
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
            t, amount, description = parsed
            desc_sql = f"'{description}'" if description else "NULL"
            db_execute(db_url, f"INSERT INTO {schema}.finance_transactions (user_id, amount, type, description) VALUES ({uid}, {amount}, '{t}', {desc_sql})")
            label = "Доход" if t == "income" else "Расход"
            desc_str = f" — {description}" if description else ""
            reply = (
                f"{label} {amount:,.2f} руб.{desc_str} записан!\n\n"
                + get_balance(uid, db_url)
                + "\n\n"
                + get_total_balance(uid, db_url)
            )
        else:
            reply = (
                "Не понял запись. Используй формат:\n"
                "+5000 зарплата — доход\n"
                "-800 кафе — расход\n\n"
                "Или /balance для баланса за месяц, /total — за всё время."
            )

    send_message(chat_id, reply, token)
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}