const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

function randomGold() {
  const r = Math.floor(Math.random() * 100) + 1;
  if (r <= 40) return 1;
  if (r <= 70) return 2;
  if (r <= 85) return 3;
  if (r <= 95) return 4;
  return 5;
}

async function finalizeCavesSession(session) {
  await pool.query(
    `INSERT INTO caves_stats (player_id, total_sessions, total_mines_done, total_gold)
     VALUES ($1, 1, $2, $3)
     ON CONFLICT (player_id) DO UPDATE SET
       total_sessions   = caves_stats.total_sessions + 1,
       total_mines_done = caves_stats.total_mines_done + $2,
       total_gold       = caves_stats.total_gold + $3`,
    [session.player_id, session.mines_done, session.gold_earned]
  );
}

// GET /api/caves/today — get today's session or null
router.get('/today', async (req, res) => {
  try {
    const { rows: [session] } = await pool.query(
      `SELECT * FROM caves WHERE player_id=$1 AND created_at::date = NOW()::date`,
      [req.session.playerId]
    );
    res.json({ session: session || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/caves/start — create or return today's session
router.post('/start', async (req, res) => {
  try {
    const { rows: [existing] } = await pool.query(
      `SELECT * FROM caves WHERE player_id=$1 AND created_at::date = NOW()::date`,
      [req.session.playerId]
    );
    if (existing) return res.json({ session: existing });

    const total_mines = Math.floor(Math.random() * 31) + 10; // 10–40
    const now = new Date();
    const mine_expires_at = new Date(now.getTime() + 120 * 1000);

    const { rows: [session] } = await pool.query(
      `INSERT INTO caves (player_id, total_mines, current_mine, mine_appears_at, mine_expires_at, is_active)
       VALUES ($1, $2, 1, $3, $4, true) RETURNING *`,
      [req.session.playerId, total_mines, now, mine_expires_at]
    );
    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/caves/status — current state + auto-transitions
router.get('/status', async (req, res) => {
  try {
    let { rows: [session] } = await pool.query(
      `SELECT * FROM caves WHERE player_id=$1 AND created_at::date = NOW()::date`,
      [req.session.playerId]
    );
    if (!session) return res.status(404).json({ error: 'Сесія не знайдена' });
    if (session.session_done) return res.json({ session });

    const now = new Date();

    // Waiting → Active: mine appeared
    if (!session.is_active && new Date(session.mine_appears_at) <= now) {
      const { rows: [u] } = await pool.query(
        'UPDATE caves SET is_active=true WHERE id=$1 RETURNING *', [session.id]
      );
      session = u;
    }

    // Active → Missed: mine expired
    if (session.is_active && new Date(session.mine_expires_at) <= now) {
      if (session.current_mine >= session.total_mines) {
        // Last mine missed → session done
        const { rows: [u] } = await pool.query(
          `UPDATE caves SET mines_missed=mines_missed+1, is_active=false, session_done=true WHERE id=$1 RETURNING *`,
          [session.id]
        );
        session = u;
        await finalizeCavesSession(session);
      } else {
        const nextInterval = Math.floor(Math.random() * 121) + 60;
        const nextAppears  = new Date(now.getTime() + nextInterval * 1000);
        const nextExpires  = new Date(nextAppears.getTime() + 120 * 1000);
        const { rows: [u] } = await pool.query(
          `UPDATE caves SET mines_missed=mines_missed+1, is_active=false,
           current_mine=current_mine+1, mine_appears_at=$2, mine_expires_at=$3
           WHERE id=$1 RETURNING *`,
          [session.id, nextAppears, nextExpires]
        );
        session = u;
      }
    }

    res.json({ session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/caves/mine — mine current shaft
router.post('/mine', async (req, res) => {
  try {
    let { rows: [session] } = await pool.query(
      `SELECT * FROM caves WHERE player_id=$1 AND created_at::date = NOW()::date`,
      [req.session.playerId]
    );
    if (!session)            return res.status(404).json({ error: 'Сесія не знайдена' });
    if (session.session_done) return res.status(400).json({ error: 'Сесія завершена' });
    if (!session.is_active)   return res.status(400).json({ error: 'Шахта не активна' });

    const now = new Date();
    if (now > new Date(session.mine_expires_at))
      return res.status(400).json({ error: 'Шахта вже зникла' });

    const baseGold = randomGold();
    const exp  = 5;

    // Talisman of the Gold Seeker bonus
    const { rows: [talisman] } = await pool.query(
      `SELECT tu.bonus_pct FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id
       WHERE inv.player_id=$1 AND inv.is_equipped=true`,
      [req.session.playerId]
    );
    const talismanBonus = talisman ? Math.floor(baseGold * talisman.bonus_pct / 100) : 0;
    const gold = baseGold + talismanBonus;

    // Level-up check
    const { rows: [player] } = await pool.query(
      'SELECT level, experience, exp_to_next FROM players WHERE id=$1',
      [req.session.playerId]
    );
    let newExp      = player.experience + exp;
    let newLevel    = player.level;
    let newExpToNext = player.exp_to_next;
    let levelUp     = false;
    let goldBonus   = 0;
    while (newExp >= newExpToNext) {
      newExp -= newExpToNext;
      newLevel++;
      newExpToNext = Math.floor(newExpToNext * 1.5);
      levelUp  = true;
      goldBonus += newLevel * 5;
    }

    await pool.query(
      `UPDATE players SET gold=gold+$1, experience=$2, exp_to_next=$3, level=$4, max_hp=max_hp+$5 WHERE id=$6`,
      [gold + goldBonus, newExp, newExpToNext, newLevel, levelUp ? 100 : 0, req.session.playerId]
    );

    let updatedSession;
    if (session.current_mine >= session.total_mines) {
      // Last mine — session done
      const { rows: [u] } = await pool.query(
        `UPDATE caves SET mines_done=mines_done+1, gold_earned=gold_earned+$1, exp_earned=exp_earned+$2,
         is_active=false, session_done=true WHERE id=$3 RETURNING *`,
        [gold, exp, session.id]
      );
      updatedSession = u;
      await finalizeCavesSession(updatedSession);
    } else {
      const nextInterval = Math.floor(Math.random() * 121) + 60;
      const nextAppears  = new Date(now.getTime() + nextInterval * 1000);
      const nextExpires  = new Date(nextAppears.getTime() + 120 * 1000);
      const { rows: [u] } = await pool.query(
        `UPDATE caves SET mines_done=mines_done+1, gold_earned=gold_earned+$1, exp_earned=exp_earned+$2,
         is_active=false, current_mine=current_mine+1, mine_appears_at=$3, mine_expires_at=$4
         WHERE id=$5 RETURNING *`,
        [gold, exp, nextAppears, nextExpires, session.id]
      );
      updatedSession = u;
    }

    res.json({ gold, baseGold, talismanBonus, exp, levelUp, newLevel, goldBonus, newExpToNext, session: updatedSession });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
