// ─── STATE ───────────────────────────────────────────────────────────────────
let player = null;

// ── Icon helpers (consistent across all pages) ──
const IC = {
  greens:    (s=14) => `<img src="/icons/res/greens.png"       width="${s}" height="${s}" style="vertical-align:middle">`,
  gold:      (s=14) => `<img src="/icons/res/gold.png"         width="${s}" height="${s}" style="vertical-align:middle">`,
  glory:     (s=14) => `<img src="/icons/res/glory.png"        width="${s}" height="${s}" style="vertical-align:middle">`,
  hp:        (s=14) => `<img src="/icons/res/hp.svg"           width="${s}" height="${s}" style="vertical-align:middle">`,
  diamonds:  (s=14) => `<img src="/icons/res/diamonds.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  power:     (s=14) => `<img src="/icons/stats/power.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  endurance: (s=14) => `<img src="/icons/stats/endurance.svg"  width="${s}" height="${s}" style="vertical-align:middle">`,
  speed:     (s=14) => `<img src="/icons/stats/speed.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  accuracy:  (s=14) => `<img src="/icons/stats/accuracy.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  clan:      (s=14) => `<img src="/icons/stats/clan.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  exp:       (s=14) => `<img src="/icons/res/exp.svg"           width="${s}" height="${s}" style="vertical-align:middle">`,
  wins:      (s=14) => `<img src="/icons/stats/wins.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  skull:     (s=14) => `<img src="/icons/stats/skull.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
};

let gardenData = null;
let marketData = null;
let currentPickRound = 1;
let fightTargetId = null;
let fightTargetName = null;
let socket = null;

// ─── INIT ────────────────────────────────────────────────────────────────────
(async function init() {
  // Telegram Mini App: auto-auth if running inside Telegram
  if (window.Telegram?.WebApp?.initData) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    const r = await fetch('/api/auth/telegram-webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: window.Telegram.WebApp.initData })
    });
    if (!r.ok) { window.location.href = '/'; return; }
  }

  const data = await API.get('/api/auth/me');
  if (!data.player) { window.location.href = '/'; return; }
  player = data.player;
  updateHeader();
  updateHomeProfile();
  initSocket();
  navigate('home');
  // Auto-refresh header stats every 5 seconds
  setInterval(refreshPlayer, 5000);
  // Global caves mine notifier — runs on every page
  startCavesBgNotifier();
})();

// ─── CAVE MINE NOTIFIER (global, all pages) ──────────────────────────────────
let _caveNotifMineIdx = null; // which mine we already notified about

function startCavesBgNotifier() {
  // Check immediately, then every 10 seconds
  checkCaveMineReady();
  setInterval(checkCaveMineReady, 10000);
}

async function checkCaveMineReady() {
  // Don't duplicate: if caves page is open, it handles its own rendering
  const cavesActive = document.getElementById('page-caves')?.classList.contains('active');
  if (cavesActive) return;
  try {
    const r = await API.get('/api/caves/today');
    const s = r.session;
    if (!s || s.session_done) { closeCaveNotif(); return; }
    if (!s.is_active) { closeCaveNotif(); return; }
    // Mine is active — show notif if not already shown for this mine
    if (_caveNotifMineIdx === s.current_mine) return;
    _caveNotifMineIdx = s.current_mine;
    const secLeft = Math.max(0, Math.floor((new Date(s.mine_expires_at) - Date.now()) / 1000));
    const sub = `Шахта №${s.current_mine} з ${s.total_mines} · ${Math.floor(secLeft / 60)}:${String(secLeft % 60).padStart(2,'0')}`;
    showCaveNotif(sub, s.mine_expires_at);
  } catch (e) { /* silently ignore */ }
}

function showCaveNotif(sub, expiresAt) {
  const el = document.getElementById('cave-notif');
  document.getElementById('cave-notif-sub').textContent = sub;
  el.style.display = 'flex';
  // Auto-close when mine expires
  const ms = Math.max(0, new Date(expiresAt) - Date.now());
  if (ms > 0) setTimeout(() => closeCaveNotif(), ms);
}

function closeCaveNotif() {
  document.getElementById('cave-notif').style.display = 'none';
}

function goToCaveMine() {
  closeCaveNotif();
  navigate('caves');
}

function updateHeader() {
  if (!player) return;
  document.getElementById('hdr-hp').textContent       = `${player.hp}/${player.max_hp}`;
  document.getElementById('hdr-greens').textContent   = fmtNum(player.greens);
  document.getElementById('hdr-gold').textContent     = fmtNum(player.gold);
  document.getElementById('hdr-diamonds').textContent = fmtNum(player.diamonds);
}

async function refreshPlayer() {
  const data = await API.get('/api/auth/me');
  if (!data.player) return;
  const prev = player;
  player = data.player;
  // Flash header badge if value changed
  [
    ['hdr-hp',       `${player.hp}/${player.max_hp}`,   prev && `${prev.hp}/${prev.max_hp}`],
    ['hdr-greens',   fmtNum(player.greens),              prev && fmtNum(prev.greens)],
    ['hdr-gold',     fmtNum(player.gold),                prev && fmtNum(prev.gold)],
    ['hdr-diamonds', fmtNum(player.diamonds),            prev && fmtNum(prev.diamonds)],
  ].forEach(([id, next, old]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = next;
    if (old !== undefined && old !== next) {
      el.classList.remove('hdr-flash');
      void el.offsetWidth; // reflow to restart animation
      el.classList.add('hdr-flash');
    }
  });
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  // Load data for page
  if (page === 'garden')     loadGarden();
  if (page === 'battle')     loadOpponents();
  if (page === 'market')     loadMarket();
  if (page === 'village')    loadVillage();
  if (page === 'profile')    loadProfile();
  if (page === 'chat')       scrollChat();
  if (page === 'friends')    loadFriends();
  if (page === 'rating')     loadRating();
  if (page === 'clans')      loadClans();
  if (page === 'admin')      loadAdmin();
  if (page === 'stats')      loadStats();
  if (page === 'caves')      { closeCaveNotif(); loadCaves(); }
  if (page !== 'caves')      stopCavesPolling();
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
const NPC_DATA = {
  elves: [
    { avatar: '🧝', name: 'Лео Глаз', speech: 'О, ти знов тут! Поки тебе не було, орки зовсім розбушувались!' },
    { avatar: '👑', name: 'Повелитель Дарт', speech: 'Міць, стійкість, швидкість — це запорука успіху в бою.' },
  ],
  orcs: [
    { avatar: '🗡️', name: 'Гоша Куций', speech: 'Хватай зброю і приєднуйся до нашої Орди — пішли проти длинновухих!' },
    { avatar: '🪨', name: 'Скала Мурамець', speech: 'Ти зловив звірятко! Тепер ти готовий до битви. Вибирай суперника!' },
  ]
};

function updateHomeProfile() {
  if (!player) return;
  const npcs = NPC_DATA[player.faction] || NPC_DATA.elves;
  const npc = npcs[Math.floor(Math.random() * npcs.length)];
  document.getElementById('npc-avatar').textContent = npc.avatar;
  document.getElementById('npc-speech').textContent = npc.speech;

  document.getElementById('mini-avatar').textContent = playerAvatar(player.faction, player.gender);
  const nameEl = document.getElementById('mini-name');
  nameEl.innerHTML = `<span class="${player.faction}">${player.username}</span>`;
  document.getElementById('mini-level').textContent =
    `Рівень ${player.level} | ${factionLabel(player.faction)} | Слава: ${player.glory}`;

  const pct = Math.min(100, Math.floor(player.experience / player.exp_to_next * 100));
  document.getElementById('exp-bar').style.width = pct + '%';
  document.getElementById('exp-label').textContent =
    `${player.experience} / ${player.exp_to_next} досвіду`;

  // Show admin menu btn if admin
  if (player.is_admin) {
    const existing = document.getElementById('admin-menu-btn');
    if (!existing) {
      const grid = document.querySelectorAll('.menu-grid')[1];
      const btn = document.createElement('div');
      btn.id = 'admin-menu-btn';
      btn.className = 'menu-btn';
      btn.innerHTML = '<span class="menu-icon">🔧</span><span class="menu-label">Адмін</span>';
      btn.onclick = () => navigate('admin');
      grid.appendChild(btn);
    }
  }
}

// ─── GARDEN ──────────────────────────────────────────────────────────────────

// SVG plant illustrations for each growth stage
function plantSVG(name, stage) {
  const map = {
    'Пшениця':           'wheat',
    'Морква':            'carrot',
    'Капуста':           'cabbage',
    'Соняшник':          'sunflower',
    'Гарбуз':            'pumpkin',
    'Диня':              'melon',
    'Виноград':          'grapes',
    'Зілля сили':        'herb',
    'Зілля спритності':  'herb',
    'Чарівний гриб':     'mushroom',
  };
  const file = map[name] || 'herb';
  const opacity = stage === 'seedling' ? '0.45' : stage === 'growing' ? '0.75' : '1';
  const size    = stage === 'seedling' ? '32' : stage === 'growing' ? '42' : '52';
  return `<img src="/icons/plants/${file}.svg" width="${size}" height="${size}" style="opacity:${opacity}">`;
}

// Soil strip SVG
const soilSVG = `<svg viewBox="0 0 70 16" width="70" height="16">
  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#8b6030"/><stop offset="100%" stop-color="#6d4c21"/>
  </linearGradient></defs>
  <rect width="70" height="16" fill="url(#sg)" rx="4"/>
  <line x1="6" y1="5"  x2="14" y2="5"  stroke="#a07840" stroke-width="1.5" opacity="0.6"/>
  <line x1="20" y1="7" x2="30" y2="7"  stroke="#a07840" stroke-width="1.5" opacity="0.5"/>
  <line x1="38" y1="4" x2="50" y2="4"  stroke="#a07840" stroke-width="1.5" opacity="0.6"/>
  <line x1="56" y1="7" x2="64" y2="7"  stroke="#a07840" stroke-width="1.5" opacity="0.5"/>
</svg>`;

async function loadGarden() {
  try {
    gardenData = await API.get('/api/garden');
    renderPlots();
  } catch (e) { toast(e.message, true); }
}

function renderPlots() {
  if (!gardenData) return;
  const grid = document.getElementById('plots-grid');
  grid.innerHTML = '';

  gardenData.plots.forEach(plot => {
    const div = document.createElement('div');
    div.className = 'plot-card ' + plot.status;

    if (plot.status === 'empty') {
      div.innerHTML = `
        ${soilSVG}
        <div class="plot-name" style="color:#8d6e3a">Порожня грядка</div>
        <span class="plot-status-badge badge-empty"><img src="/icons/ui/plant.svg" width="14" height="14" style="vertical-align:middle;filter:invert(1)"> Посадити</span>`;
      div.onclick = () => openPlantModal(plot.id);

    } else if (plot.status === 'growing') {
      const secs = Math.max(0, plot.seconds_left);
      const stage = secs > 120 ? 'seedling' : 'growing';
      div.dataset.plotId   = plot.id;
      div.dataset.plantName = plot.plant_name;
      div.innerHTML = `
        <div class="plot-plant growing-anim">${plantSVG(plot.plant_name, stage)}</div>
        ${soilSVG}
        <div class="plot-name">${plot.plant_name}</div>
        <div class="plot-timer" data-secs="${secs}">${fmtTime(secs)}</div>
        <span class="plot-status-badge badge-growing"><img src="/icons/ui/timer.svg" width="13" height="13" style="vertical-align:middle;filter:invert(1)"> Росте</span>
        ${!plot.watered
          ? `<button class="btn btn-blue btn-sm" onclick="waterPlot(event,${plot.id})"><img src="/icons/ui/water.svg" width="14" height="14" style="vertical-align:middle;filter:invert(1)"> Полити</button>`
          : '<span class="text-muted" style="font-size:11px">💧 Полито</span>'}`;

    } else if (plot.status === 'ready') {
      div.innerHTML = `
        <div class="plot-plant">${plantSVG(plot.plant_name, 'ready')}</div>
        ${soilSVG}
        <div class="plot-name">${plot.plant_name}</div>
        <span class="plot-status-badge badge-ready"><img src="/icons/ui/harvest.svg" width="14" height="14" style="vertical-align:middle;filter:invert(1)"> Готово!</span>
        <div class="text-muted" style="font-size:12px">${IC.greens(13)}${plot.greens_reward} ${IC.gold(13)}${plot.exp_reward}</div>`;
      div.onclick = () => harvestPlot(plot.id);
    }

    grid.appendChild(div);
  });

  // Start timers
  startPlotTimers();
}

function startPlotTimers() {
  clearInterval(window._plotTimerInterval);
  window._plotTimerInterval = setInterval(() => {
    document.querySelectorAll('.plot-timer[data-secs]').forEach(el => {
      let s = parseInt(el.dataset.secs) - 1;
      if (s < 0) s = 0;
      el.dataset.secs = s;
      el.textContent = fmtTime(s);
      if (s === 0) {
        const card = el.closest('.plot-card');
        if (card) {
          const plotId    = parseInt(card.dataset.plotId);
          const plantName = card.dataset.plantName || '';
          card.className = 'plot-card ready';
          card.innerHTML = `
            <div class="plot-plant">${plantSVG(plantName, 'ready')}</div>
            ${soilSVG}
            <div class="plot-name">${plantName}</div>
            <span class="plot-status-badge badge-ready"><img src="/icons/ui/harvest.svg" width="14" height="14" style="vertical-align:middle;filter:invert(1)"> Готово!</span>`;
          card.onclick = () => harvestPlot(plotId);
        }
      }
    });
  }, 1000);
}

function openPlantModal(plotId) {
  if (!gardenData?.plants?.length) { toast('Немає доступних рослин', true); return; }
  window._currentPlotId = plotId;
  const list = document.getElementById('plant-list');
  list.innerHTML = gardenData.plants.map(p => `
    <div class="plant-item" onclick="plantSeed(${p.id})">
      <img src="/icons/plants/${(() => { const m={'Пшениця':'wheat','Морква':'carrot','Капуста':'cabbage','Соняшник':'sunflower','Гарбуз':'pumpkin','Диня':'melon','Виноград':'grapes','Зілля сили':'herb','Зілля спритності':'herb','Чарівний гриб':'mushroom'}; return m[p.name]||'herb'; })()}.svg" width="40" height="40" class="plant-emoji-big">
      <div class="plant-info">
        <div class="plant-info-name">${p.name}</div>
        <div class="plant-info-stats">⏱ ${fmtTime(p.growth_minutes * 60)} | 🌿 +${p.greens_reward} | ⭐ +${p.exp_reward}</div>
      </div>
      <div class="plant-price">${IC.greens(13)} ${p.seed_price}</div>
    </div>`).join('');
  document.getElementById('plant-modal').style.display = 'flex';
}

function closePlantModal(e) {
  if (!e || e.target === document.getElementById('plant-modal')) {
    document.getElementById('plant-modal').style.display = 'none';
  }
}

async function plantSeed(plantId) {
  closePlantModal();
  try {
    await API.post(`/api/garden/${window._currentPlotId}/plant`, { plantId });
    toast('Посаджено!');
    await loadGarden();
    await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

async function waterPlot(event, plotId) {
  event.stopPropagation();
  try {
    await API.post(`/api/garden/${plotId}/water`);
    toast('💧 Полито! -10% часу');
    await loadGarden();
  } catch (e) { toast(e.message, true); }
}

async function harvestPlot(plotId) {
  try {
    const r = await API.post(`/api/garden/${plotId}/harvest`);
    toast(`Зібрано! ${IC.greens(13)}+${r.greens} ${IC.gold(13)}+${r.exp}`);
    if (r.levelUp) showLevelUpModal(r);
    await loadGarden();
    await refreshPlayer();
    updateHomeProfile();
  } catch (e) { toast(e.message, true); }
}

function showLevelUpModal(r) {
  const greensReward = r.levelReward || 0;
  const goldReward   = r.goldReward  || r.goldBonus || 0;
  const nextExp      = r.newExpToNext || 0;

  const perksHtml = r.unlockedItems && r.unlockedItems.length
    ? `<div class="levelup-perks-title">Переваги цього рівня:</div>
       ${r.unlockedItems.map(u =>
         `<div class="levelup-perk">- ${u.type === 'plant' ? u.emoji : itemIcon(u.name, 18)} ${u.name}</div>`
       ).join('')}`
    : '';

  const rewardParts = [];
  if (greensReward > 0) rewardParts.push(`${IC.greens(14)} ${fmtNum(greensReward)}`);
  if (goldReward   > 0) rewardParts.push(`${IC.gold(14)} ${fmtNum(goldReward)}`);

  document.getElementById('levelup-body').innerHTML = `
    <div class="levelup-icon-row">
      <div class="levelup-icon">⬆️</div>
      <div class="levelup-icon-text">
        <div class="levelup-title">Новий рівень</div>
        <div class="levelup-text">Ти досяг <b>${r.newLevel}-го</b> рівня!</div>
      </div>
    </div>
    ${rewardParts.length ? `<div class="levelup-rewards">Ти отримав: ${rewardParts.join(' і ')}</div>` : ''}
    <div class="levelup-next">Для наступного рівня треба: ✨ ${fmtNum(nextExp)} досвіду</div>
    ${perksHtml}
    <button class="btn btn-green btn-full" style="margin-top:14px" onclick="closeLevelUpModal()">Закрити</button>`;
  document.getElementById('levelup-modal').style.display = 'flex';
}

function closeLevelUpModal(e) {
  if (!e || e.target === document.getElementById('levelup-modal')) {
    document.getElementById('levelup-modal').style.display = 'none';
  }
}

async function buyPlot() {
  try {
    const r = await API.post('/api/garden/buy');
    toast(`Куплено нову грядку за ${IC.gold(13)}${r.cost}`);
    await loadGarden();
    await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

// ─── BATTLE ──────────────────────────────────────────────────────────────────
async function loadOpponents() {
  showOpponents();
  try {
    const r = await API.get('/api/battle/opponents');
    const list = document.getElementById('opponents-list');
    document.getElementById('battle-limit-bar').textContent =
      `Боїв сьогодні: ${player.battles_today} / ${player.battles_max}`;

    const TIER_STYLE = {
      lower:  { bg: '#f0f7ff', border: '#90caf9', badge: '#1565c0', icon: '⬇️' },
      equal:  { bg: '#fff8e1', border: '#ffe082', badge: '#f57f17', icon: '⚔️' },
      higher: { bg: '#fce4ec', border: '#f48fb1', badge: '#b71c1c', icon: '⬆️' },
    };

    list.innerHTML = r.opponents.map(op => {
      const s = TIER_STYLE[op.tier] || TIER_STYLE.equal;
      if (!op.id) return `
        <div style="background:${s.bg};border:1.5px dashed ${s.border};border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:10px;opacity:.6">
          <span style="font-size:22px">${s.icon}</span>
          <div>
            <div style="font-weight:600;font-size:13px;color:${s.badge}">${op.tierLabel}</div>
            <div style="font-size:12px;color:#999">Немає суперника цього рівня</div>
          </div>
        </div>`;
      return `
        <div style="background:${s.bg};border:1.5px solid ${s.border};border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px">
          <div style="font-size:32px;line-height:1">${playerAvatar(op.faction, 'male')}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <span style="background:${s.badge};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px">${op.tierLabel}</span>
              <span class="${op.faction}" style="font-weight:700;font-size:15px">${op.username}</span>
              <span style="color:#888;font-size:12px">Рів.${op.level}</span>
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:4px">
              ${IC.power(13)}${op.power_level} &nbsp;${IC.endurance(13)}${op.endurance_level} &nbsp;${IC.speed(13)}${op.speed_level} &nbsp;${IC.accuracy(13)}${op.accuracy_level}
              &nbsp;|&nbsp; ⭐ ${op.glory} слави
            </div>
            <div style="font-size:11px;color:#999;font-style:italic">"${op.slogan}"</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-red btn-sm" onclick="startFight(${op.id},'${op.username}')">⚔️ Битись</button>
            <button class="btn btn-blue btn-sm" onclick="viewProfile(${op.id})">👤 Профіль</button>
          </div>
        </div>`;
    }).join('<div style="height:8px"></div>');
  } catch (e) { toast(e.message, true); }
}

function showOpponents() {
  document.getElementById('battle-opponents-view').style.display = '';
  document.getElementById('battle-fight-view').style.display = 'none';
  document.getElementById('battle-result-view').style.display = 'none';
}

const ZONE_LABELS = { head: '🪖 Голова', body: '🛡️ Корпус', legs: '🦵 Ноги' };
const ZONE_UA     = { head: 'голову',   body: 'корпус',    legs: 'ноги'   };

function startFight(opponentId, opponentName) {
  if (player.battles_today >= player.battles_max) {
    toast('Ліміт боїв вичерпано!', true); return;
  }
  fightTargetId   = opponentId;
  fightTargetName = opponentName;
  currentPickRound = 1;

  document.getElementById('battle-opponents-view').style.display = 'none';
  document.getElementById('battle-fight-view').style.display    = '';
  document.getElementById('battle-result-view').style.display   = 'none';
  document.getElementById('fight-opponent-info').innerHTML =
    `<b>Суперник:</b> <span class="orcs">${opponentName}</span>`;
  document.getElementById('fight-round-log').innerHTML = '';
  document.querySelectorAll('.zone-btn').forEach(b => { b.disabled = false; b.classList.remove('selected'); });

  updateRoundPicker();
}

function updateRoundPicker() {
  document.getElementById('round-progress').textContent =
    `Раунд ${currentPickRound} з 3 — обери куди атакувати:`;
  document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('selected'));
}

async function selectZoneForRound(zone) {
  if (currentPickRound > 3) return;
  document.querySelectorAll('.zone-btn').forEach(b => { b.disabled = true; });

  // Flash selected button
  const idx = ['head', 'body', 'legs'].indexOf(zone);
  document.querySelectorAll('.zone-btn')[idx]?.classList.add('selected');

  try {
    const r = await API.post('/api/battle/round', { defenderId: fightTargetId, zone });

    // Append round result to log
    const rd  = r.roundData;
    const aZ  = ZONE_UA[rd.attacker.zone] || rd.attacker.zone;
    const dZ  = ZONE_UA[rd.defender.zone] || rd.defender.zone;
    const aHit = rd.attacker.type === 'miss'
      ? 'Промах. Урон (0)'
      : `${rd.attacker.type === 'crit' ? '<b style="color:#e53935">Критичний удар</b>' : 'Удар'}. Урон (<b>${rd.attacker.damage}</b>)`;
    const dHit = rd.defender.type === 'miss'
      ? 'Промах. Урон (0)'
      : `${rd.defender.type === 'crit' ? '<b style="color:#e53935">Критичний удар</b>' : 'Удар'}. Урон (<b>${rd.defender.damage}</b>)`;

    const entry = document.createElement('div');
    entry.style.cssText = 'margin-bottom:8px;padding:8px 10px;background:#fffde7;border-left:3px solid #f57f17;border-radius:0 8px 8px 0;font-size:13px;line-height:1.7;animation:fadeInLine .25s';
    entry.innerHTML =
      `<div style="color:#1565c0">Ти ударив в ${aZ}. ${aHit}</div>` +
      `<div style="color:#b71c1c">${r.defenderName} ударив в ${dZ}. ${dHit}</div>`;
    document.getElementById('fight-round-log').appendChild(entry);

    currentPickRound++;

    if (r.isLast) {
      setTimeout(async () => {
        showBattleResult(r);
        await refreshPlayer();
      }, 600);
    } else {
      document.querySelectorAll('.zone-btn').forEach(b => { b.disabled = false; });
      updateRoundPicker();
    }
  } catch (e) {
    toast(e.message, true);
    document.querySelectorAll('.zone-btn').forEach(b => { b.disabled = false; });
    showOpponents();
  }
}

async function doFight() {
  // kept for compatibility — not called anymore
  document.querySelectorAll('.zone-btn').forEach(b => b.disabled = true);
  try {
    const r = await API.post('/api/battle/fight', {
      defenderId: fightTargetId,
      zones: selectedZones
    });
    showBattleResult(r);
    await refreshPlayer();
  } catch (e) {
    toast(e.message, true);
    showOpponents();
  }
}

function showBattleResult(r) {
  document.getElementById('battle-fight-view').style.display = 'none';
  document.getElementById('battle-result-view').style.display = '';

  const won = r.attackerWon;
  const bs = 'background:#fffde7;border:1px solid #ffe082;border-radius:10px;padding:10px 12px;margin-bottom:8px';

  document.getElementById('battle-result-body').innerHTML = `
    <div style="background:${won?'#e8f5e9':'#ffebee'};border:1px solid ${won?'#a5d6a7':'#ef9a9a'};border-radius:12px;padding:14px;margin-bottom:10px;text-align:center">
      <div style="font-size:20px;font-weight:700;color:${won?'#2e7d32':'#c62828'};margin-bottom:6px">
        ${won ? '🏆 Перемога' : '💀 Поразка'}
      </div>
      <div style="font-size:15px;font-weight:600;color:${won?'#2e7d32':'#c62828'}">
        ${r.greensReward > 0 ? `${IC.greens(14)} ${won?'+':'-'}${fmtNum(r.greensReward)} зелені` : ''}
        ${(() => { const totalGold = (r.goldReward||0) + (r.ringEffect?.triggered ? r.ringEffect.stolenGold : 0); return totalGold > 0 ? `&nbsp; ${IC.gold(14)} ${won?'+':''}${fmtNum(totalGold)} золота` : ''; })()}
        ${won ? (r.attackerGlory > 0 ? '&nbsp; 🏆 +1 слава' : '') : '&nbsp; 📉 -5 рейтингу'}
      </div>
    </div>

    <div style="${bs}">
      <div style="font-size:13px;line-height:1.8">
        <b>Нанесена шкода:</b><br>
        ${r.attackerName}: <b>${r.attackerDamageDealt}</b> &nbsp;|&nbsp; ${r.defenderName}: <b>${r.defenderDamageDealt}</b>
      </div>
    </div>

    <div style="${bs}">
      <div style="font-size:13px;line-height:1.8">
        <b>Залишилось здоров'я:</b><br>
        ${r.attackerName}: <b style="color:${r.attackerHpAfter<=50?'#e53935':'#2e7d32'}">${r.attackerHpAfter}</b>
        <span style="color:#aaa;font-size:11px">(-${r.attackerHpBefore-r.attackerHpAfter})</span>
        &nbsp;|&nbsp;
        ${r.defenderName}: <b style="color:${r.defenderHpAfter<=50?'#e53935':'#555'}">${r.defenderHpAfter}</b>
        <span style="color:#aaa;font-size:11px">(-${r.defenderHpBefore-r.defenderHpAfter})</span>
      </div>
    </div>

    ${r.ringEffect && r.ringEffect.triggered ? `
    <div style="${bs}">
      <div style="font-size:13px;line-height:1.8">
        💍 <b>Кільце злодія спрацювало!</b><br>
        Ти вкрав <b>${IC.gold(14)} ${fmtNum(r.ringEffect.stolenGold)} золота</b> у ${r.ringEffect.victimName}
      </div>
    </div>` : ''}

    <div class="flex-row" style="gap:8px">
      <button class="btn btn-green" style="flex:1" onclick="loadOpponents();showOpponents()">Наступний бій</button>
      <button class="btn btn-blue" style="flex:1" onclick="showOpponents()">До списку</button>
    </div>`;
}

// ─── MARKET ──────────────────────────────────────────────────────────────────
const ITEM_ICONS = {
  // Weapons
  "Дерев'яний кий":    'club',
  'Залізний меч':      'sword',
  'Сталевий топір':    'axe',
  'Коса смерті':       'scythe',
  // Armor
  'Шкіряний жилет':   'vest',
  'Кольчуга':          'chainmail',
  'Лицарська броня':   'plate-armor',
  // Shields
  "Дерев'яний щит":   'wood-shield',
  'Залізний щит':      'iron-shield',
  // Helmet
  'Шолом воїна':       'helmet',
  // Potions
  'Зілля сили':        'potion-power',
  'Зілля витривалості':'potion-endurance',
  'Зілля швидкості':   'potion-speed',
  // Runes
  'Руна вогню':        'rune-fire',
  'Руна льоду':        'rune-ice',
  // Special
  'Кільце злодія':     'ring',
  'Талісман золотошукача': 'talisman',
};
function itemIcon(name, size=36) {
  const file = ITEM_ICONS[name];
  if (!file) return '📦';
  return `<img src="/icons/items/${file}.svg" width="${size}" height="${size}" style="display:block">`;
}
let currentMarketFilter = 'all';

async function loadMarket() {
  try {
    marketData = await API.get('/api/market');
    filterMarket(currentMarketFilter);
    renderInventory();
  } catch (e) { toast(e.message, true); }
}

function filterMarket(cat) {
  currentMarketFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  event?.target?.classList.add('active');
  if (!marketData) return;

  const items = cat === 'all' ? marketData.items : marketData.items.filter(i => i.category === cat);
  document.getElementById('market-items').innerHTML = items.map(item => {
    const isRing     = item.category === 'ring';
    const isTalisman = item.category === 'talisman';
    const isGoldItem = isRing || isTalisman;
    const priceHtml = isGoldItem
      ? `<div class="item-price">${IC.gold(14)} ${fmtNum(item.price_gold)}</div>`
      : `<div class="item-price">${IC.greens(14)} ${fmtNum(item.price)}</div>`;
    const buyBtn = isRing
      ? `<button class="btn btn-orange btn-sm" onclick="buyRing(${item.id})">Купити</button>`
      : isTalisman
        ? `<button class="btn btn-orange btn-sm" onclick="buyTalisman(${item.id})">Купити</button>`
        : `<button class="btn btn-green btn-sm" onclick="buyItem(${item.id})">Купити</button>`;
    const bonuses = isRing
      ? `<div class="item-bonuses" style="color:#e65100">Шанс крадіжки золота після бою</div>`
      : isTalisman
        ? `<div class="item-bonuses" style="color:#5d4037">+10% до золота з шахт за рівень</div>`
        : `<div class="item-bonuses">${bonusStr(item)}</div>`;
    return `
    <div class="item-card">
      ${itemIcon(item.name)}
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        ${bonuses}
        <div class="item-level">Рівень ${item.min_level}+</div>
      </div>
      <div>
        ${priceHtml}
        ${buyBtn}
      </div>
    </div>`;
  }).join('') || '<p class="text-muted">Немає товарів</p>';
}

function bonusStr(item) {
  const parts = [];
  if (item.power_bonus)    parts.push(`⚡+${item.power_bonus}`);
  if (item.endurance_bonus) parts.push(`🛡️+${item.endurance_bonus}`);
  if (item.speed_bonus)    parts.push(`💨+${item.speed_bonus}`);
  if (item.accuracy_bonus) parts.push(`🎯+${item.accuracy_bonus}`);
  return parts.join(' ') || '—';
}

function renderInventory() {
  if (!marketData) return;
  document.getElementById('inventory-list').innerHTML =
    marketData.inventory.length ? marketData.inventory.map(inv => {
      const isRing     = inv.category === 'ring';
      const isTalisman = inv.category === 'talisman';
      const bonuses = isRing
        ? `<div class="item-bonuses" style="color:#e65100">Кільце злодія — натисни для прокачки</div>`
        : isTalisman
          ? `<div class="item-bonuses" style="color:#5d4037">Талісман — натисни для прокачки</div>`
          : `<div class="item-bonuses">${bonusStr(inv)}</div>`;
      const actions = isRing
        ? `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
             <button class="btn btn-orange btn-sm" onclick="openRingModal(${inv.id})">💍 Прокачка</button>
             ${inv.is_equipped
               ? `<button class="btn btn-gray btn-sm" onclick="unequipItem(${inv.id})">Зняти</button>`
               : `<button class="btn btn-blue btn-sm" onclick="equipItem(${inv.id})">Одягти</button>`}
           </div>`
        : isTalisman
          ? `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
               <button class="btn btn-orange btn-sm" onclick="openTalismanModal(${inv.id})">🏺 Прокачка</button>
               ${inv.is_equipped
                 ? `<button class="btn btn-gray btn-sm" onclick="unequipItem(${inv.id})">Зняти</button>`
                 : `<button class="btn btn-blue btn-sm" onclick="equipItem(${inv.id})">Одягти</button>`}
             </div>`
          : `${inv.is_equipped
              ? `<button class="btn btn-gray btn-sm" onclick="unequipItem(${inv.id})">Зняти</button>`
              : `<button class="btn btn-orange btn-sm" onclick="equipItem(${inv.id})">Одягти</button>`}`;
      return `
      <div class="item-card ${inv.is_equipped ? 'item-equipped' : ''}" data-inv-id="${inv.id}">
        ${itemIcon(inv.name)}
        <div class="item-info">
          <div class="item-name">${inv.name}${inv.upgrade_level > 0 ? ` +${inv.upgrade_level}` : ''}</div>
          ${bonuses}
        </div>
        <div>${actions}</div>
      </div>`;
    }).join('')
    : '<p class="text-muted">Інвентар порожній</p>';
}

async function goToInventoryItem(invId) {
  navigate('market');
  if (!marketData) await loadMarket();
  // Give DOM time to render, then scroll + highlight
  setTimeout(() => {
    const el = document.querySelector(`[data-inv-id="${invId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('item-highlight');
    void el.offsetWidth;
    el.classList.add('item-highlight');
    setTimeout(() => el.classList.remove('item-highlight'), 1800);
  }, 100);
}

async function buyItem(itemId) {
  try {
    await API.post(`/api/market/buy/${itemId}`);
    toast('Куплено!');
    await loadMarket();
    await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

async function equipItem(invId) {
  try {
    await API.post(`/api/market/equip/${invId}`);
    toast('Одягнуто!');
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

async function unequipItem(invId) {
  try {
    await API.post(`/api/market/unequip/${invId}`);
    toast('Знято');
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── RING OF THE THIEF ───────────────────────────────────────────────────────
async function buyRing() {
  try {
    await API.post('/api/rings/buy');
    toast('💍 Кільце злодія куплено!');
    await loadMarket();
    await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

async function openRingModal(invId) {
  try {
    const r = await API.get(`/api/rings/info/${invId}`);
    const ru = r.ring;
    const body = document.getElementById('ring-modal-body');
    const lvl = ru.ring_level;
    const maxed = lvl >= 10;
    const progressPct = lvl / 10 * 100;
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:48px">💍</div>
        <div class="ring-level-badge">Рівень ${lvl} / 10</div>
      </div>
      <div class="ring-progress-wrap"><div class="ring-progress-bar" style="width:${progressPct}%"></div></div>
      <div class="ring-stats">
        <div class="ring-stat-row"><span>Шанс спрацювання</span><b>${ru.steal_chance}%</b></div>
        <div class="ring-stat-row"><span>Макс. крадіжка</span><b>${ru.max_steal_pct}% золота</b></div>
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>⭐ ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      <div style="font-size:13px;color:#888;margin:10px 0 14px">
        Кільце спрацьовує тільки при перемозі в PvP бою. Жертва отримує сповіщення.
      </div>
      ${maxed
        ? `<div style="text-align:center;color:#e65100;font-weight:700;font-size:15px">✨ Максимальний рівень!</div>`
        : `<button class="btn btn-orange btn-full" onclick="upgradeRing(${invId})">
             ⬆️ Покращити до рівня ${lvl + 1} — ${IC.gold(13)} ${fmtNum(r.nextCost)}
           </button>`}`;
    document.getElementById('ring-modal').style.display = 'flex';
  } catch (e) { toast(e.message, true); }
}

function closeRingModal(e) {
  if (!e || e.target === document.getElementById('ring-modal'))
    document.getElementById('ring-modal').style.display = 'none';
}

async function upgradeRing(invId) {
  try {
    const r = await API.post(`/api/rings/upgrade/${invId}`);
    toast(`💍 Кільце покращено до рівня ${r.newLevel}!`);
    await refreshPlayer();
    openRingModal(invId);
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── TALISMAN ────────────────────────────────────────────────────────────────

async function buyTalisman() {
  try {
    await API.post('/api/talismans/buy');
    toast('🏺 Талісман золотошукача куплено!');
    await refreshPlayer();
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

async function openTalismanModal(invId) {
  try {
    const r = await API.get(`/api/talismans/info/${invId}`);
    const tu  = r.talisman;
    const lvl = tu.talisman_level;
    const maxed = lvl >= 10;
    const progressPct = (lvl / 10) * 100;
    const body = document.getElementById('talisman-modal-body');
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <div class="ring-level-badge">Рівень ${lvl} / 10</div>
      </div>
      <div class="ring-progress-wrap"><div class="ring-progress-bar" style="width:${progressPct}%"></div></div>
      <div class="ring-stats">
        <div class="ring-stat-row"><span>Бонус до золота з шахт</span><b>+${tu.bonus_pct}%</b></div>
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>⭐ ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      ${maxed
        ? `<div style="color:#2e7d32;font-weight:700;text-align:center;margin-top:10px">✅ Максимальний рівень!</div>`
        : `<button class="btn btn-orange btn-full" style="margin-top:12px" onclick="upgradeTalisman(${invId})">
             Покращити до рівня ${lvl + 1} — ${IC.gold(13)} ${fmtNum(r.nextCost)}
           </button>`}`;
    document.getElementById('talisman-modal').style.display = 'flex';
  } catch (e) { toast(e.message, true); }
}

function closeTalismanModal(e) {
  if (!e || e.target === document.getElementById('talisman-modal'))
    document.getElementById('talisman-modal').style.display = 'none';
}

async function upgradeTalisman(invId) {
  try {
    const r = await API.post(`/api/talismans/upgrade/${invId}`);
    toast(`🏺 Талісман покращено до рівня ${r.newLevel}! Бонус: +${r.newBonus}%`);
    await refreshPlayer();
    openTalismanModal(invId);
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── VILLAGE ─────────────────────────────────────────────────────────────────
async function loadVillage() {
  try {
    const r = await API.get('/api/village');
    document.getElementById('village-npcs').innerHTML = r.npcs.map(npc => `
      <div class="flex-between" style="padding:10px 0;border-bottom:1px solid #eee">
        <div class="flex-row">
          <span style="font-size:28px">${npc.emoji}</span>
          <div>
            <div style="font-weight:700">${npc.name}</div>
            <div class="text-muted">${npc.desc}</div>
          </div>
        </div>
        ${npc.id === 'healer' ? `<button class="btn btn-green btn-sm" onclick="healPlayer()">Лікувати</button>` : ''}
        ${npc.id === 'smith' ? `<button class="btn btn-orange btn-sm" onclick="navigate('profile')">Кузня</button>` : ''}
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
}

async function healPlayer() {
  try {
    const r = await API.post('/api/village/heal');
    toast(`${IC.hp(13)} Вилікувано +${r.healed} HP за ${IC.greens(13)}${r.cost}`);
    await refreshPlayer();
    loadVillage();
  } catch (e) { toast(e.message, true); }
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

// Preset avatar list
const PRESET_AVATARS = ['🧝','🧙','🏹','⚔️','🛡️','🗡️','🔮','🌿','👑','🐉','🦊','🐺','🦁','🧟','🧛','🔥'];

// SLOT_ICONS replaced by itemIcon() for consistency

function getAvatarHtml(url, faction, gender) {
  if (url && url.startsWith('preset:')) {
    const emoji = url.replace('preset:', '');
    return `<span style="font-size:54px;line-height:1">${emoji}</span>`;
  }
  if (url && url.startsWith('/uploads/')) {
    return `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
  }
  return `<span style="font-size:54px;line-height:1">${playerAvatar(faction, gender)}</span>`;
}

function buildDoll(equippedList, avatarUrl, faction, gender, isOwn) {
  const eq = {};
  equippedList.forEach(e => { if (!eq[e.category]) eq[e.category] = e; });

  const slot = (cat) => {
    const e = eq[cat];
    return e
      ? `<div class="equip-slot" title="${e.name}" ${isOwn ? `onclick="goToInventoryItem(${e.id})" style="cursor:pointer"` : ''}>
           <div>${itemIcon(eq[cat]?.name || '', 28)}</div>
           <div class="equip-slot-name">${e.name}</div>
         </div>`
      : `<div class="equip-slot empty"><div style="opacity:.3">${itemIcon(cat === 'weapon' ? 'Залізний меч' : cat === 'armor' ? 'Кольчуга' : cat === 'helmet' ? 'Шолом воїна' : cat === 'shield' ? 'Залізний щит' : cat === 'rune' ? 'Руна вогню' : cat === 'ring' ? 'Кільце злодія' : cat === 'talisman' ? 'Талісман золотошукача' : 'Зілля сили', 24)}</div></div>`;
  };

  return `
    <div class="profile-doll">
      <div class="doll-col">
        ${slot('weapon')}
        ${slot('armor')}
        ${slot('potion')}
      </div>
      <div class="doll-center">
        ${slot('helmet')}
        <div class="avatar-frame" ${isOwn ? 'onclick="openAvatarModal()"' : ''}>
          ${getAvatarHtml(avatarUrl, faction, gender)}
          ${isOwn ? '<div class="avatar-edit-badge">✏️</div>' : ''}
        </div>
        ${slot('rune')}
      </div>
      <div class="doll-col">
        ${slot('shield')}
        ${slot('ring')}
        ${slot('talisman')}
      </div>
    </div>`;
}

function infoRow(icon, label, value, actionHtml = '') {
  return `<div class="info-row">
    <span class="info-row-icon">${icon}</span>
    <span class="info-row-text">${label}: <b>${value}</b></span>
    ${actionHtml ? `<span class="info-row-action">${actionHtml}</span>` : ''}
  </div>`;
}

function openAvatarModal() {
  document.getElementById('preset-avatar-grid').innerHTML =
    PRESET_AVATARS.map(e =>
      `<div class="preset-av-btn" onclick="selectPresetAvatar('${e}')">${e}</div>`
    ).join('');
  document.getElementById('avatar-modal').style.display = 'flex';
}

function closeAvatarModal(e) {
  if (!e || e.target === document.getElementById('avatar-modal'))
    document.getElementById('avatar-modal').style.display = 'none';
}

async function selectPresetAvatar(emoji) {
  try {
    await API.post('/api/profile/avatar/preset', { emoji });
    toast('Аватар змінено!');
    closeAvatarModal();
    loadProfile();
  } catch(e) { toast(e.message, true); }
}

async function uploadAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('avatar', file);
  try {
    const resp = await fetch('/api/profile/avatar/upload', { method: 'POST', body: formData });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error);
    toast('Аватар завантажено!');
    closeAvatarModal();
    loadProfile();
  } catch(e) { toast(e.message, true); }
}

async function changeCity() {
  const name = prompt('Назва міста:', player.city_name || '');
  if (name === null) return;
  try {
    await API.put('/api/profile/city', { name });
    toast('Місто змінено');
    player.city_name = name;
    loadProfile();
  } catch(e) { toast(e.message, true); }
}

async function loadProfile() {
  try {
    const r = await API.get('/api/profile');
    const p = r.player;
    const el = document.getElementById('profile-content');

    const statRow = (icon, label, stat, key) => `
      <div class="stat-row">
        <span class="stat-icon">${icon}</span>
        <div class="stat-info">
          <div class="stat-name">${label}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${Math.min(100, stat / 50 * 100)}%"></div></div>
        </div>
        <span class="stat-level">Рів.${stat}</span>
        <span class="stat-cost">🌿${fmtNum(r.trainCosts[key])}</span>
        <button class="btn btn-orange btn-sm" onclick="trainStat('${key}')">▲</button>
      </div>`;

    const equipped = r.inventory.filter(i => i.is_equipped);

    el.innerHTML = `
      <div class="panel mb-12">
        <div class="panel-header flex-between">
          <span class="profile-nick-header ${p.faction}">${p.username}</span>
          <span style="font-size:12px">${p.is_online ? '🟢' : '⚫'}</span>
        </div>
        ${buildDoll(equipped, p.avatar_url, p.faction, p.gender, true)}
        <div style="padding:8px 12px 12px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-blue btn-sm" onclick="navigate('stats')">📊 Статистика</button>
          <button class="btn btn-orange btn-sm" onclick="toggleVacation(${p.on_vacation})">
            ${p.on_vacation ? '🏖 Канікули ON' : '🏖 Канікули OFF'}
          </button>
          <button class="btn btn-gray btn-sm" onclick="doLogout()">Вихід</button>
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">📋 Інформація</div>
        ${infoRow(p.is_online ? '🟢' : '⚫', 'Статус', p.is_online ? 'Зараз онлайн' : 'Офлайн')}
        ${infoRow('⬆️', 'Рівень', p.level)}
        ${infoRow('⚔️', 'Фракція', factionLabel(p.faction))}
        ${infoRow('👤', 'Стать', p.gender === 'male' ? 'Чоловіча' : 'Жіноча')}
        ${infoRow(IC.exp(14), 'Досвід', `${fmtNum(p.experience)} / ${fmtNum(p.exp_to_next)}`)}
        ${infoRow(IC.hp(14), "Здоров'я", `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${infoRow(IC.glory(14), 'Слава', fmtNum(p.glory))}
        ${infoRow('🏘️', 'Місто', p.city_name || '—', `<button class="btn btn-orange btn-sm" onclick="changeCity()">Змінити</button>`)}
        ${infoRow(IC.wins(14), 'Перемог', p.wins)}
        ${infoRow(IC.skull(14), 'Поразок', p.losses)}
      </div>

      <div class="panel mb-12">
        <div class="panel-header">💪 Тренування</div>
        <div class="panel-body">
          ${statRow(IC.power(14), 'Мощь',     p.power_level,     'power')}
          ${statRow(IC.endurance(14), 'Стійкість', p.endurance_level, 'endurance')}
          ${statRow(IC.speed(14), 'Швидкість', p.speed_level,     'speed')}
          ${statRow(IC.accuracy(14), 'Точність',  p.accuracy_level,  'accuracy')}
          <div class="divider"></div>
          <div style="font-weight:700;margin-bottom:6px">🐾 Питомець</div>
          ${statRow(IC.power(14), 'Мощь пит.',    p.pet_power,     'pet_power')}
          ${statRow(IC.endurance(14), 'Стійк. пит.', p.pet_endurance, 'pet_endurance')}
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">📬 Пошта</div>
        <div class="panel-body">
          <button class="btn btn-blue btn-sm mb-8" onclick="loadMail()">Відкрити пошту</button>
          <div id="mail-section"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">⚙️ Налаштування</div>
        <div class="panel-body">
          <div class="form-group">
            <label>Статус-рядок</label>
            <input type="text" id="status-input" value="${p.status_text || ''}" maxlength="100">
          </div>
          <button class="btn btn-orange btn-sm" onclick="saveStatus()">Зберегти</button>
        </div>
      </div>`;
  } catch (e) { toast(e.message, true); }
}

async function loadStats() {
  try {
    const r = await API.get('/api/profile/stats');
    const p = r.player;

    const row = (icon, label, value) =>
      `<div class="stats-row">
         <span class="stats-row-icon">${icon}</span>
         <span class="stats-row-label">${label}</span>
         <span class="stats-row-value">${value}</span>
       </div>`;

    const eqRow = (icon, label, base, bonus) =>
      row(icon, label, bonus > 0 ? `${base}<span style="color:#e65100;font-size:12px">+${bonus}</span>` : `${base}`);

    document.getElementById('stats-content').innerHTML = `
      <div class="stats-section">
        <div class="stats-section-title">⚙️ Параметри</div>
        ${eqRow(IC.power(14), 'Сила',      p.power_level,     p.equip_power)}
        ${eqRow(IC.endurance(14), 'Захист',    p.endurance_level, p.equip_endurance)}
        ${eqRow(IC.speed(14), 'Швидкість', p.speed_level,     p.equip_speed)}
        ${eqRow(IC.accuracy(14), 'Точність',  p.accuracy_level,  p.equip_accuracy)}
        ${row(IC.hp(14), "Здоров'я",        `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${row('💗', "Макс. здоров'я",  fmtNum(p.max_hp))}
        ${row('💓', 'Регенерація',     `${p.hp_regen} в хв`)}
      </div>
      <div class="stats-section">
        <div class="stats-section-title">📋 Інше</div>
        ${row('⬆️', 'Рівень',         p.level)}
        ${row(IC.exp(14), 'Досвід',          fmtNum(p.experience))}
        ${row('↗️', 'Наст. рівень',    fmtNum(p.exp_to_next))}
        ${row(IC.glory(14), 'Слава',           fmtNum(p.glory))}
        ${row('🏰', 'Клан',            p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${row('📊', 'Рейтинг',         `#${r.gloryRank}`)}
        ${row('👥', 'Друзів',          r.friendsCount)}
        ${row('⚔️', 'Боїв сьогодні',  `${p.battles_today} / ${p.battles_max}`)}
        ${row(IC.wins(14), 'Перемог',         fmtNum(p.wins))}
        ${row('💀', 'Поразок',         fmtNum(p.losses))}
      </div>
      <div class="stats-section">
        <div class="stats-section-title">📊 Статистика</div>
        ${row('🟢', 'Здобич у боях',   `${IC.greens(13)} ${fmtNum(r.greensEarned)} ${IC.gold(13)} ${fmtNum(p.gold_earned_battle)}`)}
        ${row('🔴', 'Втрати у боях',   `${IC.greens(13)} ${fmtNum(r.greensLost)} ${IC.gold(13)} ${fmtNum(p.gold_lost_battle)}`)}
        ${row('🌱', 'Посаджено рослин', fmtNum(p.plants_planted))}
        ${row('💧', 'Полито рослин',    fmtNum(p.plots_watered))}
        ${row('🌾', 'Зібрано врожаю',  `${IC.greens(13)} ${fmtNum(p.total_harvest)}`)}
        ${row('⛏️', 'Пройдено шахт',    fmtNum(r.cavesMinesDone))}
        ${row('🏅', 'Добуто в печерах', `${fmtNum(r.cavesGold)} золота`)}
      </div>`;
  } catch (e) { toast(e.message, true); }
}

async function trainStat(stat) {
  try {
    const r = await API.post(`/api/profile/train/${stat}`);
    toast(`Рівень підвищено до ${r.newLevel}!`);
    await refreshPlayer();
    loadProfile();
  } catch (e) { toast(e.message, true); }
}

async function toggleVacation(current) {
  try {
    const r = await API.put('/api/profile/vacation');
    toast(r.on_vacation ? '🏖 Канікули увімкнено' : '⚔️ Канікули вимкнено');
    await refreshPlayer();
    loadProfile();
  } catch (e) { toast(e.message, true); }
}

async function saveStatus() {
  const text = document.getElementById('status-input')?.value || '';
  try {
    await API.put('/api/profile/status', { text });
    toast('Статус збережено');
  } catch (e) { toast(e.message, true); }
}

async function loadMail() {
  try {
    const r = await API.get('/api/social/mail');
    const el = document.getElementById('mail-section');
    if (!r.mail.length) { el.innerHTML = '<p class="text-muted">Пошта порожня</p>'; return; }
    el.innerHTML = r.mail.map(m => `
      <div class="item-card ${m.is_read ? '' : 'unread'}" style="flex-direction:column;align-items:flex-start">
        <div class="flex-between" style="width:100%">
          <b>${m.is_system ? '🔔 Система' : `✉️ ${m.sender_name}`}</b>
          <button class="btn btn-red btn-sm" onclick="deleteMail(${m.id})">✕</button>
        </div>
        <div style="font-weight:700">${m.subject || '(без теми)'}</div>
        <div class="text-muted">${m.body.slice(0,100)}${m.body.length>100?'...':''}</div>
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
}

async function deleteMail(id) {
  await API.delete(`/api/social/mail/${id}`);
  loadMail();
}

async function doLogout() {
  await API.post('/api/auth/logout');
  window.location.href = '/';
}

// ─── CHAT ────────────────────────────────────────────────────────────────────
async function initChatHistory() {
  try {
    const r = await API.get('/api/social/chat/history');
    const container = document.getElementById('chat-messages');
    container.innerHTML = r.messages.map(m => chatMsgHtml(m)).join('');
    scrollChat();
  } catch (e) {}
}

function chatMsgHtml(m) {
  const time = new Date(m.created_at).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
  return `<div class="chat-msg">
    <span class="msg-time">${m.time || time}</span>
    <span class="msg-author ${m.faction}">[${m.level}] ${m.username}</span>: ${escHtml(m.message)}
  </div>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function scrollChat() {
  const el = document.getElementById('chat-messages');
  if (el) setTimeout(() => el.scrollTop = el.scrollHeight, 50);
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  socket?.emit('chat:send', { message: msg });
  input.value = '';
}

document.getElementById('chat-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
});

// ─── FRIENDS ─────────────────────────────────────────────────────────────────
async function loadFriends() {
  try {
    const r = await API.get('/api/social/friends');
    const el = document.getElementById('friends-list');
    if (!r.friends.length) { el.innerHTML = '<p class="text-muted">Друзів поки немає</p>'; return; }

    el.innerHTML = r.friends.map(f => `
      <div class="opponent-card">
        <div class="opponent-avatar">${f.friend_online ? '🟢' : '⚫'}</div>
        <div class="opponent-info">
          <div class="opponent-name ${f.friend_faction}">${f.friend_name} <span class="text-muted">Рів.${f.friend_level}</span></div>
          <div class="text-muted">${f.status === 'pending' ? (f.requester_id === player.id ? '⏳ Очікує підтвердження' : '📩 Новий запит') : '✅ Друг'}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${f.status === 'pending' && f.requester_id !== player.id
            ? `<button class="btn btn-green btn-sm" onclick="acceptFriend(${f.id})">Прийняти</button>`
            : ''}
          ${f.status === 'accepted' ? `<button class="btn btn-blue btn-sm" onclick="viewProfile(${f.friend_id})">Профіль</button>` : ''}
          <button class="btn btn-red btn-sm" onclick="removeFriend(${f.id})">✕</button>
        </div>
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
}

function showAddFriend() {
  const name = prompt('Нікнейм гравця:');
  if (!name) return;
  doSearch(name);
  navigate('search');
}

async function acceptFriend(id) {
  try {
    await API.post(`/api/social/friends/accept/${id}`);
    toast('Запит прийнято!');
    loadFriends();
  } catch (e) { toast(e.message, true); }
}

async function removeFriend(id) {
  try {
    await API.delete(`/api/social/friends/${id}`);
    toast('Видалено');
    loadFriends();
  } catch (e) { toast(e.message, true); }
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────
async function doSearch(query) {
  const q = query || document.getElementById('search-input')?.value?.trim();
  if (!q) return;
  try {
    const r = await API.get(`/api/social/search?q=${encodeURIComponent(q)}`);
    const el = document.getElementById('search-results');
    if (!r.players.length) { el.innerHTML = '<p class="text-muted">Нічого не знайдено</p>'; return; }
    el.innerHTML = r.players.map(p => `
      <div class="opponent-card">
        <div class="opponent-avatar">${p.is_online ? '🟢' : '⚫'}</div>
        <div class="opponent-info">
          <div class="opponent-name ${p.faction}">${p.username} <span class="text-muted">Рів.${p.level}</span></div>
          <div class="text-muted">Слава: ${p.glory}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button class="btn btn-blue btn-sm" onclick="viewProfile(${p.id})">Профіль</button>
          <button class="btn btn-green btn-sm" onclick="addFriend(${p.id})">+ Друг</button>
        </div>
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
}

async function addFriend(targetId) {
  try {
    await API.post(`/api/social/friends/request/${targetId}`);
    toast('Запит надіслано!');
  } catch (e) { toast(e.message, true); }
}

// ─── RATING ──────────────────────────────────────────────────────────────────
async function loadRating() {
  try {
    const r = await API.get('/api/rating');
    document.getElementById('rating-list').innerHTML = r.players.map((p, i) => {
      const pos = i + 1;
      const cls = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
      return `<div class="rating-row">
        <span class="rating-pos ${cls}">${pos}</span>
        <div class="rating-info">
          <div class="rating-name ${p.faction}">${p.username} <span class="text-muted">Рів.${p.level}</span></div>
          <div class="rating-sub">${p.clan_name ? `[${p.clan_tag}] ${p.clan_name} | ` : ''}🏆${p.wins}W</div>
        </div>
        <span class="rating-pts">${fmtNum(p.rating_points)} pts</span>
      </div>`;
    }).join('') || '<p class="text-muted">Ще немає даних</p>';
  } catch (e) { toast(e.message, true); }
}

// ─── CLANS ───────────────────────────────────────────────────────────────────
async function loadClans() {
  try {
    const r = await API.get('/api/social/clans');
    document.getElementById('clans-list').innerHTML = r.clans.map(c => `
      <div class="opponent-card">
        <div class="opponent-avatar" style="font-size:28px">[${c.tag}]</div>
        <div class="opponent-info">
          <div style="font-weight:700">${c.name}</div>
          <div class="text-muted">Лідер: ${c.leader_name} | ${c.member_count}/20 учасників</div>
          <div class="text-muted">⭐${fmtNum(c.rating_points)} балів</div>
        </div>
        <button class="btn btn-blue btn-sm" onclick="joinClan(${c.id})">Вступити</button>
      </div>`).join('') || '<p class="text-muted">Кланів ще немає</p>';
  } catch (e) { toast(e.message, true); }
}

async function joinClan(id) {
  try {
    await API.post(`/api/social/clans/${id}/join`);
    toast('Ви вступили до клану!');
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

function showCreateClan() {
  const name = prompt('Назва клану (мінімум 3 символи):');
  if (!name) return;
  const tag = prompt('Тег клану (до 3 символів):');
  if (!tag) return;
  const desc = prompt('Опис (необов\'язково):') || '';
  API.post('/api/social/clans', { name, tag, description: desc })
    .then(() => { toast('Клан створено!'); loadClans(); refreshPlayer(); })
    .catch(e => toast(e.message, true));
}

// ─── PUBLIC PROFILE ───────────────────────────────────────────────────────────
async function viewProfile(id) {
  navigate('pubprofile');
  try {
    const r = await API.get(`/api/profile/${id}`);
    const p = r.player;
    const el = document.getElementById('pubprofile-content');

    const friendBtn = r.friendshipStatus === 'accepted'
      ? `<button class="btn btn-gray btn-sm" disabled>✅ Вже друг</button>`
      : r.friendshipStatus === 'pending'
      ? `<button class="btn btn-gray btn-sm" disabled>⏳ Очікує</button>`
      : `<button class="btn btn-green btn-sm" onclick="addFriend(${p.id})">+ До друзів</button>`;

    el.innerHTML = `
      <div class="panel mb-12">
        <div class="panel-header flex-between">
          <span class="profile-nick-header ${p.faction}">${p.username}</span>
          <span style="font-size:12px">${p.is_online ? '🟢 онлайн' : '⚫ офлайн'}</span>
        </div>
        ${buildDoll(r.equipment, p.avatar_url, p.faction, p.gender, false)}
        <div style="padding:8px 12px 12px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-red btn-sm" onclick="navigate('battle')">⚔️ Битися</button>
          ${friendBtn}
          <button class="btn btn-orange btn-sm" onclick="sendGift(${p.id})">🎁 Подарунок</button>
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">📋 Інформація</div>
        ${infoRow('⬆️', 'Рівень', p.level)}
        ${infoRow('⚔️', 'Фракція', factionLabel(p.faction))}
        ${infoRow('👤', 'Стать', p.gender === 'male' ? 'Чоловіча' : 'Жіноча')}
        ${infoRow(IC.exp(14), 'Досвід', `${fmtNum(p.experience)} / ${fmtNum(p.exp_to_next)}`)}
        ${infoRow(IC.hp(14), "Здоров'я", `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${infoRow(IC.glory(14), 'Слава', fmtNum(p.glory))}
        ${p.city_name ? infoRow('🏘️', 'Місто', p.city_name) : ''}
        ${infoRow(IC.wins(14), 'Перемог', p.wins)}
        ${infoRow(IC.skull(14), 'Поразок', p.losses)}
        ${p.status_text ? infoRow('💬', 'Статус', p.status_text) : ''}
      </div>

      <div class="panel mb-12">
        <div class="panel-header">📊 Характеристики</div>
        <div class="panel-body">
          <div class="flex-row" style="flex-wrap:wrap;gap:10px">
            <span>⚡ Мощь: <b>${p.power_level}</b></span>
            <span>🛡️ Стійкість: <b>${p.endurance_level}</b></span>
            <span>💨 Швидкість: <b>${p.speed_level}</b></span>
            <span>🎯 Точність: <b>${p.accuracy_level}</b></span>
          </div>
        </div>
      </div>

      <button class="btn btn-gray btn-sm mb-12" onclick="history.back()">← Назад</button>`;
  } catch (e) { toast(e.message, true); }
}

async function sendGift(targetId) {
  try {
    const gifts = await API.get('/api/social/gifts');
    const opts = gifts.gifts.map((g,i)=>`${i+1}. ${g.name} (${bonusStr(g)}) — 🌿${g.price}`).join('\n');
    const choice = parseInt(prompt(`Виберіть подарунок:\n${opts}`));
    if (!choice || !gifts.gifts[choice-1]) return;
    await API.post(`/api/social/gifts/send/${targetId}`, { giftId: gifts.gifts[choice-1].id });
    toast('🎁 Подарунок надіслано!');
  } catch (e) { toast(e.message, true); }
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
async function loadAdmin() {
  if (!player?.is_admin) { toast('Доступ заборонено', true); return; }
  try {
    const s = await API.get('/api/admin/stats');
    document.getElementById('admin-stats').innerHTML = `
      <div class="admin-stat-card"><div class="admin-stat-val">${s.total}</div><div class="admin-stat-lbl">Всього гравців</div></div>
      <div class="admin-stat-card"><div class="admin-stat-val">${s.online}</div><div class="admin-stat-lbl">Онлайн</div></div>
      <div class="admin-stat-card"><div class="admin-stat-val">${s.battles24h}</div><div class="admin-stat-lbl">Боїв за 24г</div></div>
      <div class="admin-stat-card"><div class="admin-stat-val">${s.newToday}</div><div class="admin-stat-lbl">Нових сьогодні</div></div>`;
    adminSearch();
  } catch (e) { toast(e.message, true); }
}

async function adminSearch() {
  const q = document.getElementById('admin-search')?.value || '';
  try {
    const r = await API.get(`/api/admin/players?search=${encodeURIComponent(q)}`);
    document.getElementById('admin-players').innerHTML = r.players.map(p => `
      <div class="admin-player-row ${p.is_banned ? 'banned' : ''}">
        <div style="flex:1">
          <b>${p.username}</b> Рів.${p.level} ${p.is_online ? '🟢' : '⚫'}
          ${p.is_banned ? `<span class="badge-notif">БАН</span>` : ''}
          <div class="text-muted">${IC.greens(13)}${fmtNum(p.greens)} ${IC.gold(13)}${fmtNum(p.gold)}</div>
        </div>
        <div style="display:flex;gap:4px">
          ${p.is_banned
            ? `<button class="btn btn-green btn-sm" onclick="adminUnban(${p.id})">Розбан</button>`
            : `<button class="btn btn-red btn-sm" onclick="adminBan(${p.id})">Бан</button>`}
          <button class="btn btn-orange btn-sm" onclick="adminGive(${p.id})">💰</button>
        </div>
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
}

async function adminBan(id) {
  const reason = prompt('Причина бану:');
  if (!reason) return;
  try {
    await API.post(`/api/admin/players/${id}/ban`, { reason });
    toast('Заблоковано');
    adminSearch();
  } catch (e) { toast(e.message, true); }
}

async function adminUnban(id) {
  try {
    await API.post(`/api/admin/players/${id}/unban`);
    toast('Розблоковано');
    adminSearch();
  } catch (e) { toast(e.message, true); }
}

async function adminGive(id) {
  const greens = parseInt(prompt('Зелень (0 якщо не потрібно):')) || 0;
  const gold   = parseInt(prompt('Золото:')) || 0;
  try {
    await API.post(`/api/admin/players/${id}/give`, { greens, gold, diamonds: 0 });
    toast('Видано!');
    adminSearch();
  } catch (e) { toast(e.message, true); }
}

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
function initSocket() {
  socket = io();

  socket.on('chat:message', (m) => {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="msg-time">${m.time}</span> <span class="msg-author ${m.faction}">[${m.level}] ${m.username}</span>: ${escHtml(m.message)}`;
    container.appendChild(div);
    // Keep last 200 messages
    while (container.children.length > 200) container.firstChild.remove();
    scrollChat();
  });

  socket.on('notification', ({ type, message }) => {
    toast(`🔔 ${message}`);
  });

  socket.on('caves:open', () => {
    toast('⛏️ Печери відкрились! Поспішай добути золото!');
    if (document.getElementById('page-caves')?.classList.contains('active')) loadCaves();
  });

  socket.on('ring:stolen', ({ fromName, amount, goldLeft }) => {
    toast(`💍 ${fromName} вкрав у тебе ${IC.gold(13)} ${amount} золота!`, true);
    refreshPlayer();
  });

  initChatHistory();
}

// ─── CAVES ───────────────────────────────────────────────────────────────────
let cavesPolling  = null;
let cavesCountdown = null;

function stopCavesPolling() {
  if (cavesPolling)  { clearInterval(cavesPolling);  cavesPolling  = null; }
  if (cavesCountdown){ clearInterval(cavesCountdown); cavesCountdown = null; }
}

function fmtCountdown(targetDate) {
  const s = Math.max(0, Math.floor((new Date(targetDate) - Date.now()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function startCavesCountdown(targetDate, elId) {
  if (cavesCountdown) clearInterval(cavesCountdown);
  cavesCountdown = setInterval(() => {
    const el = document.getElementById(elId);
    if (!el) { clearInterval(cavesCountdown); return; }
    const s = Math.max(0, Math.floor((new Date(targetDate) - Date.now()) / 1000));
    const m = Math.floor(s / 60);
    el.textContent = `${m}:${String(s % 60).padStart(2, '0')}`;
    if (elId === 'cave-timer-active') {
      el.classList.toggle('urgent', s <= 30);
    }
    if (s === 0) clearInterval(cavesCountdown);
  }, 1000);
}

async function loadCaves() {
  const el = document.getElementById('caves-content');
  el.innerHTML = '<p class="text-muted text-center">Завантаження...</p>';
  try {
    const r = await API.get('/api/caves/today');
    if (!r.session) {
      renderCavesLobby(null);
    } else if (r.session.session_done) {
      renderCavesDone(r.session);
    } else {
      renderCavesSession(r.session);
      startCavesPolling();
    }
  } catch (e) { toast(e.message, true); }
}

function startCavesPolling() {
  stopCavesPolling();
  cavesPolling = setInterval(pollCavesStatus, 5000);
}

async function pollCavesStatus() {
  try {
    const r = await API.get('/api/caves/status');
    if (!r.session) return;
    if (r.session.session_done) {
      stopCavesPolling();
      renderCavesDone(r.session);
    } else {
      renderCavesSession(r.session);
    }
  } catch (e) { /* silently ignore polling errors */ }
}

function renderCavesLobby(session) {
  const NPC_HINTS = [
    'Тут заховано золото! Не зівай — шахти чекають не довго!',
    'Кожна шахта дається один раз. Промахнешся — пропав шанс!',
    'Поспішай! Золото не чекатиме вічно!',
    'Сьогодні може бути аж 40 шахт. Слідкуй за часом!',
  ];
  const hint = NPC_HINTS[Math.floor(Math.random() * NPC_HINTS.length)];
  document.getElementById('caves-content').innerHTML = `
    <div class="cave-lobby">
      <div style="font-size:64px;margin-bottom:8px">⛏️</div>
      <div class="cave-npc-speech">🧙 ${hint}</div>
      <button class="btn btn-green btn-full" style="font-size:17px;padding:14px" onclick="startCaveSession()">
        🪨 Увійти в печеру
      </button>
    </div>`;
}

async function startCaveSession() {
  try {
    const r = await API.post('/api/caves/start');
    renderCavesSession(r.session);
    startCavesPolling();
  } catch (e) { toast(e.message, true); }
}

function renderCavesSession(s) {
  if (cavesCountdown) { clearInterval(cavesCountdown); cavesCountdown = null; }
  const el = document.getElementById('caves-content');

  if (s.is_active) {
    // Active mine — show countdown + Mine button
    const mineNum = s.current_mine;
    const secLeft = Math.max(0, Math.floor((new Date(s.mine_expires_at) - Date.now()) / 1000));
    el.innerHTML = `
      <div class="cave-mine-box">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">⛏️ Шахта №${mineNum} з ${s.total_mines}</div>
        <div class="cave-mine-icon">🪨</div>
        <div class="cave-timer ${secLeft <= 30 ? 'urgent' : ''}" id="cave-timer-active">${fmtCountdown(s.mine_expires_at)}</div>
        <div style="font-size:13px;color:#888;margin-bottom:12px">Час до зникнення</div>
        <button class="btn btn-green cave-mine-btn" onclick="mineShaft()">⛏️ Добути!</button>
        <div class="cave-progress">Добуто: ${s.mines_done} з ${s.total_mines} шахт &nbsp;|&nbsp; 🏅 ${s.gold_earned} золота сьогодні</div>
      </div>`;
    startCavesCountdown(s.mine_expires_at, 'cave-timer-active');

  } else {
    // Waiting — countdown to next mine
    el.innerHTML = `
      <div class="cave-wait-box">
        <div style="font-size:48px;margin-bottom:6px">⏳</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">Наступна шахта з'явиться через:</div>
        <div class="cave-next-timer" id="cave-timer-next">${fmtCountdown(s.mine_appears_at)}</div>
        <div class="cave-progress">
          Шахта №${s.current_mine} з ${s.total_mines}
          &nbsp;|&nbsp; Добуто: ${s.mines_done} з ${s.total_mines}
          &nbsp;|&nbsp; 🏅 ${s.gold_earned} золота
        </div>
        <button class="btn btn-gray btn-sm" style="margin-top:14px" onclick="navigate('home')">← Вийти (сесія збережена)</button>
      </div>`;
    startCavesCountdown(s.mine_appears_at, 'cave-timer-next');
  }
}

async function mineShaft() {
  const btn = document.querySelector('.cave-mine-btn');
  if (btn) btn.disabled = true;
  try {
    const r = await API.post('/api/caves/mine');
    // Show reward briefly then re-render
    const el = document.getElementById('caves-content');
    el.innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:52px;margin-bottom:8px">💰</div>
        <div style="font-size:22px;font-weight:700;color:#2e7d32">+${r.gold} золота &nbsp; +${r.exp} досвіду</div>
        ${r.talismanBonus > 0 ? `<div style="font-size:14px;color:#5d4037;margin-top:4px">🏺 +${r.talismanBonus} від талісмана</div>` : ''}
        ${r.levelUp ? `<div style="font-size:15px;color:#e65100;margin-top:6px">🎉 Новий рівень ${r.newLevel}!</div>` : ''}
      </div>`;
    if (r.levelUp) showLevelUpModal(r);
    await refreshPlayer();
    setTimeout(() => {
      if (r.session.session_done) {
        stopCavesPolling();
        renderCavesDone(r.session);
      } else {
        renderCavesSession(r.session);
        if (!cavesPolling) startCavesPolling();
      }
    }, 1200);
  } catch (e) {
    toast(e.message, true);
    // Re-enable button if mine still active
    if (btn) btn.disabled = false;
  }
}

function renderCavesDone(s) {
  stopCavesPolling();
  const pct = s.total_mines > 0 ? Math.round(s.mines_done / s.total_mines * 100) : 0;
  document.getElementById('caves-content').innerHTML = `
    <div class="cave-result-box">
      <div class="cave-result-icon">${IC.glory(28)}</div>
      <div style="font-size:17px;font-weight:700;margin-bottom:4px">Печери на сьогодні завершено!</div>
      <div class="cave-result-stats">
        <div class="cave-result-row">⛏️ Шахт добуто: <b>${s.mines_done} з ${s.total_mines}</b> (${pct}%)</div>
        <div class="cave-result-row">🏅 Золото отримано: <b>${s.gold_earned}</b></div>
        <div class="cave-result-row">${IC.gold(14)} Досвід отримано: <b>${s.exp_earned}</b></div>
        ${s.mines_missed > 0 ? `<div class="cave-result-row" style="color:#c62828">⏰ Пропущено шахт: <b>${s.mines_missed}</b></div>` : ''}
      </div>
      <div style="font-size:13px;color:#888;margin-bottom:14px">Печери відкриються знову о 00:00</div>
      <button class="btn btn-orange btn-full" onclick="navigate('home')">← Повернутись до гри</button>
    </div>`;
}
