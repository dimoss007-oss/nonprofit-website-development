import hashlib
import hmac
import json
import os
import secrets
import smtplib
import ssl
import time
from datetime import date, datetime
from decimal import Decimal
from email.mime.text import MIMEText
from email.utils import formataddr

import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

DONATIONS_CTE = f"""
donations AS (
  SELECT lower(trim(user_email)) AS email, amount::float AS amount,
         COALESCE(paid_at, created_at) AS dt,
         (position('|monthly' in COALESCE(order_comment, '')) > 0) AS monthly
  FROM {SCHEMA}.orders
  WHERE status = 'paid' AND user_email IS NOT NULL AND trim(user_email) <> ''
  UNION ALL
  SELECT lower(trim(p.email)), d.amount::float, d.donated_at::timestamp, COALESCE(d.is_regular, false)
  FROM {SCHEMA}.donor_donations d
  JOIN {SCHEMA}.donors_persons p ON d.donor_type = 'person' AND d.donor_id = p.id
  WHERE d.donation_type = 'money' AND p.email IS NOT NULL AND trim(p.email) <> ''
)"""


def jdefault(o):
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    return str(o)


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, default=jdefault, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def sign(value: str) -> str:
    key = (os.environ.get("DATABASE_URL") or "key").encode()
    return hmac.new(key, value.encode(), hashlib.sha256).hexdigest()


def norm_email(value) -> str:
    return (value or "").strip().lower()


def get_settings(cur) -> dict:
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_settings WHERE id = 1")
    return dict(cur.fetchone())


def get_levels(cur) -> list:
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_levels ORDER BY min_amount, id")
    return [dict(r) for r in cur.fetchall()]


def totals_by_email(cur) -> dict:
    cur.execute(
        f"""WITH {DONATIONS_CTE}
            SELECT email, SUM(amount) AS total, COUNT(*) AS cnt, MIN(dt) AS first_dt, MAX(dt) AS last_dt
            FROM donations GROUP BY email"""
    )
    return {r["email"]: dict(r) for r in cur.fetchall()}


def get_donations(cur, email: str) -> list:
    cur.execute(
        f"WITH {DONATIONS_CTE} SELECT amount, dt, monthly FROM donations WHERE email = %s ORDER BY dt DESC",
        (email,),
    )
    return [dict(r) for r in cur.fetchall()]


def month_index(d) -> int:
    return d.year * 12 + d.month - 1


def compute_stats(donations: list) -> dict:
    total = round(sum(d["amount"] for d in donations), 2)
    count = len(donations)
    first = min((d["dt"] for d in donations), default=None)
    last = max((d["dt"] for d in donations), default=None)
    today = date.today()

    months = {month_index(d["dt"]) for d in donations}
    cursor = month_index(today)
    if cursor not in months:
        cursor -= 1
    streak = 0
    while cursor in months:
        streak += 1
        cursor -= 1

    years = 0
    if first:
        years = today.year - first.year - ((today.month, today.day) < (first.month, first.day))

    by_month = []
    now_idx = month_index(today)
    for idx in range(now_idx - 11, now_idx + 1):
        amount = sum(d["amount"] for d in donations if month_index(d["dt"]) == idx)
        by_month.append({"label": f"{idx // 12}-{idx % 12 + 1:02d}", "amount": round(amount, 2)})

    year_total = round(sum(d["amount"] for d in donations if d["dt"].year == today.year), 2)
    return {
        "total": total, "count": count, "first_date": first, "last_date": last,
        "streak": streak, "years": max(years, 0), "by_month": by_month, "year_total": year_total,
    }


def level_info(total: float, levels: list) -> dict:
    current = None
    nxt = None
    for lv in levels:
        if float(lv["min_amount"]) <= total:
            current = lv
        elif nxt is None:
            nxt = lv
    start = float(current["min_amount"]) if current else 0.0
    pct = 100
    if nxt:
        span = float(nxt["min_amount"]) - start
        pct = int(max(0, min(100, (total - start) / span * 100))) if span > 0 else 100
    return {
        "current": current, "next": nxt, "progress_pct": pct,
        "left_to_next": round(float(nxt["min_amount"]) - total, 2) if nxt else 0,
    }


def new_ref_code(cur) -> str:
    for _ in range(20):
        code = secrets.token_hex(4).upper()
        cur.execute(f"SELECT 1 FROM {SCHEMA}.donor_accounts WHERE referral_code = %s", (code,))
        if not cur.fetchone():
            return code
    return secrets.token_hex(6).upper()[:16]


def guess_name(cur, email: str):
    cur.execute(
        f"""SELECT user_name FROM {SCHEMA}.orders
            WHERE lower(trim(user_email)) = %s AND status = 'paid'
              AND user_name IS NOT NULL AND user_name NOT IN ('Аноним', 'Жертвователь', '')
            ORDER BY created_at DESC LIMIT 1""",
        (email,),
    )
    row = cur.fetchone()
    if row:
        return row["user_name"]
    cur.execute(
        f"SELECT full_name FROM {SCHEMA}.donors_persons WHERE lower(trim(email)) = %s AND full_name IS NOT NULL LIMIT 1",
        (email,),
    )
    row = cur.fetchone()
    return row["full_name"] if row else None


def ensure_account(cur, email: str) -> dict:
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_accounts WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        return dict(row)
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_accounts (email, full_name, referral_code)
            VALUES (%s, %s, %s) RETURNING *""",
        (email, guess_name(cur, email), new_ref_code(cur)),
    )
    return dict(cur.fetchone())


def sync_accounts(cur, conn) -> int:
    totals = totals_by_email(cur)
    cur.execute(f"SELECT email FROM {SCHEMA}.donor_accounts")
    existing = {r["email"] for r in cur.fetchall()}
    created = 0
    for email in totals:
        if email not in existing:
            ensure_account(cur, email)
            created += 1
    conn.commit()
    return created


def add_message(cur, account_id: int, kind: str, title: str, body: str, broadcast_id=None):
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_messages (account_id, broadcast_id, kind, title, body)
            VALUES (%s, %s, %s, %s, %s)""",
        (account_id, broadcast_id, kind, title, body),
    )


def email_footer(settings: dict) -> str:
    return (
        f"\n\n—\n{settings['org_name']}\n"
        f"Личный кабинет: {settings['site_url']}/cabinet\n"
        "Чтобы не получать письма-рассылки, отключите их в профиле личного кабинета."
    )


def queue_email(cur, account: dict, subject: str, body: str, settings: dict, broadcast_id=None) -> bool:
    if account.get("email_unsubscribed"):
        return False
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_email_queue (broadcast_id, account_id, to_email, subject, body)
            VALUES (%s, %s, %s, %s, %s)""",
        (broadcast_id, account["id"], account["email"], subject, body + email_footer(settings)),
    )
    return True


def smtp_configured() -> bool:
    return all(os.environ.get(k) for k in ("SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"))


def open_smtp():
    host = os.environ["SMTP_HOST"]
    port = int(os.environ["SMTP_PORT"])
    context = ssl.create_default_context()
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=8, context=context)
    else:
        server = smtplib.SMTP(host, port, timeout=8)
        server.starttls(context=context)
    server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
    return server


def send_mail(server, to_email: str, subject: str, body: str, org_name: str):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = formataddr((org_name, os.environ["SMTP_USER"]))
    msg["To"] = to_email
    server.sendmail(os.environ["SMTP_USER"], [to_email], msg.as_string())


def process_queue(cur, conn, budget_seconds: float = 3.0) -> dict:
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_email_queue WHERE status = 'pending'")
    pending = cur.fetchone()["n"]
    if not pending:
        return {"sent": 0, "failed": 0, "pending": 0}
    if not smtp_configured():
        return {"sent": 0, "failed": 0, "pending": pending, "error": "Почта не настроена"}

    settings = get_settings(cur)
    cur.execute(f"SELECT id, to_email, subject, body FROM {SCHEMA}.donor_email_queue WHERE status = 'pending' ORDER BY id LIMIT 200")
    rows = cur.fetchall()
    sent = failed = 0
    started = time.time()
    try:
        server = open_smtp()
    except Exception as e:
        return {"sent": 0, "failed": 0, "pending": pending, "error": f"Не удалось подключиться к почте: {str(e)[:160]}"}
    try:
        for row in rows:
            if time.time() - started > budget_seconds:
                break
            try:
                send_mail(server, row["to_email"], row["subject"], row["body"], settings["org_name"])
                cur.execute(f"UPDATE {SCHEMA}.donor_email_queue SET status = 'sent', sent_at = NOW() WHERE id = %s", (row["id"],))
                sent += 1
            except Exception as e:
                cur.execute(f"UPDATE {SCHEMA}.donor_email_queue SET status = 'failed', error = %s WHERE id = %s", (str(e)[:300], row["id"]))
                failed += 1
            conn.commit()
    finally:
        try:
            server.quit()
        except Exception:
            pass
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_email_queue WHERE status = 'pending'")
    return {"sent": sent, "failed": failed, "pending": cur.fetchone()["n"]}


def grant_award(cur, account: dict, ach: dict, source: str, note=None) -> bool:
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_awards (account_id, achievement_id, source, note)
            VALUES (%s, %s, %s, %s) ON CONFLICT (account_id, achievement_id) DO NOTHING RETURNING id""",
        (account["id"], ach["id"], source, note),
    )
    if not cur.fetchone():
        return False
    text = ach.get("reward_message") or ach.get("description") or "Спасибо за вашу помощь!"
    add_message(cur, account["id"], "award", f"Новая награда: {ach['title']}", text)
    if ach.get("gift_title"):
        cur.execute(
            f"INSERT INTO {SCHEMA}.donor_gifts (account_id, achievement_id, title) VALUES (%s, %s, %s)",
            (account["id"], ach["id"], ach["gift_title"]),
        )
    return True


def achievement_value(kind: str, stats: dict) -> float:
    if kind == "first_donation":
        return 1 if stats["count"] >= 1 else 0
    if kind == "total_amount":
        return stats["total"]
    if kind == "donation_count":
        return stats["count"]
    if kind == "monthly_streak":
        return stats["streak"]
    if kind == "anniversary_years":
        return stats["years"] if stats["count"] else 0
    return 0


def evaluate_achievements(cur, account: dict, stats: dict) -> int:
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_achievements WHERE is_active AND kind <> 'manual' ORDER BY sort_order, id")
    granted = 0
    for ach in cur.fetchall():
        ach = dict(ach)
        threshold = 1 if ach["kind"] == "first_donation" else float(ach["threshold"])
        if achievement_value(ach["kind"], stats) >= threshold > 0:
            if grant_award(cur, account, ach, "auto"):
                granted += 1
    return granted
