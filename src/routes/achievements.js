const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');
const { ACHIEVEMENTS, CATEGORIES } = require('../utils/achievements');

router.use(requireAuth);

// GET /api/achievements — all achievements with player progress + stats
router.get('/', async (req, res) => {
  try {
    const pid = req.session.playerId;

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
        COALESCE(pet.level, 0)                                                        AS pet_level,
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
      LEFT JOIN caves_stats cs  ON cs.player_id  = p.id
      LEFT JOIN pets pet        ON pet.player_id  = p.id
      LEFT JOIN clan_members cm ON cm.player_id   = p.id
      WHERE p.id = $1
    `, [pid]);

    const { rows: completed } = await pool.query(
      `SELECT achievement_key, completed_at FROM player_achievements WHERE player_id=$1 AND is_completed=true`,
      [pid]
    );
    const completedMap = {};
    completed.forEach(r => { completedMap[r.achievement_key] = r.completed_at; });

    const statMap = {
      total_harvest:   s.total_harvest,   plot_count:     s.plot_count,
      green_total:     s.green_total,      battle_count:   s.battle_count,
      wins:            s.wins,             glory:          s.glory,
      insects_def:     s.insects_def,      mine_count:     s.mine_count,
      mine_gold:       s.mine_gold,        mine_sessions:  s.mine_sessions,
      pet_owned:       s.pet_owned,        pet_level:      s.pet_level,
      friend_count:    s.friend_count,     messages_sent:  s.messages_sent,
      gifts_sent:      s.gifts_sent,       has_clan:       s.has_clan,
      clan_tasks:      s.clan_tasks,       cwar_part:      s.cwar_part,
      cwar_won:        s.cwar_won,         level:          s.level,
      stat_trains:     s.stat_trains,      potions_crafted: s.potions_crafted,
      market_buys:     s.market_buys,      market_sells:   s.market_sells,
      equipped_items:  s.equipped_items,   novice_badge:   s.novice_badge,
      days_since_reg:  s.days_since_reg,   dragon_battles: s.dragon_battles,
    };

    const achievements = ACHIEVEMENTS.map(a => ({
      ...a,
      current_value: Math.min(statMap[a.stat] ?? 0, a.req),
      is_completed:  !!completedMap[a.key],
      completed_at:  completedMap[a.key] || null,
    }));

    const totalCompleted = achievements.filter(a => a.is_completed).length;
    res.json({ achievements, categories: CATEGORIES, totalCompleted, totalAch: achievements.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
