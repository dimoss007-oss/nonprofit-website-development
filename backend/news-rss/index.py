import os
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from xml.sax.saxutils import escape

import psycopg2

SITE_URL = "https://spasenie58.ru"
FEED_TITLE = "АНО «Спасение надежды» — новости"
FEED_DESCRIPTION = "Новости кризисного центра «Спасение надежды» в Пензе"
MAX_ITEMS = 30


def strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "").strip()


def handler(event: dict, context) -> dict:
    """Отдаёт ленту новостей сайта в формате RSS 2.0 (XML) для чтения агрегаторами и подписчиками."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, title, text, photos, published_at, created_at FROM (
                SELECT DISTINCT ON (title, published_at) id, title, text, photos, published_at, created_at, vk_id
                FROM {schema}.news
                WHERE vk_id IS DISTINCT FROM -1
                ORDER BY title, published_at, vk_id DESC NULLS LAST, id ASC
            ) sub
            ORDER BY published_at DESC
            LIMIT {MAX_ITEMS}
        """)
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    items_xml = []
    for r in rows:
        news_id, title, text, photos, published_at, created_at = r
        pub_dt = published_at or created_at
        if pub_dt.tzinfo is None:
            pub_dt = pub_dt.replace(tzinfo=timezone.utc)
        pub_date_rfc822 = format_datetime(pub_dt)

        clean_text = strip_html(text)
        description = clean_text[:500] + ("..." if len(clean_text) > 500 else "")
        link = f"{SITE_URL}/news#{news_id}"

        enclosure = ""
        if photos:
            enclosure = f'<enclosure url="{escape(photos[0])}" type="image/jpeg" />'

        items_xml.append(f"""
    <item>
      <title>{escape(title)}</title>
      <link>{escape(link)}</link>
      <guid isPermaLink="false">news-{news_id}</guid>
      <pubDate>{pub_date_rfc822}</pubDate>
      <description>{escape(description)}</description>
      {enclosure}
    </item>""")

    now_rfc822 = format_datetime(datetime.now(timezone.utc))

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{escape(FEED_TITLE)}</title>
    <link>{escape(SITE_URL)}/news</link>
    <atom:link href="{escape(SITE_URL)}/news-rss.xml" rel="self" type="application/rss+xml" />
    <description>{escape(FEED_DESCRIPTION)}</description>
    <language>ru-RU</language>
    <lastBuildDate>{now_rfc822}</lastBuildDate>
    {''.join(items_xml)}
  </channel>
</rss>"""

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/rss+xml; charset=utf-8"},
        "body": rss,
    }
