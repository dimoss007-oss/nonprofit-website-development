"""
Получение постов из публичной группы ВКонтакте (spasenienadezhdi).
Возвращает список постов с текстом, датой, фото и ссылкой.
"""
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime


VK_GROUP = "spasenienadezhdi"
VK_API_VERSION = "5.131"
POSTS_COUNT = 20


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        token = os.environ.get("VK_ACCESS_TOKEN", "")
        count = int((event.get("queryStringParameters") or {}).get("count", POSTS_COUNT))
        offset = int((event.get("queryStringParameters") or {}).get("offset", 0))

        params = urllib.parse.urlencode({
            "domain": VK_GROUP,
            "count": min(count, 50),
            "offset": offset,
            "filter": "owner",
            "access_token": token,
            "v": VK_API_VERSION,
        })

        url = f"https://api.vk.com/method/wall.get?{params}"
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        if "error" in data:
            return {
                "statusCode": 500,
                "headers": cors_headers,
                "body": json.dumps({"error": data["error"].get("error_msg", "VK API error")}),
            }

        items = data.get("response", {}).get("items", [])
        total = data.get("response", {}).get("count", 0)

        posts = []
        for item in items:
            if item.get("marked_as_ads") or not item.get("text"):
                continue

            photo = None
            attachments = item.get("attachments", [])
            for att in attachments:
                if att.get("type") == "photo":
                    sizes = att["photo"].get("sizes", [])
                    best = sorted(sizes, key=lambda s: s.get("width", 0), reverse=True)
                    if best:
                        photo = best[0]["url"]
                    break

            post_date = datetime.utcfromtimestamp(item["date"])
            posts.append({
                "id": item["id"],
                "text": item["text"][:800] + ("..." if len(item["text"]) > 800 else ""),
                "full_text": item["text"],
                "date": post_date.strftime("%d.%m.%Y"),
                "timestamp": item["date"],
                "photo": photo,
                "likes": item.get("likes", {}).get("count", 0),
                "reposts": item.get("reposts", {}).get("count", 0),
                "views": item.get("views", {}).get("count", 0),
                "url": f"https://vk.com/wall-{abs(item['owner_id'])}_{item['id']}",
            })

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({
                "posts": posts,
                "total": total,
                "offset": offset,
                "count": len(posts),
            }, ensure_ascii=False),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)}),
        }
