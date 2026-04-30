"""
Скачивает изображение по URL и сохраняет в S3, возвращает CDN-ссылку.
"""
import os
import json
import uuid
import urllib.request
import urllib.error
import boto3


def handler(event: dict, context) -> dict:
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
        url = body.get("url", "")
        if not url:
            return {"statusCode": 400, "headers": cors_headers, "body": json.dumps({"error": "url required"})}

        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Referer": "https://vk.com/",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]

        ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else content_type.split("/")[-1]
        key = f"news/{uuid.uuid4()}.{ext}"

        s3 = boto3.client(
            "s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
        )
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"url": cdn_url}),
        }

    except urllib.error.HTTPError as e:
        return {"statusCode": 502, "headers": cors_headers, "body": json.dumps({"error": f"HTTP {e.code}: {e.reason}"})}
    except Exception as e:
        return {"statusCode": 500, "headers": cors_headers, "body": json.dumps({"error": str(e)})}
