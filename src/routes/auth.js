const router = require('express').Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');

router.post('/register', async (req, res) => {
  const { username, password, faction, gender } = req.body;

  if (!username || !password || !faction || !gender)
    return res.status(400).json({ error: 'Всі поля обов\'язкові' });
  if (username.length < 3 || username.length > 20)
    return res.status(400).json({ error: 'Нікнейм: від 3 до 20 символів' });
  if (!/^[a-zA-Zа-яА-ЯіІїЇєЄёЁ0-9_]+$/u.test(username))
    return res.status(400).json({ error: 'Нікнейм: тільки букви, цифри та _' });
  if (password.length < 4)
    return res.status(400).json({ error: 'Пароль: мінімум 4 символи' });
  if (!['elves', 'orcs'].includes(faction))
    return res.status(400).json({ error: 'Невірна фракція' });
  if (!['male', 'female'].includes(gender))
    return res.status(400).json({ error: 'Невірна стать' });

  try {
    const exists = await pool.query(
      'SELECT id FROM players WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Нікнейм вже зайнятий' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO players (username, password_hash, faction, gender)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [username, hash, faction, gender]
    );
    const playerId = rows[0].id;

    await pool.query('INSERT INTO training (player_id) VALUES ($1)', [playerId]);
    await pool.query('INSERT INTO pets (player_id) VALUES ($1)', [playerId]);
    await pool.query(
      'INSERT INTO plots (player_id, slot_index) VALUES ($1,0), ($1,1)',
      [playerId]
    );

    req.session.playerId = playerId;
    await pool.query('UPDATE players SET is_online=true WHERE id=$1', [playerId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Введіть логін і пароль' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM players WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    if (!rows[0])
      return res.status(400).json({ error: 'Невірний логін або пароль' });

    const player = rows[0];
    if (player.is_banned)
      return res.status(403).json({ error: `Акаунт заблокований. Причина: ${player.ban_reason}` });

    const valid = await bcrypt.compare(password, player.password_hash);
    if (!valid)
      return res.status(400).json({ error: 'Невірний логін або пароль' });

    req.session.playerId = player.id;
    await pool.query('UPDATE players SET is_online=true, last_seen=NOW() WHERE id=$1', [player.id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/logout', async (req, res) => {
  if (req.session.playerId) {
    await pool.query(
      'UPDATE players SET is_online=false, last_seen=NOW() WHERE id=$1',
      [req.session.playerId]
    ).catch(console.error);
  }
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', async (req, res) => {
  if (!req.session.playerId) return res.json({ player: null });

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.username, p.faction, p.gender, p.level, p.experience, p.exp_to_next,
              p.greens, p.gold, p.diamonds, p.glory, p.hp, p.max_hp,
              p.rating_points, p.wins, p.losses, p.battles_today, p.battles_max,
              p.city_name, p.status_text, p.medals, p.is_online, p.is_admin,
              p.on_vacation, p.created_at,
              t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
              pt.power_level as pet_power, pt.endurance_level as pet_endurance,
              c.name as clan_name, c.tag as clan_tag, cm.role as clan_role
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN pets pt ON pt.player_id = p.id
       LEFT JOIN clan_members cm ON cm.player_id = p.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       WHERE p.id = $1`,
      [req.session.playerId]
    );
    if (!rows[0]) return res.json({ player: null });
    res.json({ player: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Stats for landing page
router.get('/stats', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM players');
    const online = await pool.query('SELECT COUNT(*) FROM players WHERE is_online=true');
    res.json({
      total: parseInt(total.rows[0].count),
      online: parseInt(online.rows[0].count)
    });
  } catch (err) {
    res.json({ total: 0, online: 0 });
  }
});

module.exports = router;
