import hashlib
import hmac
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor

import requests

from common import SCHEMA, err, ok

GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

CONSULTANT_PROMPT = (
    "Ты клинический психолог кризисного центра. Проанализируй данные сессии (запрос, феноменология, фон, фигура). "
    "Твоя задача — перевести сложные психологические термины на язык, понятный для профильных консультантов и "
    "социальных работников, ведущих этот случай.\n"
    "Напиши четкие рекомендации для их дальнейшей работы:\n"
    "1. Как выстраивать диалог и устанавливать доверительный контакт.\n"
    "2. Какие темы могут вызвать острое сопротивление и как их экологично обходить.\n"
    "3. На какие сильные стороны (ресурсы) клиента опираться при составлении плана выхода из кризиса.\n"
    "Ответ дай без воды, в виде структурированной памятки для специалистов. "
    "Не используй имена, не упоминай переживания терапевта."
)
SUPERVISOR_PROMPT = (
    "Ты опытный гештальт-терапевт и супервизор. Проанализируй протокол сессии. Особое внимание удели полю "
    "\"Чувства терапевта\" для анализа контрпереноса. Сформируй 3-4 терапевтические гипотезы о скрытых потребностях "
    "клиента. Укажи на возможные слепые зоны терапевта, подсвети риски эмоционального слияния или выгорания, "
    "и предложи стратегию для следующей сессии. Тон профессиональный, поддерживающий."
)

FIELDS = [
    ("request", "Запрос"),
    ("phenomenology", "Феноменология клиента"),
    ("contact_interruptions", "Формы прерывания контакта"),
    ("client_feelings", "Чувства клиента"),
    ("client_background", "Фон клиента"),
    ("client_figure", "Фигура (потребность)"),
    ("therapist_feelings", "Чувства терапевта"),
]
TEXT_COLS = [f for f, _ in FIELDS]
MAX_TEXT = 4000

SESSION_COLS = (
    "id, session_date, client_id, client_name, request, phenomenology, contact_interruptions, client_feelings, "
    "client_background, client_figure, therapist_feelings, ai_consultant_strategy, ai_supervision, "
    "attached_strategy, attached_at, updated_at"
)


def authenticate(cur, login: str, password: str):
    if not login or not password:
        return None
    ml, mp = os.environ.get("ADMIN_LOGIN", ""), os.environ.get("ADMIN_PASSWORD", "")
    if ml and hmac.compare_digest(login, ml) and hmac.compare_digest(password, mp):
        return {"login": login, "role": "admin", "full_name": "Администратор"}
    cur.execute(f"SELECT login, role, full_name, password_hash FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
    user = cur.fetchone()
    if not user:
        return None
    if not hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), user["password_hash"]):
        return None
    return {"login": user["login"], "role": user["role"], "full_name": user["full_name"] or user["login"]}


def mask_name(text: str, client_name: str) -> str:
    out = text or ""
    for token in re.split(r"\s+", (client_name or "").strip()):
        token = token.strip(".,")
        if len(token) < 2:
            continue
        stem = token if len(token) <= 4 else token[:-2]
        out = re.sub(rf"\b{re.escape(stem)}\w*", "клиент", out, flags=re.IGNORECASE)
    return out


def build_text(row: dict, include_therapist: bool) -> str:
    parts = []
    for col, label in FIELDS:
        if col == "therapist_feelings" and not include_therapist:
            continue
        value = mask_name((row.get(col) or "").strip(), row.get("client_name") or "")
        if value:
            parts.append(f"{label}:\n{value}")
    return "\n\n".join(parts)


def ask_gpt(system: str, text: str) -> str:
    folder_id = os.environ.get("YANDEX_FOLDER_ID")
    api_key = os.environ.get("YANDEX_API_KEY")
    if not folder_id or not api_key:
        raise RuntimeError("YandexGPT не настроен")
    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.4, "maxTokens": 1500},
        "messages": [{"role": "system", "text": system}, {"role": "user", "text": text}],
    }
    r = requests.post(
        GPT_URL,
        headers={"Authorization": f"Api-Key {api_key}", "x-data-logging-enabled": "false"},
        json=payload, timeout=40,
    )
    if not r.ok:
        print(f"YandexGPT HTTP {r.status_code}: {r.text[:300]}")
        raise RuntimeError("YandexGPT вернул ошибку")
    return r.json()["result"]["alternatives"][0]["message"]["text"].strip()


def own_session(cur, session_id: str, login: str):
    cur.execute(f"SELECT * FROM {SCHEMA}.psycho_sessions WHERE id = %s AND author_login = %s", (session_id, login))
    return cur.fetchone()


def handle(cur, conn, event, body):
    """Кабинет психолога: протоколы сессий, ИИ-анализ без передачи ФИО, рекомендации для консультантов."""
    action = (body.get("action") or "")[len("psycho_"):]
    user = authenticate(cur, str(body.get("auth_login") or ""), str(body.get("auth_password") or ""))
    if not user:
        return err("Нет доступа", 401)

    if action == "recommendations":
        family_id = int(body.get("family_id") or 0)
        cur.execute(
            f"""SELECT session_date, attached_strategy AS text FROM {SCHEMA}.psycho_sessions
                WHERE client_id = %s AND COALESCE(attached_strategy, '') <> ''
                ORDER BY session_date DESC, attached_at DESC LIMIT 5""",
            (family_id,),
        )
        return ok({"items": [dict(r) for r in cur.fetchall()]})

    if user["role"] not in ("psychologist", "admin"):
        return err("Раздел доступен только психологу", 403)
    login = user["login"]

    if action == "families":
        cur.execute(
            f"""SELECT id, trim(concat_ws(' ', last_name, first_name, middle_name)) AS name
                FROM {SCHEMA}.sop_families ORDER BY last_name, first_name"""
        )
        return ok({"families": [dict(r) for r in cur.fetchall()]})

    if action == "list":
        cur.execute(
            f"SELECT {SESSION_COLS} FROM {SCHEMA}.psycho_sessions WHERE author_login = %s ORDER BY session_date DESC, created_at DESC LIMIT 200",
            (login,),
        )
        return ok({"sessions": [dict(r) for r in cur.fetchall()]})

    if action == "save":
        sid = str(body.get("id") or "")
        date = str(body.get("date") or "")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            return err("Укажите дату сессии")
        client_name = str(body.get("client_name") or "").strip()[:200]
        if not client_name:
            return err("Укажите ФИО клиента")
        try:
            client_id = int(body.get("client_id") or 0) or None
        except (TypeError, ValueError):
            client_id = None
        texts = [str(body.get(c) or "")[:MAX_TEXT] for c in TEXT_COLS]
        if sid:
            if not own_session(cur, sid, login):
                return err("Протокол не найден", 404)
            sets = ", ".join(f"{c} = %s" for c in TEXT_COLS)
            cur.execute(
                f"UPDATE {SCHEMA}.psycho_sessions SET session_date=%s, client_id=%s, client_name=%s, {sets}, updated_at=NOW() WHERE id=%s",
                (date, client_id, client_name, *texts, sid),
            )
        else:
            sid = uuid.uuid4().hex
            cols = ", ".join(TEXT_COLS)
            marks = ", ".join(["%s"] * len(TEXT_COLS))
            cur.execute(
                f"INSERT INTO {SCHEMA}.psycho_sessions (id, author_login, session_date, client_id, client_name, {cols}) VALUES (%s,%s,%s,%s,%s,{marks})",
                (sid, login, date, client_id, client_name, *texts),
            )
        conn.commit()
        return ok({"id": sid})

    if action == "analyze":
        row = own_session(cur, str(body.get("id") or ""), login)
        if not row:
            return err("Протокол не найден", 404)
        if not (row["request"] or "").strip() and not (row["phenomenology"] or "").strip():
            return err("Заполните хотя бы запрос или феноменологию клиента")
        consultant_text = build_text(row, include_therapist=False)
        supervisor_text = build_text(row, include_therapist=True)
        try:
            with ThreadPoolExecutor(max_workers=2) as pool:
                f1 = pool.submit(ask_gpt, CONSULTANT_PROMPT, consultant_text)
                f2 = pool.submit(ask_gpt, SUPERVISOR_PROMPT, supervisor_text)
                strategy, supervision = f1.result(), f2.result()
        except (RuntimeError, requests.exceptions.RequestException) as e:
            print(f"analyze error: {e}")
            return err("Не удалось получить ответ YandexGPT, попробуйте ещё раз", 502)
        cur.execute(
            f"UPDATE {SCHEMA}.psycho_sessions SET ai_consultant_strategy=%s, ai_supervision=%s, updated_at=NOW() WHERE id=%s",
            (strategy, supervision, row["id"]),
        )
        conn.commit()
        return ok({"ai_consultant_strategy": strategy, "ai_supervision": supervision})

    if action == "attach":
        row = own_session(cur, str(body.get("id") or ""), login)
        if not row:
            return err("Протокол не найден", 404)
        text = str(body.get("text") or "").strip()[:6000]
        detach = bool(body.get("detach"))
        if not detach:
            if not row["client_id"]:
                return err("Выберите семью, к карточке которой нужно прикрепить рекомендации")
            if not text:
                return err("Текст рекомендаций пуст")
        cur.execute(
            f"""UPDATE {SCHEMA}.psycho_sessions SET ai_consultant_strategy = COALESCE(NULLIF(%s, ''), ai_consultant_strategy),
                attached_strategy = %s, attached_at = CASE WHEN %s THEN NULL ELSE NOW() END, updated_at = NOW() WHERE id = %s""",
            (text, None if detach else text, detach, row["id"]),
        )
        conn.commit()
        return ok({"ok": True})

    if action == "delete":
        cur.execute(f"DELETE FROM {SCHEMA}.psycho_sessions WHERE id = %s AND author_login = %s",
                    (str(body.get("id") or ""), login))
        conn.commit()
        return ok({"ok": True})

    return err("Неизвестное действие", 404)
