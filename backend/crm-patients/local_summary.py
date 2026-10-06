


# Словари корней слов для алгоритмической текстовой сводки (без внешних ИИ-сервисов).
# Совпадают со словарями в max-shift-report-bot/index.py, используемыми для расчёта overall_state.
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


def generate_text_summary(cur, patient_id: int, schema: str, days: int) -> dict:
    """Алгоритмическая (rule-based) текстовая сводка по пациенту за период: без внешних ИИ-сервисов.
    Считает % дней в красной/жёлтой/зелёной зоне по overall_state, находит топ-3 самых частых
    корней-триггеров в текстах отчётов и формирует Markdown-текст (Динамика / Паттерны / Дисциплина)."""
    cur.execute(
        f"""SELECT report_date, overall_state, problems_identified, actions_taken, results, notes
            FROM {schema}.patient_daily_reports
            WHERE patient_id = %s AND report_date >= CURRENT_DATE - %s::interval
            ORDER BY report_date ASC""",
        (patient_id, f"{days} days"),
    )
    reports = cur.fetchall()

    red_count = yellow_count = green_count = 0
    for r in reports:
        score = r.get("overall_state")
        if score is None:
            continue
        if score <= 4:
            red_count += 1
        elif score <= 6:
            yellow_count += 1
        else:
            green_count += 1

    total_scored = red_count + yellow_count + green_count
    red_pct = (red_count / total_scored * 100) if total_scored else 0
    green_pct = (green_count / total_scored * 100) if total_scored else 0

    combined_text = " ".join(
        (r.get("problems_identified") or "") + " " + (r.get("actions_taken") or "") + " " +
        (r.get("results") or "") + " " + (r.get("notes") or "")
        for r in reports
    ).lower()

    word_counts = []
    for w in RED_WORDS + YELLOW_WORDS + GREEN_WORDS + DISCIPLINE_MARKERS:
        c = combined_text.count(w)
        if c > 0:
            word_counts.append((w, c))
    word_counts.sort(key=lambda x: x[1], reverse=True)
    top3 = word_counts[:3]

    discipline_found = any(combined_text.count(w) > 0 for w in DISCIPLINE_MARKERS)

    if total_scored == 0:
        dynamics_block = "🟡 **Динамика:** Недостаточно данных за период для оценки."
    elif red_pct >= 40:
        dynamics_block = "🔴 **Динамика:** Негативная. Преобладает эмоциональный спад, высок риск срыва или саботажа."
    elif green_pct >= 50 and red_pct < 20:
        dynamics_block = "🟢 **Динамика:** Положительная. Пациент стабилен, показывает вовлечённость."
    else:
        dynamics_block = "🟡 **Динамика:** Нестабильная (эмоциональные качели)."

    if top3:
        patterns_str = ", ".join(f"{w} ({c} раз)" for w, c in top3)
        patterns_block = f"⚠️ **Доминирующие паттерны:** {patterns_str}."
    else:
        patterns_block = "⚠️ **Доминирующие паттерны:** Ярко выраженных паттернов не зафиксировано."

    if discipline_found:
        discipline_block = "🛑 **Дисциплина:** Имеются системные нарушения (получены последствия)."
    else:
        discipline_block = "✅ **Дисциплина:** Грубых нарушений не зафиксировано."

    summary_text = "\n\n".join([dynamics_block, patterns_block, discipline_block])

    return {
        "summary_text": summary_text,
        "counts": {"red": red_count, "yellow": yellow_count, "green": green_count},
        "days": days,
    }


def analyze_patient_data(cur, patient_id, schema, alias, days=7):
    """Локальный генератор текстовой сводки на основе шаблонов и ключевых слов (без внешних ИИ-сервисов)."""
    cur.execute(f"""
        SELECT * FROM {schema}.patient_daily_reports
        WHERE patient_id = %s
          AND report_date >= CURRENT_DATE - %s::interval
        ORDER BY report_date ASC
    """, (patient_id, f"{days} days"))
    reports = cur.fetchall()

    if not reports:
        return "Недостаточно данных за выбранный период для формирования аналитической сводки."

    dict_problems = ['сон', 'аппетит', 'агрес', 'апат', 'конфликт', 'тяг', 'саботаж', 'ссор']
    dict_actions = ['бесед', 'групп', 'психолог', 'дневник', 'задани', 'отстран']
    dict_results_pos = ['осозна', 'успоко', 'стабил', 'принял', 'соглас']
    dict_results_neg = ['отказ', 'игнор', 'отрица']

    found_problems = set()
    found_actions = set()
    pos_results = 0
    neg_results = 0

    overall_sum = 0
    overall_count = 0

    for r in reports:
        p_text = (r.get("problems_identified") or "").lower()
        a_text = (r.get("actions_taken") or "").lower()
        res_text = (r.get("results") or "").lower()

        for word in dict_problems:
            if word in p_text or word in a_text or word in res_text:
                found_problems.add(word)
        for word in dict_actions:
            if word in a_text:
                found_actions.add(word)
        for word in dict_results_pos:
            if word in res_text:
                pos_results += 1
        for word in dict_results_neg:
            if word in res_text:
                neg_results += 1

        score = r.get("overall_state")
        if score is not None:
            overall_sum += score
            overall_count += 1

    text_blocks = []

    if overall_count > 0:
        avg_state = overall_sum / overall_count
        if avg_state >= 8:
            text_blocks.append("находилась в стабильно приподнятом настроении")
        elif avg_state >= 5:
            text_blocks.append("демонстрировала ровный эмоциональный фон")
        else:
            text_blocks.append("эмоциональный фон был преимущественно подавленным")
    else:
        text_blocks.append("состояние требует дополнительной оценки")

    if found_problems:
        text_blocks.append(f"В записях отмечены маркеры рисков: {', '.join(found_problems)}.")
    if found_actions:
        text_blocks.append(f"В качестве мер стабилизации применялись: {', '.join(found_actions)}.")

    if pos_results > 0 or neg_results > 0:
        if pos_results > neg_results:
            text_blocks.append("Реакция на вмешательства персонала преимущественно положительная.")
        elif neg_results > pos_results:
            text_blocks.append("Зафиксировано сопротивление или отсутствие реакции на вмешательства.")
        else:
            text_blocks.append("Реакция на вмешательства смешанная.")

    result_text = f"За последние {days} дней {alias} {text_blocks[0]}. " + " ".join(text_blocks[1:])
    return result_text


def analyze_child_data(cur, child_id, schema, days=7):
    """Локальный генератор текстовой сводки по ребёнку на основе шаблонов, шкал и ключевых слов (без внешних ИИ-сервисов)."""
    cur.execute(f"""
        SELECT * FROM {schema}.child_daily_reports
        WHERE child_id = %s
          AND report_date >= CURRENT_DATE - %s::interval
        ORDER BY report_date ASC
    """, (child_id, f"{days} days"))
    reports = cur.fetchall()

    if not reports:
        return "Недостаточно данных за выбранный период для формирования аналитической сводки."

    dict_problems = ['плач', 'истерик', 'каприз', 'агрес', 'страх', 'тревож', 'замкнут', 'конфликт']
    dict_actions = ['игр', 'бесед', 'успоко', 'отвлек', 'поощр', 'вниман', 'психолог']
    dict_results_pos = ['успоко', 'улыб', 'контакт', 'вовлеч', 'интерес']
    dict_results_neg = ['отказ', 'игнор', 'продолж']

    found_problems = set()
    found_actions = set()
    pos_results = 0
    neg_results = 0

    def avg_scale(field):
        vals = [r[field] for r in reports if r.get(field) is not None]
        return (sum(vals) / len(vals)) if vals else None

    for r in reports:
        p_text = (r.get("identified_problems") or "").lower()
        a_text = (r.get("taken_actions") or "").lower()
        res_text = (r.get("results") or "").lower()

        for word in dict_problems:
            if word in p_text or word in a_text or word in res_text:
                found_problems.add(word)
        for word in dict_actions:
            if word in a_text:
                found_actions.add(word)
        for word in dict_results_pos:
            if word in res_text:
                pos_results += 1
        for word in dict_results_neg:
            if word in res_text:
                neg_results += 1

    avg_emotional = avg_scale("scale_emotional")
    if avg_emotional is not None:
        if avg_emotional >= 8:
            emotional_phrase = "ребёнок демонстрировал позитивный эмоциональный фон"
        elif avg_emotional >= 5:
            emotional_phrase = "ребёнок эмоционально стабилен"
        else:
            emotional_phrase = "у ребёнка наблюдается эмоциональная нестабильность/подавленность"
    else:
        emotional_phrase = "эмоциональное состояние ребёнка требует дополнительной оценки"

    scale_notes = []

    avg_contact_mother = avg_scale("scale_contact_mother")
    if avg_contact_mother is not None and avg_contact_mother < 5:
        scale_notes.append("Зафиксированы сложности в контакте с матерью.")

    discipline_vals = [r["scale_discipline"] for r in reports if r.get("scale_discipline") is not None]
    academic_vals = [r["scale_academic"] for r in reports if r.get("scale_academic") is not None]
    if discipline_vals and academic_vals:
        avg_disc_acad = (sum(discipline_vals) / len(discipline_vals) + sum(academic_vals) / len(academic_vals)) / 2
        if avg_disc_acad < 5:
            scale_notes.append("Отмечаются проблемы с дисциплиной и успеваемостью.")

    problems_part = f"В записях воспитателей отмечались триггеры: {', '.join(found_problems)}." if found_problems else ""
    actions_part = f"Применялись методы: {', '.join(found_actions)}." if found_actions else ""

    results_part = ""
    if pos_results > 0 or neg_results > 0:
        if pos_results > neg_results:
            results_part = "Реакция преимущественно положительная."
        elif neg_results > pos_results:
            results_part = "Зафиксировано сопротивление или отсутствие реакции."
        else:
            results_part = "Реакция смешанная."

    text = f"За последние {days} дней {emotional_phrase}."
    if scale_notes:
        text += " " + " ".join(scale_notes)
    if problems_part:
        text += " " + problems_part
    if actions_part:
        text += " " + actions_part
    if results_part:
        text += " " + results_part

    return text
