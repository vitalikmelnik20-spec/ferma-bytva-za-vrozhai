require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { pool } = require('./src/db');
const setupSocket = require('./src/socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);

io.engine.use(sessionMiddleware);

app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/garden',  require('./src/routes/garden'));
app.use('/api/battle',  require('./src/routes/battle'));
app.use('/api/market',  require('./src/routes/market'));
app.use('/api/village', require('./src/routes/village'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/social',  require('./src/routes/social'));
app.use('/api/admin',   require('./src/routes/admin'));
app.use('/api/rating',  require('./src/routes/rating'));
app.use('/api/caves',   require('./src/routes/caves'));
app.use('/api/rings',     require('./src/routes/rings'));
app.use('/api/talismans', require('./src/routes/talismans'));
app.use('/api/clans',     require('./src/routes/clans'));
app.use('/api/jeweler',   require('./src/routes/jeweler'));
app.use('/api/alchemist', require('./src/routes/alchemist'));
app.use('/api/gifts',     require('./src/routes/gifts'));
app.use('/api/auction',   require('./src/routes/auction'));
app.use('/api/dragon',    require('./src/routes/dragon'));
app.use('/api/insects',   require('./src/routes/insects'));
app.use('/api/daily',     require('./src/routes/daily'));

app.locals.io = io;
setupSocket(io);

// Redirect game routes to game.html
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Daily reset at midnight
const scheduleDailyReset = (io) => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  const doReset = async () => {
    try {
      await pool.query('UPDATE players SET battles_today = 0');
      console.log('[Reset] battles_today скинуто');
    } catch (err) {
      console.error('[Reset] помилка:', err);
    }
    // Create new daily event for today
    try {
      const { getOrCreateTodayEvent } = require('./src/routes/daily');
      const ev = await getOrCreateTodayEvent();
      if (io) io.emit('daily:available', { eventType: ev.event_type });
      console.log(`[Reset] daily event: ${ev.event_type}`);
    } catch (err) { console.error('[Reset] daily event помилка:', err.message); }
    // Notify online players that caves are open
    if (io) io.emit('caves:open');
    console.log('[Reset] caves:open розіслано');
  };

  setTimeout(async () => {
    await doReset();
    setInterval(doReset, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
};

scheduleDailyReset(io);

// HP regeneration — every 1 minute, add hp_regen HP (default 100), capped at max_hp
setInterval(async () => {
  try {
    await pool.query('UPDATE players SET hp = LEAST(max_hp, hp + hp_regen) WHERE hp < max_hp');
  } catch (err) {
    console.error('[Regen] помилка:', err.message);
  }
}, 60 * 1000);

// Insect attack scheduler — every 10 min, spawn for eligible players (~once/day random)
setInterval(async () => {
  try {
    const { rows: eligible } = await pool.query(
      `SELECT DISTINCT pl.player_id FROM plots pl
       WHERE pl.status='growing'
         AND NOT EXISTS (
           SELECT 1 FROM insect_attacks ia
           WHERE ia.player_id=pl.player_id
             AND ia.started_at >= CURRENT_DATE
         )`
    );
    for (const { player_id } of eligible) {
      if (Math.random() >= 0.10) continue;
      const { rows: [{ count }] } = await pool.query(
        `SELECT COUNT(*) FROM plots WHERE player_id=$1 AND status='growing'`, [player_id]
      );
      const plots = parseInt(count);
      if (plots === 0) continue;
      const swarmHp     = plots * 100;
      const penaltyPct  = 20 + Math.floor(Math.random() * 31);
      await pool.query(
        `INSERT INTO insect_attacks (player_id, ends_at, swarm_hp, swarm_max_hp, damage_penalty_pct)
         VALUES ($1, NOW() + interval '30 minutes', $2, $2, $3)`,
        [player_id, swarmHp, penaltyPct]
      );
      io.to(`player:${player_id}`).emit('insects:started', { swarmHp, penaltyPct });
    }
  } catch (err) { console.error('[Insects]', err.message); }
}, 10 * 60 * 1000);

// Dragon event scheduler — fires at 10:00 and 22:00 UTC, checks every minute
{
  const { getActiveEvent, finalizeEvent } = require('./src/routes/dragon');

  async function startDragonEvent() {
    const existing = await getActiveEvent();
    if (existing) return;
    const hp = 50000 + Math.floor(Math.random() * 50000);
    const { rows: [ev] } = await pool.query(
      `INSERT INTO dragon_events (hp_max, hp_current, ends_at)
       VALUES ($1, $1, NOW() + interval '30 minutes') RETURNING *`,
      [hp]
    );
    io.emit('dragon:started', { eventId: ev.id, hpMax: ev.hp_max });
    console.log(`[Dragon] Подія розпочалась! HP: ${hp}`);
  }

  setInterval(async () => {
    try {
      const now = new Date();
      const h = now.getUTCHours(), m = now.getUTCMinutes();
      if ((h === 10 || h === 22) && m === 0) await startDragonEvent();
      const { rows: expired } = await pool.query(
        `SELECT id FROM dragon_events WHERE status='active' AND ends_at <= NOW()`
      );
      for (const ev of expired) await finalizeEvent(ev.id, false, null, io);
    } catch (err) { console.error('[Dragon]', err.message); }
  }, 60 * 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌱 Ферма запущена: http://localhost:${PORT}`);
});
