const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

// Ring level stats lookup
function ringStats(level) {
  let chance, maxSteal;
  if (level <= 5) {
    chance = Math.round(5 + (level - 1) * 4.5);
  } else {
    chance = Math.round(25 + (level - 5) * 5);
  }
  maxSteal = chance / 2;
  return { chance, maxSteal };
}

// Exact costs from TZ table (index = target level)
const UPGRADE_COSTS = [0, 0, 200, 280, 370, 470, 580, 700, 830, 970, 1200];
function upgradeCost(level) {
  return UPGRADE_COSTS[level] || 0;
}

// POST /api/rings/buy — buy ring for 400 gold
router.post('/buy', async (req, res) => {
  try {
    const { rows: [ring] } = await pool.query(
      `SELECT * FROM items WHERE category='ring' AND name='Кільце злодія'`
    );
    if (!ring) return res.status(404).json({ error: 'Предмет не знайдено' });

    const { rows: [player] } = await pool.query(
      'SELECT gold, level FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < ring.price_gold)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${ring.price_gold}` });

    // Check if already owns this ring
    const { rows: existing } = await pool.query(
      `SELECT inv.id FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1 AND it.category='ring'`,
      [req.session.playerId]
    );
    if (existing.length) return res.status(400).json({ error: 'У вас вже є Кільце злодія' });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [ring.price_gold, req.session.playerId]);

    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, ring.id]
    );

    await pool.query(
      `INSERT INTO ring_upgrades (player_id, item_id, inv_id, ring_level, steal_chance, max_steal_pct)
       VALUES ($1,$2,$3,1,5,2.5)`,
      [req.session.playerId, ring.id, inv.id]
    );

    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/rings/upgrade/:invId — upgrade ring by 1 level
router.post('/upgrade/:invId', async (req, res) => {
  try {
    const { rows: [ru] } = await pool.query(
      `SELECT ru.*, inv.player_id FROM ring_upgrades ru
       JOIN inventory inv ON inv.id = ru.inv_id
       WHERE ru.inv_id=$1 AND inv.player_id=$2`,
      [req.params.invId, req.session.playerId]
    );
    if (!ru) return res.status(404).json({ error: 'Кільце не знайдено' });
    if (ru.ring_level >= 10) return res.status(400).json({ error: 'Максимальний рівень досягнуто' });

    const cost = upgradeCost(ru.ring_level + 1);
    const { rows: [player] } = await pool.query(
      'SELECT gold FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < cost)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost}` });

    const newLevel = ru.ring_level + 1;
    const { chance, maxSteal } = ringStats(newLevel);

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [cost, req.session.playerId]);
    await pool.query(
      `UPDATE ring_upgrades SET ring_level=$1, steal_chance=$2, max_steal_pct=$3, upgraded_at=NOW()
       WHERE inv_id=$4`,
      [newLevel, chance, maxSteal, req.params.invId]
    );

    const nextCost = newLevel < 10 ? upgradeCost(newLevel + 1) : null;
    res.json({ success: true, newLevel, chance, maxSteal, nextCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/rings/info/:invId — get ring level info
router.get('/info/:invId', async (req, res) => {
  try {
    const { rows: [ru] } = await pool.query(
      `SELECT ru.* FROM ring_upgrades ru
       JOIN inventory inv ON inv.id = ru.inv_id
       WHERE ru.inv_id=$1 AND inv.player_id=$2`,
      [req.params.invId, req.session.playerId]
    );
    if (!ru) return res.status(404).json({ error: 'Кільце не знайдено' });

    const nextCost = ru.ring_level < 10 ? upgradeCost(ru.ring_level + 1) : null;
    res.json({ ring: ru, nextCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/rings/theft-log — theft log for current player
router.get('/theft-log', async (req, res) => {
  try {
    const { rows: stolen } = await pool.query(
      `SELECT tl.*, p.username as victim_name
       FROM theft_log tl JOIN players p ON p.id = tl.victim_id
       WHERE tl.thief_id=$1 ORDER BY tl.created_at DESC LIMIT 20`,
      [req.session.playerId]
    );
    const { rows: lostTo } = await pool.query(
      `SELECT tl.*, p.username as thief_name
       FROM theft_log tl JOIN players p ON p.id = tl.thief_id
       WHERE tl.victim_id=$1 ORDER BY tl.created_at DESC LIMIT 20`,
      [req.session.playerId]
    );
    res.json({ stolen, lostTo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
