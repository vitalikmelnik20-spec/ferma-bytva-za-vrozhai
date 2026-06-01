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
              pt.power_level as pet_power, pt.endurance_level as pet_endurance,
              c.id as clan_id, c.name as clan_name, c.tag as clan_tag, cm.role as clan_role
       FROM players p
       LEFT JOIN training t ON t.player_id = p.id
       LEFT JOIN pets pt ON pt.player_id = p.id
       LEFT JOIN clan_members cm ON cm.player_id = p.id
       LEFT JOIN clans c ON c.id = cm.clan_id
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
      power: trainCost(player.power_level),
      endurance: trainCost(player.endurance_level),
      speed: trainCost(player.speed_level),
      accuracy: trainCost(player.accuracy_level),
      pet_power: trainCost(player.pet_power),
      pet_endurance: trainCost(player.pet_endurance),
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
    });
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
    power: 'power_level',
    endurance: 'endurance_level',
    speed: 'speed_level',
    accuracy: 'accuracy_level'
  };
  const PET_STATS = {
    pet_power: 'power_level',
    pet_endurance: 'endurance_level'
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

    } else if (PET_STATS[stat]) {
      const col = PET_STATS[stat];
      const { rows: [pet] } = await pool.query('SELECT * FROM pets WHERE player_id=$1', [req.session.playerId]);
      const currentLevel = pet[col];
      const cost = trainCost(currentLevel);

      const { rows: [player] } = await pool.query('SELECT greens FROM players WHERE id=$1', [req.session.playerId]);
      if (player.greens < cost)
        return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });

      await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [cost, req.session.playerId]);
      await pool.query(`UPDATE pets SET ${col} = ${col} + 1 WHERE player_id=$1`, [req.session.playerId]);

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

module.exports = router;
