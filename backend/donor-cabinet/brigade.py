import base64
import os
import re
import uuid

import boto3
import requests

from common import SCHEMA, err, ok

MAX_API_URL = "https://platform-api.max.ru"
INTERESTS = {"trips": "Финансирование выездов", "car": "Обслуживание автомобиля", "other": "Другое"}


def public_data(cur, conn, event, params):
    cur.execute(f"SELECT period_label, trips, families, km, districts, settlements, parcels, map_url FROM {SCHEMA}.brigade_stats WHERE id = 1")
    stats = dict(cur.fetchone())
    cur.execute(
        f"""SELECT id, title, amount, goal_id, result_text FROM {SCHEMA}.brigade_actions
            WHERE is_active AND goal_id IS NOT NULL ORDER BY sort_order, id"""
    )
    actions = [dict(r) for r in cur.fetchall()]
    cur.execute(
        f"""SELECT id, district, lat::float AS lat, lon::float AS lon, title, description, photo_url, trip_date
            FROM {SCHEMA}.brigade_trips WHERE is_published AND consent_obtained
            ORDER BY trip_date DESC NULLS LAST, id DESC LIMIT 60"""
    )
    return ok({"stats": stats, "actions": actions, "trips": [dict(r) for r in cur.fetchall()]})


def admin_get(cur, conn, body):
    cur.execute(f"SELECT * FROM {SCHEMA}.brigade_stats WHERE id = 1")
    stats = dict(cur.fetchone())
    cur.execute(f"SELECT * FROM {SCHEMA}.brigade_actions ORDER BY sort_order, id")
    actions = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {SCHEMA}.brigade_trips ORDER BY created_at DESC LIMIT 100")
    trips = [dict(r) for r in cur.fetchall()]
    cur.execute(f"SELECT * FROM {SCHEMA}.partner_requests ORDER BY created_at DESC LIMIT 50")
    return ok({"stats": stats, "actions": actions, "trips": trips, "partners": [dict(r) for r in cur.fetchall()]})


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
        f"""UPDATE {SCHEMA}.brigade_stats SET period_label=%s, trips=%s, families=%s, km=%s, districts=%s,
            settlements=%s, parcels=%s, map_url=%s, updated_at=NOW() WHERE id = 1""",
        ((body.get("period_label") or "").strip()[:60], _num(body.get("trips")), _num(body.get("families")),
         _num(body.get("km")), _num(body.get("districts")), _num(body.get("settlements")), _num(body.get("parcels")), map_url),
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
    result_text = (body.get("result_text") or "").strip()[:200]
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
            f"UPDATE {SCHEMA}.brigade_actions SET title=%s, amount=%s, is_active=%s, sort_order=%s, goal_id=%s, result_text=%s WHERE id=%s",
            (title, amount, active, order, goal_id, result_text, action_id),
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.brigade_actions (title, amount, goal_id, is_active, sort_order, result_text) VALUES (%s,%s,%s,%s,%s,%s)",
            (title, amount, goal_id, active, order, result_text),
        )
    conn.commit()
    return ok({"ok": True})


def delete_action(cur, conn, body):
    cur.execute(f"DELETE FROM {SCHEMA}.brigade_actions WHERE id = %s", (int(body.get("id") or 0),))
    conn.commit()
    return ok({"ok": True})


def save_trip(cur, conn, body):
    trip_id = int(body.get("id") or 0)
    district = (body.get("district") or "").strip()[:80]
    title = (body.get("title") or "").strip()[:150]
    description = (body.get("description") or "").strip()[:1000]
    photo = (body.get("photo_url") or "").strip()[:600] or None
    consent = bool(body.get("consent_obtained"))
    publish = bool(body.get("is_published"))
    try:
        lat, lon = float(body.get("lat")), float(body.get("lon"))
    except (TypeError, ValueError):
        return err("Выберите район из списка")
    trip_date = (body.get("trip_date") or "").strip() or None
    if not district or not title:
        return err("Укажите район и название выезда")
    if publish and not consent:
        return err("Публикация невозможна без подтверждения согласий и обезличивания")
    if trip_id:
        cur.execute(
            f"""UPDATE {SCHEMA}.brigade_trips SET district=%s, lat=%s, lon=%s, title=%s, description=%s, photo_url=%s,
                trip_date=%s, consent_obtained=%s, is_published=%s WHERE id=%s""",
            (district, lat, lon, title, description, photo, trip_date, consent, publish, trip_id),
        )
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.brigade_trips (district, lat, lon, title, description, photo_url, trip_date, consent_obtained, is_published)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (district, lat, lon, title, description, photo, trip_date, consent, publish),
        )
    conn.commit()
    return ok({"ok": True})


def delete_trip(cur, conn, body):
    cur.execute(f"DELETE FROM {SCHEMA}.brigade_trips WHERE id = %s", (int(body.get("id") or 0),))
    conn.commit()
    return ok({"ok": True})


def upload_trip_photo(cur, conn, body):
    ctype = body.get("file_type") or "image/jpeg"
    if ctype not in ("image/jpeg", "image/png", "image/webp"):
        return err("Нужна фотография JPG, PNG или WebP")
    raw = base64.b64decode(body.get("file_data") or "")
    if not raw or len(raw) > 4_000_000:
        return err("Фото слишком большое или пустое")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[ctype]
    key = f"brigade-trips/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                      aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=ctype)
    return ok({"photo_url": f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"})


def partner_status(cur, conn, body):
    status = body.get("status") if body.get("status") in ("new", "in_work", "done") else "new"
    cur.execute(f"UPDATE {SCHEMA}.partner_requests SET status = %s WHERE id = %s", (status, int(body.get("id") or 0)))
    conn.commit()
    return ok({"ok": True})


def submit_partner(cur, conn, event, body):
    company = (body.get("company") or "").strip()[:200]
    name = (body.get("contact_name") or "").strip()[:150]
    phone = (body.get("phone") or "").strip()[:40]
    interest = body.get("interest") if body.get("interest") in INTERESTS else "trips"
    if len(company) < 2 or len(name) < 2:
        return err("Укажите название компании и имя контактного лица")
    if len(re.sub(r"\D", "", phone)) < 10:
        return err("Укажите телефон для связи")
    cur.execute(
        f"""SELECT COUNT(*) AS n FROM {SCHEMA}.partner_requests
            WHERE phone = %s AND created_at > NOW() - INTERVAL '10 minutes'""",
        (phone,),
    )
    if cur.fetchone()["n"] >= 2:
        return err("Заявка уже отправлена, мы свяжемся с вами", 429)
    cur.execute(
        f"INSERT INTO {SCHEMA}.partner_requests (company, contact_name, phone, interest) VALUES (%s,%s,%s,%s)",
        (company, name, phone, interest),
    )
    conn.commit()
    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    if token:
        cur.execute(f"SELECT chat_id FROM {SCHEMA}.max_contact_subscribers")
        text = (
            "Новая заявка: партнёр проекта «Мобильная бригада»\n\n"
            f"Компания: {company}\nКонтакт: {name}\nТелефон: {phone}\nИнтерес: {INTERESTS[interest]}"
        )
        for row in cur.fetchall():
            try:
                requests.post(f"{MAX_API_URL}/messages", params={"user_id": row["chat_id"]},
                              headers={"Authorization": token}, json={"text": text}, timeout=5)
            except requests.exceptions.RequestException as e:
                print(f"max notify error: {e}")
    return ok({"ok": True})
