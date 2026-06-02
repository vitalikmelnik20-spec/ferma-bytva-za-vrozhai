const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { getClanBonuses } = require('../utils/clanBonuses');
const { updateClanTask } = require('../utils/clanTasks');
const { PET_CATALOG } = require('./pets');
const petCombat = require('../utils/petCombat');

// Завантажити тваринку гравця для бою (лише якщо активна і жива)
async function fetchPetForBattle(playerId) {
  const { rows: [pet] } = await pool.query(
    'SELECT * FROM pets WHERE player_id=$1 AND is_active=true AND is_dead=false',
    [playerId]
  );
  if (!pet) return null;

  const { rows: equipment } = await pool.query(
    'SELECT * FROM pet_equipment WHERE pet_id=$1', [pet.id]
  );
  const eqBonus = (slot) => equipment.find(e => e.slot === slot)?.bonus_value || 0;
  const catalog = PET_CATALOG.find(p => p.type === pet.pet_type) || {};

  return {
    id:        pet.id,
    name:      pet.name,
    icon:      catalog.icon || '',
    ability:   catalog.ability || null,
    power:     pet.power     + eqBonus('collar'),
    endurance: pet.endurance + eqBonus('amulet'),
    speed:     pet.speed,
    accuracy:  pet.accuracy  + eqBonus('boots'),
    hp_current: pet.hp_current,
    hp_max:    pet.hp_max + eqBonus('armor'),
  };
}

router.use(requireAuth);

const ZONE_BONUS = { head: 1.3, body: 1.0, legs: 0.8 };
const VALID_ZONES = ['head', 'body', 'legs'];

async function getRuneBonuses(playerId) {
  const { rows: [row] } = await pool.query(
    `SELECT COALESCE(SUM(it.power_bonus),0)::INTEGER     AS rune_power,
            COALESCE(SUM(it.endurance_bonus),0)::INTEGER AS rune_endurance,
            COALESCE(SUM(it.speed_bonus),0)::INTEGER     AS rune_speed,
            COALESCE(SUM(it.accuracy_bonus),0)::INTEGER  AS rune_accuracy
     FROM item_runes ir
     JOIN inventory eq   ON eq.id = ir.inv_id        AND eq.player_id=$1 AND eq.is_equipped=true
     JOIN inventory rinv ON rinv.id = ir.rune_inv_id  AND rinv.player_id=$1
     JOIN items it ON it.id = rinv.item_id`,
    [playerId]
  );
  return row || { rune_power: 0, rune_endurance: 0, rune_speed: 0, rune_accuracy: 0 };
}

async function getPotionBonuses(playerId) {
  const { rows } = await pool.query(
    `SELECT effect_type, effect_value FROM active_potions
     WHERE player_id=$1
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (battles_left IS NULL OR battles_left > 0)`,
    [playerId]
  );
  const b = { power: 0, endurance: 0, speed: 0, accuracy: 0, damageReducePct: 0 };
  for (const p of rows) {
    if      (p.effect_type === 'power')        b.power        += p.effect_value;
    else if (p.effect_type === 'endurance')    b.endurance    += p.effect_value;
    else if (p.effect_type === 'speed')        b.speed        += p.effect_value;
    else if (p.effect_type === 'accuracy')     b.accuracy     += p.effect_value;
    else if (p.effect_type === 'damage_reduce') b.damageReducePct += p.effect_value;
  }
  return b;
}

async function getRingTalismanBonuses(playerId) {
  const { rows: rings } = await pool.query(
    `SELECT ru.bonus_value, it.name
     FROM ring_upgrades ru
     JOIN inventory inv ON inv.id = ru.inv_id AND inv.is_equipped=true
     JOIN items it ON it.id = inv.item_id
     WHERE ru.player_id=$1`,
    [playerId]
  );
  const { rows: talis } = await pool.query(
    `SELECT tu.bonus_pct, it.name
     FROM talisman_upgrades tu
     JOIN inventory inv ON inv.id = tu.inv_id AND inv.is_equipped=true
     JOIN items it ON it.id = inv.item_id
     WHERE tu.player_id=$1`,
    [playerId]
  );
  const b = { taliPower: 0, taliEndurance: 0, doubleStrike: 0, critBonus: 0, shadowProtect: 0 };
  for (const r of rings) {
    if (r.name === 'Кільце Берсерка') b.doubleStrike  = r.bonus_value;
    if (r.name === 'Кільце Удачі')   b.critBonus     = r.bonus_value;
  }
  for (const t of talis) {
    if (t.name === 'Талісман Воїна')     b.taliPower     = t.bonus_pct;
    if (t.name === 'Талісман Захисника') b.taliEndurance = t.bonus_pct;
    if (t.name === 'Талісман Тіні')      b.shadowProtect = t.bonus_pct;
  }
  return b;
}

async function decrementPotions(attackerId, defenderId) {
  await Promise.all([
    pool.query(
      `UPDATE active_potions SET battles_left = battles_left - 1
       WHERE player_id=$1 AND battles_left IS NOT NULL AND battles_left > 0`,
      [attackerId]
    ),
    pool.query(
      `UPDATE active_potions SET battles_left = battles_left - 1
       WHERE player_id=$1 AND battles_left IS NOT NULL AND battles_left > 0`,
      [defenderId]
    ),
  ]);
  await pool.query(`DELETE FROM active_potions WHERE battles_left IS NOT NULL AND battles_left <= 0`);
}

// Ring of the Thief: check if equipped ring triggers theft after a win
async function checkRingEffect(winnerId, loserId, battleId, io) {
  const { rows: [ru] } = await pool.query(
    `SELECT ru.* FROM ring_upgrades ru
     JOIN inventory inv ON inv.id = ru.inv_id AND inv.is_equipped=true
     JOIN items it ON it.id = inv.item_id AND it.name='Кільце злодія'
     WHERE ru.player_id=$1`,
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

function calcStats(player, training, gifts, runes) {
  const luckCount  = gifts.filter(g => g.is_luck_amulet).length;
  const luckMult   = 1 + luckCount * 0.5;
  const statGifts  = gifts.filter(g => !g.is_luck_amulet);

  const giftPower     = Math.floor(statGifts.reduce((s, g) => s + (g.power_bonus     || 0), 0) * luckMult);
  const giftEndurance = Math.floor(statGifts.reduce((s, g) => s + (g.endurance_bonus || 0), 0) * luckMult);
  const giftSpeed     = Math.floor(statGifts.reduce((s, g) => s + (g.speed_bonus     || 0), 0) * luckMult);
  const giftAccuracy  = Math.floor(statGifts.reduce((s, g) => s + (g.accuracy_bonus  || 0), 0) * luckMult);

  return {
    power:     training.power_level     + player.equip_power     + giftPower     + (runes?.rune_power     || 0),
    endurance: training.endurance_level + player.equip_endurance + giftEndurance + (runes?.rune_endurance || 0),
    speed:     training.speed_level     + player.equip_speed     + giftSpeed     + (runes?.rune_speed     || 0),
    accuracy:  training.accuracy_level  + player.equip_accuracy  + giftAccuracy  + (runes?.rune_accuracy  || 0),
  };
}

function rollDamage(attackerStats, defenderStats, zone, extraCritPct = 0) {
  const hitChance = Math.min(0.95, Math.max(0.3,
    0.5 + (attackerStats.accuracy - defenderStats.endurance) * 0.01
  ));
  if (Math.random() > hitChance) return { damage: 0, type: 'miss' };

  const zoneBonus = ZONE_BONUS[zone] || 1.0;
  const random    = 0.8 + Math.random() * 0.4;
  const isCrit    = Math.random() < (0.1 + extraCritPct / 100);
  const crit      = isCrit ? 1.5 : 1.0;
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

async function addClanWarDamage(attackerId, defenderId, attackerDmg, defenderDmg) {
  try {
    const { rows } = await pool.query(
      'SELECT player_id, clan_id FROM clan_members WHERE player_id IN ($1,$2)',
      [attackerId, defenderId]
    );
    if (rows.length < 2) return;
    const aClanId = rows.find(r => r.player_id == attackerId)?.clan_id;
    const dClanId = rows.find(r => r.player_id == defenderId)?.clan_id;
    if (!aClanId || !dClanId || aClanId === dClanId) return;
    const { rows: [war] } = await pool.query(
      `SELECT id, attacker_id FROM clan_wars
       WHERE status='active' AND ends_at > NOW()
         AND ((attacker_id=$1 AND defender_id=$2) OR (attacker_id=$2 AND defender_id=$1))`,
      [aClanId, dClanId]
    );
    if (!war) return;
    if (war.attacker_id === aClanId) {
      await pool.query(
        'UPDATE clan_wars SET attacker_dmg=attacker_dmg+$1, defender_dmg=defender_dmg+$2 WHERE id=$3',
        [attackerDmg, defenderDmg, war.id]
      );
    } else {
      await pool.query(
        'UPDATE clan_wars SET attacker_dmg=attacker_dmg+$1, defender_dmg=defender_dmg+$2 WHERE id=$3',
        [defenderDmg, attackerDmg, war.id]
      );
    }
  } catch (err) { console.error('addClanWarDamage:', err.message); }
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
             t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
             pet.pet_type AS pet_type, pet.name AS pet_name, pet.is_active AS pet_active, pet.is_dead AS pet_dead
      FROM players p
      LEFT JOIN training t ON t.player_id = p.id
      LEFT JOIN pets pet ON pet.player_id = p.id
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
      { label: 'Слабший',   tier: 'lower', row: lower.rows[0]  },
      { label: 'Рівний',    tier: 'equal', row: equal.rows[0]  },
      { label: 'Сильніший', tier: 'higher', row: higher.rows[0] },
    ];

    const opponents = slots.map(s => {
      if (!s.row) return { id: null, tier: s.tier, tierLabel: s.label };
      const cat = s.row.pet_type ? (PET_CATALOG.find(p => p.type === s.row.pet_type) || {}) : {};
      const hasPet = s.row.pet_type && s.row.pet_active && !s.row.pet_dead;
      return {
        ...s.row,
        tier: s.tier, tierLabel: s.label,
        slogan: slogans[Math.floor(Math.random() * slogans.length)],
        pet_icon: hasPet ? cat.icon : null,
        pet_name: hasPet ? s.row.pet_name : null,
      };
    });

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

      const [aPet, dPet] = await Promise.all([
        fetchPetForBattle(req.session.playerId),
        fetchPetForBattle(parseInt(defenderId)),
      ]);

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
        // Тваринки
        aPet,
        dPet,
        aPetHp:             aPet ? aPet.hp_current : 0,
        dPetHp:             dPet ? dPet.hp_current : 0,
        aPetAbilityUsed:    false,
        dPetAbilityUsed:    false,
        aPetAbilityProcs:   0,
        dPetAbilityProcs:   0,
        aPetTotalDamage:    0,
        dPetTotalDamage:    0,
      };
    }

    if (fight.roundNum > 3)
      return res.status(400).json({ error: 'Бій вже завершено' });

    // Fetch live stats (HP may have dropped from previous rounds)
    const { rows: [attacker] } = await fetchPlayerWithStats(req.session.playerId);
    const { rows: [defender] } = await fetchPlayerWithStats(fight.defenderId);

    const [{ rows: aGifts }, { rows: dGifts }, aRunes, dRunes, aPotions, dPotions, aRingTali, dRingTali] = await Promise.all([
      pool.query('SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()', [req.session.playerId]),
      pool.query('SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()', [fight.defenderId]),
      getRuneBonuses(req.session.playerId),
      getRuneBonuses(fight.defenderId),
      getPotionBonuses(req.session.playerId),
      getPotionBonuses(fight.defenderId),
      getRingTalismanBonuses(req.session.playerId),
      getRingTalismanBonuses(fight.defenderId),
    ]);

    const aStats = calcStats(attacker, attacker, aGifts, aRunes);
    const dStats = calcStats(defender, defender, dGifts, dRunes);

    aStats.power     += aPotions.power     + aRingTali.taliPower;
    aStats.endurance += aPotions.endurance + aRingTali.taliEndurance;
    aStats.speed     += aPotions.speed;
    aStats.accuracy  += aPotions.accuracy;
    dStats.power     += dPotions.power     + dRingTali.taliPower;
    dStats.endurance += dPotions.endurance + dRingTali.taliEndurance;
    dStats.speed     += dPotions.speed;
    dStats.accuracy  += dPotions.accuracy;

    const defZone = VALID_ZONES[Math.floor(Math.random() * VALID_ZONES.length)];
    const aRoll   = rollDamage(aStats, dStats, attackZone, aRingTali.critBonus);
    const dRoll   = rollDamage(dStats, aStats, defZone,    dRingTali.critBonus);

    if (dPotions.damageReducePct > 0 && aRoll.type !== 'miss')
      aRoll.damage = Math.max(1, Math.floor(aRoll.damage * (1 - dPotions.damageReducePct / 100)));
    if (aPotions.damageReducePct > 0 && dRoll.type !== 'miss')
      dRoll.damage = Math.max(1, Math.floor(dRoll.damage * (1 - aPotions.damageReducePct / 100)));

    if (aRingTali.doubleStrike > 0 && aRoll.type !== 'miss' && Math.random() < aRingTali.doubleStrike / 100) {
      aRoll.damage *= 2;
      aRoll.type = 'double';
    }
    if (dRingTali.doubleStrike > 0 && dRoll.type !== 'miss' && Math.random() < dRingTali.doubleStrike / 100) {
      dRoll.damage *= 2;
      dRoll.type = 'double';
    }

    // Apply HP damage for this round
    const { rows: [attackerAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [dRoll.damage, req.session.playerId]
    );
    const { rows: [defenderAfter] } = await pool.query(
      'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2 RETURNING hp',
      [aRoll.damage, fight.defenderId]
    );

    // ── §5 Бій тваринок ──────────────────────────────────────────────────────
    let aPetAction = null;
    let dPetAction = null;

    // Атака тваринки атакера
    if (fight.aPet && fight.aPetHp > 0) {
      const hit = petCombat.checkPetHit(fight.aPet.accuracy);
      if (!hit) {
        aPetAction = { type: 'miss', damage: 0 };
      } else {
        const { damage, abilityProc } = petCombat.calcPetDamage(
          fight.aPet.power, fight.aPet.ability, fight.aPetAbilityUsed
        );
        if (abilityProc && fight.aPet.ability === 'fire_breath') fight.aPetAbilityUsed = true;
        if (abilityProc) fight.aPetAbilityProcs++;

        const hasDPet = fight.dPet && fight.dPetHp > 0;
        if (hasDPet) {
          // Ворожа тваринка — перевірка блоку Золотого Орла
          const blocked = petCombat.checkEagleShield(fight.dPet.ability);
          const finalDmg = blocked ? 0 : petCombat.calcPetDefense(fight.dPet.endurance, damage);
          if (!blocked) fight.dPetHp = Math.max(0, fight.dPetHp - finalDmg);
          aPetAction = { type: blocked ? 'blocked' : (abilityProc ? 'ability' : 'hit'),
                         damage: finalDmg, target: 'enemyPet', abilityProc };
          fight.aPetTotalDamage += finalDmg;
          fight.attackerDamageDealt += finalDmg;
        } else {
          // Б'є ворожого гравця напряму
          const finalDmg = damage;
          await pool.query(
            'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2',
            [finalDmg, fight.defenderId]
          );
          aPetAction = { type: abilityProc ? 'ability' : 'hit', damage: finalDmg, target: 'enemy', abilityProc };
          fight.aPetTotalDamage += finalDmg;
          fight.attackerDamageDealt += finalDmg;
        }
      }
    }

    // Атака тваринки захисника
    if (fight.dPet && fight.dPetHp > 0) {
      const hit = petCombat.checkPetHit(fight.dPet.accuracy);
      if (!hit) {
        dPetAction = { type: 'miss', damage: 0 };
      } else {
        const { damage, abilityProc } = petCombat.calcPetDamage(
          fight.dPet.power, fight.dPet.ability, fight.dPetAbilityUsed
        );
        if (abilityProc && fight.dPet.ability === 'fire_breath') fight.dPetAbilityUsed = true;
        if (abilityProc) fight.dPetAbilityProcs++;

        const hasAPet = fight.aPet && fight.aPetHp > 0;
        if (hasAPet) {
          const blocked = petCombat.checkEagleShield(fight.aPet.ability);
          const finalDmg = blocked ? 0 : petCombat.calcPetDefense(fight.aPet.endurance, damage);
          if (!blocked) fight.aPetHp = Math.max(0, fight.aPetHp - finalDmg);
          dPetAction = { type: blocked ? 'blocked' : (abilityProc ? 'ability' : 'hit'),
                         damage: finalDmg, target: 'myPet', abilityProc };
          fight.dPetTotalDamage += finalDmg;
          fight.defenderDamageDealt += finalDmg;
        } else {
          const finalDmg = damage;
          await pool.query(
            'UPDATE players SET hp = GREATEST(1, hp - $1) WHERE id=$2',
            [finalDmg, req.session.playerId]
          );
          dPetAction = { type: abilityProc ? 'ability' : 'hit', damage: finalDmg, target: 'myPlayer', abilityProc };
          fight.dPetTotalDamage += finalDmg;
          fight.defenderDamageDealt += finalDmg;
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const roundData = {
      round:    fight.roundNum,
      attacker: { zone: attackZone, ...aRoll },
      defender: { zone: defZone,    ...dRoll },
      aPetAction,
      dPetAction,
      aPetHp:    fight.aPetHp,
      dPetHp:    fight.dPetHp,
      aPetName:  fight.aPet?.name  || null,
      dPetName:  fight.dPet?.name  || null,
      aPetHpMax: fight.aPet?.hp_max || null,
      dPetHpMax: fight.dPet?.hp_max || null,
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
      let greensReward = loserGreens > 0 ? Math.max(10, Math.floor(loserGreens * 0.05)) : 0;
      const loserGold  = attackerWon ? freshD.gold : freshA.gold;
      let goldReward = loserGold > 0 && Math.random() < 0.30 ? Math.floor(loserGold * 0.02) : 0;

      // Талісман Тіні: loser has a chance to protect their reward
      const loserShadow = attackerWon ? dRingTali.shadowProtect : aRingTali.shadowProtect;
      if (loserShadow > 0 && Math.random() < loserShadow / 100) {
        greensReward = 0;
        goldReward   = 0;
      }

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

      await decrementPotions(attacker.id, defender.id);

      // ── §5 Зберегти результати тваринок ──────────────────────────────────
      const aPetDied = fight.aPet && fight.aPetHp <= 0;
      const dPetDied = fight.dPet && fight.dPetHp <= 0;
      await Promise.all([
        fight.aPet ? pool.query(
          'UPDATE pets SET hp_current=$1, is_dead=$2 WHERE id=$3',
          [Math.max(0, fight.aPetHp), aPetDied, fight.aPet.id]
        ) : Promise.resolve(),
        fight.dPet ? pool.query(
          'UPDATE pets SET hp_current=$1, is_dead=$2 WHERE id=$3',
          [Math.max(0, fight.dPetHp), dPetDied, fight.dPet.id]
        ) : Promise.resolve(),
        // pet_stats для атакера (§9: ability_procs, pets_killed)
        fight.aPet ? pool.query(
          `INSERT INTO pet_stats (pet_id, battles_participated, wins, total_damage, deaths, pets_killed, ability_procs)
           VALUES ($1,1,$2,$3,$4,$5,$6)
           ON CONFLICT (pet_id) DO UPDATE SET
             battles_participated = pet_stats.battles_participated+1,
             wins         = pet_stats.wins         + $2,
             total_damage = pet_stats.total_damage + $3,
             deaths       = pet_stats.deaths       + $4,
             pets_killed  = pet_stats.pets_killed  + $5,
             ability_procs= pet_stats.ability_procs+ $6`,
          [fight.aPet.id, attackerWon?1:0, fight.aPetTotalDamage,
           aPetDied?1:0, dPetDied?1:0, fight.aPetAbilityProcs || 0]
        ) : Promise.resolve(),
        // pet_stats для захисника
        fight.dPet ? pool.query(
          `INSERT INTO pet_stats (pet_id, battles_participated, wins, total_damage, deaths, pets_killed, ability_procs)
           VALUES ($1,1,$2,$3,$4,$5,$6)
           ON CONFLICT (pet_id) DO UPDATE SET
             battles_participated = pet_stats.battles_participated+1,
             wins         = pet_stats.wins         + $2,
             total_damage = pet_stats.total_damage + $3,
             deaths       = pet_stats.deaths       + $4,
             pets_killed  = pet_stats.pets_killed  + $5,
             ability_procs= pet_stats.ability_procs+ $6`,
          [fight.dPet.id, attackerWon?0:1, fight.dPetTotalDamage,
           dPetDied?1:0, aPetDied?1:0, fight.dPetAbilityProcs || 0]
        ) : Promise.resolve(),
      ]);
      // ─────────────────────────────────────────────────────────────────────

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
        // Тваринки
        aPet: fight.aPet ? { name: fight.aPet.name, icon: fight.aPet.icon,
          totalDamage: fight.aPetTotalDamage, died: aPetDied } : null,
        dPet: fight.dPet ? { name: fight.dPet.name, icon: fight.dPet.icon,
          totalDamage: fight.dPetTotalDamage, died: dPetDied } : null,
        petResult: (fight.aPet || fight.dPet) ? {
          attackerPetAlive:   !aPetDied,
          defenderPetAlive:   !dPetDied,
          attackerPetDamage:  fight.aPetTotalDamage,
          defenderPetDamage:  fight.dPetTotalDamage,
        } : null,
        attackerPlayerDamage: fight.attackerDamageDealt - fight.aPetTotalDamage,
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

    const [{ rows: attackerGiftRows }, { rows: defenderGiftRows }, aRuneB, dRuneB, aBonuses, dBonuses, aPotions, dPotions, aRingTali, dRingTali] = await Promise.all([
      pool.query('SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()', [req.session.playerId]),
      pool.query('SELECT * FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()', [defenderId]),
      getRuneBonuses(req.session.playerId),
      getRuneBonuses(defenderId),
      getClanBonuses(attacker.id),
      getClanBonuses(defender.id),
      getPotionBonuses(req.session.playerId),
      getPotionBonuses(defenderId),
      getRingTalismanBonuses(req.session.playerId),
      getRingTalismanBonuses(defenderId),
    ]);

    const aStats = calcStats(attacker, attacker, attackerGiftRows, aRuneB);
    const dStats = calcStats(defender, defender, defenderGiftRows, dRuneB);

    // Clan building bonuses: Кузня +5 міць/рів, Вежа +5 стійкість/рів
    aStats.power     += (aBonuses.smithy || 0) * 5;
    aStats.endurance += (aBonuses.tower  || 0) * 5;
    dStats.power     += (dBonuses.smithy || 0) * 5;
    dStats.endurance += (dBonuses.tower  || 0) * 5;

    // Potion stat bonuses + talisman stat bonuses
    aStats.power     += aPotions.power     + aRingTali.taliPower;
    aStats.endurance += aPotions.endurance + aRingTali.taliEndurance;
    aStats.speed     += aPotions.speed;
    aStats.accuracy  += aPotions.accuracy;
    dStats.power     += dPotions.power     + dRingTali.taliPower;
    dStats.endurance += dPotions.endurance + dRingTali.taliEndurance;
    dStats.speed     += dPotions.speed;
    dStats.accuracy  += dPotions.accuracy;

    const rounds = [];
    let attackerDamageDealt = 0;
    let defenderDamageDealt = 0;
    let aHpSim = attacker.hp;
    let dHpSim = defender.hp;

    for (let r = 0; r < 3; r++) {
      const attackZone = attackZones[r];
      const defZone    = VALID_ZONES[Math.floor(Math.random() * VALID_ZONES.length)];
      const aRoll      = rollDamage(aStats, dStats, attackZone, aRingTali.critBonus);
      const dRoll      = rollDamage(dStats, aStats, defZone,    dRingTali.critBonus);

      // Damage reduce potions
      if (dPotions.damageReducePct > 0 && aRoll.type !== 'miss')
        aRoll.damage = Math.max(1, Math.floor(aRoll.damage * (1 - dPotions.damageReducePct / 100)));
      if (aPotions.damageReducePct > 0 && dRoll.type !== 'miss')
        dRoll.damage = Math.max(1, Math.floor(dRoll.damage * (1 - aPotions.damageReducePct / 100)));

      if (aRingTali.doubleStrike > 0 && aRoll.type !== 'miss' && Math.random() < aRingTali.doubleStrike / 100) {
        aRoll.damage *= 2;
        aRoll.type = 'double';
      }
      if (dRingTali.doubleStrike > 0 && dRoll.type !== 'miss' && Math.random() < dRingTali.doubleStrike / 100) {
        dRoll.damage *= 2;
        dRoll.type = 'double';
      }

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
    let greensReward = loserGreens > 0 ? Math.max(10, Math.floor(loserGreens * 0.05)) : 0;
    const loserGold  = attackerWon ? defender.gold : attacker.gold;
    let goldReward = loserGold > 0 && Math.random() < 0.30 ? Math.floor(loserGold * 0.02) : 0;

    // Талісман Тіні: loser has a chance to protect their reward
    const loserShadow = attackerWon ? dRingTali.shadowProtect : aRingTali.shadowProtect;
    if (loserShadow > 0 && Math.random() < loserShadow / 100) {
      greensReward = 0;
      goldReward   = 0;
    }

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

    // Зал Слави: +1 слава за рівень будівлі для переможця
    const gloryBonus = attackerWon ? (aBonuses.hall || 0) : (dBonuses.hall || 0);
    if (gloryBonus > 0) {
      await pool.query('UPDATE players SET glory=glory+$1 WHERE id=$2', [gloryBonus, winnerId]);
    }

    const { rows: [lastBattle2] } = await pool.query(
      `SELECT id FROM battles WHERE attacker_id=$1 ORDER BY id DESC LIMIT 1`, [attacker.id]
    );
    let ringEffect = null;
    if (attackerWon) {
      ringEffect = await checkRingEffect(attacker.id, defender.id, lastBattle2?.id || null, req.app.locals.io);
    }

    // Кланові завдання та кланова війна
    await Promise.all([
      attackerWon ? updateClanTask(attacker.id, 'win_battles', 1) : Promise.resolve(),
      addClanWarDamage(attacker.id, defender.id, attackerDamageDealt, defenderDamageDealt),
    ]);
    if (attackerWon) {
      const { updateDailyQuestProgress } = require('./daily');
      await updateDailyQuestProgress(attacker.id, 'battles', 1);
    }

    await decrementPotions(attacker.id, defender.id);

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
