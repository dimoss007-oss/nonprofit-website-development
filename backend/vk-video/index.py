"""
Получение видео из публичной группы ВКонтакте (spasenienadezhdi).
Возвращает список видеозаписей с названием, описанием, превью и ссылкой.
"""
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime


VK_GROUP = "spasenienadezhdi"
VK_API_VERSION = "5.131"


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
        if not token:
            return {
                "statusCode": 401,
                "headers": cors_headers,
                "body": json.dumps({"error": "Access denied: token required"}),
            }

        params_q = event.get("queryStringParameters") or {}
        count = min(int(params_q.get("count", 12)), 50)
        offset = int(params_q.get("offset", 0))

        # Resolve group id first
        resolve_params = urllib.parse.urlencode({
            "screen_name": VK_GROUP,
            "access_token": token,
            "v": VK_API_VERSION,
        })
        with urllib.request.urlopen(f"https://api.vk.com/method/utils.resolveScreenName?{resolve_params}", timeout=10) as r:
            resolve_data = json.loads(r.read().decode())

        obj = resolve_data.get("response", {})
        owner_id = -obj.get("object_id", 0) if obj.get("type") == "group" else 0

        if not owner_id:
            return {
                "statusCode": 404,
                "headers": cors_headers,
                "body": json.dumps({"error": "Group not found"}),
            }

        params = urllib.parse.urlencode({
            "owner_id": owner_id,
            "count": count,
            "offset": offset,
            "access_token": token,
            "v": VK_API_VERSION,
        })
        url = f"https://api.vk.com/method/video.get?{params}"
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

        videos = []
        for item in items:
            thumb = (
                item.get("image", [{}])[-1].get("url")
                or item.get("photo_800")
                or item.get("photo_640")
                or item.get("photo_320")
                or item.get("photo_130")
            )
            date = datetime.utcfromtimestamp(item.get("date", 0)).strftime("%d.%m.%Y")
            player_url = item.get("player", "")
            vk_url = f"https://vk.com/video{item.get('owner_id', owner_id)}_{item['id']}"

            videos.append({
                "id": item["id"],
                "title": item.get("title", "Без названия"),
                "description": item.get("description", "")[:300],
                "duration": item.get("duration", 0),
                "date": date,
                "timestamp": item.get("date", 0),
                "thumb": thumb,
                "player": player_url,
                "url": vk_url,
                "views": item.get("views", 0),
                "likes": item.get("likes", {}).get("count", 0),
            })

        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"videos": videos, "total": total, "offset": offset, "count": len(videos)}, ensure_ascii=False),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": cors_headers,
            "body": json.dumps({"error": str(e)}),
        }
