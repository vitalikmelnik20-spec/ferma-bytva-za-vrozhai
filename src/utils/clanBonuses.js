const { pool } = require('../db');

async function getClanBonuses(playerId) {
  const { rows: [membership] } = await pool.query(
    'SELECT clan_id FROM clan_members WHERE player_id=$1', [playerId]
  );
  if (!membership) return {};
  const { rows: buildings } = await pool.query(
    'SELECT building_key, level FROM clan_buildings WHERE clan_id=$1',
    [membership.clan_id]
  );
  const result = { _clanId: membership.clan_id };
  buildings.forEach(b => { result[b.building_key] = b.level; });
  return result;
}

module.exports = { getClanBonuses };
