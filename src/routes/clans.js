const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const BUILDING_COSTS = {
  farm:    { costs: [500, 1000, 2000, 3500, 5000], currency: 'greens' },
  smithy:  { costs: [300,  600, 1200, 2000, 3000], currency: 'gold'   },
  tower:   { costs: [300,  600, 1200, 2000, 3000], currency: 'gold'   },
  academy: { costs: [400,  800, 1600, 2800, 4000], currency: 'greens' },
  mine:    { costs: [200,  400,  800, 1400, 2000], currency: 'gold'   },
  hall:    { costs: [1000, 3000, 5000],             currency: 'greens' },
};

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.tag, c.faction, c.rating_points,
              COUNT(cm.player_id)::int as member_count
       FROM clans c
       LEFT JOIN clan_members cm ON cm.clan_id = c.id
       GROUP BY c.id
       ORDER BY c.rating_points DESC`
    );
    res.json({ clans: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/create', async (req, res) => {
  const { name, tag, description } = req.body;
  if (!name || name.length < 3 || name.length > 30)
    return res.status(400).json({ error: 'Назва клану: від 3 до 30 символів' });
  if (!tag || tag.length !== 3)
    return res.status(400).json({ error: 'Тег клану — рівно 3 символи' });

  try {
    const { rows: [player] } = await pool.query(
      'SELECT greens, faction FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.greens < 1000)
      return res.status(400).json({ error: 'Потрібно 1000 зелені для створення клану' });

    const { rows: inClan } = await pool.query(
      'SELECT id FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (inClan.length > 0)
      return res.status(400).json({ error: 'Ви вже в клані' });

    await pool.query('UPDATE players SET greens = greens - 1000 WHERE id=$1', [req.session.playerId]);

    const { rows: [clan] } = await pool.query(
      `INSERT INTO clans (name, tag, description, leader_id, faction)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, tag, description?.slice(0, 500) || '', req.session.playerId, player.faction]
    );

    await pool.query(
      'INSERT INTO clan_members (clan_id, player_id, role) VALUES ($1,$2,$3)',
      [clan.id, req.session.playerId, 'leader']
    );

    res.json({ success: true, clanId: clan.id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Назва або тег клану вже зайняті' });
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(404).json({ error: 'Ви не в клані' });

    const { rows: [clan] } = await pool.query(
      'SELECT * FROM clans WHERE id=$1',
      [membership.clan_id]
    );

    const { rows: members } = await pool.query(
      `SELECT cm.role, p.id, p.username, p.level, p.glory, p.is_online, p.faction
       FROM clan_members cm JOIN players p ON p.id = cm.player_id
       WHERE cm.clan_id=$1
       ORDER BY CASE cm.role WHEN 'leader' THEN 0 WHEN 'senior' THEN 1 WHEN 'officer' THEN 2 ELSE 3 END, p.level DESC`,
      [membership.clan_id]
    );

    const { rows: buildings } = await pool.query(
      'SELECT * FROM clan_buildings WHERE clan_id=$1',
      [membership.clan_id]
    );

    const { rows: [treasury] } = await pool.query(
      'SELECT treasury_greens, treasury_gold FROM clans WHERE id=$1',
      [membership.clan_id]
    );

    res.json({ clan, members, buildings, treasury, myRole: membership.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/rating', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.tag, c.faction, c.rating_points,
              COUNT(cm.player_id)::int as member_count
       FROM clans c
       LEFT JOIN clan_members cm ON cm.clan_id = c.id
       GROUP BY c.id
       ORDER BY c.rating_points DESC
       LIMIT 50`
    );
    res.json({ clans: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/buildings', async (req, res) => {
  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(404).json({ error: 'Ви не в клані' });

    const { rows: buildings } = await pool.query(
      'SELECT * FROM clan_buildings WHERE clan_id=$1',
      [membership.clan_id]
    );
    res.json({ buildings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/buildings/upgrade', async (req, res) => {
  const { buildingKey } = req.body;
  if (!BUILDING_COSTS[buildingKey])
    return res.status(400).json({ error: 'Невідома будівля' });

  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(403).json({ error: 'Ви не в клані' });
    if (!['leader', 'senior'].includes(membership.role))
      return res.status(403).json({ error: 'Недостатньо прав' });

    const { costs, currency } = BUILDING_COSTS[buildingKey];

    const { rows: [existing] } = await pool.query(
      'SELECT level FROM clan_buildings WHERE clan_id=$1 AND building_key=$2',
      [membership.clan_id, buildingKey]
    );

    const currentLevel = existing ? existing.level : 0;
    if (currentLevel >= costs.length)
      return res.status(400).json({ error: 'Максимальний рівень будівлі досягнуто' });

    const cost = costs[currentLevel];
    const treasuryField = currency === 'greens' ? 'treasury_greens' : 'treasury_gold';

    const { rows: [clan] } = await pool.query(
      `SELECT ${treasuryField} as balance FROM clans WHERE id=$1`,
      [membership.clan_id]
    );
    if (clan.balance < cost)
      return res.status(400).json({ error: `Недостатньо ${currency === 'greens' ? 'зелені' : 'золота'} в скарбниці. Потрібно: ${cost}` });

    await pool.query(
      `UPDATE clans SET ${treasuryField} = ${treasuryField} - $1 WHERE id=$2`,
      [cost, membership.clan_id]
    );

    if (existing) {
      await pool.query(
        'UPDATE clan_buildings SET level = level + 1 WHERE clan_id=$1 AND building_key=$2',
        [membership.clan_id, buildingKey]
      );
    } else {
      await pool.query(
        'INSERT INTO clan_buildings (clan_id, building_key, level) VALUES ($1,$2,1)',
        [membership.clan_id, buildingKey]
      );
    }

    res.json({ success: true, newLevel: currentLevel + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [clan] } = await pool.query('SELECT * FROM clans WHERE id=$1', [req.params.id]);
    if (!clan) return res.status(404).json({ error: 'Клан не знайдено' });

    const { rows: members } = await pool.query(
      `SELECT cm.role, p.id, p.username, p.level, p.glory, p.is_online, p.faction
       FROM clan_members cm JOIN players p ON p.id = cm.player_id
       WHERE cm.clan_id=$1
       ORDER BY CASE cm.role WHEN 'leader' THEN 0 WHEN 'senior' THEN 1 WHEN 'officer' THEN 2 ELSE 3 END, p.level DESC`,
      [req.params.id]
    );

    const { rows: buildings } = await pool.query(
      'SELECT * FROM clan_buildings WHERE clan_id=$1',
      [req.params.id]
    );

    res.json({ clan: { ...clan, treasury_greens: undefined, treasury_gold: undefined }, members, buildings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/join/:id', async (req, res) => {
  try {
    const { rows: inClan } = await pool.query(
      'SELECT id FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (inClan.length > 0) return res.status(400).json({ error: 'Ви вже в клані' });

    const { rows: [clan] } = await pool.query(
      'SELECT id, mode FROM clans WHERE id=$1',
      [req.params.id]
    );
    if (!clan) return res.status(404).json({ error: 'Клан не знайдено' });
    if (clan.mode !== 'open') return res.status(400).json({ error: 'Клан не приймає нових учасників' });

    await pool.query(
      'INSERT INTO clan_members (clan_id, player_id, role) VALUES ($1,$2,$3)',
      [req.params.id, req.session.playerId, 'member']
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/leave', async (req, res) => {
  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(404).json({ error: 'Ви не в клані' });
    if (membership.role === 'leader')
      return res.status(400).json({ error: 'Лідер не може покинути клан. Спочатку розпустіть клан.' });

    await pool.query(
      'DELETE FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/kick/:memberId', async (req, res) => {
  try {
    const { rows: [me] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!me) return res.status(403).json({ error: 'Ви не в клані' });
    if (!['leader', 'senior'].includes(me.role))
      return res.status(403).json({ error: 'Недостатньо прав' });

    const { rows: [target] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.params.memberId]
    );
    if (!target || target.clan_id !== me.clan_id)
      return res.status(404).json({ error: 'Учасника не знайдено' });
    if (target.role === 'leader')
      return res.status(400).json({ error: 'Не можна вигнати лідера' });

    await pool.query(
      'DELETE FROM clan_members WHERE player_id=$1 AND clan_id=$2',
      [req.params.memberId, me.clan_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/promote/:memberId', async (req, res) => {
  try {
    const { rows: [me] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!me || me.role !== 'leader') return res.status(403).json({ error: 'Тільки лідер може підвищувати' });

    const { rows: [target] } = await pool.query(
      'SELECT role FROM clan_members WHERE player_id=$1 AND clan_id=$2',
      [req.params.memberId, me.clan_id]
    );
    if (!target) return res.status(404).json({ error: 'Учасника не знайдено' });

    const nextRole = target.role === 'member' ? 'officer' : target.role === 'officer' ? 'senior' : null;
    if (!nextRole) return res.status(400).json({ error: 'Неможливо підвищити далі' });

    await pool.query(
      'UPDATE clan_members SET role=$1 WHERE player_id=$2 AND clan_id=$3',
      [nextRole, req.params.memberId, me.clan_id]
    );
    res.json({ success: true, newRole: nextRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/demote/:memberId', async (req, res) => {
  try {
    const { rows: [me] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!me || me.role !== 'leader') return res.status(403).json({ error: 'Тільки лідер може понижувати' });

    const { rows: [target] } = await pool.query(
      'SELECT role FROM clan_members WHERE player_id=$1 AND clan_id=$2',
      [req.params.memberId, me.clan_id]
    );
    if (!target) return res.status(404).json({ error: 'Учасника не знайдено' });

    const prevRole = target.role === 'senior' ? 'officer' : target.role === 'officer' ? 'member' : null;
    if (!prevRole) return res.status(400).json({ error: 'Неможливо понизити далі' });

    await pool.query(
      'UPDATE clan_members SET role=$1 WHERE player_id=$2 AND clan_id=$3',
      [prevRole, req.params.memberId, me.clan_id]
    );
    res.json({ success: true, newRole: prevRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/dissolve', async (req, res) => {
  try {
    const { rows: [me] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!me || me.role !== 'leader') return res.status(403).json({ error: 'Тільки лідер може розпустити клан' });

    await pool.query('DELETE FROM clans WHERE id=$1', [me.clan_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/treasury/deposit', async (req, res) => {
  const { amount, currency } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Невірна сума' });
  if (!['greens', 'gold'].includes(currency)) return res.status(400).json({ error: 'Невірна валюта' });

  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(403).json({ error: 'Ви не в клані' });

    const playerField = currency;
    const { rows: [player] } = await pool.query(
      `SELECT ${playerField} FROM players WHERE id=$1`,
      [req.session.playerId]
    );
    if (player[playerField] < amount)
      return res.status(400).json({ error: `Недостатньо ${currency === 'greens' ? 'зелені' : 'золота'}` });

    const treasuryField = currency === 'greens' ? 'treasury_greens' : 'treasury_gold';

    await pool.query(`UPDATE players SET ${playerField} = ${playerField} - $1 WHERE id=$2`, [amount, req.session.playerId]);
    await pool.query(`UPDATE clans SET ${treasuryField} = ${treasuryField} + $1 WHERE id=$2`, [amount, membership.clan_id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/treasury/withdraw', async (req, res) => {
  const { amount, currency } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Невірна сума' });
  if (!['greens', 'gold'].includes(currency)) return res.status(400).json({ error: 'Невірна валюта' });

  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id, role FROM clan_members WHERE player_id=$1',
      [req.session.playerId]
    );
    if (!membership) return res.status(403).json({ error: 'Ви не в клані' });
    if (!['leader', 'senior'].includes(membership.role))
      return res.status(403).json({ error: 'Недостатньо прав' });

    const treasuryField = currency === 'greens' ? 'treasury_greens' : 'treasury_gold';
    const { rows: [clan] } = await pool.query(
      `SELECT ${treasuryField} as balance FROM clans WHERE id=$1`,
      [membership.clan_id]
    );
    if (clan.balance < amount)
      return res.status(400).json({ error: `Недостатньо коштів у скарбниці` });

    const playerField = currency;
    await pool.query(`UPDATE clans SET ${treasuryField} = ${treasuryField} - $1 WHERE id=$2`, [amount, membership.clan_id]);
    await pool.query(`UPDATE players SET ${playerField} = ${playerField} + $1 WHERE id=$2`, [amount, req.session.playerId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
