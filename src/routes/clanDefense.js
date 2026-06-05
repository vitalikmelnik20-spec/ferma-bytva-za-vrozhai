const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const WAVES = [
  { wave: 1,  name: 'Прості фермери-зрадники', hp: 5000   },
  { wave: 2,  name: 'Прості фермери-зрадники', hp: 5000   },
  { wave: 3,  name: 'Прості фермери-зрадники', hp: 5000   },
  { wave: 4,  name: 'Озброєні розбійники',      hp: 15000  },
  { wave: 5,  name: 'Озброєні розбійники',      hp: 15000  },
  { wave: 6,  name: 'Озброєні розбійники',      hp: 15000  },
  { wave: 7,  name: 'Найманці',                 hp: 30000  },
  { wave: 8,  name: 'Найманці',                 hp: 30000  },
  { wave: 9,  name: 'Найманці',                 hp: 30000  },
  { wave: 10, name: 'Елітні воїни',             hp: 60000  },
  { wave: 11, name: 'Елітні воїни',             hp: 60000  },
  { wave: 12, name: '💀 Темний Лицар',          hp: 150000 },
];
const WAVE_DURATION_MS = 5 * 60 * 1000;

async function getPlayerClan(playerId) {
  const { rows: [m] } = await pool.query(
    `SELECT clan_id, role FROM clan_members WHERE player_id=$1`, [playerId]
  );
  return m || null;
}

async function getActiveClanEvent(clanId) {
  const { rows: [ev] } = await pool.query(
    `SELECT * FROM clan_defense_events WHERE clan_id=$1 AND status='active' ORDER BY id DESC LIMIT 1`,
    [clanId]
  );
  return ev || null;
}

async function finalizeDefenseEvent(eventId, io) {
  const { rows: [ev] } = await pool.query(
    `SELECT * FROM clan_defense_events WHERE id=$1`, [eventId]
  );
  if (!ev || ev.status !== 'active') return;

  const waves    = ev.waves_survived;
  const isVictory = waves >= 12;
  const defeated  = ev.base_hp_current <= 0;
  const status    = isVictory ? 'victory' : defeated ? 'defeated' : 'ended';

  await pool.query(
    `UPDATE clan_defense_events SET status=$1, is_victory=$2 WHERE id=$3`,
    [status, isVictory, eventId]
  );

  let clanGreens = 0, playerGreens = 0, playerGlory = 0;
  if (waves >= 12) { clanGreens = 2000; playerGreens = 500; playerGlory = 20; }
  else if (waves >= 7) { clanGreens = 1000; playerGreens = 250; playerGlory = 10; }
  else if (waves >= 1) { clanGreens = 500;  playerGreens = 100; playerGlory = 5;  }

  if (clanGreens > 0) {
    await pool.query(
      `UPDATE clans SET treasury_greens=treasury_greens+$1 WHERE id=$2`,
      [clanGreens, ev.clan_id]
    );
  }
  await pool.query(
    `UPDATE clans SET
       defense_count       = COALESCE(defense_count,0)+1,
       defense_waves_total = COALESCE(defense_waves_total,0)+$1,
       defense_best_waves  = GREATEST(COALESCE(defense_best_waves,0), $1),
       rating_points       = COALESCE(rating_points,0)+$2
     WHERE id=$3`,
    [waves, isVictory ? 50 : 0, ev.clan_id]
  );

  const { rows: parts } = await pool.query(
    `SELECT player_id, damage_dealt FROM clan_defense_participants WHERE event_id=$1`, [eventId]
  );
  for (const p of parts) {
    const exp = Math.max(50, Math.floor(p.damage_dealt / 100));
    await pool.query(
      `UPDATE players SET greens=greens+$1, glory=glory+$2, experience=experience+$3,
         glory_day=COALESCE(glory_day,0)+$2, glory_week=COALESCE(glory_week,0)+$2
       WHERE id=$4`,
      [playerGreens, playerGlory, exp, p.player_id]
    );
  }

  if (io) {
    io.to(`clan:${ev.clan_id}`).emit('clan_defense:ended', {
      eventId, waves_survived: waves, is_victory: isVictory, base_destroyed: defeated,
      playerGreens, playerGlory,
    });
  }
}

async function advanceClanDefenseWaves(io) {
  const { rows: events } = await pool.query(
    `SELECT * FROM clan_defense_events
     WHERE status='active'
       AND wave_starts_at + ($1 || ' milliseconds')::interval <= NOW()`,
    [WAVE_DURATION_MS]
  );

  for (const ev of events) {
    try {
      const waveConf = WAVES[ev.current_wave - 1];
      const waveDefeated = ev.wave_hp_current <= 0;

      const baseDmg       = waveDefeated ? 0 : Math.ceil(waveConf.hp * 0.05);
      const newBaseHp     = Math.max(0, ev.base_hp_current - baseDmg);
      const newSurvived   = ev.waves_survived + (waveDefeated ? 1 : 0);
      const isLastWave    = ev.current_wave >= 12;
      const baseDestroyed = newBaseHp <= 0;

      if (isLastWave || baseDestroyed) {
        await pool.query(
          `UPDATE clan_defense_events SET base_hp_current=$1, waves_survived=$2 WHERE id=$3`,
          [newBaseHp, newSurvived, ev.id]
        );
        await finalizeDefenseEvent(ev.id, io);
      } else {
        const nextWave     = ev.current_wave + 1;
        const nextWaveConf = WAVES[nextWave - 1];
        const nextStart    = new Date();
        await pool.query(
          `UPDATE clan_defense_events SET
             current_wave=$1, wave_hp_current=$2, wave_starts_at=$3,
             base_hp_current=$4, waves_survived=$5
           WHERE id=$6`,
          [nextWave, nextWaveConf.hp, nextStart, newBaseHp, newSurvived, ev.id]
        );
        if (io) {
          io.to(`clan:${ev.clan_id}`).emit('clan_defense:wave', {
            eventId: ev.id,
            wave:    nextWave,
            waveName: nextWaveConf.name,
            waveHp:  nextWaveConf.hp,
            baseHp:  newBaseHp,
            baseHpMax: ev.base_hp_max,
            prevWaveDefeated: waveDefeated,
          });
        }
      }
    } catch (err) { console.error('[ClanDefense] wave advance error:', err.message); }
  }
}

async function startClanDefenseEvents(io) {
  const { rows: clans } = await pool.query(
    `SELECT c.id, COUNT(cm.player_id)::INTEGER AS member_count
     FROM clans c
     JOIN clan_members cm ON cm.clan_id = c.id
     WHERE NOT EXISTS (
       SELECT 1 FROM clan_defense_events cde
       WHERE cde.clan_id = c.id
         AND cde.started_at >= CURRENT_DATE
     )
     GROUP BY c.id
     HAVING COUNT(cm.player_id) >= 1`
  );

  for (const clan of clans) {
    const baseHp    = 10000 * clan.member_count;
    const endsAt    = new Date(Date.now() + 60 * 60 * 1000);
    const waveConf  = WAVES[0];
    try {
      const { rows: [ev] } = await pool.query(
        `INSERT INTO clan_defense_events
           (clan_id, ends_at, base_hp_current, base_hp_max, wave_hp_current)
         VALUES ($1,$2,$3,$3,$4) RETURNING *`,
        [clan.id, endsAt, baseHp, waveConf.hp]
      );
      if (io) {
        io.to(`clan:${clan.id}`).emit('clan_defense:wave', {
          eventId:  ev.id,
          wave:     1,
          waveName: waveConf.name,
          waveHp:   waveConf.hp,
          baseHp,
          baseHpMax: baseHp,
          prevWaveDefeated: null,
        });
      }
    } catch (err) { console.error('[ClanDefense] start error for clan', clan.id, err.message); }
  }
  console.log(`[ClanDefense] Запущено для ${clans.length} кланів`);
}

// GET /api/clan-defense/current
router.get('/current', async (req, res) => {
  try {
    const membership = await getPlayerClan(req.session.playerId);
    if (!membership) return res.json({ event: null, reason: 'not_in_clan' });

    const ev = await getActiveClanEvent(membership.clan_id);
    if (!ev) {
      const { rows: [last] } = await pool.query(
        `SELECT cde.*, cdp.damage_dealt AS my_damage
         FROM clan_defense_events cde
         LEFT JOIN clan_defense_participants cdp
           ON cdp.event_id=cde.id AND cdp.player_id=$1
         WHERE cde.clan_id=$2 AND cde.status != 'active'
         ORDER BY cde.id DESC LIMIT 1`,
        [req.session.playerId, membership.clan_id]
      );
      return res.json({ event: null, lastEvent: last || null });
    }

    const waveConf = WAVES[ev.current_wave - 1];
    const waveHpMax = waveConf.hp;
    const waveEndsAt = new Date(ev.wave_starts_at).getTime() + WAVE_DURATION_MS;
    const timeLeftMs = Math.max(0, waveEndsAt - Date.now());

    const { rows: [myPart] } = await pool.query(
      `SELECT damage_dealt, waves_participated FROM clan_defense_participants
       WHERE event_id=$1 AND player_id=$2`,
      [ev.id, req.session.playerId]
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM clan_defense_participants WHERE event_id=$1`, [ev.id]
    );

    res.json({
      event: ev,
      waveName:   waveConf.name,
      waveHpMax,
      timeLeftMs,
      myDamage:   myPart?.damage_dealt   || 0,
      myWaves:    myPart?.waves_participated || 0,
      participants: parseInt(count),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/clan-defense/defend
router.post('/defend', async (req, res) => {
  try {
    const membership = await getPlayerClan(req.session.playerId);
    if (!membership) return res.status(400).json({ error: 'Ви не в клані' });

    const ev = await getActiveClanEvent(membership.clan_id);
    if (!ev) return res.status(404).json({ error: 'Немає активної події' });

    const { rows: [player] } = await pool.query(
      `SELECT p.hp, t.power_level,
              COALESCE(SUM(CASE WHEN inv.is_equipped THEN it.power_bonus ELSE 0 END),0)::INTEGER AS equip_power
       FROM players p
       LEFT JOIN training t ON t.player_id=p.id
       LEFT JOIN inventory inv ON inv.player_id=p.id
       LEFT JOIN items it ON it.id=inv.item_id
       WHERE p.id=$1 GROUP BY p.hp, t.power_level`,
      [req.session.playerId]
    );

    const power  = (player.power_level || 0) + (player.equip_power || 0);
    const damage = Math.max(1, power + Math.floor(Math.random() * 21));
    const newWaveHp = Math.max(0, ev.wave_hp_current - damage);

    await pool.query(
      `UPDATE clan_defense_events SET wave_hp_current=$1 WHERE id=$2`,
      [newWaveHp, ev.id]
    );
    await pool.query(
      `INSERT INTO clan_defense_participants (event_id, player_id, damage_dealt, waves_participated)
       VALUES ($1,$2,$3,1)
       ON CONFLICT (event_id, player_id) DO UPDATE SET
         damage_dealt       = clan_defense_participants.damage_dealt + $3,
         waves_participated = GREATEST(clan_defense_participants.waves_participated,
                                       (SELECT current_wave FROM clan_defense_events WHERE id=$1))`,
      [ev.id, req.session.playerId, damage]
    );

    const waveConf = WAVES[ev.current_wave - 1];
    const io = req.app.locals.io;
    io.to(`clan:${membership.clan_id}`).emit('clan_defense:damage', {
      eventId:      ev.id,
      wave:         ev.current_wave,
      waveHpCurrent: newWaveHp,
      waveHpMax:    waveConf.hp,
    });

    res.json({ damage, waveHpCurrent: newWaveHp, waveHpMax: waveConf.hp });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// GET /api/clan-defense/history
router.get('/history', async (req, res) => {
  try {
    const membership = await getPlayerClan(req.session.playerId);
    if (!membership) return res.json({ history: [] });

    const { rows } = await pool.query(
      `SELECT cde.id, cde.started_at, cde.waves_survived, cde.is_victory, cde.status,
              cde.base_hp_max,
              (SELECT COUNT(*) FROM clan_defense_participants WHERE event_id=cde.id)::INTEGER AS participant_count,
              cdp.damage_dealt AS my_damage
       FROM clan_defense_events cde
       LEFT JOIN clan_defense_participants cdp ON cdp.event_id=cde.id AND cdp.player_id=$1
       WHERE cde.clan_id=$2 AND cde.status != 'active'
       ORDER BY cde.started_at DESC LIMIT 10`,
      [req.session.playerId, membership.clan_id]
    );
    res.json({ history: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

module.exports = router;
module.exports.startClanDefenseEvents  = startClanDefenseEvents;
module.exports.advanceClanDefenseWaves = advanceClanDefenseWaves;
