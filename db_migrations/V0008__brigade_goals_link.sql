WITH ins AS (
  INSERT INTO fundraising_goals (title, description, target_amount, collected_amount, is_active, sort_order)
  SELECT 'Мобильная бригада: ' || a.title, 'Адресный сбор страницы «Мобильная бригада»', 0, 0, FALSE, 900
  FROM brigade_actions a WHERE a.goal_id IS NULL ORDER BY a.id
  RETURNING id, title
)
UPDATE brigade_actions a SET goal_id = ins.id FROM ins WHERE a.goal_id IS NULL AND ins.title = 'Мобильная бригада: ' || a.title;