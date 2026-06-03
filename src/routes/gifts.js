const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const GIFT_TYPES = {
  power_statue:    { cost: 50,  stat: 'power_level',     field: 'power_bonus',     name: 'Статуетка мощі',      minLevel: 1,  harvestBonus: 0,  isLuck: false },
  endurance_seal:  { cost: 50,  stat: 'endurance_level', field: 'endurance_bonus', name: 'Печать стійкості',    minLevel: 1,  harvestBonus: 0,  isLuck: false },
  accuracy_scroll: { cost: 50,  stat: 'accuracy_level',  field: 'accuracy_bonus',  name: 'Манускрипт точності', minLevel: 3,  harvestBonus: 0,  isLuck: false },
  speed_flask:     { cost: 50,  stat: 'speed_level',     field: 'speed_bonus',     name: 'Флакон швидкості',    minLevel: 3,  harvestBonus: 0,  isLuck: false },
  harvest_idol:    { cost: 80,  stat: null,              field: null,              name: 'Ідол врожаю',         minLevel: 5,  harvestBonus: 15, isLuck: false },
  luck_amulet:     { cost: 150, stat: null,              field: null,              name: 'Амулет удачі',        minLevel: 10, harvestBonus: 0,  isLuck: true  },
};

router.post('/send', async (req, res) => {
  const { friendId, giftType } = req.body;
  const gift = GIFT_TYPES[giftType];
  if (!gift) return res.status(400).json({ error: 'Невідомий тип подарунку' });

  try {
    // Fetch sender's greens, level, username AND full stat (training + equipment)
    const { rows: [sender] } = await pool.query(
      `SELECT p.greens, p.level, p.username,
              COALESCE(t.power_level,    0) + COALESCE(SUM(CASE WHEN i.is_equipped THEN it.power_bonus     ELSE 0 END),0) AS total_power,
              COALESCE(t.endurance_level,0) + COALESCE(SUM(CASE WHEN i.is_equipped THEN it.endurance_bonus ELSE 0 END),0) AS total_endurance,
              COALESCE(t.speed_level,    0) + COALESCE(SUM(CASE WHEN i.is_equipped THEN it.speed_bonus     ELSE 0 END),0) AS total_speed,
              COALESCE(t.accuracy_level, 0) + COALESCE(SUM(CASE WHEN i.is_equipped THEN it.accuracy_bonus  ELSE 0 END),0) AS total_accuracy
       FROM players p
       LEFT JOIN training t  ON t.player_id = p.id
       LEFT JOIN inventory i ON i.player_id = p.id
       LEFT JOIN items it    ON it.id = i.item_id
       WHERE p.id=$1
       GROUP BY p.id, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level`,
      [req.session.playerId]
    );
    if (sender.level < gift.minLevel)
      return res.status(400).json({ error: `Потрібен рівень ${gift.minLevel}` });
    if (sender.greens < gift.cost)
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${gift.cost}` });

    const { rows: [friendship] } = await pool.query(
      `SELECT id FROM friends
       WHERE status='accepted'
         AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))`,
      [req.session.playerId, friendId]
    );
    if (!friendship) return res.status(403).json({ error: 'Цей гравець не є вашим другом' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { rows: alreadySent } = await pool.query(
      `SELECT id FROM active_gifts
       WHERE giver_id=$1 AND receiver_id=$2 AND created_at >= $3`,
      [req.session.playerId, friendId, today]
    );
    if (alreadySent.length > 0)
      return res.status(400).json({ error: 'Ви вже надіслали подарунок цьому другу сьогодні' });

    // 10% of sender's total stat (training + equipment)
    const statToTotal = {
      power_level:     'total_power',
      endurance_level: 'total_endurance',
      speed_level:     'total_speed',
      accuracy_level:  'total_accuracy',
    };
    const bonus = gift.stat ? Math.max(1, Math.floor(sender[statToTotal[gift.stat]] * 0.1)) : 0;
    const expiresAt = new Date(Date.now() + 24 * 3600000);

    const bonusFields = {
      power_bonus:    gift.field === 'power_bonus'    ? bonus : 0,
      endurance_bonus: gift.field === 'endurance_bonus' ? bonus : 0,
      speed_bonus:    gift.field === 'speed_bonus'    ? bonus : 0,
      accuracy_bonus: gift.field === 'accuracy_bonus' ? bonus : 0,
      harvest_bonus:  gift.harvestBonus,
      is_luck_amulet: gift.isLuck,
    };

    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [gift.cost, req.session.playerId]);

    const { rows: [newGift] } = await pool.query(
      `INSERT INTO active_gifts
         (giver_id, receiver_id, gift_name, power_bonus, endurance_bonus, speed_bonus, accuracy_bonus,
          harvest_bonus, is_luck_amulet, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.session.playerId, friendId, gift.name,
       bonusFields.power_bonus, bonusFields.endurance_bonus,
       bonusFields.speed_bonus, bonusFields.accuracy_bonus,
       bonusFields.harvest_bonus, bonusFields.is_luck_amulet, expiresAt]
    );

    const io = req.app.locals.io;
    if (io) {
      io.to(String(friendId)).emit('gift:received', {
        giftId: newGift.id,
        giftName: gift.name,
        fromUsername: sender.username,
        ...bonusFields,
        expiresAt,
      });
    }

    const writeEvent = require('../helpers/writeEvent');
    await writeEvent(friendId, {
      event_type: 'gift_received',
      title: `${sender.username} подарував тобі ${gift.name}`,
      body: `Подарунок активний 48 годин`,
      icon: '🎁', color: 'blue',
    }, io);

    res.json({ success: true, giftId: newGift.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ag.*, p.username as giver_username
       FROM active_gifts ag
       JOIN players p ON p.id = ag.giver_id
       WHERE ag.receiver_id=$1 AND ag.expires_at > NOW()
       ORDER BY ag.created_at DESC`,
      [req.session.playerId]
    );
    res.json({ gifts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { rows } = await pool.query(
      `SELECT ag.*, p.username as receiver_username
       FROM active_gifts ag
       JOIN players p ON p.id = ag.receiver_id
       WHERE ag.giver_id=$1 AND ag.created_at >= $2
       ORDER BY ag.created_at DESC`,
      [req.session.playerId, today]
    );
    res.json({ gifts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.delete('/:giftId', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM active_gifts WHERE id=$1 AND receiver_id=$2',
      [req.params.giftId, req.session.playerId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Подарунок не знайдено' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
