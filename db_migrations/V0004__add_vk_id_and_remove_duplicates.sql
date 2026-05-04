-- Добавляем колонку vk_id для дедупликации
ALTER TABLE t_p59822815_nonprofit_website_de.news ADD COLUMN IF NOT EXISTS vk_id integer NULL;

-- Помечаем дубли: оставляем только запись с минимальным id, остальные помечаем через vk_id = -1
UPDATE t_p59822815_nonprofit_website_de.news
SET vk_id = -1
WHERE id NOT IN (
  SELECT MIN(id) FROM t_p59822815_nonprofit_website_de.news GROUP BY title
) AND vk_id IS NULL;

-- Создаём уникальный индекс по vk_id (только для не-NULL и не -1)
CREATE UNIQUE INDEX IF NOT EXISTS news_vk_id_unique ON t_p59822815_nonprofit_website_de.news (vk_id) WHERE vk_id IS NOT NULL AND vk_id != -1;