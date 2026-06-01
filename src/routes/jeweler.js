const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { RING_CONFIG }     = require('./rings');
const { TALISMAN_CONFIG } = require('./talismans');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows: shopItems } = await pool.query(
      `SELECT id, name, category, price, price_gold, min_level,
              power_bonus, endurance_bonus, speed_bonus, accuracy_bonus
       FROM items WHERE category IN ('rune','ring','talisman') AND is_active=true
       ORDER BY category, min_level`
    );

    const { rows: inventory } = await pool.query(
      `SELECT inv.id, inv.item_id, inv.is_equipped, inv.upgrade_level,
              it.name, it.category,
              it.power_bonus, it.endurance_bonus, it.speed_bonus, it.accuracy_bonus
       FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1 AND it.category IN ('rune','ring','talisman')`,
      [req.session.playerId]
    );

    const { rows: [player] } = await pool.query(
      'SELECT gold, greens FROM players WHERE id=$1', [req.session.playerId]
    );

    const { rows: itemRunes } = await pool.query(
      `SELECT ir.inv_id, ir.rune_inv_id, ir.slot_index,
              it.name AS rune_name, it.power_bonus, it.endurance_bonus,
              it.speed_bonus, it.accuracy_bonus
       FROM item_runes ir
       JOIN inventory eq   ON eq.id = ir.inv_id        AND eq.player_id=$1
       JOIN inventory rinv ON rinv.id = ir.rune_inv_id  AND rinv.player_id=$1
       JOIN items it ON it.id = rinv.item_id`,
      [req.session.playerId]
    );

    const { rows: equipItems } = await pool.query(
      `SELECT inv.id, inv.is_equipped, inv.upgrade_level, it.name, it.category
       FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1 AND it.category IN ('weapon','armor','helmet','shield')
       ORDER BY inv.is_equipped DESC, it.category`,
      [req.session.playerId]
    );

    res.json({
      runes:    shopItems.filter(i => i.category === 'rune'),
      rings:    shopItems.filter(i => i.category === 'ring'),
      talismans: shopItems.filter(i => i.category === 'talisman'),
      inventory,
      equipItems,
      itemRunes,
      playerGold:   player.gold,
      playerGreens: player.greens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/buy/:itemId', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      `SELECT * FROM items WHERE id=$1 AND category IN ('rune','ring','talisman')`,
      [req.params.itemId]
    );
    if (!item) return res.status(404).json({ error: 'Предмет не знайдено' });

    const useGold = item.price_gold > 0;
    const cost = useGold ? item.price_gold : item.price;
    const currency = useGold ? 'gold' : 'greens';

    const { rows: [player] } = await pool.query(
      `SELECT ${currency} FROM players WHERE id=$1`,
      [req.session.playerId]
    );
    if (player[currency] < cost)
      return res.status(400).json({ error: `Недостатньо ${currency === 'gold' ? 'золота' : 'зелені'}. Потрібно: ${cost}` });

    await pool.query(
      `UPDATE players SET ${currency} = ${currency} - $1 WHERE id=$2`,
      [cost, req.session.playerId]
    );

    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, item.id]
    );

    // Initialize upgrade row for rings and talismans
    if (item.category === 'ring' && RING_CONFIG[item.name]) {
      const ef = RING_CONFIG[item.name].effects(1);
      await pool.query(
        `INSERT INTO ring_upgrades (player_id, item_id, inv_id, ring_level, steal_chance, max_steal_pct, bonus_value)
         VALUES ($1,$2,$3,1,$4,$5,$6) ON CONFLICT (inv_id) DO NOTHING`,
        [req.session.playerId, item.id, inv.id, ef.steal_chance || 5, ef.max_steal_pct || 2.5, ef.bonus_value || 0]
      );
    }
    if (item.category === 'talisman' && TALISMAN_CONFIG[item.name]) {
      const ef = TALISMAN_CONFIG[item.name].effects(1);
      await pool.query(
        `INSERT INTO talisman_upgrades (player_id, item_id, inv_id, talisman_level, bonus_pct)
         VALUES ($1,$2,$3,1,$4) ON CONFLICT (inv_id) DO NOTHING`,
        [req.session.playerId, item.id, inv.id, ef.bonus_pct]
      );
    }

    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/rune/insert', async (req, res) => {
  const { invId, targetInvId, slot } = req.body;
  if (slot === undefined || slot < 0 || slot > 2)
    return res.status(400).json({ error: 'Слот: 0, 1 або 2' });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS item_runes (
        id SERIAL PRIMARY KEY,
        inv_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
        rune_inv_id INTEGER UNIQUE REFERENCES inventory(id) ON DELETE CASCADE,
        slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 2)
      )
    `);

    const { rows: [runeInv] } = await pool.query(
      `SELECT inv.*, it.category FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='rune'`,
      [invId, req.session.playerId]
    );
    if (!runeInv) return res.status(404).json({ error: 'Руну не знайдено в інвентарі' });

    const { rows: [targetInv] } = await pool.query(
      `SELECT inv.*, it.category FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [targetInvId, req.session.playerId]
    );
    if (!targetInv) return res.status(404).json({ error: 'Цільовий предмет не знайдено' });

    const maxSlots = ['helmet', 'shield'].includes(targetInv.category) ? 2 : 3;
    if (slot >= maxSlots)
      return res.status(400).json({ error: `Цей предмет має максимум ${maxSlots} слоти для рун` });

    const { rows: existing } = await pool.query(
      'SELECT id FROM item_runes WHERE inv_id=$1 AND slot_index=$2',
      [targetInvId, slot]
    );
    if (existing.length > 0)
      return res.status(400).json({ error: 'Цей слот вже зайнятий' });

    const { rows: alreadyInserted } = await pool.query(
      'SELECT id FROM item_runes WHERE rune_inv_id=$1',
      [invId]
    );
    if (alreadyInserted.length > 0)
      return res.status(400).json({ error: 'Руна вже вставлена в інший предмет' });

    await pool.query(
      'INSERT INTO item_runes (inv_id, rune_inv_id, slot_index) VALUES ($1,$2,$3)',
      [targetInvId, invId, slot]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/rune/remove', async (req, res) => {
  const { runeInvId } = req.body;
  const REMOVE_COST = 100;

  try {
    const { rows: [player] } = await pool.query(
      'SELECT greens FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.greens < REMOVE_COST)
      return res.status(400).json({ error: `Потрібно ${REMOVE_COST} зелені для виймання руни` });

    const { rows: [runeInv] } = await pool.query(
      'SELECT inv.id FROM inventory inv WHERE inv.id=$1 AND inv.player_id=$2',
      [runeInvId, req.session.playerId]
    );
    if (!runeInv) return res.status(404).json({ error: 'Руну не знайдено' });

    const { rows: [runeSlot] } = await pool.query(
      'SELECT id FROM item_runes WHERE rune_inv_id=$1',
      [runeInvId]
    );
    if (!runeSlot) return res.status(404).json({ error: 'Руна не вставлена в жоден предмет' });

    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [REMOVE_COST, req.session.playerId]);
    await pool.query('DELETE FROM item_runes WHERE rune_inv_id=$1', [runeInvId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/item-runes/:invId', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS item_runes (
        id SERIAL PRIMARY KEY,
        inv_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
        rune_inv_id INTEGER UNIQUE REFERENCES inventory(id) ON DELETE CASCADE,
        slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 2)
      )
    `);

    const { rows: [targetInv] } = await pool.query(
      'SELECT id FROM inventory WHERE id=$1 AND player_id=$2',
      [req.params.invId, req.session.playerId]
    );
    if (!targetInv) return res.status(404).json({ error: 'Предмет не знайдено' });

    const { rows: runes } = await pool.query(
      `SELECT ir.slot_index, ir.rune_inv_id, it.name, it.description,
              it.power_bonus, it.endurance_bonus, it.speed_bonus, it.accuracy_bonus
       FROM item_runes ir
       JOIN inventory inv ON inv.id = ir.rune_inv_id
       JOIN items it ON it.id = inv.item_id
       WHERE ir.inv_id=$1`,
      [req.params.invId]
    );

    res.json({ runes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
