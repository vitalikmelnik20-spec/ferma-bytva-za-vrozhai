const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

// GET /api/tutorial/progress
router.get('/progress', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO tutorial_progress (player_id) VALUES ($1) ON CONFLICT (player_id) DO NOTHING`,
      [req.session.playerId]
    );
    const { rows: [progress] } = await pool.query(
      'SELECT * FROM tutorial_progress WHERE player_id=$1', [req.session.playerId]
    );
    res.json({ progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/tutorial/skip
router.post('/skip', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO tutorial_progress (player_id, current_step, is_completed, completed_at)
       VALUES ($1, 7, true, NOW())
       ON CONFLICT (player_id) DO UPDATE
         SET current_step=7, is_completed=true, completed_at=NOW()`,
      [req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
