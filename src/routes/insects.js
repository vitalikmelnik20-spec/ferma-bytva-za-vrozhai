const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

async function getActiveAttack(playerId) {
  const { rows: [a] } = await pool.query(
    `SELECT * FROM insect_attacks WHERE player_id=$1 AND ends_at > NOW() AND is_defeated=false ORDER BY id DESC LIMIT 1`,
    [playerId]
  );
  return a || null;
}

// GET /api/insects/current
router.get('/current', async (req, res) => {
  try {
    const attack = await getActiveAttack(req.session.playerId);
    const { rows: [{ count: plotCount }] } = await pool.query(
      `SELECT COUNT(*) FROM plots WHERE player_id=$1 AND status='growing'`,
      [req.session.playerId]
    );
    res.json({ attack, growingPlots: parseInt(plotCount) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

// POST /api/insects/fight
router.post('/fight', async (req, res) => {
  try {
    const attack = await getActiveAttack(req.session.playerId);
    if (!attack) return res.status(404).json({ error: 'Немає активної атаки комах' });

    const { rows: [player] } = await pool.query(
      `SELECT t.power_level FROM players p LEFT JOIN training t ON t.player_id=p.id WHERE p.id=$1`,
      [req.session.playerId]
    );

    const power  = player?.power_level || 0;
    const damage = power + 5 + Math.floor(Math.random() * 11);
    const newHp  = Math.max(0, attack.swarm_hp - damage);
    const isDefeated = newHp === 0;

    await pool.query(`UPDATE insect_attacks SET swarm_hp=$1 WHERE id=$2`, [newHp, attack.id]);

    let rewardGreen = 0, rewardExp = 0;

    if (isDefeated) {
      const { rows: [{ count }] } = await pool.query(
        `SELECT COUNT(*) FROM plots WHERE player_id=$1 AND status='growing'`,
        [req.session.playerId]
      );
      const plots = parseInt(count);
      rewardGreen = plots * 50;
      rewardExp   = plots * 10;

      await pool.query(
        `UPDATE insect_attacks SET is_defeated=true, reward_green=$1 WHERE id=$2`,
        [rewardGreen, attack.id]
      );
      await pool.query(
        `UPDATE players SET
           greens=greens+$1, experience=experience+$2,
           insects_defeated=COALESCE(insects_defeated,0)+1,
           insects_greens_saved=COALESCE(insects_greens_saved,0)+$1
         WHERE id=$3`,
        [rewardGreen, rewardExp, req.session.playerId]
      );

      const io = req.app.locals.io;
      io.to(`player:${req.session.playerId}`).emit('insects:defeated', { rewardGreen, rewardExp });
    }

    res.json({ damage, newHp, hpMax: attack.swarm_max_hp, isDefeated, rewardGreen, rewardExp });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Помилка сервера' }); }
});

module.exports = router;
module.exports.getActiveAttack = getActiveAttack;
