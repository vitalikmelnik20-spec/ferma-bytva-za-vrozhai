const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const SYSTEM_TYPES  = ['insects_attack','dragon_start','dragon_end','clan_war_start','clan_war_end','greenhouse_full','deposit_ready'];
const BATTLE_TYPES  = ['battle_win','battle_lose','battle_attacked_win','battle_attacked_lose','ring_stolen','ring_stolen_from'];
const SOCIAL_TYPES  = ['gift_received','friend_request','garden_watered','prank','clan_join','clan_kicked'];
const REWARD_TYPES  = ['level_up','quest_done','deposit_done','daily_reward','tournament_end'];

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let filter = '';
    if (type === 'system')  filter = `AND event_type = ANY($2)`;
    if (type === 'battles') filter = `AND event_type = ANY($2)`;
    if (type === 'social')  filter = `AND event_type = ANY($2)`;
    if (type === 'rewards') filter = `AND event_type = ANY($2)`;

    const typeArr = type === 'system'  ? SYSTEM_TYPES
                  : type === 'battles' ? BATTLE_TYPES
                  : type === 'social'  ? SOCIAL_TYPES
                  : type === 'rewards' ? REWARD_TYPES
                  : null;

    const params = typeArr ? [req.session.playerId, typeArr] : [req.session.playerId];
    const { rows } = await pool.query(
      `SELECT * FROM events WHERE player_id=$1 AND created_at > NOW() - INTERVAL '24 hours' ${filter}
       ORDER BY created_at DESC LIMIT 100`,
      params
    );
    res.json({ events: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/events/count
router.get('/count', async (req, res) => {
  try {
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM events
       WHERE player_id=$1 AND is_read=false AND created_at > NOW() - INTERVAL '24 hours'`,
      [req.session.playerId]
    );
    res.json({ unread_count: parseInt(count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/events/read/:id
router.post('/read/:id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE events SET is_read=true WHERE id=$1 AND player_id=$2`,
      [req.params.id, req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/events/read-all — mark as read AND delete (viewed = gone)
router.post('/read-all', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM events WHERE player_id=$1`,
      [req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// DELETE /api/events/clear
router.delete('/clear', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM events WHERE player_id=$1 AND created_at < NOW() - INTERVAL '7 days'`,
      [req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.SYSTEM_TYPES  = SYSTEM_TYPES;
module.exports.BATTLE_TYPES  = BATTLE_TYPES;
module.exports.SOCIAL_TYPES  = SOCIAL_TYPES;
module.exports.REWARD_TYPES  = REWARD_TYPES;
