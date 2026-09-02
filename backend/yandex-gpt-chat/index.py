import json
import os
import hashlib
import hmac
import psycopg2
import requests
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

YANDEX_GPT_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

YANDEX_SYSTEM_PROMPT_DEFAULT = (
    "Ты — опытный клинический психолог в реабилитационном центре АНО «Спасение надежды». "
    "Твоя задача: проанализировать ежедневный отчёт дежурного о поведении резидента. "
    "Выдели скрытые паттерны поведения, признаки надвигающегося кризиса, эмоциональные качели или, "
    "наоборот, позитивную динамику. Не ставь медицинских диагнозов. Сформируй краткую аналитическую "
    "сводку строго в 3–4 предложениях. Используй Markdown для выделения ключевых тезисов."
)

MAX_HISTORY_MESSAGES = 20


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def is_admin(cur, login: str, password: str) -> bool:
    """Проверяет права администратора: сначала мастер-аккаунт (ADMIN_LOGIN/ADMIN_PASSWORD),
    затем обычные пользователи admin_users с role='admin'. Свободный чат с YandexGPT доступен
    только администраторам, как и настройка системного промпта."""
    if not login or not password:
        return False

    master_login = os.environ.get("ADMIN_LOGIN", "")
    master_password = os.environ.get("ADMIN_PASSWORD", "")
    if master_login and hmac.compare_digest(login, master_login) and hmac.compare_digest(password, master_password):
        return True

    try:
        cur.execute(f"SELECT password_hash, role FROM {SCHEMA}.admin_users WHERE login = %s", (login,))
        user = cur.fetchone()
        if not user:
            return False
        stored_hash = user["password_hash"] if isinstance(user, dict) else user[0]
        role = user["role"] if isinstance(user, dict) else user[1]
        if role != "admin":
            return False
        return hmac.compare_digest(hash_password(password), stored_hash)
    except Exception as e:
        print(f"is_admin check error: {e}")
        return False


def get_system_prompt(cur) -> str:
    """Достаёт актуальный системный промпт для YandexGPT из настроек CRM (тот же, что и для аналитики отчётов),
    чтобы стиль и роль ИИ в свободном диалоге совпадали с автоматической аналитикой."""
    try:
        cur.execute(f"SELECT yandexgpt_system_prompt FROM {SCHEMA}.crm_settings WHERE id = 1")
        row = cur.fetchone()
        if row:
            value = row["yandexgpt_system_prompt"] if isinstance(row, dict) else row[0]
            if value and value.strip():
                return value.strip()
    except Exception as e:
        print(f"get_system_prompt error: {e}")
    return YANDEX_SYSTEM_PROMPT_DEFAULT


def handler(event: dict, context) -> dict:
    """Свободный диалог с YandexGPT Pro для администраторов CRM. POST { auth_login, auth_password,
    messages: [{role: 'user'|'assistant', text: str}, ...] } — отправляет историю сообщений в Yandex API
    с текущим системным промптом из настроек и возвращает ответ ассистента."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return err("Метод не поддерживается", 405)

    body = json.loads(event.get("body") or "{}")
    auth_login = body.get("auth_login", "")
    auth_password = body.get("auth_password", "")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if not is_admin(cur, auth_login, auth_password):
        conn.close()
        return err("Нет прав: чат с YandexGPT доступен только администраторам", 403)

    history = body.get("messages") or []
    if not isinstance(history, list) or not history:
        conn.close()
        return err("Поле messages обязательно и должно быть непустым списком")

    system_prompt = get_system_prompt(cur)
    conn.close()

    folder_id = (os.environ.get("YANDEX_FOLDER_ID") or "").strip()
    api_key = (os.environ.get("YANDEX_API_KEY") or "").strip()
    if not folder_id or not api_key:
        return ok({"reply": "ИИ временно недоступен: не настроены ключи YandexGPT."})

    yandex_messages = [{"role": "system", "text": system_prompt}]
    for m in history[-MAX_HISTORY_MESSAGES:]:
        role = m.get("role")
        text = (m.get("text") or "").strip()
        if role not in ("user", "assistant") or not text:
            continue
        yandex_messages.append({"role": role, "text": text})

    if len(yandex_messages) < 2:
        return err("Не найдено ни одного корректного сообщения в истории")

    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
        "completionOptions": {"stream": False, "temperature": 0.4, "maxTokens": 800},
        "messages": yandex_messages,
    }
    headers = {"Content-Type": "application/json", "Authorization": f"Api-Key {api_key}"}

    try:
        response = requests.post(YANDEX_GPT_URL, headers=headers, json=payload, timeout=25)
        if not response.ok:
            print(f"YandexGPT HTTP {response.status_code}: {response.text[:500]}")
            return err(f"Ошибка YandexGPT ({response.status_code}): {response.text[:300]}", 502)
        reply = response.json()["result"]["alternatives"][0]["message"]["text"]
        return ok({"reply": reply})
    except requests.exceptions.RequestException as e:
        print(f"YandexGPT error: {e}")
        return err(f"Ошибка при обращении к YandexGPT: {e}", 502)
