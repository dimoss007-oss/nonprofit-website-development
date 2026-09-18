"""
Единый модуль интеграции с VK (группа spasenienadezhdi): новости, синхронизация в БД, видео.
Маршрутизация — через query-параметр route:
  GET  ?route=news  (по умолчанию для GET)  — публичные посты со стены для сайта
  GET  ?route=video                          — видеозаписи группы
  POST ?route=sync  (по умолчанию для POST)  — синхронизация постов в таблицу news
Сетевые вызовы к VK API выполняются через aiohttp/asyncio (неблокирующе).
Подключение к PostgreSQL инициализируется в глобальной области видимости и переиспользуется
между «горячими» вызовами функции, чтобы не исчерпывать лимит подключений к БД.
"""
import asyncio
import json
import os
from datetime import datetime, timezone

import aiohttp
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
VK_GROUP = "spasenienadezhdi"
VK_API_VERSION = "5.131"
VK_API_BASE = "https://api.vk.com/method"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Подключение к БД инициализируется один раз при холодном старте функции (глобальная область
# видимости, до объявления handler). При «тёплых» повторных вызовах соединение переиспользуется —
# это защищает БД от исчерпания лимита подключений при частых обращениях.
_DATABASE_URL = os.environ.get("DATABASE_URL", "")
_conn = psycopg2.connect(_DATABASE_URL) if _DATABASE_URL else None


def get_conn():
    """Возвращает переиспользуемое соединение с БД, восстанавливая его только если оно оборвалось."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(_DATABASE_URL)
    return _conn


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, status=500):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


async def vk_call(session: aiohttp.ClientSession, method: str, params: dict) -> dict:
    """Асинхронный GET-запрос к методу VK API. Не блокирует выполнение функции в ожидании ответа."""
    params = {**params, "v": VK_API_VERSION}
    async with session.get(f"{VK_API_BASE}/{method}", params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
        return await resp.json()


def extract_best_photo(attachments: list) -> str | None:
    for att in attachments:
        if att.get("type") == "photo":
            sizes = att["photo"].get("sizes", [])
            best = sorted(sizes, key=lambda s: s.get("width", 0), reverse=True)
            if best:
                return best[0]["url"]
    return None


def extract_video_url(attachments: list) -> str:
    for att in attachments:
        if att.get("type") == "video":
            video = att["video"]
            return f"https://vk.com/video{video.get('owner_id', 0)}_{video.get('id', 0)}"
    return ""


def parse_title(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return "Новость из ВКонтакте"
    title = lines[0]
    return title[:120] + ("..." if len(title) > 120 else "")


async def fetch_news(token: str, count: int, offset: int) -> dict:
    """GET ?route=news — последние посты со стены группы для публичной страницы новостей."""
    async with aiohttp.ClientSession() as session:
        data = await vk_call(session, "wall.get", {
            "domain": VK_GROUP,
            "count": min(count, 50),
            "offset": offset,
            "filter": "owner",
            "access_token": token,
        })

    if "error" in data:
        raise RuntimeError(data["error"].get("error_msg", "VK API error"))

    items = data.get("response", {}).get("items", [])
    total = data.get("response", {}).get("count", 0)

    posts = []
    for item in items:
        if item.get("marked_as_ads") or not item.get("text"):
            continue
        post_date = datetime.utcfromtimestamp(item["date"])
        posts.append({
            "id": item["id"],
            "text": item["text"][:800] + ("..." if len(item["text"]) > 800 else ""),
            "full_text": item["text"],
            "date": post_date.strftime("%d.%m.%Y"),
            "timestamp": item["date"],
            "photo": extract_best_photo(item.get("attachments", [])),
            "likes": item.get("likes", {}).get("count", 0),
            "reposts": item.get("reposts", {}).get("count", 0),
            "views": item.get("views", {}).get("count", 0),
            "url": f"https://vk.com/wall-{abs(item['owner_id'])}_{item['id']}",
        })

    return {"posts": posts, "total": total, "offset": offset, "count": len(posts)}


async def fetch_video(token: str, count: int, offset: int) -> dict:
    """GET ?route=video — видеозаписи группы."""
    async with aiohttp.ClientSession() as session:
        resolve_data = await vk_call(session, "utils.resolveScreenName", {
            "screen_name": VK_GROUP,
            "access_token": token,
        })

        obj = resolve_data.get("response", {})
        owner_id = -obj.get("object_id", 0) if obj.get("type") == "group" else 0
        if not owner_id:
            raise LookupError("Group not found")

        data = await vk_call(session, "video.get", {
            "owner_id": owner_id,
            "count": min(count, 50),
            "offset": offset,
            "access_token": token,
        })

    if "error" in data:
        raise RuntimeError(data["error"].get("error_msg", "VK API error"))

    items = data.get("response", {}).get("items", [])
    total = data.get("response", {}).get("count", 0)

    videos = []
    for item in items:
        thumb = (
            item.get("image", [{}])[-1].get("url")
            or item.get("photo_800") or item.get("photo_640")
            or item.get("photo_320") or item.get("photo_130")
        )
        videos.append({
            "id": item["id"],
            "title": item.get("title", "Без названия"),
            "description": item.get("description", "")[:300],
            "duration": item.get("duration", 0),
            "date": datetime.utcfromtimestamp(item.get("date", 0)).strftime("%d.%m.%Y"),
            "timestamp": item.get("date", 0),
            "thumb": thumb,
            "player": item.get("player", ""),
            "url": f"https://vk.com/video{item.get('owner_id', owner_id)}_{item['id']}",
            "views": item.get("views", 0),
            "likes": item.get("likes", {}).get("count", 0),
        })

    return {"videos": videos, "total": total, "offset": offset, "count": len(videos)}


async def fetch_sync_items(token: str, count: int) -> list:
    """Забирает посты со стены для синхронизации в БД (без блокирующего requests)."""
    async with aiohttp.ClientSession() as session:
        data = await vk_call(session, "wall.get", {
            "domain": VK_GROUP,
            "count": min(count, 100),
            "offset": 0,
            "filter": "owner",
            "access_token": token,
        })

    if "error" in data:
        raise RuntimeError(data["error"].get("error_msg", "VK API error"))

    return data.get("response", {}).get("items", [])


def sync_to_db(items: list) -> dict:
    """POST ?route=sync — синхронизация постов в таблицу news (лайки/просмотры/дедупликация)."""
    conn = get_conn()
    cur = conn.cursor()

    added = 0
    skipped = 0
    updated = 0

    for item in items:
        if item.get("marked_as_ads"):
            skipped += 1
            continue

        text = (item.get("text") or "").strip()
        if not text:
            skipped += 1
            continue

        vk_id = item["id"]
        post_dt = datetime.fromtimestamp(item["date"], tz=timezone.utc)
        title = parse_title(text)
        likes = item.get("likes", {}).get("count", 0)
        views = item.get("views", {}).get("count", 0)

        cur.execute(f"SELECT id FROM {SCHEMA}.news WHERE vk_id = %s LIMIT 1", (vk_id,))
        row = cur.fetchone()
        if row:
            cur.execute(f"UPDATE {SCHEMA}.news SET likes = %s, views = %s WHERE id = %s", (likes, views, row[0]))
            updated += 1
            continue

        cur.execute(f"SELECT id FROM {SCHEMA}.news WHERE title = %s AND published_at = %s LIMIT 1", (title, post_dt))
        row = cur.fetchone()
        if row:
            cur.execute(f"UPDATE {SCHEMA}.news SET likes = %s, views = %s, vk_id = %s WHERE id = %s", (likes, views, vk_id, row[0]))
            updated += 1
            continue

        attachments = item.get("attachments", [])
        photo = extract_best_photo(attachments)
        photos = [photo] if photo else []
        video_url = extract_video_url(attachments)

        cur.execute(
            f"""INSERT INTO {SCHEMA}.news (title, text, photos, video_url, published_at, created_at, vk_id, likes, views)
                VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s)""",
            (title, text, photos, video_url, post_dt, vk_id, likes, views),
        )
        added += 1

    conn.commit()
    cur.close()

    return {"added": added, "updated": updated, "skipped": skipped, "total_processed": len(items)}


def handler(event: dict, context) -> dict:
    """Единая точка входа для всех VK-интеграций (роутинг по query-параметру route)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    route = params.get("route") or ("sync" if method == "POST" else "news")
    token = os.environ.get("VK_ACCESS_TOKEN", "")

    try:
        if route == "news":
            count = int(params.get("count", 20))
            offset = int(params.get("offset", 0))
            return ok(asyncio.run(fetch_news(token, count, offset)))

        if route == "video":
            if not token:
                return err("Access denied: token required", 401)
            count = int(params.get("count", 12))
            offset = int(params.get("offset", 0))
            return ok(asyncio.run(fetch_video(token, count, offset)))

        if route == "sync":
            count = int(params.get("count", 50))
            items = asyncio.run(fetch_sync_items(token, count))
            return ok(sync_to_db(items))

        return err(f"Неизвестный маршрут: {route}. Используйте route=news|video|sync", 404)

    except LookupError as e:
        return err(str(e), 404)
    except Exception as e:
        return err(str(e), 500)
