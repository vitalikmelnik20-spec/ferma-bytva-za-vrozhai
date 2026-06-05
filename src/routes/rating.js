const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

const TABS = {
  glory:   { label: 'Слава',  icon: '/icons/res/glory.png',         fields: { all: 'glory',               day: 'glory_day',         week: 'glory_week'          } },
  level:   { label: 'Рівень', icon: '/icons/stats/level.svg',       fields: { all: 'level',               day: 'exp_day',           week: 'exp_week'            }, extra: 'experience DESC' },
  battles: { label: 'Бої',    icon: '/icons/ui/crossed-swords.svg', fields: { all: 'wins',                day: 'wins_day',          week: 'wins_week'           } },
  garden:  { label: 'Город',  icon: '/icons/ui/plant.svg',          fields: { all: 'green_total',         day: 'green_day',         week: 'green_week'          } },
  caves:   { label: 'Печери', icon: '/icons/ui/pickaxe.svg',        fields: { all: 'gold_mined_total',    day: 'gold_mined_day',    week: 'gold_mined_week'     } },
  dragon:  { label: 'Дракон', icon: '/icons/pets/dragon.svg',       fields: { all: 'dragon_damage_total', day: 'dragon_damage_day', week: 'dragon_damage_week'  } },
};

function getField(tab, period) {
  return TABS[tab]?.fields?.[period] || 'glory';
}

// GET /api/rating?tab=glory&period=day
router.get('/', requireAuth, async (req, res) => {
  try {
    const tab    = TABS[req.query.tab] ? req.query.tab : 'glory';
    const period = ['day', 'week', 'all'].includes(req.query.period) ? req.query.period : 'all';
    const field  = getField(tab, period);
    const extra  = TABS[tab].extra ? `, ${TABS[tab].extra}` : '';

    const periodFilter = (period !== 'all') ? `AND ${field} > 0` : '';

    const { rows } = await pool.query(
      `SELECT id, username, level, faction, gender, experience, exp_to_next, wins, losses,
              glory, glory_day, glory_week,
              wins_day, wins_week,
              green_total, green_day, green_week,
              gold_mined_total, gold_mined_day, gold_mined_week,
              dragon_damage_total, dragon_damage_day, dragon_damage_week,
              exp_day, exp_week,
              ARRAY(SELECT title_name FROM player_titles
                    WHERE player_id=players.id AND expires_at > NOW()
                    ORDER BY granted_at DESC LIMIT 3) AS active_titles
       FROM players
       WHERE is_banned = false ${periodFilter}
       ORDER BY ${field} DESC${extra}
       LIMIT 100`
    );

    const myIdx = rows.findIndex(r => r.id === req.session.playerId);
    let myRank = myIdx >= 0 ? myIdx + 1 : null;
    let myValue = myIdx >= 0 ? Number(rows[myIdx][field]) : 0;
    let myNick = '', myLevel = 1, myFaction = '', myGender = 'male';
    let myExp = 0, myExpToNext = 100, myWins = 0, myLosses = 0;

    if (myIdx >= 0) {
      const me    = rows[myIdx];
      myNick      = me.username;
      myLevel     = me.level;
      myFaction   = me.faction;
      myGender    = me.gender;
      myExp       = me.experience;
      myExpToNext = me.exp_to_next;
      myWins      = me.wins;
      myLosses    = me.losses;
    } else {
      const { rows: [me] } = await pool.query(
        `SELECT username, level, faction, gender, experience, exp_to_next, wins, losses, ${field},
           (SELECT COUNT(*)+1 FROM players WHERE ${field} > p.${field} AND is_banned=false${period !== 'all' ? ` AND ${field} > 0` : ''}) AS my_rank
         FROM players p WHERE id=$1`, [req.session.playerId]
      );
      if (me) {
        myRank      = Number(me.my_rank);
        myValue     = Number(me[field]);
        myNick      = me.username;
        myLevel     = me.level;
        myFaction   = me.faction;
        myGender    = me.gender;
        myExp       = me.experience;
        myExpToNext = me.exp_to_next;
        myWins      = me.wins;
        myLosses    = me.losses;
      }
    }

    // Previous rank from snapshots (for ▲▼ arrow)
    const snapshotPeriod = period === 'week' ? 'week' : 'day';
    const { rows: [snap] } = await pool.query(
      `SELECT rank FROM rating_snapshots
       WHERE player_id=$1 AND rating_type=$2 AND period_type=$3
       ORDER BY period_date DESC LIMIT 1`,
      [req.session.playerId, tab, snapshotPeriod]
    );
    const myPrevRank = snap ? snap.rank : null;

    const list = rows.map((r, i) => ({
      rank:       i + 1,
      playerId:   r.id,
      nick:       r.username,
      level:      r.level,
      faction:    r.faction,
      gender:     r.gender,
      experience: r.experience,
      expToNext:  r.exp_to_next,
      wins:       r.wins,
      losses:     r.losses,
      value:      Number(r[field]),
      titles:     r.active_titles || [],
      title:      r.active_titles?.[0] || null,
    }));

    res.json({
      tab, period,
      myRank, myValue, myPrevRank,
      myNick, myLevel, myFaction, myGender,
      myExp, myExpToNext, myWins, myLosses,
      top3: list.slice(0, 3),
      list: list.slice(3),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/rating/clans
router.get('/clans', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.tag,
              lp.faction,
              COUNT(cm.player_id)  AS member_count,
              COALESCE(SUM(mp.glory), 0) AS clan_glory
       FROM clans c
       LEFT JOIN clan_members cm ON cm.clan_id = c.id
       LEFT JOIN players mp ON mp.id = cm.player_id
       LEFT JOIN players lp ON lp.id = c.leader_id
       GROUP BY c.id, lp.faction
       ORDER BY clan_glory DESC
       LIMIT 100`
    );

    const { rows: myMem } = await pool.query(
      `SELECT clan_id FROM clan_members WHERE player_id=$1`, [req.session.playerId]
    );
    const myClanId = myMem[0]?.clan_id || null;

    const list = rows.map((r, i) => ({
      rank:        i + 1,
      clanId:      r.id,
      name:        r.name,
      tag:         r.tag,
      faction:     r.faction,
      rating:      Number(r.clan_glory),
      memberCount: Number(r.member_count),
    }));

    const myRank = myClanId ? (list.findIndex(r => r.clanId === myClanId) + 1) || null : null;
    res.json({ list, myRank, myClanId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
module.exports.TABS = TABS;
module.exports.getField = getField;
