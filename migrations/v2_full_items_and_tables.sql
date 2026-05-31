-- =============================================================================
-- Migration: v2_full_items_and_tables.sql
-- Ферма: Битва за врожай
-- Description:
--   1. Insert missing items (weapons, armor, helmets, shields, runes, potions)
--   2. Create new tables: item_runes, recipes, player_ingredients
--   3. Seed alchemist recipes
--
-- NOTE: All INSERTs use ON CONFLICT DO NOTHING — safe to run multiple times.
-- NOTE: inventory.upgrade_level is used as enchant_level in application code;
--       no additional column is needed.
-- =============================================================================


-- =============================================================================
-- SECTION 1: NEW WEAPONS (levels 20–60, 9 items)
-- Existing: Дерев'яний кий, Залізний меч, Сталевий топір, Коса смерті
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Рунічний клинок', 'weapon', 58,  0,  0, 12, 5500,  20),
  ('Молот Бурі',      'weapon', 75, 10,  0,  0, 9000,  25),
  ('Ельфійський лук', 'weapon', 65,  0, 20, 20, 14000, 30),
  ('Орківський тесак','weapon', 95, 15,  0,  0, 20000, 35),
  ('Клинок Світанку', 'weapon',115,  0, 15, 20, 28000, 40),
  ('Серп Жнеця',      'weapon',135,  0, 25, 10, 38000, 45),
  ('Залізо Хаосу',    'weapon',160, 20,  0, 15, 50000, 50),
  ('Меч Легенди',     'weapon',185, 10, 10, 25, 65000, 55),
  ('Коса Вічності',   'weapon',215,  0, 30, 30, 85000, 60)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 2: NEW ARMOR (levels 22–60, 6 items)
-- Existing: Шкіряний жилет, Кольчуга, Лицарська броня
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Шкіра Дракона',   'armor',  5,  58,   0,  0,  6000, 22),
  ('Панцир Воїна',    'armor',  0,  80,  -8,  0, 12000, 30),
  ('Сталева Пластина','armor',  0, 105, -10,  5, 22000, 38),
  ('Броня Берсерка',  'armor', 20, 120,   0,  0, 35000, 45),
  ('Хітон Вічності',  'armor', 10, 145,  10, 10, 52000, 52),
  ('Доспіх Богів',    'armor', 15, 175,   0, 15, 80000, 60)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 3: NEW HELMETS (levels 1–60, 8 items)
-- Existing: Шолом воїна
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Шкіряна шапка',   'helmet',  0,  5,   0,  0,   80,  1),
  ('Рогатий шолом',   'helmet',  5, 18,   0,  0, 1500, 12),
  ('Маска вбивці',    'helmet',  0, 15,  10, 15, 4500, 20),
  ('Корона шипів',    'helmet', 10, 28,   0, 10, 9500, 28),
  ('Шолом Берсерка',  'helmet', 18, 35,   0,  0, 18000, 36),
  ('Шолом Дракона',   'helmet', 12, 50,   8, 12, 30000, 44),
  ('Діадема Мудреця', 'helmet',  8, 45,  15, 20, 48000, 52),
  ('Корона Богів',    'helmet', 20, 65,  10, 25, 75000, 60)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 4: NEW SHIELDS (levels 14–56, 6 items)
-- Existing: Дерев'яний щит, Залізний щит
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Щит Лицаря',      'shield',  0,  32,  0,  5,  2000, 14),
  ('Щит Дракона',     'shield',  0,  48,  0,  8,  5500, 22),
  ('Рунічний щит',    'shield',  5,  65,  0, 10, 11000, 30),
  ('Щит Велетня',     'shield',  0,  85, -5,  0, 20000, 38),
  ('Дзеркало Воїна',  'shield',  0, 105,  5, 15, 33000, 46),
  ('Щит Богів',       'shield', 10, 130,  0, 20, 60000, 56)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 5: NEW RUNES (levels 10–45, 6 items)
-- Existing: Руна вогню, Руна льоду
-- NOTE: Руна Землі would grant +8 hp but there is no hp_bonus column;
--       only stat bonuses available in the schema are inserted.
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level) VALUES
  ('Руна Блискавки', 'rune', 10,   0, 10,  0,  1200, 10),
  ('Руна Землі',     'rune',  0,  15,  0,  0,  2000, 15),
  ('Руна Вітру',     'rune',  0,   0, 12, 10,  3000, 20),
  ('Руна Тьми',      'rune', 20,  -5,  0,  0,  6000, 28),
  ('Руна Світла',    'rune',  0,  15,  0, 15, 10000, 36),
  ('Руна Дракона',   'rune', 25,  20,  0,  0, 20000, 45)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 6: NEW POTIONS (5 items, from alchemist TZ section 4.3)
-- Existing: Зілля сили, Зілля витривалості, Зілля швидкості
-- NOTE: Зілля лікування has no stat bonus — HP restoration is handled in code.
-- NOTE: Зілля невразливості approximated as +30 endurance (reduces damage taken).
-- NOTE: Зілля врожаю grants +25% harvest for 24 h — stored via duration_hours=24.
-- =============================================================================

INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level, duration_hours) VALUES
  ('Зілля точності',        'potion',  0,  0, 0, 15,  350,  3, NULL),
  ('Зілля лікування',       'potion',  0,  0, 0,  0,  400,  5, NULL),
  ('Зілля врожаю',          'potion',  0,  0, 0,  0,  600,  8,   24),
  ('Велике зілля сили',     'potion', 35,  0, 0,  0, 1200, 15, NULL),
  ('Зілля невразливості',   'potion',  0, 30, 0,  0, 1800, 20, NULL)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 7: NEW TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rune slots: links an equipped inventory item to up to 3 socketed runes.
-- slot_index: 0, 1, or 2
-- rune_inv_id is UNIQUE — a rune can be socketed into only one item at a time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_runes (
  id           SERIAL PRIMARY KEY,
  inv_id       INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  rune_inv_id  INTEGER UNIQUE REFERENCES inventory(id) ON DELETE CASCADE,
  slot_index   INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 2),
  UNIQUE(inv_id, slot_index)
);

-- -----------------------------------------------------------------------------
-- Alchemist recipes: maps a potion name to its JSONB ingredient list.
-- ingredients format: [{"name": "<item_or_plant_name>", "qty": <int>}, ...]
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
  id           SERIAL PRIMARY KEY,
  potion_name  VARCHAR(100) NOT NULL,
  ingredients  JSONB NOT NULL,
  min_level    INTEGER DEFAULT 1
);

-- -----------------------------------------------------------------------------
-- Player ingredient inventory: tracks raw crafting materials per player.
-- UNIQUE(player_id, ingredient_name) allows simple UPSERT on quantity.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS player_ingredients (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  ingredient_name  VARCHAR(100) NOT NULL,
  quantity         INTEGER DEFAULT 0,
  UNIQUE(player_id, ingredient_name)
);


-- =============================================================================
-- SECTION 8: SEED ALCHEMIST RECIPES
-- =============================================================================

INSERT INTO recipes (potion_name, ingredients, min_level) VALUES
  ('Зілля сили',
   '[{"name":"Пшениця","qty":3},{"name":"Морква","qty":2}]',
   1),

  ('Зілля стійкості',
   '[{"name":"Капуста","qty":3},{"name":"Морква","qty":2}]',
   1),

  ('Зілля швидкості',
   '[{"name":"Соняшник","qty":2},{"name":"Пшениця","qty":3}]',
   1),

  ('Зілля точності',
   '[{"name":"Морква","qty":4},{"name":"Гарбуз","qty":1}]',
   3),

  ('Зілля лікування',
   '[{"name":"Капуста","qty":2},{"name":"Зілля сили","qty":1}]',
   5),

  ('Зілля врожаю',
   '[{"name":"Виноград","qty":2},{"name":"Диня","qty":1}]',
   8),

  ('Велике зілля сили',
   '[{"name":"Зілля сили","qty":2},{"name":"Руна Вогню","qty":1}]',
   15),

  ('Зілля невразливості',
   '[{"name":"Зілля стійкості","qty":2},{"name":"Чарівний гриб","qty":1}]',
   20)
ON CONFLICT DO NOTHING;
