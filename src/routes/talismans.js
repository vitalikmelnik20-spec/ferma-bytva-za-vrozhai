const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

function bonusPct(level) { return level * 10; }

// Index = target level; level 1 = purchase (300 gold), not an upgrade
const UPGRADE_COSTS = [0, 0, 120, 150, 180, 210, 240, 270, 300, 330, 360];
function upgradeCost(level) { return UPGRADE_COSTS[level] || 0; }

// POST /api/talismans/buy
router.post('/buy', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      `SELECT * FROM items WHERE category='talisman' AND name='Талісман золотошукача'`
    );
    if (!item) return res.status(404).json({ error: 'Предмет не знайдено' });

    const { rows: [player] } = await pool.query(
      'SELECT gold FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < item.price_gold)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${item.price_gold}` });

    const { rows: existing } = await pool.query(
      `SELECT inv.id FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1 AND it.category='talisman'`,
      [req.session.playerId]
    );
    if (existing.length) return res.status(400).json({ error: 'У вас вже є Талісман золотошукача' });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [item.price_gold, req.session.playerId]);

    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, item.id]
    );

    await pool.query(
      `INSERT INTO talisman_upgrades (player_id, item_id, inv_id, talisman_level, bonus_pct)
       VALUES ($1,$2,$3,1,10)`,
      [req.session.playerId, item.id, inv.id]
    );

    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/talismans/upgrade/:invId
router.post('/upgrade/:invId', async (req, res) => {
  try {
    const { rows: [tu] } = await pool.query(
      `SELECT tu.*, inv.player_id FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id
       WHERE tu.inv_id=$1 AND inv.player_id=$2`,
      [req.params.invId, req.session.playerId]
    );
    if (!tu) return res.status(404).json({ error: 'Талісман не знайдено' });
    if (tu.talisman_level >= 10) return res.status(400).json({ error: 'Максимальний рівень досягнуто' });

    const cost = upgradeCost(tu.talisman_level + 1);
    const { rows: [player] } = await pool.query(
      'SELECT gold FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < cost)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost}` });

    const newLevel  = tu.talisman_level + 1;
    const newBonus  = bonusPct(newLevel);

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [cost, req.session.playerId]);
    await pool.query(
      `UPDATE talisman_upgrades SET talisman_level=$1, bonus_pct=$2, upgraded_at=NOW()
       WHERE inv_id=$3`,
      [newLevel, newBonus, req.params.invId]
    );

    const nextCost = newLevel < 10 ? upgradeCost(newLevel + 1) : null;
    res.json({ success: true, newLevel, newBonus, nextCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/talismans/info/:invId
router.get('/info/:invId', async (req, res) => {
  try {
    const { rows: [tu] } = await pool.query(
      `SELECT tu.* FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id
       WHERE tu.inv_id=$1 AND inv.player_id=$2`,
      [req.params.invId, req.session.playerId]
    );
    if (!tu) return res.status(404).json({ error: 'Талісман не знайдено' });

    const nextCost = tu.talisman_level < 10 ? upgradeCost(tu.talisman_level + 1) : null;
    res.json({ talisman: tu, nextCost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
