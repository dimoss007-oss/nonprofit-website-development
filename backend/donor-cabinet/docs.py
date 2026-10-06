import base64
import io
import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
_fonts_ready = False

INK = colors.HexColor("#1b2150")
ACCENT = colors.HexColor("#e5584a")
SOFT = colors.HexColor("#f6f1ea")


def ensure_fonts():
    global _fonts_ready
    if _fonts_ready:
        return
    pdfmetrics.registerFont(TTFont("OS", os.path.join(FONT_DIR, "OpenSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("OS-B", os.path.join(FONT_DIR, "OpenSans-Bold.ttf")))
    _fonts_ready = True


def money(value: float) -> str:
    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " руб."


def ru_date(d) -> str:
    months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]
    return f"{d.day} {months[d.month - 1]} {d.year} г."


def wrap(c, text: str, font: str, size: float, max_width: float) -> list:
    words = (text or "").split()
    lines, line = [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if c.stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def to_b64(buf: io.BytesIO) -> str:
    return base64.b64encode(buf.getvalue()).decode("ascii")


def build_certificate(donor_name: str, title: str, text: str, total: float, settings: dict) -> str:
    ensure_fonts()
    buf = io.BytesIO()
    w, h = landscape(A4)
    c = canvas.Canvas(buf, pagesize=(w, h))

    c.setFillColor(SOFT)
    c.rect(0, 0, w, h, stroke=0, fill=1)
    c.setStrokeColor(INK)
    c.setLineWidth(3)
    c.rect(24, 24, w - 48, h - 48, stroke=1, fill=0)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1)
    c.rect(34, 34, w - 68, h - 68, stroke=1, fill=0)

    c.setFillColor(ACCENT)
    c.setFont("OS-B", 13)
    c.drawCentredString(w / 2, h - 90, settings["org_name"].upper())

    c.setFillColor(INK)
    c.setFont("OS-B", 40)
    c.drawCentredString(w / 2, h - 150, "БЛАГОДАРНОСТЬ")

    c.setFont("OS", 14)
    c.drawCentredString(w / 2, h - 185, "выражается с глубокой признательностью")

    name_size = 30
    while c.stringWidth(donor_name, "OS-B", name_size) > w - 160 and name_size > 16:
        name_size -= 2
    c.setFillColor(ACCENT)
    c.setFont("OS-B", name_size)
    c.drawCentredString(w / 2, h - 240, donor_name)

    c.setStrokeColor(ACCENT)
    c.line(w / 2 - 120, h - 252, w / 2 + 120, h - 252)

    c.setFillColor(INK)
    c.setFont("OS-B", 16)
    c.drawCentredString(w / 2, h - 286, title)

    c.setFont("OS", 13)
    y = h - 316
    for line in wrap(c, text, "OS", 13, w - 220)[:5]:
        c.drawCentredString(w / 2, y, line)
        y -= 20

    if total > 0:
        c.setFont("OS", 12)
        c.drawCentredString(w / 2, 120, f"Общая сумма помощи: {money(total)}")

    c.setFont("OS", 11)
    c.setFillColor(colors.HexColor("#555a7a"))
    signer = settings.get("org_signer") or ""
    post = settings.get("org_signer_post") or "Руководитель"
    c.drawString(80, 78, ru_date(date.today()))
    if signer:
        c.drawRightString(w - 80, 90, signer)
        c.drawRightString(w - 80, 74, post)
    else:
        c.drawRightString(w - 80, 78, post)

    c.showPage()
    c.save()
    return to_b64(buf)


def build_tax_statement(account: dict, year: int, rows: list, settings: dict) -> str:
    ensure_fonts()
    buf = io.BytesIO()
    w, h = A4
    c = canvas.Canvas(buf, pagesize=A4)
    left, right = 50, w - 50

    def header():
        c.setFillColor(INK)
        c.setFont("OS-B", 14)
        c.drawString(left, h - 60, settings["org_name"])
        c.setFont("OS", 10)
        c.setFillColor(colors.HexColor("#555a7a"))
        line = []
        if settings.get("org_inn"):
            line.append(f"ИНН {settings['org_inn']}")
        if settings.get("org_ogrn"):
            line.append(f"ОГРН {settings['org_ogrn']}")
        if line:
            c.drawString(left, h - 76, ", ".join(line))
        if settings.get("org_address"):
            c.drawString(left, h - 90, settings["org_address"][:110])

    header()
    c.setFillColor(INK)
    c.setFont("OS-B", 16)
    c.drawCentredString(w / 2, h - 135, "СПРАВКА О ПОЖЕРТВОВАНИЯХ")
    c.setFont("OS", 11)
    c.drawCentredString(w / 2, h - 153, f"за {year} год")

    total = round(sum(r["amount"] for r in rows), 2)
    name = account.get("full_name") or account.get("display_name") or account["email"]
    c.setFont("OS", 11)
    y = h - 190
    intro = (
        f"Настоящая справка выдана: {name} ({account['email']}) в том, что в {year} году "
        f"им были внесены добровольные пожертвования в пользу {settings['org_name']} на общую сумму {money(total)}."
    )
    for line in wrap(c, intro, "OS", 11, right - left):
        c.drawString(left, y, line)
        y -= 16

    y -= 14
    c.setFont("OS-B", 10)
    c.setFillColor(INK)
    c.drawString(left, y, "№")
    c.drawString(left + 35, y, "Дата")
    c.drawRightString(right, y, "Сумма")
    c.setStrokeColor(colors.HexColor("#c9cbe0"))
    c.line(left, y - 5, right, y - 5)
    y -= 22
    c.setFont("OS", 10)
    for i, r in enumerate(rows, 1):
        if y < 120:
            c.showPage()
            header()
            c.setFont("OS", 10)
            c.setFillColor(INK)
            y = h - 140
        c.drawString(left, y, str(i))
        c.drawString(left + 35, y, ru_date(r["dt"]))
        c.drawRightString(right, y, money(r["amount"]))
        y -= 18

    c.setStrokeColor(INK)
    c.line(left, y + 6, right, y + 6)
    c.setFont("OS-B", 11)
    c.drawString(left + 35, y - 12, "Итого")
    c.drawRightString(right, y - 12, money(total))

    y -= 60
    c.setFont("OS", 10)
    c.setFillColor(colors.HexColor("#555a7a"))
    note = "Пожертвования получены на уставную деятельность организации. Справка сформирована автоматически на основе данных платёжных систем и CRM."
    for line in wrap(c, note, "OS", 10, right - left):
        c.drawString(left, y, line)
        y -= 14

    y -= 24
    c.setFillColor(INK)
    c.drawString(left, y, f"Дата выдачи: {ru_date(date.today())}")
    signer = settings.get("org_signer") or ""
    post = settings.get("org_signer_post") or "Руководитель"
    c.drawRightString(right, y, f"{post}{' ' + signer if signer else ''}")
    c.line(right - 150, y - 22, right, y - 22)
    c.setFont("OS", 8)
    c.drawRightString(right, y - 33, "подпись")

    c.showPage()
    c.save()
    return to_b64(buf)
