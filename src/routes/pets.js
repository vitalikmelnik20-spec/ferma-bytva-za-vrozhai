const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

// ─── Довідник тваринок ────────────────────────────────────────────────────────
const PET_CATALOG = [
  // Звичайні (rarity 1) — за золото
  { type: 'mink',   rarity: 1, name: 'Мінь',   icon: '🐟', price: 200,  currency: 'gold',
    power: 5, endurance: 3, speed: 8, accuracy: 7, hp: 150 },
  { type: 'beaver', rarity: 1, name: 'Бобер',  icon: '🦫', price: 600,  currency: 'gold',
    power: 6, endurance: 8, speed: 4, accuracy: 5, hp: 220 },
  { type: 'wolf',   rarity: 1, name: 'Вовк',   icon: '🐺', price: 500,  currency: 'gold',
    power: 9, endurance: 5, speed: 7, accuracy: 6, hp: 180 },
  { type: 'bear',   rarity: 1, name: 'Медвідь', icon: '🐻', price: 800,  currency: 'gold',
    power: 12, endurance: 9, speed: 3, accuracy: 4, hp: 300 },
  { type: 'lizard', rarity: 1, name: 'Ящір',   icon: '🦎', price: 1200, currency: 'gold',
    power: 8, endurance: 12, speed: 5, accuracy: 6, hp: 260 },
  // Рідкісні (rarity 2) — за алмази
  { type: 'silver_wolf',  rarity: 2, name: 'Срібний Вовк',    icon: '🐺✨', price: 50,  currency: 'diamonds',
    power: 11, endurance: 6, speed: 9, accuracy: 8, hp: 225 },
  { type: 'ice_lizard',   rarity: 2, name: 'Льодяний Ящір',   icon: '🦎❄️', price: 50,  currency: 'diamonds',
    power: 10, endurance: 15, speed: 6, accuracy: 8, hp: 325 },
  { type: 'mighty_bear',  rarity: 2, name: 'Могутній Медвідь', icon: '🐻💪', price: 50,  currency: 'diamonds',
    power: 15, endurance: 11, speed: 4, accuracy: 5, hp: 375 },
  // Легендарні (rarity 3) — за алмази
  { type: 'fire_wolf',  rarity: 3, name: 'Вогняний Вовк', icon: '🐺🔥', price: 150, currency: 'diamonds',
    power: 14, endurance: 8, speed: 11, accuracy: 9, hp: 270,
    ability: 'double_bite', abilityDesc: '15% шанс: урон ×2 у раунді' },
  { type: 'dragonling', rarity: 3, name: 'Дракончик',     icon: '🐲',   price: 150, currency: 'diamonds',
    power: 13, endurance: 9, speed: 9, accuracy: 10, hp: 240,
    ability: 'fire_breath', abilityDesc: '10% шанс: урон ×3 один раз за бій' },
  { type: 'golden_eagle', rarity: 3, name: 'Золотий Орел', icon: '🦅',  price: 150, currency: 'diamonds',
    power: 11, endurance: 10, speed: 12, accuracy: 11, hp: 210,
    ability: 'wing_shield', abilityDesc: '20% шанс: блокує атаку ворожої тваринки (0 урону)' },
];

const EQUIPMENT_CATALOG = [
  { slot: 'collar', name: 'Бойовий ошийник', stat: 'power',    icon: '🔴',
    levels: [
      { level: 1, bonus: 10, price: 200 },
      { level: 2, bonus: 20, price: 500 },
      { level: 3, bonus: 35, price: 900 },
      { level: 4, bonus: 50, price: 1400 },
      { level: 5, bonus: 60, price: 2000 },
    ]},
  { slot: 'amulet', name: 'Захисний амулет', stat: 'endurance', icon: '🔵',
    levels: [
      { level: 1, bonus: 10, price: 200 },
      { level: 2, bonus: 20, price: 500 },
      { level: 3, bonus: 35, price: 900 },
      { level: 4, bonus: 50, price: 1400 },
      { level: 5, bonus: 60, price: 2000 },
    ]},
  { slot: 'armor', name: 'Легкий панцир', stat: 'hp',        icon: '🟢',
    levels: [
      { level: 1, bonus: 50,  price: 300 },
      { level: 2, bonus: 100, price: 700 },
      { level: 3, bonus: 175, price: 1200 },
      { level: 4, bonus: 250, price: 2000 },
      { level: 5, bonus: 300, price: 3000 },
    ]},
  { slot: 'boots', name: 'Чоботи мисливця', stat: 'accuracy', icon: '🟡',
    levels: [
      { level: 1, bonus: 5,  price: 150 },
      { level: 2, bonus: 10, price: 350 },
      { level: 3, bonus: 18, price: 650 },
      { level: 4, bonus: 25, price: 1000 },
      { level: 5, bonus: 30, price: 1500 },
    ]},
];

// Розрахунок HP тваринки з урахуванням броні
function calcHpMax(pet, equipment) {
  const armorBonus = equipment.find(e => e.slot === 'armor')?.bonus_value || 0;
  return pet.hp_max + armorBonus;
}

// Ефективні стати (базові + тренування + екіпіровка)
function effectiveStats(pet, training, equipment) {
  const eq = (slot) => equipment.find(e => e.slot === slot)?.bonus_value || 0;
  return {
    power:     pet.power     + (training?.power_level     || 0) + eq('collar'),
    endurance: pet.endurance + (training?.endurance_level || 0) + eq('amulet'),
    speed:     pet.speed     + (training?.speed_level     || 0),
    accuracy:  pet.accuracy  + (training?.accuracy_level  || 0) + eq('boots'),
    hp_max:    pet.hp_max    + eq('armor'),
  };
}

// ─── GET /api/pets/my ─────────────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const { rows: [pet] } = await pool.query(
      'SELECT * FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) return res.json({ pet: null });

    const { rows: [training] } = await pool.query(
      'SELECT * FROM pet_training WHERE pet_id=$1', [pet.id]
    );
    const { rows: equipment } = await pool.query(
      'SELECT * FROM pet_equipment WHERE pet_id=$1', [pet.id]
    );
    const { rows: [stats] } = await pool.query(
      'SELECT * FROM pet_stats WHERE pet_id=$1', [pet.id]
    );

    const catalog = PET_CATALOG.find(p => p.type === pet.pet_type) || {};
    const eff = effectiveStats(pet, training, equipment);

    res.json({
      pet: {
        ...pet,
        icon: catalog.icon || '🐾',
        ability: catalog.ability || null,
        abilityDesc: catalog.abilityDesc || null,
        effective: eff,
      },
      training: training || null,
      equipment,
      stats: stats || null,
    });
  } catch (err) {
    console.error('[pets/my]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/pets/shop ───────────────────────────────────────────────────────
router.get('/shop', async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query(
      'SELECT id FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    res.json({ catalog: PET_CATALOG, equipment: EQUIPMENT_CATALOG, hasPet: !!existing });
  } catch (err) {
    console.error('[pets/shop]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/pets/buy ───────────────────────────────────────────────────────
router.post('/buy', async (req, res) => {
  const { petType } = req.body;
  const playerId = req.session.playerId;

  const template = PET_CATALOG.find(p => p.type === petType);
  if (!template) return res.status(400).json({ error: 'Невідомий тип тваринки' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [existing] } = await client.query(
      'SELECT id FROM pets WHERE player_id=$1', [playerId]
    );
    if (existing) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'У вас вже є тваринка' });
    }

    const { rows: [player] } = await client.query(
      'SELECT gold, diamonds FROM players WHERE id=$1', [playerId]
    );

    const col = template.currency === 'diamonds' ? 'diamonds' : 'gold';
    if (player[col] < template.price) {
      await client.query('ROLLBACK');
      const colName = col === 'diamonds' ? 'алмазів' : 'золота';
      return res.status(400).json({ error: `Недостатньо ${colName}. Потрібно: ${template.price}` });
    }

    await client.query(`UPDATE players SET ${col}=${col}-$1 WHERE id=$2`, [template.price, playerId]);

    const { rows: [pet] } = await client.query(
      `INSERT INTO pets (player_id, pet_type, rarity, name, hp_current, hp_max, power, endurance, speed, accuracy)
       VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9) RETURNING *`,
      [playerId, template.type, template.rarity, template.name,
       template.hp, template.power, template.endurance, template.speed, template.accuracy]
    );

    await client.query('INSERT INTO pet_training (pet_id) VALUES ($1)', [pet.id]);
    await client.query('INSERT INTO pet_stats (pet_id) VALUES ($1)', [pet.id]);

    await client.query('COMMIT');
    res.json({ ok: true, pet: { ...pet, icon: template.icon } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pets/buy]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

// ─── POST /api/pets/toggle ────────────────────────────────────────────────────
router.post('/toggle', async (req, res) => {
  try {
    const { rows: [pet] } = await pool.query(
      'SELECT id, is_active, is_dead FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) return res.status(404).json({ error: 'Тваринки немає' });
    if (pet.is_dead && !pet.is_active) return res.status(400).json({ error: 'Тваринка мертва — спочатку відновіть' });

    const newActive = !pet.is_active;
    await pool.query('UPDATE pets SET is_active=$1 WHERE id=$2', [newActive, pet.id]);
    res.json({ ok: true, is_active: newActive });
  } catch (err) {
    console.error('[pets/toggle]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/pets/revive ────────────────────────────────────────────────────
router.post('/revive', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [pet] } = await client.query(
      'SELECT p.*, pt.total_green_spent FROM pets p JOIN pet_training pt ON pt.pet_id=p.id WHERE p.player_id=$1',
      [req.session.playerId]
    );
    if (!pet) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Тваринки немає' }); }
    if (!pet.is_dead) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Тваринка жива' }); }

    const spent = pet.total_green_spent || 0;
    // §6.2 / Таблиця 8: зелень = spent × 0.5; золото: 100 якщо без прокачки, інакше min(500, 50×(floor(spent/5000)+1))
    const greenCost = Math.max(0, Math.floor(spent * 0.5));
    const goldCost  = spent === 0 ? 100 : Math.min(500, 50 * (Math.floor(spent / 5000) + 1));

    const { rows: [player] } = await client.query(
      'SELECT greens, gold FROM players WHERE id=$1', [req.session.playerId]
    );

    if (greenCost > 0 && player.greens < greenCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${greenCost}` });
    }
    if (player.gold < goldCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${goldCost}` });
    }

    if (greenCost > 0) await client.query('UPDATE players SET greens=greens-$1 WHERE id=$2', [greenCost, req.session.playerId]);
    await client.query('UPDATE players SET gold=gold-$1 WHERE id=$2', [goldCost, req.session.playerId]);

    // §6.3: після відновлення HP = 50% від максимуму
    const halfHp = Math.max(1, Math.floor(pet.hp_max / 2));
    await client.query('UPDATE pets SET is_dead=false, hp_current=$1 WHERE id=$2', [halfHp, pet.id]);
    await client.query("UPDATE pet_stats SET deaths=deaths+1 WHERE pet_id=$1", [pet.id]);

    await client.query('COMMIT');
    res.json({ ok: true, greenCost, goldCost, hpCurrent: halfHp });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pets/revive]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

// ─── POST /api/pets/heal ──────────────────────────────────────────────────────
router.post('/heal', async (req, res) => {
  try {
    const { rows: [pet] } = await pool.query(
      'SELECT * FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) return res.status(404).json({ error: 'Тваринки немає' });
    if (pet.is_dead) return res.status(400).json({ error: 'Тваринка мертва' });
    if (pet.hp_current >= pet.hp_max) return res.status(400).json({ error: 'HP вже повне' });

    const missing = pet.hp_max - pet.hp_current;
    const cost = Math.max(10, Math.floor(missing / 5));

    const { rows: [player] } = await pool.query('SELECT greens FROM players WHERE id=$1', [req.session.playerId]);
    if (player.greens < cost) return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });

    await pool.query('UPDATE players SET greens=greens-$1 WHERE id=$2', [cost, req.session.playerId]);
    await pool.query('UPDATE pets SET hp_current=hp_max WHERE id=$1', [pet.id]);

    res.json({ ok: true, cost, hpMax: pet.hp_max });
  } catch (err) {
    console.error('[pets/heal]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/pets/train ─────────────────────────────────────────────────────
router.post('/train', async (req, res) => {
  const { stat } = req.body; // power/endurance/speed/accuracy
  const VALID_STATS = ['power', 'endurance', 'speed', 'accuracy'];
  if (!VALID_STATS.includes(stat)) return res.status(400).json({ error: 'Невідомий стат' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [pet] } = await client.query(
      'SELECT * FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Тваринки немає' }); }

    const { rows: [training] } = await client.query(
      'SELECT * FROM pet_training WHERE pet_id=$1 FOR UPDATE', [pet.id]
    );
    const lvlCol = `${stat}_level`;
    const currentLvl = training[lvlCol];
    if (currentLvl >= 50) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Максимальний рівень досягнуто' });
    }

    const nextLvl = currentLvl + 1;
    const cost = Math.floor(nextLvl * nextLvl * 10 + nextLvl * 20);

    const { rows: [player] } = await client.query(
      'SELECT greens FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.greens < cost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });
    }

    await client.query('UPDATE players SET greens=greens-$1 WHERE id=$2', [cost, req.session.playerId]);
    await client.query(
      `UPDATE pet_training SET ${lvlCol}=${lvlCol}+1, total_green_spent=total_green_spent+$1 WHERE pet_id=$2`,
      [cost, pet.id]
    );
    // Базовий стат тваринки теж зростає
    await client.query(`UPDATE pets SET ${stat}=${stat}+1 WHERE id=$1`, [pet.id]);

    await client.query('COMMIT');
    res.json({ ok: true, stat, newLevel: nextLvl, cost });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pets/train]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

// ─── POST /api/pets/train-bulk ────────────────────────────────────────────────
// Прокачати стат до цільового рівня за одну операцію
router.post('/train-bulk', async (req, res) => {
  const { stat, targetLevel } = req.body;
  const VALID_STATS = ['power', 'endurance', 'speed', 'accuracy'];
  if (!VALID_STATS.includes(stat)) return res.status(400).json({ error: 'Невідомий стат' });
  if (!targetLevel || targetLevel < 2 || targetLevel > 50)
    return res.status(400).json({ error: 'Цільовий рівень: 2–50' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [pet] } = await client.query(
      'SELECT * FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Тваринки немає' }); }

    const { rows: [training] } = await client.query(
      'SELECT * FROM pet_training WHERE pet_id=$1 FOR UPDATE', [pet.id]
    );
    const lvlCol = `${stat}_level`;
    const currentLvl = training[lvlCol];
    if (currentLvl >= targetLevel) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Стат вже на рівні ${currentLvl}` });
    }

    let totalCost = 0;
    for (let lvl = currentLvl + 1; lvl <= targetLevel; lvl++) {
      totalCost += Math.floor(lvl * lvl * 10 + lvl * 20);
    }
    const levels = targetLevel - currentLvl;

    const { rows: [player] } = await client.query(
      'SELECT greens FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.greens < totalCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${totalCost}` });
    }

    await client.query('UPDATE players SET greens=greens-$1 WHERE id=$2', [totalCost, req.session.playerId]);
    await client.query(
      `UPDATE pet_training SET ${lvlCol}=$1, total_green_spent=total_green_spent+$2 WHERE pet_id=$3`,
      [targetLevel, totalCost, pet.id]
    );
    await client.query(`UPDATE pets SET ${stat}=${stat}+$1 WHERE id=$2`, [levels, pet.id]);

    await client.query('COMMIT');
    res.json({ ok: true, stat, newLevel: targetLevel, cost: totalCost, levels });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pets/train-bulk]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

// ─── POST /api/pets/equip ─────────────────────────────────────────────────────
router.post('/equip', async (req, res) => {
  const { slot, level } = req.body;
  const slotCatalog = EQUIPMENT_CATALOG.find(e => e.slot === slot);
  if (!slotCatalog) return res.status(400).json({ error: 'Невідомий слот' });
  const lvlData = slotCatalog.levels.find(l => l.level === level);
  if (!lvlData) return res.status(400).json({ error: 'Невідомий рівень предмету' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [pet] } = await client.query(
      'SELECT id FROM pets WHERE player_id=$1', [req.session.playerId]
    );
    if (!pet) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Тваринки немає' }); }

    const { rows: [player] } = await client.query(
      'SELECT gold FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < lvlData.price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${lvlData.price}` });
    }

    await client.query('UPDATE players SET gold=gold-$1 WHERE id=$2', [lvlData.price, req.session.playerId]);
    await client.query(
      `INSERT INTO pet_equipment (pet_id, slot, item_level, bonus_value)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (pet_id, slot) DO UPDATE SET item_level=$3, bonus_value=$4`,
      [pet.id, slot, level, lvlData.bonus]
    );

    await client.query('COMMIT');
    res.json({ ok: true, slot, level, bonus: lvlData.bonus, price: lvlData.price });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[pets/equip]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

// ─── GET /api/pets/player/:id ─────────────────────────────────────────────────
router.get('/player/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (!targetId) return res.status(400).json({ error: 'Невірний ID' });

    const { rows: [pet] } = await pool.query(
      'SELECT * FROM pets WHERE player_id=$1', [targetId]
    );
    if (!pet) return res.json({ pet: null });

    const { rows: [training] } = await pool.query(
      'SELECT * FROM pet_training WHERE pet_id=$1', [pet.id]
    );
    const { rows: equipment } = await pool.query(
      'SELECT * FROM pet_equipment WHERE pet_id=$1', [pet.id]
    );
    const { rows: [stats] } = await pool.query(
      'SELECT * FROM pet_stats WHERE pet_id=$1', [pet.id]
    );

    const catalog = PET_CATALOG.find(p => p.type === pet.pet_type) || {};
    res.json({ pet: { ...pet, icon: catalog.icon || '🐾', abilityDesc: catalog.abilityDesc || null }, training, equipment, stats });
  } catch (err) {
    console.error('[pets/player/:id]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/pets/play/:petId ───────────────────────────────────────────────
router.post('/play/:petId', async (req, res) => {
  // Додати +5 HP тваринці друга (раз на день)
  try {
    const petId = parseInt(req.params.petId);
    const playerId = req.session.playerId;

    const { rows: [pet] } = await pool.query(
      'SELECT * FROM pets WHERE id=$1', [petId]
    );
    if (!pet) return res.status(404).json({ error: 'Тваринку не знайдено' });
    if (pet.player_id === playerId) return res.status(400).json({ error: 'Не можна грати зі своєю тваринкою' });
    if (pet.is_dead) return res.status(400).json({ error: 'Тваринка мертва' });

    // Перевірка: чи вже гравець грав з цією тваринкою сьогодні
    const { rows: [check] } = await pool.query(
      `SELECT 1 FROM chat_messages
       WHERE player_id=$1 AND message=$2 AND created_at >= CURRENT_DATE
       LIMIT 1`,
      [playerId, `__pet_play_${petId}`]
    );
    if (check) return res.status(400).json({ error: 'Вже гралися сьогодні з цією тваринкою' });

    // Зберігаємо маркер взаємодії через chat_messages (швидко, без нової таблиці)
    await pool.query(
      `INSERT INTO chat_messages (player_id, message, chat_type) VALUES ($1,$2,'system')`,
      [playerId, `__pet_play_${petId}`]
    );

    const newHp = Math.min(pet.hp_max, pet.hp_current + 5);
    await pool.query('UPDATE pets SET hp_current=$1 WHERE id=$2', [newHp, petId]);

    res.json({ ok: true, hpAdded: newHp - pet.hp_current });
  } catch (err) {
    console.error('[pets/play]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Експортуємо каталог для використання в battle
module.exports = router;
module.exports.PET_CATALOG = PET_CATALOG;
