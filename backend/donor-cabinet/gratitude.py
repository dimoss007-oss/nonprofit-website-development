import base64
import os
import uuid

import boto3
import requests

from common import SCHEMA, err, ok
from cabinet import require_account

TYPES = ("drawing", "card", "letter")
GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
ANON_PROMPT = (
    "Ты редактор благотворительного фонда. Тебе дают письмо от подопечной. Удали из текста все реальные "
    "фамилии, имена, отчества, названия городов, улиц, адреса, телефоны и места работы. Имена замени на "
    "нейтральные слова (например: «мама», «наша семья»). Сохрани эмоции, смысл и стиль автора, ничего "
    "не придумывай и не добавляй. Верни только готовый текст без пояснений."
)
PUBLIC_FIELDS = "id, post_type, media_url, caption, letter_text, goal_id, published_at"


def list_posts(cur, conn, body):
    cur.execute(
        f"""SELECT p.*, g.title AS goal_title FROM {SCHEMA}.gratitude_posts p
            LEFT JOIN {SCHEMA}.fundraising_goals g ON g.id = p.goal_id ORDER BY p.created_at DESC LIMIT 200"""
    )
    return ok({"posts": [dict(r) for r in cur.fetchall()]})


def save_post(cur, conn, body):
    post_id = int(body.get("id") or 0)
    post_type = body.get("post_type") if body.get("post_type") in TYPES else "drawing"
    media_url = (body.get("media_url") or "").strip() or None
    caption = (body.get("caption") or "").strip()[:300]
    letter_text = (body.get("letter_text") or "").strip()[:6000] or None
    consent = bool(body.get("consent_obtained"))
    publish = bool(body.get("is_published"))
    goal_id = int(body.get("goal_id") or 0) or None

    if publish:
        if not consent:
            return err("Публикация невозможна без подтверждения добровольного согласия")
        if not media_url and not letter_text:
            return err("Добавьте скан или текст письма")
    if not consent:
        publish = False

    if post_id:
        cur.execute(
            f"""UPDATE {SCHEMA}.gratitude_posts SET post_type=%s, media_url=%s, caption=%s, letter_text=%s,
                consent_obtained=%s, goal_id=%s, is_published=%s,
                published_at = CASE WHEN %s AND NOT is_published THEN NOW() WHEN NOT %s THEN NULL ELSE published_at END
                WHERE id=%s RETURNING id""",
            (post_type, media_url, caption, letter_text, consent, goal_id, publish, publish, publish, post_id),
        )
        if not cur.fetchone():
            return err("Запись не найдена", 404)
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.gratitude_posts (post_type, media_url, caption, letter_text, consent_obtained,
                goal_id, is_published, published_at, created_by)
                VALUES (%s,%s,%s,%s,%s,%s,%s, CASE WHEN %s THEN NOW() END, %s) RETURNING id""",
            (post_type, media_url, caption, letter_text, consent, goal_id, publish, publish,
             (body.get("auth_login") or "")[:100]),
        )
        post_id = cur.fetchone()["id"]
    conn.commit()
    return ok({"id": post_id, "is_published": publish})


def delete_post(cur, conn, body):
    cur.execute(f"DELETE FROM {SCHEMA}.gratitude_posts WHERE id = %s", (int(body.get("id") or 0),))
    conn.commit()
    return ok({"ok": True})


def upload_media(cur, conn, body):
    ctype = body.get("file_type") or ""
    if ctype not in ("image/jpeg", "image/png", "image/webp"):
        return err("Нужна картинка JPG, PNG или WebP")
    raw = base64.b64decode(body.get("file_data") or "")
    if not raw or len(raw) > 4_000_000:
        return err("Файл пустой или слишком большой")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[ctype]
    key = f"gratitude/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                      aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                      aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=ctype)
    return ok({"media_url": f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"})


def anonymize(cur, conn, body):
    text = (body.get("text") or "").strip()
    if len(text) < 20:
        return err("Вставьте текст письма")
    folder_id = os.environ.get("YANDEX_FOLDER_ID")
    api_key = os.environ.get("YANDEX_API_KEY")
    if not folder_id or not api_key:
        return err("YandexGPT не настроен", 500)
    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.1, "maxTokens": 1500},
        "messages": [{"role": "system", "text": ANON_PROMPT}, {"role": "user", "text": text[:5000]}],
    }
    try:
        resp = requests.post(GPT_URL, headers={"Authorization": f"Api-Key {api_key}"}, json=payload, timeout=40)
    except requests.exceptions.RequestException as e:
        print(f"YandexGPT error: {e}")
        return err("YandexGPT не ответил, попробуйте ещё раз", 502)
    if not resp.ok:
        print(f"YandexGPT HTTP {resp.status_code}: {resp.text[:400]}")
        return err("YandexGPT вернул ошибку, попробуйте ещё раз", 502)
    return ok({"text": resp.json()["result"]["alternatives"][0]["message"]["text"].strip()})


def public_posts(cur, conn, event, params):
    goal_id = int(params.get("goal_id") or 0)
    cond = "is_published AND consent_obtained" + (" AND goal_id = %s" if goal_id else "")
    cur.execute(
        f"SELECT {PUBLIC_FIELDS} FROM {SCHEMA}.gratitude_posts WHERE {cond} ORDER BY published_at DESC LIMIT 100",
        (goal_id,) if goal_id else None,
    )
    return ok({"posts": [dict(r) for r in cur.fetchall()]})


def my_posts(cur, conn, event, params):
    account, failed = require_account(cur, event)
    if failed:
        return failed
    cur.execute(
        f"""SELECT {PUBLIC_FIELDS} FROM {SCHEMA}.gratitude_posts
            WHERE is_published AND consent_obtained AND goal_id IN (
              SELECT DISTINCT (regexp_match(order_comment, '\\|gid:(\\d+)'))[1]::int FROM {SCHEMA}.orders
              WHERE status = 'paid' AND lower(trim(user_email)) = %s AND order_comment ~ '\\|gid:\\d+')
            ORDER BY published_at DESC LIMIT 100""",
        (account["email"],),
    )
    return ok({"posts": [dict(r) for r in cur.fetchall()]})
