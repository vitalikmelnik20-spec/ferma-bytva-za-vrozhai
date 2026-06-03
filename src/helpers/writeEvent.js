const { pool } = require('../db');

// Write an event record for a player. Non-breaking — swallows errors.
async function writeEvent(playerId, { event_type, title, body = null, icon = '📋', color = 'blue', related_id = null }, io = null) {
  try {
    await pool.query(
      `INSERT INTO events (player_id, event_type, title, body, icon, color, related_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [playerId, event_type, title, body, icon, color, related_id]
    );
    if (io) {
      io.to(`player:${playerId}`).emit('events:new', { event_type, title, icon, color });
      const { rows: [{ count }] } = await pool.query(
        `SELECT COUNT(*) FROM events WHERE player_id=$1 AND is_read=false`, [playerId]
      );
      io.to(`player:${playerId}`).emit('events:count', { unread_count: parseInt(count) });
    }
  } catch (err) {
    console.error('[writeEvent]', err.message);
  }
}

module.exports = writeEvent;
