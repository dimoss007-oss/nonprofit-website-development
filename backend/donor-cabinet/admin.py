import hmac
import json
import os

from common import (SCHEMA, add_message, compute_stats, err, evaluate_achievements,
                    get_donations, get_levels, get_settings, grant_award, ok, process_queue,
                    queue_email, sha, smtp_configured, sync_accounts, totals_by_email)

KINDS = ("first_donation", "total_amount", "donation_count", "monthly_streak", "anniversary_years", "manual")

CRUD = {
    "level": ("donor_levels", {
        "title": "text", "description": "text", "min_amount": "num", "icon": "text", "color": "text", "sort_order": "int"}),
    "achievement": ("donor_achievements", {
        "title": "text", "description": "text", "icon": "text", "color": "text", "kind": "kind", "threshold": "num",
        "reward_message": "text", "certificate": "bool", "gift_title": "text", "is_active": "bool", "sort_order": "int"}),
    "impact": ("donor_impact_items", {
        "title": "text", "icon": "text", "unit_label": "text", "unit_cost": "pos", "sort_order": "int", "is_active": "bool"}),
    "feed": ("donor_feed", {"title": "text", "body": "text", "image_url": "text", "is_published": "bool"}),
}

ORDER = {
    "level": "min_amount, id", "achievement": "sort_order, id", "impact": "sort_order, id", "feed": "created_at DESC",
}


def authorize(cur, body) -> bool:
    login = (body.get("auth_login") or "").strip()
    password = body.get("auth_password") or ""
    if not login or not password:
        return False
    master_login = os.environ.get("ADMIN_LOGIN", "")
    master_password = os.environ.get("ADMIN_PASSWORD", "")
    if master_login and hmac.compare_digest(login, master_login) and hmac.compare_digest(password, master_password):
        return True
    cur.execute(f"SELECT password_hash, role, permissions FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
    user = cur.fetchone()
    if not user or not hmac.compare_digest(sha(password), user["password_hash"]):
        return False
    if user["role"] == "admin":
        return True
    try:
        perms = json.loads(user["permissions"] or "[]")
    except ValueError:
        perms = []
    return "fundraising" in perms


def clean_value(kind: str, value):
    if kind == "text":
        value = (value or "").strip() if isinstance(value, str) or value is None else str(value)
        return value or None
    if kind == "bool":
        return bool(value)
    if kind == "int":
        try:
            return int(value or 0)
        except (TypeError, ValueError):
            return 0
    if kind in ("num", "pos"):
        try:
            number = float(value or 0)
        except (TypeError, ValueError):
            number = 0.0
        return number
    if kind == "kind":
        return value if value in KINDS else "manual"
    return value


def crud_list(cur, conn, body):
    entity = body.get("entity")
    if entity not in CRUD:
        return err("Неизвестный раздел")
    table, _ = CRUD[entity]
    cur.execute(f"SELECT * FROM {SCHEMA}.{table} ORDER BY {ORDER[entity]}")
    items = [dict(r) for r in cur.fetchall()]
    if entity == "achievement":
        cur.execute(f"SELECT achievement_id, COUNT(*) AS n FROM {SCHEMA}.donor_awards GROUP BY achievement_id")
        counts = {r["achievement_id"]: r["n"] for r in cur.fetchall()}
        for item in items:
            item["awarded_count"] = counts.get(item["id"], 0)
    return ok({"items": items})


def crud_save(cur, conn, body):
    entity = body.get("entity")
    if entity not in CRUD:
        return err("Неизвестный раздел")
    table, fields = CRUD[entity]
    item = body.get("item") or {}
    values = {k: clean_value(t, item.get(k)) for k, t in fields.items()}

    if not values.get("title"):
        return err("Укажите название")
    if entity == "impact":
        if not values.get("unit_label"):
            return err("Укажите, что именно оплачивает помощь")
        if values["unit_cost"] <= 0:
            return err("Стоимость единицы должна быть больше нуля")
    if entity == "feed" and not values.get("body"):
        return err("Введите текст публикации")
    for key in ("icon", "color"):
        if key in values and not values[key]:
            values[key] = "Heart" if key == "icon" else "rose"
    if entity == "level" and values["min_amount"] < 0:
        return err("Сумма не может быть отрицательной")
    if entity == "achievement" and values["kind"] not in ("manual", "first_donation") and values["threshold"] <= 0:
        return err("Для этого типа укажите порог больше нуля")
    if entity == "feed":
        values["created_by"] = (body.get("auth_login") or "")[:100]

    item_id = item.get("id")
    cols = list(values.keys())
    if item_id:
        sets = ", ".join(f"{c} = %s" for c in cols)
        cur.execute(f"UPDATE {SCHEMA}.{table} SET {sets} WHERE id = %s RETURNING *", [values[c] for c in cols] + [item_id])
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.{table} ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))}) RETURNING *",
            [values[c] for c in cols],
        )
    row = cur.fetchone()
    conn.commit()
    if not row:
        return err("Запись не найдена", 404)
    return ok({"item": dict(row)})


def crud_delete(cur, conn, body):
    entity = body.get("entity")
    if entity not in CRUD:
        return err("Неизвестный раздел")
    table, _ = CRUD[entity]
    item_id = body.get("id")
    if not item_id:
        return err("Не указана запись")
    if entity == "achievement":
        cur.execute(f"UPDATE {SCHEMA}.donor_gifts SET achievement_id = NULL WHERE achievement_id = %s", (item_id,))
        cur.execute(f"DELETE FROM {SCHEMA}.donor_awards WHERE achievement_id = %s", (item_id,))
    cur.execute(f"DELETE FROM {SCHEMA}.{table} WHERE id = %s", (item_id,))
    conn.commit()
    return ok({"success": True})


def overview(cur, conn, body):
    created = sync_accounts(cur, conn)
    totals = totals_by_email(cur)
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_accounts")
    accounts = cur.fetchone()["n"]
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_awards")
    awards = cur.fetchone()["n"]
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_accounts WHERE last_login_at IS NOT NULL")
    logged = cur.fetchone()["n"]
    cur.execute(f"SELECT status, COUNT(*) AS n FROM {SCHEMA}.donor_email_queue GROUP BY status")
    queue = {r["status"]: r["n"] for r in cur.fetchall()}
    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_gifts WHERE status = 'planned'")
    gifts = cur.fetchone()["n"]
    return ok({
        "accounts": accounts, "accounts_created": created, "logged_in": logged, "awards": awards,
        "total_amount": round(sum(t["total"] for t in totals.values()), 2), "donors_with_payments": len(totals),
        "email_queue": queue, "gifts_planned": gifts, "smtp_configured": smtp_configured(),
    })


def list_accounts(cur, conn, body):
    sync_accounts(cur, conn)
    totals = totals_by_email(cur)
    levels = get_levels(cur)
    cur.execute(
        f"""SELECT a.id, a.email, a.full_name, a.display_name, a.last_login_at, a.created_at, a.email_unsubscribed,
                   (SELECT COUNT(*) FROM {SCHEMA}.donor_awards w WHERE w.account_id = a.id) AS awards
            FROM {SCHEMA}.donor_accounts a ORDER BY a.created_at DESC LIMIT 500"""
    )
    rows = []
    for r in cur.fetchall():
        r = dict(r)
        t = totals.get(r["email"], {})
        total = float(t.get("total") or 0)
        current = None
        for lv in levels:
            if float(lv["min_amount"]) <= total:
                current = lv["title"]
        r.update({"total": round(total, 2), "count": t.get("cnt", 0), "last_dt": t.get("last_dt"), "level": current})
        rows.append(r)
    rows.sort(key=lambda x: x["total"], reverse=True)
    return ok({"accounts": rows})


def award_manual(cur, conn, body):
    account_id = body.get("account_id")
    achievement_id = body.get("achievement_id")
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_accounts WHERE id = %s", (account_id,))
    account = cur.fetchone()
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_achievements WHERE id = %s", (achievement_id,))
    ach = cur.fetchone()
    if not account or not ach:
        return err("Жертвователь или награда не найдены", 404)
    granted = grant_award(cur, dict(account), dict(ach), "manual", (body.get("note") or "").strip() or None)
    conn.commit()
    return ok({"granted": granted})


def revoke_award(cur, conn, body):
    cur.execute(
        f"DELETE FROM {SCHEMA}.donor_awards WHERE account_id = %s AND achievement_id = %s",
        (body.get("account_id"), body.get("achievement_id")),
    )
    conn.commit()
    return ok({"success": True})


def account_awards(cur, conn, body):
    cur.execute(
        f"""SELECT a.id, a.title, w.awarded_at, w.source FROM {SCHEMA}.donor_awards w
            JOIN {SCHEMA}.donor_achievements a ON a.id = w.achievement_id WHERE w.account_id = %s ORDER BY w.awarded_at""",
        (body.get("account_id"),),
    )
    return ok({"awards": [dict(r) for r in cur.fetchall()]})


def audience_accounts(cur, audience: str, level_id, settings: dict) -> list:
    sync_accounts(cur, cur.connection)
    totals = totals_by_email(cur)
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_accounts")
    accounts = [dict(r) for r in cur.fetchall()]
    if audience == "all":
        return accounts

    levels = get_levels(cur)
    if audience == "level":
        idx = next((i for i, lv in enumerate(levels) if lv["id"] == level_id), None)
        if idx is None:
            return []
        low = float(levels[idx]["min_amount"])
        high = float(levels[idx + 1]["min_amount"]) if idx + 1 < len(levels) else float("inf")
        return [a for a in accounts if low <= float((totals.get(a["email"]) or {}).get("total") or 0) < high]

    from datetime import datetime, timedelta, timezone
    border = datetime.now(timezone.utc) - timedelta(days=int(settings["lapsed_days"]))
    if audience == "lapsed":
        result = []
        for a in accounts:
            t = totals.get(a["email"])
            if t and t["last_dt"]:
                last = t["last_dt"] if t["last_dt"].tzinfo else t["last_dt"].replace(tzinfo=timezone.utc)
                if last < border:
                    result.append(a)
        return result
    if audience == "donors":
        return [a for a in accounts if (totals.get(a["email"]) or {}).get("cnt")]
    return []


def send_broadcast(cur, conn, body):
    title = (body.get("title") or "").strip()
    text = (body.get("body") or "").strip()
    audience = body.get("audience") or "all"
    level_id = body.get("level_id")
    in_cabinet = bool(body.get("in_cabinet", True))
    by_email = bool(body.get("by_email", False))
    if not title or not text:
        return err("Заполните тему и текст")
    if audience not in ("all", "level", "lapsed", "donors"):
        return err("Неизвестная аудитория")
    if not in_cabinet and not by_email:
        return err("Выберите, куда отправить: в кабинет или на email")
    if by_email and not smtp_configured():
        return err("Почта не настроена, письма отправить нельзя. Можно отправить только в кабинет")

    settings = get_settings(cur)
    accounts = audience_accounts(cur, audience, level_id, settings)
    if not accounts:
        return err("В выбранной аудитории никого нет", 404)

    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_broadcasts (title, body, audience, level_id, in_cabinet, by_email, created_by, recipients_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (title, text, audience, level_id if audience == "level" else None, in_cabinet, by_email,
         (body.get("auth_login") or "")[:100], len(accounts)),
    )
    broadcast_id = cur.fetchone()["id"]
    queued = 0
    for a in accounts:
        if in_cabinet:
            add_message(cur, a["id"], "broadcast", title, text, broadcast_id)
        if by_email and queue_email(cur, a, title, text, settings, broadcast_id):
            queued += 1
    conn.commit()
    result = process_queue(cur, conn) if by_email else None
    return ok({"broadcast_id": broadcast_id, "recipients": len(accounts), "emails_queued": queued, "queue": result})


def list_broadcasts(cur, conn, body):
    cur.execute(
        f"""SELECT b.*, (SELECT COUNT(*) FROM {SCHEMA}.donor_email_queue q WHERE q.broadcast_id = b.id AND q.status = 'sent') AS sent,
                   (SELECT COUNT(*) FROM {SCHEMA}.donor_email_queue q WHERE q.broadcast_id = b.id AND q.status = 'pending') AS pending,
                   (SELECT COUNT(*) FROM {SCHEMA}.donor_email_queue q WHERE q.broadcast_id = b.id AND q.status = 'failed') AS failed
            FROM {SCHEMA}.donor_broadcasts b ORDER BY b.created_at DESC LIMIT 50"""
    )
    return ok({"broadcasts": [dict(r) for r in cur.fetchall()]})


def run_queue(cur, conn, body):
    return ok({"queue": process_queue(cur, conn)})


def retry_failed(cur, conn, body):
    cur.execute(f"UPDATE {SCHEMA}.donor_email_queue SET status = 'pending', error = NULL WHERE status = 'failed'")
    moved = cur.rowcount
    conn.commit()
    return ok({"moved": moved, "queue": process_queue(cur, conn)})


def list_gifts(cur, conn, body):
    cur.execute(
        f"""SELECT g.*, a.email, a.full_name FROM {SCHEMA}.donor_gifts g JOIN {SCHEMA}.donor_accounts a ON a.id = g.account_id
            ORDER BY (g.status = 'sent'), g.created_at DESC LIMIT 300"""
    )
    return ok({"gifts": [dict(r) for r in cur.fetchall()]})


def add_gift(cur, conn, body):
    title = (body.get("title") or "").strip()
    if not title or not body.get("account_id"):
        return err("Выберите жертвователя и укажите подарок")
    cur.execute(
        f"INSERT INTO {SCHEMA}.donor_gifts (account_id, title, note) VALUES (%s, %s, %s) RETURNING id",
        (body["account_id"], title, (body.get("note") or "").strip() or None),
    )
    new_id = cur.fetchone()["id"]
    conn.commit()
    return ok({"id": new_id}, 201)


def mark_gift(cur, conn, body):
    status = "sent" if body.get("status") == "sent" else "planned"
    cur.execute(
        f"""UPDATE {SCHEMA}.donor_gifts SET status = %s, sent_at = CASE WHEN %s = 'sent' THEN NOW() ELSE NULL END,
                   note = COALESCE(%s, note) WHERE id = %s RETURNING account_id, title""",
        (status, status, (body.get("note") or "").strip() or None, body.get("id")),
    )
    row = cur.fetchone()
    if row and status == "sent" and body.get("notify"):
        add_message(cur, row["account_id"], "gift", "Мы отправили вам подарок", f"Подарок «{row['title']}» уже в пути к вам. Спасибо, что вы с нами!")
    conn.commit()
    return ok({"success": True})


def get_settings_action(cur, conn, body):
    return ok({"settings": get_settings(cur), "smtp_configured": smtp_configured()})


def save_settings(cur, conn, body):
    s = body.get("settings") or {}

    def text(key, default=None, limit=300):
        value = (s.get(key) or "").strip()[:limit]
        return value or default

    def number(key, default, low=1, high=3650):
        try:
            return max(low, min(high, int(s.get(key) or default)))
        except (TypeError, ValueError):
            return default

    site_url = (text("site_url", "https://спасениенадежды.рф") or "").rstrip("/")
    cur.execute(
        f"""UPDATE {SCHEMA}.donor_settings SET org_name = %s, org_inn = %s, org_ogrn = %s, org_address = %s,
                   org_signer = %s, org_signer_post = %s, site_url = %s, lapsed_days = %s, reminder_cooldown_days = %s WHERE id = 1""",
        (text("org_name", "АНО «Спасение надежды»"), text("org_inn", None, 20), text("org_ogrn", None, 20), text("org_address"),
         text("org_signer", None, 150), text("org_signer_post", None, 150), site_url,
         number("lapsed_days", 60), number("reminder_cooldown_days", 90)),
    )
    conn.commit()
    return ok({"settings": get_settings(cur)})


def run_automation(cur, conn, body):
    settings = get_settings(cur)
    sync_accounts(cur, conn)
    totals = totals_by_email(cur)
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_accounts")
    accounts = [dict(r) for r in cur.fetchall()]
    awards = anniversaries = reminders = 0

    from datetime import datetime, timedelta, timezone
    border = datetime.now(timezone.utc) - timedelta(days=int(settings["lapsed_days"]))
    for a in accounts:
        if not totals.get(a["email"]):
            continue
        stats = compute_stats(get_donations(cur, a["email"]))
        awards += evaluate_achievements(cur, a, stats)

        if stats["years"] >= 1:
            ref = f"anniv-{stats['years']}"
            cur.execute(
                f"INSERT INTO {SCHEMA}.donor_automation_log (account_id, kind, ref) VALUES (%s, 'anniversary', %s) ON CONFLICT DO NOTHING RETURNING id",
                (a["id"], ref),
            )
            if cur.fetchone():
                years = stats["years"]
                title = f"Вы с нами уже {years} {'год' if years == 1 else 'года' if years < 5 else 'лет'}"
                text = "Спасибо, что остаётесь рядом! Благодаря вам семьи в нашем центре получают поддержку, тепло и надежду. С годовщиной вашей помощи!"
                add_message(cur, a["id"], "anniversary", title, text)
                queue_email(cur, a, title, text, settings)
                anniversaries += 1

        last = stats["last_date"]
        if last:
            last_aware = last if last.tzinfo else last.replace(tzinfo=timezone.utc)
            if last_aware < border:
                cur.execute(
                    f"""SELECT 1 FROM {SCHEMA}.donor_automation_log WHERE account_id = %s AND kind = 'lapsed'
                        AND created_at > NOW() - (%s || ' days')::interval""",
                    (a["id"], str(int(settings["reminder_cooldown_days"]))),
                )
                if not cur.fetchone():
                    ref = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.donor_automation_log (account_id, kind, ref) VALUES (%s, 'lapsed', %s) ON CONFLICT DO NOTHING",
                        (a["id"], ref),
                    )
                    title = "Мы скучаем по вашей помощи"
                    text = "Давно не виделись! Наши мамы и дети всегда помнят вашу поддержку. Если вам удобно, помогите снова: даже небольшая сумма превращается в ужин, вещи или занятие с психологом."
                    add_message(cur, a["id"], "reminder", title, text)
                    queue_email(cur, a, title, text, settings)
                    reminders += 1
    conn.commit()
    queue = process_queue(cur, conn) if (anniversaries or reminders) else None
    return ok({"awards_granted": awards, "anniversaries": anniversaries, "reminders": reminders, "queue": queue})


ADMIN_ACTIONS = {
    "overview": overview,
    "accounts": list_accounts,
    "crud_list": crud_list,
    "crud_save": crud_save,
    "crud_delete": crud_delete,
    "award": award_manual,
    "revoke": revoke_award,
    "account_awards": account_awards,
    "broadcast": send_broadcast,
    "broadcasts": list_broadcasts,
    "run_queue": run_queue,
    "retry_failed": retry_failed,
    "gifts": list_gifts,
    "add_gift": add_gift,
    "mark_gift": mark_gift,
    "settings_get": get_settings_action,
    "settings_save": save_settings,
    "run_automation": run_automation,
}
