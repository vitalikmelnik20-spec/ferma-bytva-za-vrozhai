const { pool } = require('./db');
const { getActiveEvent, finalizeEvent } = require('./routes/dragon');

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

    // §10: dragon:attacked — клієнт б'є дракона через socket (альтернатива REST)
    socket.on('dragon:attacked', async () => {
      if (!playerId) return;
      try {
        const ev = await getActiveEvent();
        if (!ev || ev.hp_current <= 0) return;

        const { rows: [player] } = await pool.query(
          `SELECT p.hp, p.max_hp, t.power_level,
                  COALESCE(SUM(CASE WHEN inv.is_equipped THEN it.power_bonus ELSE 0 END),0)::INTEGER AS equip_power
           FROM players p
           LEFT JOIN training t ON t.player_id=p.id
           LEFT JOIN inventory inv ON inv.player_id=p.id
           LEFT JOIN items it ON it.id=inv.item_id
           WHERE p.id=$1 GROUP BY p.hp, p.max_hp, t.power_level`,
          [playerId]
        );
        const power  = (player.power_level || 0) + (player.equip_power || 0);
        const rand   = 0.8 + Math.random() * 0.4;
        const isCrit = Math.random() * 100 < 10;
        const damage = Math.max(1, Math.floor(power * rand * (isCrit ? 2.0 : 1.0)));

        const hpPct = ev.hp_current / ev.hp_max;
        const [lo, hi] = hpPct > 0.75 ? [1,5] : hpPct > 0.5 ? [5,10] : hpPct > 0.25 ? [10,15] : [15,20];
        const counterDmg = Math.max(1, Math.floor(player.max_hp * (lo + Math.random() * (hi - lo)) / 100));
        const newDragonHp = Math.max(0, ev.hp_current - damage);
        const isKilled    = newDragonHp === 0;

        await pool.query(
          `UPDATE dragon_events SET hp_current=$1, total_damage=total_damage+$2 WHERE id=$3`,
          [newDragonHp, damage, ev.id]
        );
        await pool.query(`UPDATE players SET hp=GREATEST(0,hp-$1) WHERE id=$2`, [counterDmg, playerId]);
        await pool.query(
          `INSERT INTO dragon_participants (event_id, player_id, damage_dealt, hits_count) VALUES ($1,$2,$3,1)
           ON CONFLICT (event_id, player_id) DO UPDATE SET
             damage_dealt=dragon_participants.damage_dealt+$3,
             hits_count=dragon_participants.hits_count+1`,
          [ev.id, playerId, damage]
        );

        socket.emit('dragon:attack:result', { damage, isCrit, counterDmg, newDragonHp, hpMax: ev.hp_max, isKilled });
        if (isKilled) await finalizeEvent(ev.id, true, playerId, io);
      } catch (err) { console.error('[socket dragon:attacked]', err.message); }
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
