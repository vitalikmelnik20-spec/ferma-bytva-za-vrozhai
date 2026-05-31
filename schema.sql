-- Ферма: Битва за врожай — повна актуальна схема БД

CREATE TABLE IF NOT EXISTS players (
  id                 SERIAL PRIMARY KEY,
  username           VARCHAR(20) UNIQUE NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  faction            VARCHAR(10) NOT NULL CHECK (faction IN ('elves','orcs')),
  gender             VARCHAR(10) NOT NULL CHECK (gender IN ('male','female')),
  level              INTEGER DEFAULT 1,
  experience         INTEGER DEFAULT 0,
  exp_to_next        INTEGER DEFAULT 100,
  greens             INTEGER DEFAULT 500,
  gold               INTEGER DEFAULT 100,
  diamonds           INTEGER DEFAULT 0,
  glory              INTEGER DEFAULT 0,
  hp                 INTEGER DEFAULT 1000,
  max_hp             INTEGER DEFAULT 1000,
  hp_regen           INTEGER DEFAULT 100,
  rating_points      INTEGER DEFAULT 0,
  wins               INTEGER DEFAULT 0,
  losses             INTEGER DEFAULT 0,
  battles_today      INTEGER DEFAULT 0,
  battles_max        INTEGER DEFAULT 60,
  city_name          VARCHAR(50) DEFAULT 'Безіменне місто',
  status_text        VARCHAR(100) DEFAULT '',
  medals             INTEGER DEFAULT 0,
  is_online          BOOLEAN DEFAULT false,
  is_banned          BOOLEAN DEFAULT false,
  ban_reason         TEXT,
  is_admin           BOOLEAN DEFAULT false,
  on_vacation        BOOLEAN DEFAULT false,
  last_seen          TIMESTAMP DEFAULT NOW(),
  created_at         TIMESTAMP DEFAULT NOW(),
  plants_planted     INTEGER DEFAULT 0,
  total_harvest      INTEGER DEFAULT 0,
  plots_watered      INTEGER DEFAULT 0,
  gold_earned_battle INTEGER DEFAULT 0,
  gold_lost_battle   INTEGER DEFAULT 0,
  avatar_url         TEXT,
  telegram_id        BIGINT UNIQUE,
  telegram_username  VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS training (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  power_level      INTEGER DEFAULT 10,
  endurance_level  INTEGER DEFAULT 10,
  speed_level      INTEGER DEFAULT 10,
  accuracy_level   INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS pets (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  power_level      INTEGER DEFAULT 5,
  endurance_level  INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS plants (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(50) NOT NULL,
  emoji            VARCHAR(10),
  growth_minutes   INTEGER NOT NULL,
  greens_reward    INTEGER NOT NULL,
  exp_reward       INTEGER NOT NULL,
  seed_price       INTEGER NOT NULL,
  min_level        INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS plots (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  slot_index       INTEGER NOT NULL,
  plant_id         INTEGER REFERENCES plants(id),
  planted_at       TIMESTAMP,
  ready_at         TIMESTAMP,
  watered          BOOLEAN DEFAULT false,
  watered_by       INTEGER REFERENCES players(id),
  status           VARCHAR(20) DEFAULT 'empty',
  UNIQUE(player_id, slot_index)
);

CREATE TABLE IF NOT EXISTS items (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  category         VARCHAR(20) NOT NULL CHECK (category IN ('weapon','armor','shield','helmet','potion','rune','ring','talisman')),
  power_bonus      INTEGER DEFAULT 0,
  endurance_bonus  INTEGER DEFAULT 0,
  speed_bonus      INTEGER DEFAULT 0,
  accuracy_bonus   INTEGER DEFAULT 0,
  price            INTEGER NOT NULL DEFAULT 0,
  min_level        INTEGER DEFAULT 1,
  duration_hours   INTEGER,
  is_active        BOOLEAN DEFAULT true,
  price_gold       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  item_id          INTEGER REFERENCES items(id),
  is_equipped      BOOLEAN DEFAULT false,
  slot             VARCHAR(20),
  upgrade_level    INTEGER DEFAULT 0,
  expires_at       TIMESTAMP,
  obtained_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battles (
  id               SERIAL PRIMARY KEY,
  attacker_id      INTEGER REFERENCES players(id),
  defender_id      INTEGER REFERENCES players(id),
  attacker_damage  INTEGER,
  defender_damage  INTEGER,
  winner_id        INTEGER REFERENCES players(id),
  zone             VARCHAR(10),
  greens_reward    INTEGER DEFAULT 0,
  log              JSONB,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ring_upgrades (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  item_id          INTEGER REFERENCES items(id),
  inv_id           INTEGER UNIQUE REFERENCES inventory(id) ON DELETE CASCADE,
  ring_level       INTEGER DEFAULT 1,
  steal_chance     INTEGER DEFAULT 5,
  max_steal_pct    NUMERIC(5,2) DEFAULT 2.5,
  upgraded_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theft_log (
  id               SERIAL PRIMARY KEY,
  battle_id        INTEGER,
  thief_id         INTEGER REFERENCES players(id),
  victim_id        INTEGER REFERENCES players(id),
  gold_stolen      INTEGER,
  steal_pct        NUMERIC(5,2),
  ring_level       INTEGER,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talisman_upgrades (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER NOT NULL REFERENCES players(id),
  item_id          INTEGER NOT NULL REFERENCES items(id),
  inv_id           INTEGER NOT NULL REFERENCES inventory(id),
  talisman_level   INTEGER NOT NULL DEFAULT 1,
  bonus_pct        INTEGER NOT NULL DEFAULT 10,
  upgraded_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caves (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id),
  total_mines      INTEGER,
  mines_done       INTEGER DEFAULT 0,
  mines_missed     INTEGER DEFAULT 0,
  gold_earned      INTEGER DEFAULT 0,
  exp_earned       INTEGER DEFAULT 0,
  current_mine     INTEGER DEFAULT 1,
  mine_appears_at  TIMESTAMP,
  mine_expires_at  TIMESTAMP,
  is_active        BOOLEAN DEFAULT false,
  session_done     BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caves_stats (
  player_id        INTEGER UNIQUE REFERENCES players(id),
  total_sessions   INTEGER DEFAULT 0,
  total_mines_done INTEGER DEFAULT 0,
  total_gold       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clans (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(50) UNIQUE NOT NULL,
  tag              VARCHAR(3) NOT NULL,
  description      TEXT DEFAULT '',
  leader_id        INTEGER REFERENCES players(id),
  rating_points    INTEGER DEFAULT 0,
  wars_won         INTEGER DEFAULT 0,
  wars_lost        INTEGER DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_members (
  id               SERIAL PRIMARY KEY,
  clan_id          INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  player_id        INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  role             VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader','officer','member')),
  joined_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friends (
  id               SERIAL PRIMARY KEY,
  requester_id     INTEGER REFERENCES players(id) ON DELETE CASCADE,
  addressee_id     INTEGER REFERENCES players(id) ON DELETE CASCADE,
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE IF NOT EXISTS mail (
  id               SERIAL PRIMARY KEY,
  sender_id        INTEGER REFERENCES players(id),
  receiver_id      INTEGER REFERENCES players(id) ON DELETE CASCADE,
  subject          VARCHAR(100),
  body             TEXT,
  is_read          BOOLEAN DEFAULT false,
  is_system        BOOLEAN DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_gifts (
  id               SERIAL PRIMARY KEY,
  giver_id         INTEGER REFERENCES players(id),
  receiver_id      INTEGER REFERENCES players(id) ON DELETE CASCADE,
  gift_name        VARCHAR(100),
  power_bonus      INTEGER DEFAULT 0,
  endurance_bonus  INTEGER DEFAULT 0,
  speed_bonus      INTEGER DEFAULT 0,
  accuracy_bonus   INTEGER DEFAULT 0,
  expires_at       TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id),
  clan_id          INTEGER REFERENCES clans(id),
  message          VARCHAR(200) NOT NULL,
  chat_type        VARCHAR(10) DEFAULT 'global' CHECK (chat_type IN ('global','clan')),
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tricks (
  id               SERIAL PRIMARY KEY,
  attacker_id      INTEGER REFERENCES players(id),
  victim_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  greens_stolen    INTEGER,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  sid     VARCHAR NOT NULL COLLATE "default",
  sess    JSON NOT NULL,
  expire  TIMESTAMP(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Seed: рослини
INSERT INTO plants (name, emoji, growth_minutes, greens_reward, exp_reward, seed_price, min_level) VALUES
  ('Пшениця',          '🌾', 5,    50,   10,  10,  1),
  ('Морква',           '🥕', 15,   120,  25,  25,  1),
  ('Капуста',          '🥬', 30,   220,  45,  45,  2),
  ('Соняшник',         '🌻', 60,   400,  80,  80,  3),
  ('Гарбуз',           '🎃', 120,  750,  150, 150, 5),
  ('Диня',             '🍈', 240,  1400, 280, 280, 7),
  ('Виноград',         '🍇', 480,  2600, 520, 520, 10),
  ('Зілля сили',       '🌿', 60,   200,  100, 200, 5),
  ('Зілля спритності', '🌿', 60,   200,  100, 200, 5),
  ('Чарівний гриб',    '🍄', 180,  500,  200, 500, 8)
ON CONFLICT DO NOTHING;

-- Seed: предмети
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Дерев''яний кий',     'weapon',  5,  0,   0,  0,  100,  1),
  ('Залізний меч',        'weapon',  15, 0,   0,  5,  500,  3),
  ('Сталевий топір',      'weapon',  25, 5,   0,  0,  1200, 5),
  ('Коса смерті',         'weapon',  40, 0,   10, 0,  3000, 8),
  ('Шкіряний жилет',      'armor',   0,  8,   0,  0,  150,  1),
  ('Кольчуга',            'armor',   0,  20,  0,  0,  600,  4),
  ('Лицарська броня',     'armor',   0,  35,  -5, 0,  2000, 7),
  ('Дерев''яний щит',     'shield',  0,  5,   0,  0,  80,   1),
  ('Залізний щит',        'shield',  0,  15,  0,  0,  400,  3),
  ('Шолом воїна',         'helmet',  3,  5,   0,  0,  200,  2),
  ('Зілля сили',          'potion',  10, 0,   0,  0,  300,  1),
  ('Зілля витривалості',  'potion',  0,  10,  0,  0,  300,  1),
  ('Зілля швидкості',     'potion',  0,  0,   10, 0,  300,  1),
  ('Руна вогню',          'rune',    8,  0,   0,  5,  500,  4),
  ('Руна льоду',          'rune',    0,  8,   0,  5,  500,  4)
ON CONFLICT DO NOTHING;

INSERT INTO items (name, category, price, price_gold, min_level) VALUES
  ('Кільце злодія',          'ring',     0, 400, 1),
  ('Талісман золотошукача',  'talisman', 0, 300, 1)
ON CONFLICT DO NOTHING;
