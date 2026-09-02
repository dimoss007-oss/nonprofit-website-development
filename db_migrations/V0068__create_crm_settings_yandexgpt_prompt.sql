CREATE TABLE IF NOT EXISTS t_p59822815_nonprofit_website_de.crm_settings (
    id SERIAL PRIMARY KEY,
    yandexgpt_system_prompt TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100)
);

INSERT INTO t_p59822815_nonprofit_website_de.crm_settings (id, yandexgpt_system_prompt)
VALUES (1, 'Ты — опытный клинический психолог в реабилитационном центре АНО «Спасение надежды». Твоя задача: проанализировать ежедневный отчёт дежурного о поведении резидента. Выдели скрытые паттерны поведения, признаки надвигающегося кризиса, эмоциональные качели или, наоборот, позитивную динамику. Не ставь медицинских диагнозов. Сформируй краткую аналитическую сводку строго в 3–4 предложениях. Используй Markdown для выделения ключевых тезисов.')
ON CONFLICT (id) DO NOTHING;