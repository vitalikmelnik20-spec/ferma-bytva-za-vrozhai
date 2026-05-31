const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const ZONE_BONUS = { head: 1.3, body: 1.0, legs: 0.8 };
const VALID_ZONES = ['head', 'body', 'legs'];

// Ring of the Thief: check if equipped ring triggers theft after a win
async function checkRingEffect(winnerId, loserId, battleId, io) {
  const { rows: [ru] } = await pool.query(
    `SELECT ru.* FROM ring_upgrades ru
     JOIN inventory inv ON inv.id = ru.inv_id
     WHERE inv.player_id=$1 AND inv.is_equipped=true`,
    [winnerId]
  );
  if (!ru) return null;

  const roll = Math.floor(Math.random() * 100) + 1;
  if (roll > ru.steal_chance) return null;

  const { rows: [victim] } = await pool.query(
    'SELECT gold, username FROM players WHERE id=$1', [loserId]
  );
  if (!victim || victim.gold <= 0) return null;

  const stealPct = Math.random() * (ru.max_steal_pct - 1) + 1;
  let stolen = Math.max(1, Math.floor(victim.gold * stealPct / 100));
  stolen = Math.min(stolen, victim.gold);

  await pool.query('UPDATE players SET gold=gold+$1, gold_earned_battle=gold_earned_battle+$1 WHERE id=$2', [stolen, winnerId]);
  await pool.query('UPDATE players SET gold=GREATEST(0,gold-$1), gold_lost_battle=gold_lost_battle+$1 WHERE id=$2', [stolen, loserId]);

  const { rows: [winner] } = await pool.query('SELECT username FROM players WHERE id=$1', [winnerId]);

  await pool.query(
    `INSERT INTO theft_log (battle_id,thief_id,victim_id,gold_stolen,steal_pct,ring_level)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [battleId, winnerId, loserId, stolen, stealPct.toFixed(2), ru.ring_level]
  );

  // System mail to victim
  await pool.query(
    `INSERT INTO mail (receiver_id, subject, body, is_system)
     VALUES ($1,$2,$3,true)`,
    [loserId, 'У тебе вкрали золото!',
     `${winner.username} вкрав у тебе ${stolen} золота після бою. Залишилось: ${victim.gold - stolen} золота.`]
  );

  // Socket.io toast if victim is online
  if (io) {
    io.to(`player:${loserId}`).emit('ring:stolen', {
      fromName: winner.username,
      amount: stolen,
      goldLeft: victim.gold - stolen
    });
  }

  return { triggered: true, stolenGold: stolen, victimName: victim.username };
}

function calcStats(player, training, gifts) {
  const giftPower     = gifts.reduce((s, g) => s + g.power_bonus, 0);
  const giftEndurance = gifts.reduce((s, g) => s + g.endurance_bonus, 0);
  const giftSpeed     = gifts.reduce((s, g) => s + g.speed_bonus, 0);
  const giftAccuracy  = gifts.reduce((s, g) => s + g.accuracy_bonus, 0);

  return {
    power:     training.power_level     + player.equip_power     + giftPower,
    endurance: training.endurance_level + player.equip_endurance + giftEndurance,
    speed:     training.speed_level     + player.equip_speed     + giftSpeed,
    accuracy:  training.accuracy_level  + player.equip_accuracy  + giftAccuracy,
  };
}

function rollDamage(attackerStats, defenderStats, zone) {
  const hitChance = Math.min(0.95, Math.max(0.3,
    0.5 + (attackerStats.accuracy - defenderStats.endurance) * 0.01
  ));
  if (Math.random() > hitChance) return { damage: 0, type: 'miss' };

  const zoneBonus = ZONE_BONUS[zone] || 1.0;
  const random    = 0.8 + Math.random() * 0.4;
  const isCrit    = Math.random() < 0.1;
  const crit      = isCrit ? 2.0 : 1.0;
  const damage    = Math.max(1, Math.floor(
    (attackerStats.power - defenderStats.endurance * 0.5) * zoneBonus * random * crit
  ));
  return { damage, type: isCrit ? 'crit' : 'hit' };
}

function fetchPlayerWithStats(playerId) {
  // SUM returns BIGINT which pg returns as string — cast to INTEGER to get JS numbers
  return pool.query(
    `SELECT p.*, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
            COALESCE(SUM(CASE WHEN i.is_equipped THEN it.power_bonus     ELSE 0 END), 0)::INTEGER AS equip_power,
            COALESCE(SUM(CASE WHEN i.is_equipped THEN it.endurance_bonus ELSE 0 END), 0)::INTEGER AS equip_endurance,
            COALESCE(SUM(CASE WHEN i.is_equipped THEN it.speed_bonus     ELSE 0 END), 0)::INTEGER AS equip_speed,
            COALESCE(SUM(CASE WHEN i.is_equipped THEN it.accuracy_bonus  ELSE 0 END), 0)::INTEGER AS equip_accuracy
     FROM players p
     LEFT JOIN training t  ON t.player_id = p.id
     LEFT JOIN inventory i ON i.player_id = p.id
     LEFT JOIN items it    ON it.id = i.item_id
     WHERE p.id = $1
     GROUP BY p.id, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level`,
    [playerId]
  );
}

// Get opponents
router.get('/opponents', async (req, res) => {
  try {
    const { rows: [me] } = await pool.query(
      'SELECT level, faction FROM players WHERE id=$1',
      [req.session.playerId]
    );

    const slogans = [
      'Руки геть від моєї капусти!',
      'Нападеш — будеш зуби збирати!',
      'Моя ферма — моя фортеця!',
      'Я тебе в землю закопаю, як морквину!',
      'Спробуй тільки, отримаєш гарбуза!'
    ];

    const baseQuery = `
      SELECT p.id, p.username, p.level, p.glory, p.faction,
             t.power_level, t.endurance_level, t.speed_level, t.accuracy_level
      FROM players p
      LEFT JOIN training t ON t.player_id = p.id
      WHERE p.faction != $1 AND p.id != $2
        AND p.is_banned = false AND p.on_vacation = false
        AND p.level = $3
      ORDER BY RANDOM() LIMIT 1`;

    const [lower, equal, higher] = await Promise.all([
      pool.query(baseQuery, [me.faction, req.session.playerId, me.level - 1]),
      pool.query(baseQuery, [me.faction, req.session.playerId, me.level]),
      pool.query(baseQuery, [me.faction, req.session.playerId, me.level + 1]),
    ]);

    const slots = [
      { label: '⬇️ Слабший',  tier: 'lower', row: lower.rows[0]  },
      { label: '⚖️ Рівний',   tier: 'equal', row: equal.rows[0]  },
      { label: '⬆️ Сильніший',tier: 'higher', row: higher.rows[0] },
    ];

    const opponents = slots.map(s => s.row
      ? { ...s.row, tier: s.tier, tierLabel: s.label, slogan: slogans[Math.floor(Math.random() * slogans.length)] }
      : { id: null, tier: s.tier, tierLabel: s.label }
    );

    res.json({ opponents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Single round — called once per zone pick; session tracks fight state
router.post('/round', async (req, res) => {
  const { defenderId, zone } = req.body;
  const attackZone = VALID_ZONES.includes(zone) ? zone : 'body';

  try {
    let fight = req.session.fight;
    const isNewFight = !fight || fight.defenderId !== parseInt(defenderId);

    if (isNewFight) {
      const { rows: [attacker] } = await pool.query(
        'SELECT id, username, faction, hp, battles_today, battles_max, on_vacation, is_admin FROM players WHERE id=$1',
        [req.session.playerId]
      );
      if (!attacker) return res.status(404).json({ error: 'Гравця не знайдено' });
      if (!attacker.is_admin && attacker.battles_today >= attacker.battles_max)
        return res.status(400).json({ error: 'Ліміт боїв вичерпано на сьогодні' });
      if (attacker.on_vacation)
        return res.status(400).json({ error: 'Ви на канікулах' });

      const { rows: [defender] } = await pool.query(
        'SELECT id, username, faction, hp, level, on_vacation FROM players WHERE id=$1',
        [defenderId]
      );
      if (!defender) return res.status(404).json({ error: 'Суперника не знайдено' });
      if (defender.on_vacation) return res.status(400).json({ error: 'Суперник на канікулах' });
      if (defender.faction === attacker.faction)
        return res.status(400).json({ error: 'Не можна бити своїх!' });

      // Reserve the battle slot immediately
      await pool.query('UPDATE players SET battles_today = battles_today + 1 WHERE id=$1', [req.session.playerId]);

      fight = {
        defenderId:           parseInt(defenderId),
        defenderLevel:        defender.level,
        roundNum:             1,
        rounds:               [],
        attackerDamageDealt:  0,
        defenderDamageDealt:  0,
        attackerHpBefore:     attacker.hp,
        defenderHpBefore:     defender.hp,
        attackerName:         attacker.username,
        defenderName:         defender.username,
      };
    }

    if (fight.roundNum > 3)
      return res.status(400).json({ error: 'Бій вже завершено' });

    // Fetch live stats (HP may have dropped from previous rounds)
    const { rows: [attacker] } = await fetchPlayerWithStats(req.session.playerId);
    const { rows: [defender] } = await fetchPlayerWithStats(fight.defenderId);

    const { rows: aGifts } = await pool.query(
      'SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()',
      [req.session.playerId]
    );
    const { rows: dGifts } = await pool.query(
      'SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()',
      [fight.defenderId]
    );

    const aStats = calcStats(attacker, attacker, aGifts);
    const dStats = calcStats(defender, defender, dGifts);

    const defZone = VALID_ZONES[Math.floor(Math.random() * VALID_ZONES.length)];
    const aRoll   = rollDamage(aStats, dStats, attackZone);
    const dRoll   = rollDamage(dStats, aStats, defZone);

    // Apply HP damage for this round
    const { rows: [attackerAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [dRoll.damage, req.session.playerId]
    );
    const { rows: [defenderAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [aRoll.damage, fight.defenderId]
    );

    const roundData = {
      round:    fight.roundNum,
      attacker: { zone: attackZone, ...aRoll },
      defender: { zone: defZone,    ...dRoll },
    };

    fight.rounds.push(roundData);
    fight.attackerDamageDealt += aRoll.damage;
    fight.defenderDamageDealt += dRoll.damage;
    fight.roundNum++;

    // Early finish: someone knocked to 1 HP
    const attackerKnockedDown = attackerAfter.hp <= 1;
    const defenderKnockedDown = defenderAfter.hp <= 1;
    const earlyFinish = attackerKnockedDown || defenderKnockedDown;

    // Last round — finalise battle
    if (fight.roundNum > 3 || earlyFinish) {
      let attackerWon;
      if (defenderKnockedDown && !attackerKnockedDown)      attackerWon = true;
      else if (attackerKnockedDown && !defenderKnockedDown) attackerWon = false;
      else attackerWon = fight.attackerDamageDealt >= fight.defenderDamageDealt;
      const winnerId    = attackerWon ? attacker.id : defender.id;

      const { rows: [freshA] } = await pool.query('SELECT greens, gold FROM players WHERE id=$1', [req.session.playerId]);
      const { rows: [freshD] } = await pool.query('SELECT greens, gold FROM players WHERE id=$1', [fight.defenderId]);
      const loserGreens  = attackerWon ? freshD.greens : freshA.greens;
      const greensReward = loserGreens > 0 ? Math.max(10, Math.floor(loserGreens * 0.05)) : 0;
      const loserGold  = attackerWon ? freshD.gold : freshA.gold;
      const goldReward = loserGold > 0 && Math.random() < 0.30 ? Math.floor(loserGold * 0.02) : 0;

      // Glory only for attacker who beats equal or stronger opponent
      const attackerGlory = (attackerWon && fight.defenderLevel >= attacker.level) ? 1 : 0;

      await pool.query(
        `INSERT INTO battles (attacker_id,defender_id,attacker_damage,defender_damage,winner_id,zone,greens_reward,log)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [attacker.id, defender.id, fight.attackerDamageDealt, fight.defenderDamageDealt,
         winnerId, fight.rounds[0].attacker.zone, greensReward, JSON.stringify(fight.rounds)]
      );

      await pool.query(
        `UPDATE players SET wins=wins+$1, losses=losses+$2, glory=glory+$3,
           greens=GREATEST(0,greens+$4), gold=GREATEST(0,gold+$5),
           gold_earned_battle=gold_earned_battle+$6, gold_lost_battle=gold_lost_battle+$7,
           rating_points=GREATEST(0,rating_points+$8) WHERE id=$9`,
        [attackerWon?1:0, attackerWon?0:1, attackerGlory,
         attackerWon?greensReward:-greensReward,
         attackerWon?goldReward:-goldReward,
         attackerWon?goldReward:0, attackerWon?0:goldReward,
         attackerWon?10:-5, attacker.id]
      );
      await pool.query(
        `UPDATE players SET wins=wins+$1, losses=losses+$2,
           greens=GREATEST(0,greens+$3), gold=GREATEST(0,gold+$4),
           gold_earned_battle=gold_earned_battle+$5, gold_lost_battle=gold_lost_battle+$6,
           rating_points=GREATEST(0,rating_points+$7) WHERE id=$8`,
        [attackerWon?0:1, attackerWon?1:0,
         attackerWon?-greensReward:greensReward,
         attackerWon?-goldReward:goldReward,
         attackerWon?0:goldReward, attackerWon?goldReward:0,
         attackerWon?-5:10, defender.id]
      );

      // Get the inserted battle id for theft log
      const { rows: [lastBattle] } = await pool.query(
        `SELECT id FROM battles WHERE attacker_id=$1 ORDER BY id DESC LIMIT 1`, [attacker.id]
      );
      const battleId = lastBattle?.id || null;

      // Ring of the Thief effect (only if attacker won)
      let ringEffect = null;
      if (attackerWon) {
        ringEffect = await checkRingEffect(attacker.id, defender.id, battleId, req.app.locals.io);
      }

      delete req.session.fight;

      return res.json({
        roundData, roundNum: fight.rounds.length, isLast: true,
        rounds: fight.rounds,
        attackerDamageDealt: fight.attackerDamageDealt,
        defenderDamageDealt: fight.defenderDamageDealt,
        attackerWon, greensReward, goldReward, attackerGlory,
        attackerName: fight.attackerName,
        defenderName: fight.defenderName,
        attackerHpBefore: fight.attackerHpBefore, attackerHpAfter: attackerAfter.hp,
        defenderHpBefore: fight.defenderHpBefore, defenderHpAfter: defenderAfter.hp,
        ringEffect,
      });
    }

    req.session.fight = fight;
    return res.json({
      roundData, roundNum: fight.roundNum - 1, isLast: false,
      attackerHpAfter: attackerAfter.hp,
      defenderHpAfter: defenderAfter.hp,
      attackerName: fight.attackerName,
      defenderName: fight.defenderName,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Fight — accepts zones: ['head','body','legs'] (3 elements, one per round)
router.post('/fight', async (req, res) => {
  const { defenderId, zones } = req.body;

  // Validate and normalise the 3 zones
  const attackZones = Array.isArray(zones) && zones.length === 3
    ? zones.map(z => (VALID_ZONES.includes(z) ? z : 'body'))
    : ['body', 'body', 'body'];

  try {
    const { rows: [attacker] } = await fetchPlayerWithStats(req.session.playerId);
    if (!attacker) return res.status(404).json({ error: 'Гравця не знайдено' });
    if (!attacker.is_admin && attacker.battles_today >= attacker.battles_max)
      return res.status(400).json({ error: 'Ліміт боїв вичерпано на сьогодні' });
    if (attacker.on_vacation)
      return res.status(400).json({ error: 'Ви на канікулах' });

    const { rows: [defender] } = await fetchPlayerWithStats(defenderId);
    if (!defender) return res.status(404).json({ error: 'Суперника не знайдено' });
    if (defender.on_vacation)
      return res.status(400).json({ error: 'Суперник на канікулах' });
    if (defender.faction === attacker.faction)
      return res.status(400).json({ error: 'Не можна бити своїх!' });

    const { rows: attackerGiftRows } = await pool.query(
      'SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()',
      [req.session.playerId]
    );
    const { rows: defenderGiftRows } = await pool.query(
      'SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()',
      [defenderId]
    );

    const aStats = calcStats(attacker, attacker, attackerGiftRows);
    const dStats = calcStats(defender, defender, defenderGiftRows);

    const rounds = [];
    let attackerDamageDealt = 0;
    let defenderDamageDealt = 0;
    let aHpSim = attacker.hp;
    let dHpSim = defender.hp;

    for (let r = 0; r < 3; r++) {
      const attackZone = attackZones[r];
      const defZone    = VALID_ZONES[Math.floor(Math.random() * VALID_ZONES.length)];
      const aRoll      = rollDamage(aStats, dStats, attackZone);
      const dRoll      = rollDamage(dStats, aStats, defZone);

      attackerDamageDealt += aRoll.damage;
      defenderDamageDealt += dRoll.damage;
      aHpSim = Math.max(1, aHpSim - dRoll.damage);
      dHpSim = Math.max(1, dHpSim - aRoll.damage);

      rounds.push({
        round: r + 1,
        attacker: { zone: attackZone, ...aRoll },
        defender: { zone: defZone,    ...dRoll }
      });

      if (aHpSim <= 1 || dHpSim <= 1) break;
    }

    const aKO = aHpSim <= 1;
    const dKO = dHpSim <= 1;
    let attackerWon;
    if (dKO && !aKO)      attackerWon = true;
    else if (aKO && !dKO) attackerWon = false;
    else                  attackerWon = attackerDamageDealt >= defenderDamageDealt;
    const winnerId = attackerWon ? attacker.id : defender.id;

    const loserGreens = attackerWon ? defender.greens : attacker.greens;
    const greensReward = loserGreens > 0 ? Math.max(10, Math.floor(loserGreens * 0.05)) : 0;
    const loserGold  = attackerWon ? defender.gold : attacker.gold;
    const goldReward = loserGold > 0 && Math.random() < 0.30 ? Math.floor(loserGold * 0.02) : 0;

    // Deduct HP — attacker loses defenderDamageDealt, defender loses attackerDamageDealt
    const { rows: [attackerAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [defenderDamageDealt, attacker.id]
    );
    const { rows: [defenderAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [attackerDamageDealt, defender.id]
    );

    // Save battle record
    await pool.query(
      `INSERT INTO battles
         (attacker_id, defender_id, attacker_damage, defender_damage, winner_id, zone, greens_reward, log)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [attacker.id, defender.id, attackerDamageDealt, defenderDamageDealt,
       winnerId, attackZones[0], greensReward, JSON.stringify(rounds)]
    );

    // Attacker: wins/losses/glory/rating + greens/gold change
    await pool.query(
      `UPDATE players SET
         battles_today       = battles_today + 1,
         wins                = wins    + $1,
         losses              = losses  + $2,
         glory               = glory   + $3,
         greens              = GREATEST(0, greens + $4),
         gold                = GREATEST(0, gold   + $5),
         gold_earned_battle  = gold_earned_battle + $6,
         gold_lost_battle    = gold_lost_battle   + $7,
         rating_points       = GREATEST(0, rating_points + $8)
       WHERE id = $9`,
      [
        attackerWon ? 1 : 0,
        attackerWon ? 0 : 1,
        attackerWon ? 1 : 0,
        attackerWon ? greensReward : -greensReward,
        attackerWon ? goldReward : -goldReward,
        attackerWon ? goldReward : 0,
        attackerWon ? 0 : goldReward,
        attackerWon ? 10 : -5,
        attacker.id
      ]
    );

    // Defender: wins/losses/rating + greens/gold change
    await pool.query(
      `UPDATE players SET
         wins               = wins   + $1,
         losses             = losses + $2,
         greens             = GREATEST(0, greens + $3),
         gold               = GREATEST(0, gold   + $4),
         gold_earned_battle = gold_earned_battle + $5,
         gold_lost_battle   = gold_lost_battle   + $6,
         rating_points      = GREATEST(0, rating_points + $7)
       WHERE id = $8`,
      [
        attackerWon ? 0 : 1,
        attackerWon ? 1 : 0,
        attackerWon ? -greensReward : greensReward,
        attackerWon ? -goldReward : goldReward,
        attackerWon ? 0 : goldReward,
        attackerWon ? goldReward : 0,
        attackerWon ? -5 : 10,
        defender.id
      ]
    );

    const { rows: [lastBattle2] } = await pool.query(
      `SELECT id FROM battles WHERE attacker_id=$1 ORDER BY id DESC LIMIT 1`, [attacker.id]
    );
    let ringEffect = null;
    if (attackerWon) {
      ringEffect = await checkRingEffect(attacker.id, defender.id, lastBattle2?.id || null, req.app.locals.io);
    }

    res.json({
      success: true,
      rounds,
      attackerDamageDealt,
      defenderDamageDealt,
      attackerWon,
      greensReward,
      goldReward,
      attackerName:   attacker.username,
      defenderName:   defender.username,
      attackerHpBefore: attacker.hp,
      attackerHpAfter:  attackerAfter.hp,
      defenderHpBefore: defender.hp,
      defenderHpAfter:  defenderAfter.hp,
      ringEffect,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
