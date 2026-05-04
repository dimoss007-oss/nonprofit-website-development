"""
Синхронизация постов из ВКонтакте (группа spasenienadezhdi) в таблицу news.
POST — запустить синхронизацию вручную или по расписанию.
"""
import os
import json
import urllib.request
import urllib.parse
import psycopg2
from datetime import datetime, timezone

VK_GROUP = "spasenienadezhdi"
VK_API_VERSION = "5.131"
POSTS_COUNT = 50
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def fetch_vk_posts(token: str, count: int = POSTS_COUNT, offset: int = 0) -> list:
    p = {
        "domain": VK_GROUP,
        "count": min(count, 100),
        "offset": offset,
        "filter": "owner",
        "v": VK_API_VERSION,
        "access_token": token,
    }
    url = f"https://api.vk.com/method/wall.get?{urllib.parse.urlencode(p)}"
    with urllib.request.urlopen(url, timeout=15) as resp:
        data = json.loads(resp.read().decode())

    if "error" in data:
        raise RuntimeError(data["error"].get("error_msg", "VK API error"))

    return data.get("response", {}).get("items", [])


def extract_photos(attachments: list) -> list:
    photos = []
    for att in attachments:
        if att.get("type") == "photo":
            sizes = att["photo"].get("sizes", [])
            best = sorted(sizes, key=lambda s: s.get("width", 0), reverse=True)
            if best:
                photos.append(best[0]["url"])
    return photos


def extract_video_url(attachments: list) -> str:
    for att in attachments:
        if att.get("type") == "video":
            video = att["video"]
            owner_id = video.get("owner_id", 0)
            vid_id = video.get("id", 0)
            return f"https://vk.com/video{owner_id}_{vid_id}"
    return ""


def parse_title(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return "Новость из ВКонтакте"
    title = lines[0]
    return title[:120] + ("..." if len(title) > 120 else "")


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    token = os.environ.get("VK_ACCESS_TOKEN", "")
    params = event.get("queryStringParameters") or {}
    count = int(params.get("count", 50))

    items = fetch_vk_posts(token=token, count=count)

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    added = 0
    skipped = 0

    for item in items:
        if item.get("marked_as_ads"):
            skipped += 1
            continue

        text = item.get("text", "").strip()
        if not text:
            skipped += 1
            continue

        vk_id = item["id"]
        owner_id = item.get("owner_id", 0)
        vk_url = f"https://vk.com/wall{owner_id}_{vk_id}"

        search_str = f"%{vk_url}%"
        cur.execute(
            "SELECT id FROM " + SCHEMA + ".news WHERE text LIKE '" + vk_url.replace("'", "''") + "' OR text LIKE %s LIMIT 1",
            (search_str,)
        )
        if cur.fetchone():
            skipped += 1
            continue

        attachments = item.get("attachments", [])
        photos = extract_photos(attachments)
        video_url = extract_video_url(attachments)
        title = parse_title(text)

        body_text = text + f"\n\n— {vk_url}"

        post_dt = datetime.fromtimestamp(item["date"], tz=timezone.utc)

        cur.execute(
            "INSERT INTO " + SCHEMA + ".news (title, text, photos, video_url, published_at, created_at) VALUES (%s, %s, %s, %s, %s, NOW())",
            (title, body_text, photos, video_url, post_dt)
        )
        added += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"added": added, "skipped": skipped, "total_processed": len(items)}, ensure_ascii=False),
    }