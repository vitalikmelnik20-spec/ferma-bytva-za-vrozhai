const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const QUEST_TYPES = [
  { type: 'battles', task: 'Виграти 5 PvP боїв',         target: 5,   rewardGreen: 500, rewardExp: 50,  rewardGold: 0  },
  { type: 'harvest', task: 'Зібрати врожай 3 рази',       target: 3,   rewardGreen: 400, rewardExp: 30,  rewardGold: 0  },
  { type: 'mines',   task: 'Добути золото з 10 шахт',     target: 10,  rewardGreen: 300, rewardExp: 0,   rewardGold: 50 },
  { type: 'clan',    task: 'Внести 100 зелені до скарбниці', target: 100, rewardGreen: 250, rewardExp: 0, rewardGold: 0, rewardGlory: 10 },
];

const WHEEL_SECTORS = [
  { type: 'greens',  label: '300–1000 зелені',          chance: 35 },
  { type: 'gold',    label: '50–200 золота',            chance: 25 },
  { type: 'potion',  label: 'Випадкове зілля',          chance: 20 },
  { type: 'item',    label: 'Предмет рів.1–20',         chance: 10 },
  { type: 'diamond', label: '5–15 алмазів',             chance:  7 },
  { type: 'rare',    label: 'Рідкісний предмет',        chance:  3 },
];

function getTodayEventType() {
  const day = new Date().getDay(); // 0=Sun
  if (day === 1 || day === 4) return 'quest';
  if (day === 2 || day === 5) return 'tournament';
  return 'wheel';
}

async function getOrCreateTodayEvent() {
  const { rows: [ev] } = await pool.query(
    `SELECT * FROM daily_events WHERE event_date = CURRENT_DATE`
  );
  if (ev) return ev;

  const type = getTodayEventType();
  let details = {};

  if (type === 'quest') {
    details = QUEST_TYPES[Math.floor(Math.random() * QUEST_TYPES.length)];
  } else if (type === 'tournament') {
    details = { maxFights: 5, description: 'Щоденний турнір — 5 боїв, хто більше виграє отримує нагороду' };
  } else {
    details = { sectors: WHEEL_SECTORS };
  }

  const { rows: [created] } = await pool.query(
    `INSERT INTO daily_events (event_date, event_type, details)
     VALUES (CURRENT_DATE, $1, $2) RETURNING *`,
    [type, JSON.stringify(details)]
  );
  return created;
}

// Export for use in other routes
async function updateDailyQuestProgress(playerId, actionType, amount = 1) {
  try {
    const ev = await getOrCreateTodayEvent();
    if (ev.event_type !== 'quest') return;
    const q = ev.details;
    if (q.type !== actionType) return;

    await pool.query(
      `INSERT INTO daily_event_progress (player_id, event_id, progress)
       VALUES ($1, $2, $3)
       ON CONFLICT (player_id, event_id) DO UPDATE SET
         progress     = LEAST(daily_event_progress.progress + $3, $4),
         is_completed = (daily_event_progress.progress + $3) >= $4`,
      [playerId, ev.id, amount, q.target]
    );
  } catch (err) { console.error('[DailyQuest]', err.message); }
}

// GET /api/daily/today
router.get('/today', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    const { rows: [progress] } = await pool.query(
      `SELECT * FROM daily_event_progress WHERE player_id=$1 AND event_id=$2`,
      [req.session.playerId, ev.id]
    );

    let wheelSpunToday = false;
    if (ev.event_type === 'wheel') {
      const { rows: [spin] } = await pool.query(
        `SELECT id FROM wheel_spins WHERE player_id=$1 AND DATE(spun_at)=CURRENT_DATE`,
        [req.session.playerId]
      );
      wheelSpunToday = !!spin;
    }

    res.json({ event: ev, progress: progress || null, wheelSpunToday });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// GET /api/daily/progress
router.get('/progress', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    const { rows: [progress] } = await pool.query(
      `SELECT * FROM daily_event_progress WHERE player_id=$1 AND event_id=$2`,
      [req.session.playerId, ev.id]
    );
    res.json({ event: ev, progress: progress || null });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/daily/spin
router.post('/spin', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    if (ev.event_type !== 'wheel') return res.status(400).json({ error: 'Сьогодні не день колеса' });

    const { rows: [existing] } = await pool.query(
      `SELECT id FROM wheel_spins WHERE player_id=$1 AND DATE(spun_at)=CURRENT_DATE`,
      [req.session.playerId]
    );
    if (existing) return res.status(400).json({ error: 'Сьогодні ти вже крутив колесо!' });

    // Roll sector by weight
    const roll = Math.random() * 100;
    let cumulative = 0, sector = WHEEL_SECTORS[0];
    for (const s of WHEEL_SECTORS) {
      cumulative += s.chance;
      if (roll < cumulative) { sector = s; break; }
    }

    let prizeAmount = 0, prizeLabel = sector.label, itemName = null;

    if (sector.type === 'greens') {
      prizeAmount = 300 + Math.floor(Math.random() * 701);
      await pool.query(`UPDATE players SET greens=greens+$1 WHERE id=$2`, [prizeAmount, req.session.playerId]);
      prizeLabel = `${prizeAmount} зелені`;
    } else if (sector.type === 'gold') {
      prizeAmount = 50 + Math.floor(Math.random() * 151);
      await pool.query(`UPDATE players SET gold=gold+$1 WHERE id=$2`, [prizeAmount, req.session.playerId]);
      prizeLabel = `${prizeAmount} золота`;
    } else if (sector.type === 'diamond') {
      prizeAmount = 5 + Math.floor(Math.random() * 11);
      await pool.query(`UPDATE players SET diamonds=COALESCE(diamonds,0)+$1 WHERE id=$2`, [prizeAmount, req.session.playerId]);
      prizeLabel = `${prizeAmount} алмазів`;
    } else if (sector.type === 'potion') {
      const { rows: [item] } = await pool.query(
        `SELECT id, name FROM items WHERE category='potion' AND is_active=true ORDER BY RANDOM() LIMIT 1`
      );
      if (item) {
        await pool.query(`INSERT INTO inventory (player_id, item_id) VALUES ($1,$2)`, [req.session.playerId, item.id]);
        itemName = item.name;
        prizeLabel = `Зілля: ${item.name}`;
      }
    } else if (sector.type === 'item') {
      const { rows: [item] } = await pool.query(
        `SELECT id, name FROM items WHERE min_level BETWEEN 1 AND 20 AND is_active=true ORDER BY RANDOM() LIMIT 1`
      );
      if (item) {
        await pool.query(`INSERT INTO inventory (player_id, item_id) VALUES ($1,$2)`, [req.session.playerId, item.id]);
        itemName = item.name;
        prizeLabel = `Предмет: ${item.name}`;
      }
    } else if (sector.type === 'rare') {
      const { rows: [item] } = await pool.query(
        `SELECT id, name FROM items WHERE min_level >= 30 AND is_active=true ORDER BY RANDOM() LIMIT 1`
      );
      if (item) {
        await pool.query(`INSERT INTO inventory (player_id, item_id) VALUES ($1,$2)`, [req.session.playerId, item.id]);
        itemName = item.name;
        prizeLabel = `Рідкісний: ${item.name}`;
      } else {
        // Fallback if no high-level items
        prizeAmount = 500;
        await pool.query(`UPDATE players SET greens=greens+$1 WHERE id=$2`, [prizeAmount, req.session.playerId]);
        prizeLabel = `${prizeAmount} зелені`;
        sector = { type: 'greens' };
      }
    }

    await pool.query(
      `INSERT INTO wheel_spins (player_id, prize_type, prize_amount, prize_label) VALUES ($1,$2,$3,$4)`,
      [req.session.playerId, sector.type, prizeAmount, prizeLabel]
    );

    res.json({ sectorType: sector.type, prizeLabel, prizeAmount, itemName });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/daily/claim — claim quest reward
router.post('/claim', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    if (ev.event_type !== 'quest') return res.status(400).json({ error: 'Сьогодні не день квесту' });

    const { rows: [prog] } = await pool.query(
      `SELECT * FROM daily_event_progress WHERE player_id=$1 AND event_id=$2`,
      [req.session.playerId, ev.id]
    );
    if (!prog?.is_completed)   return res.status(400).json({ error: 'Квест не виконано' });
    if (prog.reward_claimed)   return res.status(400).json({ error: 'Нагороду вже забрано' });

    const q = ev.details;
    await pool.query(
      `UPDATE players SET greens=greens+$1, experience=experience+$2, gold=gold+$3 WHERE id=$4`,
      [q.rewardGreen || 0, q.rewardExp || 0, q.rewardGold || 0, req.session.playerId]
    );
    if ((q.rewardGlory || 0) > 0) {
      await pool.query(
        `UPDATE players SET glory=glory+$1,
           glory_day=COALESCE(glory_day,0)+$1, glory_week=COALESCE(glory_week,0)+$1
         WHERE id=$2`,
        [q.rewardGlory, req.session.playerId]
      );
    }
    // Random item bonus
    const { rows: [rndItem] } = await pool.query(
      `SELECT id FROM items WHERE is_active=true ORDER BY RANDOM() LIMIT 1`
    );
    if (rndItem) await pool.query(`INSERT INTO inventory (player_id, item_id) VALUES ($1,$2)`, [req.session.playerId, rndItem.id]);

    await pool.query(`UPDATE daily_event_progress SET reward_claimed=true WHERE id=$1`, [prog.id]);

    res.json({ success: true, rewardGreen: q.rewardGreen, rewardExp: q.rewardExp, rewardGold: q.rewardGold, rewardGlory: q.rewardGlory });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/daily/tournament/fight
router.post('/tournament/fight', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    if (ev.event_type !== 'tournament') return res.status(400).json({ error: 'Сьогодні не день турніру' });

    const maxFights = ev.details.maxFights || 5;

    let prog = null;
    { const { rows: [p] } = await pool.query(
        `SELECT * FROM daily_event_progress WHERE player_id=$1 AND event_id=$2`,
        [req.session.playerId, ev.id]
      );
      prog = p;
    }
    const fightsTotal = prog ? (prog.progress + (prog.is_completed ? 0 : 0)) : 0;
    // progress stores wins, use a separate field via JSONB extension not available — use progress*2 trick:
    // Actually: store total fights in a different way.
    // Let's store progress as wins and track fights_done separately via a field we'll embed in is_completed logic.
    // Simple approach: progress = fights_done * 10 + wins (decode: wins = progress % 10, fights = floor(progress / 10))
    const fightsDone = prog ? Math.floor(prog.progress / 10) : 0;
    const wins       = prog ? (prog.progress % 10)           : 0;

    if (fightsDone >= maxFights) return res.status(400).json({ error: 'Усі турнірні бої завершено' });

    // Pick opponent of similar level
    const { rows: [me] } = await pool.query(
      `SELECT p.level, t.power_level, t.endurance_level, t.speed_level FROM players p
       LEFT JOIN training t ON t.player_id=p.id WHERE p.id=$1`,
      [req.session.playerId]
    );
    const { rows: opponents } = await pool.query(
      `SELECT p.username, t.power_level, t.endurance_level FROM players p
       LEFT JOIN training t ON t.player_id=p.id
       WHERE p.id != $1 AND ABS(p.level - $2) <= 5 AND p.is_banned=false
       ORDER BY RANDOM() LIMIT 5`,
      [req.session.playerId, me.level]
    );
    const opp = opponents[Math.floor(Math.random() * Math.max(1, opponents.length))] || { username: 'Тренувальний противник', power_level: me.power_level, endurance_level: me.endurance_level };

    // Simulate fight: compare stats with random factor
    const myScore  = (me.power_level || 1) + (me.speed_level || 1) * 0.5 + Math.random() * 10;
    const oppScore = (opp.power_level || 1) + Math.random() * 10;
    const won = myScore > oppScore;

    const newFights = fightsDone + 1;
    const newWins   = wins + (won ? 1 : 0);
    const newProgress = newFights * 10 + newWins;
    const isCompleted = newFights >= maxFights;

    await pool.query(
      `INSERT INTO daily_event_progress (player_id, event_id, progress, is_completed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (player_id, event_id) DO UPDATE SET
         progress     = $3,
         is_completed = $4`,
      [req.session.playerId, ev.id, newProgress, isCompleted]
    );

    res.json({ won, opponentName: opp.username, fightsDone: newFights, wins: newWins, maxFights, isCompleted });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/daily/tournament/claim
router.post('/tournament/claim', async (req, res) => {
  try {
    const ev = await getOrCreateTodayEvent();
    if (ev.event_type !== 'tournament') return res.status(400).json({ error: 'Сьогодні не день турніру' });

    const { rows: [prog] } = await pool.query(
      `SELECT * FROM daily_event_progress WHERE player_id=$1 AND event_id=$2`,
      [req.session.playerId, ev.id]
    );
    if (!prog?.is_completed)  return res.status(400).json({ error: 'Спочатку завершіть всі бої' });
    if (prog.reward_claimed)  return res.status(400).json({ error: 'Нагороду вже забрано' });

    const wins = prog.progress % 10;
    let rewardGreen = 50, rewardGlory = 0, rank = 'Решта';
    if (wins >= 5)      { rewardGreen = 500; rewardGlory = 5; rank = '1 місце'; }
    else if (wins >= 3) { rewardGreen = 200; rank = '2–3 місце'; }

    await pool.query(
      `UPDATE players SET greens=greens+$1, glory=glory+$2,
         glory_day=COALESCE(glory_day,0)+$2, glory_week=COALESCE(glory_week,0)+$2
       WHERE id=$3`,
      [rewardGreen, rewardGlory, req.session.playerId]
    );
    await pool.query(`UPDATE daily_event_progress SET reward_claimed=true WHERE id=$1`, [prog.id]);

    res.json({ success: true, wins, rank, rewardGreen, rewardGlory });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

module.exports = router;
module.exports.updateDailyQuestProgress = updateDailyQuestProgress;
module.exports.getOrCreateTodayEvent    = getOrCreateTodayEvent;
