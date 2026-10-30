import io
import os
import re
from datetime import date

import requests
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from common import SCHEMA, err, get_settings, ok
from docs import ACCENT, INK, SOFT, ensure_fonts, money, to_b64, wrap
from goal_reports import CLOSING

GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg"
INTRO_PROMPT = (
    "Ты PR-менеджер благотворительного фонда. Тебе дан список проектов и историй, которые мы реализовали за год "
    "благодаря компании «{company}». Напиши красивое, вдохновляющее вступительное слово для годового отчета "
    "(до 1500 символов). Подчеркни масштаб их вклада, перечисли главные достижения и поблагодари за партнерство. "
    "Тон профессиональный, но душевный. Не выдумывай факты, цифры и имена, которых нет в данных. "
    "Верни только текст вступления без заголовка."
)


def story_text(text: str) -> str:
    text = (text or "").replace(CLOSING, "").strip()
    return re.sub(r"[ \t]+", " ", text)


def _year(body) -> int:
    try:
        year = int(body.get("year") or 0)
    except (TypeError, ValueError):
        year = 0
    return year if 2000 <= year <= 2100 else date.today().year


def list_orgs(cur, conn, body):
    q = (body.get("q") or "").strip().lower()
    cur.execute(
        f"""SELECT id, name, email, inn FROM {SCHEMA}.donors_orgs
            WHERE %s = '' OR lower(name) LIKE %s OR lower(COALESCE(email, '')) LIKE %s OR COALESCE(inn, '') LIKE %s
            ORDER BY name LIMIT 50""",
        (q, f"%{q}%", f"%{q}%", f"%{q}%"),
    )
    return ok({"orgs": [dict(r) for r in cur.fetchall()]})


def build_draft(cur, conn, body):
    org_id = int(body.get("org_id") or 0)
    year = _year(body)
    cur.execute(f"SELECT id, name, email, inn FROM {SCHEMA}.donors_orgs WHERE id = %s", (org_id,))
    org = cur.fetchone()
    if not org:
        return err("Компания не найдена", 404)

    rows = []
    cur.execute(
        f"""SELECT amount::float AS amount, goal_id FROM {SCHEMA}.donor_donations
            WHERE donor_type = 'org' AND donor_id = %s AND EXTRACT(YEAR FROM donated_at) = %s""",
        (org_id, year),
    )
    rows += [(r["amount"], r["goal_id"]) for r in cur.fetchall()]
    email = (org["email"] or "").strip().lower()
    if email:
        cur.execute(
            f"""SELECT amount::float AS amount, order_comment FROM {SCHEMA}.orders
                WHERE status = 'paid' AND lower(trim(user_email)) = %s
                  AND EXTRACT(YEAR FROM COALESCE(paid_at, created_at)) = %s""",
            (email, year),
        )
        for r in cur.fetchall():
            m = re.search(r"\|gid:(\d+)", r["order_comment"] or "")
            rows.append((r["amount"], int(m.group(1)) if m else None))

    total = round(sum(a for a, _ in rows), 2)
    by_goal = {}
    for amount, goal_id in rows:
        if goal_id:
            by_goal[goal_id] = by_goal.get(goal_id, 0) + amount

    projects = []
    if by_goal:
        cur.execute(
            f"""SELECT g.id, g.title, r.ai_text, r.photo_url FROM {SCHEMA}.fundraising_goals g
                LEFT JOIN {SCHEMA}.goal_reports r ON r.goal_id = g.id WHERE g.id = ANY(%s)""",
            (list(by_goal.keys()),),
        )
        for g in cur.fetchall():
            projects.append({
                "goal_id": g["id"], "title": g["title"], "amount": round(by_goal[g["id"]], 2),
                "story": story_text(g["ai_text"]), "photo_url": g["photo_url"],
            })
        projects.sort(key=lambda p: -p["amount"])

    return ok({
        "org": dict(org), "year": year, "total": total, "count": len(rows), "projects": projects,
    })


def generate_intro(cur, conn, body):
    company = (body.get("company") or "").strip()[:150]
    year = _year(body)
    projects = body.get("projects") or []
    if not company:
        return err("Не указана компания")
    folder_id = os.environ.get("YANDEX_FOLDER_ID")
    api_key = os.environ.get("YANDEX_API_KEY")
    if not folder_id or not api_key:
        return err("YandexGPT не настроен", 500)
    lines = [f"Год: {year}. Общая сумма поддержки: {round(float(body.get('total') or 0))} руб."]
    for p in projects[:10]:
        lines.append(f"Проект: {str(p.get('title') or '')[:120]}. {story_text(str(p.get('story') or ''))[:500]}")
    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.5, "maxTokens": 900},
        "messages": [
            {"role": "system", "text": INTRO_PROMPT.format(company=company)},
            {"role": "user", "text": "\n\n".join(lines)},
        ],
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
    if len(text) > 1500:
        cut = text[:1500]
        end = max(cut.rfind(". "), cut.rfind("! "), cut.rfind(".\n"))
        text = cut[:end + 1] if end > 600 else cut.rstrip()
    return ok({"intro": text})


def _image(url: str):
    if not url or not url.startswith("https://"):
        return None
    try:
        r = requests.get(url, timeout=5)
        if r.ok and len(r.content) < 6_000_000:
            return ImageReader(io.BytesIO(r.content))
    except requests.exceptions.RequestException:
        pass
    return None


def _draw_image(c, img, x, y, w, h):
    iw, ih = img.getSize()
    scale = max(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    c.saveState()
    p = c.beginPath()
    p.rect(x, y, w, h)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(img, x - (dw - w) / 2, y - (dh - h) / 2, dw, dh)
    c.restoreState()


def _paragraph(c, text, x, y, width, font, size, lead, max_lines, color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    lines = []
    for block in [b for b in re.split(r"\n+", text or "") if b.strip()]:
        lines += wrap(c, block, font, size, width)
        lines.append("")
    while lines and lines[-1] == "":
        lines.pop()
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = lines[-1].rstrip(" .,;:") + "…"
    for line in lines:
        if line:
            c.drawString(x, y, line)
        y -= lead
    return y


def build_pdf(cur, conn, body):
    ensure_fonts()
    settings = get_settings(cur)
    company = (body.get("company") or "").strip()[:150]
    year = _year(body)
    intro = (body.get("intro") or "").strip()[:2000]
    total = float(body.get("total") or 0)
    count = int(body.get("count") or 0)
    families = int(body.get("families") or 0)
    projects = [p for p in (body.get("projects") or []) if isinstance(p, dict)][:10]
    photos = [u for u in (body.get("photos") or []) if isinstance(u, str)][:3]
    if not company or not intro:
        return err("Нужны название компании и вступительное слово")

    org_name = settings.get("org_name") or "АНО «Спасение надежды»"
    site = settings.get("site_url") or ""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    margin = 56
    logo = _image(LOGO_URL)

    c.setFillColor(INK)
    c.rect(0, 0, w, h, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(0, h - 10, w, 10, stroke=0, fill=1)
    if logo:
        c.drawImage(logo, w / 2 - 45, h - 220, 90, 90, mask="auto")
    c.setFillColor(colors.white)
    c.setFont("OS-B", 13)
    c.drawCentredString(w / 2, h - 250, org_name.upper())
    y = h - 360
    c.setFont("OS", 14)
    c.setFillColor(colors.HexColor("#c9cde6"))
    c.drawCentredString(w / 2, y, "Годовой отчёт для партнёра")
    y -= 44
    c.setFillColor(colors.white)
    c.setFont("OS-B", 28)
    for line in wrap(c, company, "OS-B", 28, w - 2 * margin)[:3]:
        c.drawCentredString(w / 2, y, line)
        y -= 38
    y -= 20
    c.setFont("OS", 18)
    for line in wrap(c, f"Добрые дела, которые мы сделали вместе. Итоги {year}", "OS", 18, w - 2 * margin - 40)[:3]:
        c.drawCentredString(w / 2, y, line)
        y -= 26
    c.showPage()

    c.setFillColor(INK)
    c.setFont("OS-B", 20)
    c.drawString(margin, h - 80, "Слово от команды фонда")
    c.setFillColor(ACCENT)
    c.rect(margin, h - 92, 48, 3, stroke=0, fill=1)
    y = _paragraph(c, intro, margin, h - 126, w - 2 * margin, "OS", 11.5, 17, 30)
    box_y = 150
    c.setFillColor(SOFT)
    c.roundRect(margin, box_y, w - 2 * margin, 110, 10, stroke=0, fill=1)
    stats = [(money(total).replace(" руб.", " ₽"), "общий вклад за год"), (str(count), "пожертвований"), (str(len(projects)), "проектов")]
    if families > 0:
        stats.append((str(families), "семей получили помощь"))
    col = (w - 2 * margin) / len(stats)
    for i, (value, label) in enumerate(stats):
        cx = margin + col * i + col / 2
        c.setFillColor(INK)
        c.setFont("OS-B", 17 if len(value) < 12 else 14)
        c.drawCentredString(cx, box_y + 62, value)
        c.setFillColor(colors.HexColor("#555a7a"))
        c.setFont("OS", 9.5)
        c.drawCentredString(cx, box_y + 40, label)
    c.showPage()

    c.setFillColor(INK)
    c.setFont("OS-B", 20)
    c.drawString(margin, h - 80, "Истории, которые стали возможны")
    c.setFillColor(ACCENT)
    c.rect(margin, h - 92, 48, 3, stroke=0, fill=1)
    y = h - 124
    shown = [p for p in projects if (p.get("story") or "").strip()][:2] or projects[:2]
    for p in shown:
        c.setFillColor(INK)
        c.setFont("OS-B", 12.5)
        for line in wrap(c, str(p.get("title") or ""), "OS-B", 12.5, w - 2 * margin)[:2]:
            c.drawString(margin, y, line)
            y -= 17
        if float(p.get("amount") or 0) > 0:
            c.setFont("OS", 9.5)
            c.setFillColor(ACCENT)
            c.drawString(margin, y, f"Вклад компании: {money(float(p['amount']))}")
            y -= 16
        y = _paragraph(c, str(p.get("story") or ""), margin, y - 2, w - 2 * margin, "OS", 10, 14, 12) - 14
    imgs = [i for i in (_image(u) for u in photos) if i]
    if imgs:
        gap = 12
        pw = (w - 2 * margin - gap * (len(imgs) - 1)) / len(imgs)
        ph = 120
        for i, img in enumerate(imgs):
            _draw_image(c, img, margin + i * (pw + gap), 150, pw, ph)

    c.setFillColor(INK)
    c.rect(0, 0, w, 110, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("OS-B", 13)
    c.drawString(margin, 78, "Будем рады продолжить сотрудничество")
    c.setFont("OS", 10)
    c.setFillColor(colors.HexColor("#c9cde6"))
    contacts = [org_name]
    if settings.get("org_address"):
        contacts.append(str(settings["org_address"]))
    if site:
        contacts.append(site)
    yy = 60
    for line in contacts[:3]:
        c.drawString(margin, yy, line[:110])
        yy -= 14
    c.showPage()
    c.save()
    return ok({"pdf_base64": to_b64(buf), "file_name": f"otchet-{year}.pdf"})
