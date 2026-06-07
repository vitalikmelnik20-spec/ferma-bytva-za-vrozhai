const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { checkAchievements } = require('../utils/achievements');

router.use(requireAuth);

const ENCHANT_PRICE_MULT = [1.0, 1.1, 1.25, 1.5, 2.0, 3.0];
const COMMISSION = 0.05;

// Auto-expire lots whose expires_at has passed
async function expireOldLots() {
  const { rows: expired } = await pool.query(
    `SELECT id, inv_id FROM auction_lots WHERE status='active' AND expires_at <= NOW()`
  );
  for (const lot of expired) {
    await pool.query(`UPDATE auction_lots SET status='expired' WHERE id=$1`, [lot.id]);
    if (lot.inv_id) {
      await pool.query(`UPDATE inventory SET is_on_auction=false WHERE id=$1`, [lot.inv_id]);
    }
  }
}

// GET /api/auction?category=&currency=&min_level=&enchant=&sort=price_asc
router.get('/', async (req, res) => {
  try {
    await expireOldLots();

    const { category, currency, min_level, enchant, sort = 'newest' } = req.query;
    const params = [];
    const filters = [`al.status='active'`, `al.seller_id != $${params.push(req.session.playerId)}`];

    if (category)  filters.push(`al.category = $${params.push(category)}`);
    if (currency)  filters.push(`al.currency = $${params.push(currency)}`);
    if (min_level) filters.push(`al.min_level >= $${params.push(parseInt(min_level))}`);
    if (enchant !== undefined && enchant !== '') {
      filters.push(`al.enchant_level = $${params.push(parseInt(enchant))}`);
    }

    const ORDER = {
      price_asc:  'al.price ASC',
      price_desc: 'al.price DESC',
      level_asc:  'al.min_level ASC',
      level_desc: 'al.min_level DESC',
      newest:     'al.created_at DESC',
    };

    const { rows: lots } = await pool.query(
      `SELECT al.*, p.username AS seller_name
       FROM auction_lots al
       JOIN players p ON p.id = al.seller_id
       WHERE ${filters.join(' AND ')}
       ORDER BY ${ORDER[sort] || ORDER.newest}
       LIMIT 100`,
      params
    );

    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/auction/my
router.get('/my', async (req, res) => {
  try {
    await expireOldLots();
    const { rows: lots } = await pool.query(
      `SELECT * FROM auction_lots WHERE seller_id=$1 AND status='active' ORDER BY created_at DESC`,
      [req.session.playerId]
    );
    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/auction/list — list an inventory item
router.post('/list', async (req, res) => {
  const { invId, currency, price } = req.body;
  const VALID_CURRENCIES = ['greens', 'gold', 'diamonds'];

  if (!VALID_CURRENCIES.includes(currency))
    return res.status(400).json({ error: 'Невірна валюта (greens / gold)' });
  const priceNum = parseInt(price);
  if (!priceNum || priceNum < 1)
    return res.status(400).json({ error: 'Невірна ціна' });

  try {
    const { rows: [inv] } = await pool.query(
      `SELECT inv.*, it.name, it.category, it.min_level, it.price AS base_price,
              it.power_bonus, it.endurance_bonus, it.speed_bonus, it.accuracy_bonus
       FROM inventory inv
       JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2`,
      [invId, req.session.playerId]
    );
    if (!inv)              return res.status(404).json({ error: 'Предмет не знайдено' });
    if (inv.is_equipped)   return res.status(400).json({ error: 'Спочатку зніми екіпіровку' });
    if (inv.is_on_auction) return res.status(400).json({ error: 'Предмет вже виставлено на аукціон' });

    const enchant = inv.upgrade_level || 0;
    const minPrice = Math.floor((inv.base_price || 0) * (ENCHANT_PRICE_MULT[enchant] || 1));
    if (priceNum < minPrice)
      return res.status(400).json({ error: `Мінімальна ціна: ${minPrice}` });

    await pool.query(`UPDATE inventory SET is_on_auction=true WHERE id=$1`, [invId]);

    const { rows: [lot] } = await pool.query(
      `INSERT INTO auction_lots
         (seller_id, inv_id, item_id, item_name, category, min_level, enchant_level,
          power_bonus, endurance_bonus, speed_bonus, accuracy_bonus, currency, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [req.session.playerId, invId, inv.item_id, inv.name, inv.category, inv.min_level,
       enchant, inv.power_bonus, inv.endurance_bonus, inv.speed_bonus, inv.accuracy_bonus,
       currency, priceNum]
    );

    await pool.query(`UPDATE players SET market_sells=COALESCE(market_sells,0)+1 WHERE id=$1`, [req.session.playerId]);
    checkAchievements(req.session.playerId, req.app.locals.io).catch(() => {});
    res.json({ success: true, lotId: lot.id, minPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/auction/buy/:lotId
router.post('/buy/:lotId', async (req, res) => {
  try {
    await expireOldLots();

    const { rows: [lot] } = await pool.query(
      `SELECT * FROM auction_lots WHERE id=$1 AND status='active'`,
      [req.params.lotId]
    );
    if (!lot) return res.status(404).json({ error: 'Лот не знайдено або вже продано' });
    if (lot.seller_id === req.session.playerId)
      return res.status(400).json({ error: 'Не можна купити власний лот' });

    const col = lot.currency === 'gold' ? 'gold' : lot.currency === 'diamonds' ? 'diamonds' : 'greens';
    const { rows: [buyer] } = await pool.query(
      `SELECT ${col} FROM players WHERE id=$1`, [req.session.playerId]
    );
    if (buyer[col] < lot.price) {
      const colName = col === 'gold' ? 'золота' : col === 'diamonds' ? 'алмазів' : 'зелені';
      return res.status(400).json({ error: `Недостатньо ${colName}. Потрібно: ${lot.price}` });
    }

    const commission = Math.ceil(lot.price * COMMISSION);
    const sellerGets = lot.price - commission;

    // Deduct from buyer
    await pool.query(`UPDATE players SET ${col}=${col}-$1 WHERE id=$2`, [lot.price, req.session.playerId]);
    // Pay seller (minus commission)
    await pool.query(`UPDATE players SET ${col}=${col}+$1 WHERE id=$2`, [sellerGets, lot.seller_id]);

    // Transfer inventory item to buyer
    if (lot.inv_id) {
      await pool.query(
        `UPDATE inventory SET player_id=$1, is_on_auction=false, is_equipped=false WHERE id=$2`,
        [req.session.playerId, lot.inv_id]
      );
    }

    await pool.query(`UPDATE auction_lots SET status='sold' WHERE id=$1`, [lot.id]);
    await pool.query(
      `INSERT INTO auction_bids (lot_id, buyer_id) VALUES ($1,$2)`,
      [lot.id, req.session.playerId]
    );

    res.json({ success: true, itemName: lot.item_name, price: lot.price, commission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/auction/cancel/:lotId
router.post('/cancel/:lotId', async (req, res) => {
  try {
    const { rows: [lot] } = await pool.query(
      `SELECT * FROM auction_lots WHERE id=$1 AND seller_id=$2 AND status='active'`,
      [req.params.lotId, req.session.playerId]
    );
    if (!lot) return res.status(404).json({ error: 'Лот не знайдено' });

    await pool.query(`UPDATE auction_lots SET status='cancelled' WHERE id=$1`, [lot.id]);
    if (lot.inv_id) {
      await pool.query(`UPDATE inventory SET is_on_auction=false WHERE id=$1`, [lot.inv_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
