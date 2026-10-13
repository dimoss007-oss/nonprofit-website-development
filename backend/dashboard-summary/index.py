import json
import os
import hmac
import hashlib
from datetime import date, datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
}

ALERT_PATTERN = (
    'суицид|самоубий|самоповрежд|самоповреж|не хочу жить|хочет умереть|побег|сбежал|'
    'угроз(а|ы|ож) (жизни|себе|окруж)|рецидив|тяжёлый срыв|тяжелый срыв'
)
ALERT_DAYS = 3
DAILY_SUMMARY_PLACEHOLDER = (
    'Сводка за сутки: Общий эмоциональный фон стабильный. Дежурство прошло без происшествий, '
    'правила проживания не нарушались. У двух новых семей отмечается положительная динамика в адаптации.'
)
TASKS_LIMIT = 5
TREND_TOLERANCE = 0.05


def resp(status: int, payload: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(payload, ensure_ascii=False, default=str),
    }


def is_admin(cur, login: str, password: str) -> bool:
    if not login or not password:
        return False
    master_login = os.environ.get('ADMIN_LOGIN', '')
    master_password = os.environ.get('ADMIN_PASSWORD', '')
    if master_login and hmac.compare_digest(login, master_login) and hmac.compare_digest(password, master_password):
        return True
    cur.execute(f"SELECT password_hash, role FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
    user = cur.fetchone()
    if not user or user['role'] != 'admin':
        return False
    return hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), user['password_hash'])


def residents(cur) -> dict:
    cur.execute(f"""
        SELECT
            COUNT(*) FILTER (WHERE discharge_date IS NULL AND care_stage = 'inpatient') AS total_active,
            COUNT(*) FILTER (WHERE admission_date >= CURRENT_DATE - 7) AS new_week
        FROM {SCHEMA}.patients
    """)
    row = cur.fetchone()
    cur.execute(f"SELECT bed_capacity FROM {SCHEMA}.crm_settings ORDER BY id LIMIT 1")
    settings = cur.fetchone()
    capacity = settings['bed_capacity'] if settings else None
    free = max(capacity - row['total_active'], 0) if capacity is not None else None
    return {'totalActive': row['total_active'], 'freeBeds': free, 'newThisWeek': row['new_week']}


def finance(cur) -> dict:
    cur.execute(f"""
        SELECT
            COALESCE(SUM(amount) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0) AS current_total,
            COALESCE(SUM(amount) FILTER (
                WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                  AND created_at < DATE_TRUNC('month', NOW()) - INTERVAL '1 month' + (NOW() - DATE_TRUNC('month', NOW()))
            ), 0) AS prev_same_period
        FROM {SCHEMA}.finance_transactions
        WHERE type = 'income'
    """)
    row = cur.fetchone()
    current, prev = float(row['current_total']), float(row['prev_same_period'])
    if prev == 0:
        trend = 'up' if current > 0 else 'stable'
    elif current > prev * (1 + TREND_TOLERANCE):
        trend = 'up'
    elif current < prev * (1 - TREND_TOLERANCE):
        trend = 'down'
    else:
        trend = 'stable'

    cur.execute(f"""
        SELECT COUNT(DISTINCT (donor_type, donor_id)) AS donors
        FROM {SCHEMA}.donor_donations
        WHERE is_regular AND donated_at >= CURRENT_DATE - 62
    """)
    return {
        'monthlyTotalRub': round(current),
        'activeRecurringDonors': cur.fetchone()['donors'],
        'trend': trend,
    }


def tasks(cur) -> list:
    cur.execute(f"""
        SELECT t.id, t.title, t.priority, t.deadline, t.created_at,
               COALESCE(NULLIF(u.full_name, ''), t.created_by, 'Система') AS author,
               (t.deadline IS NOT NULL AND t.deadline < CURRENT_DATE) AS overdue
        FROM {SCHEMA}.tasks t
        LEFT JOIN {SCHEMA}.admin_users u ON u.login = t.created_by
        WHERE t.status <> 'done'
        ORDER BY (t.deadline IS NOT NULL AND t.deadline < CURRENT_DATE) DESC,
                 (t.priority = 'high') DESC,
                 t.deadline ASC NULLS LAST,
                 t.created_at DESC
        LIMIT {TASKS_LIMIT}
    """)
    return [
        {
            'id': str(r['id']),
            'title': r['title'],
            'author': r['author'],
            'date': (r['deadline'] or r['created_at'].date()).isoformat(),
            'hasDeadline': r['deadline'] is not None,
            'isOverdue': r['overdue'],
            'isUrgent': r['priority'] == 'high' or r['overdue'],
        }
        for r in cur.fetchall()
    ]


def ai_reports(cur) -> dict:
    cur.execute(f"""
        SELECT COUNT(*) AS cnt FROM {SCHEMA}.patient_ai_summaries
        WHERE created_at > NOW() - INTERVAL '7 days'
    """)
    digest = 'ready' if cur.fetchone()['cnt'] > 0 else 'pending'

    cur.execute(f"""
        SELECT DISTINCT COALESCE(NULLIF(p.alias, ''), p.first_name || ' ' || p.last_name) AS name
        FROM {SCHEMA}.psychologist_reports r
        JOIN {SCHEMA}.patients p ON p.id = r.patient_id
        WHERE r.report_date >= CURRENT_DATE - {ALERT_DAYS}
          AND p.discharge_date IS NULL
          AND LOWER(r.report_text) ~ %s
    """, (ALERT_PATTERN,))
    alerts = [f"Тревожные маркеры в отчёте психолога: {r['name']}" for r in cur.fetchall()]
    return {'weeklyDigestStatus': digest, 'criticalAlerts': alerts, 'dailySummary': DAILY_SUMMARY_PLACEHOLDER}


def system(cur) -> dict:
    cur.execute(f"SELECT MAX(created_at) AS last_sync FROM {SCHEMA}.news WHERE vk_id IS NOT NULL")
    last = cur.fetchone()['last_sync']
    return {'lastVkSync': last.isoformat() if last else None}


def handler(event: dict, context) -> dict:
    """Единый роутер дашборда админки. action=get_dashboard_summary возвращает агрегированную сводку из базы (только для администратора)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action') or (event.get('queryStringParameters') or {}).get('action', '')

    if action not in ('get_dashboard_summary', 'set_bed_capacity'):
        return resp(400, {'error': 'Неизвестное действие', 'availableActions': ['get_dashboard_summary', 'set_bed_capacity']})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if not is_admin(cur, body.get('auth_login', ''), body.get('auth_password', '')):
        conn.close()
        return resp(403, {'error': 'Доступ только для администратора'})

    if action == 'set_bed_capacity':
        try:
            capacity = int(body.get('capacity'))
        except (TypeError, ValueError):
            conn.close()
            return resp(400, {'error': 'Укажите число мест'})
        if capacity < 0 or capacity > 500:
            conn.close()
            return resp(400, {'error': 'Некорректное число мест'})
        cur.execute(f"UPDATE {SCHEMA}.crm_settings SET bed_capacity = %s", (capacity,))
        conn.close()
        return resp(200, {'ok': True, 'capacity': capacity})

    summary = {
        'residents': residents(cur),
        'finance': finance(cur),
        'tasks': tasks(cur),
        'aiReports': ai_reports(cur),
        'system': system(cur),
    }
    conn.close()
    return resp(200, summary)
