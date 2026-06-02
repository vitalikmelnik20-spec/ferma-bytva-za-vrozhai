const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const multer  = require('multer');
const path    = require('path');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.session.playerId}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Тільки зображення'))
});

router.use(requireAuth);

function trainCost(level) {
  return Math.floor(level * level * 10 + level * 20);
}

// Own profile
router.get('/', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      `SELECT p.*, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
              c.id as clan_id, c.name as clan_name, c.tag as clan_tag, cm.role as clan_role,
              pt.power as pet_power, pt.endurance as pet_endurance
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN clan_members cm ON cm.player_id = p.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       LEFT JOIN pets pt ON pt.player_id = p.id
       WHERE p.id = $1`,
      [req.session.playerId]
    );
    if (!player) return res.status(404).json({ error: 'Гравця не знайдено' });
    delete player.password_hash;

    const inventory = await pool.query(
      `SELECT inv.*, it.name, it.category, it.power_bonus, it.endurance_bonus,
              it.speed_bonus, it.accuracy_bonus, it.price,
              (inv.upgrade_level * 2) as upgrade_bonus
       FROM inventory inv JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id = $1
       ORDER BY inv.is_equipped DESC, it.category`,
      [req.session.playerId]
    );

    const gifts = await pool.query(
      `SELECT ag.*, p.username as giver_name
       FROM active_gifts ag
       JOIN players p ON p.id = ag.giver_id
       WHERE ag.receiver_id=$1 AND ag.expires_at > NOW()`,
      [req.session.playerId]
    );

    const tricks = await pool.query(
      `SELECT t.*, p.username as attacker_name
       FROM tricks t JOIN players p ON p.id = t.attacker_id
       WHERE t.victim_id=$1
       ORDER BY t.created_at DESC LIMIT 10`,
      [req.session.playerId]
    );

    const trainCosts = {
      power:     trainCost(player.power_level),
      endurance: trainCost(player.endurance_level),
      speed:     trainCost(player.speed_level),
      accuracy:  trainCost(player.accuracy_level),
    };

    const { rows: itemRunes } = await pool.query(
      `SELECT ir.inv_id, ir.slot_index
       FROM item_runes ir
       JOIN inventory rinv ON rinv.id = ir.rune_inv_id
       JOIN inventory inv  ON inv.id  = ir.inv_id
       WHERE inv.player_id = $1`,
      [req.session.playerId]
    );

    res.json({ player, inventory: inventory.rows, gifts: gifts.rows, tricks: tricks.rows, trainCosts, itemRunes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Upload custom avatar
router.post('/avatar/upload', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не завантажено' });
  const url = `/uploads/avatars/${req.file.filename}`;
  await pool.query('UPDATE players SET avatar_url=$1 WHERE id=$2', [url, req.session.playerId]);
  res.json({ success: true, url });
});

// Select preset avatar
router.post('/avatar/preset', async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji не вказано' });
  await pool.query('UPDATE players SET avatar_url=$1 WHERE id=$2', [`preset:${emoji}`, req.session.playerId]);
  res.json({ success: true });
});

// Statistics page
router.get('/stats', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      `SELECT p.*, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
              c.name as clan_name, c.tag as clan_tag,
              COALESCE(SUM(CASE WHEN i.is_equipped THEN it.power_bonus     ELSE 0 END), 0)::INTEGER AS equip_power,
              COALESCE(SUM(CASE WHEN i.is_equipped THEN it.endurance_bonus ELSE 0 END), 0)::INTEGER AS equip_endurance,
              COALESCE(SUM(CASE WHEN i.is_equipped THEN it.speed_bonus     ELSE 0 END), 0)::INTEGER AS equip_speed,
              COALESCE(SUM(CASE WHEN i.is_equipped THEN it.accuracy_bonus  ELSE 0 END), 0)::INTEGER AS equip_accuracy
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN inventory i ON i.player_id = p.id
       LEFT JOIN items it    ON it.id = i.item_id
       LEFT JOIN clan_members cm ON cm.player_id = p.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       WHERE p.id = $1
       GROUP BY p.id, t.power_level, t.endurance_level, t.speed_level, t.accuracy_level, c.name, c.tag`,
      [req.session.playerId]
    );
    if (!player) return res.status(404).json({ error: 'Гравця не знайдено' });
    delete player.password_hash;

    const { rows: [{ count: friendsCount }] } = await pool.query(
      `SELECT COUNT(*) FROM friends WHERE status='accepted'
       AND (requester_id=$1 OR addressee_id=$1)`,
      [req.session.playerId]
    );

    const { rows: [{ rank }] } = await pool.query(
      `SELECT COUNT(*) + 1 AS rank FROM players
       WHERE glory > (SELECT glory FROM players WHERE id=$1) AND is_banned=false`,
      [req.session.playerId]
    );

    const { rows: [battleStats] } = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN winner_id=$1 THEN greens_reward ELSE 0 END),0)::INTEGER AS greens_earned,
         COALESCE(SUM(CASE WHEN winner_id!=$1 AND (attacker_id=$1 OR defender_id=$1) THEN greens_reward ELSE 0 END),0)::INTEGER AS greens_lost
       FROM battles WHERE attacker_id=$1 OR defender_id=$1`,
      [req.session.playerId]
    );

    // gold_earned_battle / gold_lost_battle tracked incrementally in players table

    const { rows: [caveStats] } = await pool.query(
      `SELECT COUNT(*)::INTEGER                     AS total_sessions,
              COALESCE(SUM(mines_done),  0)::INTEGER AS total_mines_done,
              COALESCE(SUM(gold_earned), 0)::INTEGER AS total_gold
       FROM caves WHERE player_id=$1`,
      [req.session.playerId]
    );

    // Gift bonuses (with luck amulet multiplier)
    const { rows: activeGifts } = await pool.query(
      `SELECT power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, harvest_bonus, is_luck_amulet
       FROM active_gifts WHERE receiver_id=$1 AND expires_at > NOW()`,
      [req.session.playerId]
    );
    const luckMult  = 1 + activeGifts.filter(g => g.is_luck_amulet).length * 0.5;
    const statGifts = activeGifts.filter(g => !g.is_luck_amulet);
    const giftPower     = Math.floor(statGifts.reduce((s,g) => s + (g.power_bonus     || 0), 0) * luckMult);
    const giftEndurance = Math.floor(statGifts.reduce((s,g) => s + (g.endurance_bonus || 0), 0) * luckMult);
    const giftSpeed     = Math.floor(statGifts.reduce((s,g) => s + (g.speed_bonus     || 0), 0) * luckMult);
    const giftAccuracy  = Math.floor(statGifts.reduce((s,g) => s + (g.accuracy_bonus  || 0), 0) * luckMult);
    const harvestGiftPct = Math.floor(statGifts.reduce((s,g) => s + (g.harvest_bonus  || 0), 0) * luckMult);

    // Potion bonuses
    const { rows: potionRows } = await pool.query(
      `SELECT effect_type, effect_value FROM active_potions
       WHERE player_id=$1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (battles_left IS NULL OR battles_left > 0)`,
      [req.session.playerId]
    );
    let potionPower = 0, potionEndurance = 0, potionSpeed = 0, potionAccuracy = 0, potionHarvestPct2 = 0;
    for (const p of potionRows) {
      if      (p.effect_type === 'power')     potionPower     += p.effect_value;
      else if (p.effect_type === 'endurance') potionEndurance += p.effect_value;
      else if (p.effect_type === 'speed')     potionSpeed     += p.effect_value;
      else if (p.effect_type === 'accuracy')  potionAccuracy  += p.effect_value;
      else if (p.effect_type === 'harvest')   potionHarvestPct2 += p.effect_value;
    }

    // Rune bonuses from equipped items
    const { rows: [runeRow] } = await pool.query(
      `SELECT COALESCE(SUM(it.power_bonus),0)::INTEGER     AS rune_power,
              COALESCE(SUM(it.endurance_bonus),0)::INTEGER AS rune_endurance,
              COALESCE(SUM(it.speed_bonus),0)::INTEGER     AS rune_speed,
              COALESCE(SUM(it.accuracy_bonus),0)::INTEGER  AS rune_accuracy
       FROM item_runes ir
       JOIN inventory eq   ON eq.id = ir.inv_id        AND eq.player_id=$1 AND eq.is_equipped=true
       JOIN inventory rinv ON rinv.id = ir.rune_inv_id  AND rinv.player_id=$1
       JOIN items it ON it.id = rinv.item_id`,
      [req.session.playerId]
    );

    // Talisman stat bonuses (Талісман Воїна / Захисника)
    const { rows: talismanRows } = await pool.query(
      `SELECT tu.bonus_pct, it.name FROM talisman_upgrades tu
       JOIN inventory inv ON inv.id = tu.inv_id AND inv.is_equipped=true AND inv.player_id=$1
       JOIN items it ON it.id = inv.item_id
       WHERE tu.player_id=$1`,
      [req.session.playerId]
    );
    let taliPower = 0, taliEndurance = 0;
    for (const t of talismanRows) {
      if (t.name === 'Талісман Воїна')     taliPower     += t.bonus_pct;
      if (t.name === 'Талісман Захисника') taliEndurance += t.bonus_pct;
    }

    const PET_ICONS = { mink:'/icons/pets/beaver.svg', beaver:'/icons/pets/beaver.svg', wolf:'/icons/pets/wolf.svg', bear:'/icons/pets/bear.svg', lizard:'/icons/pets/lizard.svg', silver_wolf:'/icons/pets/wolf.svg', ice_lizard:'/icons/pets/lizard.svg', mighty_bear:'/icons/pets/bear.svg', fire_wolf:'/icons/pets/wolf.svg', dragonling:'/icons/pets/dragon.svg', golden_eagle:'/icons/pets/eagle.svg' };
    const { rows: [petStatsRow] } = await pool.query(
      `SELECT ps.battles_participated, ps.wins, ps.deaths,
              ps.total_damage, ps.pets_killed, ps.ability_procs,
              p.name AS pet_name, p.pet_type, p.rarity
       FROM pets p
       JOIN pet_stats ps ON ps.pet_id = p.id
       WHERE p.player_id=$1
       ORDER BY p.is_active DESC LIMIT 1`,
      [req.session.playerId]
    );
    const petStats = petStatsRow
      ? { ...petStatsRow, icon: PET_ICONS[petStatsRow.pet_type] || '/icons/ui/paw.svg' }
      : null;

    res.json({
      player,
      friendsCount:    parseInt(friendsCount),
      gloryRank:       parseInt(rank),
      greensEarned:    battleStats.greens_earned,
      greensLost:      battleStats.greens_lost,
      cavesSessions:   caveStats?.total_sessions   || 0,
      cavesMinesDone:  caveStats?.total_mines_done || 0,
      cavesGold:       caveStats?.total_gold       || 0,
      giftPower, giftEndurance, giftSpeed, giftAccuracy, harvestGiftPct,
      runePower:     runeRow?.rune_power     || 0,
      runeEndurance: runeRow?.rune_endurance || 0,
      runeSpeed:     runeRow?.rune_speed     || 0,
      runeAccuracy:  runeRow?.rune_accuracy  || 0,
      luckAmulets:   activeGifts.filter(g => g.is_luck_amulet).length,
      potionPower, potionEndurance, potionSpeed, potionAccuracy, potionHarvestPct: potionHarvestPct2,
      taliPower, taliEndurance,
      dragonBattles:      player.dragon_battles        || 0,
      dragonTotalDamage:  player.dragon_total_damage    || 0,
      dragonGreensEarned: player.dragon_greens_earned   || 0,
      insectsDefeated:    player.insects_defeated       || 0,
      insectsGreensSaved: player.insects_greens_saved   || 0,
      petStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/profile/inventory — must be before /:id to avoid route conflict
router.get('/inventory', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      'SELECT inventory_slots FROM players WHERE id=$1', [req.session.playerId]
    );

    const { rows: items } = await pool.query(
      `SELECT inv.id, inv.item_id, inv.is_equipped, inv.upgrade_level,
              inv.is_on_auction,
              it.name, it.category, it.power_bonus, it.endurance_bonus,
              it.speed_bonus, it.accuracy_bonus, it.price, it.min_level
       FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1
       ORDER BY inv.is_equipped DESC, it.min_level`,
      [req.session.playerId]
    );

    const { rows: ingredients } = await pool.query(
      'SELECT ingredient_name, quantity FROM player_ingredients WHERE player_id=$1 AND quantity>0 ORDER BY ingredient_name',
      [req.session.playerId]
    );

    const { rows: itemRunes } = await pool.query(
      `SELECT ir.inv_id, ir.slot_index, it.name AS rune_name
       FROM item_runes ir
       JOIN inventory rinv ON rinv.id = ir.rune_inv_id
       JOIN inventory inv  ON inv.id  = ir.inv_id
       JOIN items it ON it.id = rinv.item_id
       WHERE inv.player_id=$1`,
      [req.session.playerId]
    );

    const slots = player.inventory_slots || 50;
    res.json({ items, ingredients, itemRunes, slots, used: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/profile/expand-inventory — must be before /:id
router.post('/expand-inventory', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      'SELECT gold, inventory_slots FROM players WHERE id=$1', [req.session.playerId]
    );
    const slots = player.inventory_slots || 50;
    if (slots >= 200) return res.status(400).json({ error: 'Досягнуто максимум 200 слотів' });
    if (player.gold < 100) return res.status(400).json({ error: 'Потрібно 100 золота' });

    await pool.query(
      'UPDATE players SET gold=gold-100, inventory_slots=COALESCE(inventory_slots,50)+10 WHERE id=$1',
      [req.session.playerId]
    );
    res.json({ success: true, newSlots: slots + 10 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Public profile
router.get('/:id', async (req, res) => {
  try {
    const { rows: [player] } = await pool.query(
      `SELECT p.id, p.username, p.faction, p.gender, p.level, p.glory, p.status_text,
              p.city_name, p.medals, p.wins, p.losses, p.is_online, p.created_at,
              p.avatar_url, p.hp, p.max_hp, p.experience, p.exp_to_next,
              t.power_level, t.endurance_level, t.speed_level, t.accuracy_level,
              c.name as clan_name, c.tag as clan_tag
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN clan_members cm ON cm.player_id = p.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       WHERE p.id = $1 AND p.is_banned = false`,
      [req.params.id]
    );
    if (!player) return res.status(404).json({ error: 'Гравця не знайдено' });

    const equip = await pool.query(
      `SELECT inv.id, inv.slot, it.name, it.category, it.power_bonus, it.endurance_bonus,
              it.speed_bonus, it.accuracy_bonus, (inv.upgrade_level * 2) as upgrade_bonus
       FROM inventory inv JOIN items it ON it.id = inv.item_id
       WHERE inv.player_id=$1 AND inv.is_equipped=true`,
      [req.params.id]
    );

    const gifts = await pool.query(
      `SELECT ag.gift_name, ag.power_bonus, ag.endurance_bonus, ag.speed_bonus,
              ag.accuracy_bonus, ag.harvest_bonus, ag.is_luck_amulet,
              p.username as giver_name, ag.expires_at
       FROM active_gifts ag JOIN players p ON p.id = ag.giver_id
       WHERE ag.receiver_id=$1 AND ag.expires_at > NOW()`,
      [req.params.id]
    );

    // friendship status
    const friendship = await pool.query(
      `SELECT * FROM friends
       WHERE (requester_id=$1 AND addressee_id=$2)
          OR (requester_id=$2 AND addressee_id=$1)`,
      [req.session.playerId, req.params.id]
    );

    const { rows: itemRunes } = await pool.query(
      `SELECT ir.inv_id, ir.slot_index
       FROM item_runes ir
       JOIN inventory inv ON inv.id = ir.inv_id
       WHERE inv.player_id = $1`,
      [req.params.id]
    );

    res.json({
      player,
      equipment: equip.rows,
      gifts: gifts.rows,
      itemRunes,
      friendshipStatus: friendship.rows[0]?.status || null,
      isRequester: friendship.rows[0]?.requester_id === req.session.playerId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Train stat
router.post('/train/:stat', async (req, res) => {
  const VALID_STATS = {
    power:     'power_level',
    endurance: 'endurance_level',
    speed:     'speed_level',
    accuracy:  'accuracy_level',
  };

  const stat = req.params.stat;

  try {
    if (VALID_STATS[stat]) {
      const col = VALID_STATS[stat];
      const { rows: [t] } = await pool.query('SELECT * FROM training WHERE player_id=$1', [req.session.playerId]);
      const currentLevel = t[col];
      const cost = trainCost(currentLevel);

      const { rows: [player] } = await pool.query('SELECT greens FROM players WHERE id=$1', [req.session.playerId]);
      if (player.greens < cost)
        return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });

      await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [cost, req.session.playerId]);
      await pool.query(`UPDATE training SET ${col} = ${col} + 1 WHERE player_id=$1`, [req.session.playerId]);

      res.json({ success: true, newLevel: currentLevel + 1, nextCost: trainCost(currentLevel + 1) });

    } else {
      res.status(400).json({ error: 'Невірний стат' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Update status text
router.put('/status', async (req, res) => {
  const text = String(req.body.text || '').slice(0, 100);
  await pool.query('UPDATE players SET status_text=$1 WHERE id=$2', [text, req.session.playerId]);
  res.json({ success: true });
});

// Toggle vacation
router.put('/vacation', async (req, res) => {
  const { rows: [p] } = await pool.query('SELECT on_vacation FROM players WHERE id=$1', [req.session.playerId]);
  await pool.query('UPDATE players SET on_vacation=$1 WHERE id=$2', [!p.on_vacation, req.session.playerId]);
  res.json({ success: true, on_vacation: !p.on_vacation });
});

// Update city name
router.put('/city', async (req, res) => {
  const name = String(req.body.name || '').slice(0, 50);
  await pool.query('UPDATE players SET city_name=$1 WHERE id=$2', [name, req.session.playerId]);
  res.json({ success: true });
});


// POST /api/profile/discard/:invId — discard item, get 2-5% price as greens; runes destroyed
router.post('/discard/:invId', async (req, res) => {
  try {
    const { rows: [inv] } = await pool.query(
      `SELECT inv.id, inv.is_equipped, it.price, it.name
       FROM inventory inv JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [req.params.invId, req.session.playerId]
    );
    if (!inv) return res.status(404).json({ error: 'Предмет не знайдено' });
    if (inv.is_equipped) return res.status(400).json({ error: 'Спочатку зніми предмет' });

    // Find runes inserted in this item — they will be destroyed
    const { rows: insertedRunes } = await pool.query(
      'SELECT rune_inv_id FROM item_runes WHERE inv_id=$1', [req.params.invId]
    );

    const pct = 2 + Math.random() * 3;
    const greens = Math.max(1, Math.floor((inv.price || 0) * pct / 100));

    await pool.query('DELETE FROM inventory WHERE id=$1', [req.params.invId]);
    if (insertedRunes.length > 0) {
      await pool.query('DELETE FROM inventory WHERE id = ANY($1)', [insertedRunes.map(r => r.rune_inv_id)]);
    }
    await pool.query('UPDATE players SET greens=greens+$1 WHERE id=$2', [greens, req.session.playerId]);

    res.json({ success: true, greens, itemName: inv.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
