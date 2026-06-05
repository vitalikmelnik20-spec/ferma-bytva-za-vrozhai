const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { getClanBonuses } = require('../utils/clanBonuses');
const { updateClanTask } = require('../utils/clanTasks');

router.use(requireAuth);

// Get own plots + plants reference
router.get('/', async (req, res) => {
  try {
    const plots = await pool.query(
      `SELECT pl.*, p.name as plant_name, p.emoji as plant_emoji,
              p.greens_reward, p.exp_reward,
              p.frame_color as plant_frame_color, p.is_boss as plant_is_boss,
              COALESCE(pl.water_count,0) as water_count,
              pl.planted_seconds,
              CASE WHEN pl.status='growing'
                AND COALESCE(pl.water_count,0) < 3
                AND pl.planted_seconds > 0
                AND EXTRACT(EPOCH FROM (NOW()-pl.planted_at))
                    >= pl.planted_seconds * (COALESCE(pl.water_count,0)+1) * 0.3
              THEN true ELSE false END as can_water,
              EXTRACT(EPOCH FROM (pl.ready_at - NOW())) as seconds_left
       FROM plots pl
       LEFT JOIN plants p ON p.id = pl.plant_id
       WHERE pl.player_id = $1
       ORDER BY pl.slot_index`,
      [req.session.playerId]
    );

    // Auto-mark ready plots
    await pool.query(
      `UPDATE plots SET status='ready'
       WHERE player_id=$1 AND status='growing' AND ready_at <= NOW()`,
      [req.session.playerId]
    );

    const plantsRef = await pool.query(
      `SELECT * FROM plants WHERE min_level <= (SELECT level FROM players WHERE id=$1) ORDER BY min_level`,
      [req.session.playerId]
    );

    const plotCount = await pool.query(
      'SELECT COUNT(*) FROM plots WHERE player_id=$1',
      [req.session.playerId]
    );

    res.json({
      plots: plots.rows,
      plants: plantsRef.rows,
      plotCount: parseInt(plotCount.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Buy new plot
router.post('/buy', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      'SELECT gold, level FROM players WHERE id=$1',
      [req.session.playerId]
    );
    const { rows: countRow } = await pool.query(
      'SELECT COUNT(*) FROM plots WHERE player_id=$1',
      [req.session.playerId]
    );
    const currentCount = parseInt(countRow[0].count);
    const cost = 200 * (currentCount + 1);

    if (player.gold < cost)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost}` });

    await pool.query('UPDATE players SET gold = gold - $1 WHERE id=$2', [cost, req.session.playerId]);
    await pool.query(
      'INSERT INTO plots (player_id, slot_index) VALUES ($1, $2)',
      [req.session.playerId, currentCount]
    );

    res.json({ success: true, cost, newSlot: currentCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Plant seed
router.post('/:plotId/plant', async (req, res) => {
  const { plantId } = req.body;
  try {
    const { rows: [plot] } = await pool.query(
      'SELECT * FROM plots WHERE id=$1 AND player_id=$2',
      [req.params.plotId, req.session.playerId]
    );
    if (!plot) return res.status(404).json({ error: 'Грядку не знайдено' });
    if (plot.status !== 'empty') return res.status(400).json({ error: 'Грядка не порожня' });

    const { rows: [plant] } = await pool.query('SELECT * FROM plants WHERE id=$1', [plantId]);
    if (!plant) return res.status(404).json({ error: 'Рослину не знайдено' });

    const { rows: [player] } = await pool.query(
      'SELECT greens, gold, level FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.level < plant.min_level)
      return res.status(400).json({ error: `Потрібен рівень ${plant.min_level}` });
    if (plant.is_boss && plant.gold_price) {
      if (player.gold < plant.gold_price)
        return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${plant.gold_price} 🥇` });
    } else {
      if (player.greens < plant.seed_price)
        return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${plant.seed_price}` });
    }

    const { rows: [farmerTali] } = await pool.query(
      `SELECT tu.bonus_pct FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id AND inv.is_equipped=true AND inv.player_id=$1
       JOIN items it ON it.id = inv.item_id AND it.name='Талісман Фермера'
       WHERE tu.player_id=$1`,
      [req.session.playerId]
    );
    const farmerReduction = Math.max(0, farmerTali ? farmerTali.bonus_pct : 0);
    const growthMinutes = Math.ceil(plant.growth_minutes * (1 - farmerReduction / 100));
    if (plant.is_boss && plant.gold_price) {
      await pool.query('UPDATE players SET gold=gold-$1, plants_planted=plants_planted+1 WHERE id=$2', [plant.gold_price, req.session.playerId]);
    } else {
      await pool.query('UPDATE players SET greens=greens-$1, plants_planted=plants_planted+1 WHERE id=$2', [plant.seed_price, req.session.playerId]);
    }
    updateClanTask(req.session.playerId, 'plant_seeds', 1);
    const { rows: [updated] } = await pool.query(
      `UPDATE plots SET plant_id=$1, planted_at=NOW(),
         ready_at=NOW() + ($2 * INTERVAL '1 minute'),
         status='growing', water_count=0, planted_seconds=$3,
         watered=false, watered_by=NULL
       WHERE id=$4 RETURNING ready_at`,
      [plantId, growthMinutes, growthMinutes * 60, req.params.plotId]
    );

    res.json({ success: true, readyAt: updated.ready_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Water own plot (up to 3 times at 30/60/90% elapsed, each -15% remaining)
router.post('/:plotId/water', async (req, res) => {
  try {
    const { rows: [plot] } = await pool.query(
      `SELECT *, EXTRACT(EPOCH FROM (NOW()-planted_at)) as elapsed_secs
       FROM plots WHERE id=$1 AND player_id=$2`,
      [req.params.plotId, req.session.playerId]
    );
    if (!plot)                      return res.status(404).json({ error: 'Грядку не знайдено' });
    if (plot.status !== 'growing')  return res.status(400).json({ error: 'Грядка не росте' });

    const waterCount   = plot.water_count    || 0;
    const plantedSecs  = plot.planted_seconds || 0;
    if (waterCount >= 3) return res.status(400).json({ error: 'Вже полито максимум 3 рази' });
    if (!plantedSecs)    return res.status(400).json({ error: 'Посади рослину заново — дані про час відсутні' });

    const threshold = plantedSecs * (waterCount + 1) * 0.3;
    if (plot.elapsed_secs < threshold) {
      const waitSecs = Math.ceil(threshold - plot.elapsed_secs);
      const m = Math.ceil(waitSecs / 60);
      return res.status(400).json({ error: `Ще рано. Зачекай ще ~${m} хв` });
    }

    await pool.query(
      `UPDATE plots SET water_count=water_count+1, watered=true,
         ready_at = NOW() + (ready_at - NOW()) * 0.85
       WHERE id=$1`,
      [req.params.plotId]
    );
    await pool.query('UPDATE players SET plots_watered=plots_watered+1 WHERE id=$1', [req.session.playerId]);

    res.json({ success: true, waterCount: waterCount + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Water friend's plot (up to 3 times, +5 greens reward)
router.post('/friend/:plotId/water', async (req, res) => {
  try {
    const { rows: [plot] } = await pool.query(
      `SELECT *, EXTRACT(EPOCH FROM (NOW()-planted_at)) as elapsed_secs
       FROM plots WHERE id=$1`,
      [req.params.plotId]
    );
    if (!plot) return res.status(404).json({ error: 'Грядку не знайдено' });
    if (plot.player_id === req.session.playerId)
      return res.status(400).json({ error: 'Не можна поливати власні грядки тут' });
    if (plot.status !== 'growing') return res.status(400).json({ error: 'Грядка не росте' });

    const waterCount  = plot.water_count    || 0;
    const plantedSecs = plot.planted_seconds || 0;
    if (waterCount >= 3) return res.status(400).json({ error: 'Вже полито максимум 3 рази' });
    if (plantedSecs > 0) {
      const threshold = plantedSecs * (waterCount + 1) * 0.3;
      if (plot.elapsed_secs < threshold)
        return res.status(400).json({ error: 'Ще рано поливати цю рослину' });
    }

    const { rows: friendship } = await pool.query(
      `SELECT id FROM friends
       WHERE status='accepted'
         AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))`,
      [req.session.playerId, plot.player_id]
    );
    if (!friendship.length)
      return res.status(403).json({ error: 'Тільки друзі можуть поливати грядки' });

    await pool.query(
      `UPDATE plots SET water_count=water_count+1, watered=true, watered_by=$1,
         ready_at = NOW() + (ready_at - NOW()) * 0.85
       WHERE id=$2`,
      [req.session.playerId, req.params.plotId]
    );
    await pool.query('UPDATE players SET greens=greens+5 WHERE id=$1', [req.session.playerId]);

    const { rows: [waterer] } = await pool.query('SELECT username FROM players WHERE id=$1', [req.session.playerId]);
    const writeEvent = require('../helpers/writeEvent');
    await writeEvent(plot.player_id, {
      event_type: 'garden_watered',
      title: `${waterer.username} полив твою грядку`,
      body: `Рослина росте на 15% швидше (полив ${waterCount+1}/3)`,
      icon: '💧', color: 'blue',
    }, req.app.locals.io);

    res.json({ success: true, waterCount: waterCount + 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Harvest
router.post('/:plotId/harvest', async (req, res) => {
  try {
    // Re-check status
    await pool.query(
      `UPDATE plots SET status='ready'
       WHERE id=$1 AND player_id=$2 AND status='growing' AND ready_at <= NOW()`,
      [req.params.plotId, req.session.playerId]
    );

    const { rows: [plot] } = await pool.query(
      'SELECT * FROM plots WHERE id=$1 AND player_id=$2',
      [req.params.plotId, req.session.playerId]
    );
    if (!plot) return res.status(404).json({ error: 'Грядку не знайдено' });
    if (plot.status !== 'ready') return res.status(400).json({ error: 'Врожай ще не готовий' });

    const { rows: [plant] } = await pool.query('SELECT * FROM plants WHERE id=$1', [plot.plant_id]);

    // Clan building bonuses: Велика Ферма +5% зелені/рів, Академія +5% досвіду/рів
    const bonuses = await getClanBonuses(req.session.playerId);
    const farmPct    = (bonuses.farm    || 0) * 5;
    const academyPct = (bonuses.academy || 0) * 5;

    // Gift bonuses: harvest_idol +15%, luck_amulet ×1.5 per amulet
    const { rows: giftRows } = await pool.query(
      `SELECT harvest_bonus, is_luck_amulet FROM active_gifts
       WHERE receiver_id=$1 AND expires_at > NOW()`,
      [req.session.playerId]
    );
    const luckCount = giftRows.filter(g => g.is_luck_amulet).length;
    const luckMult  = 1 + luckCount * 0.5;
    const harvestGiftPct = giftRows
      .filter(g => !g.is_luck_amulet)
      .reduce((s, g) => s + (g.harvest_bonus || 0), 0) * luckMult;

    // Harvest potion bonus
    const { rows: harvestPotions } = await pool.query(
      `SELECT effect_value FROM active_potions
       WHERE player_id=$1 AND effect_type='harvest'
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (battles_left IS NULL OR battles_left > 0)`,
      [req.session.playerId]
    );
    const potionHarvestPct = harvestPotions.reduce((s, p) => s + (p.effect_value || 0), 0);

    const { rows: [reaperRing] } = await pool.query(
      `SELECT ru.bonus_value FROM ring_upgrades ru
       JOIN inventory inv ON inv.id = ru.inv_id AND inv.is_equipped=true AND inv.player_id=$1
       JOIN items it ON it.id = inv.item_id AND it.name='Кільце Жнеця'
       WHERE ru.player_id=$1`,
      [req.session.playerId]
    );
    const reaperRingPct = reaperRing ? reaperRing.bonus_value : 0;

    // Insect attack penalty: check for expired (not defeated) attack today
    const { rows: [insectAttack] } = await pool.query(
      `SELECT damage_penalty_pct FROM insect_attacks
       WHERE player_id=$1 AND is_defeated=false AND ends_at <= NOW() AND started_at >= CURRENT_DATE
       ORDER BY id DESC LIMIT 1`,
      [req.session.playerId]
    );
    const insectPenaltyPct = insectAttack ? insectAttack.damage_penalty_pct : 0;

    const greensEarned = Math.floor(plant.greens_reward
      * (1 + (farmPct + harvestGiftPct + potionHarvestPct + reaperRingPct) / 100)
      * (1 - insectPenaltyPct / 100));
    const expEarned    = Math.floor(plant.exp_reward    * (1 + academyPct / 100) * 0.1);

    // Give rewards
    const { rows: [player] } = await pool.query(
      'SELECT level, experience, exp_to_next FROM players WHERE id=$1',
      [req.session.playerId]
    );

    let newExp = player.experience + expEarned;
    let newLevel = player.level;
    let newExpToNext = player.exp_to_next;
    let levelUp = false;
    let levelReward = 0;
    let goldReward = 0;

    while (newExp >= newExpToNext) {
      newExp -= newExpToNext;
      newLevel++;
      newExpToNext = Math.floor(newExpToNext * 1.5);
      levelUp = true;
      levelReward += newLevel * 500;
      goldReward  += newLevel * 5;
    }

    const hpBonus = levelUp ? (newLevel - player.level) * 100 : 0;
    await pool.query(
      `UPDATE players
       SET greens        = greens + $1,
           gold          = gold + $2,
           experience    = $3,
           exp_to_next   = $4,
           level         = $5,
           max_hp        = max_hp + $6,
           total_harvest = total_harvest + $7
       WHERE id = $8`,
      [greensEarned + levelReward, goldReward, newExp, newExpToNext, newLevel,
       hpBonus, greensEarned, req.session.playerId]
    );
    updateClanTask(req.session.playerId, 'harvest_greens', greensEarned);
    const { updateDailyQuestProgress } = require('./daily');
    await updateDailyQuestProgress(req.session.playerId, 'harvest', 1);

    // Track harvested plant as ingredient for alchemist
    await pool.query(
      `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,1)
       ON CONFLICT (player_id, ingredient_name)
       DO UPDATE SET quantity = player_ingredients.quantity + 1`,
      [req.session.playerId, plant.name]
    );

    await pool.query(
      `UPDATE plots SET plant_id=NULL, planted_at=NULL, ready_at=NULL,
              status='empty', watered=false, watered_by=NULL WHERE id=$1`,
      [req.params.plotId]
    );

    let unlockedItems = [];
    if (levelUp) {
      const { rows: items } = await pool.query(
        `SELECT name, category FROM items WHERE min_level = $1`, [newLevel]
      );
      const { rows: plants } = await pool.query(
        `SELECT name, emoji FROM plants WHERE min_level = $1`, [newLevel]
      );
      unlockedItems = [
        ...items.map(i => ({ name: i.name, type: 'item', category: i.category })),
        ...plants.map(p => ({ name: p.name, type: 'plant', emoji: p.emoji })),
      ];
    }

    res.json({
      success: true,
      greens: greensEarned,
      exp: expEarned,
      levelUp,
      newLevel,
      levelReward,
      goldReward,
      newExpToNext,
      unlockedItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Get friend's plots (for viewing/watering)
router.get('/friend/:playerId', async (req, res) => {
  try {
    const { rows: friendship } = await pool.query(
      `SELECT id FROM friends
       WHERE status='accepted'
         AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))`,
      [req.session.playerId, req.params.playerId]
    );
    if (!friendship.length)
      return res.status(403).json({ error: 'Тільки друзі можуть бачити огород' });

    await pool.query(
      `UPDATE plots SET status='ready'
       WHERE player_id=$1 AND status='growing' AND ready_at <= NOW()`,
      [req.params.playerId]
    );

    const { rows } = await pool.query(
      `SELECT pl.*, p.name as plant_name, p.emoji as plant_emoji,
              p.frame_color as plant_frame_color, p.is_boss as plant_is_boss,
              COALESCE(pl.water_count,0) as water_count,
              CASE WHEN pl.status='growing'
                AND COALESCE(pl.water_count,0) < 3
                AND pl.planted_seconds > 0
                AND EXTRACT(EPOCH FROM (NOW()-pl.planted_at))
                    >= pl.planted_seconds * (COALESCE(pl.water_count,0)+1) * 0.3
              THEN true ELSE false END as can_water,
              EXTRACT(EPOCH FROM (pl.ready_at - NOW())) as seconds_left
       FROM plots pl
       LEFT JOIN plants p ON p.id = pl.plant_id
       WHERE pl.player_id = $1
       ORDER BY pl.slot_index`,
      [req.params.playerId]
    );

    res.json({ plots: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
