const { pool } = require('./db');

module.exports = (io) => {
  io.on('connection', (socket) => {
    const session = socket.request.session;
    const playerId = session?.playerId;

    if (playerId) {
      socket.join(`player:${playerId}`);
      io.emit('player:online', { playerId });
    }

    // Global chat
    socket.on('chat:send', async ({ message }) => {
      if (!playerId) return;
      const text = String(message || '').trim().slice(0, 200);
      if (!text) return;

      try {
        const { rows } = await pool.query(
          'SELECT username, faction, level FROM players WHERE id = $1',
          [playerId]
        );
        if (!rows[0]) return;
        const p = rows[0];

        await pool.query(
          'INSERT INTO chat_messages (player_id, message, chat_type) VALUES ($1, $2, $3)',
          [playerId, text, 'global']
        );

        const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        io.emit('chat:message', {
          username: p.username,
          faction: p.faction,
          level: p.level,
          message: text,
          time
        });
      } catch (err) {
        console.error('chat:send error', err);
      }
    });

    // Clan chat
    socket.on('clan:join', (clanId) => {
      socket.join(`clan:${clanId}`);
    });

    socket.on('clan:chat', async ({ clanId, message }) => {
      if (!playerId) return;
      const text = String(message || '').trim().slice(0, 200);
      if (!text) return;

      try {
        const { rows } = await pool.query(
          'SELECT username, faction, level FROM players WHERE id = $1',
          [playerId]
        );
        if (!rows[0]) return;
        const p = rows[0];

        await pool.query(
          'INSERT INTO chat_messages (player_id, clan_id, message, chat_type) VALUES ($1, $2, $3, $4)',
          [playerId, clanId, text, 'clan']
        );

        const time = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
        io.to(`clan:${clanId}`).emit('clan:message', {
          username: p.username,
          faction: p.faction,
          level: p.level,
          message: text,
          time
        });
      } catch (err) {
        console.error('clan:chat error', err);
      }
    });

    // Private message
    socket.on('pm:send', ({ toId, message }) => {
      if (!playerId) return;
      io.to(`player:${toId}`).emit('notification', {
        type: 'pm',
        message: `Особисте повідомлення від гравця`
      });
    });

    // Notify specific player
    socket.on('notify:player', ({ toId, type, message }) => {
      if (!playerId) return;
      io.to(`player:${toId}`).emit('notification', { type, message });
    });

    socket.on('disconnect', () => {
      if (playerId) {
        pool.query('UPDATE players SET is_online = false, last_seen = NOW() WHERE id = $1', [playerId])
          .catch(console.error);
        io.emit('player:offline', { playerId });
      }
    });
  });
};
