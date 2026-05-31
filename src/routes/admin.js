const router = require('express').Router();
const requireAdmin = require('../middleware/requireAdmin');
const { pool } = require('../db');

router.use(requireAdmin);

// Server stats
router.get('/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM players');
    const online = await pool.query('SELECT COUNT(*) FROM players WHERE is_online=true');
    const battles24h = await pool.query(
      'SELECT COUNT(*) FROM battles WHERE created_at > NOW() - INTERVAL \'24 hours\''
    );
    const newToday = await pool.query(
      'SELECT COUNT(*) FROM players WHERE created_at > NOW() - INTERVAL \'24 hours\''
    );
    res.json({
      total: parseInt(total.rows[0].count),
      online: parseInt(online.rows[0].count),
      battles24h: parseInt(battles24h.rows[0].count),
      newToday: parseInt(newToday.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// List/search players
router.get('/players', async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  try {
    const { rows } = await pool.query(
      `SELECT id, username, level, faction, is_online, is_banned, ban_reason, is_admin, created_at, greens, gold
       FROM players
       WHERE username ILIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [search]
    );
    res.json({ players: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Ban
router.post('/players/:id/ban', async (req, res) => {
  const { reason } = req.body;
  await pool.query(
    'UPDATE players SET is_banned=true, ban_reason=$1 WHERE id=$2',
    [reason || 'Без причини', req.params.id]
  );
  res.json({ success: true });
});

// Unban
router.post('/players/:id/unban', async (req, res) => {
  await pool.query(
    'UPDATE players SET is_banned=false, ban_reason=NULL WHERE id=$1',
    [req.params.id]
  );
  res.json({ success: true });
});

// Give currency
router.post('/players/:id/give', async (req, res) => {
  const { greens, gold, diamonds } = req.body;
  try {
    await pool.query(
      `UPDATE players SET
         greens = greens + $1,
         gold = gold + $2,
         diamonds = diamonds + $3
       WHERE id=$4`,
      [parseInt(greens) || 0, parseInt(gold) || 0, parseInt(diamonds) || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// All items
router.get('/items', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM items ORDER BY category, min_level');
  res.json({ items: rows });
});

// Add item
router.post('/items', async (req, res) => {
  const { name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level } = req.body;
  try {
    const { rows: [item] } = await pool.query(
      `INSERT INTO items (name, category, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, price, min_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [name, category, power_bonus||0, endurance_bonus||0, speed_bonus||0, accuracy_bonus||0, price, min_level||1]
    );
    res.json({ success: true, id: item.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Toggle item active
router.put('/items/:id/toggle', async (req, res) => {
  await pool.query('UPDATE items SET is_active = NOT is_active WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
