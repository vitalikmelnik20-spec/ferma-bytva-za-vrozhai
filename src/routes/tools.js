const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

const TOOLS = ['waterer', 'planter', 'harvester'];
const TOOL_META = {
  waterer:   { label: 'Автополивалка',  icon: '/icons/ui/water.svg',   desc: 'Автоматично поливає рослини коли настав час' },
  planter:   { label: 'Автосаджалка',   icon: '/icons/ui/plant.svg',   desc: 'Автоматично саджає обрану рослину на порожні грядки' },
  harvester: { label: 'Автозбирач',     icon: '/icons/ui/harvest.svg', desc: 'Автоматично збирає достиглі рослини' },
};

// GET /api/tools
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM player_tools WHERE player_id=$1`,
      [req.session.playerId]
    );
    const now = new Date();
    const tools = TOOLS.map(type => {
      const t = rows.find(r => r.tool_type === type);
      const active = t && new Date(t.expires_at) > now;
      return {
        tool_type:      type,
        ...TOOL_META[type],
        active,
        expires_at:     t?.expires_at || null,
        auto_plant_id:  t?.auto_plant_id || null,
        auto_plant_name: t?.auto_plant_name || null,
        auto_plant_emoji: t?.auto_plant_emoji || null,
        total_actions:  t?.total_actions  || 0,
        total_greens:   Number(t?.total_greens   || 0),
      };
    });
    res.json({ tools });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/tools/rent  { toolType, days }
router.post('/rent', async (req, res) => {
  try {
    const { toolType, days } = req.body;
    const d = Number(days);
    if (!TOOLS.includes(toolType))        return res.status(400).json({ error: 'Невідомий інструмент' });
    if (![1, 7, 30].includes(d))          return res.status(400).json({ error: 'Невірний термін оренди' });

    const cost = d * 100;
    const { rows: [player] } = await pool.query('SELECT gold FROM players WHERE id=$1', [req.session.playerId]);
    if (player.gold < cost)
      return res.status(400).json({ error: `Недостатньо золота. Потрібно: ${cost}` });

    await pool.query('UPDATE players SET gold=gold-$1 WHERE id=$2', [cost, req.session.playerId]);

    // UPSERT: extend expiry if already active
    await pool.query(
      `INSERT INTO player_tools (player_id, tool_type, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))
       ON CONFLICT (player_id, tool_type) DO UPDATE
         SET expires_at = GREATEST(player_tools.expires_at, NOW()) + ($3 * INTERVAL '1 day')`,
      [req.session.playerId, toolType, d]
    );

    res.json({ success: true, cost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/tools/configure  { plantId }
router.post('/configure', async (req, res) => {
  try {
    const { plantId } = req.body;
    const { rows: [plant] } = await pool.query('SELECT * FROM plants WHERE id=$1', [plantId]);
    if (!plant) return res.status(404).json({ error: 'Рослину не знайдено' });

    const { rows: [player] } = await pool.query('SELECT level FROM players WHERE id=$1', [req.session.playerId]);
    if (player.level < plant.min_level)
      return res.status(400).json({ error: `Потрібен рівень ${plant.min_level}` });
    if (plant.is_boss)
      return res.status(400).json({ error: 'Бос-рослини не можна садити автоматично (коштують золото)' });

    const { rowCount } = await pool.query(
      `UPDATE player_tools SET auto_plant_id=$1, auto_plant_name=$2, auto_plant_emoji=$3
       WHERE player_id=$4 AND tool_type='planter' AND expires_at > NOW()`,
      [plantId, plant.name, plant.emoji, req.session.playerId]
    );
    if (!rowCount) return res.status(400).json({ error: 'Автосаджалка не активна' });

    res.json({ success: true, plant: { id: plant.id, name: plant.name, emoji: plant.emoji } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
