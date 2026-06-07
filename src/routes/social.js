const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { checkAchievements } = require('../utils/achievements');

router.use(requireAuth);

// ─── FRIENDS ────────────────────────────────────────────────────────────────

router.get('/friends', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.status,
              CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END as friend_id,
              CASE WHEN f.requester_id=$1 THEN p2.username ELSE p1.username END as friend_name,
              CASE WHEN f.requester_id=$1 THEN p2.level ELSE p1.level END as friend_level,
              CASE WHEN f.requester_id=$1 THEN p2.is_online ELSE p1.is_online END as friend_online,
              CASE WHEN f.requester_id=$1 THEN p2.faction ELSE p1.faction END as friend_faction,
              f.requester_id
       FROM friends f
       JOIN players p1 ON p1.id = f.requester_id
       JOIN players p2 ON p2.id = f.addressee_id
       WHERE f.requester_id=$1 OR f.addressee_id=$1
       ORDER BY f.status, friend_name`,
      [req.session.playerId]
    );
    res.json({ friends: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/friends/request/:targetId', async (req, res) => {
  const targetId = parseInt(req.params.targetId);
  if (targetId === req.session.playerId)
    return res.status(400).json({ error: 'Не можна додати себе' });
  try {
    const exists = await pool.query(
      `SELECT id FROM friends
       WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
      [req.session.playerId, targetId]
    );
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Запит вже існує' });

    await pool.query(
      'INSERT INTO friends (requester_id, addressee_id) VALUES ($1,$2)',
      [req.session.playerId, targetId]
    );
    const { rows: [requester] } = await pool.query('SELECT username FROM players WHERE id=$1', [req.session.playerId]);
    const writeEvent = require('../helpers/writeEvent');
    await writeEvent(targetId, {
      event_type: 'friend_request',
      title: `${requester.username} хоче додати тебе в друзі`,
      icon: '👥', color: 'blue',
    }, req.app.locals.io);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/friends/accept/:friendId', async (req, res) => {
  try {
    const { rows: [fr] } = await pool.query(
      `UPDATE friends SET status='accepted'
       WHERE id=$1 AND addressee_id=$2 AND status='pending' RETURNING requester_id`,
      [req.params.friendId, req.session.playerId]
    );
    res.json({ success: true });
    if (fr) {
      checkAchievements(req.session.playerId, req.app.locals.io).catch(() => {});
      checkAchievements(fr.requester_id, req.app.locals.io).catch(() => {});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.delete('/friends/:friendId', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friends
       WHERE id=$1 AND (requester_id=$2 OR addressee_id=$2)`,
      [req.params.friendId, req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── MAIL ────────────────────────────────────────────────────────────────────

router.get('/mail', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, p.username as sender_name
       FROM mail m
       LEFT JOIN players p ON p.id = m.sender_id
       WHERE m.receiver_id=$1
       ORDER BY m.created_at DESC`,
      [req.session.playerId]
    );
    res.json({ mail: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/mail', async (req, res) => {
  const { receiverName, subject, body } = req.body;
  if (!receiverName || !body)
    return res.status(400).json({ error: 'Одержувач та текст обов\'язкові' });
  try {
    const { rows: [receiver] } = await pool.query(
      'SELECT id FROM players WHERE LOWER(username)=LOWER($1)',
      [receiverName]
    );
    if (!receiver) return res.status(404).json({ error: 'Гравця не знайдено' });

    await pool.query(
      'INSERT INTO mail (sender_id, receiver_id, subject, body) VALUES ($1,$2,$3,$4)',
      [req.session.playerId, receiver.id, subject?.slice(0,100) || '', body.slice(0,2000)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.put('/mail/:id/read', async (req, res) => {
  await pool.query(
    'UPDATE mail SET is_read=true WHERE id=$1 AND receiver_id=$2',
    [req.params.id, req.session.playerId]
  );
  res.json({ success: true });
});

router.delete('/mail/:id', async (req, res) => {
  await pool.query(
    'DELETE FROM mail WHERE id=$1 AND receiver_id=$2',
    [req.params.id, req.session.playerId]
  );
  res.json({ success: true });
});

// ─── GIFTS ───────────────────────────────────────────────────────────────────

const GIFT_LIST = [
  { id: 1, name: 'Статуетка мощі',     power_bonus: 10, endurance_bonus: 0, speed_bonus: 0, accuracy_bonus: 0,  price: 200 },
  { id: 2, name: 'Амулет стійкості',   power_bonus: 0,  endurance_bonus: 10, speed_bonus: 0, accuracy_bonus: 0, price: 200 },
  { id: 3, name: 'Крила швидкості',    power_bonus: 0,  endurance_bonus: 0, speed_bonus: 10, accuracy_bonus: 0, price: 200 },
  { id: 4, name: 'Окуляри точності',   power_bonus: 0,  endurance_bonus: 0, speed_bonus: 0, accuracy_bonus: 10, price: 200 },
  { id: 5, name: 'Чарівна підкова',    power_bonus: 5,  endurance_bonus: 5, speed_bonus: 0, accuracy_bonus: 0,  price: 350 },
];

router.get('/gifts', async (req, res) => {
  res.json({ gifts: GIFT_LIST });
});

router.post('/gifts/send/:targetId', async (req, res) => {
  const { giftId } = req.body;
  const gift = GIFT_LIST.find(g => g.id === parseInt(giftId));
  if (!gift) return res.status(404).json({ error: 'Подарунок не знайдено' });

  try {
    const { rows: [player] } = await pool.query('SELECT greens FROM players WHERE id=$1', [req.session.playerId]);
    if (player.greens < gift.price)
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${gift.price}` });

    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [gift.price, req.session.playerId]);

    const expiresAt = new Date(Date.now() + 48 * 3600000);
    await pool.query(
      `INSERT INTO active_gifts (giver_id, receiver_id, gift_name, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [req.session.playerId, req.params.targetId, gift.name,
       gift.power_bonus, gift.endurance_bonus, gift.speed_bonus, gift.accuracy_bonus, expiresAt]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── TRICKS (ПАКОСТІ) ─────────────────────────────────────────────────────────

router.post('/tricks/:targetId', async (req, res) => {
  const targetId = parseInt(req.params.targetId);
  if (targetId === req.session.playerId)
    return res.status(400).json({ error: 'Не можна робити пакість собі' });
  try {
    const { rows: [victim] } = await pool.query('SELECT greens FROM players WHERE id=$1', [targetId]);
    if (!victim) return res.status(404).json({ error: 'Гравця не знайдено' });

    const maxSteal = Math.min(victim.greens, 110);
    if (maxSteal <= 0) return res.status(400).json({ error: 'Нема що красти' });

    const stolen = 10 + Math.floor(Math.random() * Math.min(101, maxSteal - 9));
    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [stolen, targetId]);
    await pool.query('UPDATE players SET greens = greens + $1 WHERE id=$2', [stolen, req.session.playerId]);
    await pool.query(
      'INSERT INTO tricks (attacker_id, victim_id, greens_stolen) VALUES ($1,$2,$3)',
      [req.session.playerId, targetId, stolen]
    );

    const { rows: [attacker] } = await pool.query('SELECT username FROM players WHERE id=$1', [req.session.playerId]);
    const writeEvent = require('../helpers/writeEvent');
    await writeEvent(targetId, {
      event_type: 'prank',
      title: `${attacker.username} зробив тобі пакість!`,
      body: `Вкрав ${stolen} 🌿`,
      icon: '🐛', color: 'orange',
    }, req.app.locals.io);

    res.json({ success: true, stolen });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/tricks', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, a.username as attacker_name, v.username as victim_name
     FROM tricks t
     JOIN players a ON a.id = t.attacker_id
     JOIN players v ON v.id = t.victim_id
     WHERE t.attacker_id=$1 OR t.victim_id=$1
     ORDER BY t.created_at DESC LIMIT 20`,
    [req.session.playerId]
  );
  res.json({ tricks: rows });
});

// ─── CLANS ───────────────────────────────────────────────────────────────────

router.get('/clans', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, p.username as leader_name,
            (SELECT COUNT(*) FROM clan_members cm WHERE cm.clan_id=c.id) as member_count
     FROM clans c JOIN players p ON p.id=c.leader_id
     ORDER BY c.rating_points DESC`
  );
  res.json({ clans: rows });
});

router.get('/clans/:id', async (req, res) => {
  try {
    const { rows: [clan] } = await pool.query('SELECT * FROM clans WHERE id=$1', [req.params.id]);
    if (!clan) return res.status(404).json({ error: 'Клан не знайдено' });

    const members = await pool.query(
      `SELECT cm.role, p.id, p.username, p.level, p.glory, p.is_online, p.faction
       FROM clan_members cm JOIN players p ON p.id=cm.player_id
       WHERE cm.clan_id=$1
       ORDER BY CASE cm.role WHEN 'leader' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END, p.level DESC`,
      [req.params.id]
    );

    res.json({ clan, members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/clans', async (req, res) => {
  const { name, tag, description } = req.body;
  if (!name || name.length < 3) return res.status(400).json({ error: 'Назва мінімум 3 символи' });
  if (!tag || tag.length > 3) return res.status(400).json({ error: 'Тег — до 3 символів' });

  try {
    const { rows: [player] } = await pool.query('SELECT greens FROM players WHERE id=$1', [req.session.playerId]);
    if (player.greens < 1000)
      return res.status(400).json({ error: 'Потрібно 1000 зелені для створення клану' });

    const inClan = await pool.query('SELECT id FROM clan_members WHERE player_id=$1', [req.session.playerId]);
    if (inClan.rows.length > 0)
      return res.status(400).json({ error: 'Ви вже в клані' });

    await pool.query('UPDATE players SET greens = greens - 1000 WHERE id=$1', [req.session.playerId]);

    const { rows: [clan] } = await pool.query(
      'INSERT INTO clans (name, tag, description, leader_id) VALUES ($1,$2,$3,$4) RETURNING id',
      [name.slice(0,50), tag.slice(0,3), description?.slice(0,500) || '', req.session.playerId]
    );

    await pool.query(
      'INSERT INTO clan_members (clan_id, player_id, role) VALUES ($1,$2,$3)',
      [clan.id, req.session.playerId, 'leader']
    );

    res.json({ success: true, clanId: clan.id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Назва клану вже зайнята' });
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/clans/:id/join', async (req, res) => {
  try {
    const inClan = await pool.query('SELECT id FROM clan_members WHERE player_id=$1', [req.session.playerId]);
    if (inClan.rows.length > 0)
      return res.status(400).json({ error: 'Ви вже в клані' });

    const count = await pool.query('SELECT COUNT(*) FROM clan_members WHERE clan_id=$1', [req.params.id]);
    if (parseInt(count.rows[0].count) >= 20)
      return res.status(400).json({ error: 'Клан заповнений' });

    await pool.query(
      'INSERT INTO clan_members (clan_id, player_id) VALUES ($1,$2)',
      [req.params.id, req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/clans/:id/leave', async (req, res) => {
  try {
    const { rows: [member] } = await pool.query(
      'SELECT role FROM clan_members WHERE clan_id=$1 AND player_id=$2',
      [req.params.id, req.session.playerId]
    );
    if (!member) return res.status(404).json({ error: 'Ви не в цьому клані' });
    if (member.role === 'leader') {
      // Transfer leadership or disband
      const others = await pool.query(
        `SELECT player_id FROM clan_members WHERE clan_id=$1 AND player_id!=$2 ORDER BY CASE role WHEN 'officer' THEN 0 ELSE 1 END LIMIT 1`,
        [req.params.id, req.session.playerId]
      );
      if (others.rows.length > 0) {
        await pool.query('UPDATE clans SET leader_id=$1 WHERE id=$2', [others.rows[0].player_id, req.params.id]);
        await pool.query('UPDATE clan_members SET role=$1 WHERE clan_id=$2 AND player_id=$3', ['leader', req.params.id, others.rows[0].player_id]);
      } else {
        await pool.query('DELETE FROM clans WHERE id=$1', [req.params.id]);
        return res.json({ success: true, disbanded: true });
      }
    }
    await pool.query('DELETE FROM clan_members WHERE clan_id=$1 AND player_id=$2', [req.params.id, req.session.playerId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── SEARCH ──────────────────────────────────────────────────────────────────

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ players: [] });
  try {
    const { rows } = await pool.query(
      `SELECT id, username, level, faction, glory, is_online
       FROM players WHERE username ILIKE $1 AND is_banned=false
       ORDER BY level DESC LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ players: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── CHAT HISTORY ────────────────────────────────────────────────────────────

router.get('/chat/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cm.message, cm.created_at,
              p.id as player_id, p.username, p.faction, p.level
       FROM chat_messages cm JOIN players p ON p.id=cm.player_id
       WHERE cm.chat_type='global'
       ORDER BY cm.created_at DESC LIMIT 50`
    );
    res.json({ messages: rows.reverse() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
