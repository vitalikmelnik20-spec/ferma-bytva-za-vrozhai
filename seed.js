require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./src/db');

const ELF_NAMES = [
  'Аеладан','Файон','Сільвар','Лоріан','Тарієль',
  'Елара','Ніссіен','Квелін','Фаєлла','Ліріель'
];
const ORC_NAMES = [
  'Гробаш','Торгар','Крагор','Ормак','Варрок',
  'Скалда','Гнарр','Брузт','Ракторг','Мордак'
];

async function seed() {
  const hash = await bcrypt.hash('test123', 10);
  let inserted = 0;
  let skipped = 0;

  for (let level = 1; level <= 15; level++) {
    // Calculate exp_to_next for this level
    let expToNext = 100;
    for (let l = 1; l < level; l++) expToNext = Math.floor(expToNext * 1.5);

    for (let i = 0; i < 10; i++) {
      const faction = i < 5 ? 'elves' : 'orcs';
      const gender  = i % 2 === 0 ? 'male' : 'female';
      const names   = faction === 'elves' ? ELF_NAMES : ORC_NAMES;
      const username = `${names[i % 5]}_${level}`;

      // Stats scale with level: base 10 + (level-1)*3, ±2 variance
      const v = () => Math.floor(Math.random() * 5) - 2;
      const statBase = 10 + (level - 1) * 3;

      try {
        const { rows } = await pool.query(
          `INSERT INTO players
             (username, password_hash, faction, gender, level,
              experience, exp_to_next, greens, gold, battles_max)
           VALUES ($1,$2,$3,$4,$5, 0,$6,$7,$8, 60)
           ON CONFLICT (username) DO NOTHING
           RETURNING id`,
          [username, hash, faction, gender, level,
           expToNext, level * 500, level * 100]
        );

        if (!rows[0]) { skipped++; continue; }
        const pid = rows[0].id;

        await pool.query(
          `INSERT INTO training (player_id, power_level, endurance_level, speed_level, accuracy_level)
           VALUES ($1,$2,$3,$4,$5)`,
          [pid, statBase + v(), statBase + v(), statBase + v(), statBase + v()]
        );
        await pool.query('INSERT INTO pets (player_id) VALUES ($1)', [pid]);
        await pool.query(
          'INSERT INTO plots (player_id, slot_index) VALUES ($1,0),($1,1)',
          [pid]
        );

        inserted++;
      } catch (err) {
        console.error(`  ✗ ${username}:`, err.message);
      }
    }

    console.log(`  Рівень ${level}: готово`);
  }

  console.log(`\nВставлено: ${inserted} | Пропущено (вже є): ${skipped}`);
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
