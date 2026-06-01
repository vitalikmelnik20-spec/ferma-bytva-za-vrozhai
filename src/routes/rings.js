const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const RING_CONFIG = {
  'Кільце злодія': {
    currency: 'gold',
    costs: [0, 0, 200, 280, 370, 470, 580, 700, 830, 970, 1200],
    effects: (lv) => {
      const sc = lv <= 5 ? Math.round(5 + (lv - 1) * 4.5) : 25 + (lv - 5) * 5;
      return { steal_chance: sc, max_steal_pct: sc / 2, bonus_value: sc };
    },
    statLabel: (v) => `Шанс крадіжки: ${v}%`,
    subLabel:  (v) => `Вкрасти до: ${Math.round(v / 2)}% золота`,
  },
  'Кільце Жнеця': {
    currency: 'greens',
    costs: [0, 0, 180, 180, 220, 220, 260, 260, 280, 300, 320],
    effects: (lv) => ({ bonus_value: lv * 10 }),
    statLabel: (v) => `+${v}% до врожаю`,
    subLabel:  ()  => 'Бонус до збору з огороду',
  },
  'Кільце Берсерка': {
    currency: 'gold',
    costs: [0, 0, 150, 220, 250, 280, 310, 340, 375, 410, 440],
    effects: (lv) => ({ bonus_value: [0, 5, 10, 14, 19, 24, 29, 34, 36, 38, 40][lv] }),
    statLabel: (v) => `${v}% шанс подвійного удару`,
    subLabel:  ()  => 'Подвоює шкоду при спрацюванні',
  },
  'Кільце Цілителя': {
    currency: 'greens',
    costs: [0, 0, 180, 180, 220, 220, 260, 260, 280, 300, 320],
    effects: (lv) => ({ bonus_value: lv * 5 }),
    statLabel: (v) => `+${v}% регенерації HP/год`,
    subLabel:  ()  => 'Пасивне відновлення здоров\'я',
  },
  'Кільце Удачі': {
    currency: 'gold',
    costs: [0, 0, 180, 250, 280, 310, 340, 370, 410, 445, 480],
    effects: (lv) => ({ bonus_value: [0, 5, 9, 13, 17, 21, 25, 28, 30, 33, 35][lv] }),
    statLabel: (v) => `+${v}% шанс критичного удару`,
    subLabel:  ()  => 'Критичний удар: ×1.5 шкоди',
  },
  'Кільце Мудреця': {
    currency: 'greens',
    costs: [0, 0, 200, 200, 225, 250, 275, 300, 330, 355, 380],
    effects: (lv) => ({ bonus_value: [0, 10, 20, 30, 40, 50, 58, 65, 70, 75, 80][lv] }),
    statLabel: (v) => `+${v}% до досвіду`,
    subLabel:  ()  => 'Бонус до всього отриманого досвіду',
  },
};

async function ensureRingRow(playerId, invId, itemName) {
  const { rowCount } = await pool.query('SELECT id FROM ring_upgrades WHERE inv_id=$1', [invId]);
  if (rowCount > 0) return;
  const cfg = RING_CONFIG[itemName];
  if (!cfg) return;
  const ef = cfg.effects(1);
  const { rows: [inv] } = await pool.query('SELECT item_id FROM inventory WHERE id=$1', [invId]);
  await pool.query(
    `INSERT INTO ring_upgrades (player_id, item_id, inv_id, ring_level, steal_chance, max_steal_pct, bonus_value)
     VALUES ($1,$2,$3,1,$4,$5,$6)`,
    [playerId, inv.item_id, invId, ef.steal_chance || 5, ef.max_steal_pct || 2.5, ef.bonus_value || 0]
  );
}

router.get('/info/:invId', async (req, res) => {
  try {
    const { rows: [inv] } = await pool.query(
      `SELECT inv.id, it.name FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='ring'`,
      [req.params.invId, req.session.playerId]
    );
    if (!inv) return res.status(404).json({ error: 'Кільце не знайдено' });

    await ensureRingRow(req.session.playerId, inv.id, inv.name);

    const { rows: [ru] } = await pool.query('SELECT * FROM ring_upgrades WHERE inv_id=$1', [req.params.invId]);
    const cfg = RING_CONFIG[inv.name];
    if (!cfg) return res.status(400).json({ error: 'Невідоме кільце' });

    const nextCost = ru.ring_level < 10 ? cfg.costs[ru.ring_level + 1] : null;
    res.json({
      ring: ru,
      ringName: inv.name,
      statLabel: cfg.statLabel(ru.bonus_value),
      subLabel:  cfg.subLabel(ru.bonus_value),
      nextCost,
      currency: cfg.currency,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/upgrade/:invId', async (req, res) => {
  try {
    const { rows: [inv] } = await pool.query(
      `SELECT inv.id, it.name FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='ring'`,
      [req.params.invId, req.session.playerId]
    );
    if (!inv) return res.status(404).json({ error: 'Кільце не знайдено' });

    await ensureRingRow(req.session.playerId, inv.id, inv.name);

    const { rows: [ru] } = await pool.query('SELECT * FROM ring_upgrades WHERE inv_id=$1', [req.params.invId]);
    if (ru.ring_level >= 10) return res.status(400).json({ error: 'Максимальний рівень досягнуто' });

    const cfg = RING_CONFIG[inv.name];
    const cost = cfg.costs[ru.ring_level + 1];
    const col  = cfg.currency === 'gold' ? 'gold' : 'greens';

    const { rows: [player] } = await pool.query(`SELECT ${col} FROM players WHERE id=$1`, [req.session.playerId]);
    if (player[col] < cost)
      return res.status(400).json({ error: `Недостатньо ${col === 'gold' ? 'золота' : 'зелені'}. Потрібно: ${cost}` });

    const newLevel = ru.ring_level + 1;
    const ef = cfg.effects(newLevel);

    await pool.query(`UPDATE players SET ${col} = ${col} - $1 WHERE id=$2`, [cost, req.session.playerId]);
    await pool.query(
      `UPDATE ring_upgrades SET ring_level=$1, steal_chance=$2, max_steal_pct=$3, bonus_value=$4, upgraded_at=NOW() WHERE inv_id=$5`,
      [newLevel, ef.steal_chance ?? ru.steal_chance, ef.max_steal_pct ?? ru.max_steal_pct, ef.bonus_value ?? 0, req.params.invId]
    );

    res.json({ success: true, newLevel, bonus: ef.bonus_value ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Legacy buy route (Кільце злодія only)
router.post('/buy', async (req, res) => {
  try {
    const { rows: [ring] } = await pool.query(`SELECT * FROM items WHERE category='ring' AND name='Кільце злодія'`);
    if (!ring) return res.status(404).json({ error: 'Предмет не знайдено' });

    const { rows: [player] } = await pool.query('SELECT gold, level FROM players WHERE id=$1', [req.session.playerId]);
    if (player.gold < ring.price_gold)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${ring.price_gold}` });

    const { rows: existing } = await pool.query(
      `SELECT inv.id FROM inventory inv JOIN items it ON it.id=inv.item_id WHERE inv.player_id=$1 AND it.name='Кільце злодія'`,
      [req.session.playerId]
    );
    if (existing.length) return res.status(400).json({ error: 'У вас вже є Кільце злодія' });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [ring.price_gold, req.session.playerId]);
    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, ring.id]
    );
    await pool.query(
      `INSERT INTO ring_upgrades (player_id, item_id, inv_id, ring_level, steal_chance, max_steal_pct, bonus_value) VALUES ($1,$2,$3,1,5,2.5,5)`,
      [req.session.playerId, ring.id, inv.id]
    );
    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/theft-log', async (req, res) => {
  try {
    const { rows: stolen } = await pool.query(
      `SELECT tl.*, p.username as victim_name FROM theft_log tl JOIN players p ON p.id=tl.victim_id WHERE tl.thief_id=$1 ORDER BY tl.created_at DESC LIMIT 20`,
      [req.session.playerId]
    );
    const { rows: lostTo } = await pool.query(
      `SELECT tl.*, p.username as thief_name FROM theft_log tl JOIN players p ON p.id=tl.thief_id WHERE tl.victim_id=$1 ORDER BY tl.created_at DESC LIMIT 20`,
      [req.session.playerId]
    );
    res.json({ stolen, lostTo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.RING_CONFIG = RING_CONFIG;
