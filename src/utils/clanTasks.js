const { pool } = require('../db');

const DAILY_TASKS = [
  { key: 'harvest_greens',   description: 'Зібрати 500 зелені з огороду разом',  goal: 500,  reward_greens: 200, reward_gold: 0  },
  { key: 'win_battles',      description: 'Виграти 10 PvP боїв разом',            goal: 10,   reward_greens: 0,   reward_gold: 50 },
  { key: 'treasury_deposit', description: 'Внести 200 зелені до скарбниці разом', goal: 200,  reward_greens: 100, reward_gold: 0  },
];
const WEEKLY_TASKS = [
  { key: 'mine_gold',   description: 'Разом добути 1000 золота в печерах', goal: 1000, reward_greens: 500, reward_gold: 200 },
  { key: 'plant_seeds', description: 'Посадити 200 рослин разом',          goal: 200,  reward_greens: 300, reward_gold: 100 },
];

async function ensureClanTasks(clanId) {
  const now = new Date();

  const dailyReset = new Date(now);
  dailyReset.setHours(24, 0, 0, 0);

  const weeklyReset = new Date(now);
  const daysUntilMonday = (8 - weeklyReset.getDay()) % 7 || 7;
  weeklyReset.setDate(weeklyReset.getDate() + daysUntilMonday);
  weeklyReset.setHours(0, 0, 0, 0);

  const { rows: existingDaily } = await pool.query(
    `SELECT id FROM clan_tasks WHERE clan_id=$1 AND task_type='daily' AND resets_at > NOW() LIMIT 1`,
    [clanId]
  );
  if (!existingDaily.length) {
    for (const t of DAILY_TASKS) {
      await pool.query(
        `INSERT INTO clan_tasks (clan_id,task_type,task_key,description,goal,reward_greens,reward_gold,resets_at,progress,completed)
         VALUES ($1,'daily',$2,$3,$4,$5,$6,$7,0,false)`,
        [clanId, t.key, t.description, t.goal, t.reward_greens, t.reward_gold, dailyReset]
      );
    }
  }

  const { rows: existingWeekly } = await pool.query(
    `SELECT id FROM clan_tasks WHERE clan_id=$1 AND task_type='weekly' AND resets_at > NOW() LIMIT 1`,
    [clanId]
  );
  if (!existingWeekly.length) {
    for (const t of WEEKLY_TASKS) {
      await pool.query(
        `INSERT INTO clan_tasks (clan_id,task_type,task_key,description,goal,reward_greens,reward_gold,resets_at,progress,completed)
         VALUES ($1,'weekly',$2,$3,$4,$5,$6,$7,0,false)`,
        [clanId, t.key, t.description, t.goal, t.reward_greens, t.reward_gold, weeklyReset]
      );
    }
  }
}

async function updateClanTask(playerId, taskKey, increment) {
  try {
    const { rows: [membership] } = await pool.query(
      'SELECT clan_id FROM clan_members WHERE player_id=$1', [playerId]
    );
    if (!membership) return;

    await ensureClanTasks(membership.clan_id);

    const { rows: updated } = await pool.query(
      `UPDATE clan_tasks
       SET progress = LEAST(goal, progress + $1)
       WHERE clan_id=$2 AND task_key=$3 AND completed=false AND resets_at > NOW()
       RETURNING *`,
      [increment, membership.clan_id, taskKey]
    );

    for (const task of updated) {
      if (task.progress >= task.goal) {
        await pool.query('UPDATE clan_tasks SET completed=true WHERE id=$1', [task.id]);
        await pool.query(
          `UPDATE clans SET treasury_greens=treasury_greens+$1, treasury_gold=treasury_gold+$2 WHERE id=$3`,
          [task.reward_greens, task.reward_gold, membership.clan_id]
        );
        if (task.task_type === 'weekly') {
          await pool.query(
            `UPDATE players SET glory=glory+10 WHERE id IN (SELECT player_id FROM clan_members WHERE clan_id=$1)`,
            [membership.clan_id]
          );
        }
      }
    }
  } catch (err) {
    console.error('updateClanTask error:', err.message);
  }
}

module.exports = { updateClanTask, ensureClanTasks };
