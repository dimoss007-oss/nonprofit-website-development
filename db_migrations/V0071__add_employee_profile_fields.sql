ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS position VARCHAR(150),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS passport_series VARCHAR(10),
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS passport_issued_by TEXT,
  ADD COLUMN IF NOT EXISTS passport_issued_date DATE,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

UPDATE admin_users SET position = 'Заместитель директора' WHERE id = 1;
UPDATE admin_users SET position = 'Консультант' WHERE id = 2;
UPDATE admin_users SET position = 'Консультант' WHERE id = 4;
UPDATE admin_users SET position = 'Психолог' WHERE id = 6;
UPDATE admin_users SET position = 'Начальник отдела фандрайзинга' WHERE id = 7;
UPDATE admin_users SET position = 'Учредитель' WHERE id = 8;
UPDATE admin_users SET position = 'Специалист по работе с детьми' WHERE id = 9;
UPDATE admin_users SET position = 'Генеральный директор', full_name = 'Чуйкин Дмитрий Юрьевич' WHERE id = 11;