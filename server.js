process.env.TZ = 'Europe/Kiev';
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
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
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
app.use('/api/daily',        require('./src/routes/daily'));
app.use('/api/clan-defense', require('./src/routes/clanDefense'));
app.use('/api/pets',         require('./src/routes/pets'));
app.use('/api/greenhouse',   require('./src/routes/greenhouse'));
app.use('/api/bank',         require('./src/routes/bank'));
app.use('/api/events',       require('./src/routes/events'));
app.use('/api/clan-war',     require('./src/routes/clanWar'));

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
    // Auto-cleanup events older than 7 days
    try {
      await pool.query(`DELETE FROM events WHERE created_at < NOW() - INTERVAL '7 days'`);
    } catch (err) { console.error('[Reset] events cleanup помилка:', err.message); }
    // Greenhouse accrual — add daily greens (max 2 days worth)
    try {
      const { DAILY_GREEN } = require('./src/routes/greenhouse');
      const CASE = DAILY_GREEN.map((v, i) => i === 0 ? '' : `WHEN ${i} THEN ${v}`).slice(1).join(' ');
      await pool.query(`
        UPDATE greenhouses
        SET green_available = LEAST(
          green_available + CASE level ${CASE} ELSE 0 END,
          CASE level ${CASE} ELSE 0 END * 2
        )
      `);
      console.log('[Reset] greenhouse accrual виконано');
    } catch (err) { console.error('[Reset] greenhouse помилка:', err.message); }
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

// Pet HP regeneration — every hour, add 10% of hp_max, capped at hp_max
setInterval(async () => {
  try {
    await pool.query(`
      UPDATE pets SET hp_current = LEAST(hp_max, hp_current + GREATEST(1, FLOOR(hp_max * 0.10)::INTEGER))
      WHERE hp_current < hp_max AND is_dead = false
    `);
  } catch (err) {
    console.error('[PetRegen]', err.message);
  }
}, 60 * 60 * 1000);

// Bank deposits — every hour, mark matured deposits as ready and notify players
setInterval(async () => {
  try {
    const { rows: matured } = await pool.query(
      `UPDATE bank_deposits SET status='ready'
       WHERE status='active' AND matures_at <= NOW()
       RETURNING id, player_id, currency, amount, interest_rate`
    );
    for (const dep of matured) {
      const interest = Math.floor(dep.amount * dep.interest_rate / 100);
      const total    = dep.amount + interest;
      const label    = dep.currency === 'gold' ? `${total} золота` : `${total} зелені`;
      await pool.query(
        `INSERT INTO mail (receiver_id, subject, body, is_system) VALUES ($1,$2,$3,true)`,
        [dep.player_id, 'Депозит готовий до отримання',
         `Ваш депозит ${dep.currency === 'gold' ? '🏅' : '🌿'} ${dep.amount} дозрів. Отримайте ${label} у розділі Банк.`]
      );
      io.to(`player:${dep.player_id}`).emit('notification', {
        type: 'bank',
        message: `🏦 Депозит готовий! Забери ${label} у Банку`,
      });
      const writeEvent = require('./src/helpers/writeEvent');
      await writeEvent(dep.player_id, {
        event_type: 'deposit_ready', title: 'Депозит готовий до отримання',
        body: `${dep.currency === 'gold' ? '🏅' : '🌿'} ${dep.amount} дозрів. Забери ${label}.`,
        icon: '🏦', color: 'green',
      }, io);
    }
    if (matured.length) console.log(`[Bank] ${matured.length} депозитів позначено готовими`);
  } catch (err) { console.error('[Bank cron]', err.message); }
}, 60 * 60 * 1000);

// Auction lot cleanup — every 6 hours, expire old lots and release inventory
setInterval(async () => {
  try {
    const { rows: expired } = await pool.query(
      `SELECT id, inv_id FROM auction_lots WHERE status='active' AND expires_at <= NOW()`
    );
    for (const lot of expired) {
      await pool.query(`UPDATE auction_lots SET status='expired' WHERE id=$1`, [lot.id]);
      if (lot.inv_id) await pool.query(`UPDATE inventory SET is_on_auction=false WHERE id=$1`, [lot.inv_id]);
    }
    if (expired.length) console.log(`[Auction] ${expired.length} лотів завершено`);
  } catch (err) { console.error('[Auction cleanup]', err.message); }
}, 6 * 60 * 60 * 1000);

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
      const writeEvent = require('./src/helpers/writeEvent');
      await writeEvent(player_id, {
        event_type: 'insects_attack',
        title: 'Комахи атакували твій город!',
        body: `Рой HP: ${swarmHp}. Штраф до врожаю: -${penaltyPct}%`,
        icon: '🪲', color: 'orange',
      }, io);
    }
  } catch (err) { console.error('[Insects]', err.message); }
}, 10 * 60 * 1000);

// Clan defense scheduler — starts Saturday 20:00 UTC, advances waves every minute
{
  const { startClanDefenseEvents, advanceClanDefenseWaves } = require('./src/routes/clanDefense');
  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getDay() === 6 && now.getHours() === 20 && now.getMinutes() === 0) {
        await startClanDefenseEvents(io);
      }
      await advanceClanDefenseWaves(io);
    } catch (err) { console.error('[ClanDefense]', err.message); }
  }, 60 * 1000);
}

// Dragon event scheduler — fires at 10:00 and 22:00 UTC, checks every minute
{
  const { getActiveEvent, finalizeEvent } = require('./src/routes/dragon');

  async function startDragonEvent() {
    const existing = await getActiveEvent();
    if (existing) return;
    const hp = 1000000;
    const { rows: [ev] } = await pool.query(
      `INSERT INTO dragon_events (hp_max, hp_current, ends_at)
       VALUES ($1, $1, NOW() + interval '2 hours') RETURNING *`,
      [hp]
    );
    io.emit('dragon:started', { eventId: ev.id, hpMax: ev.hp_max });
    console.log(`[Dragon] Подія розпочалась! HP: ${hp}`);
    // Write dragon_start event for all non-banned players
    const writeEvent = require('./src/helpers/writeEvent');
    const { rows: allPlayers } = await pool.query(`SELECT id FROM players WHERE is_banned=false`);
    for (const p of allPlayers) {
      await writeEvent(p.id, {
        event_type: 'dragon_start',
        title: 'Дракон нападає! Бери участь у битві',
        body: `HP дракона: ${hp.toLocaleString('uk-UA')}`,
        icon: '🐉', color: 'red',
      }, io);
    }
  }

  // Finalize any events that expired while the server was offline
  (async () => {
    try {
      const { rows: expired } = await pool.query(
        `SELECT id FROM dragon_events WHERE status='active' AND ends_at <= NOW()`
      );
      for (const ev of expired) await finalizeEvent(ev.id, false, null, io);
      if (expired.length) console.log(`[Dragon] Завершено ${expired.length} протерміновані події при запуску`);
    } catch (err) { console.error('[Dragon startup]', err.message); }
  })();

  // v4: ensure events table exists
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id          SERIAL PRIMARY KEY,
          player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          event_type  VARCHAR(50) NOT NULL,
          title       VARCHAR(200) NOT NULL,
          body        TEXT,
          icon        VARCHAR(10),
          color       VARCHAR(20) DEFAULT 'blue',
          is_read     BOOLEAN NOT NULL DEFAULT false,
          related_id  INTEGER,
          created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS events_player_id_idx ON events(player_id, created_at DESC)`);
    } catch (err) { console.error('[v4 events table]', err.message); }
  })();

  // v4: ensure bank_deposits table exists
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bank_deposits (
          id            SERIAL PRIMARY KEY,
          player_id     INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          currency      VARCHAR(10) NOT NULL CHECK (currency IN ('green','gold')),
          amount        INTEGER NOT NULL,
          interest_rate NUMERIC(5,2) NOT NULL,
          term_days     INTEGER NOT NULL,
          status        VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','ready','withdrawn')),
          created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
          matures_at    TIMESTAMP NOT NULL,
          collected_at  TIMESTAMP
        )
      `);
    } catch (err) { console.error('[v4 bank_deposits table]', err.message); }
  })();

  // v4: ensure greenhouses table exists
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS greenhouses (
          id                SERIAL PRIMARY KEY,
          player_id         INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
          level             INTEGER NOT NULL DEFAULT 1,
          green_available   INTEGER NOT NULL DEFAULT 0,
          last_collected_at TIMESTAMP,
          created_at        TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    } catch (err) { console.error('[v4 greenhouses table]', err.message); }
  })();

  // v4 migration: rebalance Кільце злодія for existing owners
  (async () => {
    try {
      const STEAL_CHANCE = [0, 5, 9, 14, 19, 25, 31, 37, 43, 47, 50];
      const { rows: affected } = await pool.query(`
        UPDATE ring_upgrades ru
        SET steal_chance = CASE ru.ring_level
              WHEN 1 THEN 5 WHEN 2 THEN 9  WHEN 3 THEN 14 WHEN 4 THEN 19
              WHEN 5 THEN 25 WHEN 6 THEN 31 WHEN 7 THEN 37 WHEN 8 THEN 43
              WHEN 9 THEN 47 WHEN 10 THEN 50
            END,
            max_steal_pct = ROUND((ru.ring_level * 0.3)::NUMERIC, 1),
            bonus_value   = CASE ru.ring_level
              WHEN 1 THEN 5 WHEN 2 THEN 9  WHEN 3 THEN 14 WHEN 4 THEN 19
              WHEN 5 THEN 25 WHEN 6 THEN 31 WHEN 7 THEN 37 WHEN 8 THEN 43
              WHEN 9 THEN 47 WHEN 10 THEN 50
            END
        FROM inventory inv
        JOIN items it ON it.id = inv.item_id AND it.name = 'Кільце злодія'
        WHERE ru.inv_id = inv.id
          AND ru.max_steal_pct > (ru.ring_level * 0.3 + 0.01)
        RETURNING ru.player_id, ru.ring_level, ROUND((ru.ring_level * 0.3)::NUMERIC,1) AS new_pct
      `);
      if (affected.length) {
        console.log(`[v4 migration] Кільце злодія: оновлено ${affected.length} власників`);
        for (const row of affected) {
          const sc = STEAL_CHANCE[row.ring_level] ?? 5;
          await pool.query(
            `INSERT INTO mail (receiver_id, subject, body, is_system) VALUES ($1,$2,$3,true)`,
            [row.player_id,
             'Кільце злодія збалансовано',
             `Параметри кільця оновлено (v4). Нові характеристики рів.${row.ring_level}: шанс спрацювання ${sc}%, крадіжка до ${row.new_pct}% золота. Рівень прокачки збережено.`]
          );
        }
      }
    } catch (err) { console.error('[v4 migration ring]', err.message); }
  })();

  setInterval(async () => {
    try {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes();
      if ((h === 10 || h === 22) && m === 0) await startDragonEvent();
      const { rows: expired } = await pool.query(
        `SELECT id FROM dragon_events WHERE status='active' AND ends_at <= NOW()`
      );
      for (const ev of expired) await finalizeEvent(ev.id, false, null, io);
    } catch (err) { console.error('[Dragon]', err.message); }
  }, 60 * 1000);

  // §10: dragon:damage broadcast every 5 seconds (TZ spec)
  setInterval(async () => {
    try {
      const ev = await getActiveEvent();
      if (ev) io.emit('dragon:damage', { eventId: ev.id, hpCurrent: ev.hp_current, hpMax: ev.hp_max });
    } catch (err) { console.error('[Dragon:broadcast]', err.message); }
  }, 5 * 1000);

  // Clan Wars — 4 tables
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clan_wars (
          id                    SERIAL PRIMARY KEY,
          attacker_clan_id      INTEGER NOT NULL REFERENCES clans(id),
          defender_clan_id      INTEGER NOT NULL REFERENCES clans(id),
          status                VARCHAR(20) NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active','finished','draw')),
          attacker_total_damage BIGINT NOT NULL DEFAULT 0,
          defender_total_damage BIGINT NOT NULL DEFAULT 0,
          winner_clan_id        INTEGER REFERENCES clans(id),
          treasury_taken_green  INTEGER NOT NULL DEFAULT 0,
          treasury_taken_gold   INTEGER NOT NULL DEFAULT 0,
          started_at            TIMESTAMP NOT NULL DEFAULT NOW(),
          ends_at               TIMESTAMP NOT NULL,
          finished_at           TIMESTAMP
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clan_war_participants (
          id               SERIAL PRIMARY KEY,
          war_id           INTEGER NOT NULL REFERENCES clan_wars(id),
          player_id        INTEGER NOT NULL REFERENCES players(id),
          clan_id          INTEGER NOT NULL REFERENCES clans(id),
          damage_dealt     BIGINT NOT NULL DEFAULT 0,
          damage_received  BIGINT NOT NULL DEFAULT 0,
          battles_count    INTEGER NOT NULL DEFAULT 0,
          wins             INTEGER NOT NULL DEFAULT 0,
          glory_gained     INTEGER NOT NULL DEFAULT 0,
          glory_lost       INTEGER NOT NULL DEFAULT 0,
          UNIQUE (war_id, player_id)
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clan_war_battles (
          id           SERIAL PRIMARY KEY,
          war_id       INTEGER NOT NULL REFERENCES clan_wars(id),
          battle_id    INTEGER REFERENCES battles(id),
          attacker_id  INTEGER NOT NULL REFERENCES players(id),
          defender_id  INTEGER NOT NULL REFERENCES players(id),
          damage       INTEGER NOT NULL DEFAULT 0,
          is_win       BOOLEAN NOT NULL DEFAULT false,
          created_at   TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clan_war_attack_limits (
          war_id       INTEGER NOT NULL REFERENCES clan_wars(id),
          attacker_id  INTEGER NOT NULL REFERENCES players(id),
          defender_id  INTEGER NOT NULL REFERENCES players(id),
          attacks_used SMALLINT NOT NULL DEFAULT 0,
          PRIMARY KEY (war_id, attacker_id, defender_id)
        )
      `);
      // Add win/loss counters to clans if not exists
      await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS clan_wars_won  INTEGER NOT NULL DEFAULT 0`);
      await pool.query(`ALTER TABLE clans ADD COLUMN IF NOT EXISTS clan_wars_lost INTEGER NOT NULL DEFAULT 0`);

      // --- Migrate old clan_wars schema (attacker_id → attacker_clan_id etc.) ---
      const migrations = [
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS attacker_clan_id      INTEGER REFERENCES clans(id)`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS defender_clan_id      INTEGER REFERENCES clans(id)`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS winner_clan_id        INTEGER REFERENCES clans(id)`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS attacker_total_damage BIGINT NOT NULL DEFAULT 0`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS defender_total_damage BIGINT NOT NULL DEFAULT 0`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS treasury_taken_green  INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS treasury_taken_gold   INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE clan_wars ADD COLUMN IF NOT EXISTS finished_at           TIMESTAMP`,
        // Copy old column values into new columns for any existing rows
        `UPDATE clan_wars SET
           attacker_clan_id      = COALESCE(attacker_clan_id, attacker_id),
           defender_clan_id      = COALESCE(defender_clan_id, defender_id),
           winner_clan_id        = COALESCE(winner_clan_id,   winner_id),
           attacker_total_damage = GREATEST(attacker_total_damage, COALESCE(attacker_dmg, 0)),
           defender_total_damage = GREATEST(defender_total_damage, COALESCE(defender_dmg, 0))
         WHERE attacker_clan_id IS NULL OR defender_clan_id IS NULL`,
        // Fix status CHECK constraint to allow 'draw'
        `ALTER TABLE clan_wars DROP CONSTRAINT IF EXISTS clan_wars_status_check`,
        `ALTER TABLE clan_wars ADD CONSTRAINT clan_wars_status_check
           CHECK (status IN ('active','finished','draw'))`,
        // clan_tasks: add task_key column if missing
        `ALTER TABLE clan_tasks ADD COLUMN IF NOT EXISTS task_key VARCHAR(50)`,
      ];
      for (const sql of migrations) {
        try { await pool.query(sql); } catch (e) { /* column/constraint may already exist */ }
      }

      console.log('[ClanWar] Tables ready');
    } catch (err) { console.error('[ClanWar tables]', err.message); }
  })();

  // Cron: every 5 min — finalize expired clan wars
  setInterval(async () => {
    try {
      const { rows: expired } = await pool.query(
        `SELECT id FROM clan_wars WHERE status='active' AND ends_at <= NOW()`
      );
      const { finishWar } = require('./src/routes/clanWar');
      for (const w of expired) await finishWar(w.id, io);
      if (expired.length) console.log(`[ClanWar] Завершено ${expired.length} воєн`);
    } catch (err) { console.error('[ClanWar cron]', err.message); }
  }, 5 * 60 * 1000);

  // Cron: weekly cleanup — delete detailed war records older than 30 days
  setInterval(async () => {
    try {
      const { rowCount: b } = await pool.query(
        `DELETE FROM clan_war_battles WHERE created_at < NOW() - INTERVAL '30 days'`
      );
      const { rowCount: p } = await pool.query(
        `DELETE FROM clan_war_participants cwp
         USING clan_wars cw
         WHERE cwp.war_id=cw.id AND cw.finished_at < NOW() - INTERVAL '30 days'`
      );
      if (b > 0 || p > 0) console.log(`[ClanWar cleanup] Видалено: ${b} боїв, ${p} учасників`);
    } catch (err) { console.error('[ClanWar cleanup]', err.message); }
  }, 7 * 24 * 60 * 60 * 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌱 Ферма запущена: http://localhost:${PORT}`);
});
