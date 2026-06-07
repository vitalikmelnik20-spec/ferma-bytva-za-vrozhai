const { pool } = require('../db');

const CATEGORIES = {
  farmer:   { label: '🌾 Фермер',     order: 1 },
  warrior:  { label: '⚔️ Воїн',       order: 2 },
  miner:    { label: '⛏️ Шахтар',     order: 3 },
  pets:     { label: '🐾 Тваринник',  order: 4 },
  social:   { label: '🤝 Соціальний', order: 5 },
  clan:     { label: '🏰 Клановий',   order: 6 },
  progress: { label: '📈 Прогрес',    order: 7 },
  trader:   { label: '💰 Торговець',  order: 8 },
  legend:   { label: '🏆 Легенда',    order: 9 },
};

const ACHIEVEMENTS = [
  // ── FARMER ──────────────────────────────────────────────────────────────────
  { key:'harvest_1',   cat:'farmer',   icon:'🌾', name:'Перший урожай',        desc:'Зберіть перший урожай',              stat:'total_harvest',  req:1,       greens:50,    exp:10,  gold:0   },
  { key:'harvest_25',  cat:'farmer',   icon:'🌾', name:'Запасливий',            desc:'Зберіть 25 урожаїв',                stat:'total_harvest',  req:25,      greens:150,   exp:25,  gold:0   },
  { key:'harvest_100', cat:'farmer',   icon:'🌾', name:'Досвідчений фермер',    desc:'Зберіть 100 урожаїв',               stat:'total_harvest',  req:100,     greens:400,   exp:50,  gold:20  },
  { key:'harvest_500', cat:'farmer',   icon:'🌾', name:'Майстер ферми',         desc:'Зберіть 500 урожаїв',               stat:'total_harvest',  req:500,     greens:1500,  exp:150, gold:100 },
  { key:'plot_5',      cat:'farmer',   icon:'🪴', name:'Розширення',            desc:'Купіть 5 грядок',                   stat:'plot_count',     req:5,       greens:200,   exp:30,  gold:0   },
  { key:'plot_10',     cat:'farmer',   icon:'🪴', name:'Велике поле',           desc:'Купіть 10 грядок',                  stat:'plot_count',     req:10,      greens:600,   exp:60,  gold:50  },
  { key:'plot_15',     cat:'farmer',   icon:'🪴', name:'Повний город',          desc:'Максимум 15 грядок',                stat:'plot_count',     req:15,      greens:1500,  exp:150, gold:100 },
  { key:'green_5k',    cat:'farmer',   icon:'💚', name:'Зелена скарбниця',      desc:'Назбирайте 5 000 🌿 за весь час',   stat:'green_total',    req:5000,    greens:200,   exp:30,  gold:0   },
  { key:'green_50k',   cat:'farmer',   icon:'💚', name:'Ферма процвітає',       desc:'Назбирайте 50 000 🌿 за весь час',  stat:'green_total',    req:50000,   greens:1000,  exp:100, gold:50  },
  { key:'green_500k',  cat:'farmer',   icon:'💚', name:'Зелений магнат',        desc:'Назбирайте 500 000 🌿 за весь час', stat:'green_total',    req:500000,  greens:5000,  exp:500, gold:300 },

  // ── WARRIOR ──────────────────────────────────────────────────────────────────
  { key:'battle_1',   cat:'warrior',  icon:'⚔️', name:'Перший бій',            desc:'Проведіть перший бій',              stat:'battle_count',   req:1,       greens:100,   exp:15,  gold:0   },
  { key:'win_5',      cat:'warrior',  icon:'🏅', name:'Переможець',            desc:'Здобудьте 5 перемог',               stat:'wins',           req:5,       greens:200,   exp:30,  gold:0   },
  { key:'win_25',     cat:'warrior',  icon:'🏅', name:'Бойовий дух',           desc:'Здобудьте 25 перемог',              stat:'wins',           req:25,      greens:600,   exp:80,  gold:30  },
  { key:'win_100',    cat:'warrior',  icon:'🏆', name:'Ветеран боїв',          desc:'Здобудьте 100 перемог',             stat:'wins',           req:100,     greens:2000,  exp:200, gold:100 },
  { key:'win_500',    cat:'warrior',  icon:'🏆', name:'Легенда битв',          desc:'Здобудьте 500 перемог',             stat:'wins',           req:500,     greens:8000,  exp:800, gold:500 },
  { key:'glory_100',  cat:'warrior',  icon:'🌟', name:'Слава 100',             desc:'Наберіть 100 слави',                stat:'glory',          req:100,     greens:300,   exp:30,  gold:0   },
  { key:'glory_1k',   cat:'warrior',  icon:'⭐', name:'Слава 1000',            desc:'Наберіть 1000 слави',               stat:'glory',          req:1000,    greens:1500,  exp:150, gold:100 },
  { key:'glory_5k',   cat:'warrior',  icon:'✨', name:'Герой слави',           desc:'Наберіть 5000 слави',               stat:'glory',          req:5000,    greens:8000,  exp:800, gold:500 },
  { key:'insects_1',  cat:'warrior',  icon:'🐛', name:'Захисник полів',        desc:'Відбийте атаку комах',              stat:'insects_def',    req:1,       greens:300,   exp:50,  gold:0   },

  // ── MINER ──────────────────────────────────────────────────────────────────
  { key:'mine_1',     cat:'miner',    icon:'⛏️', name:'Перша шахта',           desc:'Видобудьте першу шахту',            stat:'mine_count',     req:1,       greens:50,    exp:10,  gold:5   },
  { key:'mine_10',    cat:'miner',    icon:'⛏️', name:'Шахтар',                desc:'Видобудьте 10 шахт',                stat:'mine_count',     req:10,      greens:150,   exp:30,  gold:20  },
  { key:'mine_50',    cat:'miner',    icon:'🪨', name:'Гірник',                desc:'Видобудьте 50 шахт',                stat:'mine_count',     req:50,      greens:500,   exp:100, gold:50  },
  { key:'mine_200',   cat:'miner',    icon:'🪨', name:'Майстер шахти',         desc:'Видобудьте 200 шахт',               stat:'mine_count',     req:200,     greens:2000,  exp:300, gold:200 },
  { key:'mine_1000',  cat:'miner',    icon:'💎', name:'Легенда підземель',     desc:'Видобудьте 1000 шахт',              stat:'mine_count',     req:1000,    greens:8000,  exp:1000,gold:1000},
  { key:'mgold_500',  cat:'miner',    icon:'🪙', name:'Золота жила',           desc:'Накопайте 500 золота',              stat:'mine_gold',      req:500,     greens:200,   exp:0,   gold:50  },
  { key:'mgold_5k',   cat:'miner',    icon:'🪙', name:'Золотий рекорд',        desc:'Накопайте 5 000 золота',            stat:'mine_gold',      req:5000,    greens:1000,  exp:0,   gold:500 },
  { key:'msess_10',   cat:'miner',    icon:'🏔️', name:'Постійний шахтар',      desc:'Завершіть 10 сесій у печерах',      stat:'mine_sessions',  req:10,      greens:600,   exp:100, gold:0   },

  // ── PETS ──────────────────────────────────────────────────────────────────
  { key:'pet_1',      cat:'pets',     icon:'🐾', name:'Перша тваринка',        desc:'Придбайте тваринку',                stat:'pet_owned',      req:1,       greens:300,   exp:50,  gold:0   },
  { key:'pet_lv5',    cat:'pets',     icon:'🐾', name:'Вихованець',            desc:'Прокачайте тваринку до рів. 5',     stat:'pet_level',      req:5,       greens:500,   exp:100, gold:0   },
  { key:'pet_lv10',   cat:'pets',     icon:'🦁', name:'Дресирувальник',        desc:'Прокачайте тваринку до рів. 10',    stat:'pet_level',      req:10,      greens:1500,  exp:300, gold:100 },
  { key:'pet_lv20',   cat:'pets',     icon:'🦁', name:'Майстер тварин',        desc:'Прокачайте тваринку до рів. 20',    stat:'pet_level',      req:20,      greens:5000,  exp:1000,gold:500 },

  // ── SOCIAL ──────────────────────────────────────────────────────────────────
  { key:'friend_1',   cat:'social',   icon:'🤝', name:'Перший друг',           desc:'Додайте першого друга',             stat:'friend_count',   req:1,       greens:100,   exp:20,  gold:0   },
  { key:'friend_5',   cat:'social',   icon:'👥', name:'Компанія',              desc:'Додайте 5 друзів',                  stat:'friend_count',   req:5,       greens:400,   exp:50,  gold:0   },
  { key:'friend_10',  cat:'social',   icon:'👥', name:'Душа компанії',         desc:'Додайте 10 друзів',                 stat:'friend_count',   req:10,      greens:1000,  exp:100, gold:0   },
  { key:'msg_1',      cat:'social',   icon:'💬', name:'Перше повідомлення',    desc:'Надішліть перше повідомлення',      stat:'messages_sent',  req:1,       greens:50,    exp:10,  gold:0   },
  { key:'msg_50',     cat:'social',   icon:'💬', name:'Комунікатор',           desc:'Надішліть 50 повідомлень',          stat:'messages_sent',  req:50,      greens:500,   exp:100, gold:0   },
  { key:'gift_1',     cat:'social',   icon:'🎁', name:'Щедрий жест',           desc:'Надішліть подарунок другу',         stat:'gifts_sent',     req:1,       greens:100,   exp:20,  gold:0   },
  { key:'gift_10',    cat:'social',   icon:'🎁', name:'Благодійник',           desc:'Надішліть 10 подарунків',           stat:'gifts_sent',     req:10,      greens:1000,  exp:200, gold:50  },

  // ── CLAN ──────────────────────────────────────────────────────────────────
  { key:'clan_1',     cat:'clan',     icon:'🏰', name:'Клановець',             desc:'Вступіть до клану',                 stat:'has_clan',       req:1,       greens:200,   exp:30,  gold:0   },
  { key:'ctask_10',   cat:'clan',     icon:'📋', name:'Активний учасник',      desc:'Виконайте 10 кланових завдань',     stat:'clan_tasks',     req:10,      greens:500,   exp:100, gold:0   },
  { key:'ctask_50',   cat:'clan',     icon:'📋', name:'Клановий герой',        desc:'Виконайте 50 кланових завдань',     stat:'clan_tasks',     req:50,      greens:2000,  exp:300, gold:100 },
  { key:'cwar_1',     cat:'clan',     icon:'⚔️', name:'Клановий воїн',         desc:'Візьміть участь у клановій війні',  stat:'cwar_part',      req:1,       greens:600,   exp:100, gold:0   },
  { key:'cwar_win1',  cat:'clan',     icon:'🎖️', name:'Завойовник',            desc:'Виграйте клановану війну',          stat:'cwar_won',       req:1,       greens:1500,  exp:300, gold:100 },
  { key:'cwar_win5',  cat:'clan',     icon:'🎖️', name:'Непереможний',          desc:'Виграйте 5 кланових воєн',          stat:'cwar_won',       req:5,       greens:5000,  exp:1000,gold:500 },

  // ── PROGRESS ──────────────────────────────────────────────────────────────────
  { key:'level_5',    cat:'progress', icon:'📈', name:'Рівень 5',              desc:'Досягніть 5-го рівня',              stat:'level',          req:5,       greens:200,   exp:50,  gold:0   },
  { key:'level_10',   cat:'progress', icon:'📈', name:'Рівень 10',             desc:'Досягніть 10-го рівня',             stat:'level',          req:10,      greens:500,   exp:100, gold:30  },
  { key:'level_20',   cat:'progress', icon:'📈', name:'Рівень 20',             desc:'Досягніть 20-го рівня',             stat:'level',          req:20,      greens:1500,  exp:300, gold:100 },
  { key:'level_30',   cat:'progress', icon:'🔝', name:'Рівень 30',             desc:'Досягніть 30-го рівня',             stat:'level',          req:30,      greens:3000,  exp:600, gold:300 },
  { key:'level_50',   cat:'progress', icon:'🔝', name:'Рівень 50',             desc:'Досягніть 50-го рівня',             stat:'level',          req:50,      greens:8000,  exp:2000,gold:1000},
  { key:'train_10',   cat:'progress', icon:'💪', name:'Початківець тренувань', desc:'Натренуйте характеристику 10 разів', stat:'stat_trains',   req:10,      greens:300,   exp:50,  gold:0   },
  { key:'train_50',   cat:'progress', icon:'💪', name:'Тренований боєць',      desc:'Натренуйте характеристику 50 разів', stat:'stat_trains',   req:50,      greens:1500,  exp:200, gold:50  },
  { key:'potion_1',   cat:'progress', icon:'⚗️', name:'Алхімік',               desc:'Зваріть перше зілля',               stat:'potions_crafted',req:1,       greens:100,   exp:20,  gold:0   },
  { key:'potion_20',  cat:'progress', icon:'⚗️', name:'Майстер алхімік',       desc:'Зваріть 20 зіль',                   stat:'potions_crafted',req:20,      greens:1000,  exp:200, gold:50  },

  // ── TRADER ──────────────────────────────────────────────────────────────────
  { key:'mbuy_1',     cat:'trader',   icon:'🛒', name:'Перша покупка',         desc:'Купіть предмет у магазині',         stat:'market_buys',    req:1,       greens:100,   exp:15,  gold:0   },
  { key:'mbuy_20',    cat:'trader',   icon:'🛒', name:'Постійний покупець',    desc:'Зробіть 20 покупок у магазині',     stat:'market_buys',    req:20,      greens:500,   exp:80,  gold:0   },
  { key:'msell_1',    cat:'trader',   icon:'💹', name:'Перший продаж',         desc:'Виставте лот на аукціоні',          stat:'market_sells',   req:1,       greens:100,   exp:15,  gold:0   },
  { key:'msell_10',   cat:'trader',   icon:'💹', name:'Торговець',             desc:'Виставте 10 лотів на аукціоні',     stat:'market_sells',   req:10,      greens:500,   exp:80,  gold:30  },
  { key:'msell_50',   cat:'trader',   icon:'💹', name:'Базарний гуру',         desc:'Виставте 50 лотів на аукціоні',     stat:'market_sells',   req:50,      greens:2000,  exp:300, gold:200 },
  { key:'equip_5',    cat:'trader',   icon:'🗡️', name:'Озброєний',             desc:'Одягніть 5 предметів одночасно',    stat:'equipped_items', req:5,       greens:500,   exp:100, gold:0   },

  // ── LEGEND ──────────────────────────────────────────────────────────────────
  { key:'novice',     cat:'legend',   icon:'🌱', name:'Новачок',               desc:'Завершіть вступний квест',          stat:'novice_badge',   req:1,       greens:500,   exp:100, gold:0   },
  { key:'play_7',     cat:'legend',   icon:'📅', name:'Тиждень у грі',         desc:'Грайте протягом 7 днів',            stat:'days_since_reg', req:7,       greens:500,   exp:100, gold:0   },
  { key:'play_30',    cat:'legend',   icon:'📅', name:'Місяць у грі',          desc:'Грайте протягом 30 днів',           stat:'days_since_reg', req:30,      greens:2000,  exp:500, gold:100 },
  { key:'play_100',   cat:'legend',   icon:'🎖️', name:'Ветеран гри',           desc:'Грайте протягом 100 днів',          stat:'days_since_reg', req:100,     greens:8000,  exp:2000,gold:500 },
  { key:'dragon_1',   cat:'legend',   icon:'🐉', name:'Охотник на дракона',    desc:'Атакуйте дракона',                  stat:'dragon_battles', req:1,       greens:2000,  exp:500, gold:200 },
];

async function checkAchievements(playerId, io) {
  try {
    const { rows: done } = await pool.query(
      `SELECT achievement_key FROM player_achievements WHERE player_id=$1 AND is_completed=true`,
      [playerId]
    );
    const doneSet = new Set(done.map(r => r.achievement_key));
    const pending = ACHIEVEMENTS.filter(a => !doneSet.has(a.key));
    if (!pending.length) return;

    const { rows: [s] } = await pool.query(`
      SELECT
        COALESCE(p.wins, 0)                                                           AS wins,
        (COALESCE(p.wins,0) + COALESCE(p.losses,0))                                  AS battle_count,
        COALESCE(p.glory, 0)                                                          AS glory,
        COALESCE(p.level, 1)                                                          AS level,
        COALESCE(p.green_total, 0)                                                    AS green_total,
        COALESCE(p.total_harvest, 0)                                                  AS total_harvest,
        COALESCE(p.insects_defeated, 0)                                               AS insects_def,
        CASE WHEN p.novice_badge THEN 1 ELSE 0 END                                   AS novice_badge,
        COALESCE(p.gifts_sent, 0)                                                     AS gifts_sent,
        COALESCE(p.stat_trains, 0)                                                    AS stat_trains,
        COALESCE(p.potions_crafted, 0)                                                AS potions_crafted,
        COALESCE(p.market_buys, 0)                                                    AS market_buys,
        COALESCE(p.market_sells, 0)                                                   AS market_sells,
        COALESCE(p.messages_sent, 0)                                                  AS messages_sent,
        COALESCE(p.dragon_battles, 0)                                                 AS dragon_battles,
        EXTRACT(DAY FROM NOW() - p.created_at)::INTEGER                              AS days_since_reg,
        COALESCE(cs.total_mines_done, 0)                                              AS mine_count,
        COALESCE(cs.total_sessions, 0)                                                AS mine_sessions,
        COALESCE(cs.total_gold, 0)                                                    AS mine_gold,
        (SELECT COUNT(*)::INTEGER FROM plots WHERE player_id = p.id)                 AS plot_count,
        (SELECT COUNT(*)::INTEGER FROM friends
           WHERE status='accepted' AND (requester_id=p.id OR addressee_id=p.id))     AS friend_count,
        COALESCE(GREATEST(
          COALESCE(pt.power_level,1), COALESCE(pt.endurance_level,1),
          COALESCE(pt.speed_level,1), COALESCE(pt.accuracy_level,1)
        ), 0)                                                                         AS pet_level,
        CASE WHEN pet.id IS NOT NULL THEN 1 ELSE 0 END                               AS pet_owned,
        CASE WHEN cm.player_id IS NOT NULL THEN 1 ELSE 0 END                         AS has_clan,
        (SELECT COUNT(*)::INTEGER FROM clan_war_participants WHERE player_id = p.id) AS cwar_part,
        (SELECT COUNT(*)::INTEGER
           FROM clan_war_participants cwp
           JOIN clan_wars cw ON cw.id = cwp.war_id
           WHERE cwp.player_id = p.id AND cw.winner_clan_id = cwp.clan_id
             AND cw.status = 'finished')                                              AS cwar_won,
        (SELECT COUNT(*)::INTEGER
           FROM clan_tasks WHERE completed=true
             AND clan_id=(SELECT clan_id FROM clan_members WHERE player_id=p.id LIMIT 1)) AS clan_tasks,
        (SELECT COUNT(*)::INTEGER FROM inventory WHERE player_id=p.id AND is_equipped=true) AS equipped_items
      FROM players p
      LEFT JOIN caves_stats cs    ON cs.player_id  = p.id
      LEFT JOIN pets pet          ON pet.player_id  = p.id
      LEFT JOIN pet_training pt   ON pt.pet_id      = pet.id
      LEFT JOIN clan_members cm   ON cm.player_id   = p.id
      WHERE p.id = $1
    `, [playerId]);
    if (!s) return;

    const statMap = {
      total_harvest:   s.total_harvest,   plot_count:    s.plot_count,
      green_total:     s.green_total,      battle_count:  s.battle_count,
      wins:            s.wins,             glory:         s.glory,
      insects_def:     s.insects_def,      mine_count:    s.mine_count,
      mine_gold:       s.mine_gold,        mine_sessions: s.mine_sessions,
      pet_owned:       s.pet_owned,        pet_level:     s.pet_level,
      friend_count:    s.friend_count,     messages_sent: s.messages_sent,
      gifts_sent:      s.gifts_sent,       has_clan:      s.has_clan,
      clan_tasks:      s.clan_tasks,       cwar_part:     s.cwar_part,
      cwar_won:        s.cwar_won,         level:         s.level,
      stat_trains:     s.stat_trains,      potions_crafted: s.potions_crafted,
      market_buys:     s.market_buys,      market_sells:  s.market_sells,
      equipped_items:  s.equipped_items,   novice_badge:  s.novice_badge,
      days_since_reg:  s.days_since_reg,   dragon_battles: s.dragon_battles,
    };

    const unlocked = pending.filter(a => (statMap[a.stat] ?? 0) >= a.req);
    if (!unlocked.length) return;

    for (const ach of unlocked) {
      await pool.query(
        `INSERT INTO player_achievements (player_id, achievement_key, is_completed, completed_at)
         VALUES ($1, $2, true, NOW())
         ON CONFLICT (player_id, achievement_key) DO UPDATE
           SET is_completed=true, completed_at=COALESCE(player_achievements.completed_at, NOW())`,
        [playerId, ach.key]
      );
    }

    const totG = unlocked.reduce((s,a) => s + a.greens, 0);
    const totE = unlocked.reduce((s,a) => s + a.exp, 0);
    const totAu = unlocked.reduce((s,a) => s + a.gold, 0);
    if (totG || totE || totAu) {
      await pool.query(
        `UPDATE players SET greens=greens+$1, gold=gold+$2, experience=experience+$3 WHERE id=$4`,
        [totG, totAu, totE, playerId]
      );
    }

    if (io) {
      for (const ach of unlocked) {
        io.to(`player:${playerId}`).emit('achievement:unlocked', {
          key: ach.key, name: ach.name, icon: ach.icon, cat: ach.cat,
          reward: { greens: ach.greens, exp: ach.exp, gold: ach.gold },
        });
      }
    }
  } catch (e) {
    console.error('[checkAchievements]', e.message);
  }
}

module.exports = { ACHIEVEMENTS, CATEGORIES, checkAchievements };
