const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { checkAchievements } = require('../utils/achievements');

router.use(requireAuth);

// Get all items + player inventory
router.get('/', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      'SELECT level, greens, gold FROM players WHERE id=$1',
      [req.session.playerId]
    );

    const items = await pool.query(
      'SELECT * FROM items WHERE is_active=true ORDER BY category, min_level'
    );

    const inventory = await pool.query(
      `SELECT inv.*, it.name, it.category, it.power_bonus, it.endurance_bonus,
              it.speed_bonus, it.accuracy_bonus
       FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id = $1`,
      [req.session.playerId]
    );

    res.json({
      items: items.rows,
      inventory: inventory.rows,
      playerLevel: player.level,
      playerGreens: player.greens,
      playerGold: player.gold
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Buy item
router.post('/buy/:itemId', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      'SELECT * FROM items WHERE id=$1 AND is_active=true',
      [req.params.itemId]
    );
    if (!item) return res.status(404).json({ error: 'Предмет не знайдено' });

    const usesGold = item.price_gold > 0;
    const price    = usesGold ? item.price_gold : item.price;

    const { rows: [player] } = await pool.query(
      'SELECT greens, gold, level FROM players WHERE id=$1',
      [req.session.playerId]
    );

    if (player.level < item.min_level)
      return res.status(400).json({ error: `Потрібен рівень ${item.min_level}` });

    if (usesGold) {
      if (player.gold < price)
        return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${price}` });
      await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [price, req.session.playerId]);
    } else {
      if (player.greens < price)
        return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${price}` });
      await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [price, req.session.playerId]);
    }

    let expiresAt = null;
    if (item.duration_hours) {
      expiresAt = new Date(Date.now() + item.duration_hours * 3600000);
    }

    const { rows: [invItem] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id, expires_at) VALUES ($1,$2,$3) RETURNING id',
      [req.session.playerId, item.id, expiresAt]
    );

    await pool.query(`UPDATE players SET market_buys=COALESCE(market_buys,0)+1 WHERE id=$1`, [req.session.playerId]);
    checkAchievements(req.session.playerId, req.app.locals.io).catch(() => {});
    res.json({ success: true, inventoryId: invItem.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Equip item
router.post('/equip/:inventoryId', async (req, res) => {
  const SLOT_MAP = {
    weapon: 'weapon',
    armor: 'body',
    shield: 'shield',
    helmet: 'head',
    ring: 'ring',
    talisman: 'talisman',
    rune: null,
    potion: null
  };

  try {
    const { rows: [invItem] } = await pool.query(
      `SELECT inv.*, it.category FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [req.params.inventoryId, req.session.playerId]
    );
    if (!invItem) return res.status(404).json({ error: 'Предмет не знайдено в інвентарі' });

    const slot = SLOT_MAP[invItem.category];
    if (!slot) return res.status(400).json({ error: 'Цей предмет не можна одягти' });

    // Unequip current item in same slot
    await pool.query(
      `UPDATE inventory SET is_equipped=false, slot=NULL
       WHERE player_id=$1 AND slot=$2 AND id != $3`,
      [req.session.playerId, slot, req.params.inventoryId]
    );

    await pool.query(
      'UPDATE inventory SET is_equipped=true, slot=$1 WHERE id=$2',
      [slot, req.params.inventoryId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Unequip item
router.post('/unequip/:inventoryId', async (req, res) => {
  try {
    await pool.query(
      'UPDATE inventory SET is_equipped=false, slot=NULL WHERE id=$1 AND player_id=$2',
      [req.params.inventoryId, req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
