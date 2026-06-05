const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { applyHpRegenNow } = require('../helpers/hpRegen');

router.use(requireAuth);

async function getActiveEvent() {
  const { rows: [ev] } = await pool.query(
    `SELECT * FROM dragon_events WHERE status='active' AND ends_at > NOW() ORDER BY id DESC LIMIT 1`
  );
  return ev || null;
}

async function finalizeEvent(eventId, isKilled, killerPlayerId, io) {
  const { rows: [ev] } = await pool.query(`SELECT * FROM dragon_events WHERE id=$1`, [eventId]);
  if (!ev || ev.status !== 'active') return;

  await pool.query(`UPDATE dragon_events SET status='ended', is_killed=$1 WHERE id=$2`, [isKilled, eventId]);

  const { rows: parts } = await pool.query(
    `SELECT dp.*, p.username FROM dragon_participants dp
     JOIN players p ON p.id = dp.player_id
     WHERE dp.event_id=$1 ORDER BY dp.damage_dealt DESC`,
    [eventId]
  );
  const totalDmg = Math.max(ev.total_damage, 1);

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const greens = Math.floor(p.damage_dealt / 10);
    const exp    = Math.floor(p.damage_dealt / 100);

    let rareDrop = null;
    if (isKilled && killerPlayerId && p.player_id === parseInt(killerPlayerId)) rareDrop = 'Кіготь дракона';
    else if (i < 3)  rareDrop = 'Луска дракона';
    else if (i < 10) rareDrop = 'Зуб дракона';

    await pool.query(
      `UPDATE players SET greens=greens+$1, experience=experience+$2, hp=max_hp,
         dragon_battles=COALESCE(dragon_battles,0)+1,
         dragon_total_damage=COALESCE(dragon_total_damage,0)+$3,
         dragon_greens_earned=COALESCE(dragon_greens_earned,0)+$1,
         dragon_damage_day   = COALESCE(dragon_damage_day,0)   + $3,
         dragon_damage_week  = COALESCE(dragon_damage_week,0)  + $3,
         dragon_damage_total = COALESCE(dragon_damage_total,0) + $3
       WHERE id=$4`,
      [greens, exp, p.damage_dealt, p.player_id]
    );
    await pool.query(
      `UPDATE dragon_participants SET reward_green=$1, reward_exp=$2, rare_drop=$3 WHERE id=$4`,
      [greens, exp, rareDrop, p.id]
    );

    if (rareDrop) {
      await pool.query(
        `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,1)
         ON CONFLICT (player_id, ingredient_name) DO UPDATE SET quantity=player_ingredients.quantity+1`,
        [p.player_id, rareDrop]
      );
    }

    if (isKilled) {
      const { rows: [rnd] } = await pool.query(
        `SELECT id FROM items WHERE is_active=true ORDER BY RANDOM() LIMIT 1`
      );
      if (rnd) await pool.query(
        `INSERT INTO inventory (player_id, item_id) VALUES ($1,$2)`,
        [p.player_id, rnd.id]
      );
    }
  }

  if (io) io.emit('dragon:ended', {
    eventId,
    isKilled,
    top10: parts.slice(0, 10).map(p => ({ username: p.username, damage: p.damage_dealt })),
  });
}

// GET /api/dragon/current
router.get('/current', async (req, res) => {
  try {
    const ev = await getActiveEvent();
    if (!ev) {
      const { rows: [last] } = await pool.query(
        `SELECT de.*,
           (SELECT COUNT(*) FROM dragon_participants WHERE event_id=de.id)::INTEGER AS participant_count,
           dp.damage_dealt AS my_damage, dp.reward_green, dp.reward_exp, dp.rare_drop
         FROM dragon_events de
         LEFT JOIN dragon_participants dp ON dp.event_id=de.id AND dp.player_id=$1
         WHERE de.status='ended' ORDER BY de.id DESC LIMIT 1`,
        [req.session.playerId]
      );
      return res.json({ event: null, lastEvent: last || null });
    }
    const { rows: [myPart] } = await pool.query(
      `SELECT damage_dealt, hits_count, last_attack_at, attack_cooldown_secs FROM dragon_participants WHERE event_id=$1 AND player_id=$2`,
      [ev.id, req.session.playerId]
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM dragon_participants WHERE event_id=$1`, [ev.id]
    );
    const { rows: top5 } = await pool.query(
      `SELECT p.id as player_id, p.username, dp.damage_dealt FROM dragon_participants dp
       JOIN players p ON p.id=dp.player_id WHERE dp.event_id=$1 ORDER BY dp.damage_dealt DESC LIMIT 5`,
      [ev.id]
    );
    let attackCooldownSecs = 0;
    if (myPart?.last_attack_at && myPart?.attack_cooldown_secs) {
      const elapsed = (Date.now() - new Date(myPart.last_attack_at).getTime()) / 1000;
      attackCooldownSecs = Math.max(0, Math.ceil(myPart.attack_cooldown_secs - elapsed));
    }
    res.json({ event: ev, myDamage: myPart?.damage_dealt || 0, myHits: myPart?.hits_count || 0, participants: parseInt(count), top5, attackCooldownSecs });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/dragon/attack
router.post('/attack', async (req, res) => {
  try {
    const ev = await getActiveEvent();
    if (!ev)               return res.status(404).json({ error: 'Активної події немає' });
    if (ev.hp_current <= 0) return res.status(400).json({ error: 'Дракон вже переможений' });

    // Check per-player cooldown
    const { rows: [cdRow] } = await pool.query(
      `SELECT last_attack_at, attack_cooldown_secs FROM dragon_participants WHERE event_id=$1 AND player_id=$2`,
      [ev.id, req.session.playerId]
    );
    if (cdRow?.last_attack_at && cdRow?.attack_cooldown_secs) {
      const elapsed = (Date.now() - new Date(cdRow.last_attack_at).getTime()) / 1000;
      const remaining = Math.ceil(cdRow.attack_cooldown_secs - elapsed);
      if (remaining > 0)
        return res.status(429).json({ error: `Зачекайте ${remaining}с перед наступним ударом`, cooldownSecs: remaining });
    }

    await applyHpRegenNow(req.session.playerId);
    const { rows: [player] } = await pool.query(
      `SELECT p.hp, p.max_hp, t.power_level,
              COALESCE(SUM(CASE WHEN inv.is_equipped THEN it.power_bonus ELSE 0 END),0)::INTEGER AS equip_power
       FROM players p
       LEFT JOIN training t ON t.player_id=p.id
       LEFT JOIN inventory inv ON inv.player_id=p.id
       LEFT JOIN items it ON it.id=inv.item_id
       WHERE p.id=$1 GROUP BY p.hp, p.max_hp, t.power_level`,
      [req.session.playerId]
    );

    const power  = (player.power_level || 0) + (player.equip_power || 0);
    const rand   = 0.8 + Math.random() * 0.4;
    const isCrit = Math.random() * 100 < 10;
    const damage = Math.max(1, Math.floor(power * rand * (isCrit ? 2.0 : 1.0)));

    const hpPct = ev.hp_current / ev.hp_max;
    const [lo, hi] = hpPct > 0.75 ? [1,5] : hpPct > 0.5 ? [5,10] : hpPct > 0.25 ? [10,15] : [15,20];
    const counterDmg = Math.max(1, Math.floor(player.max_hp * (lo + Math.random() * (hi - lo)) / 100));
    const newPlayerHp = Math.max(1, player.hp - counterDmg);
    const newDragonHp = Math.max(0, ev.hp_current - damage);
    const isKilled    = newDragonHp === 0;

    await pool.query(
      `UPDATE dragon_events SET hp_current=$1, total_damage=total_damage+$2 WHERE id=$3`,
      [newDragonHp, damage, ev.id]
    );
    await pool.query(`UPDATE players SET hp=GREATEST(1,hp-$1) WHERE id=$2`, [counterDmg, req.session.playerId]);
    const cooldownSecs = 30 + Math.floor(Math.random() * 91); // 30–120s
    await pool.query(
      `INSERT INTO dragon_participants (event_id, player_id, damage_dealt, hits_count, last_attack_at, attack_cooldown_secs) VALUES ($1,$2,$3,1,NOW(),$4)
       ON CONFLICT (event_id, player_id) DO UPDATE SET
         damage_dealt=dragon_participants.damage_dealt+$3,
         hits_count=dragon_participants.hits_count+1,
         last_attack_at=NOW(),
         attack_cooldown_secs=$4`,
      [ev.id, req.session.playerId, damage, cooldownSecs]
    );

    const io = req.app.locals.io;
    if (isKilled) await finalizeEvent(ev.id, true, req.session.playerId, io);

    res.json({ damage, isCrit, counterDmg, newPlayerHp, newDragonHp, hpMax: ev.hp_max, isKilled, cooldownSecs });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// GET /api/dragon/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.username, p.faction,
              COALESCE(p.dragon_battles,0)       AS battles,
              COALESCE(p.dragon_total_damage,0)  AS total_damage,
              COALESCE(p.dragon_greens_earned,0) AS greens_earned
       FROM players p WHERE COALESCE(p.dragon_total_damage,0)>0 AND p.is_banned=false
       ORDER BY p.dragon_total_damage DESC LIMIT 50`
    );
    res.json({ leaderboard: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// GET /api/dragon/history
router.get('/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT de.id, de.hp_max, de.total_damage, de.is_killed, de.started_at, de.ends_at,
              (SELECT COUNT(*) FROM dragon_participants WHERE event_id=de.id)::INTEGER AS participants,
              dp.damage_dealt AS my_damage, dp.reward_green, dp.rare_drop
       FROM dragon_events de
       LEFT JOIN dragon_participants dp ON dp.event_id=de.id AND dp.player_id=$1
       WHERE de.status='ended' ORDER BY de.started_at DESC LIMIT 20`,
      [req.session.playerId]
    );
    res.json({ history: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

module.exports = router;
module.exports.getActiveEvent = getActiveEvent;
module.exports.finalizeEvent  = finalizeEvent;
