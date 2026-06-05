const HP_MIN = 2000;
const HP_MAX = 300000;
const HP_PER_LEVEL = (HP_MAX - HP_MIN) / 99; // ≈ 2980.8

function calcMaxHp(level) {
  return Math.round(HP_MIN + HP_PER_LEVEL * ((level || 1) - 1));
}

// HP regen per minute = 10% of max per hour / 60 min
function calcHpRegen(maxHp) {
  return Math.max(1, Math.floor(maxHp * 0.1 / 60));
}

module.exports = { calcMaxHp, calcHpRegen };
