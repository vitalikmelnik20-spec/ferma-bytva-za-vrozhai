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
  min_level        INTEGER DEFAULT 1,
  frame_color      VARCHAR(20) DEFAULT 'gray',
  is_boss          BOOLEAN DEFAULT false
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
  price_gold       INTEGER DEFAULT 0,
  effect_type      VARCHAR(50),
  effect_value     INTEGER DEFAULT 0,
  effect_rounds    INTEGER DEFAULT 0
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
  treasury_greens  INTEGER DEFAULT 0,
  treasury_gold    INTEGER DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_members (
  id               SERIAL PRIMARY KEY,
  clan_id          INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  player_id        INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  role             VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader','senior','officer','member')),
  joined_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_buildings (
  id           SERIAL PRIMARY KEY,
  clan_id      INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  building_key VARCHAR(30) NOT NULL,
  level        INTEGER DEFAULT 0,
  UNIQUE(clan_id, building_key)
);

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

CREATE TABLE IF NOT EXISTS clan_tasks (
  id            SERIAL PRIMARY KEY,
  clan_id       INTEGER REFERENCES clans(id) ON DELETE CASCADE,
  task_type     VARCHAR(20) NOT NULL CHECK (task_type IN ('daily','weekly')),
  description   VARCHAR(200),
  goal          INTEGER NOT NULL,
  progress      INTEGER DEFAULT 0,
  reward_greens INTEGER DEFAULT 0,
  reward_gold   INTEGER DEFAULT 0,
  resets_at     TIMESTAMP,
  completed     BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS item_runes (
  id          SERIAL PRIMARY KEY,
  inv_id      INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  rune_inv_id INTEGER UNIQUE REFERENCES inventory(id) ON DELETE CASCADE,
  slot_index  INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 2)
);

CREATE TABLE IF NOT EXISTS active_potions (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER REFERENCES players(id) ON DELETE CASCADE,
  potion_name VARCHAR(100),
  effect_type VARCHAR(50),
  effect_value INTEGER DEFAULT 0,
  battles_left INTEGER,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_ingredients (
  id              SERIAL PRIMARY KEY,
  player_id       INTEGER REFERENCES players(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(100) NOT NULL,
  quantity        INTEGER DEFAULT 0,
  UNIQUE(player_id, ingredient_name)
);

CREATE TABLE IF NOT EXISTS recipes (
  id          SERIAL PRIMARY KEY,
  potion_name VARCHAR(100) NOT NULL,
  ingredients JSONB NOT NULL,
  min_level   INTEGER DEFAULT 1
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
  harvest_bonus    INTEGER DEFAULT 0,
  is_luck_amulet   BOOLEAN DEFAULT false,
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

-- Seed: рослини v3 (100 рослин, рів.1-100)
INSERT INTO plants (name, emoji, growth_minutes, greens_reward, exp_reward, seed_price, min_level, frame_color, is_boss) VALUES
  ('Пшениця',              '🌾', 5,     50,        10,  5,       1,   'gray',   false),
  ('Морква',               '🥕', 7,     90,        10,  9,       2,   'gray',   false),
  ('Редиска',              '🌱', 10,    162,       10,  16,      3,   'gray',   false),
  ('Цибуля',               '🧅', 14,    292,       10,  29,      4,   'gray',   false),
  ('Часник',               '🧄', 21,    526,       11,  52,      5,   'gray',   false),
  ('Петрушка',             '🌿', 29,    949,       11,  94,      6,   'gray',   false),
  ('Кріп',                 '🌿', 42,    1709,      11,  170,     7,   'gray',   false),
  ('Буряк',                '🍠', 59,    3080,      12,  308,     8,   'gray',   false),
  ('Ріпа',                 '🥔', 84,    5550,      12,  555,     9,   'gray',   false),
  ('Капуста',              '🥬', 120,   20000,     26,  2000,    10,  'gray',   true),
  ('Горох',                '🫛', 126,   10881,     13,  1088,    11,  'gray',   false),
  ('Квасоля',              '🫘', 132,   11840,     13,  1184,    12,  'gray',   false),
  ('Салат',                '🥗', 139,   12883,     14,  1288,    13,  'gray',   false),
  ('Шпинат',               '🥬', 146,   14018,     14,  1401,    14,  'gray',   false),
  ('Базилік',              '🌿', 153,   15254,     15,  1525,    15,  'gray',   false),
  ('М''ята',               '🌿', 161,   16598,     15,  1659,    16,  'gray',   false),
  ('Кабачок',              '🥒', 169,   18061,     16,  1806,    17,  'gray',   false),
  ('Огірок',               '🥒', 178,   19652,     16,  1965,    18,  'gray',   false),
  ('Помідор',              '🍅', 187,   21384,     17,  2138,    19,  'gray',   false),
  ('Соняшник',             '🌻', 196,   46538,     34,  4653,    20,  'gray',   true),
  ('Полуниця',             '🍓', 206,   25319,     18,  2531,    21,  'green',  false),
  ('Малина',               '🍓', 217,   27550,     18,  2755,    22,  'green',  false),
  ('Смородина',            '🫐', 228,   29978,     19,  2997,    23,  'green',  false),
  ('Аґрус',                '🍈', 239,   32620,     19,  3262,    24,  'green',  false),
  ('Чорниця',              '🫐', 251,   35495,     20,  3549,    25,  'green',  false),
  ('Суниця',               '🍓', 264,   38623,     20,  3862,    26,  'green',  false),
  ('Брусниця',             '🍒', 277,   42026,     21,  4202,    27,  'green',  false),
  ('Калина',               '🍒', 291,   45730,     22,  4573,    28,  'green',  false),
  ('Терен',                '🫐', 306,   49760,     22,  4976,    29,  'green',  false),
  ('Виноград',             '🍇', 321,   108290,    46,  10829,   30,  'green',  true),
  ('Диня',                 '🍈', 337,   58916,     24,  5891,    31,  'green',  false),
  ('Кавун',                '🍉', 354,   64108,     25,  6410,    32,  'green',  false),
  ('Гарбуз',               '🎃', 372,   69758,     25,  6975,    33,  'green',  false),
  ('Ківі',                 '🥝', 391,   75905,     26,  7590,    34,  'green',  false),
  ('Манго',                '🥭', 411,   82594,     27,  8259,    35,  'green',  false),
  ('Папая',                '🥭', 432,   89873,     28,  8987,    36,  'green',  false),
  ('Фейхоа',               '🍐', 453,   97793,     28,  9779,    37,  'green',  false),
  ('Ананас',               '🍍', 476,   106411,    29,  10641,   38,  'green',  false),
  ('Маракуя',              '🫐', 500,   115788,    30,  11578,   39,  'green',  false),
  ('Авокадо',              '🥑', 526,   251984,    62,  25198,   40,  'green',  true),
  ('Зілля Сили',           '💪', 552,   137094,    32,  13709,   41,  'blue',   false),
  ('Зілля Спритності',     '🏃', 580,   149176,    33,  14917,   42,  'blue',   false),
  ('Зілля Стійкості',      '🛡', 609,   162322,    34,  16232,   43,  'blue',   false),
  ('Зілля Точності',       '🎯', 640,   176626,    35,  17662,   44,  'blue',   false),
  ('Трава Цілителя',       '💚', 672,   192191,    36,  19219,   45,  'blue',   false),
  ('Корінь Захисту',       '🌱', 706,   209127,    37,  20912,   46,  'blue',   false),
  ('Лист Берсерка',        '🍃', 742,   227556,    38,  22755,   47,  'blue',   false),
  ('Квітка Удачі',         '🍀', 779,   247610,    40,  24761,   48,  'blue',   false),
  ('Пагін Мудреця',        '🌿', 819,   269430,    41,  26943,   49,  'blue',   false),
  ('Зілля Дракона',        '🐉', 860,   586346,    84,  58634,   50,  'blue',   true),
  ('Чарівний Гриб',        '🍄', 903,   319008,    43,  31900,   51,  'blue',   false),
  ('Гриб Мудрості',        '🍄', 949,   347120,    45,  34712,   52,  'blue',   false),
  ('Гриб Відваги',         '🍄', 997,   377710,    46,  37771,   53,  'blue',   false),
  ('Гриб Тіні',            '🍄', 1047,  410995,    47,  41099,   54,  'blue',   false),
  ('Гриб Вогню',           '🔥', 1100,  447213,    49,  44721,   55,  'blue',   false),
  ('Гриб Льоду',           '❄',  1155,  486623,    50,  48662,   56,  'blue',   false),
  ('Гриб Бурі',            '⚡',  1214,  529506,    52,  52950,   57,  'blue',   false),
  ('Гриб Землі',           '🍄', 1275,  576168,    53,  57616,   58,  'blue',   false),
  ('Гриб Духу',            '🍄', 1339,  626942,    55,  62694,   59,  'blue',   false),
  ('Деревний Гриб',        '🌲', 1407,  1364380,   114, 136438,  60,  'blue',   true),
  ('Кристальна Квітка',    '💎', 1478,  742307,    58,  74230,   61,  'purple', false),
  ('Рубінова Троянда',     '🌹', 1552,  807721,    60,  80772,   62,  'purple', false),
  ('Сапфірова Лілія',      '💙', 1631,  878900,    62,  87890,   63,  'purple', false),
  ('Смарагдовий Плющ',     '🌿', 1713,  956352,    64,  95635,   64,  'purple', false),
  ('Янтарний Кактус',      '🌵', 1799,  1040629,   66,  104062,  65,  'purple', false),
  ('Діамантовий Лотос',    '🪷', 1890,  1132333,   68,  113233,  66,  'purple', false),
  ('Онікс-Папороть',       '🌿', 1986,  1232118,   70,  123211,  67,  'purple', false),
  ('Перламутрова Орхідея', '🌸', 2086,  1340696,   72,  134069,  68,  'purple', false),
  ('Аметистовий Мох',      '🌿', 2191,  1458842,   74,  145884,  69,  'purple', false),
  ('Кришталева Пальма',    '🌴', 2302,  3174802,   152, 317480,  70,  'purple', true),
  ('Хмарний Цвіт',         '☁',  2418,  1727288,   79,  172728,  71,  'purple', false),
  ('Зоряний Лист',         '⭐',  2540,  1879502,   81,  187950,  72,  'purple', false),
  ('Місячна Трава',        '🌙', 2668,  2045130,   84,  204513,  73,  'purple', false),
  ('Сонячна Квітка',       '🌸', 2803,  2225354,   86,  222535,  74,  'purple', false),
  ('Зілля Зірок',          '🌟', 2944,  2421459,   89,  242145,  75,  'purple', false),
  ('Небесний Корінь',      '🌌', 3093,  2634846,   91,  263484,  76,  'purple', false),
  ('Пагін Світання',       '🌅', 3249,  2867037,   94,  286703,  77,  'purple', false),
  ('Вечірня Роса',         '💧', 3413,  3119690,   97,  311969,  78,  'purple', false),
  ('Північне Сяйво',       '🌌', 3585,  3394608,   100, 339460,  79,  'purple', false),
  ('Зоряна Лілія',         '🌸', 3766,  7387504,   206, 738750,  80,  'purple', true),
  ('Прадавній Корінь',     '🌳', 3956,  4019258,   106, 401925,  81,  'orange', false),
  ('Вічнозелений Лист',    '🍃', 4155,  4373448,   109, 437344,  82,  'orange', false),
  ('Рунічна Квітка',       '🔮', 4365,  4758851,   112, 475885,  83,  'orange', false),
  ('Ельфійський Цвіт',     '🌸', 4585,  5178216,   116, 517821,  84,  'orange', false),
  ('Орківська Колючка',    '🌵', 4817,  5634538,   119, 563453,  85,  'orange', false),
  ('Безсмертник Воїна',    '⚔',  5060,  6131072,   123, 613107,  86,  'orange', false),
  ('Архонтова Трава',      '👑', 5315,  6671362,   127, 667136,  87,  'orange', false),
  ('Лист Часу',            '⏳', 5583,  7259265,   130, 725926,  88,  'orange', false),
  ('Квітка Пророцтва',     '🔮', 5865,  7898975,   134, 789897,  89,  'orange', false),
  ('Корінь Вічності',      '🌿', 6161,  17190118,  276, 1719011, 90,  'orange', true),
  ('Драконоцвіт',          '🐲', 6472,  9352484,   143, 935248,  91,  'gold',   false),
  ('Золотоцвіт',           '🌼', 6799,  10176656,  147, 1017665, 92,  'gold',   false),
  ('Фенікс-Квітка',        '🔥', 7142,  11073456,  151, 1107345, 93,  'gold',   false),
  ('Кров Землі',           '🌋', 7502,  12049286,  156, 1204928, 94,  'gold',   false),
  ('Сльоза Богів',         '💧', 7881,  13111109,  160, 1311110, 95,  'gold',   false),
  ('Серце Лісу',           '🌲', 8278,  14266503,  165, 1426650, 96,  'gold',   false),
  ('Зілля Безсмертя',      '✨', 8696,  15523715,  170, 1552371, 97,  'gold',   false),
  ('Квітка Хаосу',         '💫', 9135,  16891716,  175, 1689171, 98,  'gold',   false),
  ('Квітка Порядку',       '🌸', 9596,  18380269,  181, 1838026, 99,  'gold',   false),
  ('Квітка Всесвіту',      '🌌', 10080, 40000000,  372, 4000000, 100, 'gold',   true)
ON CONFLICT DO NOTHING;

-- Seed: зброя (13 предметів, рівні 1-60)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Дерев''яний кий',  'weapon', 5,   0,  0,  0,  100,   1),
  ('Залізний меч',     'weapon', 15,  0,  0,  5,  500,   5),
  ('Сталевий топір',   'weapon', 28,  5,  0,  0,  1200,  10),
  ('Коса смерті',      'weapon', 42,  0,  10, 0,  3000,  15),
  ('Рунічний клинок',  'weapon', 58,  0,  0,  12, 5500,  20),
  ('Молот Бурі',       'weapon', 75,  10, 0,  0,  9000,  25),
  ('Ельфійський лук',  'weapon', 65,  0,  20, 20, 14000, 30),
  ('Орківський тесак', 'weapon', 95,  15, 0,  0,  20000, 35),
  ('Клинок Світанку',  'weapon', 115, 0,  15, 20, 28000, 40),
  ('Серп Жнеця',       'weapon', 135, 0,  25, 10, 38000, 45),
  ('Залізо Хаосу',     'weapon', 160, 20, 0,  15, 50000, 50),
  ('Меч Легенди',      'weapon', 185, 10, 10, 25, 65000, 55),
  ('Коса Вічності',    'weapon', 215, 0,  30, 30, 85000, 60)
ON CONFLICT DO NOTHING;

-- Seed: броня (9 предметів, рівні 1-60)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Шкіряний жилет',   'armor', 0,  8,   0,   0,  150,   1),
  ('Кольчуга',         'armor', 0,  22,  0,   0,  700,   8),
  ('Лицарська броня',  'armor', 0,  40,  -5,  0,  2500,  15),
  ('Шкіра Дракона',    'armor', 5,  58,  0,   0,  6000,  22),
  ('Панцир Воїна',     'armor', 0,  80,  -8,  0,  12000, 30),
  ('Сталева Пластина', 'armor', 0,  105, -10, 5,  22000, 38),
  ('Броня Берсерка',   'armor', 20, 120, 0,   0,  35000, 45),
  ('Хітон Вічності',   'armor', 10, 145, 10,  10, 52000, 52),
  ('Доспіх Богів',     'armor', 15, 175, 0,   15, 80000, 60)
ON CONFLICT DO NOTHING;

-- Seed: шоломи (9 предметів, рівні 1-60)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Шкіряна шапка',   'helmet', 0,  5,  0,  0,  80,    1),
  ('Шолом воїна',     'helmet', 3,  10, 0,  0,  400,   6),
  ('Рогатий шолом',   'helmet', 5,  18, 0,  0,  1500,  12),
  ('Маска вбивці',    'helmet', 0,  15, 10, 15, 4500,  20),
  ('Корона шипів',    'helmet', 10, 28, 0,  10, 9500,  28),
  ('Шолом Берсерка',  'helmet', 18, 35, 0,  0,  18000, 36),
  ('Шолом Дракона',   'helmet', 12, 50, 8,  12, 30000, 44),
  ('Діадема Мудреця', 'helmet', 8,  45, 15, 20, 48000, 52),
  ('Корона Богів',    'helmet', 20, 65, 10, 25, 75000, 60)
ON CONFLICT DO NOTHING;

-- Seed: щити (8 предметів, рівні 1-60)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Дерев''яний щит', 'shield', 0,  6,   0,  0,  80,    1),
  ('Залізний щит',    'shield', 0,  18,  0,  0,  500,   7),
  ('Щит Лицаря',      'shield', 0,  32,  0,  5,  2000,  14),
  ('Щит Дракона',     'shield', 0,  48,  0,  8,  5500,  22),
  ('Рунічний щит',    'shield', 5,  65,  0,  10, 11000, 30),
  ('Щит Велетня',     'shield', 0,  85,  -5, 0,  20000, 38),
  ('Дзеркало Воїна',  'shield', 0,  105, 5,  15, 33000, 46),
  ('Щит Богів',       'shield', 10, 130, 0,  20, 60000, 56)
ON CONFLICT DO NOTHING;

-- Seed: зілля (з effect_type/value/rounds)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level, effect_type, effect_value, effect_rounds) VALUES
  ('Зілля сили',          'potion', 15, 0,  0,  0,  300,  1,  'power',        15, 3),
  ('Зілля стійкості',     'potion', 0,  15, 0,  0,  300,  1,  'endurance',    15, 3),
  ('Зілля швидкості',     'potion', 0,  0,  15, 0,  300,  1,  'speed',        15, 3),
  ('Зілля точності',      'potion', 0,  0,  0,  15, 350,  3,  'accuracy',     15, 3),
  ('Зілля лікування',     'potion', 0,  0,  0,  0,  400,  5,  'heal',         30, 0),
  ('Зілля врожаю',        'potion', 0,  0,  0,  0,  600,  8,  'harvest',      25, -1),
  ('Велике зілля сили',   'potion', 35, 0,  0,  0,  1200, 15, 'power',        35, 5),
  ('Зілля невразливості', 'potion', 0,  0,  0,  0,  1800, 20, 'damage_reduce',30, 2)
ON CONFLICT DO NOTHING;

-- Seed: руни (8 типів, рівні 1-45)
INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Руна вогню',     'rune', 8,   0,   0,  5,  500,   1),
  ('Руна льоду',     'rune', 0,   8,   0,  5,  500,   5),
  ('Руна Блискавки', 'rune', 10,  0,   10, 0,  1200,  10),
  ('Руна Землі',     'rune', 0,   15,  0,  0,  2000,  15),
  ('Руна Вітру',     'rune', 0,   0,   12, 10, 3000,  20),
  ('Руна Тьми',      'rune', 20,  -5,  0,  0,  6000,  28),
  ('Руна Світла',    'rune', 0,   15,  0,  15, 10000, 36),
  ('Руна Дракона',   'rune', 25,  20,  0,  0,  20000, 45)
ON CONFLICT DO NOTHING;

INSERT INTO items (name, category, price, price_gold, min_level) VALUES
  ('Кільце злодія',         'ring',     0,    400, 1),
  ('Кільце Жнеця',          'ring',     300,  0,   5),
  ('Кільце Берсерка',       'ring',     0,    600, 10),
  ('Кільце Цілителя',       'ring',     500,  0,   15),
  ('Кільце Удачі',          'ring',     0,    800, 20),
  ('Кільце Мудреця',        'ring',     1000, 0,   25),
  ('Талісман золотошукача', 'talisman', 0,    300, 1),
  ('Талісман Воїна',        'talisman', 400,  0,   5),
  ('Талісман Фермера',      'talisman', 350,  0,   8),
  ('Талісман Захисника',    'talisman', 400,  0,   12),
  ('Талісман Тіні',         'talisman', 0,    700, 18),
  ('Талісман Полководця',   'talisman', 0,    600, 22)
ON CONFLICT DO NOTHING;

-- Seed: рецепти для алхіміка
INSERT INTO recipes (potion_name, ingredients, min_level) VALUES
  ('Зілля сили',          '[{"qty":3,"src":"plants","name":"Пшениця"},{"qty":2,"src":"plants","name":"Морква"}]',                               1),
  ('Зілля стійкості',     '[{"qty":3,"src":"plants","name":"Капуста"},{"qty":2,"src":"plants","name":"Морква"}]',                               1),
  ('Зілля швидкості',     '[{"qty":2,"src":"plants","name":"Соняшник"},{"qty":3,"src":"plants","name":"Пшениця"}]',                             1),
  ('Зілля точності',      '[{"qty":4,"src":"plants","name":"Морква"},{"qty":1,"src":"plants","name":"Гарбуз"}]',                                3),
  ('Зілля лікування',     '[{"qty":1,"src":"inventory","name":"Зілля сили"},{"qty":2,"src":"plants","name":"Капуста"}]',                        5),
  ('Зілля врожаю',        '[{"qty":2,"src":"plants","name":"Виноград"},{"qty":1,"src":"plants","name":"Диня"}]',                                8),
  ('Велике зілля сили',   '[{"qty":2,"src":"inventory","name":"Зілля сили"},{"qty":1,"src":"inventory","name":"Руна вогню"}]',                  15),
  ('Зілля невразливості', '[{"qty":2,"src":"inventory","name":"Зілля стійкості"},{"qty":1,"src":"plants","name":"Чарівний гриб"}]',             20)
ON CONFLICT DO NOTHING;
