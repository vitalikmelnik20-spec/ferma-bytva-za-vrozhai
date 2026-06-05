const { pool } = require('../db');

// Apply lazy HP regen: calculates elapsed time since last_hp_update, adds 10%/hr
// Only runs if at least 60 seconds passed (prevents redundant writes on every /me call)
async function applyHpRegen(playerId) {
  await pool.query(
    `UPDATE players
     SET hp = LEAST(max_hp, hp + GREATEST(0, FLOOR(
       EXTRACT(EPOCH FROM (NOW() - COALESCE(last_hp_update, NOW() - INTERVAL '1 hour'))) / 3600.0
       * max_hp * 0.1
     ))::INTEGER),
     last_hp_update = NOW()
     WHERE id = $1
       AND hp < max_hp
       AND (last_hp_update IS NULL OR NOW() - last_hp_update >= INTERVAL '60 seconds')`,
    [playerId]
  );
}

// Forced apply (no time restriction) — used before heal/fight where accuracy matters
async function applyHpRegenNow(playerId) {
  await pool.query(
    `UPDATE players
     SET hp = LEAST(max_hp, hp + GREATEST(0, FLOOR(
       EXTRACT(EPOCH FROM (NOW() - COALESCE(last_hp_update, NOW() - INTERVAL '1 hour'))) / 3600.0
       * max_hp * 0.1
     ))::INTEGER),
     last_hp_update = NOW()
     WHERE id = $1 AND hp < max_hp`,
    [playerId]
  );
}

module.exports = { applyHpRegen, applyHpRegenNow };
