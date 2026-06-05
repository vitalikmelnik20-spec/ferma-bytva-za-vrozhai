const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { getClanBonuses } = require('../utils/clanBonuses');
const { updateClanTask } = require('../utils/clanTasks');
const { calcMaxHp, calcHpRegen } = require('../helpers/calcMaxHp');

router.use(requireAuth);

// TZ v3 weight table: avg ~9.75 gold per mine
function randomGold() {
  const r = Math.floor(Math.random() * 100) + 1;
  if (r <= 30) return 5;
  if (r <= 55) return 8;
  if (r <= 75) return 10;
  if (r <= 90) return 15;
  return 20;
}

// Rare ingredient drops per mine
const RARE_DROPS = [
  { name: 'Кристал печери',   emoji: '',    chance: 3.0 },
  { name: 'Чорний кремінь',   emoji: '',    chance: 2.0 },
  { name: 'Рудний самородок', emoji: '',    chance: 1.5 },
  { name: 'Іскра підземелля', emoji: '',    chance: 0.5 },
];

function rollRareDrop() {
  for (const drop of RARE_DROPS) {
    if (Math.random() * 100 < drop.chance) return drop;
  }
  return null;
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

    const { rows: [session] } = await pool.query(
      `INSERT INTO caves (player_id, total_mines, current_mine, mine_appears_at, mine_expires_at, is_active)
       VALUES ($1, $2, 1, NOW(), NOW() + INTERVAL '120 seconds', true) RETURNING *`,
      [req.session.playerId, total_mines]
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

    // Auto-fix corrupted timestamps (old Node.js Date bug stored local time as UTC → +3h offset).
    // Normal wait is 60-180s max; anything over 300s is stale — reset immediately.
    if (!session.is_active && !session.session_done) {
      const waitMs = new Date(session.mine_appears_at) - now;
      if (waitMs > 300 * 1000) {
        const fix = Math.floor(Math.random() * 121) + 60;
        const { rows: [u] } = await pool.query(
          `UPDATE caves SET mine_appears_at=NOW() + ($2 * INTERVAL '1 second'),
           mine_expires_at=NOW() + ($2 * INTERVAL '1 second') + INTERVAL '120 seconds'
           WHERE id=$1 RETURNING *`,
          [session.id, fix]
        );
        session = u;
      }
    }

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
        const { rows: [u] } = await pool.query(
          `UPDATE caves SET mines_missed=mines_missed+1, is_active=false,
           current_mine=current_mine+1,
           mine_appears_at=NOW() + ($2 * INTERVAL '1 second'),
           mine_expires_at=NOW() + ($2 * INTERVAL '1 second') + INTERVAL '120 seconds'
           WHERE id=$1 RETURNING *`,
          [session.id, nextInterval]
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

    if (new Date() > new Date(session.mine_expires_at))
      return res.status(400).json({ error: 'Шахта вже зникла' });

    const baseGold = randomGold();
    // Clan bonuses: Шахта +level золота/шахту, Академія +5% досвіду/рів
    const clanB = await getClanBonuses(req.session.playerId);
    const mineBonus  = clanB.mine    || 0;
    const academyPct = (clanB.academy || 0) * 5;
    const baseExp = Math.floor((Math.floor(Math.random() * 16) + 5) * 0.5);
    const exp = Math.floor(baseExp * (1 + academyPct / 100));

    // Talisman золотошукача bonus (only this talisman affects caves)
    const { rows: [talisman] } = await pool.query(
      `SELECT tu.bonus_pct FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id AND inv.is_equipped=true
       JOIN items it ON it.id = inv.item_id AND it.name='Талісман золотошукача'
       WHERE tu.player_id=$1`,
      [req.session.playerId]
    );
    const talismanBonus = talisman ? Math.floor(baseGold * talisman.bonus_pct / 100) : 0;
    const gold = baseGold + talismanBonus + mineBonus;

    // Rare ingredient drop
    const rareDrop = rollRareDrop();
    if (rareDrop) {
      await pool.query(
        `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,1)
         ON CONFLICT (player_id, ingredient_name) DO UPDATE SET quantity = player_ingredients.quantity + 1`,
        [req.session.playerId, rareDrop.name]
      );
    }

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

    const newMaxHp   = calcMaxHp(newLevel);
    const hpDiff     = levelUp ? newMaxHp - calcMaxHp(player.level) : 0;
    const newHpRegen = calcHpRegen(newMaxHp);
    await pool.query(
      `UPDATE players SET gold=gold+$1, experience=$2, exp_to_next=$3, level=$4,
         max_hp   = max_hp + $5,
         hp       = LEAST(max_hp + $5, hp + $5),
         hp_regen = $9,
         gold_mined_day   = COALESCE(gold_mined_day,0)   + $6,
         gold_mined_week  = COALESCE(gold_mined_week,0)  + $6,
         gold_mined_total = COALESCE(gold_mined_total,0) + $6,
         exp_day          = COALESCE(exp_day,0)          + $7,
         exp_week         = COALESCE(exp_week,0)         + $7
       WHERE id=$8`,
      [gold + goldBonus, newExp, newExpToNext, newLevel, hpDiff, gold, exp, req.session.playerId, newHpRegen]
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
      const { rows: [u] } = await pool.query(
        `UPDATE caves SET mines_done=mines_done+1, gold_earned=gold_earned+$1, exp_earned=exp_earned+$2,
         is_active=false, current_mine=current_mine+1,
         mine_appears_at=NOW() + ($3 * INTERVAL '1 second'),
         mine_expires_at=NOW() + ($3 * INTERVAL '1 second') + INTERVAL '120 seconds'
         WHERE id=$4 RETURNING *`,
        [gold, exp, nextInterval, session.id]
      );
      updatedSession = u;
    }

    updateClanTask(req.session.playerId, 'mine_gold', gold);
    const { updateDailyQuestProgress } = require('./daily');
    await updateDailyQuestProgress(req.session.playerId, 'mines', 1);
    res.json({ gold, baseGold, talismanBonus, mineBonus, exp, levelUp, newLevel, goldBonus, newExpToNext, rareDrop, session: updatedSession, hpDiff: levelUp ? hpDiff : 0, newMaxHp: levelUp ? calcMaxHp(newLevel) : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/caves/reset — delete today's session (admin/debug use)
router.post('/reset', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM caves WHERE player_id=$1 AND created_at::date = NOW()::date`,
      [req.session.playerId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
