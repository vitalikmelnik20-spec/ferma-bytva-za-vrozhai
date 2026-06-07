const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const STATS = ['power', 'endurance', 'speed', 'accuracy'];
const STAT_LABELS = { power: 'Міць', endurance: 'Стійкість', speed: 'Швидкість', accuracy: 'Точність' };
const MAX_LEVEL = 200;

// Рівні кратні 10 — золото; інші — зелень
// Greens: 50 * ceil(newLevel/10),  Gold: newLevel/10
function houseCost(newLevel) {
  if (newLevel % 10 === 0) {
    return { type: 'gold', amount: newLevel / 10 };
  }
  return { type: 'greens', amount: 50 * Math.ceil(newLevel / 10) };
}

// GET /api/houses
router.get('/', async (req, res) => {
  try {
    const pid = req.session.playerId;
    const { rows } = await pool.query(
      `SELECT stat, level FROM player_houses WHERE player_id=$1`, [pid]
    );
    const levels = {};
    for (const s of STATS) levels[s] = 0;
    rows.forEach(r => { levels[r.stat] = r.level; });

    const houses = {};
    for (const s of STATS) {
      const lv = levels[s];
      houses[s] = {
        label:    STAT_LABELS[s],
        level:    lv,
        bonus:    lv,
        nextCost: lv < MAX_LEVEL ? houseCost(lv + 1) : null,
      };
    }

    const { rows: [p] } = await pool.query(
      `SELECT greens, gold FROM players WHERE id=$1`, [pid]
    );
    res.json({ houses, greens: p.greens, gold: p.gold, maxLevel: MAX_LEVEL });
  } catch (err) {
    console.error('[houses/get]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/houses/upgrade/:stat
router.post('/upgrade/:stat', async (req, res) => {
  const { stat } = req.params;
  if (!STATS.includes(stat)) return res.status(400).json({ error: 'Невідомий стат' });

  const pid = req.session.playerId;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [row] } = await client.query(
      `SELECT level FROM player_houses WHERE player_id=$1 AND stat=$2 FOR UPDATE`,
      [pid, stat]
    );
    const currentLevel = row?.level ?? 0;

    if (currentLevel >= MAX_LEVEL) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Максимальний рівень будинку' });
    }

    const newLevel = currentLevel + 1;
    const cost = houseCost(newLevel);

    const { rows: [player] } = await client.query(
      `SELECT greens, gold FROM players WHERE id=$1`, [pid]
    );

    if (cost.type === 'greens' && player.greens < cost.amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost.amount}` });
    }
    if (cost.type === 'gold' && player.gold < cost.amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost.amount}` });
    }

    if (cost.type === 'greens') {
      await client.query(`UPDATE players SET greens=greens-$1 WHERE id=$2`, [cost.amount, pid]);
    } else {
      await client.query(`UPDATE players SET gold=gold-$1 WHERE id=$2`, [cost.amount, pid]);
    }

    await client.query(
      `INSERT INTO player_houses (player_id, stat, level)
       VALUES ($1, $2, 1)
       ON CONFLICT (player_id, stat) DO UPDATE SET level = player_houses.level + 1`,
      [pid, stat]
    );

    await client.query('COMMIT');
    res.json({ ok: true, stat, newLevel, cost });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[houses/upgrade]', err.message);
    res.status(500).json({ error: 'Помилка сервера' });
  } finally {
    client.release();
  }
});

module.exports = router;
module.exports.houseCost = houseCost;
