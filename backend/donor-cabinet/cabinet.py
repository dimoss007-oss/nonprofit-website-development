from datetime import date

from auth import account_from_token
from common import (SCHEMA, compute_stats, err, evaluate_achievements, get_donations, get_levels,
                    get_settings, level_info, ok, totals_by_email)
from docs import build_certificate, build_tax_statement


def require_account(cur, event):
    account = account_from_token(cur, event)
    if not account:
        return None, err("Требуется вход в кабинет", 401)
    return account, None


def display_name(account: dict) -> str:
    return account.get("display_name") or account.get("full_name") or account["email"].split("@")[0]


def public_name(account: dict) -> str:
    name = (account.get("display_name") or account.get("full_name") or "").strip()
    if not name:
        return "Друг центра"
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][:1]}."
    return parts[0]


def impact_for(total: float, items: list) -> list:
    return [
        {"title": i["title"], "icon": i["icon"], "unit_label": i["unit_label"],
         "count": int(total // float(i["unit_cost"]))}
        for i in items
    ]


def get_overview(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed

    donations = get_donations(cur, account["email"])
    stats = compute_stats(donations)
    if evaluate_achievements(cur, account, stats):
        conn.commit()

    levels = get_levels(cur)
    lvl = level_info(stats["total"], levels)

    cur.execute(
        f"""SELECT a.id, a.title, a.description, a.icon, a.color, a.kind, a.threshold, a.certificate,
                   w.awarded_at, w.id AS award_id
            FROM {SCHEMA}.donor_achievements a
            LEFT JOIN {SCHEMA}.donor_awards w ON w.achievement_id = a.id AND w.account_id = %s
            WHERE a.is_active ORDER BY a.sort_order, a.id""",
        (account["id"],),
    )
    achievements = []
    for r in cur.fetchall():
        r = dict(r)
        earned = r["awarded_at"] is not None
        progress = None
        if not earned and r["kind"] != "manual":
            from common import achievement_value
            threshold = 1 if r["kind"] == "first_donation" else float(r["threshold"])
            value = achievement_value(r["kind"], stats)
            progress = {"value": value, "target": threshold,
                        "pct": int(max(0, min(99, value / threshold * 100))) if threshold else 0}
        r["earned"] = earned
        r["progress"] = progress
        achievements.append(r)

    cur.execute(f"SELECT * FROM {SCHEMA}.donor_impact_items WHERE is_active ORDER BY sort_order, id")
    impact = impact_for(stats["total"], cur.fetchall())

    cur.execute(f"SELECT COUNT(*) AS n FROM {SCHEMA}.donor_messages WHERE account_id = %s AND NOT is_read", (account["id"],))
    unread = cur.fetchone()["n"]

    cur.execute(
        f"""SELECT COUNT(DISTINCT lower(trim(o.user_email))) AS friends, COALESCE(SUM(o.amount), 0)::float AS amount
            FROM {SCHEMA}.orders o WHERE o.status = 'paid' AND o.referrer_code = %s
              AND lower(trim(o.user_email)) <> %s""",
        (account["referral_code"], account["email"]),
    )
    ref = dict(cur.fetchone())

    totals = totals_by_email(cur)
    cur.execute(f"SELECT email FROM {SCHEMA}.donor_accounts WHERE show_in_rating")
    rated = sorted((totals[r["email"]]["total"] for r in cur.fetchall() if r["email"] in totals), reverse=True)
    my_total = stats["total"]
    place = (sum(1 for t in rated if t > my_total) + 1) if account["show_in_rating"] and my_total > 0 else None

    settings = get_settings(cur)
    return ok({
        "profile": {
            "email": account["email"], "name": display_name(account), "full_name": account.get("full_name"),
            "display_name": account.get("display_name"), "address": account.get("address"),
            "show_in_rating": account["show_in_rating"], "email_unsubscribed": account["email_unsubscribed"],
            "referral_code": account["referral_code"], "member_since": account["created_at"],
        },
        "stats": {**stats, "avg": round(stats["total"] / stats["count"], 2) if stats["count"] else 0},
        "level": lvl, "levels": levels, "achievements": achievements, "impact": impact,
        "unread_messages": unread, "referrals": ref, "rating_place": place, "rating_total": len(rated),
        "years_available": sorted({d["dt"].year for d in donations}, reverse=True),
        "site_url": settings["site_url"],
        "recent": [{"amount": d["amount"], "dt": d["dt"], "monthly": d["monthly"]} for d in donations[:10]],
    })


def get_messages(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    cur.execute(
        f"""SELECT id, kind, title, body, is_read, created_at FROM {SCHEMA}.donor_messages
            WHERE account_id = %s ORDER BY created_at DESC LIMIT 100""",
        (account["id"],),
    )
    return ok({"messages": [dict(r) for r in cur.fetchall()]})


def mark_read(cur, conn, event, body):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    cur.execute(f"UPDATE {SCHEMA}.donor_messages SET is_read = TRUE WHERE account_id = %s AND NOT is_read", (account["id"],))
    conn.commit()
    return ok({"success": True})


def get_feed(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    cur.execute(
        f"""SELECT id, title, body, image_url, created_at FROM {SCHEMA}.donor_feed
            WHERE is_published ORDER BY created_at DESC LIMIT 50"""
    )
    return ok({"posts": [dict(r) for r in cur.fetchall()]})


def get_rating(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    totals = totals_by_email(cur)
    cur.execute(f"SELECT id, email, full_name, display_name FROM {SCHEMA}.donor_accounts WHERE show_in_rating")
    rows = []
    for r in cur.fetchall():
        t = totals.get(r["email"])
        if t and t["total"] > 0:
            rows.append({"name": public_name(dict(r)), "total": round(t["total"], 2), "count": t["cnt"], "me": r["id"] == account["id"]})
    rows.sort(key=lambda x: x["total"], reverse=True)
    top = []
    for i, row in enumerate(rows[:20], 1):
        top.append({**row, "place": i})
    me = next(({**row, "place": i} for i, row in enumerate(rows, 1) if row["me"]), None)
    return ok({"top": top, "me": me, "total_donors": len(rows)})


def update_profile(cur, conn, event, body):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    full_name = (body.get("full_name") or "").strip()[:150] or None
    display = (body.get("display_name") or "").strip()[:60] or None
    address = (body.get("address") or "").strip()[:300] or None
    cur.execute(
        f"""UPDATE {SCHEMA}.donor_accounts SET full_name = %s, display_name = %s, address = %s,
                   show_in_rating = %s, email_unsubscribed = %s WHERE id = %s""",
        (full_name, display, address, bool(body.get("show_in_rating", True)),
         bool(body.get("email_unsubscribed", False)), account["id"]),
    )
    conn.commit()
    return ok({"success": True})


def certificate(cur, conn, event, body):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    donations = get_donations(cur, account["email"])
    stats = compute_stats(donations)
    if not stats["count"]:
        return err("Сертификат станет доступен после первого пожертвования", 400)

    settings = get_settings(cur)
    achievement_id = body.get("achievement_id")
    title = "за помощь семьям и детям, оказавшимся в трудной жизненной ситуации"
    text = "Ваша поддержка помогает мамам и детям центра чувствовать заботу, безопасность и надежду на новую жизнь. Спасибо, что вы рядом."
    if achievement_id:
        cur.execute(
            f"""SELECT a.title, a.description, a.reward_message, a.certificate FROM {SCHEMA}.donor_awards w
                JOIN {SCHEMA}.donor_achievements a ON a.id = w.achievement_id
                WHERE w.account_id = %s AND a.id = %s""",
            (account["id"], achievement_id),
        )
        row = cur.fetchone()
        if not row:
            return err("Эта награда вам ещё не выдана", 403)
        title = f"Награда «{row['title']}»"
        text = row["reward_message"] or row["description"] or text
    pdf = build_certificate(display_name_for_doc(account), title, text, stats["total"], settings)
    return ok({"file_name": "Сертификат_благодарности.pdf", "file_base64": pdf, "content_type": "application/pdf"})


def display_name_for_doc(account: dict) -> str:
    return account.get("full_name") or account.get("display_name") or account["email"]


def tax_statement(cur, conn, event, body):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    try:
        year = int(body.get("year") or date.today().year)
    except (TypeError, ValueError):
        return err("Некорректный год")
    donations = [d for d in get_donations(cur, account["email"]) if d["dt"].year == year]
    if not donations:
        return err(f"За {year} год пожертвований не найдено", 404)
    donations.sort(key=lambda d: d["dt"])
    settings = get_settings(cur)
    pdf = build_tax_statement(account, year, donations, settings)
    return ok({"file_name": f"Справка_о_пожертвованиях_{year}.pdf", "file_base64": pdf, "content_type": "application/pdf"})


def year_summary(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    try:
        year = int(params.get("year") or date.today().year)
    except (TypeError, ValueError):
        return err("Некорректный год")
    donations = [d for d in get_donations(cur, account["email"]) if d["dt"].year == year]
    if not donations:
        return ok({"year": year, "empty": True})
    total = round(sum(d["amount"] for d in donations), 2)
    by_month = {}
    for d in donations:
        by_month[d["dt"].month] = by_month.get(d["dt"].month, 0) + d["amount"]
    best_month = max(by_month.items(), key=lambda kv: kv[1])
    cur.execute(f"SELECT * FROM {SCHEMA}.donor_impact_items WHERE is_active ORDER BY sort_order, id")
    impact = impact_for(total, cur.fetchall())
    cur.execute(
        f"""SELECT a.title FROM {SCHEMA}.donor_awards w JOIN {SCHEMA}.donor_achievements a ON a.id = w.achievement_id
            WHERE w.account_id = %s AND EXTRACT(YEAR FROM w.awarded_at) = %s ORDER BY w.awarded_at""",
        (account["id"], year),
    )
    return ok({
        "year": year, "empty": False, "total": total, "count": len(donations),
        "best_month": best_month[0], "best_month_amount": round(best_month[1], 2),
        "months_active": len(by_month), "awards": [r["title"] for r in cur.fetchall()], "impact": impact,
    })


def public_info(cur, conn, event, params):
    cur.execute(f"SELECT id, title, description, min_amount::float AS min_amount, icon, color FROM {SCHEMA}.donor_levels ORDER BY min_amount")
    levels = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"SELECT id, title, description, icon, color FROM {SCHEMA}.donor_achievements WHERE is_active ORDER BY sort_order, id"
    )
    return ok({"levels": levels, "achievements": [dict(r) for r in cur.fetchall()]})
