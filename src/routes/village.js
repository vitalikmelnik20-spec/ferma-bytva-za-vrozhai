const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

// Heal player (Цілитель)
router.post('/heal', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      'SELECT hp, max_hp, greens FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.hp >= player.max_hp)
      return res.status(400).json({ error: 'Здоров\'я вже повне' });

    const missing = player.max_hp - player.hp;
    const cost = Math.ceil(missing * 0.5);

    if (player.greens < cost)
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });

    await pool.query(
      'UPDATE players SET hp = max_hp, greens = greens - $1 WHERE id=$2',
      [cost, req.session.playerId]
    );

    res.json({ success: true, healed: missing, cost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

const ENCHANT_TABLE = [
  null,
  { cost: 100,  chance: 100 },
  { cost: 200,  chance: 100 },
  { cost: 400,  chance: 80  },
  { cost: 700,  chance: 60  },
  { cost: 1200, chance: 40  },
];

const BLOCKED_CATEGORIES = ['potion', 'rune', 'ring', 'talisman'];

router.get('/enchant/info/:inventoryId', async (req, res) => {
  try {
    const { rows: [invItem] } = await pool.query(
      `SELECT inv.id, inv.upgrade_level, it.category FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [req.params.inventoryId, req.session.playerId]
    );
    if (!invItem) return res.status(404).json({ error: 'Предмет не знайдено' });
    if (BLOCKED_CATEGORIES.includes(invItem.category))
      return res.status(400).json({ error: 'Цей предмет не можна зачарувати' });

    const currentLevel = invItem.upgrade_level || 0;
    const maxLevel = ENCHANT_TABLE.length - 1;
    const next = currentLevel < maxLevel ? ENCHANT_TABLE[currentLevel + 1] : null;

    const { rows: runeRows } = await pool.query(
      'SELECT id FROM item_runes WHERE inv_id=$1 LIMIT 1',
      [req.params.inventoryId]
    );

    res.json({
      currentLevel,
      maxLevel,
      nextCost: next?.cost ?? null,
      nextChance: next?.chance ?? null,
      hasRunes: runeRows.length > 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/enchant/:inventoryId', async (req, res) => {
  try {
    const { rows: [invItem] } = await pool.query(
      `SELECT inv.id, inv.upgrade_level, it.category FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [req.params.inventoryId, req.session.playerId]
    );
    if (!invItem) return res.status(404).json({ error: 'Предмет не знайдено' });
    if (BLOCKED_CATEGORIES.includes(invItem.category))
      return res.status(400).json({ error: 'Цей предмет не можна зачарувати' });

    const currentLevel = invItem.upgrade_level || 0;
    if (currentLevel >= ENCHANT_TABLE.length - 1)
      return res.status(400).json({ error: 'Максимальний рівень зачарування досягнуто' });

    const { cost, chance } = ENCHANT_TABLE[currentLevel + 1];

    const { rows: [player] } = await pool.query(
      'SELECT gold FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.gold < cost)
      return res.status(400).json({ error: `Потрібно ${cost} золота` });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [cost, req.session.playerId]);

    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= chance;
    const newLevel = success ? currentLevel + 1 : 0;

    await pool.query(
      'UPDATE inventory SET upgrade_level=$1 WHERE id=$2',
      [newLevel, req.params.inventoryId]
    );

    let runesDestroyed = 0;
    if (!success) {
      const { rowCount } = await pool.query(
        'DELETE FROM item_runes WHERE inv_id=$1',
        [req.params.inventoryId]
      );
      runesDestroyed = rowCount;
    }

    res.json({ success, newLevel, roll, cost, runesDestroyed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Get village info (NPCs list)
router.get('/', async (req, res) => {
  const { rows: [player] } = await pool.query(
    'SELECT hp, max_hp, greens, gold FROM players WHERE id=$1',
    [req.session.playerId]
  );
  const missing = player.max_hp - player.hp;
  const healCost = missing > 0 ? Math.ceil(missing * 0.5) : 0;

  res.json({
    player: { hp: player.hp, max_hp: player.max_hp, greens: player.greens, gold: player.gold },
    healCost,
    npcs: [
      { id: 'general',  name: 'Генерал',   icon: 'battle',    desc: 'Кланові війни та союзні бої' },
      { id: 'witch',    name: 'Колдунья',  icon: 'package',   desc: 'Настої та захисні зілля для питомця' },
      { id: 'jeweler',  name: 'Ювелір',    icon: 'ring',      desc: 'Руни, прикраси, кільця і талісмани' },
      { id: 'alchemist',name: 'Алхімік',   icon: 'inventory', desc: 'Рецепти зілля та крафт настоїв' },
      { id: 'smith',    name: 'Коваль',    icon: 'levelup',   desc: 'Покращує зброю/броню (+2 до всіх статів за 500 золота)' },
      { id: 'trader',   name: 'Торговець', icon: 'market',    desc: 'Рідкісні товари за алмази' },
      { id: 'healer',   name: 'Цілитель',  icon: 'hp',        desc: `Відновлює здоров'я (${healCost} зелені)` }
    ]
  });
});

module.exports = router;
