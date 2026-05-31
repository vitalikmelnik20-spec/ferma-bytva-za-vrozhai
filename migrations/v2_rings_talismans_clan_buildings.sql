-- Migration v2: new rings, talismans, clan buildings
-- Rings per TZ v2 (section 7.5)
INSERT INTO items (name, category, price, price_gold, min_level) VALUES
  ('Кільце Жнеця',    'ring', 300, 0,   5),
  ('Кільце Берсерка', 'ring', 0,   600, 10),
  ('Кільце Цілителя', 'ring', 500, 0,   15),
  ('Кільце Удачі',    'ring', 0,   800, 20),
  ('Кільце Мудреця',  'ring', 1000,0,   25)
ON CONFLICT DO NOTHING;

-- Talismans per TZ v2 (section 7.6)
INSERT INTO items (name, category, price, price_gold, min_level) VALUES
  ('Талісман Воїна',       'talisman', 400, 0,   5),
  ('Талісман Фермера',     'talisman', 350, 0,   8),
  ('Талісман Захисника',   'talisman', 400, 0,   12),
  ('Талісман Тіні',        'talisman', 0,   700, 18),
  ('Талісман Полководця',  'talisman', 0,   600, 22)
ON CONFLICT DO NOTHING;

-- Clan buildings (section 1.5)
CREATE TABLE IF NOT EXISTS clan_buildings (
  id           SERIAL PRIMARY KEY,
  clan_id      INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  building_key VARCHAR(30) NOT NULL,
  level        INTEGER DEFAULT 0,
  UNIQUE(clan_id, building_key)
);

-- Clan treasury (section 1.4)
ALTER TABLE clans ADD COLUMN IF NOT EXISTS treasury_greens INTEGER DEFAULT 0;
ALTER TABLE clans ADD COLUMN IF NOT EXISTS treasury_gold   INTEGER DEFAULT 0;

-- Clan treasury transaction log
CREATE TABLE IF NOT EXISTS clan_treasury_log (
  id         SERIAL PRIMARY KEY,
  clan_id    INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  player_id  INTEGER REFERENCES players(id),
  amount     INTEGER NOT NULL,
  currency   VARCHAR(10) NOT NULL CHECK (currency IN ('greens','gold')),
  action     VARCHAR(10) NOT NULL CHECK (action IN ('deposit','withdraw')),
  note       VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clan roles: extend role check to match TZ names
ALTER TABLE clan_members DROP CONSTRAINT IF EXISTS clan_members_role_check;
ALTER TABLE clan_members ADD CONSTRAINT clan_members_role_check
  CHECK (role IN ('leader','senior','officer','member'));

-- Clan war table (section 1.7)
CREATE TABLE IF NOT EXISTS clan_wars (
  id             SERIAL PRIMARY KEY,
  attacker_id    INTEGER REFERENCES clans(id),
  defender_id    INTEGER REFERENCES clans(id),
  started_at     TIMESTAMP DEFAULT NOW(),
  ends_at        TIMESTAMP,
  status         VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','finished')),
  winner_id      INTEGER REFERENCES clans(id),
  attacker_dmg   INTEGER DEFAULT 0,
  defender_dmg   INTEGER DEFAULT 0
);

-- Clan tasks (section 1.8)
CREATE TABLE IF NOT EXISTS clan_tasks (
  id          SERIAL PRIMARY KEY,
  clan_id     INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  task_type   VARCHAR(20) NOT NULL CHECK (task_type IN ('daily','weekly')),
  description VARCHAR(200),
  goal        INTEGER NOT NULL,
  progress    INTEGER DEFAULT 0,
  reward_greens INTEGER DEFAULT 0,
  reward_gold   INTEGER DEFAULT 0,
  resets_at   TIMESTAMP,
  completed   BOOLEAN DEFAULT false
);
