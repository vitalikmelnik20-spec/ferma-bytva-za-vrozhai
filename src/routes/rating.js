const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.username, p.level, p.faction, p.glory,
              p.rating_points, p.wins, p.losses,
              c.name as clan_name, c.tag as clan_tag
       FROM players p
       LEFT JOIN clan_members cm ON cm.player_id=p.id
       LEFT JOIN clans c ON c.id=cm.clan_id
       WHERE p.is_banned=false
       ORDER BY p.rating_points DESC, p.wins DESC
       LIMIT 50`
    );
    res.json({ players: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/clans', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.username as leader_name,
              (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id=c.id) as member_count
       FROM clans c JOIN players p ON p.id=c.leader_id
       ORDER BY c.rating_points DESC LIMIT 50`
    );
    res.json({ clans: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
