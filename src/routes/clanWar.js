const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

async function getMembership(playerId) {
  const { rows: [m] } = await pool.query(
    'SELECT clan_id, role FROM clan_members WHERE player_id=$1', [playerId]
  );
  return m;
}

// ─── FINALIZE WAR ─────────────────────────────────────────────────────────────
async function finishWar(warId, io) {
  const { rows: [war] } = await pool.query(
    `SELECT * FROM clan_wars WHERE id=$1 AND status='active'`, [warId]
  );
  if (!war) return;

  const aDmg = parseInt(war.attacker_total_damage) || 0;
  const dDmg = parseInt(war.defender_total_damage) || 0;

  let status = 'draw';
  let winnerClanId = null;
  let loserClanId  = null;

  if (aDmg > dDmg) {
    status = 'finished';
    winnerClanId = war.attacker_clan_id;
    loserClanId  = war.defender_clan_id;
  } else if (dDmg > aDmg) {
    status = 'finished';
    winnerClanId = war.defender_clan_id;
    loserClanId  = war.attacker_clan_id;
  }

  let greenTaken = 0, goldTaken = 0;

  if (winnerClanId && loserClanId) {
    // Treasury transfer
    const { rows: [loserT] } = await pool.query(
      'SELECT treasury_greens, treasury_gold FROM clans WHERE id=$1', [loserClanId]
    );
    const maxDmg  = Math.max(aDmg, dDmg);
    const diffPct = maxDmg > 0 ? (Math.abs(aDmg - dDmg) / maxDmg) * 100 : 0;
    const pct = diffPct < 10 ? 5 : diffPct < 30 ? 10 : diffPct < 60 ? 20 : 30;

    greenTaken = Math.floor((loserT.treasury_greens || 0) * pct / 100);
    goldTaken  = Math.floor((loserT.treasury_gold  || 0) * pct / 100);

    if (greenTaken > 0 || goldTaken > 0) {
      await pool.query(
        `UPDATE clans SET treasury_greens=GREATEST(0,treasury_greens-$1),
                          treasury_gold=GREATEST(0,treasury_gold-$2) WHERE id=$3`,
        [greenTaken, goldTaken, loserClanId]
      );
      await pool.query(
        `UPDATE clans SET treasury_greens=treasury_greens+$1,
                          treasury_gold=treasury_gold+$2 WHERE id=$3`,
        [greenTaken, goldTaken, winnerClanId]
      );
    }

    // Glory calculation
    const { rows: participants } = await pool.query(
      `SELECT * FROM clan_war_participants WHERE war_id=$1`, [warId]
    );
    const winParts  = participants.filter(p => p.clan_id == winnerClanId);
    const loseParts = participants.filter(p => p.clan_id == loserClanId);

    const winGloryPool = 50 + loseParts.length * 2;
    const winTotalDmg  = winParts.reduce((s, p) => s + (parseInt(p.damage_dealt) || 0), 0);

    const sorted = [...winParts].sort((a, b) => parseInt(b.damage_dealt) - parseInt(a.damage_dealt));
    const topBonus = [10, 5, 3];

    for (const p of winParts) {
      if (winTotalDmg === 0) continue;
      let glory = Math.floor(winGloryPool * ((parseInt(p.damage_dealt) || 0) / winTotalDmg));
      const rank = sorted.findIndex(s => s.player_id === p.player_id);
      if (rank >= 0 && rank < 3) glory += topBonus[rank];
      if (glory > 0) {
        await pool.query('UPDATE players SET glory=glory+$1 WHERE id=$2', [glory, p.player_id]);
        await pool.query('UPDATE clan_war_participants SET glory_gained=$1 WHERE id=$2', [glory, p.id]);
      }
    }

    const loseGloryPool    = 25 + loseParts.length;
    const loseTotalDmgRecv = loseParts.reduce((s, p) => s + (parseInt(p.damage_received) || 0), 0);

    for (const p of loseParts) {
      if (loseTotalDmgRecv === 0) continue;
      const gloryLost = Math.floor(loseGloryPool * ((parseInt(p.damage_received) || 0) / loseTotalDmgRecv));
      if (gloryLost > 0) {
        await pool.query('UPDATE players SET glory=GREATEST(0,glory-$1) WHERE id=$2', [gloryLost, p.player_id]);
        await pool.query('UPDATE clan_war_participants SET glory_lost=$1 WHERE id=$2', [gloryLost, p.id]);
      }
    }

    // Update clan war counts
    await pool.query('UPDATE clans SET clan_wars_won=clan_wars_won+1 WHERE id=$1', [winnerClanId]);
    await pool.query('UPDATE clans SET clan_wars_lost=clan_wars_lost+1 WHERE id=$1', [loserClanId]);

    // Notify all members
    const writeEvent = require('../helpers/writeEvent');
    const { rows: [wClan] } = await pool.query('SELECT name FROM clans WHERE id=$1', [winnerClanId]);
    const { rows: [lClan] } = await pool.query('SELECT name FROM clans WHERE id=$1', [loserClanId]);

    const { rows: allMembers } = await pool.query(
      `SELECT cm.player_id, cm.clan_id FROM clan_members cm
       WHERE cm.clan_id IN ($1,$2)`, [winnerClanId, loserClanId]
    );
    for (const m of allMembers) {
      const isWinner = m.clan_id == winnerClanId;
      const myPart = (isWinner ? winParts : loseParts).find(p => p.player_id == m.player_id);
      const glory  = isWinner ? (myPart?.glory_gained || 0) : (myPart?.glory_lost || 0);
      const mailBody = isWinner
        ? `Клан ${wClan.name} переміг! +${glory} слави. Здобуто зі скарбниці: ${greenTaken} 🌿 і ${goldTaken} 🏅`
        : `Клан ${lClan.name} програв. -${glory} слави. Втрачено зі скарбниці: ${greenTaken} 🌿 і ${goldTaken} 🏅`;

      await pool.query(
        `INSERT INTO mail (receiver_id, subject, body, is_system) VALUES ($1,$2,$3,true)`,
        [m.player_id, isWinner ? '⚔️ Кланова Війна: Перемога!' : '💀 Кланова Війна: Поразка', mailBody]
      );
      await writeEvent(m.player_id, {
        event_type: 'clan_war_end',
        title: isWinner ? `⚔️ Перемога! Клан ${wClan.name}` : `💀 Поразка. Клан ${lClan.name}`,
        body:  isWinner ? `+${glory} слави · ${greenTaken}🌿 ${goldTaken}🏅 здобуто` : `-${glory} слави · ${greenTaken}🌿 ${goldTaken}🏅 втрачено`,
        icon: isWinner ? '⚔️' : '💀', color: isWinner ? 'green' : 'red',
      }, io);
      if (io) io.to(`player:${m.player_id}`).emit('clan_war:ended', {
        warId, isWinner,
        winnerClanName: wClan.name, loserClanName: lClan.name,
        greenTaken, goldTaken, glory,
      });
    }
  } else {
    // Draw
    const { rows: drawMembers } = await pool.query(
      `SELECT player_id FROM clan_members WHERE clan_id IN ($1,$2)`,
      [war.attacker_clan_id, war.defender_clan_id]
    );
    for (const m of drawMembers) {
      if (io) io.to(`player:${m.player_id}`).emit('clan_war:ended', { warId, isDraw: true });
    }
  }

  await pool.query(
    `UPDATE clan_wars SET status=$1, winner_clan_id=$2,
       treasury_taken_green=$3, treasury_taken_gold=$4, finished_at=NOW()
     WHERE id=$5`,
    [status, winnerClanId, greenTaken, goldTaken, warId]
  );
}

// ─── GET /api/clan-war/current ────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  try {
    const m = await getMembership(req.session.playerId);
    if (!m) return res.json({ war: null });

    const { rows: [war] } = await pool.query(
      `SELECT cw.*,
              ac.name AS attacker_name, ac.tag AS attacker_tag,
              dc.name AS defender_name, dc.tag AS defender_tag
       FROM clan_wars cw
       JOIN clans ac ON ac.id = cw.attacker_clan_id
       JOIN clans dc ON dc.id = cw.defender_clan_id
       WHERE cw.status='active'
         AND (cw.attacker_clan_id=$1 OR cw.defender_clan_id=$1)
       ORDER BY cw.started_at DESC LIMIT 1`,
      [m.clan_id]
    );
    res.json({ war: war || null, myClanId: m.clan_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/clan-war/declare/:clanId ───────────────────────────────────────
router.post('/declare/:clanId', async (req, res) => {
  try {
    const m = await getMembership(req.session.playerId);
    if (!m) return res.status(403).json({ error: 'Ви не в клані' });
    if (m.role !== 'leader') return res.status(403).json({ error: 'Тільки Отаман може оголосити війну' });

    const targetId = parseInt(req.params.clanId);
    if (targetId === m.clan_id) return res.status(400).json({ error: 'Не можна воювати з власним кланом' });

    const { rows: [myClan] }     = await pool.query('SELECT * FROM clans WHERE id=$1', [m.clan_id]);
    const { rows: [targetClan] } = await pool.query('SELECT * FROM clans WHERE id=$1', [targetId]);
    if (!targetClan) return res.status(404).json({ error: 'Клан не знайдено' });

    if (myClan.faction === targetClan.faction)
      return res.status(400).json({ error: 'Можна воювати лише з кланами протилежної фракції' });

    const { rows: activeWars } = await pool.query(
      `SELECT id FROM clan_wars WHERE status='active'
         AND (attacker_clan_id=$1 OR defender_clan_id=$1
              OR attacker_clan_id=$2 OR defender_clan_id=$2)`,
      [m.clan_id, targetId]
    );
    if (activeWars.length) return res.status(400).json({ error: 'Один з кланів вже веде активну війну' });

    const { rows: [lastWar] } = await pool.query(
      `SELECT finished_at FROM clan_wars
       WHERE ((attacker_clan_id=$1 AND defender_clan_id=$2)
              OR (attacker_clan_id=$2 AND defender_clan_id=$1))
         AND status != 'active'
       ORDER BY finished_at DESC LIMIT 1`,
      [m.clan_id, targetId]
    );
    if (lastWar?.finished_at) {
      const elapsed = Date.now() - new Date(lastWar.finished_at).getTime();
      if (elapsed < 24 * 60 * 60 * 1000)
        return res.status(400).json({ error: 'Кулдаун 24 год між війнами з цим кланом ще не минув' });
    }

    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { rows: [war] } = await pool.query(
      `INSERT INTO clan_wars (attacker_clan_id, defender_clan_id, ends_at)
       VALUES ($1,$2,$3) RETURNING *`,
      [m.clan_id, targetId, endsAt]
    );

    const io = req.app.locals.io;
    const writeEvent = require('../helpers/writeEvent');
    const { rows: allMembers } = await pool.query(
      `SELECT player_id FROM clan_members WHERE clan_id IN ($1,$2)`, [m.clan_id, targetId]
    );
    for (const mem of allMembers) {
      await pool.query(
        `INSERT INTO mail (receiver_id, subject, body, is_system) VALUES ($1,$2,$3,true)`,
        [mem.player_id, '⚔️ Кланова Війна розпочалась!',
         `${myClan.name} [${myClan.tag}] оголосив війну ${targetClan.name} [${targetClan.tag}]! 24 години на боротьбу.`]
      );
      await writeEvent(mem.player_id, {
        event_type: 'clan_war_start',
        title: `⚔️ Кланова Війна: ${myClan.name} vs ${targetClan.name}`,
        body: '24 години · бийся за клан!',
        icon: '⚔️', color: 'red',
      }, io);
      if (io) io.to(`player:${mem.player_id}`).emit('clan_war:started', {
        warId: war.id,
        attackerClan: { id: m.clan_id,  name: myClan.name,    tag: myClan.tag    },
        defenderClan: { id: targetId,    name: targetClan.name, tag: targetClan.tag },
        endsAt: war.ends_at,
      });
    }

    res.json({ success: true, war });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/:warId/enemies ─────────────────────────────────────────
router.get('/:warId/enemies', async (req, res) => {
  try {
    const warId = parseInt(req.params.warId);
    const m = await getMembership(req.session.playerId);
    if (!m) return res.status(403).json({ error: 'Ви не в клані' });

    const { rows: [war] } = await pool.query(
      `SELECT * FROM clan_wars WHERE id=$1
         AND (attacker_clan_id=$2 OR defender_clan_id=$2)`,
      [warId, m.clan_id]
    );
    if (!war) return res.status(404).json({ error: 'Війну не знайдено' });

    const enemyClanId = war.attacker_clan_id == m.clan_id
      ? war.defender_clan_id : war.attacker_clan_id;

    const { rows: enemies } = await pool.query(
      `SELECT p.id, p.username, p.level, p.on_vacation,
              t.power_level, t.endurance_level,
              COALESCE(al.attacks_used, 0) AS attacks_used
       FROM clan_members cm
       JOIN players p ON p.id = cm.player_id
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN clan_war_attack_limits al
         ON al.war_id=$1 AND al.attacker_id=$2 AND al.defender_id=p.id
       WHERE cm.clan_id=$3
       ORDER BY p.level DESC`,
      [warId, req.session.playerId, enemyClanId]
    );

    res.json({ enemies, myClanId: m.clan_id, enemyClanId, warStatus: war.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── POST /api/clan-war/attack-prepare ───────────────────────────────────────
// Validates attack, stores context in session → frontend calls /api/battle/fight
router.post('/attack-prepare', async (req, res) => {
  try {
    const { warId, defenderId } = req.body;
    const warIdNum      = parseInt(warId);
    const defenderIdNum = parseInt(defenderId);

    const m = await getMembership(req.session.playerId);
    if (!m) return res.status(403).json({ error: 'Ви не в клані' });

    const { rows: [me] } = await pool.query(
      'SELECT on_vacation FROM players WHERE id=$1', [req.session.playerId]
    );
    if (me.on_vacation) return res.status(400).json({ error: 'Ви на канікулах' });

    const { rows: [defender] } = await pool.query(
      'SELECT on_vacation FROM players WHERE id=$1', [defenderIdNum]
    );
    if (!defender) return res.status(404).json({ error: 'Суперника не знайдено' });
    if (defender.on_vacation) return res.status(400).json({ error: 'Суперник на канікулах' });

    const { rows: [war] } = await pool.query(
      `SELECT * FROM clan_wars WHERE id=$1 AND status='active' AND ends_at > NOW()
         AND (attacker_clan_id=$2 OR defender_clan_id=$2)`,
      [warIdNum, m.clan_id]
    );
    if (!war) return res.status(404).json({ error: 'Активну війну не знайдено' });

    const enemyClanId = war.attacker_clan_id == m.clan_id
      ? war.defender_clan_id : war.attacker_clan_id;

    const { rows: [defMem] } = await pool.query(
      'SELECT clan_id FROM clan_members WHERE player_id=$1', [defenderIdNum]
    );
    if (!defMem || defMem.clan_id != enemyClanId)
      return res.status(400).json({ error: 'Гравець не є членом ворожого клану' });

    const { rows: [limit] } = await pool.query(
      `SELECT attacks_used FROM clan_war_attack_limits
       WHERE war_id=$1 AND attacker_id=$2 AND defender_id=$3`,
      [warIdNum, req.session.playerId, defenderIdNum]
    );
    if ((limit?.attacks_used || 0) >= 2)
      return res.status(400).json({ error: 'Ліміт атак на цього гравця вичерпано (2/2)' });

    // Clan building bonuses
    const { rows: myB }  = await pool.query('SELECT building_key, level FROM clan_buildings WHERE clan_id=$1', [m.clan_id]);
    const { rows: enB }  = await pool.query('SELECT building_key, level FROM clan_buildings WHERE clan_id=$1', [enemyClanId]);
    const bv = (arr, key) => arr.find(b => b.building_key === key)?.level || 0;

    req.session.clanWarFight = {
      warId: warIdNum,
      attackerClanId: m.clan_id,
      defenderClanId: enemyClanId,
      defenderId: defenderIdNum,
      extraAttackerPower:     bv(myB, 'smithy') * 5,
      extraAttackerEndurance: bv(myB, 'tower')  * 5,
      extraDefenderPower:     bv(enB, 'smithy') * 5,
      extraDefenderEndurance: bv(enB, 'tower')  * 5,
    };
    await new Promise((ok, fail) => req.session.save(e => e ? fail(e) : ok()));

    res.json({ success: true, defenderId: defenderIdNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/:warId/leaderboard ────────────────────────────────────
router.get('/:warId/leaderboard', async (req, res) => {
  try {
    const warId = parseInt(req.params.warId);
    const m = await getMembership(req.session.playerId);

    const { rows: [war] } = await pool.query('SELECT * FROM clan_wars WHERE id=$1', [warId]);
    if (!war) return res.status(404).json({ error: 'Війну не знайдено' });

    const { rows: participants } = await pool.query(
      `SELECT cwp.*, p.username, p.level
       FROM clan_war_participants cwp
       JOIN players p ON p.id = cwp.player_id
       WHERE cwp.war_id=$1
       ORDER BY cwp.damage_dealt DESC`,
      [warId]
    );

    const myClanId = m?.clan_id;
    res.json({
      war,
      myTeam:  participants.filter(p => p.clan_id == myClanId),
      enemies: participants.filter(p => p.clan_id != myClanId),
      myClanId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/history ────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const m = await getMembership(req.session.playerId);
    if (!m) return res.json({ wars: [], myClanId: null });

    const { rows } = await pool.query(
      `SELECT cw.*,
              ac.name AS attacker_name, ac.tag AS attacker_tag,
              dc.name AS defender_name, dc.tag AS defender_tag,
              wc.name AS winner_name
       FROM clan_wars cw
       JOIN clans ac ON ac.id = cw.attacker_clan_id
       JOIN clans dc ON dc.id = cw.defender_clan_id
       LEFT JOIN clans wc ON wc.id = cw.winner_clan_id
       WHERE (cw.attacker_clan_id=$1 OR cw.defender_clan_id=$1)
         AND cw.status != 'active'
       ORDER BY cw.started_at DESC LIMIT 20`,
      [m.clan_id]
    );
    res.json({ wars: rows, myClanId: m.clan_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/rating ─────────────────────────────────────────────────
router.get('/rating', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.tag, c.faction,
              COALESCE(SUM(p.glory), 0)::BIGINT AS total_glory,
              COUNT(cm.player_id)::INT AS member_count,
              COALESCE(c.clan_wars_won, 0)  AS wars_won,
              COALESCE(c.clan_wars_lost, 0) AS wars_lost
       FROM clans c
       LEFT JOIN clan_members cm ON cm.clan_id = c.id
       LEFT JOIN players p ON p.id = cm.player_id
       GROUP BY c.id
       ORDER BY total_glory DESC LIMIT 50`
    );
    res.json({ clans: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/clan-stats ────────────────────────────────────────────
router.get('/clan-stats', async (req, res) => {
  try {
    const m = await getMembership(req.session.playerId);
    if (!m) return res.status(403).json({ error: 'Ви не в клані' });

    // Total wars, wins, losses
    const { rows: [totals] } = await pool.query(
      `SELECT
         COUNT(*)::INTEGER                                                AS total_wars,
         COUNT(CASE WHEN winner_clan_id=$1 THEN 1 END)::INTEGER          AS wins,
         COUNT(CASE WHEN status='finished' AND winner_clan_id!=$1 AND winner_clan_id IS NOT NULL THEN 1 END)::INTEGER AS losses,
         COUNT(CASE WHEN status='draw' THEN 1 END)::INTEGER              AS draws,
         COALESCE(MAX(CASE WHEN attacker_clan_id=$1 THEN attacker_total_damage
                           WHEN defender_clan_id=$1 THEN defender_total_damage
                      END),0)::BIGINT                                    AS best_damage
       FROM clan_wars
       WHERE (attacker_clan_id=$1 OR defender_clan_id=$1)
         AND status != 'active'`,
      [m.clan_id]
    );

    // Most active member (highest total damage_dealt across all wars)
    const { rows: [topPlayer] } = await pool.query(
      `SELECT p.username, p.level, SUM(cwp.damage_dealt)::BIGINT AS total_damage,
              COUNT(*)::INTEGER AS wars_participated
       FROM clan_war_participants cwp
       JOIN players p ON p.id = cwp.player_id
       WHERE cwp.clan_id=$1
       GROUP BY p.id, p.username, p.level
       ORDER BY total_damage DESC LIMIT 1`,
      [m.clan_id]
    );

    // Current streak (consecutive wins or losses from most recent wars)
    const { rows: recent } = await pool.query(
      `SELECT winner_clan_id, status FROM clan_wars
       WHERE (attacker_clan_id=$1 OR defender_clan_id=$1) AND status != 'active'
       ORDER BY finished_at DESC NULLS LAST LIMIT 20`,
      [m.clan_id]
    );
    let streak = 0, streakType = null;
    for (const w of recent) {
      const isWin  = w.winner_clan_id == m.clan_id;
      const isDraw = w.status === 'draw';
      const cur    = isDraw ? 'draw' : isWin ? 'win' : 'loss';
      if (streakType === null) { streakType = cur; streak = 1; }
      else if (cur === streakType) streak++;
      else break;
    }

    // Last 10 wars
    const { rows: lastWars } = await pool.query(
      `SELECT cw.id, cw.status, cw.winner_clan_id, cw.finished_at,
              cw.attacker_clan_id, cw.defender_clan_id,
              cw.attacker_total_damage, cw.defender_total_damage,
              ac.name AS attacker_name, ac.tag AS attacker_tag,
              dc.name AS defender_name, dc.tag AS defender_tag
       FROM clan_wars cw
       JOIN clans ac ON ac.id = cw.attacker_clan_id
       JOIN clans dc ON dc.id = cw.defender_clan_id
       WHERE (cw.attacker_clan_id=$1 OR cw.defender_clan_id=$1)
         AND cw.status != 'active'
       ORDER BY cw.finished_at DESC NULLS LAST LIMIT 10`,
      [m.clan_id]
    );

    res.json({ totals, topPlayer: topPlayer || null, streak, streakType, lastWars, myClanId: m.clan_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// ─── GET /api/clan-war/my-stats ───────────────────────────────────────────────
// Personal war statistics for the current player
router.get('/my-stats', async (req, res) => {
  try {
    const { rows: [s] } = await pool.query(
      `SELECT
         COUNT(*)::INTEGER                              AS wars_participated,
         COALESCE(SUM(damage_dealt),  0)::BIGINT        AS total_damage,
         COALESCE(SUM(battles_count), 0)::INTEGER       AS total_battles,
         COALESCE(SUM(wins),          0)::INTEGER       AS total_wins,
         COALESCE(SUM(glory_gained),  0)::INTEGER       AS glory_gained,
         COALESCE(SUM(glory_lost),    0)::INTEGER       AS glory_lost
       FROM clan_war_participants
       WHERE player_id=$1`,
      [req.session.playerId]
    );

    // Wars won by clan while player participated
    const { rows: [{ count: warsWonWithClan }] } = await pool.query(
      `SELECT COUNT(*)::INTEGER AS count
       FROM clan_war_participants cwp
       JOIN clan_wars cw ON cw.id = cwp.war_id
       WHERE cwp.player_id=$1 AND cw.winner_clan_id=cwp.clan_id`,
      [req.session.playerId]
    );

    res.json({ stats: s || {}, warsWonWithClan: parseInt(warsWonWithClan) || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.finishWar = finishWar;
