"""
Единый модуль интеграции со всеми ботами мессенджера MAX (platform-api.max.ru) проекта.
Маршрутизация — через query-параметр bot (у каждого бота свой webhook URL, зарегистрированный
в MAX с соответствующим значением параметра, поэтому роутинг на нашей стороне детерминирован):
  ?bot=contact       — уведомления о заявках с формы "Написать нам" на сайте
  ?bot=finance       — учёт доходов и расходов
  ?bot=tasks         — уведомления сотрудников о задачах из админ-панели
  ?bot=shift-report  — приём ежедневных отчётов смены по пациентам (с NLP-разбором и анализом тональности)
Каждый бот использует свой собственный секретный токен (переменные окружения ниже) — они не связаны
между собой, роутинг лишь выбирает нужный обработчик и нужный токен внутри одной функции.

Сетевые вызовы к MAX API выполняются через aiohttp/asyncio (неблокирующе) — это критично для
вебхуков, чтобы функция не простаивала в ожидании ответа платформы при отправке сообщений.
Подключение к PostgreSQL инициализируется в глобальной области видимости (до объявления handler)
и переиспользуется между «горячими» вызовами функции, что защищает БД от исчерпания лимита подключений.
"""
import asyncio
import difflib
import json
import os
import re
from datetime import date

import aiohttp
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Max-Bot-Api-Secret",
}

# Подключение к БД инициализируется один раз при холодном старте функции (глобальная область
# видимости, до объявления handler). При «тёплых» повторных вызовах соединение переиспользуется —
# это защищает БД от исчерпания лимита подключений при частых обращениях ботов.
_DATABASE_URL = os.environ.get("DATABASE_URL", "")
_conn = None
if _DATABASE_URL:
    _conn = psycopg2.connect(_DATABASE_URL)
    _conn.autocommit = True


def get_conn():
    """Возвращает переиспользуемое соединение с БД, восстанавливая его только если оно оборвалось."""
    global _conn
    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(_DATABASE_URL)
        _conn.autocommit = True
    return _conn


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


async def _send_message_async(token: str, text: str, chat_id: int = None, user_id: int = None):
    params = {"chat_id": chat_id} if chat_id else {"user_id": user_id}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{MAX_API_URL}/messages",
            params=params,
            headers={"Authorization": token},
            json={"text": text},
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            body_preview = (await resp.text())[:200]
            print(f"send_message params={params} status={resp.status} body={body_preview}")


def send_message(token: str, text: str, chat_id: int = None, user_id: int = None):
    """Неблокирующая отправка сообщения в MAX (aiohttp), вызываемая из синхронного кода обработчиков."""
    asyncio.run(_send_message_async(token, text, chat_id=chat_id, user_id=user_id))


# ============================== bot=contact ==============================
# Уведомления о заявках с формы "Написать нам" на сайте.

def _contact_save_subscriber(chat_id: int, username: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.max_contact_subscribers (chat_id, username) VALUES (%s, %s) "
        f"ON CONFLICT (chat_id) DO NOTHING",
        (chat_id, username),
    )
    cur.close()


def _bind_admin_user(chat_id: int, login: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE {SCHEMA}.admin_users SET max_chat_id = %s WHERE login = %s", (chat_id, login))
    updated = cur.rowcount
    cur.close()
    return updated > 0


def _bind_admin_user_by_phone(chat_id: int, phone: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    digits = "".join(c for c in phone if c.isdigit())
    cur.execute(f"SELECT id, phone FROM {SCHEMA}.admin_users WHERE phone IS NOT NULL")
    rows = cur.fetchall()
    matched_id = None
    for row in rows:
        row_digits = "".join(c for c in (row[1] or "") if c.isdigit())
        if row_digits[-10:] == digits[-10:] and len(digits) >= 7:
            matched_id = row[0]
            break
    if matched_id:
        cur.execute(f"UPDATE {SCHEMA}.admin_users SET max_chat_id = %s WHERE id = %s", (chat_id, matched_id))
    cur.close()
    return matched_id is not None


def handle_contact_bot(event: dict) -> dict:
    """Webhook бота Max для уведомлений о заявках с сайта. Принимает /start, /bind <login> и сохраняет chat_id."""
    token = os.environ.get("MAX_CONTACT_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")
    print(f"contact bot body: {json.dumps(body)}")

    update_type = body.get("update_type", "")

    def get_user_id():
        if update_type == "bot_started":
            return body.get("user_id") or (body.get("user") or {}).get("user_id")
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("user_id")

    def get_username():
        if update_type == "bot_started":
            user = body.get("user") or {}
            return user.get("name") or user.get("login") or ""
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("name") or sender.get("login") or ""

    def get_text():
        msg = body.get("message") or {}
        return (msg.get("body") or {}).get("text") or ""

    user_id = get_user_id()
    if not user_id:
        return ok({"ok": True})

    chat_id = int(user_id)
    username = get_username()
    text = get_text().strip()

    if text.startswith("/bind"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            send_message(token, "Укажите логин или номер телефона:\n/bind ваш_логин\nили\n/bind +79001234567", chat_id=chat_id)
        else:
            value = parts[1].strip()
            is_phone = value.startswith("+") or (value[0].isdigit() and len(value) >= 7)
            if is_phone:
                if _bind_admin_user_by_phone(chat_id, value):
                    send_message(token, f"✅ Аккаунт привязан по номеру {value}! Теперь вы будете получать уведомления о задачах.", chat_id=chat_id)
                else:
                    send_message(token, f"❌ Сотрудник с номером {value} не найден. Убедитесь, что номер указан в профиле сотрудника.", chat_id=chat_id)
            else:
                if _bind_admin_user(chat_id, value):
                    send_message(token, f"✅ Аккаунт «{value}» привязан! Теперь вы будете получать уведомления о задачах.", chat_id=chat_id)
                else:
                    send_message(token, f"❌ Пользователь «{value}» не найден. Проверьте логин и попробуйте снова.", chat_id=chat_id)
        return ok({"ok": True})

    _contact_save_subscriber(chat_id, username)
    send_message(
        token,
        "Привет! Теперь вы будете получать уведомления о новых заявках с сайта «Спасение надежды».\n\n"
        "Чтобы получать уведомления о задачах из админ-панели, отправьте:\n/bind ваш_логин",
        chat_id=chat_id,
    )
    return ok({"ok": True})


# ============================== bot=tasks ==============================
# Уведомления сотрудников о задачах из админ-панели.

def _tasks_bind_by_login(chat_id: int, login: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"UPDATE {SCHEMA}.admin_users SET max_chat_id = %s WHERE login = %s", (chat_id, login))
    updated = cur.rowcount
    cur.close()
    return updated > 0


def _tasks_bind_by_phone(chat_id: int, phone: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) < 7:
        cur.close()
        return False
    cur.execute(f"SELECT id, phone FROM {SCHEMA}.admin_users WHERE phone IS NOT NULL")
    rows = cur.fetchall()
    matched_id = None
    for row in rows:
        row_digits = "".join(c for c in (row[1] or "") if c.isdigit())
        if len(row_digits) >= 7 and row_digits[-10:] == digits[-10:]:
            matched_id = row[0]
            break
    if matched_id:
        cur.execute(f"UPDATE {SCHEMA}.admin_users SET max_chat_id = %s WHERE id = %s", (chat_id, matched_id))
    cur.close()
    return matched_id is not None


def handle_tasks_bot(event: dict) -> dict:
    """Webhook бота Max для уведомлений сотрудников о задачах. /bind логин или /bind +7xxxxxxxxxx."""
    token = os.environ.get("MAX_TASKS_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")

    update_type = body.get("update_type", "")

    def get_user_id():
        if update_type == "bot_started":
            return body.get("user_id") or (body.get("user") or {}).get("user_id")
        msg = body.get("message") or {}
        sender = msg.get("sender") or {}
        return sender.get("user_id")

    def get_text():
        msg = body.get("message") or {}
        return (msg.get("body") or {}).get("text") or ""

    user_id = get_user_id()
    if not user_id:
        return ok({"ok": True})

    chat_id = int(user_id)
    text = get_text().strip()

    if text.startswith("/bind"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            send_message(token, "Укажите логин или номер телефона:\n/bind ваш_логин\nили\n/bind +79001234567", chat_id=chat_id)
        else:
            value = parts[1].strip()
            is_phone = value.startswith("+") or (value[0].isdigit() and len(value) >= 7)
            if is_phone:
                if _tasks_bind_by_phone(chat_id, value):
                    send_message(token, f"✅ Привязка по номеру {value} выполнена! Теперь вы будете получать уведомления о задачах.", chat_id=chat_id)
                else:
                    send_message(token, f"❌ Сотрудник с номером {value} не найден. Убедитесь, что номер указан в профиле сотрудника.", chat_id=chat_id)
            else:
                if _tasks_bind_by_login(chat_id, value):
                    send_message(token, f"✅ Аккаунт «{value}» привязан! Теперь вы будете получать уведомления о задачах.", chat_id=chat_id)
                else:
                    send_message(token, f"❌ Пользователь «{value}» не найден. Проверьте логин и попробуйте снова.", chat_id=chat_id)
        return ok({"ok": True})

    send_message(
        token,
        "Привет! Я буду отправлять уведомления о задачах из админ-панели.\n\n"
        "Чтобы привязать аккаунт, отправьте:\n"
        "/bind ваш_логин\n"
        "или\n"
        "/bind +79001234567 (номер телефона из профиля)",
        chat_id=chat_id,
    )
    return ok({"ok": True})


# ============================== bot=finance ==============================
# Учёт доходов и расходов.

def _finance_get_balance() -> str:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0),
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
            FROM {SCHEMA}.finance_transactions
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())"""
    )
    balance, income, expense = cur.fetchone()
    cur.close()
    return (
        f"Оборот за текущий месяц:\n"
        f"Баланс: {balance:,.2f} руб.\n"
        f"Доходы: {income:,.2f} руб.\n"
        f"Расходы: {expense:,.2f} руб."
    )


def _finance_get_total_balance() -> str:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0),
                COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)
            FROM {SCHEMA}.finance_transactions"""
    )
    balance, income, expense = cur.fetchone()
    cur.close()
    return (
        f"Общий баланс за всё время:\n"
        f"Баланс: {balance:,.2f} руб.\n"
        f"Доходы: {income:,.2f} руб.\n"
        f"Расходы: {expense:,.2f} руб."
    )


def _finance_get_history() -> str:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT type, amount, description, created_at FROM {SCHEMA}.finance_transactions ORDER BY created_at DESC LIMIT 10")
    rows = cur.fetchall()
    cur.close()
    if not rows:
        return "История пуста. Добавь первую запись!"
    lines = ["Последние 10 операций:\n"]
    for t, amount, desc, created_at in rows:
        sign = "+" if t == "income" else "-"
        date_str = created_at.strftime("%d.%m %H:%M")
        label = desc or ("доход" if t == "income" else "расход")
        lines.append(f"{sign}{float(amount):,.2f} руб. — {label} ({date_str})")
    return "\n".join(lines)


def _finance_parse_transaction(text: str):
    text = text.strip()
    match = re.match(r'^([+-])\s*(\d+(?:[.,]\d{1,2})?)(.*)$', text)
    if not match:
        return None
    sign, amount_str, description = match.groups()
    amount = float(amount_str.replace(',', '.'))
    t = "income" if sign == "+" else "expense"
    return t, amount, description.strip() or None


def handle_finance_bot(event: dict) -> dict:
    """Webhook для Max-бота учёта доходов и расходов."""
    token = os.environ.get("MAX_BOT_TOKEN", "")
    body = json.loads(event.get("body") or "{}")
    print(f"finance bot body: {json.dumps(body)}")

    update_type = body.get("update_type", "")

    welcome = (
        "Привет! Я помогу вести учёт доходов и расходов.\n\n"
        "Как добавить запись:\n"
        "+5000 зарплата — доход\n"
        "-1200 продукты — расход\n\n"
        "Команды:\n"
        "/balance — баланс за текущий месяц\n"
        "/total — общий баланс за всё время\n"
        "/history — последние 10 операций\n"
        "/clear — удалить все записи"
    )

    if update_type == "bot_started":
        user_id = body.get("user_id") or (body.get("user") or {}).get("user_id")
        chat_id = body.get("chat_id") or user_id
        if user_id and chat_id:
            send_message(token, welcome, chat_id=chat_id)
        return ok({"ok": True})

    message = body.get("message") or {}
    if not message:
        return ok({"ok": True})

    sender = message.get("sender") or {}
    user_id = sender.get("user_id")
    chat_id = user_id

    body_msg = message.get("body") or {}
    text = body_msg.get("text", "").strip()

    if not user_id or not text:
        return ok({"ok": True})

    uid = int(user_id)

    if text in ("/start", "start", "помощь", "/help"):
        reply = welcome
    elif text in ("/balance", "баланс", "balance"):
        reply = _finance_get_balance()
    elif text in ("/total", "итого", "total"):
        reply = _finance_get_total_balance()
    elif text in ("/history", "история", "history"):
        reply = _finance_get_history()
    elif text in ("/clear", "очистить", "clear"):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.finance_transactions WHERE user_id = %s", (uid,))
        cur.close()
        reply = "Все записи удалены."
    else:
        parsed = _finance_parse_transaction(text)
        if parsed:
            t, amount, description = parsed
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.finance_transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (uid, amount, t, description),
            )
            cur.close()
            label = "Доход" if t == "income" else "Расход"
            desc_str = f" — {description}" if description else ""
            reply = (
                f"{label} {amount:,.2f} руб.{desc_str} записан!\n\n"
                + _finance_get_balance()
                + "\n\n"
                + _finance_get_total_balance()
            )
        else:
            reply = (
                "Не понял запись. Используй формат:\n"
                "+5000 зарплата — доход\n"
                "-800 кафе — расход\n\n"
                "Или /balance для баланса за месяц, /total — за всё время."
            )

    send_message(token, reply, chat_id=chat_id)
    return ok({"ok": True})


# ============================== bot=shift-report ==============================
# Приём ежедневных отчётов смены по пациентам (rule-based NLP + анализ тональности).

GREEN_WORDS = [
    "молодец", "справил", "стабильн", "ресурс", "бодрячк",
    "включен", "активн", "помог", "честн", "ровн",
    "умниц", "прогресс", "втягива", "движени", "уверен",
]
YELLOW_WORDS = [
    "устал", "подустал", "вымотал", "сует", "отвлека",
    "нестабильн", "инфантильн", "детск", "качел", "ручник",
    "напряжен", "поникш", "задумчив", "пассивн",
]
RED_WORDS = [
    "жертв", "чёрн", "тёмн", "нечестност", "оправдан",
    "маск", "тяг", "обид", "провал", "агресс",
    "срыв", "корон", "хитр", "грузит", "закрыт",
    "отрицани", "презрени", "угодничеств", "бардак",
    "глухонем", "безответствен",
]
DISCIPLINE_MARKERS = [
    "х2", "пхд", "режим тишины", "последстви", "верёвк",
]

LINE_NAME_RE = re.compile(r"^(?:\d+\.?\s*)?([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]*\.?)?)(?:\s*[-—–:]\s*)?")
DATE_RE = re.compile(r"(?m)^\s*(\d{1,2})[\./](\d{1,2})(?:[\./](\d{2,4}))?\s")
DATE_RU_RE = re.compile(r"(?i)(?:за\s+)?(\d{1,2})\s+([а-я]+)")
NAME_MATCH_CUTOFF = 0.8

MONTHS_RU = {
    "января": 1, "февраля": 2, "марта": 3, "апреля": 4, "мая": 5, "июня": 6,
    "июля": 7, "августа": 8, "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,
}

RUSSIAN_DIMINUTIVES = {
    "аня": "анна", "катя": "екатерина", "света": "светлана", "настя": "анастасия",
    "таня": "татьяна", "наташа": "наталья", "саша": "александр", "лена": "елена",
    "оля": "ольга", "женя": "евгений", "дима": "дмитрий", "маша": "мария",
    "юля": "юлия", "надя": "надежда", "люда": "людмила", "вика": "виктория",
    "ксюша": "ксения", "лиза": "елизавета", "даша": "дарья", "паша": "павел",
    "коля": "николай", "миша": "михаил", "вова": "владимир", "гена": "геннадий",
    "толя": "анатолий", "валя": "валентина", "галя": "галина", "тоня": "антонина",
    "стас": "станислав", "сережа": "сергей",
}


def _shift_extract_report_date(text: str):
    m = DATE_RE.search(text[:150])
    if m:
        day, month, year = int(m.group(1)), int(m.group(2)), m.group(3)
        if year:
            year = int(year)
            if year < 100:
                year += 2000
        else:
            year = date.today().year
        try:
            return date(year, month, day)
        except ValueError:
            pass

    m_ru = DATE_RU_RE.search(text[:150])
    if m_ru:
        day = int(m_ru.group(1))
        month = MONTHS_RU.get(m_ru.group(2).lower())
        if month:
            try:
                return date(date.today().year, month, day)
            except ValueError:
                pass

    return date.today()


def _shift_find_employee_by_max_id(cur, max_user_id: int):
    cur.execute(
        f"SELECT id, full_name, login FROM {SCHEMA}.admin_users WHERE max_chat_id = %s",
        (max_user_id,),
    )
    row = cur.fetchone()
    return dict(row) if row else None


def _shift_bind_employee_by_phone(cur, max_user_id: int, phone: str) -> bool:
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) < 7:
        return False
    cur.execute(f"SELECT id, phone FROM {SCHEMA}.admin_users WHERE phone IS NOT NULL")
    matched_id = None
    for row in cur.fetchall():
        row_digits = "".join(c for c in (row["phone"] or "") if c.isdigit())
        if len(row_digits) >= 7 and row_digits[-10:] == digits[-10:]:
            matched_id = row["id"]
            break
    if not matched_id:
        return False
    cur.execute(f"UPDATE {SCHEMA}.admin_users SET max_chat_id = %s WHERE id = %s", (max_user_id, matched_id))
    return True


def _shift_analyze_sentiment(text: str):
    t = text.lower()
    for w in RED_WORDS + DISCIPLINE_MARKERS:
        if w in t:
            return 3
    for w in YELLOW_WORDS:
        if w in t:
            return 6
    for w in GREEN_WORDS:
        if w in t:
            return 8
    return None


def _shift_normalize_name(s: str) -> str:
    return re.sub(r"[.\s]+", " ", (s or "").strip().lower()).strip()


def _shift_build_patient_candidates(patients: list) -> dict:
    candidates = {}
    for p in patients:
        alias_n = _shift_normalize_name(p.get("alias") or "")
        if alias_n:
            candidates[alias_n] = p
        first = (p.get("first_name") or "").strip()
        last_initial = (p.get("last_name") or "")[:1].strip()
        if first and last_initial:
            candidates[_shift_normalize_name(f"{first} {last_initial}")] = p
        if first:
            candidates.setdefault(_shift_normalize_name(first), p)
    return candidates


def _shift_expand_diminutive(name: str) -> str:
    parts = name.split(" ", 1)
    first_word = parts[0]
    full_form = RUSSIAN_DIMINUTIVES.get(first_word)
    if not full_form:
        return name
    rest = parts[1] if len(parts) > 1 else ""
    return f"{full_form} {rest}".strip()


def _shift_match_patient(name: str, candidates: dict, cutoff: float = NAME_MATCH_CUTOFF):
    n = _shift_normalize_name(name)
    if not n:
        return None

    variants = [n]
    expanded = _shift_normalize_name(_shift_expand_diminutive(n))
    if expanded != n:
        variants.append(expanded)

    for variant in variants:
        if variant in candidates:
            return candidates[variant]

    for variant in variants:
        close = difflib.get_close_matches(variant, list(candidates.keys()), n=1, cutoff=cutoff)
        if close:
            return candidates[close[0]]

    return None


def _shift_parse_report(text: str, patients: list):
    candidates = _shift_build_patient_candidates(patients)

    general_lines = []
    patient_blocks = {}
    current_patient_id = None

    for raw_line in text.split("\n"):
        line = raw_line.strip()
        if not line:
            continue

        matched_patient = None
        remainder = line
        m = LINE_NAME_RE.match(line)
        if m:
            candidate_name = m.group(1).strip()
            found = _shift_match_patient(candidate_name, candidates)
            if found:
                matched_patient = found
                remainder = line[m.end():].strip()

        if matched_patient:
            current_patient_id = matched_patient["id"]
            block = patient_blocks.setdefault(current_patient_id, {"patient": matched_patient, "lines": []})
            if remainder:
                block["lines"].append(remainder)
        elif current_patient_id is not None:
            patient_blocks[current_patient_id]["lines"].append(line)
        else:
            general_lines.append(line)

    general_log = "\n".join(general_lines).strip()
    blocks = [
        {"patient": b["patient"], "text": "\n".join(b["lines"]).strip()}
        for b in patient_blocks.values()
        if b["lines"]
    ]

    return general_log, blocks


def handle_shift_report_bot(event: dict) -> dict:
    """Webhook-эндпоинт для приёма ежедневных отчётов смены из бота Max. Проверяет секрет вебхука
    (заголовок X-Max-Bot-Api-Secret), авторизует отправителя по привязанному номеру телефона
    (сотрудник из admin_users; чужие/незарегистрированные номера игнорируются — бот "глухой" для
    внешних), парсит текст отчёта (rule-based NLP), сопоставляет пациентов по alias/ФИО и сохраняет
    оценку состояния + автора (employee_id) + сводку смены. Ответ уходит в chat_id общего чата смены."""
    token = os.environ.get("MAX_SHIFT_REPORT_BOT_TOKEN", "")

    headers = event.get("headers") or {}
    headers_lower = {k.lower(): v for k, v in headers.items()}
    incoming_secret = headers_lower.get("x-max-bot-api-secret", "")

    body = json.loads(event.get("body") or "{}")
    if not incoming_secret:
        incoming_secret = body.get("secret", "")

    if not token or incoming_secret != token:
        return err("Недействительный секретный токен вебхука", 401)

    update_type = body.get("update_type", "")
    msg = body.get("message") or {}
    sender = msg.get("sender") or {}
    user_id = sender.get("user_id") or (body.get("user") or {}).get("user_id")
    recipient = msg.get("recipient") or {}
    chat_id = recipient.get("chat_id")
    text = (msg.get("body") or {}).get("text") or ""

    print(f"shift-report incoming update_type={update_type} user_id={user_id} chat_id={chat_id} text_len={len(text)}")

    if update_type != "message_created" or not user_id or not text.strip():
        return ok({"ok": True})

    user_id = int(user_id)
    chat_id = int(chat_id) if chat_id else None
    text = text.strip()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if text.startswith("/bind"):
        parts = text.split(maxsplit=1)
        phone = parts[1].strip() if len(parts) > 1 else ""
        if phone and _shift_bind_employee_by_phone(cur, user_id, phone):
            cur.close()
            send_message(token, "✅ Аккаунт привязан. Теперь ваши отчёты будут приниматься.", chat_id=chat_id, user_id=user_id)
        else:
            cur.close()
            send_message(token, "Не удалось привязать номер. Укажите: /bind +79001234567", chat_id=chat_id, user_id=user_id)
        return ok({"ok": True})

    employee = _shift_find_employee_by_max_id(cur, user_id)
    if not employee:
        cur.close()
        print(f"ignored: user_id={user_id} is not a registered employee")
        return ok({"ok": True})

    author_name = employee.get("full_name") or employee.get("login") or "Сотрудник"
    report_date = _shift_extract_report_date(text)
    report_date_iso = report_date.isoformat()

    cur.execute(f"SELECT id, first_name, last_name, alias FROM {SCHEMA}.patients WHERE discharge_date IS NULL")
    patients = [dict(r) for r in cur.fetchall()]

    general_log, blocks = _shift_parse_report(text, patients)

    if general_log:
        cur.execute(
            f"INSERT INTO {SCHEMA}.shift_logs (report_date, log_text) VALUES (%s, %s)",
            (report_date_iso, general_log),
        )

    if not blocks:
        cur.close()
        send_message(
            token,
            f"⚠️ Отчёт за {report_date.strftime('%d.%m.%Y')} принят, но пациентов в тексте распознать не удалось. Автор: {author_name}.",
            chat_id=chat_id, user_id=user_id,
        )
        return ok({"ok": True, "recognized": 0})

    recognized = 0

    for block in blocks:
        patient = block["patient"]
        overall_state = _shift_analyze_sentiment(block["text"])

        cur.execute(
            f"""INSERT INTO {SCHEMA}.patient_daily_reports (patient_id, author, employee_id, report_date, overall_state, problems_identified)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (patient_id, report_date, author) DO UPDATE SET
                    overall_state = EXCLUDED.overall_state,
                    problems_identified = EXCLUDED.problems_identified,
                    employee_id = EXCLUDED.employee_id""",
            (patient["id"], author_name, employee["id"], report_date_iso, overall_state, block["text"]),
        )
        recognized += 1

    cur.close()

    reply = f"✅ Отчёт за {report_date.strftime('%d.%m.%Y')} успешно принят. Автор: {author_name}. Распознано пациентов: {recognized}."
    send_message(token, reply, chat_id=chat_id, user_id=user_id)

    return ok({"ok": True, "recognized": recognized})


# ============================== Роутинг ==============================

BOT_HANDLERS = {
    "contact": handle_contact_bot,
    "tasks": handle_tasks_bot,
    "finance": handle_finance_bot,
    "shift-report": handle_shift_report_bot,
}


def handler(event: dict, context) -> dict:
    """Единая точка входа для всех ботов мессенджера MAX (роутинг по query-параметру
    bot=contact|finance|tasks|shift-report). У каждого бота свой webhook URL, зарегистрированный
    в MAX с соответствующим параметром, поэтому роутинг здесь детерминирован."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    bot = params.get("bot", "")

    handler_fn = BOT_HANDLERS.get(bot)
    if not handler_fn:
        return err(f"Неизвестный бот: {bot!r}. Используйте ?bot=contact|finance|tasks|shift-report", 404)

    return handler_fn(event)
