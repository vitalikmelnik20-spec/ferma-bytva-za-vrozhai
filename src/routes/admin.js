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

// GET full player info for editing
router.get('/players/:id', async (req, res) => {
  try {
    const { rows: [p] } = await pool.query(
      `SELECT p.*, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!p) return res.status(404).json({ error: 'Не знайдено' });
    delete p.password_hash;
    res.json({ player: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Edit full player account
router.put('/players/:id', async (req, res) => {
  const {
    username, level, faction, gender, status_text, city_name,
    greens, gold, diamonds, glory, hp, max_hp, rating_points, wins, losses,
    power_level, endurance_level, speed_level, accuracy_level,
    is_admin, on_vacation, is_banned, ban_reason,
  } = req.body;

  try {
    await pool.query(
      `UPDATE players SET
         username        = COALESCE($1,  username),
         level           = COALESCE($2,  level),
         faction         = COALESCE($3,  faction),
         gender          = COALESCE($4,  gender),
         status_text     = COALESCE($5,  status_text),
         city_name       = COALESCE($6,  city_name),
         greens          = COALESCE($7,  greens),
         gold            = COALESCE($8,  gold),
         diamonds        = COALESCE($9,  diamonds),
         glory           = COALESCE($10, glory),
         hp              = COALESCE($11, hp),
         max_hp          = COALESCE($12, max_hp),
         rating_points   = COALESCE($13, rating_points),
         wins            = COALESCE($14, wins),
         losses          = COALESCE($15, losses),
         is_admin        = COALESCE($16, is_admin),
         on_vacation     = COALESCE($17, on_vacation),
         is_banned       = COALESCE($18, is_banned),
         ban_reason      = COALESCE($19, ban_reason)
       WHERE id = $20`,
      [
        username || null, level != null ? parseInt(level) : null,
        faction || null, gender || null, status_text ?? null, city_name ?? null,
        greens  != null ? parseInt(greens)  : null,
        gold    != null ? parseInt(gold)    : null,
        diamonds!= null ? parseInt(diamonds): null,
        glory   != null ? parseInt(glory)   : null,
        hp      != null ? parseInt(hp)      : null,
        max_hp  != null ? parseInt(max_hp)  : null,
        rating_points != null ? parseInt(rating_points) : null,
        wins   != null ? parseInt(wins)   : null,
        losses != null ? parseInt(losses) : null,
        is_admin    != null ? Boolean(is_admin)   : null,
        on_vacation != null ? Boolean(on_vacation): null,
        is_banned   != null ? Boolean(is_banned)  : null,
        ban_reason ?? null,
        req.params.id,
      ]
    );

    // Update training if provided
    if ([power_level, endurance_level, speed_level, accuracy_level].some(v => v != null)) {
      await pool.query(
        `UPDATE training SET
           power_level     = COALESCE($1, power_level),
           endurance_level = COALESCE($2, endurance_level),
           speed_level     = COALESCE($3, speed_level),
           accuracy_level  = COALESCE($4, accuracy_level)
         WHERE player_id = $5`,
        [
          power_level     != null ? parseInt(power_level)     : null,
          endurance_level != null ? parseInt(endurance_level) : null,
          speed_level     != null ? parseInt(speed_level)     : null,
          accuracy_level  != null ? parseInt(accuracy_level)  : null,
          req.params.id,
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
