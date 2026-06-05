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
app.use('/api/tools',        require('./src/routes/tools'));

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

    // Rating: award top-3 per daily tab + reset day counters
    try {
      const writeEvent = require('./src/helpers/writeEvent');
      const DAILY_TABS = [
        { key: 'glory',   field: 'glory_day',          label: 'Слава' },
        { key: 'battles', field: 'wins_day',            label: 'Бої' },
        { key: 'garden',  field: 'green_day',           label: 'Огород' },
        { key: 'caves',   field: 'gold_mined_day',      label: 'Печери' },
        { key: 'dragon',  field: 'dragon_damage_day',   label: 'Дракон' },
        { key: 'level',   field: 'exp_day',             label: 'Рівень' },
      ];
      const DAILY_REWARDS = [
        { rank: 1, gold: 100, green: 5000 },
        { rank: 2, gold: 50,  green: 2500 },
        { rank: 3, gold: 25,  green: 1250 },
      ];
      const WEEKLY_TITLES = {
        glory:   'Легенда Слави', battles: 'Легенда Боїв', garden: 'Легенда Огорода',
        caves:   'Легенда Печер', dragon: 'Драконоборець',
      };
      const now = new Date();
      const isMonday = now.getDay() === 1;

      for (const tab of DAILY_TABS) {
        const { rows: top } = await pool.query(
          `SELECT id, username, ${tab.field} as val FROM players WHERE is_banned=false AND ${tab.field} > 0
           ORDER BY ${tab.field} DESC LIMIT 100`
        );
        for (let i = 0; i < Math.min(top.length, 100); i++) {
          const p = top[i];
          const rank = i + 1;
          const rew = DAILY_REWARDS.find(r => r.rank === rank);
          if (rew) {
            await pool.query(
              `UPDATE players SET gold=gold+$1, greens=greens+$2 WHERE id=$3`,
              [rew.gold, rew.green, p.id]
            );
            await pool.query(
              `INSERT INTO reward_log (player_id,rating_type,period_type,rank,reward_gold,reward_green,period_date)
               VALUES ($1,$2,'day',$3,$4,$5,CURRENT_DATE-1)`,
              [p.id, tab.key, rank, rew.gold, rew.green]
            );
            await writeEvent(p.id, {
              event_type: 'daily_rating_result',
              title: rank === 1 ? `👑 №1 в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`
                                : rank === 2 ? `🥈 №2 в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`
                                : `🥉 №3 в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`,
              body: `Денний рейтинг [${tab.label}]. Нагорода: ${rew.gold} 🏅 та ${rew.green} 🌿 зараховано.`,
              icon: rank===1?'👑':rank===2?'🥈':'🥉', color: rank===1?'gold':'blue',
            }, io);
            io.to(`player:${p.id}`).emit('notification', {
              type: 'rating',
              message: rank===1?`👑 Ти №1 в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`:`🏅 Топ-${rank} в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`,
            });
            // Assign title to top-1
            if (rank === 1 && WEEKLY_TITLES[tab.key]) {
              const titleExpires = new Date(now.getTime() + 7*24*60*60*1000);
              await pool.query(
                `UPDATE players SET active_title=$1, title_expires_at=$2 WHERE id=$3`,
                [WEEKLY_TITLES[tab.key], titleExpires, p.id]
              );
            }
          } else {
            await writeEvent(p.id, {
              event_type: 'daily_rating_result',
              title: `🏅 Ти на #${rank} місці в ${tab.label} за день!`,
              body: `Ти зайняв #${rank} місце. Продовжуй у тому ж дусі!`,
              icon: '🏅', color: 'blue',
            }, io);
          }
          await pool.query(
            `INSERT INTO rating_snapshots (player_id,rating_type,period_type,rank,value,reward_gold,reward_green,period_date)
             VALUES ($1,$2,'day',$3,$4,$5,$6,CURRENT_DATE-1)`,
            [p.id, tab.key, rank, p.val, rew?.gold||0, rew?.green||0]
          );
        }
      }
      // Reset daily counters
      await pool.query(`UPDATE players SET glory_day=0, wins_day=0, green_day=0, gold_mined_day=0, dragon_damage_day=0, exp_day=0`);
      console.log('[Rating] Daily reset + awards done');

      // Weekly awards (Monday only)
      if (isMonday) {
        const WEEKLY_REWARDS = [
          { rank: 1, gold: 200, green: 10000 },
          { rank: 2, gold: 100, green: 5000  },
          { rank: 3, gold: 50,  green: 2500  },
        ];
        for (const tab of DAILY_TABS) {
          const { rows: top } = await pool.query(
            `SELECT id, ${tab.field.replace('_day','_week')} as val FROM players WHERE is_banned=false AND ${tab.field.replace('_day','_week')} > 0
             ORDER BY ${tab.field.replace('_day','_week')} DESC LIMIT 3`
          );
          for (let i = 0; i < top.length; i++) {
            const p = top[i];
            const rank = i + 1;
            const rew = WEEKLY_REWARDS[i];
            await pool.query(`UPDATE players SET gold=gold+$1, greens=greens+$2 WHERE id=$3`, [rew.gold, rew.green, p.id]);
            await pool.query(
              `INSERT INTO reward_log (player_id,rating_type,period_type,rank,reward_gold,reward_green,period_date)
               VALUES ($1,$2,'week',$3,$4,$5,CURRENT_DATE-1)`,
              [p.id, tab.key, rank, rew.gold, rew.green]
            );
            await pool.query(
              `INSERT INTO rating_snapshots (player_id,rating_type,period_type,rank,value,reward_gold,reward_green,period_date)
               VALUES ($1,$2,'week',$3,$4,$5,$6,CURRENT_DATE-1)`,
              [p.id, tab.key, rank, p.val, rew.gold, rew.green]
            );
            await writeEvent(p.id, {
              event_type: 'weekly_rating_result',
              title: rank===1?`👑 №1 тижня в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`
                             :rank===2?`🥈 №2 тижня в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`
                             :`🥉 №3 тижня в ${tab.label}! +${rew.gold}🏅 +${rew.green}🌿`,
              body: `Тижневий рейтинг [${tab.label}]. Нагорода: ${rew.gold} 🏅 та ${rew.green} 🌿.`,
              icon: rank===1?'👑':rank===2?'🥈':'🥉', color: 'gold',
            }, io);
          }
        }
        await pool.query(`UPDATE players SET glory_week=0, wins_week=0, green_week=0, gold_mined_week=0, dragon_damage_week=0, exp_week=0`);
        console.log('[Rating] Weekly reset + awards done');
      }
    } catch (err) { console.error('[Rating cron]', err.message); }
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

  // migration: add per-player cooldown columns to dragon_participants
  (async () => {
    try {
      await pool.query(`ALTER TABLE dragon_participants ADD COLUMN IF NOT EXISTS last_attack_at TIMESTAMP`);
      await pool.query(`ALTER TABLE dragon_participants ADD COLUMN IF NOT EXISTS attack_cooldown_secs INTEGER`);
    } catch (err) { console.error('[dragon cooldown migration]', err.message); }
  })();

  // v3 watering: add water_count + planted_seconds to plots
  (async () => {
    try {
      await pool.query(`ALTER TABLE plots ADD COLUMN IF NOT EXISTS water_count     INTEGER DEFAULT 0`);
      await pool.query(`ALTER TABLE plots ADD COLUMN IF NOT EXISTS planted_seconds INTEGER`);
      // carry over old single-water state
      await pool.query(`UPDATE plots SET water_count=1 WHERE watered=true AND (water_count IS NULL OR water_count=0)`);
      console.log('[v3 watering] Columns ready');
    } catch (err) { console.error('[v3 watering migration]', err.message); }
  })();

  // boss plants gold_price
  (async () => {
    try {
      const { rows: [col] } = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name='plants' AND column_name='gold_price'`
      );
      if (col) return;
      await pool.query(`ALTER TABLE plants ADD COLUMN IF NOT EXISTS gold_price INTEGER`);
      await pool.query(`UPDATE plants SET gold_price = min_level * 2 WHERE is_boss = true`);
      console.log('[v3 plants] Boss gold prices set');
    } catch (err) { console.error('[boss gold_price migration]', err.message); }
  })();

  // player_tools table
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS player_tools (
          id             SERIAL PRIMARY KEY,
          player_id      INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          tool_type      VARCHAR(20) NOT NULL CHECK (tool_type IN ('waterer','planter','harvester')),
          expires_at     TIMESTAMP NOT NULL DEFAULT NOW(),
          auto_plant_id  INTEGER REFERENCES plants(id) ON DELETE SET NULL,
          total_actions  INTEGER NOT NULL DEFAULT 0,
          total_greens   BIGINT  NOT NULL DEFAULT 0,
          UNIQUE(player_id, tool_type)
        )
      `);
      console.log('[tools] Table ready');
    } catch (err) { console.error('[tools table]', err.message); }
  })();

  // Auto-tools cron (every 2 min)
  setInterval(async () => {
    try {
      // ── Auto-waterer ──────────────────────────────────────
      const { rows: watererPlayers } = await pool.query(
        `SELECT DISTINCT player_id FROM player_tools WHERE tool_type='waterer' AND expires_at > NOW()`
      );
      for (const { player_id } of watererPlayers) {
        const { rows: plots } = await pool.query(
          `SELECT id FROM plots
           WHERE player_id=$1 AND status='growing'
             AND COALESCE(water_count,0) < 3 AND planted_seconds > 0
             AND EXTRACT(EPOCH FROM (NOW()-planted_at)) >= planted_seconds*(COALESCE(water_count,0)+1)*0.3`,
          [player_id]
        );
        for (const { id } of plots) {
          await pool.query(
            `UPDATE plots SET water_count=water_count+1, watered=true,
               ready_at=NOW()+(ready_at-NOW())*0.85 WHERE id=$1`, [id]
          );
          await pool.query(
            `UPDATE player_tools SET total_actions=total_actions+1
             WHERE player_id=$1 AND tool_type='waterer'`, [player_id]
          );
        }
      }

      // ── Auto-planter ──────────────────────────────────────
      const { rows: planterRows } = await pool.query(
        `SELECT pt.player_id, pt.auto_plant_id, p.growth_minutes, p.seed_price, p.min_level, p.is_boss
         FROM player_tools pt JOIN plants p ON p.id=pt.auto_plant_id
         WHERE pt.tool_type='planter' AND pt.expires_at > NOW() AND pt.auto_plant_id IS NOT NULL`
      );
      for (const row of planterRows) {
        const { rows: emptyPlots } = await pool.query(
          `SELECT id FROM plots WHERE player_id=$1 AND status='empty'`, [row.player_id]
        );
        if (!emptyPlots.length) continue;
        const { rows: [pl] } = await pool.query(
          `SELECT greens, level FROM players WHERE id=$1`, [row.player_id]
        );
        if (pl.level < row.min_level || row.is_boss) continue;
        for (const { id } of emptyPlots) {
          const { rows: [cur] } = await pool.query(`SELECT greens FROM players WHERE id=$1`, [row.player_id]);
          if (cur.greens < row.seed_price) break;
          await pool.query(
            `UPDATE players SET greens=greens-$1, plants_planted=plants_planted+1 WHERE id=$2`,
            [row.seed_price, row.player_id]
          );
          await pool.query(
            `UPDATE plots SET plant_id=$1, planted_at=NOW(),
               ready_at=NOW()+($2*INTERVAL '1 minute'),
               status='growing', water_count=0, planted_seconds=$3, watered=false, watered_by=NULL
             WHERE id=$4`,
            [row.auto_plant_id, row.growth_minutes, row.growth_minutes * 60, id]
          );
          await pool.query(
            `UPDATE player_tools SET total_actions=total_actions+1
             WHERE player_id=$1 AND tool_type='planter'`, [row.player_id]
          );
        }
      }

      // ── Auto-harvester ────────────────────────────────────
      const { rows: harvesterPlayers } = await pool.query(
        `SELECT DISTINCT player_id FROM player_tools WHERE tool_type='harvester' AND expires_at > NOW()`
      );
      for (const { player_id } of harvesterPlayers) {
        await pool.query(
          `UPDATE plots SET status='ready' WHERE player_id=$1 AND status='growing' AND ready_at<=NOW()`,
          [player_id]
        );
        const { rows: readyPlots } = await pool.query(
          `SELECT pl.id, p.greens_reward, p.exp_reward, p.name as pname
           FROM plots pl JOIN plants p ON p.id=pl.plant_id
           WHERE pl.player_id=$1 AND pl.status='ready'`,
          [player_id]
        );
        if (!readyPlots.length) continue;
        const { rows: [ply] } = await pool.query(
          `SELECT level, experience, exp_to_next FROM players WHERE id=$1`, [player_id]
        );
        let totalGreens = 0, totalExp = 0, newExp = ply.experience, newLevel = ply.level, newExpToNext = ply.exp_to_next;
        for (const plot of readyPlots) {
          totalGreens += plot.greens_reward;
          totalExp    += plot.exp_reward;
          newExp += plot.exp_reward;
          while (newExp >= newExpToNext) {
            newExp -= newExpToNext;
            newLevel++;
            newExpToNext = Math.floor(newExpToNext * 1.5);
          }
          await pool.query(
            `UPDATE plots SET plant_id=NULL, planted_at=NULL, ready_at=NULL,
               status='empty', water_count=0, planted_seconds=NULL, watered=false, watered_by=NULL
             WHERE id=$1`, [plot.id]
          );
          await pool.query(
            `INSERT INTO player_ingredients (player_id, ingredient_name, quantity) VALUES ($1,$2,1)
             ON CONFLICT (player_id, ingredient_name)
             DO UPDATE SET quantity=player_ingredients.quantity+1`,
            [player_id, plot.pname]
          );
        }
        await pool.query(
          `UPDATE players SET greens=greens+$1, total_harvest=total_harvest+$1,
             experience=$2, exp_to_next=$3, level=$4, max_hp=max_hp+$5,
             exp_day=COALESCE(exp_day,0)+$6, exp_week=COALESCE(exp_week,0)+$6 WHERE id=$7`,
          [totalGreens, newExp, newExpToNext, newLevel, (newLevel-ply.level)*100, totalExp, player_id]
        );
        await pool.query(
          `UPDATE player_tools SET total_actions=total_actions+$1, total_greens=total_greens+$2
           WHERE player_id=$3 AND tool_type='harvester'`,
          [readyPlots.length, totalGreens, player_id]
        );
      }
    } catch (err) { console.error('[AutoTools cron]', err.message); }
  }, 2 * 60 * 1000);

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

  // v3 plants migration: 100 plants with frame_color + is_boss
  (async () => {
    try {
      const { rows: [col] } = await pool.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name='plants' AND column_name='frame_color'`
      );
      if (col) { console.log('[v3 plants] Already migrated'); return; }

      await pool.query(`ALTER TABLE plants ADD COLUMN IF NOT EXISTS frame_color VARCHAR(20) DEFAULT 'gray'`);
      await pool.query(`ALTER TABLE plants ADD COLUMN IF NOT EXISTS is_boss BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE plots DROP CONSTRAINT IF EXISTS plots_plant_id_fkey`);
      await pool.query(`ALTER TABLE plots ADD CONSTRAINT plots_plant_id_fkey FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL`);
      await pool.query(`UPDATE plots SET plant_id=NULL, planted_at=NULL, ready_at=NULL, status='empty', watered=false, watered_by=NULL WHERE status IN ('growing','ready')`);
      await pool.query(`DELETE FROM plants`);
      await pool.query(`
        INSERT INTO plants (name,emoji,growth_minutes,greens_reward,exp_reward,seed_price,min_level,frame_color,is_boss) VALUES
        ('Пшениця','🌾',5,50,10,5,1,'gray',false),('Морква','🥕',7,90,10,9,2,'gray',false),
        ('Редиска','🌱',10,162,10,16,3,'gray',false),('Цибуля','🧅',14,292,10,29,4,'gray',false),
        ('Часник','🧄',21,526,11,52,5,'gray',false),('Петрушка','🌿',29,949,11,94,6,'gray',false),
        ('Кріп','🌿',42,1709,11,170,7,'gray',false),('Буряк','🍠',59,3080,12,308,8,'gray',false),
        ('Ріпа','🥔',84,5550,12,555,9,'gray',false),('Капуста','🥬',120,20000,26,2000,10,'gray',true),
        ('Горох','🫛',126,10881,13,1088,11,'gray',false),('Квасоля','🫘',132,11840,13,1184,12,'gray',false),
        ('Салат','🥗',139,12883,14,1288,13,'gray',false),('Шпинат','🥬',146,14018,14,1401,14,'gray',false),
        ('Базилік','🌿',153,15254,15,1525,15,'gray',false),('М''ята','🌿',161,16598,15,1659,16,'gray',false),
        ('Кабачок','🥒',169,18061,16,1806,17,'gray',false),('Огірок','🥒',178,19652,16,1965,18,'gray',false),
        ('Помідор','🍅',187,21384,17,2138,19,'gray',false),('Соняшник','🌻',196,46538,34,4653,20,'gray',true),
        ('Полуниця','🍓',206,25319,18,2531,21,'green',false),('Малина','🍓',217,27550,18,2755,22,'green',false),
        ('Смородина','🫐',228,29978,19,2997,23,'green',false),('Аґрус','🍈',239,32620,19,3262,24,'green',false),
        ('Чорниця','🫐',251,35495,20,3549,25,'green',false),('Суниця','🍓',264,38623,20,3862,26,'green',false),
        ('Брусниця','🍒',277,42026,21,4202,27,'green',false),('Калина','🍒',291,45730,22,4573,28,'green',false),
        ('Терен','🫐',306,49760,22,4976,29,'green',false),('Виноград','🍇',321,108290,46,10829,30,'green',true),
        ('Диня','🍈',337,58916,24,5891,31,'green',false),('Кавун','🍉',354,64108,25,6410,32,'green',false),
        ('Гарбуз','🎃',372,69758,25,6975,33,'green',false),('Ківі','🥝',391,75905,26,7590,34,'green',false),
        ('Манго','🥭',411,82594,27,8259,35,'green',false),('Папая','🥭',432,89873,28,8987,36,'green',false),
        ('Фейхоа','🍐',453,97793,28,9779,37,'green',false),('Ананас','🍍',476,106411,29,10641,38,'green',false),
        ('Маракуя','🫐',500,115788,30,11578,39,'green',false),('Авокадо','🥑',526,251984,62,25198,40,'green',true),
        ('Зілля Сили','💪',552,137094,32,13709,41,'blue',false),('Зілля Спритності','🏃',580,149176,33,14917,42,'blue',false),
        ('Зілля Стійкості','🛡',609,162322,34,16232,43,'blue',false),('Зілля Точності','🎯',640,176626,35,17662,44,'blue',false),
        ('Трава Цілителя','💚',672,192191,36,19219,45,'blue',false),('Корінь Захисту','🌱',706,209127,37,20912,46,'blue',false),
        ('Лист Берсерка','🍃',742,227556,38,22755,47,'blue',false),('Квітка Удачі','🍀',779,247610,40,24761,48,'blue',false),
        ('Пагін Мудреця','🌿',819,269430,41,26943,49,'blue',false),('Зілля Дракона','🐉',860,586346,84,58634,50,'blue',true),
        ('Чарівний Гриб','🍄',903,319008,43,31900,51,'blue',false),('Гриб Мудрості','🍄',949,347120,45,34712,52,'blue',false),
        ('Гриб Відваги','🍄',997,377710,46,37771,53,'blue',false),('Гриб Тіні','🍄',1047,410995,47,41099,54,'blue',false),
        ('Гриб Вогню','🔥',1100,447213,49,44721,55,'blue',false),('Гриб Льоду','❄',1155,486623,50,48662,56,'blue',false),
        ('Гриб Бурі','⚡',1214,529506,52,52950,57,'blue',false),('Гриб Землі','🍄',1275,576168,53,57616,58,'blue',false),
        ('Гриб Духу','🍄',1339,626942,55,62694,59,'blue',false),('Деревний Гриб','🌲',1407,1364380,114,136438,60,'blue',true),
        ('Кристальна Квітка','💎',1478,742307,58,74230,61,'purple',false),('Рубінова Троянда','🌹',1552,807721,60,80772,62,'purple',false),
        ('Сапфірова Лілія','💙',1631,878900,62,87890,63,'purple',false),('Смарагдовий Плющ','🌿',1713,956352,64,95635,64,'purple',false),
        ('Янтарний Кактус','🌵',1799,1040629,66,104062,65,'purple',false),('Діамантовий Лотос','🪷',1890,1132333,68,113233,66,'purple',false),
        ('Онікс-Папороть','🌿',1986,1232118,70,123211,67,'purple',false),('Перламутрова Орхідея','🌸',2086,1340696,72,134069,68,'purple',false),
        ('Аметистовий Мох','🌿',2191,1458842,74,145884,69,'purple',false),('Кришталева Пальма','🌴',2302,3174802,152,317480,70,'purple',true),
        ('Хмарний Цвіт','☁',2418,1727288,79,172728,71,'purple',false),('Зоряний Лист','⭐',2540,1879502,81,187950,72,'purple',false),
        ('Місячна Трава','🌙',2668,2045130,84,204513,73,'purple',false),('Сонячна Квітка','🌸',2803,2225354,86,222535,74,'purple',false),
        ('Зілля Зірок','🌟',2944,2421459,89,242145,75,'purple',false),('Небесний Корінь','🌌',3093,2634846,91,263484,76,'purple',false),
        ('Пагін Світання','🌅',3249,2867037,94,286703,77,'purple',false),('Вечірня Роса','💧',3413,3119690,97,311969,78,'purple',false),
        ('Північне Сяйво','🌌',3585,3394608,100,339460,79,'purple',false),('Зоряна Лілія','🌸',3766,7387504,206,738750,80,'purple',true),
        ('Прадавній Корінь','🌳',3956,4019258,106,401925,81,'orange',false),('Вічнозелений Лист','🍃',4155,4373448,109,437344,82,'orange',false),
        ('Рунічна Квітка','🔮',4365,4758851,112,475885,83,'orange',false),('Ельфійський Цвіт','🌸',4585,5178216,116,517821,84,'orange',false),
        ('Орківська Колючка','🌵',4817,5634538,119,563453,85,'orange',false),('Безсмертник Воїна','⚔',5060,6131072,123,613107,86,'orange',false),
        ('Архонтова Трава','👑',5315,6671362,127,667136,87,'orange',false),('Лист Часу','⏳',5583,7259265,130,725926,88,'orange',false),
        ('Квітка Пророцтва','🔮',5865,7898975,134,789897,89,'orange',false),('Корінь Вічності','🌿',6161,17190118,276,1719011,90,'orange',true),
        ('Драконоцвіт','🐲',6472,9352484,143,935248,91,'gold',false),('Золотоцвіт','🌼',6799,10176656,147,1017665,92,'gold',false),
        ('Фенікс-Квітка','🔥',7142,11073456,151,1107345,93,'gold',false),('Кров Землі','🌋',7502,12049286,156,1204928,94,'gold',false),
        ('Сльоза Богів','💧',7881,13111109,160,1311110,95,'gold',false),('Серце Лісу','🌲',8278,14266503,165,1426650,96,'gold',false),
        ('Зілля Безсмертя','✨',8696,15523715,170,1552371,97,'gold',false),('Квітка Хаосу','💫',9135,16891716,175,1689171,98,'gold',false),
        ('Квітка Порядку','🌸',9596,18380269,181,1838026,99,'gold',false),('Квітка Всесвіту','🌌',10080,40000000,372,4000000,100,'gold',true)
      `);
      console.log('[v3 plants] Migrated: 100 plants inserted');
    } catch (err) { console.error('[v3 plants migration]', err.message); }
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

// Rating system migration
(async () => {
  try {
    const playerCols = [
      'glory_day INTEGER DEFAULT 0',      'glory_week INTEGER DEFAULT 0',
      'wins_day INTEGER DEFAULT 0',        'wins_week INTEGER DEFAULT 0',
      'green_day BIGINT DEFAULT 0',        'green_week BIGINT DEFAULT 0',
      'green_total BIGINT DEFAULT 0',
      'gold_mined_day INTEGER DEFAULT 0',  'gold_mined_week INTEGER DEFAULT 0',
      'gold_mined_total INTEGER DEFAULT 0',
      'dragon_damage_day BIGINT DEFAULT 0','dragon_damage_week BIGINT DEFAULT 0',
      'dragon_damage_total BIGINT DEFAULT 0',
      'exp_day BIGINT DEFAULT 0',          'exp_week BIGINT DEFAULT 0',
      'active_title VARCHAR(100)',          'title_expires_at TIMESTAMP',
    ];
    for (const col of playerCols) {
      try { await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS ${col}`); } catch(e) {}
    }
    // player_tools: add auto_plant_name/emoji if missing
    try { await pool.query(`ALTER TABLE player_tools ADD COLUMN IF NOT EXISTS auto_plant_name VARCHAR`);  } catch(e) {}
    try { await pool.query(`ALTER TABLE player_tools ADD COLUMN IF NOT EXISTS auto_plant_emoji VARCHAR`); } catch(e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rating_snapshots (
        id          SERIAL PRIMARY KEY,
        player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        rating_type VARCHAR(30) NOT NULL,
        period_type VARCHAR(10) NOT NULL,
        rank        INTEGER NOT NULL,
        value       BIGINT NOT NULL,
        reward_gold INTEGER DEFAULT 0,
        reward_green BIGINT DEFAULT 0,
        title_given VARCHAR(100),
        period_date DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_log (
        id          SERIAL PRIMARY KEY,
        player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        rating_type VARCHAR(30) NOT NULL,
        period_type VARCHAR(10) NOT NULL,
        rank        INTEGER NOT NULL,
        reward_gold INTEGER DEFAULT 0,
        reward_green BIGINT DEFAULT 0,
        period_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_reward_log_player ON reward_log(player_id, created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_glory_day ON players(glory_day DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_glory_week ON players(glory_week DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_wins_day ON players(wins_day DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_wins_week ON players(wins_week DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_green_day ON players(green_day DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_green_total ON players(green_total DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_gold_mined_day ON players(gold_mined_day DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_dragon_day ON players(dragon_damage_day DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_players_exp_day ON players(exp_day DESC)`);
    console.log('[Rating] Migration done');
  } catch (err) { console.error('[Rating migration]', err.message); }
})();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌱 Ферма запущена: http://localhost:${PORT}`);
});
