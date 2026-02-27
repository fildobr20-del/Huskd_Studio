-- ============================================================
-- Husk Label — миграция: таблица platform_snapshots
-- Запусти это в Supabase → SQL Editor
-- ============================================================

-- Таблица хранит последнее известное накопленное значение (за текущий месяц)
-- для каждой модели × платформы × месяц.
-- Логика:
--   • Первый запуск месяца → записываем baseline (delta = 0, история до начала отслеживания не считается)
--   • Последующие запуски → delta = sentAmount - last_seen_usd → только реальный прирост

CREATE TABLE IF NOT EXISTS platform_snapshots (
  user_id    UUID    NOT NULL,
  platform   TEXT    NOT NULL,
  month      TEXT    NOT NULL, -- формат 'YYYY-MM'
  last_seen_usd NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, platform, month)
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_platform_snapshots_lookup
  ON platform_snapshots (user_id, platform, month);

-- Даём сервисному ключу полный доступ
ALTER TABLE platform_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON platform_snapshots
  USING (true) WITH CHECK (true);
