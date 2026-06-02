// §3 Характеристики тваринки — бойові формули

// Розрахунок урону тваринки за раунд
// petDamage = floor(pet_power × random(0.8, 1.2) × critMultiplier)
function calcPetDamage(power, ability, abilityUsedThisBattle) {
  const rand = 0.8 + Math.random() * 0.4;
  let critMultiplier = 1.0;
  let abilityProc = false;

  if (ability === 'double_bite') {
    // Вогняний Вовк: 15% шанс ×2 щороунду
    if (Math.random() * 100 < 15) {
      critMultiplier = 2.0;
      abilityProc = true;
    }
  } else if (ability === 'fire_breath') {
    // Дракончик: 10% шанс ×3, але лише раз за бій
    if (!abilityUsedThisBattle && Math.random() * 100 < 10) {
      critMultiplier = 3.0;
      abilityProc = true;
    }
  }
  // golden_eagle (wing_shield) — блок, не урон, обробляється окремо

  const damage = Math.max(1, Math.floor(power * rand * critMultiplier));
  return { damage, abilityProc, critMultiplier };
}

// Перевірка влучення атаки тваринки
// accuracy 1–80 → шанс влучення 50%–100%
function checkPetHit(accuracy) {
  const hitChance = Math.min(100, 50 + accuracy * 0.625);
  return Math.random() * 100 < hitChance;
}

// Шанс влучення у відсотках (для UI)
function petHitChancePct(accuracy) {
  return Math.min(100, Math.round(50 + accuracy * 0.625));
}

// Зменшення вхідного урону завдяки стійкості
// endurance 1–80 → зменшення 0%–40%
function calcPetDefense(endurance, incomingDamage) {
  const reductionPct = Math.min(40, endurance * 0.5);
  const reduced = Math.max(1, Math.floor(incomingDamage * (1 - reductionPct / 100)));
  return reduced;
}

// Ініціатива — хто б'є першим у раунді між тваринками
// Повертає true якщо pet1 б'є першим (speed1 > speed2, при рівних — рандом)
function petGoesFirst(speed1, speed2) {
  if (speed1 !== speed2) return speed1 > speed2;
  return Math.random() < 0.5;
}

// Перевірка блоку Золотого Орла
function checkEagleShield(ability) {
  if (ability !== 'wing_shield') return false;
  return Math.random() * 100 < 20;
}

// Орієнтовний діапазон урону (для UI)
function petDamageRange(power) {
  return {
    min: Math.max(1, Math.floor(power * 0.8)),
    max: Math.floor(power * 1.2),
  };
}

module.exports = {
  calcPetDamage,
  checkPetHit,
  petHitChancePct,
  calcPetDefense,
  petGoesFirst,
  checkEagleShield,
  petDamageRange,
};
