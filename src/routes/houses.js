const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const STATS = ['power', 'endurance', 'speed', 'accuracy'];
const STAT_LABELS = { power: 'Міць', endurance: 'Стійкість', speed: 'Швидкість', accuracy: 'Точність' };
const MAX_LEVEL = 200;

function houseCost(newLevel) {
  if (newLevel % 10 === 0) {
    // 10→100, 20→200, 30→400, 40→800, 50→1600... (doubles every tier)
    return { type: 'gold', amount: 100 * Math.pow(2, newLevel / 10 - 1) };
  }
  // Greens: same formula as player training × 5
  return { type: 'greens', amount: Math.floor(newLevel * newLevel * 10 + newLevel * 20) * 5 };
}

// GET /api/houses
router.get('/', async (req, res) => {
  try {
    const pid = req.session.playerId;

    const { rows: [membership] } = await pool.query(
      `SELECT clan_id FROM clan_members WHERE player_id=$1`, [pid]
    );
    if (!membership) {
      return res.json({ noClan: true });
    }
    const clanId = membership.clan_id;

    const { rows } = await pool.query(
      `SELECT stat, level FROM clan_houses WHERE clan_id=$1`, [clanId]
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

    const { rows: [clan] } = await pool.query(
      `SELECT treasury_greens, treasury_gold FROM clans WHERE id=$1`, [clanId]
    );

    res.json({
      houses,
      treasury_greens: clan.treasury_greens,
      treasury_gold:   clan.treasury_gold,
      maxLevel: MAX_LEVEL,
    });
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

    const { rows: [membership] } = await client.query(
      `SELECT clan_id FROM clan_members WHERE player_id=$1`, [pid]
    );
    if (!membership) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ти не в клані' });
    }
    const clanId = membership.clan_id;

    const { rows: [row] } = await client.query(
      `SELECT level FROM clan_houses WHERE clan_id=$1 AND stat=$2 FOR UPDATE`,
      [clanId, stat]
    );
    const currentLevel = row?.level ?? 0;

    if (currentLevel >= MAX_LEVEL) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Максимальний рівень' });
    }

    const newLevel = currentLevel + 1;
    const cost = houseCost(newLevel);

    const { rows: [clan] } = await client.query(
      `SELECT treasury_greens, treasury_gold FROM clans WHERE id=$1 FOR UPDATE`, [clanId]
    );

    if (cost.type === 'greens' && clan.treasury_greens < cost.amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо зелені в скарбниці. Потрібно: ${cost.amount}` });
    }
    if (cost.type === 'gold' && clan.treasury_gold < cost.amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Недостатньо золота в скарбниці. Потрібно: ${cost.amount}` });
    }

    if (cost.type === 'greens') {
      await client.query(`UPDATE clans SET treasury_greens=treasury_greens-$1 WHERE id=$2`, [cost.amount, clanId]);
    } else {
      await client.query(`UPDATE clans SET treasury_gold=treasury_gold-$1 WHERE id=$2`, [cost.amount, clanId]);
    }

    await client.query(
      `INSERT INTO clan_houses (clan_id, stat, level)
       VALUES ($1, $2, 1)
       ON CONFLICT (clan_id, stat) DO UPDATE SET level = clan_houses.level + 1`,
      [clanId, stat]
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
