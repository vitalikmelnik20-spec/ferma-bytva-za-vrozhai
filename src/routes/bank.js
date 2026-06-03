const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const TERMS = {
  7:  { rate: 5  },
  14: { rate: 10 },
  30: { rate: 20 },
};
const MIN_AMOUNT   = { green: 1000, gold: 100 };
const MAX_DEPOSITS = 3;

// GET /api/bank/deposits
router.get('/deposits', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bank_deposits WHERE player_id=$1 AND status != 'withdrawn'
       ORDER BY created_at DESC`,
      [req.session.playerId]
    );
    res.json({ deposits: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/bank/open
router.post('/open', async (req, res) => {
  try {
    const { currency, amount, termDays } = req.body;
    const termNum  = parseInt(termDays);
    const amountNum = parseInt(amount);

    if (!['green', 'gold'].includes(currency))
      return res.status(400).json({ error: 'Невірна валюта' });
    if (!TERMS[termNum])
      return res.status(400).json({ error: 'Невірний термін (7, 14 або 30 днів)' });
    if (!amountNum || amountNum < MIN_AMOUNT[currency])
      return res.status(400).json({ error: `Мін. сума: ${MIN_AMOUNT[currency]}` });

    // check active deposits limit
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM bank_deposits WHERE player_id=$1 AND currency=$2 AND status='active'`,
      [req.session.playerId, currency]
    );
    if (parseInt(count) >= MAX_DEPOSITS)
      return res.status(400).json({ error: `Максимум ${MAX_DEPOSITS} активних депозити на одну валюту` });

    const col = currency === 'gold' ? 'gold' : 'greens';
    const { rows: [player] } = await pool.query(
      `SELECT ${col} FROM players WHERE id=$1`, [req.session.playerId]
    );
    if (player[col] < amountNum)
      return res.status(400).json({ error: `Недостатньо ${currency === 'gold' ? 'золота' : 'зелені'}` });

    const rate = TERMS[termNum].rate;
    await pool.query(`UPDATE players SET ${col}=${col}-$1 WHERE id=$2`, [amountNum, req.session.playerId]);
    const { rows: [dep] } = await pool.query(
      `INSERT INTO bank_deposits
         (player_id, currency, amount, interest_rate, term_days, status, matures_at)
       VALUES ($1,$2,$3,$4,$5,'active', NOW() + ($5 || ' days')::INTERVAL)
       RETURNING *`,
      [req.session.playerId, currency, amountNum, rate, termNum]
    );

    res.json({ success: true, deposit: dep });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/bank/collect/:id
router.post('/collect/:id', async (req, res) => {
  try {
    const { rows: [dep] } = await pool.query(
      `SELECT * FROM bank_deposits WHERE id=$1 AND player_id=$2`,
      [req.params.id, req.session.playerId]
    );
    if (!dep)              return res.status(404).json({ error: 'Депозит не знайдено' });
    if (dep.status !== 'ready')
      return res.status(400).json({ error: 'Депозит ще не готовий до отримання' });

    const interest = Math.floor(dep.amount * dep.interest_rate / 100);
    const total    = dep.amount + interest;
    const col      = dep.currency === 'gold' ? 'gold' : 'greens';

    await pool.query(`UPDATE players SET ${col}=${col}+$1 WHERE id=$2`, [total, req.session.playerId]);
    await pool.query(
      `UPDATE bank_deposits SET status='withdrawn', collected_at=NOW() WHERE id=$1`,
      [dep.id]
    );

    res.json({ success: true, total, interest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/bank/withdraw/:id  (early — no interest)
router.post('/withdraw/:id', async (req, res) => {
  try {
    const { rows: [dep] } = await pool.query(
      `SELECT * FROM bank_deposits WHERE id=$1 AND player_id=$2`,
      [req.params.id, req.session.playerId]
    );
    if (!dep) return res.status(404).json({ error: 'Депозит не знайдено' });
    if (dep.status === 'withdrawn')
      return res.status(400).json({ error: 'Депозит вже закрито' });

    const col = dep.currency === 'gold' ? 'gold' : 'greens';
    await pool.query(`UPDATE players SET ${col}=${col}+$1 WHERE id=$2`, [dep.amount, req.session.playerId]);
    await pool.query(
      `UPDATE bank_deposits SET status='withdrawn', collected_at=NOW() WHERE id=$1`, [dep.id]
    );

    res.json({ success: true, returned: dep.amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
