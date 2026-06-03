const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const BUY_COST     = 500;
const DAILY_GREEN  = [0, 500, 1200, 2500, 5000, 12000, 30000, 75000, 180000, 330000, 500000];
const UPGRADE_COSTS = [0, 0, 700, 900, 1100, 1300, 1400, 1500, 1700, 1900, 2100];

function msUntilMidnight() {
  const now  = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next - now;
}

// GET /api/greenhouse
router.get('/', async (req, res) => {
  try {
    const { rows: [gh] } = await pool.query(
      'SELECT * FROM greenhouses WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!gh) return res.json({ greenhouse: null });

    const daily = DAILY_GREEN[gh.level] ?? 0;
    res.json({
      greenhouse: {
        level:           gh.level,
        green_available: gh.green_available,
        daily_green:     daily,
        next_cost:       gh.level < 10 ? UPGRADE_COSTS[gh.level + 1] : null,
        timer_ms:        msUntilMidnight(),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/greenhouse/buy
router.post('/buy', async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query(
      'SELECT id FROM greenhouses WHERE player_id=$1', [req.session.playerId]
    );
    if (existing) return res.status(400).json({ error: 'Теплиця вже куплена' });

    const { rows: [player] } = await pool.query(
      'SELECT gold FROM players WHERE id=$1', [req.session.playerId]
    );
    if (player.gold < BUY_COST)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${BUY_COST}` });

    await pool.query('UPDATE players SET gold=gold-$1 WHERE id=$2', [BUY_COST, req.session.playerId]);
    await pool.query(
      'INSERT INTO greenhouses (player_id, level, green_available) VALUES ($1,1,0)',
      [req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/greenhouse/collect
router.post('/collect', async (req, res) => {
  try {
    const { rows: [gh] } = await pool.query(
      'SELECT * FROM greenhouses WHERE player_id=$1', [req.session.playerId]
    );
    if (!gh)               return res.status(404).json({ error: 'Теплиці немає' });
    if (gh.green_available <= 0) return res.status(400).json({ error: 'Немає що збирати' });

    const amount = gh.green_available;
    await pool.query(
      'UPDATE greenhouses SET green_available=0, last_collected_at=NOW() WHERE player_id=$1',
      [req.session.playerId]
    );
    await pool.query('UPDATE players SET greens=greens+$1 WHERE id=$2', [amount, req.session.playerId]);

    res.json({ success: true, collected: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/greenhouse/upgrade
router.post('/upgrade', async (req, res) => {
  try {
    const { rows: [gh] } = await pool.query(
      'SELECT * FROM greenhouses WHERE player_id=$1', [req.session.playerId]
    );
    if (!gh)          return res.status(404).json({ error: 'Теплиці немає' });
    if (gh.level >= 10) return res.status(400).json({ error: 'Максимальний рівень досягнуто' });

    const cost     = UPGRADE_COSTS[gh.level + 1];
    const newLevel = gh.level + 1;

    const { rows: [player] } = await pool.query('SELECT gold FROM players WHERE id=$1', [req.session.playerId]);
    if (player.gold < cost)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost}` });

    await pool.query('UPDATE players SET gold=gold-$1 WHERE id=$2', [cost, req.session.playerId]);
    await pool.query('UPDATE greenhouses SET level=$1 WHERE player_id=$2', [newLevel, req.session.playerId]);

    res.json({ success: true, newLevel, dailyGreen: DAILY_GREEN[newLevel] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.DAILY_GREEN = DAILY_GREEN;
