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
  home:      (s=14) => `<img src="/icons/ui/home.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  friends:   (s=14) => `<img src="/icons/ui/friends.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  settings:  (s=14) => `<img src="/icons/ui/settings.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  stats_ic:  (s=14) => `<img src="/icons/ui/stats.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  gift:      (s=14) => `<img src="/icons/ui/gift2.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  bell:      (s=14) => `<img src="/icons/ui/bell.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  check:     (s=14) => `<img src="/icons/ui/check.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  inventory: (s=14) => `<img src="/icons/ui/inventory.svg"  width="${s}" height="${s}" style="vertical-align:middle">`,
  refresh:   (s=14) => `<img src="/icons/ui/refresh.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  level:     (s=14) => `<img src="/icons/stats/level.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  plot_ic:   (s=14) => `<img src="/icons/ui/plot.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  levelup:   (s=14) => `<img src="/icons/ui/levelup.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  admin:     (s=14) => `<img src="/icons/ui/admin.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  celebrate: (s=14) => `<img src="/icons/ui/celebrate.svg"  width="${s}" height="${s}" style="vertical-align:middle">`,
  pickaxe:   (s=14) => `<img src="/icons/ui/pickaxe.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  village:   (s=14) => `<img src="/icons/ui/village.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  vacation:  (s=14) => `<img src="/icons/ui/vacation.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  battle:    (s=14) => `<img src="/icons/menu/battle.png"   width="${s}" height="${s}" style="vertical-align:middle">`,
  market:    (s=14) => `<img src="/icons/menu/market.png"   width="${s}" height="${s}" style="vertical-align:middle">`,
  profile:   (s=14) => `<img src="/icons/menu/profile.png"  width="${s}" height="${s}" style="vertical-align:middle">`,
  ring:      (s=14) => `<img src="/icons/items/ring.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  talisman:  (s=14) => `<img src="/icons/items/talisman.svg" width="${s}" height="${s}" style="vertical-align:middle">`,
  water:     (s=14) => `<img src="/icons/ui/water.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  shield:    (s=14) => `<img src="/icons/items/iron-shield.svg" width="${s}" height="${s}" style="vertical-align:middle">`,
  bow:       (s=14) => `<img src="/icons/stats/bow.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  helmet_ic: (s=14) => `<img src="/icons/items/helmet.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  legs:      (s=14) => `<img src="/icons/stats/legs.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  down:      (s=14) => `<img src="/icons/ui/down.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  package:   (s=14) => `<img src="/icons/ui/package.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  wins:      (s=14) => `<img src="/icons/stats/wins.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  skull:     (s=14) => `<img src="/icons/stats/skull.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  mail:      (s=14) => `<img src="/icons/ui/mail.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  star:      (s=14) => `<img src="/icons/ui/star.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  paw:       (s=14) => `<img src="/icons/ui/paw.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  camera:    (s=14) => `<img src="/icons/ui/camera.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
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
    const tgData = await r.json();
    if (tgData.needsSetup) {
      // New TG user — show faction/gender picker, halt init
      document.getElementById('tg-setup-modal').style.display = 'flex';
      return;
    }
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
  if (page === 'jeweler')    loadJeweler();
  if (page === 'alchemist')  loadAlchemist();
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
      btn.innerHTML = '<span class="menu-icon"><img src="/icons/ui/admin.svg" width="24" height="24"></span><span class="menu-label">Адмін</span>';
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
          : `<span class="text-muted" style="font-size:11px">${IC.water(13)} Полито</span>`}`;

    } else if (plot.status === 'ready') {
      div.innerHTML = `
        <div class="plot-plant">${plantSVG(plot.plant_name, 'ready')}</div>
        ${soilSVG}
        <div class="plot-name">${plot.plant_name}</div>
        <span class="plot-status-badge badge-ready"><img src="/icons/ui/harvest.svg" width="14" height="14" style="vertical-align:middle;filter:invert(1)"> Готово!</span>
        <div class="text-muted" style="font-size:12px">${IC.greens(13)}${plot.greens_reward} ${IC.exp(13)}${plot.exp_reward}</div>`;
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
        <div class="plant-info-stats">⏱ ${fmtTime(p.growth_minutes * 60)} | ${IC.greens(13)} +${p.greens_reward} | ${IC.exp(13)} +${p.exp_reward}</div>
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
    toast(`${IC.water(13)} Полито! -10% часу`);
    await loadGarden();
  } catch (e) { toast(e.message, true); }
}

async function harvestPlot(plotId) {
  try {
    const r = await API.post(`/api/garden/${plotId}/harvest`);
    toast(`Зібрано! ${IC.greens(13)}+${r.greens} ${IC.exp(13)}+${r.exp}`);
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
      <div class="levelup-icon">${IC.levelup(14)}</div>
      <div class="levelup-icon-text">
        <div class="levelup-title">Новий рівень</div>
        <div class="levelup-text">Ти досяг <b>${r.newLevel}-го</b> рівня!</div>
      </div>
    </div>
    ${rewardParts.length ? `<div class="levelup-rewards">Ти отримав: ${rewardParts.join(' і ')}</div>` : ''}
    <div class="levelup-next">Для наступного рівня треба: ${IC.exp(13)} ${fmtNum(nextExp)} досвіду</div>
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
      equal:  { bg: '#fff8e1', border: '#ffe082', badge: '#f57f17', icon: '' },
      higher: { bg: '#fce4ec', border: '#f48fb1', badge: '#b71c1c', icon: '${IC.levelup(14)}' },
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
              &nbsp;|&nbsp; ${IC.gold(13)} ${op.glory} слави
            </div>
            <div style="font-size:11px;color:#999;font-style:italic">"${op.slogan}"</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-red btn-sm" onclick="startFight(${op.id},'${op.username}')">${IC.battle(14)} Битись</button>
            <button class="btn btn-blue btn-sm" onclick="viewProfile(${op.id})">${IC.profile(14)} Профіль</button>
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

const ZONE_LABELS = { head: `${IC.helmet_ic(14)} Голова`, body: `${IC.shield(14)} Корпус`, legs: `${IC.legs(14)} Ноги` };
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
        ${won ? `${IC.glory(16)} Перемога` : `${IC.skull(16)} Поразка`}
      </div>
      <div style="font-size:15px;font-weight:600;color:${won?'#2e7d32':'#c62828'}">
        ${r.greensReward > 0 ? `${IC.greens(14)} ${won?'+':'-'}${fmtNum(r.greensReward)} зелені` : ''}
        ${(() => { const totalGold = (r.goldReward||0) + (r.ringEffect?.triggered ? r.ringEffect.stolenGold : 0); return totalGold > 0 ? `&nbsp; ${IC.gold(14)} ${won?'+':''}${fmtNum(totalGold)} золота` : ''; })()}
        ${won ? (r.attackerGlory > 0 ? `&nbsp; ${IC.glory(14)} +1 слава` : '') : `&nbsp; ${IC.down(14)} -5 рейтингу`}
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
        ${IC.ring(14)} <b>Кільце злодія спрацювало!</b><br>
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
  // New weapons
  'Рунічний клинок':   'sword',
  'Молот Бурі':        'axe',
  'Ельфійський лук':   'bow',
  'Орківський тесак':  'axe',
  'Клинок Світанку':   'sword',
  'Серп Жнеця':        'scythe',
  'Залізо Хаосу':      'axe',
  'Меч Легенди':       'sword',
  'Коса Вічності':     'scythe',
  // New armor
  'Шкіра Дракона':     'chainmail',
  'Панцир Воїна':      'chainmail',
  'Сталева Пластина':  'plate-armor',
  'Броня Берсерка':    'plate-armor',
  'Хітон Вічності':    'chainmail',
  'Доспіх Богів':      'plate-armor',
  // New helmets
  'Шкіряна шапка':     'helmet',
  'Рогатий шолом':     'helmet',
  'Маска вбивці':      'helmet',
  'Корона шипів':      'helmet',
  'Шолом Берсерка':    'helmet',
  'Шолом Дракона':     'helmet',
  'Діадема Мудреця':   'helmet',
  'Корона Богів':      'helmet',
  // New shields
  'Щит Лицаря':        'iron-shield',
  'Щит Дракона':       'iron-shield',
  'Рунічний щит':      'iron-shield',
  'Щит Велетня':       'wood-shield',
  'Дзеркало Воїна':    'iron-shield',
  'Щит Богів':         'iron-shield',
  // New runes
  'Руна Блискавки':    'rune-fire',
  'Руна Землі':        'rune-ice',
  'Руна Вітру':        'rune-fire',
  'Руна Тьми':         'rune-ice',
  'Руна Світла':       'rune-fire',
  'Руна Дракона':      'rune-ice',
  // New potions
  'Зілля точності':    'potion-base',
  'Зілля лікування':   'potion-base',
  'Зілля врожаю':      'potion-base',
  'Велике зілля сили': 'potion-power',
  'Зілля невразливості':'potion-endurance',
  // Special
  'Кільце злодія':     'ring',
  'Кільце Жнеця':      'ring',
  'Кільце Берсерка':   'ring',
  'Кільце Цілителя':   'ring',
  'Кільце Удачі':      'ring',
  'Кільце Мудреця':    'ring',
  'Талісман золотошукача': 'talisman',
  'Талісман Воїна':    'talisman',
  'Талісман Фермера':  'talisman',
  'Талісман Захисника':'talisman',
  'Талісман Тіні':     'talisman',
  'Талісман Полководця':'talisman',
};
function itemIcon(name, size=36) {
  const file = ITEM_ICONS[name];
  if (!file) return IC.package(14);
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
    const usesGold   = item.price_gold > 0;
    const priceHtml  = usesGold
      ? `<div class="item-price">${IC.gold(14)} ${fmtNum(item.price_gold)}</div>`
      : `<div class="item-price">${IC.greens(14)} ${fmtNum(item.price)}</div>`;
    const ownedInInv = marketData.inventory.some(i => i.item_id === item.id || i.name === item.name);
    const buyBtn = ownedInInv
      ? `<span class="text-muted" style="font-size:12px">${IC.check(14)} Є</span>`
      : `<button class="btn ${usesGold ? 'btn-orange' : 'btn-green'} btn-sm" onclick="buyMarketItem(${item.id},${isRing},${isTalisman})">Купити</button>`;
    const bonuses = (isRing || isTalisman)
      ? `<div class="item-bonuses" style="color:#5d4037;font-size:12px">${JEWELER_INFO[item.name] || item.name}</div>`
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
  if (item.power_bonus)    parts.push(`${IC.power(13)}+${item.power_bonus}`);
  if (item.endurance_bonus) parts.push(`${IC.endurance(13)}+${item.endurance_bonus}`);
  if (item.speed_bonus)    parts.push(`${IC.speed(13)}+${item.speed_bonus}`);
  if (item.accuracy_bonus) parts.push(`${IC.accuracy(13)}+${item.accuracy_bonus}`);
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
             <button class="btn btn-orange btn-sm" onclick="openRingModal(${inv.id})">${IC.ring(14)} Прокачка</button>
             ${inv.is_equipped
               ? `<button class="btn btn-gray btn-sm" onclick="unequipItem(${inv.id})">Зняти</button>`
               : `<button class="btn btn-blue btn-sm" onclick="equipItem(${inv.id})">Одягти</button>`}
           </div>`
        : isTalisman
          ? `<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
               <button class="btn btn-orange btn-sm" onclick="openTalismanModal(${inv.id})">${IC.talisman(14)} Прокачка</button>
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
async function buyMarketItem(itemId, isRing, isTalisman) {
  try {
    if (isRing) {
      await API.post('/api/jeweler/buy/' + itemId);
      toast(`${IC.ring(14)} Куплено!`);
    } else if (isTalisman) {
      await API.post('/api/jeweler/buy/' + itemId);
      toast(`${IC.talisman(14)} Куплено!`);
    } else {
      await API.post('/api/market/buy/' + itemId);
      toast('Куплено!');
    }
    await loadMarket();
    await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

async function buyRing() {
  try {
    await API.post('/api/rings/buy');
    toast(`${IC.ring(14)} Кільце злодія куплено!`);
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
        <div style="font-size:48px">${IC.ring(14)}</div>
        <div class="ring-level-badge">Рівень ${lvl} / 10</div>
      </div>
      <div class="ring-progress-wrap"><div class="ring-progress-bar" style="width:${progressPct}%"></div></div>
      <div class="ring-stats">
        <div class="ring-stat-row"><span>Шанс спрацювання</span><b>${ru.steal_chance}%</b></div>
        <div class="ring-stat-row"><span>Макс. крадіжка</span><b>${ru.max_steal_pct}% золота</b></div>
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>${IC.gold(13)} ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      <div style="font-size:13px;color:#888;margin:10px 0 14px">
        Кільце спрацьовує тільки при перемозі в PvP бою. Жертва отримує сповіщення.
      </div>
      ${maxed
        ? `<div style="text-align:center;color:#e65100;font-weight:700;font-size:15px">${IC.star(14)} Максимальний рівень!</div>`
        : `<button class="btn btn-orange btn-full" onclick="upgradeRing(${invId})">
             ${IC.levelup(14)} Покращити до рівня ${lvl + 1} — ${IC.gold(13)} ${fmtNum(r.nextCost)}
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
    toast(`${IC.ring(14)} Кільце покращено до рівня ${r.newLevel}!`);
    await refreshPlayer();
    openRingModal(invId);
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── TALISMAN ────────────────────────────────────────────────────────────────

async function buyTalisman() {
  try {
    await API.post('/api/talismans/buy');
    toast(`${IC.talisman(14)} Талісман золотошукача куплено!`);
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
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>${IC.gold(13)} ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      ${maxed
        ? `<div style="color:#2e7d32;font-weight:700;text-align:center;margin-top:10px">${IC.check(14)} Максимальний рівень!</div>`
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
    toast(`${IC.talisman(14)} Талісман покращено до рівня ${r.newLevel}! Бонус: +${r.newBonus}%`);
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
          ${IC[npc.icon] ? IC[npc.icon](28) : ''}
          <div>
            <div style="font-weight:700">${npc.name}</div>
            <div class="text-muted">${npc.desc}</div>
          </div>
        </div>
        ${npc.id === 'healer'   ? `<button class="btn btn-green btn-sm"  onclick="healPlayer()">Лікувати</button>` : ''}
        ${npc.id === 'jeweler'  ? `<button class="btn btn-orange btn-sm" onclick="navigate('jeweler')">${IC.ring(14)} Зайти</button>` : ''}
        ${npc.id === 'alchemist'? `<button class="btn btn-blue btn-sm"   onclick="navigate('alchemist')">${IC.inventory(14)} Зайти</button>` : ''}
        ${npc.id === 'smith'    ? `<button class="btn btn-orange btn-sm" onclick="openEnchantPage()">${IC.levelup(14)} Зачарувати</button>` : ''}
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
          ${isOwn ? `<div class="avatar-edit-badge">${IC.camera(14)}</div>` : ''}
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

function renderActiveGifts(gifts) {
  if (!gifts || !gifts.length)
    return `<p class="text-muted">Активних подарунків немає</p>`;

  const timeLeft = (exp) => {
    const s = Math.max(0, Math.floor((new Date(exp) - Date.now()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}г ${m}хв` : `${m}хв`;
  };

  const bonusText = (g) => {
    if (g.is_luck_amulet) return '×1.5 до всіх подарунків';
    const parts = [];
    if (g.power_bonus     > 0) parts.push(`${IC.power(12)} +${g.power_bonus}`);
    if (g.endurance_bonus > 0) parts.push(`${IC.endurance(12)} +${g.endurance_bonus}`);
    if (g.speed_bonus     > 0) parts.push(`${IC.speed(12)} +${g.speed_bonus}`);
    if (g.accuracy_bonus  > 0) parts.push(`${IC.accuracy(12)} +${g.accuracy_bonus}`);
    if (g.harvest_bonus   > 0) parts.push(`🌾 +${g.harvest_bonus}%`);
    return parts.join(' ') || '—';
  };

  return gifts.map(g => `
    <div class="gift-active-row">
      <div style="flex:1">
        <div style="font-weight:600">${g.gift_name}</div>
        <div style="font-size:12px;color:#aaa">від ${g.giver_username || g.giver_name}</div>
        <div style="font-size:12px;margin-top:2px">${bonusText(g)}</div>
      </div>
      <div style="font-size:11px;color:#888;white-space:nowrap">⏱ ${timeLeft(g.expires_at)}</div>
    </div>`).join('');
}

async function loadProfile() {
  try {
    const r = await API.get('/api/profile');
    const p = r.player;
    const el = document.getElementById('profile-content');

    const maxStat = Math.max(p.power_level, p.endurance_level, p.speed_level, p.accuracy_level, p.pet_power, p.pet_endurance, 1);
    const statRow = (icon, label, stat, key) => `
      <div class="stat-row">
        <span class="stat-icon">${icon}</span>
        <div class="stat-info">
          <div class="stat-name">${label}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${Math.round(stat / maxStat * 100)}%"></div></div>
        </div>
        <span class="stat-level">Рів.${stat}</span>
        <span class="stat-cost">${IC.greens(13)}${fmtNum(r.trainCosts[key])}</span>
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
          <button class="btn btn-blue btn-sm" onclick="navigate('stats')">${IC.stats_ic(14)} Статистика</button>
          <button class="btn btn-orange btn-sm" onclick="toggleVacation(${p.on_vacation})">
            ${p.on_vacation ? `${IC.vacation(14)} Канікули ON` : `${IC.vacation(14)} Канікули OFF`}
          </button>
          <button class="btn btn-gray btn-sm" onclick="doLogout()">Вихід</button>
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.stats_ic(14)} Інформація</div>
        ${infoRow(p.is_online ? '🟢' : '⚫', 'Статус', p.is_online ? 'Зараз онлайн' : 'Офлайн')}
        ${infoRow(IC.level(14), 'Рівень', p.level)}
        ${infoRow(IC.battle(14), 'Фракція', factionLabel(p.faction))}
        ${infoRow(IC.profile(14), 'Стать', p.gender === 'male' ? 'Чоловіча' : 'Жіноча')}
        ${infoRow(IC.exp(14), 'Досвід', `${fmtNum(p.experience)} / ${fmtNum(p.exp_to_next)}`)}
        ${infoRow(IC.hp(14), "Здоров'я", `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${infoRow(IC.glory(14), 'Слава', fmtNum(p.glory))}
        ${infoRow(IC.village(14), 'Місто', p.city_name || '—', `<button class="btn btn-orange btn-sm" onclick="changeCity()">Змінити</button>`)}
        ${infoRow(IC.wins(14), 'Перемог', p.wins)}
        ${infoRow(IC.skull(14), 'Поразок', p.losses)}
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.power(14)} Тренування</div>
        <div class="panel-body">
          ${statRow(IC.power(14), 'Мощь',     p.power_level,     'power')}
          ${statRow(IC.endurance(14), 'Стійкість', p.endurance_level, 'endurance')}
          ${statRow(IC.speed(14), 'Швидкість', p.speed_level,     'speed')}
          ${statRow(IC.accuracy(14), 'Точність',  p.accuracy_level,  'accuracy')}
          <div class="divider"></div>
          <div style="font-weight:700;margin-bottom:6px">${IC.paw(14)} Питомець</div>
          ${statRow(IC.power(14), 'Мощь пит.',    p.pet_power,     'pet_power')}
          ${statRow(IC.endurance(14), 'Стійк. пит.', p.pet_endurance, 'pet_endurance')}
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.bell(14)} Пошта</div>
        <div class="panel-body">
          <button class="btn btn-blue btn-sm mb-8" onclick="loadMail()">Відкрити пошту</button>
          <div id="mail-section"></div>
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.gift(14)} Подарунки</div>
        <div class="panel-body" id="gifts-section">
          ${renderActiveGifts(r.gifts)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">${IC.settings(14)} Налаштування</div>
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
        <div class="stats-section-title">${IC.settings(14)} Параметри</div>
        ${eqRow(IC.power(14), 'Сила',      p.power_level,     p.equip_power)}
        ${eqRow(IC.endurance(14), 'Захист',    p.endurance_level, p.equip_endurance)}
        ${eqRow(IC.speed(14), 'Швидкість', p.speed_level,     p.equip_speed)}
        ${eqRow(IC.accuracy(14), 'Точність',  p.accuracy_level,  p.equip_accuracy)}
        ${row(IC.hp(14), "Здоров'я",        `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${row(IC.hp(14), "Макс. здоров'я",  fmtNum(p.max_hp))}
        ${row(IC.hp(14), 'Регенерація',     `${p.hp_regen} в хв`)}
      </div>
      <div class="stats-section">
        <div class="stats-section-title">${IC.stats_ic(14)} Інше</div>
        ${row(IC.level(14), 'Рівень',         p.level)}
        ${row(IC.exp(14), 'Досвід',          fmtNum(p.experience))}
        ${row(IC.exp(14), 'Наст. рівень',    fmtNum(p.exp_to_next))}
        ${row(IC.glory(14), 'Слава',           fmtNum(p.glory))}
        ${row(IC.clan(14), 'Клан',            p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${row(IC.wins(14), 'Рейтинг',         `#${r.gloryRank}`)}
        ${row(IC.friends(14), 'Друзів',          r.friendsCount)}
        ${row(IC.battle(14), 'Боїв сьогодні',  `${p.battles_today} / ${p.battles_max}`)}
        ${row(IC.wins(14), 'Перемог',         fmtNum(p.wins))}
        ${row(IC.skull(14), 'Поразок',         fmtNum(p.losses))}
      </div>
      <div class="stats-section">
        <div class="stats-section-title">${IC.stats_ic(14)} Статистика</div>
        ${row('🟢', 'Здобич у боях',   `${IC.greens(13)} ${fmtNum(r.greensEarned)} ${IC.gold(13)} ${fmtNum(p.gold_earned_battle)}`)}
        ${row('🔴', 'Втрати у боях',   `${IC.greens(13)} ${fmtNum(r.greensLost)} ${IC.gold(13)} ${fmtNum(p.gold_lost_battle)}`)}
        ${row(IC.plot_ic(14), 'Посаджено рослин', fmtNum(p.plants_planted))}
        ${row(IC.water(14), 'Полито рослин',    fmtNum(p.plots_watered))}
        ${row(IC.greens(14), 'Зібрано врожаю',  `${IC.greens(13)} ${fmtNum(p.total_harvest)}`)}
        ${row(IC.pickaxe(14), 'Пройдено шахт',    fmtNum(r.cavesMinesDone))}
        ${row(IC.pickaxe(14), 'Добуто в печерах', `${IC.gold(14)} ${fmtNum(r.cavesGold)}`)}
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
    toast(r.on_vacation ? `${IC.vacation(13)} Канікули увімкнено` : `${IC.battle(13)} Канікули вимкнено`);
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
          <b>${m.is_system ? `${IC.bell(14)} Система` : `${IC.mail(14)} ${m.sender_name}`}</b>
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
          <div class="text-muted">${f.status === 'pending' ? (f.requester_id === player.id ? '⏳ Очікує підтвердження' : `${IC.bell(14)} Новий запит`) : `${IC.check(14)} Друг`}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${f.status === 'pending' && f.requester_id !== player.id
            ? `<button class="btn btn-green btn-sm" onclick="acceptFriend(${f.id})">Прийняти</button>`
            : ''}
          ${f.status === 'accepted' ? `<button class="btn btn-blue btn-sm" onclick="viewProfile(${f.friend_id})">Профіль</button>` : ''}
          ${f.status === 'accepted' ? `<button class="btn btn-orange btn-sm" onclick="sendGift(${f.friend_id})">${IC.gift(13)}</button>` : ''}
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
          <div class="rating-sub">${p.clan_name ? `[${p.clan_tag}] ${p.clan_name} | ` : ''}${IC.glory(14)}${p.wins}W</div>
        </div>
        <span class="rating-pts">${fmtNum(p.rating_points)} pts</span>
      </div>`;
    }).join('') || '<p class="text-muted">Ще немає даних</p>';
  } catch (e) { toast(e.message, true); }
}

// ─── CLANS ───────────────────────────────────────────────────────────────────
const BUILDING_LABELS = {
  farm:    { name: 'Велика Ферма',    icon: 'greens',   currency: 'greens' },
  smithy:  { name: 'Кузня Клану',     icon: 'battle',   currency: 'gold' },
  tower:   { name: 'Вежа Захисту',    icon: 'shield',   currency: 'gold' },
  academy: { name: 'Академія',        icon: 'exp',      currency: 'greens' },
  mine:    { name: 'Шахта Клану',     icon: 'pickaxe',  currency: 'gold' },
  hall:    { name: 'Зал Слави',       icon: 'glory',    currency: 'greens' },
};
const BUILDING_COSTS = {
  farm:    [500,1000,2000,3500,5000],
  smithy:  [300,600,1200,2000,3000],
  tower:   [300,600,1200,2000,3000],
  academy: [400,800,1600,2800,4000],
  mine:    [200,400,800,1400,2000],
  hall:    [1000,3000,5000],
};

async function loadClans() {
  const el = document.getElementById('clans-list');
  try {
    // Check if player is in a clan
    if (player.clan_name) {
      await renderMyClan(el);
    } else {
      await renderClanList(el);
    }
  } catch (e) { toast(e.message, true); }
}

async function renderMyClan(el) {
  const [r, warData, tasksData] = await Promise.all([
    API.get('/api/clans/my'),
    API.get('/api/clans/war/active').catch(() => ({ war: null })),
    API.get('/api/clans/tasks').catch(() => ({ tasks: [] })),
  ]);
  const c = r.clan;
  const mem = r.members;
  const buildings = r.buildings || [];
  const isLeader = r.myRole === 'leader';
  const isSenior = ['leader','senior'].includes(r.myRole);

  // Buildings
  const BUILDING_BONUS_DESC = {
    farm:    'рів', smithy: '+5 міць/рів', tower: '+5 стійк./рів',
    academy: '+5% досвід/рів', mine: '+1 золото/рів', hall: '+1 слава/рів',
  };
  const buildingHtml = Object.entries(BUILDING_LABELS).map(([key, info]) => {
    const b = buildings.find(b => b.building_key === key) || { level: 0 };
    const costs = BUILDING_COSTS[key];
    const maxLvl = costs.length;
    const canUp = b.level < maxLvl && isSenior;
    const nextCost = b.level < maxLvl ? costs[b.level] : null;
    const currIcon = info.currency === 'gold' ? IC.gold(13) : IC.greens(13);
    const bonus = BUILDING_BONUS_DESC[key] || '';
    return `<div class="building-row">
      <div>
        <div>${IC[info.icon] ? IC[info.icon](14) : ''} ${info.name}</div>
        <div class="text-muted" style="font-size:11px">${bonus}</div>
      </div>
      <span class="text-muted">Рів.${b.level}/${maxLvl}</span>
      ${canUp ? `<button class="btn btn-orange btn-sm" onclick="upgradeBuilding('${key}')">${currIcon}${fmtNum(nextCost)}</button>` : '<span></span>'}
    </div>`;
  }).join('');

  // War section
  const war = warData.war;
  let warHtml = '';
  if (war) {
    const myId = c.id;
    const isAttacker = war.attacker_id === myId;
    const myDmg   = isAttacker ? war.attacker_dmg : war.defender_dmg;
    const foeDmg  = isAttacker ? war.defender_dmg : war.attacker_dmg;
    const foeName = isAttacker ? `[${war.defender_tag}] ${war.defender_name}` : `[${war.attacker_tag}] ${war.attacker_name}`;
    const totalDmg = (myDmg + foeDmg) || 1;
    const myPct  = Math.round(myDmg  / totalDmg * 100);
    const foePct = Math.round(foeDmg / totalDmg * 100);
    const secsLeft = Math.max(0, Math.floor((new Date(war.ends_at) - Date.now()) / 1000));
    warHtml = `
      <div class="clan-war-box">
        <div style="font-weight:700;font-size:15px;margin-bottom:6px">${IC.battle(14)} Активна Кланова Війна!</div>
        <div style="font-size:13px;margin-bottom:8px">Супротивник: <b>${foeName}</b></div>
        <div style="font-size:12px;color:#888;margin-bottom:8px">Залишилось: ${fmtTime(secsLeft)}</div>
        <div style="margin-bottom:4px;font-size:12px">Ваш урон: <b>${fmtNum(myDmg)}</b> vs ${fmtNum(foeDmg)}</div>
        <div style="background:#eee;border-radius:6px;height:10px;overflow:hidden;display:flex">
          <div style="background:#2e7d32;width:${myPct}%;transition:width .4s"></div>
          <div style="background:#c62828;width:${foePct}%;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:#888;margin-top:3px">Перемагає хто завдасть більше урону за 24 год</div>
      </div>`;
  } else {
    warHtml = `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0">
        <span class="text-muted" style="font-size:13px">Активних воєн немає</span>
        ${isSenior ? `<button class="btn btn-red btn-sm" onclick="showDeclareWarModal()">⚔️ Оголосити війну</button>` : ''}
        <button class="btn btn-gray btn-sm" onclick="loadWarHistory()">Історія воєн</button>
      </div>`;
  }

  // Tasks section
  const tasks = tasksData.tasks || [];
  const daily  = tasks.filter(t => t.task_type === 'daily');
  const weekly = tasks.filter(t => t.task_type === 'weekly');
  const taskRow = t => {
    const pct = Math.min(100, Math.round(t.progress / t.goal * 100));
    const reward = [
      t.reward_greens > 0 ? `${IC.greens(12)}${fmtNum(t.reward_greens)}` : '',
      t.reward_gold   > 0 ? `${IC.gold(12)}${fmtNum(t.reward_gold)}`   : '',
    ].filter(Boolean).join(' ');
    return `<div class="clan-task-row ${t.completed ? 'completed' : ''}">
      <div style="flex:1">
        <div style="font-size:13px">${t.description}</div>
        <div style="background:#eee;border-radius:4px;height:6px;margin-top:4px;overflow:hidden">
          <div style="background:${t.completed?'#2e7d32':'#FF8C00'};width:${pct}%;height:100%;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:#888;margin-top:2px">${fmtNum(t.progress)}/${fmtNum(t.goal)} ${reward ? `— Нагорода: ${reward}` : ''}</div>
      </div>
      ${t.completed ? `<span style="color:#2e7d32;font-size:18px">✓</span>` : ''}
    </div>`;
  };
  const tasksHtml = `
    <div style="font-weight:600;font-size:13px;margin-bottom:6px">Щоденні</div>
    ${daily.map(taskRow).join('') || '<p class="text-muted">—</p>'}
    <div style="font-weight:600;font-size:13px;margin:10px 0 6px">Тижневі</div>
    ${weekly.map(taskRow).join('') || '<p class="text-muted">—</p>'}`;

  el.innerHTML = `
    <div class="clan-header">
      <div style="font-size:20px;font-weight:700">[${c.tag}] ${c.name}</div>
      <div class="text-muted" style="font-size:12px">${c.description || ''}</div>
      <div style="margin-top:6px;display:flex;gap:10px;font-size:13px;flex-wrap:wrap">
        <span>${IC.glory(13)} ${fmtNum(c.rating_points)} рейтинг</span>
        <span>${IC.battle(13)} ${c.wars_won}П / ${c.wars_lost}П воєн</span>
        <span>${IC.greens(13)} ${fmtNum(c.treasury_greens)}</span>
        <span>${IC.gold(13)} ${fmtNum(c.treasury_gold)}</span>
      </div>
    </div>

    <div class="panel-header" style="margin-top:12px">${IC.battle(14)} Кланова Війна</div>
    ${warHtml}

    <div class="panel-header" style="margin-top:12px">${IC.village(14)} Будівлі</div>
    <div class="buildings-grid">${buildingHtml}</div>

    <div class="panel-header" style="margin-top:12px">${IC.exp(14)} Завдання клану</div>
    <div>${tasksHtml}</div>

    <div class="panel-header" style="margin-top:12px">${IC.friends(14)} Учасники (${mem.length}/50)</div>
    <div>${mem.map(m => `
      <div class="opponent-card">
        <div class="opponent-avatar">${m.is_online ? '🟢' : '⚫'}</div>
        <div class="opponent-info">
          <div class="opponent-name ${m.faction}">${m.username} <span class="text-muted">Рів.${m.level}</span></div>
          <div class="text-muted" style="font-size:11px">${roleName(m.role)}</div>
        </div>
        ${isSenior && m.id !== player.id && m.role !== 'leader' ? `
          <button class="btn btn-red btn-sm" onclick="clanKick(${m.id})">Кік</button>` : ''}
      </div>`).join('')}</div>

    <div class="panel-header" style="margin-top:12px">${IC.greens(14)} Скарбниця</div>
    <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
      <button class="btn btn-green btn-sm" onclick="showDepositModal('greens')">${IC.greens(13)} Внести зелень</button>
      <button class="btn btn-orange btn-sm" onclick="showDepositModal('gold')">${IC.gold(13)} Внести золото</button>
      ${isSenior ? `<button class="btn btn-red btn-sm" onclick="showWithdrawModal()">Вивести</button>` : ''}
      <button class="btn btn-gray btn-sm" onclick="loadTreasuryLog()">Лог</button>
    </div>
    <div id="treasury-log-section" style="margin-top:8px"></div>

    <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
      ${isLeader
        ? `<button class="btn btn-red btn-sm" onclick="dissolveClan()">Розпустити клан</button>`
        : `<button class="btn btn-gray btn-sm" onclick="leaveClan()">Покинути клан</button>`}
    </div>
    <div id="war-history-section" style="margin-top:8px"></div>`;
}

async function renderClanList(el) {
  const r = await API.get('/api/clans');
  el.innerHTML = r.clans.map(c => `
    <div class="opponent-card">
      <div class="opponent-avatar" style="font-weight:700;font-size:14px">[${c.tag}]</div>
      <div class="opponent-info">
        <div style="font-weight:700">${c.name} <span class="text-muted badge-faction ${c.faction}">${c.faction === 'elves' ? 'Ельфи' : 'Орки'}</span></div>
        <div class="text-muted">${c.member_count}/50 учасників | ${IC.glory(13)}${fmtNum(c.rating_points)}</div>
      </div>
      <button class="btn btn-blue btn-sm" onclick="joinClan(${c.id})">Вступити</button>
    </div>`).join('') || '<p class="text-muted">Кланів ще немає</p>';
}

function roleName(r) {
  return { leader:'Отаман', senior:'Старший Фермер', officer:'Козак', member:'Новобранець' }[r] || r;
}

async function joinClan(id) {
  try {
    await API.post(`/api/clans/join/${id}`);
    toast('Ви вступили до клану!');
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

function showCreateClan() {
  document.getElementById('create-clan-modal').style.display = 'flex';
}

async function submitCreateClan() {
  const name = document.getElementById('clan-name-input').value.trim();
  const tag  = document.getElementById('clan-tag-input').value.trim().toUpperCase();
  const desc = document.getElementById('clan-desc-input').value.trim();
  if (!name || !tag) { toast('Заповніть назву і тег', true); return; }
  try {
    await API.post('/api/clans/create', { name, tag, description: desc });
    toast('Клан створено!');
    document.getElementById('create-clan-modal').style.display = 'none';
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

async function upgradeBuilding(key) {
  try {
    await API.post('/api/clans/buildings/upgrade', { buildingKey: key });
    toast(`${IC.levelup(14)} ${BUILDING_LABELS[key].name} покращено!`);
    loadClans();
  } catch (e) { toast(e.message, true); }
}

function showDepositModal(currency) {
  const label = currency === 'greens' ? 'зелені' : 'золота';
  const cur   = currency === 'greens' ? IC.greens(14) : IC.gold(14);
  document.getElementById('clan-modal-body').innerHTML = `
    <div style="padding:14px">
      <p style="margin-bottom:10px">${cur} Внести ${label} до скарбниці:</p>
      <input type="number" id="clan-modal-amount" class="form-control" min="1" placeholder="Сума" style="margin-bottom:10px">
      <button class="btn btn-green btn-full" onclick="submitDeposit('${currency}')">Внести</button>
    </div>`;
  document.getElementById('clan-modal').style.display = 'flex';
}
async function submitDeposit(currency) {
  const amt = parseInt(document.getElementById('clan-modal-amount').value);
  if (!amt || amt <= 0) { toast('Невірна сума', true); return; }
  closeClanModal();
  try {
    await API.post('/api/clans/treasury/deposit', { amount: amt, currency });
    toast(`${IC.greens(13)} Внесено до скарбниці!`);
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

function showWithdrawModal() {
  document.getElementById('clan-modal-body').innerHTML = `
    <div style="padding:14px">
      <p style="margin-bottom:10px">Вивести зі скарбниці:</p>
      <select id="clan-modal-currency" class="form-control" style="margin-bottom:8px">
        <option value="greens">Зелень</option>
        <option value="gold">Золото</option>
      </select>
      <input type="number" id="clan-modal-amount" class="form-control" min="1" placeholder="Сума" style="margin-bottom:10px">
      <button class="btn btn-red btn-full" onclick="submitWithdraw()">Вивести</button>
    </div>`;
  document.getElementById('clan-modal').style.display = 'flex';
}
async function submitWithdraw() {
  const currency = document.getElementById('clan-modal-currency').value;
  const amt = parseInt(document.getElementById('clan-modal-amount').value);
  if (!amt || amt <= 0) { toast('Невірна сума', true); return; }
  closeClanModal();
  try {
    await API.post('/api/clans/treasury/withdraw', { amount: amt, currency });
    toast('Виведено зі скарбниці!');
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

function closeClanModal() {
  document.getElementById('clan-modal').style.display = 'none';
}

async function loadTreasuryLog() {
  const el = document.getElementById('treasury-log-section');
  if (!el) return;
  try {
    const r = await API.get('/api/clans/treasury/log');
    if (!r.log.length) { el.innerHTML = '<p class="text-muted">Транзакцій ще немає</p>'; return; }
    el.innerHTML = `<div style="font-size:12px;margin-top:4px">` +
      r.log.map(row => {
        const sign  = row.action === 'deposit' ? '+' : '-';
        const color = row.action === 'deposit' ? '#2e7d32' : '#c62828';
        const cur   = row.currency === 'greens' ? IC.greens(11) : IC.gold(11);
        const time  = new Date(row.created_at).toLocaleString('uk-UA', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5">
          <span>${row.username}</span>
          <span style="color:${color}">${sign}${fmtNum(row.amount)} ${cur}</span>
          <span class="text-muted">${time}</span>
        </div>`;
      }).join('') + `</div>`;
  } catch (e) { toast(e.message, true); }
}

async function showDeclareWarModal() {
  const r = await API.get('/api/clans').catch(() => ({ clans: [] }));
  const myClanId = player.clan_id;
  const others = r.clans.filter(c => c.id !== myClanId);
  document.getElementById('clan-modal-body').innerHTML = `
    <div style="padding:14px">
      <p style="font-size:13px;color:#c62828;margin-bottom:10px">Оголосити кланову війну. Тривалість 24 год. Перемагає хто завдасть більше сумарного урону.</p>
      ${others.map(c => `
        <div class="opponent-card" style="margin-bottom:6px">
          <div class="opponent-info">
            <div style="font-weight:700">[${c.tag}] ${c.name}</div>
            <div class="text-muted" style="font-size:11px">${c.member_count} учасників | ${IC.glory(11)}${fmtNum(c.rating_points)}</div>
          </div>
          <button class="btn btn-red btn-sm" onclick="declareWar(${c.id},'${c.name}')">Атакувати</button>
        </div>`).join('') || '<p class="text-muted">Немає ворожих кланів</p>'}
    </div>`;
  document.getElementById('clan-modal').style.display = 'flex';
}

async function declareWar(targetClanId, targetName) {
  closeClanModal();
  try {
    await API.post('/api/clans/war/declare', { targetClanId });
    toast(`${IC.battle(14)} Оголошено війну проти ${targetName}!`);
    loadClans();
  } catch (e) { toast(e.message, true); }
}

async function loadWarHistory() {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  try {
    const r = await API.get('/api/clans/war/history');
    if (!r.history.length) { el.innerHTML = '<p class="text-muted" style="margin-top:8px">Воєн ще не було</p>'; return; }
    el.innerHTML = `<div class="panel-header" style="margin-top:12px">${IC.battle(14)} Історія воєн</div>` +
      r.history.map(w => {
        const won = w.winner_id === r.myClanId;
        const foe = w.attacker_id === r.myClanId
          ? `[${w.defender_tag}] ${w.defender_name}`
          : `[${w.attacker_tag}] ${w.attacker_name}`;
        const date = new Date(w.started_at).toLocaleDateString('uk-UA');
        return `<div style="display:flex;justify-content:space-between;padding:6px 4px;border-bottom:1px solid #eee;font-size:13px">
          <span>${foe}</span>
          <span style="color:${won?'#2e7d32':'#c62828'}">${won ? 'Перемога' : 'Поразка'}</span>
          <span class="text-muted">${date}</span>
        </div>`;
      }).join('');
  } catch (e) { toast(e.message, true); }
}

async function clanKick(memberId) {
  if (!confirm('Виключити учасника?')) return;
  try {
    await API.post(`/api/clans/kick/${memberId}`);
    toast('Учасника виключено');
    loadClans();
  } catch (e) { toast(e.message, true); }
}

async function leaveClan() {
  if (!confirm('Покинути клан?')) return;
  try {
    await API.post('/api/clans/leave');
    toast('Ви покинули клан');
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

async function dissolveClan() {
  if (!confirm('Розпустити клан? Це незворотно!')) return;
  try {
    await API.post('/api/clans/dissolve');
    toast('Клан розпущено');
    await refreshPlayer();
    loadClans();
  } catch (e) { toast(e.message, true); }
}

// ─── PUBLIC PROFILE ───────────────────────────────────────────────────────────
async function viewProfile(id) {
  navigate('pubprofile');
  try {
    const r = await API.get(`/api/profile/${id}`);
    const p = r.player;
    const el = document.getElementById('pubprofile-content');

    const friendBtn = r.friendshipStatus === 'accepted'
      ? `<button class="btn btn-gray btn-sm" disabled>${IC.check(14)} Вже друг</button>`
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
          <button class="btn btn-red btn-sm" onclick="navigate('battle')">${IC.battle(14)} Битися</button>
          ${friendBtn}
          <button class="btn btn-orange btn-sm" onclick="sendGift(${p.id})">${IC.gift(14)} Подарунок</button>
        </div>
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.stats_ic(14)} Інформація</div>
        ${infoRow(IC.level(14), 'Рівень', p.level)}
        ${infoRow(IC.battle(14), 'Фракція', factionLabel(p.faction))}
        ${infoRow(IC.profile(14), 'Стать', p.gender === 'male' ? 'Чоловіча' : 'Жіноча')}
        ${infoRow(IC.exp(14), 'Досвід', `${fmtNum(p.experience)} / ${fmtNum(p.exp_to_next)}`)}
        ${infoRow(IC.hp(14), "Здоров'я", `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `[${p.clan_tag}] ${p.clan_name}` : 'Не в клані')}
        ${infoRow(IC.glory(14), 'Слава', fmtNum(p.glory))}
        ${p.city_name ? infoRow(IC.village(14), 'Місто', p.city_name) : ''}
        ${infoRow(IC.wins(14), 'Перемог', p.wins)}
        ${infoRow(IC.skull(14), 'Поразок', p.losses)}
        ${p.status_text ? infoRow(IC.bell(14), 'Статус', p.status_text) : ''}
      </div>

      <div class="panel mb-12">
        <div class="panel-header">${IC.stats_ic(14)} Характеристики</div>
        <div class="panel-body">
          <div class="flex-row" style="flex-wrap:wrap;gap:10px">
            <span>${IC.power(14)} Мощь: <b>${p.power_level}</b></span>
            <span>${IC.shield(14)} Стійкість: <b>${p.endurance_level}</b></span>
            <span>${IC.speed(13)} Швидкість: <b>${p.speed_level}</b></span>
            <span>${IC.accuracy(14)} Точність: <b>${p.accuracy_level}</b></span>
          </div>
        </div>
      </div>

      <button class="btn btn-gray btn-sm mb-12" onclick="history.back()">← Назад</button>`;
  } catch (e) { toast(e.message, true); }
}

const GIFT_LIST = [
  { type: 'power_statue',    name: 'Статуетка мощі',     icon: '⚡', stat: '+10% твоєї мощі на 24 год',        cost: 50,  minLevel: 1  },
  { type: 'endurance_seal',  name: 'Печать стійкості',   icon: '🛡️', stat: '+10% твоєї стійкості на 24 год',   cost: 50,  minLevel: 1  },
  { type: 'accuracy_scroll', name: 'Манускрипт точності',icon: '🎯', stat: '+10% твоєї точності на 24 год',    cost: 50,  minLevel: 3  },
  { type: 'speed_flask',     name: 'Флакон швидкості',   icon: '💨', stat: '+10% твоєї швидкості на 24 год',   cost: 50,  minLevel: 3  },
  { type: 'harvest_idol',    name: 'Ідол врожаю',        icon: '🌾', stat: '+15% до зелені з огороду на 24 год', cost: 80,  minLevel: 5  },
  { type: 'luck_amulet',     name: 'Амулет удачі',       icon: '🍀', stat: 'Підсилює всі подарунки другу на 50%', cost: 150, minLevel: 10 },
];

function sendGift(targetId) {
  window._giftTargetId = targetId;
  document.getElementById('gift-modal-body').innerHTML = GIFT_LIST.map(g => `
    <div class="gift-card" onclick="confirmSendGift('${g.type}')">
      <div class="gift-card-icon">${g.icon}</div>
      <div class="gift-card-name">${g.name}</div>
      <div class="gift-card-stat">${g.stat}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">Мін. рів ${g.minLevel}</div>
      <div class="gift-card-cost">${IC.greens(13)} ${g.cost}</div>
    </div>`).join('');
  document.getElementById('gift-modal').style.display = 'flex';
}

function closeGiftModal() {
  document.getElementById('gift-modal').style.display = 'none';
}

async function confirmSendGift(giftType) {
  closeGiftModal();
  try {
    await API.post('/api/gifts/send', { friendId: window._giftTargetId, giftType });
    toast(`${IC.gift(14)} Подарунок надіслано!`);
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
          <button class="btn btn-orange btn-sm" onclick="adminGive(${p.id})">${IC.gold(14)}</button>
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
    toast(`${IC.bell(14)} ${message}`);
  });

  socket.on('caves:open', () => {
    toast('Печери відкрились! Поспішай добути золото!');
    if (document.getElementById('page-caves')?.classList.contains('active')) loadCaves();
  });

  socket.on('ring:stolen', ({ fromName, amount, goldLeft }) => {
    toast(`${IC.ring(14)} ${fromName} вкрав у тебе ${IC.gold(13)} ${amount} золота!`, true);
    refreshPlayer();
  });

  socket.on('gift:received', ({ giftName, fromUsername }) => {
    toast(`${IC.gift(14)} ${fromUsername} надіслав тобі подарунок: ${giftName}!`);
    if (document.getElementById('page-profile')?.classList.contains('active'))
      loadProfile();
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
      <div style="font-size:64px;margin-bottom:8px">${IC.pickaxe(14)}</div>
      <div class="cave-npc-speech">🧙 ${hint}</div>
      <button class="btn btn-green btn-full" style="font-size:17px;padding:14px" onclick="startCaveSession()">
        ${IC.pickaxe(16)} Увійти в печеру
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
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${IC.pickaxe(14)} Шахта №${mineNum} з ${s.total_mines}</div>
        <div class="cave-mine-icon">${IC.pickaxe(28)}</div>
        <div class="cave-timer ${secLeft <= 30 ? 'urgent' : ''}" id="cave-timer-active">${fmtCountdown(s.mine_expires_at)}</div>
        <div style="font-size:13px;color:#888;margin-bottom:12px">Час до зникнення</div>
        <button class="btn btn-green cave-mine-btn" onclick="mineShaft()">${IC.pickaxe(14)} Добути!</button>
        <div class="cave-progress">Добуто: ${s.mines_done} з ${s.total_mines} шахт &nbsp;|&nbsp; ${IC.gold(14)} ${s.gold_earned} золота сьогодні</div>
      </div>`;
    startCavesCountdown(s.mine_expires_at, 'cave-timer-active');

  } else {
    // Waiting — countdown to next mine
    el.innerHTML = `
      <div class="cave-wait-box">
        <div style="margin-bottom:6px">${IC.pickaxe(44)}</div>
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">Наступна шахта з'явиться через:</div>
        <div class="cave-next-timer" id="cave-timer-next">${fmtCountdown(s.mine_appears_at)}</div>
        <div class="cave-progress">
          Шахта №${s.current_mine} з ${s.total_mines}
          &nbsp;|&nbsp; Добуто: ${s.mines_done} з ${s.total_mines}
          &nbsp;|&nbsp; ${IC.gold(14)} ${s.gold_earned} золота
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
    window._caveNextSession = r.session;
    const el = document.getElementById('caves-content');
    el.innerHTML = `
      <div style="text-align:center;padding:24px 12px">
        <div style="margin-bottom:10px">${IC.gold(44)}</div>
        <div style="font-size:22px;font-weight:700;color:#2e7d32;margin-bottom:4px">${IC.gold(16)} +${r.gold} золота</div>
        <div style="font-size:18px;font-weight:600;color:#1565c0;margin-bottom:12px">${IC.exp(16)} +${r.exp} досвіду</div>
        ${r.talismanBonus > 0 ? `<div style="font-size:14px;color:#5d4037;margin-bottom:8px">${IC.talisman(14)} +${r.talismanBonus} від талісмана</div>` : ''}
        ${r.levelUp ? `<div style="font-size:15px;color:#e65100;margin-bottom:10px">${IC.celebrate(14)} Новий рівень ${r.newLevel}!</div>` : ''}
        <button class="btn btn-green" style="padding:10px 28px;font-size:16px" onclick="caveContinue()">Далі →</button>
      </div>`;
    if (r.levelUp) showLevelUpModal(r);
    await refreshPlayer();
  } catch (e) {
    toast(e.message, true);
    // Re-enable button if mine still active
    if (btn) btn.disabled = false;
  }
}

function caveContinue() {
  const s = window._caveNextSession;
  if (!s) return;
  if (s.session_done) {
    stopCavesPolling();
    renderCavesDone(s);
  } else {
    renderCavesSession(s);
    if (!cavesPolling) startCavesPolling();
  }
}

function renderCavesDone(s) {
  stopCavesPolling();
  const pct = s.total_mines > 0 ? Math.round(s.mines_done / s.total_mines * 100) : 0;
  document.getElementById('caves-content').innerHTML = `
    <div class="cave-result-box">
      <div class="cave-result-icon">${IC.pickaxe(28)}</div>
      <div style="font-size:17px;font-weight:700;margin-bottom:4px">Печери на сьогодні завершено!</div>
      <div class="cave-result-stats">
        <div class="cave-result-row">${IC.pickaxe(14)} Шахт добуто: <b>${s.mines_done} з ${s.total_mines}</b> (${pct}%)</div>
        <div class="cave-result-row">${IC.gold(14)} Золото отримано: <b>${s.gold_earned}</b></div>
        <div class="cave-result-row">${IC.exp(14)} Досвід отримано: <b>${s.exp_earned}</b></div>
        ${s.mines_missed > 0 ? `<div class="cave-result-row" style="color:#c62828">⏰ Пропущено шахт: <b>${s.mines_missed}</b></div>` : ''}
      </div>
      <div style="font-size:13px;color:#888;margin-bottom:14px">Печери відкриються знову о 00:00</div>
      <button class="btn btn-orange btn-full" onclick="navigate('home')">← Повернутись до гри</button>
    </div>`;
}

// ─── Telegram first-time setup ──────────────────────────────────────────────
function tgSetupSelectFaction(f) {
  document.getElementById('tg-btn-elves').classList.toggle('selected', f === 'elves');
  document.getElementById('tg-btn-orcs').classList.toggle('selected', f === 'orcs');
}

async function submitTgSetup() {
  const faction = document.querySelector('input[name="tg-faction"]:checked')?.value;
  const gender  = document.querySelector('input[name="tg-gender"]:checked')?.value;
  const err = document.getElementById('tg-setup-error');
  err.textContent = '';
  if (!faction) { err.textContent = 'Виберіть фракцію'; return; }
  if (!gender)  { err.textContent = 'Виберіть стать'; return; }

  const btn = document.querySelector('#tg-setup-modal .btn-green');
  btn.disabled = true;
  btn.textContent = '⏳ Завантаження...';

  const r = await fetch('/api/auth/telegram-webapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: window.Telegram.WebApp.initData, faction, gender })
  });
  const d = await r.json();
  if (d.success) {
    document.getElementById('tg-setup-modal').style.display = 'none';
    // Continue init
    const data = await API.get('/api/auth/me');
    if (!data.player) { window.location.href = '/'; return; }
    player = data.player;
    updateHeader();
    updateHomeProfile();
    initSocket();
    navigate('home');
  } else {
    err.textContent = d.error || 'Помилка';
    btn.disabled = false;
    btn.innerHTML = IC.greens(14) + ' Розпочати гру!';
  }
}

// ─── JEWELER ─────────────────────────────────────────────────────────────────
const JEWELER_INFO = {
  // Rings
  'Кільце злодія':       'Краде золото при перемозі у бою',
  'Кільце Жнеця':        'Прискорює збирання врожаю на 15%',
  'Кільце Берсерка':     '+15% до атаки у кожному бою',
  'Кільце Цілителя':     'Відновлює 5% HP після кожного бою',
  'Кільце Удачі':        '+20% шанс критичного удару',
  'Кільце Мудреця':      '+25% до досвіду з усіх джерел',
  // Talismans
  'Талісман золотошукача': '+10% до золота в печерних шахтах',
  'Талісман Воїна':        '+10% до атаки у бою',
  'Талісман Фермера':      '+10% до врожаю з грядок',
  'Талісман Захисника':    '+10% до захисту у бою',
  'Талісман Тіні':         '+15% шанс ухилення від удару',
  'Талісман Полководця':   '+20% рейтингових очок за перемогу',
  // Runes
  'Руна вогню':     '+8 мощі, +5 точності',
  'Руна льоду':     '+8 стійкості, +5 точності',
  'Руна блискавки': '+10 швидкості, +5 точності',
  'Руна землі':     '+10 стійкості, +5 мощі',
  'Руна вітру':     '+12 швидкості',
  'Руна тьми':      '+10 мощі, -5 стійкості ворога',
  'Руна світла':    '+8 точності, +8 стійкості',
  'Руна дракона':   '+15 мощі, +10 стійкості',
};

async function loadJeweler() {
  const el = document.getElementById('jeweler-content');
  if (!el) return;
  el.innerHTML = '<p class="text-muted text-center">Завантаження...</p>';
  try {
    const r = await API.get('/api/jeweler');
    window._jewelerData = r;
    const tabs = [
      { key:'rune',     label:'Руни',      icon: IC.ring(14) },
      { key:'ring',     label:'Кільця',    icon: IC.ring(14) },
      { key:'talisman', label:'Талісмани', icon: IC.talisman(14) },
    ];

    el.innerHTML = `
      <div class="category-tabs" id="jeweler-tabs">
        ${tabs.map(t => `<button class="cat-tab" onclick="filterJeweler('${t.key}', this)">${t.icon} ${t.label}</button>`).join('')}
      </div>
      <div id="jeweler-items"></div>
      <div class="panel-header" style="margin-top:12px">${IC.inventory(14)} Вставити руну в предмет</div>
      <div id="rune-socket-ui">
        ${r.inventory.filter(i => ['weapon','armor','shield','helmet'].includes(i.category)).map(i => `
          <div class="item-card">
            ${itemIcon(i.name, 28)}
            <div class="item-info"><div class="item-name">${i.name}${i.upgrade_level?` +${i.upgrade_level}`:''}</div></div>
            <button class="btn btn-orange btn-sm" onclick="openRuneInsert(${i.id})">Вставити</button>
          </div>`).join('') || '<p class="text-muted">Немає підходящого спорядження</p>'}
      </div>`;

    // Click first tab programmatically
    const firstTab = document.querySelector('#jeweler-tabs .cat-tab');
    if (firstTab) filterJeweler('rune', firstTab);
  } catch(e) { toast(e.message, true); }
}

function filterJeweler(cat, btnEl) {
  document.querySelectorAll('#jeweler-tabs .cat-tab').forEach(t => t.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  else if (event?.currentTarget) event.currentTarget.classList.add('active');
  if (!window._jewelerData) return;
  const map = { rune: 'runes', ring: 'rings', talisman: 'talismans' };
  renderJewelerItems(window._jewelerData[map[cat]] || [], cat);
}

function renderJewelerItems(items, cat) {
  const el = document.getElementById('jeweler-items');
  if (!el) return;
  // Deduplicate by name (keep lowest id)
  const seen = new Set();
  const unique = items.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
  el.innerHTML = unique.map(item => {
    const price = `${IC.gold(13)} ${fmtNum(item.price_gold)}`;
    const desc  = JEWELER_INFO[item.name] || '';
    const ownedInv = (window._jewelerData?.inventory || []).find(i => i.item_id === item.id);
    return `<div class="item-card" style="flex-direction:column;align-items:flex-start;gap:4px;padding:10px 12px">
      <div style="display:flex;align-items:center;gap:8px;width:100%">
        ${itemIcon(item.name, 28)}
        <div class="item-info" style="flex:1">
          <div class="item-name">${item.name}</div>
          <div class="text-muted" style="font-size:11px">Рів.${item.min_level}+</div>
        </div>
        ${ownedInv
          ? `<span class="badge" style="background:#e8f5e9;color:#2e7d32;font-size:11px;padding:2px 7px;border-radius:8px">Є</span>`
          : `<div style="white-space:nowrap">${price} <button class="btn btn-orange btn-sm" onclick="buyJewelerItem(${item.id})">Купити</button></div>`}
      </div>
      ${desc ? `<div style="font-size:12px;color:#5d4037;padding-left:36px">${desc}</div>` : ''}
    </div>`;
  }).join('') || '<p class="text-muted">Немає</p>';
}

async function buyJewelerItem(itemId) {
  try {
    await API.post('/api/jeweler/buy/' + itemId);
    toast('Куплено!');
    await refreshPlayer();
    loadJeweler();
  } catch(e) { toast(e.message, true); }
}

async function openRuneInsert(targetInvId) {
  if (!window._jewelerData) await loadJewelerFull();
  const runes = (window._jewelerData.inventory || []).filter(i => i.category === 'rune');
  if (!runes.length) { toast('Немає рун в інвентарі', true); return; }
  const opts = runes.map((r,i) => `${i+1}. ${r.name}`).join('\n');
  const choice = parseInt(prompt(`Виберіть руну для вставки:\n${opts}`));
  if (!choice || !runes[choice-1]) return;
  const slotStr = prompt('Слот (0, 1 або 2):');
  const slot = parseInt(slotStr);
  if (isNaN(slot) || slot < 0 || slot > 2) { toast('Невірний слот', true); return; }
  try {
    await API.post('/api/jeweler/rune/insert', { invId: targetInvId, runeInvId: runes[choice-1].id, slot });
    toast(`${IC.ring(14)} Руну вставлено!`);
    loadJeweler();
  } catch(e) { toast(e.message, true); }
}

// ─── ALCHEMIST ────────────────────────────────────────────────────────────────
async function loadAlchemist() {
  const el = document.getElementById('alchemist-content');
  if (!el) return;
  el.innerHTML = '<p class="text-muted text-center">Завантаження...</p>';
  try {
    const r = await API.get('/api/alchemist');
    const myIng = r.ingredients || [];

    el.innerHTML = `
      <div class="category-tabs">
        <button class="cat-tab active" onclick="showAlchTab('buy',this)">Купити</button>
        <button class="cat-tab" onclick="showAlchTab('craft',this)">Крафт</button>
        <button class="cat-tab" onclick="showAlchTab('ingredients',this)">Інгредієнти</button>
      </div>
      <div id="alch-buy">
        ${r.potions.map(p => `<div class="item-card">
          ${itemIcon(p.name, 28)}
          <div class="item-info">
            <div class="item-name">${p.name}</div>
            <div class="item-bonuses">${bonusStr(p)}</div>
            <div class="text-muted">Рів.${p.min_level}+</div>
          </div>
          <div>${IC.greens(13)}${fmtNum(p.price)} <button class="btn btn-green btn-sm" onclick="buyAlchPotion(${p.id})">Купити</button></div>
        </div>`).join('') || '<p class="text-muted">Немає</p>'}
      </div>
      <div id="alch-craft" style="display:none">
        ${r.recipes.map(rc => {
          const hasAll = rc.ingredients.every(ing => {
            const have = myIng.find(i => i.ingredient_name === ing.name);
            return have && have.quantity >= ing.qty;
          });
          return `<div class="item-card">
            <div class="item-info" style="flex:1">
              <div class="item-name">${rc.potion_name}</div>
              <div class="text-muted">${rc.ingredients.map(i => `${i.name}×${i.qty}`).join(', ')}</div>
            </div>
            <button class="btn ${hasAll?'btn-green':'btn-gray'} btn-sm" ${hasAll?`onclick="craftPotion(${rc.id})"`:'disabled'}>Зварити</button>
          </div>`;
        }).join('') || '<p class="text-muted">Немає рецептів</p>'}
      </div>
      <div id="alch-ingredients" style="display:none">
        ${myIng.length ? myIng.map(i => `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #eee">
          <span>${i.ingredient_name}</span><b>×${i.quantity}</b></div>`).join('')
        : '<p class="text-muted">Інгредієнтів немає</p>'}
      </div>`;
  } catch(e) { toast(e.message, true); }
}

function showAlchTab(tab, btn) {
  ['buy','craft','ingredients'].forEach(t => {
    const el = document.getElementById('alch-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.category-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

async function buyAlchPotion(itemId) {
  try {
    await API.post('/api/alchemist/buy/' + itemId);
    toast('Куплено!');
    await refreshPlayer();
    loadAlchemist();
  } catch(e) { toast(e.message, true); }
}

async function craftPotion(recipeId) {
  try {
    await API.post('/api/alchemist/craft/' + recipeId);
    toast('Зілля зварено!');
    loadAlchemist();
  } catch(e) { toast(e.message, true); }
}

// ─── ENCHANT ─────────────────────────────────────────────────────────────────
function openEnchantPage() {
  document.getElementById('enchant-modal').style.display = 'flex';
  loadEnchantItems();
}

function closeEnchantModal(e) {
  if (!e || e.target === document.getElementById('enchant-modal'))
    document.getElementById('enchant-modal').style.display = 'none';
}

async function loadEnchantItems() {
  const el = document.getElementById('enchant-items');
  if (!el) return;
  if (!marketData) await loadMarket();
  const equippable = (marketData?.inventory || []).filter(i =>
    !['potion','rune','ring','talisman'].includes(i.category)
  );
  el.innerHTML = equippable.map(i => `
    <div class="item-card">
      ${itemIcon(i.name, 28)}
      <div class="item-info">
        <div class="item-name">${i.name}${i.upgrade_level?` <span style="color:#e65100">+${i.upgrade_level}</span>`:''}</div>
        <div class="text-muted">${bonusStr(i)}</div>
      </div>
      <button class="btn btn-orange btn-sm" onclick="enchantItem(${i.id})">${IC.levelup(13)} Зачар.</button>
    </div>`).join('') || '<p class="text-muted">Немає предметів для зачарування</p>';
}

async function enchantItem(invId) {
  try {
    const info = await API.get('/api/village/enchant/info/' + invId);
    if (info.currentLevel >= info.maxLevel) { toast('Максимальне зачарування!'); return; }
    const warn = info.nextChance < 100 ? `\n⚠️ Шанс провалу: ${100 - info.nextChance}%! При провалі зачарування скидається до 0.` : '';
    if (!confirm(`Зачарувати до +${info.currentLevel+1}?\nВартість: ${info.nextCost} золота${warn}`)) return;
    const r = await API.post('/api/village/enchant/' + invId);
    if (r.success) {
      toast(`${IC.levelup(14)} Зачарування успішне! +${r.newLevel}`);
    } else {
      toast(`${IC.skull(14)} Провал! Зачарування скинулось до 0.`, true);
    }
    await refreshPlayer();
    loadEnchantItems();
    if (marketData) { await loadMarket(); }
  } catch(e) { toast(e.message, true); }
}
