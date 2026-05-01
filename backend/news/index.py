import json
import os
import base64
import uuid
import psycopg2
import boto3

def handler(event: dict, context) -> dict:
    """Получение и создание новостей. GET — список, POST — создать новость с фото и видео."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    try:
        if method == 'GET':
            cur = conn.cursor()
            cur.execute("""
                SELECT id, title, text, photos, video_url, published_at, created_at
                FROM news
                ORDER BY published_at DESC
            """)
            rows = cur.fetchall()
            news = [
                {
                    'id': r[0],
                    'title': r[1],
                    'text': r[2],
                    'photos': r[3] or [],
                    'video_url': r[4] or '',
                    'published_at': r[5].isoformat() if r[5] else r[6].isoformat(),
                    'created_at': r[6].isoformat(),
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'news': news}, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            title = body.get('title', '').strip()
            text = body.get('text', '').strip()
            photos_b64 = body.get('photos', [])
            video_url = body.get('video_url', '').strip()
            published_at = body.get('published_at', None)

            if not title or not text:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'title and text required'})}

            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            key_id = os.environ['AWS_ACCESS_KEY_ID']
            photo_urls = []
            for photo in photos_b64:
                ext = 'jpg'
                data_str = photo
                if ',' in photo:
                    header, data_str = photo.split(',', 1)
                    if 'png' in header:
                        ext = 'png'
                    elif 'webp' in header:
                        ext = 'webp'
                img_bytes = base64.b64decode(data_str)
                filename = f"news/{uuid.uuid4()}.{ext}"
                s3.put_object(Bucket='files', Key=filename, Body=img_bytes, ContentType=f"image/{ext}")
                photo_urls.append(f"https://cdn.poehali.dev/projects/{key_id}/bucket/{filename}")

            cur = conn.cursor()
            if published_at:
                cur.execute(
                    "INSERT INTO news (title, text, photos, video_url, published_at) VALUES (%s, %s, %s, %s, %s) RETURNING id, published_at",
                    (title, text, photo_urls, video_url, published_at)
                )
            else:
                cur.execute(
                    "INSERT INTO news (title, text, photos, video_url) VALUES (%s, %s, %s, %s) RETURNING id, published_at",
                    (title, text, photo_urls, video_url)
                )
            row = cur.fetchone()
            conn.commit()
            return {
                'statusCode': 201,
                'headers': cors,
                'body': json.dumps({'id': row[0], 'published_at': row[1].isoformat()}, ensure_ascii=False)
            }

        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            news_id = params.get('id')
            if not news_id:
                return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id required'})}
            cur = conn.cursor()
            cur.execute("DELETE FROM news WHERE id = %s", (news_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}

    finally:
        conn.close()
