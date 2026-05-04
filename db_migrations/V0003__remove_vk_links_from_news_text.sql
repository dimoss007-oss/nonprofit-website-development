UPDATE t_p59822815_nonprofit_website_de.news
SET text = regexp_replace(text, E'\n\n— https://vk\\.com/wall[^\n]*', '', 'g')
WHERE text LIKE '%— https://vk.com/wall%';