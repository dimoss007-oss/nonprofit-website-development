import difflib
import json
import os
import re
from datetime import date

import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_API_URL = "https://platform-api.max.ru"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Max-Bot-Api-Secret",
}

# Локальные словари тональности (корни слов). Красная зона и дисциплинарные маркеры проверяются
# первыми (приоритет безопасности), затем жёлтая, затем зелёная.
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

# Уменьшительно-ласкательные имена -> полная форма. Помогает распознать пациента, если в тексте
# указано короткое имя без фамилии/инициала (например "Аня" вместо "Анна Мерсеитова").
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


def extract_report_date(text: str):
    """Ищет дату отчёта в начале текста (первые 150 символов). Форматы: ДД.ММ, ДД.ММ.ГГ, ДД.ММ.ГГГГ,
    а также текстовые вида "23 августа" / "за 23 августа" (используется текущий год).
    Если год не указан — берётся текущий. Если дата не найдена или некорректна — возвращается сегодняшняя дата."""
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


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def send_message(text: str, token: str, chat_id: int = None, user_id: int = None):
    """Отправляет сообщение в Max. Если известен chat_id — сообщение уходит в чат и видно всем участникам,
    иначе (fallback) — личным сообщением отправителю через user_id."""
    params = {"chat_id": chat_id} if chat_id else {"user_id": user_id}
    r = requests.post(
        f"{MAX_API_URL}/messages",
        params=params,
        headers={"Authorization": token},
        json={"text": text},
    )
    print(f"send_message params={params} status={r.status_code} body={r.text[:200]}")


def analyze_sentiment(text: str):
    """Локальный rule-based анализатор тональности по словарям корней слов. Возвращает overall_state
    (3 — красная зона/дисциплинарные маркеры, 6 — жёлтая, 8 — зелёная) или None, если триггеры не найдены."""
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


def normalize_name(s: str) -> str:
    return re.sub(r"[.\s]+", " ", (s or "").strip().lower()).strip()


def build_patient_candidates(patients: list) -> dict:
    """Строит словарь всех возможных вариаций имён пациентов (alias, Имя + первая буква фамилии) для fuzzy-поиска."""
    candidates = {}
    for p in patients:
        alias_n = normalize_name(p.get("alias") or "")
        if alias_n:
            candidates[alias_n] = p
        first = (p.get("first_name") or "").strip()
        last_initial = (p.get("last_name") or "")[:1].strip()
        if first and last_initial:
            candidates[normalize_name(f"{first} {last_initial}")] = p
        if first:
            candidates.setdefault(normalize_name(first), p)

    return candidates


def expand_diminutive(name: str) -> str:
    """Если имя (или его первое слово) — уменьшительно-ласкательная форма из RUSSIAN_DIMINUTIVES,
    возвращает вариант с заменой на полную форму (например, "аня" -> "анна", "аня м" -> "анна м").
    Если это не диминутив — возвращает исходную строку без изменений."""
    parts = name.split(" ", 1)
    first_word = parts[0]
    full_form = RUSSIAN_DIMINUTIVES.get(first_word)
    if not full_form:
        return name
    rest = parts[1] if len(parts) > 1 else ""
    return f"{full_form} {rest}".strip()


def match_patient(name: str, candidates: dict, cutoff: float = NAME_MATCH_CUTOFF):
    """Fuzzy-сопоставление распознанного имени с пациентом по подготовленному словарю кандидатов.
    Учитывает уменьшительно-ласкательные формы имён (Аня -> Анна и т.п.)."""
    n = normalize_name(name)
    if not n:
        return None

    variants = [n]
    expanded = normalize_name(expand_diminutive(n))
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


def parse_shift_report(text: str, patients: list):
    """Построчный разбор текста отчёта смены. Устойчив к любым форматам: нумерованным спискам,
    тире, двоеточиям, свободному тексту без разметки, датам прописью и т.п.

    Для каждой строки проверяется, начинается ли она с имени, похожего на пациента из базы
    (fuzzy-сопоставление). Если да — начинается новый блок по этому пациенту, остаток строки
    идёт в его текст. Если нет — строка добавляется в текущий открытый блок пациента,
    либо (если пациент ещё не найден) в общую сводку смены (general_log)."""
    candidates = build_patient_candidates(patients)

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
            found = match_patient(candidate_name, candidates)
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


def handler(event: dict, context) -> dict:
    """Webhook-эндпоинт для приёма ежедневных отчётов смены из бота Max. Проверяет секрет вебхука (заголовок X-Max-Bot-Api-Secret),
    парсит текст отчёта (rule-based NLP), сопоставляет пациентов по alias/ФИО и сохраняет оценку состояния + сводку смены."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = os.environ.get("MAX_SHIFT_REPORT_BOT_TOKEN", "")

    headers = event.get("headers") or {}
    headers_lower = {k.lower(): v for k, v in headers.items()}
    incoming_secret = headers_lower.get("x-max-bot-api-secret", "")

    body = json.loads(event.get("body") or "{}")
    if not incoming_secret:
        incoming_secret = body.get("secret", "")

    # Подлинность вебхука: секрет, переданный при регистрации подписки (POST /subscriptions),
    # Max присылает в заголовке X-Max-Bot-Api-Secret каждого запроса. Сверяем с MAX_BOT_TOKEN.
    if not token or incoming_secret != token:
        return err("Недействительный секретный токен вебхука", 401)

    update_type = body.get("update_type", "")
    msg = body.get("message") or {}
    sender = msg.get("sender") or {}
    user_id = sender.get("user_id") or (body.get("user") or {}).get("user_id")
    recipient = msg.get("recipient") or {}
    chat_id = recipient.get("chat_id")
    text = (msg.get("body") or {}).get("text") or ""

    print(f"incoming update_type={update_type} user_id={user_id} chat_id={chat_id} text_len={len(text)}")

    if update_type != "message_created" or not user_id or not text.strip():
        return ok({"ok": True})

    user_id = int(user_id)
    chat_id = int(chat_id) if chat_id else None
    report_date = extract_report_date(text)
    report_date_iso = report_date.isoformat()

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(f"SELECT id, first_name, last_name, alias FROM {SCHEMA}.patients WHERE discharge_date IS NULL")
    patients = [dict(r) for r in cur.fetchall()]

    general_log, blocks = parse_shift_report(text, patients)

    if general_log:
        cur.execute(
            f"INSERT INTO {SCHEMA}.shift_logs (report_date, log_text) VALUES (%s, %s)",
            (report_date_iso, general_log),
        )

    if not blocks:
        conn.commit()
        conn.close()
        send_message(
            f"⚠️ Отчёт за {report_date.strftime('%d.%m.%Y')} принят, но пациентов в тексте распознать не удалось.",
            token, chat_id=chat_id, user_id=user_id,
        )
        return ok({"ok": True, "recognized": 0})

    recognized = 0

    for block in blocks:
        patient = block["patient"]
        overall_state = analyze_sentiment(block["text"])

        cur.execute(
            f"""INSERT INTO {SCHEMA}.patient_daily_reports (patient_id, author, report_date, overall_state, problems_identified)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (patient_id, report_date, author) DO UPDATE SET
                    overall_state = EXCLUDED.overall_state,
                    problems_identified = EXCLUDED.problems_identified""",
            (patient["id"], "Max-бот (смена)", report_date_iso, overall_state, block["text"]),
        )
        recognized += 1

    conn.commit()
    conn.close()

    reply = f"✅ Отчёт за {report_date.strftime('%d.%m.%Y')} успешно принят. Распознано пациентов: {recognized}."

    send_message(reply, token, chat_id=chat_id, user_id=user_id)

    return ok({"ok": True, "recognized": recognized})