import base64
import html
import json
import os
import re
import uuid

import boto3
import requests

from common import (SCHEMA, ensure_account, err, get_settings, ok, process_queue, queue_email,
                    smtp_configured)

GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
CLOSING = "Ваша помощь — часть этих изменений. Спасибо, что вы рядом!"
SYSTEM_PROMPT = (
    "Ты профессиональный копирайтер благотворительного фонда. Проанализируй предоставленные данные. "
    "Скрой любые точные адреса и измени имена для соблюдения 152-ФЗ. Сформируй текст для рассылки донорам "
    "строго в трех коротких абзацах с заголовками: БЫЛО, ЧТО СДЕЛАЛИ, СТАЛО. Описывай реальные изменения "
    f"без преувеличений. В конце обязательно добавь фразу: \"{CLOSING}\""
)


def goal_donor_filter(goal_id: int) -> str:
    return f"status = 'paid' AND user_email LIKE '%@%' AND order_comment ~ '\\|gid:{int(goal_id)}(\\||$)'"


def goal_donors(cur, goal_id: int) -> list:
    cur.execute(
        f"""SELECT lower(trim(user_email)) AS email,
                   (array_agg(user_name ORDER BY created_at DESC))[1] AS name,
                   SUM(amount)::float AS total
            FROM {SCHEMA}.orders WHERE {goal_donor_filter(goal_id)}
            GROUP BY lower(trim(user_email))"""
    )
    return [dict(r) for r in cur.fetchall()]


def get_report(cur, conn, body):
    goal_id = int(body.get("goal_id") or 0)
    cur.execute(f"SELECT * FROM {SCHEMA}.goal_reports WHERE goal_id = %s", (goal_id,))
    row = cur.fetchone()
    donors = goal_donors(cur, goal_id)
    return ok({"report": dict(row) if row else None, "donors_count": len(donors)})


def save_report(cur, conn, body):
    goal_id = int(body.get("goal_id") or 0)
    if not goal_id:
        return err("Не выбран сбор")
    fields = [(body.get(k) or "").strip()[:3000] for k in ("situation_before", "action_taken", "situation_after")]
    ai_text = body.get("ai_text")
    ai_text = ai_text.strip()[:6000] if isinstance(ai_text, str) else None
    cur.execute(
        f"""INSERT INTO {SCHEMA}.goal_reports (goal_id, situation_before, action_taken, situation_after, ai_text)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (goal_id) DO UPDATE SET situation_before = EXCLUDED.situation_before,
              action_taken = EXCLUDED.action_taken, situation_after = EXCLUDED.situation_after,
              ai_text = COALESCE(EXCLUDED.ai_text, {SCHEMA}.goal_reports.ai_text), updated_at = NOW()""",
        (goal_id, *fields, ai_text),
    )
    conn.commit()
    return ok({"ok": True})


def upload_photo(cur, conn, body):
    goal_id = int(body.get("goal_id") or 0)
    ctype = body.get("file_type") or "image/jpeg"
    if not goal_id or ctype not in ("image/jpeg", "image/png", "image/webp"):
        return err("Нужна фотография JPG, PNG или WebP")
    raw = base64.b64decode(body.get("file_data") or "")
    if not raw or len(raw) > 4_000_000:
        return err("Фото слишком большое или пустое")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[ctype]
    key = f"goal-reports/{goal_id}/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                      aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=ctype)
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    cur.execute(
        f"""INSERT INTO {SCHEMA}.goal_reports (goal_id, photo_url) VALUES (%s, %s)
            ON CONFLICT (goal_id) DO UPDATE SET photo_url = EXCLUDED.photo_url, updated_at = NOW()""",
        (goal_id, url),
    )
    conn.commit()
    return ok({"photo_url": url})


def generate_text(cur, conn, body):
    before = (body.get("situation_before") or "").strip()
    action = (body.get("action_taken") or "").strip()
    after = (body.get("situation_after") or "").strip()
    if not (before and action and after):
        return err("Заполните все три поля: было, что сделали, стало")
    folder_id = os.environ.get("YANDEX_FOLDER_ID")
    api_key = os.environ.get("YANDEX_API_KEY")
    if not folder_id or not api_key:
        return err("YandexGPT не настроен", 500)
    user_text = f"БЫЛО: {before[:2000]}\n\nЧТО СДЕЛАЛИ: {action[:2000]}\n\nСТАЛО: {after[:2000]}"
    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.3, "maxTokens": 900},
        "messages": [{"role": "system", "text": SYSTEM_PROMPT}, {"role": "user", "text": user_text}],
    }
    try:
        resp = requests.post(GPT_URL, headers={"Authorization": f"Api-Key {api_key}"}, json=payload, timeout=40)
    except requests.exceptions.RequestException as e:
        print(f"YandexGPT error: {e}")
        return err("YandexGPT не ответил, попробуйте ещё раз", 502)
    if not resp.ok:
        print(f"YandexGPT HTTP {resp.status_code}: {resp.text[:400]}")
        return err("YandexGPT вернул ошибку, попробуйте ещё раз", 502)
    text = resp.json()["result"]["alternatives"][0]["message"]["text"].strip()
    if CLOSING not in text:
        text += f"\n\n{CLOSING}"
    return ok({"ai_text": text})


def render_html(name: str, text: str, photo_url: str, footer: str) -> str:
    greeting = f"Здравствуйте, {html.escape(name)}!" if name else "Здравствуйте!"
    paragraphs = "".join(
        f"<p style=\"margin:0 0 14px;line-height:1.55;\">{html.escape(p).replace(chr(10), '<br>')}</p>"
        for p in text.split("\n\n") if p.strip()
    )
    photo = f"<img src=\"{html.escape(photo_url)}\" alt=\"\" style=\"max-width:100%;border-radius:10px;margin:0 0 16px;\">" if photo_url else ""
    return (
        "<div style=\"font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:560px;margin:0 auto;\">"
        f"<p style=\"margin:0 0 14px;\">{greeting}</p>{photo}{paragraphs}"
        f"<p style=\"margin:18px 0 0;font-size:12px;color:#888;white-space:pre-line;\">{html.escape(footer)}</p></div>"
    )


def send_report(cur, conn, body):
    goal_id = int(body.get("goal_id") or 0)
    cur.execute(f"SELECT * FROM {SCHEMA}.goal_reports WHERE goal_id = %s", (goal_id,))
    report = cur.fetchone()
    if not report or not (report["ai_text"] or "").strip():
        return err("Сначала подготовьте и сохраните текст отчёта")
    if not smtp_configured():
        return err("Почта не настроена, письма отправить нельзя")
    cur.execute(f"SELECT title FROM {SCHEMA}.fundraising_goals WHERE id = %s", (goal_id,))
    goal = cur.fetchone()
    if not goal:
        return err("Сбор не найден", 404)
    donors = goal_donors(cur, goal_id)
    if not donors:
        return err("У этого сбора нет оплаченных пожертвований с email", 404)

    settings = get_settings(cur)
    subject = f"Отчёт о сборе «{goal['title']}»"[:200]
    cur.execute(
        f"""INSERT INTO {SCHEMA}.donor_broadcasts (title, body, audience, in_cabinet, by_email, created_by, recipients_count)
            VALUES (%s, %s, 'goal', FALSE, TRUE, %s, %s) RETURNING id""",
        (subject, report["ai_text"], (body.get("auth_login") or "")[:100], len(donors)),
    )
    broadcast_id = cur.fetchone()["id"]
    footer = f"{settings['org_name']}\n{settings['site_url']}"
    queued = 0
    for d in donors:
        account = ensure_account(cur, d["email"])
        name = (d["name"] or "").strip()
        if name in ("Аноним", "Жертвователь"):
            name = ""
        plain = (f"Здравствуйте, {name}!\n\n" if name else "Здравствуйте!\n\n") + report["ai_text"]
        if report["photo_url"]:
            plain += f"\n\nФото: {report['photo_url']}"
        if queue_email(cur, account, subject, plain, settings, broadcast_id):
            cur.execute(
                f"UPDATE {SCHEMA}.donor_email_queue SET body_html = %s WHERE id = (SELECT MAX(id) FROM {SCHEMA}.donor_email_queue WHERE broadcast_id = %s AND account_id = %s)",
                (render_html(name, report["ai_text"], report["photo_url"] or "", footer), broadcast_id, account["id"]),
            )
            queued += 1
    cur.execute(
        f"UPDATE {SCHEMA}.goal_reports SET sent_at = NOW(), sent_count = %s WHERE goal_id = %s", (queued, goal_id)
    )
    conn.commit()
    result = process_queue(cur, conn)
    return ok({"recipients": len(donors), "emails_queued": queued, "queue": result})
