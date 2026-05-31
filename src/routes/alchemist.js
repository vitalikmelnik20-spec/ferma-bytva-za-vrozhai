const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      potion_name VARCHAR(100) NOT NULL,
      ingredients JSONB NOT NULL,
      min_level INTEGER DEFAULT 1
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS player_ingredients (
      id SERIAL PRIMARY KEY,
      player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
      ingredient_name VARCHAR(100) NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(player_id, ingredient_name)
    )
  `);
}

router.get('/', async (req, res) => {
  try {
    await ensureTables();

    const { rows: [player] } = await pool.query(
      'SELECT level FROM players WHERE id=$1',
      [req.session.playerId]
    );

    const { rows: potions } = await pool.query(
      `SELECT * FROM items WHERE category='potion' ORDER BY price`
    );

    const { rows: recipes } = await pool.query(
      'SELECT * FROM recipes WHERE min_level <= $1 ORDER BY id',
      [player.level]
    );

    const { rows: ingredients } = await pool.query(
      'SELECT ingredient_name, quantity FROM player_ingredients WHERE player_id=$1',
      [req.session.playerId]
    );

    res.json({ potions, recipes, ingredients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/buy/:itemId', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      `SELECT * FROM items WHERE id=$1 AND category='potion'`,
      [req.params.itemId]
    );
    if (!item) return res.status(404).json({ error: 'Зілля не знайдено' });

    const cost = item.price;
    const { rows: [player] } = await pool.query(
      'SELECT greens FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.greens < cost)
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${cost}` });

    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [cost, req.session.playerId]);

    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, item.id]
    );

    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/craft/:recipeId', async (req, res) => {
  try {
    await ensureTables();

    const { rows: [recipe] } = await pool.query(
      'SELECT * FROM recipes WHERE id=$1',
      [req.params.recipeId]
    );
    if (!recipe) return res.status(404).json({ error: 'Рецепт не знайдено' });

    const { rows: [player] } = await pool.query(
      'SELECT level FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.level < recipe.min_level)
      return res.status(400).json({ error: `Потрібен рівень ${recipe.min_level}` });

    const { rows: [item] } = await pool.query(
      `SELECT * FROM items WHERE name=$1 AND category='potion'`,
      [recipe.potion_name]
    );
    if (!item) return res.status(404).json({ error: 'Зілля для рецепту не знайдено в базі предметів' });

    const needed = recipe.ingredients;
    const { rows: playerIngredients } = await pool.query(
      'SELECT ingredient_name, quantity FROM player_ingredients WHERE player_id=$1',
      [req.session.playerId]
    );
    const ingMap = {};
    for (const row of playerIngredients) ingMap[row.ingredient_name] = row.quantity;

    for (const ing of needed) {
      if ((ingMap[ing.name] || 0) < ing.qty)
        return res.status(400).json({ error: `Недостатньо: ${ing.name} (є ${ingMap[ing.name] || 0}, потрібно ${ing.qty})` });
    }

    for (const ing of needed) {
      await pool.query(
        `UPDATE player_ingredients SET quantity = quantity - $1 WHERE player_id=$2 AND ingredient_name=$3`,
        [ing.qty, req.session.playerId, ing.name]
      );
    }

    const { rows: [inv] } = await pool.query(
      'INSERT INTO inventory (player_id, item_id) VALUES ($1,$2) RETURNING id',
      [req.session.playerId, item.id]
    );

    res.json({ success: true, inventoryId: inv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

router.post('/ingredients/add', async (req, res) => {
  const { name, qty } = req.body;
  if (!name || !qty || qty <= 0) return res.status(400).json({ error: 'Невірні дані' });

  try {
    await ensureTables();

    await pool.query(
      `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (player_id, ingredient_name) DO UPDATE SET quantity = player_ingredients.quantity + EXCLUDED.quantity`,
      [req.session.playerId, name, qty]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
