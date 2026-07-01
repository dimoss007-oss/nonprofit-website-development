INSERT INTO t_p59822815_nonprofit_website_de.admin_users (login, password_hash, full_name, role, phone)
VALUES ('Dmitry', 'master', 'Администратор', 'admin', '+79273673737')
ON CONFLICT (login) DO UPDATE SET phone = '+79273673737', role = 'admin';