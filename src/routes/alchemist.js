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

// GET / — potions shop, recipes, plant ingredients, active potions, inventory potions
router.get('/', async (req, res) => {
  try {
    await ensureTables();

    const { rows: [player] } = await pool.query(
      'SELECT level FROM players WHERE id=$1',
      [req.session.playerId]
    );

    const [
      { rows: potions },
      { rows: recipes },
      { rows: ingredients },
      { rows: activePotions },
      { rows: invPotions },
      { rows: invItems },
    ] = await Promise.all([
      pool.query(`SELECT * FROM items WHERE category='potion' ORDER BY price`),
      pool.query('SELECT * FROM recipes WHERE min_level <= $1 ORDER BY id', [player.level]),
      pool.query(
        'SELECT ingredient_name, quantity FROM player_ingredients WHERE player_id=$1',
        [req.session.playerId]
      ),
      pool.query(
        `SELECT * FROM active_potions WHERE player_id=$1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (battles_left IS NULL OR battles_left > 0)
         ORDER BY created_at`,
        [req.session.playerId]
      ),
      pool.query(
        `SELECT inv.id AS inv_id, it.id AS item_id, it.name,
                it.effect_type, it.effect_value, it.effect_rounds
         FROM inventory inv
         JOIN items it ON it.id = inv.item_id
         WHERE inv.player_id=$1 AND it.category='potion' AND inv.is_equipped=false
         ORDER BY it.price`,
        [req.session.playerId]
      ),
      pool.query(
        `SELECT it.name, COUNT(*)::INTEGER AS qty
         FROM inventory inv JOIN items it ON it.id = inv.item_id
         WHERE inv.player_id=$1
         GROUP BY it.name`,
        [req.session.playerId]
      ),
    ]);

    // invIngMap: item name → count (for src:'inventory' recipe checks)
    const invIngMap = {};
    for (const row of invItems) invIngMap[row.name] = row.qty;

    res.json({ potions, recipes, ingredients, activePotions, invPotions, invIngMap });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Buy potion from shop
router.post('/buy/:itemId', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      `SELECT * FROM items WHERE id=$1 AND category='potion'`,
      [req.params.itemId]
    );
    if (!item) return res.status(404).json({ error: 'Зілля не знайдено' });

    const { rows: [player] } = await pool.query(
      'SELECT greens FROM players WHERE id=$1',
      [req.session.playerId]
    );
    if (player.greens < item.price)
      return res.status(400).json({ error: `Недостатньо зелені. Потрібно: ${item.price}` });

    await pool.query('UPDATE players SET greens = greens - $1 WHERE id=$2', [item.price, req.session.playerId]);
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

// Craft potion from recipe
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

    const plantIngs = recipe.ingredients.filter(i => i.src === 'plants');
    const invIngs   = recipe.ingredients.filter(i => i.src === 'inventory');

    // Validate plant ingredients
    if (plantIngs.length > 0) {
      const { rows: playerPlants } = await pool.query(
        'SELECT ingredient_name, quantity FROM player_ingredients WHERE player_id=$1',
        [req.session.playerId]
      );
      const ingMap = {};
      for (const row of playerPlants) ingMap[row.ingredient_name] = row.quantity;

      for (const ing of plantIngs) {
        if ((ingMap[ing.name] || 0) < ing.qty)
          return res.status(400).json({
            error: `Недостатньо: ${ing.name} (є ${ingMap[ing.name] || 0}, потрібно ${ing.qty})`
          });
      }
    }

    // Validate inventory ingredients
    for (const ing of invIngs) {
      const { rows: invRows } = await pool.query(
        `SELECT inv.id FROM inventory inv
         JOIN items it ON it.id = inv.item_id
         WHERE inv.player_id=$1 AND it.name=$2
         ORDER BY inv.id LIMIT $3`,
        [req.session.playerId, ing.name, ing.qty]
      );
      if (invRows.length < ing.qty)
        return res.status(400).json({
          error: `Недостатньо: ${ing.name} в інвентарі (є ${invRows.length}, потрібно ${ing.qty})`
        });
    }

    // Consume plant ingredients
    for (const ing of plantIngs) {
      await pool.query(
        `UPDATE player_ingredients SET quantity = quantity - $1
         WHERE player_id=$2 AND ingredient_name=$3`,
        [ing.qty, req.session.playerId, ing.name]
      );
    }

    // Consume inventory ingredients
    for (const ing of invIngs) {
      const { rows: invRows } = await pool.query(
        `SELECT inv.id FROM inventory inv
         JOIN items it ON it.id = inv.item_id
         WHERE inv.player_id=$1 AND it.name=$2
         ORDER BY inv.id LIMIT $3`,
        [req.session.playerId, ing.name, ing.qty]
      );
      for (const row of invRows) {
        await pool.query('DELETE FROM inventory WHERE id=$1', [row.id]);
      }
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

// Use a potion from inventory
router.post('/use/:invId', async (req, res) => {
  try {
    const { rows: [invRow] } = await pool.query(
      `SELECT inv.id, it.name, it.effect_type, it.effect_value, it.effect_rounds
       FROM inventory inv JOIN items it ON it.id = inv.item_id
       WHERE inv.id=$1 AND inv.player_id=$2 AND it.category='potion'`,
      [req.params.invId, req.session.playerId]
    );
    if (!invRow) return res.status(404).json({ error: 'Зілля не знайдено в інвентарі' });

    // Remove from inventory first
    await pool.query('DELETE FROM inventory WHERE id=$1', [req.params.invId]);

    // Instant heal
    if (invRow.effect_type === 'heal') {
      await pool.query(
        'UPDATE players SET hp = LEAST(max_hp, hp + FLOOR(max_hp * $1 / 100)) WHERE id=$2',
        [invRow.effect_value, req.session.playerId]
      );
      return res.json({ success: true, message: `Відновлено ${invRow.effect_value}% здоров'я` });
    }

    // Duration potions
    let battlesLeft = null;
    let expiresAt;
    if (invRow.effect_rounds === -1) {
      // Harvest potion — 24h
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      battlesLeft = invRow.effect_rounds;
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    await pool.query(
      `INSERT INTO active_potions (player_id, potion_name, effect_type, effect_value, battles_left, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.session.playerId, invRow.name, invRow.effect_type, invRow.effect_value, battlesLeft, expiresAt]
    );

    res.json({ success: true, message: `Зілля "${invRow.name}" активовано!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// Add plant ingredients (used internally by garden harvest)
router.post('/ingredients/add', async (req, res) => {
  const { name, qty } = req.body;
  if (!name || !qty || qty <= 0) return res.status(400).json({ error: 'Невірні дані' });

  try {
    await ensureTables();
    await pool.query(
      `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (player_id, ingredient_name)
       DO UPDATE SET quantity = player_ingredients.quantity + EXCLUDED.quantity`,
      [req.session.playerId, name, qty]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
