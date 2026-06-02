-- §1 Тваринки: база даних

CREATE TABLE IF NOT EXISTS pets (
  id            SERIAL PRIMARY KEY,
  player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pet_type      VARCHAR(30) NOT NULL,
  rarity        SMALLINT NOT NULL DEFAULT 1, -- 1=звичайна, 2=рідкісна, 3=легендарна
  name          VARCHAR(50) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  is_dead       BOOLEAN NOT NULL DEFAULT false,
  hp_current    INTEGER NOT NULL,
  hp_max        INTEGER NOT NULL,
  power         INTEGER NOT NULL,
  endurance     INTEGER NOT NULL,
  speed         INTEGER NOT NULL,
  accuracy      INTEGER NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pets_player_unique ON pets(player_id);

CREATE TABLE IF NOT EXISTS pet_training (
  id              SERIAL PRIMARY KEY,
  pet_id          INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  power_level     INTEGER NOT NULL DEFAULT 1,
  endurance_level INTEGER NOT NULL DEFAULT 1,
  speed_level     INTEGER NOT NULL DEFAULT 1,
  accuracy_level  INTEGER NOT NULL DEFAULT 1,
  total_green_spent INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS pet_training_pet_unique ON pet_training(pet_id);

CREATE TABLE IF NOT EXISTS pet_equipment (
  id          SERIAL PRIMARY KEY,
  pet_id      INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  slot        VARCHAR(20) NOT NULL, -- collar/amulet/armor/boots
  item_level  SMALLINT NOT NULL DEFAULT 1,
  bonus_value INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS pet_equipment_slot ON pet_equipment(pet_id, slot);

CREATE TABLE IF NOT EXISTS pet_stats (
  id                    SERIAL PRIMARY KEY,
  pet_id                INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  battles_participated  INTEGER NOT NULL DEFAULT 0,
  wins                  INTEGER NOT NULL DEFAULT 0,
  deaths                INTEGER NOT NULL DEFAULT 0,
  total_damage          INTEGER NOT NULL DEFAULT 0,
  pets_killed           INTEGER NOT NULL DEFAULT 0,
  ability_procs         INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS pet_stats_pet_unique ON pet_stats(pet_id);
