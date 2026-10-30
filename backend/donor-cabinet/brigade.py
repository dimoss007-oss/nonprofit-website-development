from common import SCHEMA, err, ok


def public_data(cur, conn, event, params):
    cur.execute(f"SELECT period_label, trips, families, km, map_url FROM {SCHEMA}.brigade_stats WHERE id = 1")
    stats = dict(cur.fetchone())
    cur.execute(
        f"""SELECT id, title, amount, goal_id FROM {SCHEMA}.brigade_actions
            WHERE is_active AND goal_id IS NOT NULL ORDER BY sort_order, id"""
    )
    return ok({"stats": stats, "actions": [dict(r) for r in cur.fetchall()]})


def admin_get(cur, conn, body):
    cur.execute(f"SELECT * FROM {SCHEMA}.brigade_stats WHERE id = 1")
    stats = dict(cur.fetchone())
    cur.execute(f"SELECT * FROM {SCHEMA}.brigade_actions ORDER BY sort_order, id")
    return ok({"stats": stats, "actions": [dict(r) for r in cur.fetchall()]})


def _num(value, high=10_000_000) -> int:
    try:
        return max(0, min(high, int(value or 0)))
    except (TypeError, ValueError):
        return 0


def save_stats(cur, conn, body):
    map_url = (body.get("map_url") or "").strip()[:600] or None
    if map_url and not map_url.startswith("https://"):
        return err("Ссылка на карту должна начинаться с https://")
    cur.execute(
        f"""UPDATE {SCHEMA}.brigade_stats SET period_label=%s, trips=%s, families=%s, km=%s, map_url=%s, updated_at=NOW()
            WHERE id = 1""",
        ((body.get("period_label") or "").strip()[:60], _num(body.get("trips")), _num(body.get("families")),
         _num(body.get("km")), map_url),
    )
    conn.commit()
    return ok({"ok": True})


def save_action(cur, conn, body):
    action_id = int(body.get("id") or 0)
    title = (body.get("title") or "").strip()[:120]
    if not title:
        return err("Укажите название кнопки")
    amount = max(1, _num(body.get("amount"), 1_000_000) or 500)
    active = bool(body.get("is_active", True))
    order = _num(body.get("sort_order"), 1000)
    if action_id:
        cur.execute(f"SELECT goal_id FROM {SCHEMA}.brigade_actions WHERE id = %s", (action_id,))
        row = cur.fetchone()
        if not row:
            return err("Кнопка не найдена", 404)
        goal_id = row["goal_id"]
    else:
        goal_id = None
    if goal_id:
        cur.execute(f"UPDATE {SCHEMA}.fundraising_goals SET title = %s WHERE id = %s", (f"Мобильная бригада: {title}", goal_id))
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.fundraising_goals (title, description, target_amount, collected_amount, is_active, sort_order)
                VALUES (%s, 'Адресный сбор страницы «Мобильная бригада»', 0, 0, FALSE, 900) RETURNING id""",
            (f"Мобильная бригада: {title}",),
        )
        goal_id = cur.fetchone()["id"]
    if action_id:
        cur.execute(
            f"UPDATE {SCHEMA}.brigade_actions SET title=%s, amount=%s, is_active=%s, sort_order=%s, goal_id=%s WHERE id=%s",
            (title, amount, active, order, goal_id, action_id),
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.brigade_actions (title, amount, goal_id, is_active, sort_order) VALUES (%s,%s,%s,%s,%s)",
            (title, amount, goal_id, active, order),
        )
    conn.commit()
    return ok({"ok": True})


def delete_action(cur, conn, body):
    cur.execute(f"DELETE FROM {SCHEMA}.brigade_actions WHERE id = %s", (int(body.get("id") or 0),))
    conn.commit()
    return ok({"ok": True})
