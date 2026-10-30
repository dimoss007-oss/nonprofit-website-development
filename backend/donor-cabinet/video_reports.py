import re
from urllib.parse import parse_qs, urlparse

from common import SCHEMA, err, ok

CATEGORIES = ("aid_distribution", "mobile_brigade", "center_life", "gratitude")


def parse_video(url: str):
    """Возвращает (embed_url, thumbnail_url) или None, если ссылка не распознана."""
    url = (url or "").strip()
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower().removeprefix("www.").removeprefix("m.")
    if host in ("vk.com", "vkvideo.ru", "vk.ru"):
        m = re.search(r"video(-?\d+)_(\d+)", url)
        if not m:
            return None
        return f"https://vk.com/video_ext.php?oid={m.group(1)}&id={m.group(2)}&hd=2", None
    if host in ("youtube.com", "youtu.be", "youtube-nocookie.com"):
        vid = None
        if host == "youtu.be":
            vid = parsed.path.strip("/").split("/")[0]
        else:
            vid = (parse_qs(parsed.query).get("v") or [None])[0]
            m = re.match(r"^/(?:shorts|embed|live)/([\w-]{6,})", parsed.path)
            if m:
                vid = m.group(1)
        if vid and re.fullmatch(r"[\w-]{6,20}", vid):
            return f"https://www.youtube-nocookie.com/embed/{vid}", f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
        return None
    if host == "rutube.ru":
        m = re.search(r"/(?:video|play/embed)/([0-9a-f]{32})", parsed.path)
        if m:
            return f"https://rutube.ru/play/embed/{m.group(1)}", None
    return None


def list_videos(cur, conn, body):
    cur.execute(f"SELECT * FROM {SCHEMA}.video_reports ORDER BY created_at DESC LIMIT 200")
    return ok({"videos": [dict(r) for r in cur.fetchall()]})


def save_video(cur, conn, body):
    video_id = int(body.get("id") or 0)
    title = (body.get("title") or "").strip()[:200]
    category = body.get("category")
    video_url = (body.get("video_url") or "").strip()[:500]
    thumb = (body.get("thumbnail_url") or "").strip()[:500] or None
    description = (body.get("description") or "").strip()[:1000]
    consent = bool(body.get("consent_obtained"))
    publish = bool(body.get("is_published"))

    if not title:
        return err("Укажите название ролика")
    if category not in CATEGORIES:
        return err("Выберите категорию")
    parsed = parse_video(video_url)
    if not parsed:
        return err("Не удалось распознать ссылку. Поддерживаются ВКонтакте, YouTube и RuTube")
    if publish and not consent:
        return err("Публикация невозможна без подтверждения письменного согласия")
    if not consent:
        publish = False
    embed_url, auto_thumb = parsed
    thumb = thumb or auto_thumb

    if video_id:
        cur.execute(
            f"""UPDATE {SCHEMA}.video_reports SET title=%s, category=%s, video_url=%s, embed_url=%s, thumbnail_url=%s,
                description=%s, consent_obtained=%s, is_published=%s,
                published_at = CASE WHEN %s AND NOT is_published THEN NOW() WHEN NOT %s THEN NULL ELSE published_at END
                WHERE id=%s RETURNING id""",
            (title, category, video_url, embed_url, thumb, description, consent, publish, publish, publish, video_id),
        )
        if not cur.fetchone():
            return err("Ролик не найден", 404)
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.video_reports (title, category, video_url, embed_url, thumbnail_url, description,
                consent_obtained, is_published, published_at, created_by)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s, CASE WHEN %s THEN NOW() END, %s) RETURNING id""",
            (title, category, video_url, embed_url, thumb, description, consent, publish, publish,
             (body.get("auth_login") or "")[:100]),
        )
        video_id = cur.fetchone()["id"]
    conn.commit()
    return ok({"id": video_id, "is_published": publish, "embed_url": embed_url})


def delete_video(cur, conn, body):
    cur.execute(f"DELETE FROM {SCHEMA}.video_reports WHERE id = %s", (int(body.get("id") or 0),))
    conn.commit()
    return ok({"ok": True})


def public_videos(cur, conn, event, params):
    cur.execute(
        f"""SELECT id, title, category, embed_url, thumbnail_url, description, published_at
            FROM {SCHEMA}.video_reports WHERE is_published AND consent_obtained
            ORDER BY published_at DESC LIMIT 60"""
    )
    return ok({"videos": [dict(r) for r in cur.fetchall()]})
