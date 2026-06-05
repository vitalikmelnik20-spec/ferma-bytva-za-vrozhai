const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
              p.greens, p.gold, p.diamonds, p.glory, p.hp, p.max_hp, p.hp_regen,
              p.rating_points, p.wins, p.losses, p.battles_today, p.battles_max,
              p.city_name, p.status_text, p.medals, p.is_online, p.is_admin,
              p.on_vacation, p.created_at,
              t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
              pt.power as pet_power, pt.endurance as pet_endurance,
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

// POST /api/auth/telegram-webapp — auth via Telegram Mini App initData
function verifyTelegramInit(initData) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  const dataCheckString = [...urlParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const authDate = parseInt(urlParams.get('auth_date') || '0');
  if (Date.now() / 1000 - authDate > 86400) return null;

  return JSON.parse(urlParams.get('user') || 'null');
}

router.post('/telegram-webapp', async (req, res) => {
  try {
    const { initData, faction, gender } = req.body;
    if (!initData) return res.status(400).json({ error: 'Немає initData' });

    const tgUser = verifyTelegramInit(initData);
    if (!tgUser) return res.status(401).json({ error: 'Невірний підпис Telegram' });

    // Find existing player
    let { rows: [player] } = await pool.query(
      'SELECT id FROM players WHERE telegram_id=$1', [tgUser.id]
    );

    if (!player) {
      // New user — require faction & gender choice
      if (!faction || !gender) {
        return res.json({ needsSetup: true });
      }
      if (!['elves', 'orcs'].includes(faction))
        return res.status(400).json({ error: 'Невірна фракція' });
      if (!['male', 'female'].includes(gender))
        return res.status(400).json({ error: 'Невірна стать' });

      let username = (tgUser.username || `tg${tgUser.id}`).slice(0, 20);
      const { rows: [conflict] } = await pool.query(
        'SELECT id FROM players WHERE username=$1', [username]
      );
      if (conflict) username = `tg${tgUser.id}`;

      const { rows: [newPlayer] } = await pool.query(
        `INSERT INTO players (username, password_hash, faction, gender, telegram_id, telegram_username)
         VALUES ($1,'telegram_auth',$2,$3,$4,$5) RETURNING id`,
        [username, faction, gender, tgUser.id, tgUser.username || null]
      );
      await pool.query('INSERT INTO training (player_id) VALUES ($1)', [newPlayer.id]);
      await pool.query('INSERT INTO pets (player_id) VALUES ($1)',     [newPlayer.id]);
      await pool.query(
        'INSERT INTO plots (player_id, slot_index) VALUES ($1,0),($1,1)', [newPlayer.id]
      );
      player = newPlayer;
    }

    req.session.playerId = player.id;
    await pool.query(
      'UPDATE players SET is_online=true, telegram_username=$1 WHERE id=$2',
      [tgUser.username || null, player.id]
    );
    res.json({ success: true });
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
