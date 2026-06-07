const { pool } = require('../db');

// Step N is triggered by this action string
const STEP_ACTIONS = {
  1: 'plant',        // Plant any seed in garden
  2: 'harvest',      // Harvest any crop
  3: 'battle',       // Complete any PvP battle
  4: 'buy_pet',      // Buy a pet
  5: 'mine5',        // Mine 5 shafts in caves session
  6: 'water_friend', // Water a friend's plot
};

const STEP_REWARDS = {
  1: { greens: 100,  exp: 20,  gold: 0  },
  2: { greens: 200,  exp: 30,  gold: 0  },
  3: { greens: 300,  exp: 50,  gold: 20 },
  4: { greens: 500,  exp: 50,  gold: 0  },
  5: { greens: 500,  exp: 100, gold: 50 },
  6: { greens: 1000, exp: 100, gold: 50 },
};

const FINAL_REWARD = { greens: 2000, exp: 500, gold: 200 };

async function advanceTutorial(playerId, action, io) {
  try {
    const { rows: [progress] } = await pool.query(
      'SELECT * FROM tutorial_progress WHERE player_id=$1', [playerId]
    );
    if (!progress || progress.is_completed) return null;

    const step = progress.current_step;
    if (STEP_ACTIONS[step] !== action) return null;

    // Step 5 requires 5 mines done today
    if (step === 5) {
      const { rows: [cave] } = await pool.query(
        `SELECT mines_done FROM caves WHERE player_id=$1 AND created_at::date=NOW()::date`, [playerId]
      );
      if (!cave || cave.mines_done < 5) return null;
    }

    const r = STEP_REWARDS[step];
    const isLast = step === 6;
    const greens = r.greens + (isLast ? FINAL_REWARD.greens : 0);
    const exp    = r.exp    + (isLast ? FINAL_REWARD.exp    : 0);
    const gold   = r.gold   + (isLast ? FINAL_REWARD.gold   : 0);

    await pool.query(
      `UPDATE players SET greens=greens+$1, gold=gold+$2, experience=experience+$3
       ${isLast ? ', novice_badge=true' : ''} WHERE id=$4`,
      [greens, gold, exp, playerId]
    );

    let { rows: [updated] } = await pool.query(
      `UPDATE tutorial_progress
       SET current_step = ${isLast ? 7 : 'current_step+1'},
           is_completed = ${isLast ? 'true' : 'false'},
           completed_at = ${isLast ? 'NOW()' : 'NULL'}
       WHERE player_id=$1 RETURNING *`,
      [playerId]
    );

    if (io) {
      io.to(`player:${playerId}`).emit('tutorial:step', {
        completedStep: step,
        newStep: updated.current_step,
        isCompleted: updated.is_completed,
        reward: { greens, exp, gold },
      });
    }

    return { completedStep: step, newStep: updated.current_step, isCompleted: updated.is_completed, reward: { greens, exp, gold } };
  } catch (err) {
    console.error('[Tutorial advance]', err.message);
    return null;
  }
}

module.exports = { advanceTutorial };
