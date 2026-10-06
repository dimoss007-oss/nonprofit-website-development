import secrets
import re

from common import (SCHEMA, ensure_account, err, get_settings, norm_email, ok, open_smtp,
                    send_mail, sha, smtp_configured)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CODE_TTL_MIN = 10
SESSION_TTL_DAYS = 30
MAX_CODES_PER_HOUR = 5
MAX_ATTEMPTS = 5


def client_ip(event: dict) -> str:
    return ((event.get("requestContext") or {}).get("identity") or {}).get("sourceIp", "") or ""


def request_code(cur, conn, event, body):
    email = norm_email(body.get("email"))
    if not EMAIL_RE.match(email) or len(email) > 200:
        return err("Введите корректный email")
    if not smtp_configured():
        return err("Отправка писем пока не настроена. Обратитесь в центр", 503)

    cur.execute(
        f"""SELECT COUNT(*) AS n FROM {SCHEMA}.donor_login_codes
            WHERE email = %s AND created_at > NOW() - INTERVAL '1 hour'""",
        (email,),
    )
    if cur.fetchone()["n"] >= MAX_CODES_PER_HOUR:
        return err("Слишком много запросов. Попробуйте через час", 429)

    ip = client_ip(event)
    if ip:
        cur.execute(
            f"""SELECT COUNT(*) AS n FROM {SCHEMA}.donor_login_codes
                WHERE ip = %s AND created_at > NOW() - INTERVAL '1 hour'""",
            (ip,),
        )
        if cur.fetchone()["n"] >= 15:
            return err("Слишком много запросов. Попробуйте позже", 429)

    code = f"{secrets.randbelow(1000000):06d}"
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_login_codes (email, code_hash, ip, expires_at)
            VALUES (%s, %s, %s, NOW() + INTERVAL '{CODE_TTL_MIN} minutes')""",
        (email, sha(f"{email}:{code}"), ip or None),
    )
    conn.commit()

    settings = get_settings(cur)
    text = (
        f"Ваш код для входа в личный кабинет: {code}\n\n"
        f"Код действует {CODE_TTL_MIN} минут. Если вы не запрашивали вход, просто проигнорируйте это письмо."
    )
    try:
        server = open_smtp()
        try:
            send_mail(server, email, f"Код входа: {code}", text, settings["org_name"])
        finally:
            try:
                server.quit()
            except Exception:
                pass
    except Exception as e:
        print(f"donor login mail error: {e}")
        return err("Не удалось отправить письмо. Попробуйте позже", 502)
    return ok({"sent": True, "ttl_minutes": CODE_TTL_MIN})


def verify_code(cur, conn, event, body):
    email = norm_email(body.get("email"))
    code = re.sub(r"\D", "", str(body.get("code") or ""))
    if not EMAIL_RE.match(email) or len(code) != 6:
        return err("Введите email и 6-значный код")

    cur.execute(
        f"""SELECT id, code_hash, attempts FROM {SCHEMA}.donor_login_codes
            WHERE email = %s AND NOT used AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1""",
        (email,),
    )
    row = cur.fetchone()
    if not row:
        return err("Код устарел. Запросите новый", 400)
    if row["attempts"] >= MAX_ATTEMPTS:
        return err("Слишком много попыток. Запросите новый код", 429)

    if sha(f"{email}:{code}") != row["code_hash"]:
        cur.execute(f"UPDATE {SCHEMA}.donor_login_codes SET attempts = attempts + 1 WHERE id = %s", (row["id"],))
        conn.commit()
        return err("Неверный код", 400)

    cur.execute(f"UPDATE {SCHEMA}.donor_login_codes SET used = TRUE WHERE id = %s", (row["id"],))
    account = ensure_account(cur, email)
    token = secrets.token_urlsafe(32)
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_sessions (account_id, token_hash, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '{SESSION_TTL_DAYS} days')""",
        (account["id"], sha(token)),
    )
    cur.execute(f"UPDATE {SCHEMA}.donor_accounts SET last_login_at = NOW() WHERE id = %s", (account["id"],))
    conn.commit()
    return ok({"token": token, "email": email})


def account_from_token(cur, event):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = headers.get("x-auth-token", "")
    if not token:
        return None
    cur.execute(
        f"""SELECT a.* FROM {SCHEMA}.donor_sessions s
            JOIN {SCHEMA}.donor_accounts a ON a.id = s.account_id
            WHERE s.token_hash = %s AND s.expires_at > NOW()""",
        (sha(token),),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def logout(cur, conn, event, body):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = headers.get("x-auth-token", "")
    if token:
        cur.execute(f"UPDATE {SCHEMA}.donor_sessions SET expires_at = NOW() WHERE token_hash = %s", (sha(token),))
        conn.commit()
    return ok({"success": True})
