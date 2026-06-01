const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const TALISMAN_CONFIG = {
  'Талісман золотошукача': {
    currency: 'gold',
    costs: [0, 0, 120, 150, 180, 210, 240, 270, 300, 330, 360],
    effects: (lv) => ({ bonus_pct: lv * 10 }),
    statLabel: (v) => `+${v}% до золота з шахт`,
    subLabel:  ()  => 'Бонус до видобутку в печерах',
  },
  'Талісман Воїна': {
    currency: 'greens',
    costs: [0, 0, 150, 150, 190, 190, 230, 230, 265, 275, 290],
    effects: (lv) => ({ bonus_pct: lv * 3 }),
    statLabel: (v) => `+${v} до мощі`,
    subLabel:  ()  => 'Постійний бонус до мощі',
  },
  'Талісман Фермера': {
    currency: 'greens',
    costs: [0, 0, 140, 140, 170, 170, 200, 200, 225, 235, 250],
    effects: (lv) => ({ bonus_pct: [0, 5, 8, 12, 15, 18, 21, 24, 26, 28, 30][lv] }),
    statLabel: (v) => `-${v}% часу росту`,
    subLabel:  ()  => 'Рослини ростуть швидше',
  },
  'Талісман Захисника': {
    currency: 'greens',
    costs: [0, 0, 150, 150, 190, 190, 230, 230, 265, 275, 290],
    effects: (lv) => ({ bonus_pct: lv * 3 }),
    statLabel: (v) => `+${v} до стійкості`,
    subLabel:  ()  => 'Постійний бонус до стійкості',
  },
  'Талісман Тіні': {
    currency: 'gold',
    costs: [0, 0, 220, 220, 280, 280, 340, 340, 380, 410, 440],
    effects: (lv) => ({ bonus_pct: [0, 3, 6, 9, 12, 15, 17, 20, 21, 23, 25][lv] }),
    statLabel: (v) => `${v}% захист від втрати нагороди`,
    subLabel:  ()  => 'Шанс не втратити нагороду при програші',
  },
  'Талісман Полководця': {
    currency: 'gold',
    costs: [0, 0, 200, 200, 250, 250, 300, 300, 345, 360, 380],
    effects: (lv) => ({ bonus_pct: [0, 5, 10, 15, 20, 25, 29, 32, 35, 38, 40][lv] }),
    statLabel: (v) => `+${v}% до нагороди кланових воєн`,
    subLabel:  ()  => 'Бонус до нагород у кланових боях',
  },
};

async function ensureTalismanRow(playerId, invId, itemName) {
  const { rowCount } = await pool.query('SELECT id FROM talisman_upgrades WHERE inv_id=$1', [invId]);
  if (rowCount > 0) return;
  const cfg = TALISMAN_CONFIG[itemName];
  if (!cfg) return;
  const ef = cfg.effects(1);
  const { rows: [inv] } = await pool.query('SELECT item_id FROM inventory WHERE id=$1', [invId]);
  await pool.query(
    `INSERT INTO talisman_upgrades (player_id, item_id, inv_id, talisman_level, bonus_pct) VALUES ($1,$2,$3,1,$4)`,
    [playerId, inv.item_id, invId, ef.bonus_pct]
  );
}

router.get('/info/:invId', async (req, res) => {
  try {
    const { rows: [inv] } = await pool.query(
      `SELECT inv.id, it.name FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='talisman'`,
      [req.params.invId, req.session.playerId]
    );
    if (!inv) return res.status(404).json({ error: 'Талісман не знайдено' });

    await ensureTalismanRow(req.session.playerId, inv.id, inv.name);

    const { rows: [tu] } = await pool.query('SELECT * FROM talisman_upgrades WHERE inv_id=$1', [req.params.invId]);
    const cfg = TALISMAN_CONFIG[inv.name];
    if (!cfg) return res.status(400).json({ error: 'Невідомий талісман' });

    const nextCost = tu.talisman_level < 10 ? cfg.costs[tu.talisman_level + 1] : null;
    res.json({
      talisman: tu,
      talismanName: inv.name,
      statLabel: cfg.statLabel(tu.bonus_pct),
      subLabel:  cfg.subLabel(tu.bonus_pct),
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
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='talisman'`,
      [req.params.invId, req.session.playerId]
    );
    if (!inv) return res.status(404).json({ error: 'Талісман не знайдено' });

    await ensureTalismanRow(req.session.playerId, inv.id, inv.name);

    const { rows: [tu] } = await pool.query('SELECT * FROM talisman_upgrades WHERE inv_id=$1', [req.params.invId]);
    if (tu.talisman_level >= 10) return res.status(400).json({ error: 'Максимальний рівень досягнуто' });

    const cfg = TALISMAN_CONFIG[inv.name];
    const cost = cfg.costs[tu.talisman_level + 1];
    const col  = cfg.currency === 'gold' ? 'gold' : 'greens';

    const { rows: [player] } = await pool.query(`SELECT ${col} FROM players WHERE id=$1`, [req.session.playerId]);
    if (player[col] < cost)
      return res.status(400).json({ error: `Недостатньо ${col === 'gold' ? 'золота' : 'зелені'}. Потрібно: ${cost}` });

    const newLevel = tu.talisman_level + 1;
    const ef = cfg.effects(newLevel);

    await pool.query(`UPDATE players SET ${col} = ${col} - $1 WHERE id=$2`, [cost, req.session.playerId]);
    await pool.query(
      `UPDATE talisman_upgrades SET talisman_level=$1, bonus_pct=$2, upgraded_at=NOW() WHERE inv_id=$3`,
      [newLevel, ef.bonus_pct, req.params.invId]
    );

    res.json({ success: true, newLevel, newBonus: ef.bonus_pct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Legacy buy route (Талісман золотошукача only)
router.post('/buy', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(`SELECT * FROM items WHERE category='talisman' AND name='Талісман золотошукача'`);
    if (!item) return res.status(404).json({ error: 'Предмет не знайдено' });

    const { rows: [player] } = await pool.query('SELECT gold FROM players WHERE id=$1', [req.session.playerId]);
    if (player.gold < item.price_gold)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${item.price_gold}` });

    const { rows: existing } = await pool.query(
      `SELECT inv.id FROM inventory inv JOIN items it ON it.id=inv.item_id WHERE inv.player_id=$1 AND it.name='Талісман золотошукача'`,
      [req.session.playerId]
    );
    if (existing.length) return res.status(400).json({ error: 'У вас вже є Талісман золотошукача' });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [item.price_gold, req.session.playerId]);
    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, item.id]
    );
    await pool.query(
      `INSERT INTO talisman_upgrades (player_id, item_id, inv_id, talisman_level, bonus_pct) VALUES ($1,$2,$3,1,10)`,
      [req.session.playerId, item.id, inv.id]
    );
    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.TALISMAN_CONFIG = TALISMAN_CONFIG;
