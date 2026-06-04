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
  trophy:    (s=14) => `<img src="/icons/ui/trophy.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  crown:     (s=14) => `<img src="/icons/ui/crown.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  fire:      (s=14) => `<img src="/icons/ui/fire.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  hit:       (s=14) => `<img src="/icons/ui/hit.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  sparkle:   (s=14) => `<img src="/icons/ui/sparkle.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  warn:      (s=14) => `<img src="/icons/ui/warning.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  heart:     (s=14) => `<img src="/icons/ui/heart.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  ok:        (s=14) => `<img src="/icons/ui/checkmark.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  no:        (s=14) => `<img src="/icons/ui/cross.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  gem:       (s=14) => `<img src="/icons/ui/gem.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  moneybag:  (s=14) => `<img src="/icons/ui/moneybag.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  house:     (s=14) => `<img src="/icons/ui/house.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  swords:    (s=14) => `<img src="/icons/ui/crossed-swords.svg" width="${s}" height="${s}" style="vertical-align:middle">`,
  timer:      (s=14) => `<img src="/icons/ui/timer.svg"        width="${s}" height="${s}" style="vertical-align:middle">`,
  insect:     (s=14) => `<img src="/icons/ui/insect.svg"       width="${s}" height="${s}" style="vertical-align:middle">`,
  slot:       (s=14) => `<img src="/icons/ui/slot.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  clipboard:  (s=14) => `<img src="/icons/ui/clipboard.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  medal1:     (s=14) => `<img src="/icons/ui/medal-gold.svg"   width="${s}" height="${s}" style="vertical-align:middle">`,
  medal2:     (s=14) => `<img src="/icons/ui/medal-silver.svg" width="${s}" height="${s}" style="vertical-align:middle">`,
  shop:       (s=14) => `<img src="/icons/ui/shop.svg"         width="${s}" height="${s}" style="vertical-align:middle">`,
  key:        (s=14) => `<img src="/icons/ui/key.svg"          width="${s}" height="${s}" style="vertical-align:middle">`,
  lightning:  (s=14) => `<img src="/icons/ui/lightning.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  balance:    (s=14) => `<img src="/icons/ui/balance.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  up:         (s=14) => `<img src="/icons/ui/up.svg"           width="${s}" height="${s}" style="vertical-align:middle">`,
  dragon:     (s=22) => `<img src="/icons/pets/dragon.svg"     width="${s}" height="${s}" style="vertical-align:middle">`,
  wheat:      (s=14) => `<img src="/icons/plants/wheat.svg"    width="${s}" height="${s}" style="vertical-align:middle">`,
  syringe:    (s=14) => `<img src="/icons/ui/syringe.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  pill:       (s=14) => `<img src="/icons/ui/syringe.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  castle:     (s=14) => `<img src="/icons/ui/village.svg"      width="${s}" height="${s}" style="vertical-align:middle">`,
  // Online status dots
  online:    ()     => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#43a047;vertical-align:middle"></span>`,
  offline:   ()     => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#757575;vertical-align:middle"></span>`,
  // Pet icon helper — supports both SVG path and legacy emoji string
  petIcon:   (icon, s=22) => icon?.startsWith('/') ? `<img src="${icon}" width="${s}" height="${s}" style="vertical-align:middle">` : `<span style="font-size:${s}px;line-height:1;vertical-align:middle">${icon||IC.paw(s)}</span>`,
};

// Clickable player name link
const plink = (id, username, faction = '') =>
  `<span class="${faction}" style="cursor:pointer;text-decoration:underline dotted" onclick="viewProfile(${id})">${username}</span>`;

// factionLabel defined in api.js (extended there to include humans)

let gardenData = null;
let marketData = null;
let currentPickRound = 1;
let fightTargetId = null;
let fightTargetName = null;
let _lastFightTier = null;
let socket = null;

// Dragon state (declared here to avoid TDZ errors)
let _dragonTimerInterval       = null;
let _dragonAttackCdInterval    = null;
let _dragonAttackWinInterval   = null;
let _dragonAttackState         = 'idle';
let _dragonAttackCd            = 0;
let _dragonWindowCd            = 0;

// Pets state (declared here to avoid TDZ errors)
let petsData = null;
const RARITY_LABEL = { 1: `${IC.star(14)} Звичайна`, 2: `${IC.star(13)}${IC.star(13)} Рідкісна`, 3: `${IC.star(13)}${IC.star(13)}${IC.star(13)} Легендарна` };
const STAT_LABELS   = { power: 'Міць', endurance: 'Стійкість', speed: 'Швидкість', accuracy: 'Точність' };
const SLOT_NAMES    = { collar: 'Ошийник', amulet: 'Амулет', armor: 'Панцир', boots: 'Чоботи' };

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
  refreshEventsCount();
  // Auto-refresh header stats every 5 seconds
  setInterval(refreshPlayer, 5000);
  // Global caves mine notifier — runs on every page
  startCavesBgNotifier();
  // Check for active insect attack on page load (in case socket event was missed)
  checkInsectsOnInit();
  // Check for active dragon event on page load
  checkDragonOnInit();
})();

// ─── DRAGON BANNER ───────────────────────────────────────────────────────────
async function checkDragonOnInit() {
  try {
    const { event } = await API.get('/api/dragon/current');
    if (event && event.hp_current > 0) {
      document.getElementById('dragon-notif-sub').textContent =
        `HP: ${fmtNum(event.hp_current)} / ${fmtNum(event.hp_max)}`;
      document.getElementById('dragon-notif').style.display = 'flex';
    }
  } catch(e) {}
}

function closeDragonNotif() {
  document.getElementById('dragon-notif').style.display = 'none';
}

// ─── INSECT ATTACK INIT CHECK ────────────────────────────────────────────────
async function checkInsectsOnInit() {
  try {
    const { attack } = await API.get('/api/insects/current');
    if (attack) {
      document.getElementById('insect-notif-sub').textContent =
        `Рій: ${fmtNum(attack.swarm_hp)} HP · Штраф якщо не відженеш: ${attack.damage_penalty_pct}%`;
      document.getElementById('insect-notif').style.display = 'flex';
    }
  } catch(e) {}
}

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
  if (page === 'inventory')  loadInventory();
  if (page === 'auction')    loadAuction();
  if (page === 'dragon')     loadDragon();
  if (page === 'daily')        loadDaily();
  if (page === 'clan-defense') loadClanDefense();
  if (page === 'pets')         loadPets();
  if (page === 'events')       loadEvents();
  if (page !== 'caves')  stopCavesPolling();
  if (page !== 'clans' && _warTimerInterval) {
    clearInterval(_warTimerInterval);
    _warTimerInterval = null;
  }
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
const NPC_DATA = {
  elves: [
    { avatar: 'Ельф', name: 'Лео Глаз', speech: 'О, ти знов тут! Поки тебе не було, орки зовсім розбушувались!' },
    { avatar: 'Вождь', name: 'Повелитель Дарт', speech: 'Міць, стійкість, швидкість — це запорука успіху в бою.' },
  ],
  orcs: [
    { avatar: 'Орк', name: 'Гоша Куций', speech: 'Хватай зброю і приєднуйся до нашої Орди — пішли проти длинновухих!' },
    { avatar: 'Скала', name: 'Скала Мурамець', speech: 'Ти зловив звірятко! Тепер ти готовий до битви. Вибирай суперника!' },
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
        <div class="text-muted" style="font-size:12px">${IC.greens(13)}${plot.greens_reward} ${IC.exp(13)}${Math.floor(plot.exp_reward * 0.1)}</div>`;
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
        <div class="plant-info-stats">${IC.timer(13)} ${fmtTime(p.growth_minutes * 60)} | ${IC.greens(13)} +${p.greens_reward} | ${IC.exp(13)} +${Math.floor(p.exp_reward * 0.1)}</div>
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
      lower:  { bg: '#f0f7ff', border: '#90caf9', badge: '#1565c0', icon: IC.down(14) },
      equal:  { bg: '#fff8e1', border: '#ffe082', badge: '#f57f17', icon: '' },
      higher: { bg: '#fce4ec', border: '#f48fb1', badge: '#b71c1c', icon: IC.levelup(14) },
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
              <span style="font-weight:700;font-size:15px">${plink(op.id, op.username, op.faction)}</span>
              <span style="color:#888;font-size:12px">Рів.${op.level}</span>
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:4px">
              ${IC.power(13)}${op.power_level} &nbsp;${IC.endurance(13)}${op.endurance_level} &nbsp;${IC.speed(13)}${op.speed_level} &nbsp;${IC.accuracy(13)}${op.accuracy_level}
              &nbsp;|&nbsp; ${IC.gold(13)} ${op.glory} слави
            </div>
            <div style="font-size:11px;color:#999;font-style:italic">"${op.slogan}"</div>
            ${op.pet_icon ? `<div style="font-size:11px;color:#6a1b9a;margin-top:2px">${IC.paw(13)} ${IC.petIcon(op.pet_icon,16)} ${op.pet_name}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-red btn-sm" onclick="startFight(${op.id},'${op.username}','${op.tier}')">${IC.battle(14)} Битись</button>
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

async function fightNext() {
  showOpponents();
  if (!_lastFightTier) { loadOpponents(); return; }
  try {
    const r = await API.get('/api/battle/opponents');
    const list = document.getElementById('opponents-list');
    document.getElementById('battle-limit-bar').textContent =
      `Боїв сьогодні: ${player.battles_today} / ${player.battles_max}`;
    const TIER_STYLE = {
      lower:  { bg: '#f0f7ff', border: '#90caf9', badge: '#1565c0', icon: IC.down(14) },
      equal:  { bg: '#fff8e1', border: '#ffe082', badge: '#f57f17', icon: '' },
      higher: { bg: '#fce4ec', border: '#f48fb1', badge: '#b71c1c', icon: IC.levelup(14) },
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
              <span style="font-weight:700;font-size:15px">${plink(op.id, op.username, op.faction)}</span>
              <span style="color:#888;font-size:12px">Рів.${op.level}</span>
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:4px">
              ${IC.power(13)}${op.power_level} &nbsp;${IC.endurance(13)}${op.endurance_level} &nbsp;${IC.speed(13)}${op.speed_level} &nbsp;${IC.accuracy(13)}${op.accuracy_level}
              &nbsp;|&nbsp; ${IC.gold(13)} ${op.glory} слави
            </div>
            <div style="font-size:11px;color:#999;font-style:italic">"${op.slogan}"</div>
            ${op.pet_icon ? `<div style="font-size:11px;color:#6a1b9a;margin-top:2px">${IC.paw(13)} ${IC.petIcon(op.pet_icon,16)} ${op.pet_name}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-red btn-sm" onclick="startFight(${op.id},'${op.username}','${op.tier}')">${IC.battle(14)} Битись</button>
            <button class="btn btn-blue btn-sm" onclick="viewProfile(${op.id})">${IC.profile(14)} Профіль</button>
          </div>
        </div>`;
    }).join('<div style="height:8px"></div>');
    // Auto-start fight with matching tier opponent
    const match = r.opponents.find(op => op.tier === _lastFightTier && op.id);
    if (match) startFight(match.id, match.username, match.tier);
  } catch(e) { toast(e.message, true); }
}

const ZONE_LABELS = { head: `${IC.helmet_ic(14)} Голова`, body: `${IC.shield(14)} Корпус`, legs: `${IC.legs(14)} Ноги` };
const ZONE_UA     = { head: 'голову',   body: 'корпус',    legs: 'ноги'   };

function startFight(opponentId, opponentName, tier) {
  if (player.battles_today >= player.battles_max) {
    toast('Ліміт боїв вичерпано!', true); return;
  }
  fightTargetId   = opponentId;
  fightTargetName = opponentName;
  _lastFightTier  = tier || null;
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

    // Pet log lines
    const pd = r.roundData;
    let petLines = '';
    if (pd.aPetAction) {
      const p = pd.aPetAction;
      const petName = pd.aPetName || 'Твій питомець';
      const tgt = p.target === 'enemyPet' ? 'ворожого питомця' : p.target === 'enemy' ? 'ворога напряму' : '—';
      if (p.type === 'miss') petLines += `<div style="color:#7b8d8d">${IC.paw(13)} ${petName} — промах</div>`;
      else if (p.type === 'blocked') petLines += `<div style="color:#7b1fa2">${IC.paw(13)} ${petName} — заблоковано ворожим питомцем</div>`;
      else petLines += `<div style="color:#2e7d32">${IC.paw(13)} ${petName} б'є ${tgt}${p.abilityProc?' <b style="color:#e65100">[здібність!]</b>':''}. Урон (<b>${p.damage}</b>)</div>`;
    }
    if (pd.dPetAction) {
      const p = pd.dPetAction;
      const petName = pd.dPetName || 'Ворожий питомець';
      const tgt = p.target === 'myPet' ? 'твого питомця' : p.target === 'myPlayer' ? 'тебе напряму' : '—';
      if (p.type === 'miss') petLines += `<div style="color:#7b8d8d">${IC.paw(13)} ${petName} — промах</div>`;
      else if (p.type === 'blocked') petLines += `<div style="color:#7b1fa2">${IC.paw(13)} ${petName} — заблоковано твоїм питомцем</div>`;
      else petLines += `<div style="color:#b71c1c">${IC.paw(13)} ${petName} б'є ${tgt}${p.abilityProc?' <b style="color:#e65100">[здібність!]</b>':''}. Урон (<b>${p.damage}</b>)</div>`;
    }
    if ((pd.aPetAction || pd.dPetAction) && pd.aPetHp !== undefined && pd.dPetHp !== undefined) {
      const aAlive = pd.aPetHp > 0;
      const dAlive = pd.dPetHp > 0;
      const aHpStr = pd.aPetName
        ? `${pd.aPetName}: ${aAlive ? `${pd.aPetHp}/${pd.aPetHpMax}` : `${IC.skull(12)}`}`
        : (aAlive ? pd.aPetHp : `${IC.skull(14)}`);
      const dHpStr = pd.dPetName
        ? `${pd.dPetName}: ${dAlive ? `${pd.dPetHp}/${pd.dPetHpMax}` : `${IC.skull(12)}`}`
        : (dAlive ? pd.dPetHp : `${IC.skull(14)}`);
      petLines += `<div style="font-size:11px;color:#aaa">HP: ${aHpStr} · ${dHpStr}</div>`;
    }

    const entry = document.createElement('div');
    entry.style.cssText = 'margin-bottom:8px;padding:8px 10px;background:#fffde7;border-left:3px solid #f57f17;border-radius:0 8px 8px 0;font-size:13px;line-height:1.7;animation:fadeInLine .25s';
    entry.innerHTML =
      `<div style="color:#1565c0">Ти ударив в ${aZ}. ${aHit}</div>` +
      `<div style="color:#b71c1c">${r.defenderName} ударив в ${dZ}. ${dHit}</div>` +
      petLines;
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
        ${won ? (r.attackerGlory > 0 ? `&nbsp; ${IC.glory(14)} +1 слава` : ``) : `&nbsp; ${IC.down(14)} -5 рейтингу`}
      </div>
    </div>

    <div style="${bs}">
      <div style="font-size:13px;line-height:1.8">
        <b>Нанесена шкода:</b><br>
        ${r.attackerName}: <b>${r.attackerDamageDealt}</b>
        ${r.petResult && r.petResult.attackerPetDamage > 0
          ? `<span style="color:#aaa;font-size:11px"> (гравець: ${r.attackerPlayerDamage ?? r.attackerDamageDealt - r.petResult.attackerPetDamage} + питомець: ${r.petResult.attackerPetDamage})</span>`
          : ''}
        &nbsp;|&nbsp;
        ${r.defenderName}: <b>${r.defenderDamageDealt}</b>
        ${r.petResult && r.petResult.defenderPetDamage > 0
          ? `<span style="color:#aaa;font-size:11px"> (гравець: ${r.defenderDamageDealt - r.petResult.defenderPetDamage} + питомець: ${r.petResult.defenderPetDamage})</span>`
          : ''}
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

    ${(r.aPet || r.dPet) ? `
    <div style="${bs}">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${IC.paw(16)} Тваринки у бою</div>
      <div style="font-size:13px;line-height:1.8">
        ${r.aPet ? `${IC.petIcon(r.aPet.icon,18)} ${r.aPet.name}: урон <b>${fmtNum(r.aPet.totalDamage)}</b>${r.aPet.died?` <span style="color:#c62828">${IC.skull(14)} загинула</span>`:''}` : ''}
        ${r.aPet && r.dPet ? ' &nbsp;|&nbsp; ' : ''}
        ${r.dPet ? `${IC.petIcon(r.dPet.icon,18)} ${r.dPet.name}: урон <b>${fmtNum(r.dPet.totalDamage)}</b>${r.dPet.died?` <span style="color:#c62828">${IC.skull(14)} загинула</span>`:''}` : ''}
      </div>
      ${r.aPet?.died ? `<div style="color:#e65100;font-size:12px;margin-top:4px">${IC.warn(14)} Твоя тваринка загинула! Відновіть у Питомнику.</div>` : ''}
    </div>` : ''}

    ${r.ringEffect && r.ringEffect.triggered ? `
    <div style="${bs}">
      <div style="font-size:13px;line-height:1.8">
        ${IC.ring(14)} <b>Кільце злодія спрацювало!</b><br>
        Ти вкрав <b>${IC.gold(14)} ${fmtNum(r.ringEffect.stolenGold)} золота</b> у ${r.ringEffect.victimName}
      </div>
    </div>` : ''}

    <div class="flex-row" style="gap:8px">
      <button class="btn btn-green" style="flex:1" onclick="fightNext()">Наступний бій</button>
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
  // Rings — unique gem colors
  'Кільце злодія':     'ring-thief',
  'Кільце Жнеця':      'ring-harvester',
  'Кільце Берсерка':   'ring-berserker',
  'Кільце Цілителя':   'ring-healer',
  'Кільце Удачі':      'ring-luck',
  'Кільце Мудреця':    'ring-sage',
  // Talismans — unique body colors
  'Талісман золотошукача': 'talisman',
  'Талісман Воїна':    'talisman-warrior',
  'Талісман Фермера':  'talisman-farmer',
  'Талісман Захисника':'talisman-defender',
  'Талісман Тіні':     'talisman-shadow',
  'Талісман Полководця':'talisman-commander',
};
function itemIcon(name, size=36) {
  const file = ITEM_ICONS[name];
  if (!file) return IC.package(14);
  return `<img src="/icons/items/${file}.svg" width="${size}" height="${size}" style="display:block">`;
}
let currentMarketFilter = 'all';
let currentMarketCat = null;

const MARKET_CATEGORIES = [
  { cat: 'weapon',    label: 'Зброя',     icon: '/icons/items/sword.svg',       currency: `${IC.greens(12)} / ${IC.gold(12)}` },
  { cat: 'armor',     label: 'Броня',     icon: '/icons/items/chainmail.svg',   currency: `${IC.greens(12)}` },
  { cat: 'helmet',    label: 'Шоломи',    icon: '/icons/items/helmet.svg',      currency: `${IC.greens(12)}` },
  { cat: 'shield',    label: 'Щити',      icon: '/icons/items/iron-shield.svg', currency: `${IC.greens(12)}` },
  { cat: 'potion',    label: 'Настої',    icon: '/icons/items/potion-base.svg', currency: `${IC.greens(12)}` },
  { cat: 'rune',      label: 'Руни',      icon: '/icons/items/rune-fire.svg',   currency: `${IC.greens(12)}` },
  { cat: 'accessory', label: 'Аксесуари', icon: '/icons/items/ring.svg',        currency: `${IC.greens(12)} / ${IC.gold(12)}` },
];

async function loadMarket() {
  try {
    marketData = await API.get('/api/market');
    const catView = document.getElementById('market-cat-view');
    if (catView && catView.style.display !== 'none' && currentMarketCat) {
      renderMarketCategory();
    } else {
      renderMarketGrid();
    }
    renderInventory();
  } catch (e) { toast(e.message, true); }
}

function renderMarketGrid() {
  const el = document.getElementById('market-cat-grid');
  if (!el || !marketData) return;
  el.innerHTML = MARKET_CATEGORIES.map(c => {
    const count = c.cat === 'accessory'
      ? marketData.items.filter(i => i.category === 'ring' || i.category === 'talisman').length
      : marketData.items.filter(i => i.category === c.cat).length;
    return `
    <div class="market-cat-card" onclick="openMarketCategory('${c.cat}')">
      <img src="${c.icon}" width="38" height="38" style="margin-bottom:6px">
      <div class="market-cat-label">${c.label}</div>
      <div class="market-cat-meta">${c.currency} · ${count} тов.</div>
    </div>`;
  }).join('');
}

function openMarketCategory(cat) {
  currentMarketCat = cat;
  currentMarketFilter = cat;
  const info = MARKET_CATEGORIES.find(c => c.cat === cat);
  document.getElementById('market-cat-title').textContent = info?.label || cat;
  document.getElementById('market-grid-view').style.display = 'none';
  document.getElementById('market-cat-view').style.display = 'block';
  renderMarketCategory();
}

function showMarketGrid() {
  currentMarketCat = null;
  document.getElementById('market-cat-view').style.display = 'none';
  document.getElementById('market-grid-view').style.display = 'block';
}

function renderMarketCategory() {
  if (!marketData || !currentMarketCat) return;
  const myLevelOnly = document.getElementById('market-my-level')?.checked;
  let items = currentMarketCat === 'accessory'
    ? marketData.items.filter(i => i.category === 'ring' || i.category === 'talisman')
    : marketData.items.filter(i => i.category === currentMarketCat);
  if (myLevelOnly) items = items.filter(i => i.min_level <= marketData.playerLevel);

  document.getElementById('market-items').innerHTML = items.map(item => {
    const isRing     = item.category === 'ring';
    const isTalisman = item.category === 'talisman';
    const usesGold   = item.price_gold > 0;
    const price      = usesGold ? item.price_gold : item.price;
    const canAfford  = usesGold ? marketData.playerGold >= price : marketData.playerGreens >= price;
    const priceHtml  = usesGold
      ? `<div class="item-price">${IC.gold(14)} ${fmtNum(price)}</div>`
      : `<div class="item-price">${IC.greens(14)} ${fmtNum(price)}</div>`;
    const ownedInInv = marketData.inventory.some(i => i.item_id === item.id || i.name === item.name);
    const buyBtn = ownedInInv
      ? `<span style="color:#4caf50;font-size:12px;font-weight:600">${IC.ok(14)} Є у тебе</span>`
      : `<button class="btn ${canAfford ? (usesGold ? 'btn-orange' : 'btn-green') : 'btn-gray'} btn-sm"
           onclick="buyMarketItem(${item.id},${isRing},${isTalisman})"
           ${canAfford ? '' : 'disabled'}>Купити</button>`;
    const bonuses = (isRing || isTalisman)
      ? `<div class="item-bonuses" style="color:#5d4037;font-size:12px">${JEWELER_INFO[item.name] || ''}</div>`
      : `<div class="item-bonuses">${bonusStr(item)}</div>`;
    return `
    <div class="item-card">
      ${itemIcon(item.name, 32)}
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        ${bonuses}
        <div class="item-level">Рівень ${item.min_level}+</div>
      </div>
      <div style="text-align:right;min-width:70px">
        ${priceHtml}
        ${buyBtn}
      </div>
    </div>`;
  }).join('') || '<p class="text-muted">Немає товарів</p>';
}

function filterMarket(cat) {
  currentMarketFilter = cat;
  if (cat === 'all') {
    showMarketGrid();
  } else {
    openMarketCategory(cat);
  }
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
    if (document.getElementById('page-inventory')?.classList.contains('active')) loadInventory();
    else await loadMarket();
  } catch (e) { toast(e.message, true); }
}

async function unequipItem(invId) {
  try {
    await API.post(`/api/market/unequip/${invId}`);
    toast('Знято');
    if (document.getElementById('page-inventory')?.classList.contains('active')) loadInventory();
    else await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── RING OF THE THIEF ───────────────────────────────────────────────────────
async function buyMarketItem(itemId, isRing, isTalisman) {
  try {
    if (isRing) {
      await API.post('/api/jeweler/buy/' + itemId);
      toast(`${IC.ring(14)} Куплено!`);
    } else if (isTalisman) {
      await API.post(`/api/jeweler/buy/` + itemId);
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
    const lvl = ru.ring_level;
    const maxed = lvl >= 10;
    const currIcon = r.currency === 'gold' ? IC.gold(13) : IC.greens(13);
    document.getElementById('ring-modal-body').innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:22px;font-weight:700">${r.ringName}</div>
        <div class="ring-level-badge">Рівень ${lvl} / 10</div>
      </div>
      <div class="ring-progress-wrap"><div class="ring-progress-bar" style="width:${lvl/10*100}%"></div></div>
      <div class="ring-stats">
        <div class="ring-stat-row"><span>${r.statLabel}</span></div>
        <div class="ring-stat-row" style="color:#888;font-size:12px"><span>${r.subLabel}</span></div>
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>${currIcon} ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      ${maxed
        ? `<div style="text-align:center;color:#e65100;font-weight:700;font-size:15px;margin-top:12px">${IC.star(14)} Максимальний рівень!</div>`
        : `<button class="btn btn-orange btn-full" style="margin-top:12px" onclick="upgradeRing(${invId})">
             ${IC.levelup(14)} Покращити до +${lvl+1} — ${currIcon} ${fmtNum(r.nextCost)}
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
    if (marketData) await loadMarket();
  } catch (e) { toast(e.message, true); }
}

// ─── TALISMAN ────────────────────────────────────────────────────────────────

async function buyTalisman() {
  try {
    await API.post(`/api/talismans/buy`);
    toast(`${IC.talisman(14)} Талісман золотошукача куплено!`);
    await refreshPlayer();
    await loadMarket();
  } catch (e) { toast(e.message, true); }
}

async function openTalismanModal(invId) {
  try {
    const r = await API.get(`/api/talismans/info/${invId}`);
    const tu = r.talisman;
    const lvl = tu.talisman_level;
    const maxed = lvl >= 10;
    const currIcon = r.currency === 'gold' ? IC.gold(13) : IC.greens(13);
    document.getElementById('talisman-modal-body').innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:22px;font-weight:700">${r.talismanName}</div>
        <div class="ring-level-badge">Рівень ${lvl} / 10</div>
      </div>
      <div class="ring-progress-wrap"><div class="ring-progress-bar" style="width:${lvl/10*100}%"></div></div>
      <div class="ring-stats">
        <div class="ring-stat-row"><span>${r.statLabel}</span></div>
        <div class="ring-stat-row" style="color:#888;font-size:12px"><span>${r.subLabel}</span></div>
        ${!maxed ? `<div class="ring-stat-row"><span>Ціна покращення</span><b>${currIcon} ${fmtNum(r.nextCost)}</b></div>` : ''}
      </div>
      ${maxed
        ? `<div style="color:#2e7d32;font-weight:700;text-align:center;margin-top:10px">${IC.check(14)} Максимальний рівень!</div>`
        : `<button class="btn btn-orange btn-full" style="margin-top:12px" onclick="upgradeTalisman(${invId})">
             ${IC.levelup(14)} Покращити до +${lvl+1} — ${currIcon} ${fmtNum(r.nextCost)}
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
        ${npc.id === 'healer'   ? '<button class="btn btn-green btn-sm"  onclick="healPlayer()">Лікувати</button>' : ''}
        ${npc.id === 'jeweler'  ? `<button class="btn btn-orange btn-sm" onclick="navigate('jeweler')">${IC.ring(14)} Зайти</button>` : ''}
        ${npc.id === 'alchemist'? `<button class="btn btn-blue btn-sm"   onclick="navigate('alchemist')">${IC.inventory(14)} Зайти</button>` : ''}
        ${npc.id === 'smith'    ? `<button class="btn btn-orange btn-sm" onclick="openEnchantPage()">${IC.levelup(14)} Зачарувати</button>` : ''}
      </div>`).join('');
  } catch (e) { toast(e.message, true); }
  loadGreenhouse();
  loadBank();
}

// ─── GREENHOUSE ───────────────────────────────────────────────────────────────
let _ghTimerInterval = null;

async function loadGreenhouse() {
  try {
    const r = await API.get('/api/greenhouse');
    const el = document.getElementById('village-greenhouse');
    if (!el) return;

    if (!r.greenhouse) {
      el.innerHTML = `
        <div style="text-align:center;padding:12px 0">
          <div style="font-size:40px;margin-bottom:6px">${IC.greens(40)}</div>
          <div style="font-weight:700;margin-bottom:4px">Теплиця</div>
          <div class="text-muted" style="font-size:13px;margin-bottom:12px">Щодня генерує зелень — просто зайди і забери</div>
          <button class="btn btn-green btn-full" onclick="buyGreenhouse()">
            ${IC.gold(14)} Купити теплицю — 500 золота
          </button>
        </div>`;
      return;
    }

    const g = r.greenhouse;
    const lvlPct = (g.level / 10 * 100).toFixed(0);
    const hasGreens = g.green_available > 0;
    const overflowing = g.green_available >= g.daily_green * 2;

    el.innerHTML = `
      <div style="text-align:center;font-size:36px;margin-bottom:2px">${IC.greens(36)}</div>
      <div class="ring-progress-wrap" style="margin:6px 0 8px">
        <div class="ring-progress-bar" style="width:${lvlPct}%"></div>
      </div>
      <div class="flex-between" style="margin-bottom:6px">
        <span style="font-weight:700">Рів. ${g.level} / 10</span>
        <span style="color:#388e3c;font-weight:700">${IC.greens(13)} ${fmtNum(g.daily_green)} / день</span>
      </div>
      ${overflowing ? `<div style="color:#e65100;font-size:12px;text-align:center;margin-bottom:6px">${IC.warn(14)} Теплиця переповнена! Забери врожай</div>` : ''}
      <div class="flex-between" style="margin-bottom:6px">
        <span class="text-muted" style="font-size:13px">Доступно: <b style="color:#388e3c">${fmtNum(g.green_available)} ${IC.greens(13)}</b></span>
        <button class="btn ${hasGreens ? 'btn-green' : 'btn-gray'} btn-sm" onclick="collectGreenhouse()" ${hasGreens ? '' : 'disabled'}>
          Забрати
        </button>
      </div>
      <div style="margin-bottom:8px">
        <div class="flex-between" style="font-size:12px;color:#555;margin-bottom:3px">
          <span>Накопичується сьогодні: <b id="gh-acc" style="color:#388e3c">—</b></span>
          <span class="text-muted" id="gh-acc-pct"></span>
        </div>
        <div style="height:5px;background:#e8f5e9;border-radius:3px">
          <div id="gh-acc-bar" style="height:5px;background:#388e3c;border-radius:3px;width:0%"></div>
        </div>
      </div>
      <div class="text-muted" style="font-size:12px;margin-bottom:8px">
        Наступне поповнення: <span id="gh-timer">—</span>
      </div>
      ${g.level < 10
        ? `<button class="btn btn-orange btn-full" onclick="upgradeGreenhouse()">
             ${IC.levelup(14)} Покращити до рів.${g.level + 1} — ${IC.gold(13)} ${fmtNum(g.next_cost)}
           </button>`
        : `<div style="text-align:center;color:#e65100;font-weight:700;font-size:14px">${IC.star(14)} Максимальний рівень!</div>`}`;

    // countdown timer + real-time accumulation
    if (_ghTimerInterval) clearInterval(_ghTimerInterval);
    let msLeft = g.timer_ms;
    const updateTimer = () => {
      const el2 = document.getElementById('gh-timer');
      if (!el2) { clearInterval(_ghTimerInterval); return; }
      if (msLeft <= 0) { el2.textContent = 'зараз...'; clearInterval(_ghTimerInterval); loadGreenhouse(); return; }
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      const s = Math.floor((msLeft % 60000) / 1000);
      el2.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      const msElapsed = 86400000 - msLeft;
      const pct = Math.min(100, msElapsed / 86400000 * 100);
      const acc = Math.floor(g.daily_green * pct / 100);
      const accEl = document.getElementById('gh-acc');
      const barEl = document.getElementById('gh-acc-bar');
      const pctEl = document.getElementById('gh-acc-pct');
      if (accEl) accEl.innerHTML = `${fmtNum(acc)} ${IC.greens(13)}`;
      if (barEl) barEl.style.width = `${pct.toFixed(1)}%`;
      if (pctEl) pctEl.textContent = `${pct.toFixed(1)}%`;
      msLeft -= 1000;
    };
    updateTimer();
    _ghTimerInterval = setInterval(updateTimer, 1000);
  } catch (e) { toast(e.message, true); }
}

async function buyGreenhouse() {
  try {
    await API.post('/api/greenhouse/buy');
    toast(`${IC.greens(14)} Теплиця куплена!`);
    await refreshPlayer();
    loadGreenhouse();
  } catch (e) { toast(e.message, true); }
}

async function collectGreenhouse() {
  try {
    const r = await API.post('/api/greenhouse/collect');
    toast(`${IC.greens(14)} Зібрано ${fmtNum(r.collected)} зелені з теплиці!`);
    await refreshPlayer();
    loadGreenhouse();
  } catch (e) { toast(e.message, true); }
}

async function upgradeGreenhouse() {
  try {
    const r = await API.post('/api/greenhouse/upgrade');
    toast(`${IC.greens(14)} Теплицю покращено до рівня ${r.newLevel}! Тепер: ${fmtNum(r.dailyGreen)}/день`);
    await refreshPlayer();
    loadGreenhouse();
  } catch (e) { toast(e.message, true); }
}

// ─── BANK ─────────────────────────────────────────────────────────────────────
let _bankTab = 'green';
let _bankProgressInterval = null;

async function loadBank() {
  try {
    const el = document.getElementById('village-bank');
    if (!el) return;
    const r = await API.get('/api/bank/deposits');
    renderBank(r.deposits);
  } catch (e) { toast(e.message, true); }
}

function renderBank(deposits) {
  const el = document.getElementById('village-bank');
  if (!el) return;
  if (_bankProgressInterval) { clearInterval(_bankProgressInterval); _bankProgressInterval = null; }

  const tabDeposits = deposits.filter(d => d.currency === _bankTab);
  const activeCnt   = tabDeposits.filter(d => d.status === 'active').length;

  const statusBadge = (s) => s === 'active'
    ? `<span style="color:#1976d2;font-size:12px">⏳ Активний</span>`
    : s === 'ready'
    ? `<span style="color:#388e3c;font-weight:700;font-size:12px">✅ Готово</span>`
    : `<span style="color:#aaa;font-size:12px">🔒 Завершено</span>`;

  const daysLeft = (matures) => {
    const ms = new Date(matures) - Date.now();
    if (ms <= 0) return 'дозрів';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}д ${h}г` : `${h}г`;
  };

  const currIcon = _bankTab === 'green' ? IC.greens(13) : IC.gold(13);
  const minAmt   = _bankTab === 'green' ? 1000 : 100;

  el.innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="btn ${_bankTab==='green'?'btn-green':'btn-gray'} btn-sm" style="flex:1" onclick="bankTab('green')">${IC.greens(13)} Зелень</button>
      <button class="btn ${_bankTab==='gold'?'btn-orange':'btn-gray'} btn-sm" style="flex:1" onclick="bankTab('gold')">${IC.gold(13)} Золото</button>
    </div>

    ${tabDeposits.length ? `
      <div style="margin-bottom:10px">
        ${tabDeposits.map(d => {
          const interest = Math.floor(d.amount * d.interest_rate / 100);
          return `
          <div style="border:1px solid #e0e0e0;border-radius:10px;padding:10px;margin-bottom:8px">
            <div class="flex-between" style="margin-bottom:4px">
              <span style="font-weight:700">${currIcon} ${fmtNum(d.amount)}</span>
              ${statusBadge(d.status)}
            </div>
            <div class="text-muted" style="font-size:12px;margin-bottom:4px">
              ${d.term_days}д · +${d.interest_rate}% · +${fmtNum(interest)} ${_bankTab==='green'?IC.greens(12):IC.gold(12)}
              ${d.status==='active' ? ` · залишилось: ${daysLeft(d.matures_at)}` : ''}
            </div>
            ${d.status==='active' ? `
            <div style="margin-bottom:6px">
              <div style="height:5px;background:#e8f5e9;border-radius:3px;margin-bottom:3px">
                <div id="bank-bar-${d.id}" style="height:5px;background:#1976d2;border-radius:3px;width:0%"></div>
              </div>
              <div style="font-size:11px;color:#1976d2">Нараховано: <span id="bank-acc-${d.id}">0</span> ${_bankTab==='green'?IC.greens(11):IC.gold(11)}</div>
            </div>` : ''}
            <div style="display:flex;gap:6px">
              ${d.status==='ready'
                ? `<button class="btn btn-green btn-sm" style="flex:1" onclick="bankCollect(${d.id})">Забрати ${fmtNum(d.amount+interest)}</button>`
                : `<button class="btn btn-gray btn-sm" style="flex:1" disabled>Забрати</button>`}
              ${d.status!=='withdrawn'
                ? `<button class="btn btn-gray btn-sm" onclick="bankWithdraw(${d.id})" title="Отримаєш лише основну суму без відсотків">Достроково</button>`
                : ''}
            </div>
          </div>`;
        }).join('')}
      </div>` : `<p class="text-muted" style="text-align:center;margin-bottom:12px">Немає активних депозитів</p>`}

    ${activeCnt < 3 ? `
      <div style="border-top:1px solid #eee;padding-top:12px">
        <div style="font-weight:700;margin-bottom:8px;font-size:13px">Новий депозит</div>
        <div style="display:flex;gap:6px;margin-bottom:8px" id="bank-term-btns">
          <button class="btn btn-sm bank-term-btn" data-term="7"  onclick="bankSelectTerm(7)"  style="flex:1">7 днів +5%</button>
          <button class="btn btn-sm bank-term-btn" data-term="14" onclick="bankSelectTerm(14)" style="flex:1">14 днів +10%</button>
          <button class="btn btn-sm bank-term-btn" data-term="30" onclick="bankSelectTerm(30)" style="flex:1">30 днів +20%</button>
        </div>
        <div style="display:flex;gap:6px">
          <input id="bank-amount-input" type="number" min="${minAmt}" placeholder="Сума (мін. ${minAmt})"
            oninput="updateBankPreview()"
            style="flex:1;padding:8px;border:1px solid #ddd;border-radius:8px;font-size:14px">
          <button class="btn btn-orange btn-sm" onclick="bankOpen()">Відкрити</button>
        </div>
        <div id="bank-preview" style="font-size:12px;color:#388e3c;margin-top:4px;min-height:16px"></div>
      </div>` : `<div style="text-align:center;color:#e65100;font-size:13px">Максимум 3 активних депозити на валюту</div>`}`;

  // auto-select first term button style
  bankSelectTerm(7, true);

  // real-time deposit accumulation
  const activeDeposits = tabDeposits.filter(d => d.status === 'active');
  if (activeDeposits.length > 0) {
    const tickDeposits = () => {
      activeDeposits.forEach(d => {
        const barEl = document.getElementById(`bank-bar-${d.id}`);
        const accEl = document.getElementById(`bank-acc-${d.id}`);
        if (!barEl) { clearInterval(_bankProgressInterval); _bankProgressInterval = null; return; }
        const totalMs  = d.term_days * 86400000;
        const elapsed  = Math.min(totalMs, Date.now() - new Date(d.created_at).getTime());
        const pct      = (elapsed / totalMs * 100).toFixed(1);
        const interest = Math.floor(d.amount * d.interest_rate / 100 * elapsed / totalMs);
        barEl.style.width = `${pct}%`;
        if (accEl) accEl.textContent = fmtNum(interest);
      });
    };
    tickDeposits();
    _bankProgressInterval = setInterval(tickDeposits, 1000);
  }
}

let _bankTerm = 7;
function bankTab(tab) {
  _bankTab = tab;
  _bankTerm = 7;
  loadBank();
}

function bankSelectTerm(days, silent) {
  _bankTerm = days;
  document.querySelectorAll('.bank-term-btn').forEach(b => {
    b.classList.toggle('btn-orange', parseInt(b.dataset.term) === days);
    b.classList.toggle('btn-gray',   parseInt(b.dataset.term) !== days);
  });
  if (!silent) updateBankPreview();
}

function updateBankPreview() {
  const inp  = document.getElementById('bank-amount-input');
  const prev = document.getElementById('bank-preview');
  if (!inp || !prev) return;
  const amt  = parseInt(inp.value);
  const rates = { 7: 5, 14: 10, 30: 20 };
  const rate  = rates[_bankTerm];
  if (amt > 0 && rate) {
    const interest = Math.floor(amt * rate / 100);
    prev.textContent = `Отримаєш: ${fmtNum(amt + interest)} (основна + ${fmtNum(interest)} відсотків)`;
  } else {
    prev.textContent = '';
  }
}

async function bankOpen() {
  const amt = parseInt(document.getElementById('bank-amount-input')?.value);
  if (!amt || amt <= 0) return toast('Введи суму', true);
  try {
    await API.post('/api/bank/open', { currency: _bankTab, amount: amt, termDays: _bankTerm });
    toast(`🏦 Депозит відкрито на ${_bankTerm} днів!`);
    await refreshPlayer();
    loadBank();
  } catch (e) { toast(e.message, true); }
}

async function bankCollect(id) {
  try {
    const r = await API.post(`/api/bank/collect/${id}`);
    toast(`🏦 Отримано ${fmtNum(r.total)} (+${fmtNum(r.interest)} відсотків)!`);
    await refreshPlayer();
    loadBank();
  } catch (e) { toast(e.message, true); }
}

async function bankWithdraw(id) {
  if (!confirm('Дострокове зняття — відсотки не нараховуються. Отримаєш тільки основну суму. Продовжити?')) return;
  try {
    const r = await API.post(`/api/bank/withdraw/${id}`);
    toast(`🏦 Знято ${fmtNum(r.returned)} (без відсотків)`);
    await refreshPlayer();
    loadBank();
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
const PRESET_AVATARS = [
  '/icons/pets/unicorn.svg', '/icons/ui/sparkle.svg',  '/icons/stats/bow.svg',
  '/icons/ui/crossed-swords.svg', '/icons/items/iron-shield.svg', '/icons/items/sword.svg',
  '/icons/items/talisman.svg', '/icons/plants/herb.svg', '/icons/ui/crown.svg',
  '/icons/pets/dragon.svg',  '/icons/pets/fox.svg',     '/icons/pets/wolf.svg',
  '/icons/pets/lion.svg',    '/icons/stats/skull.svg',  '/icons/ui/trophy.svg',
  '/icons/ui/fire.svg',
];

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

const SLOT_MAX_RUNES = { weapon: 3, armor: 3, helmet: 2, shield: 2 };
const SLOT_EMPTY_ICONS = {
  weapon: 'Залізний меч', armor: 'Кольчуга', helmet: 'Шолом воїна',
  shield: 'Залізний щит', ring: 'Кільце злодія', talisman: 'Талісман золотошукача',
};

function buildDoll(equippedList, itemRunes, avatarUrl, faction, gender, isOwn) {
  const eq = {};
  equippedList.forEach(e => { if (!eq[e.category]) eq[e.category] = e; });
  const runes = itemRunes || [];

  const runeDots = (invId, maxRunes) => {
    if (!maxRunes) return '';
    const count = runes.filter(ir => ir.inv_id === invId).length;
    return `<div class="rune-dots">${Array.from({length: maxRunes}, (_, i) =>
      `<div class="rune-dot ${i < count ? 'filled' : ''}"></div>`
    ).join('')}</div>`;
  };

  const slot = (cat) => {
    const maxR = SLOT_MAX_RUNES[cat] || 0;
    const e = eq[cat];
    if (e) {
      return `<div class="equip-slot" title="${e.name}"
          ${isOwn ? `onclick="goToInventoryItem(${e.id})" style="cursor:pointer"` : ''}>  
        <div>${itemIcon(e.name, 28)}</div>
        <div class="equip-slot-name">${e.name}</div>
        ${runeDots(e.id, maxR)}
      </div>`;
    }
    return `<div class="equip-slot empty">
      <div style="opacity:.3">${itemIcon(SLOT_EMPTY_ICONS[cat] || '', 24)}</div>
      ${maxR ? `<div class="rune-dots">${Array.from({length: maxR}, () => '<div class="rune-dot"></div>').join('')}</div>` : ''}
    </div>`;
  };

  return `
    <div class="profile-doll">
      <div class="doll-col">
        ${slot('weapon')}
        ${slot('armor')}
      </div>
      <div class="doll-center">
        ${slot('helmet')}
        <div class="avatar-frame" ${isOwn ? 'onclick="openAvatarModal()"' : ''}>
          ${getAvatarHtml(avatarUrl, faction, gender)}
          ${isOwn ? `<div class="avatar-edit-badge">${IC.camera(14)}</div>` : ''}
        </div>
        ${slot('talisman')}
      </div>
      <div class="doll-col">
        ${slot('shield')}
        ${slot('ring')}
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
    if (g.harvest_bonus   > 0) parts.push(`${IC.wheat(14)} +${g.harvest_bonus}%`);
    return parts.join(' ') || '—';
  };

  return gifts.map(g => `
    <div class="gift-active-row">
      <div style="flex:1">
        <div style="font-weight:600">${g.gift_name}</div>
        <div style="font-size:12px;color:#aaa">від ${plink(g.giver_id, g.giver_username || g.giver_name)}</div>
        <div style="font-size:12px;margin-top:2px">${bonusText(g)}</div>
      </div>
      <div style="font-size:11px;color:#888;white-space:nowrap">${IC.timer(11)} ${timeLeft(g.expires_at)}</div>
    </div>`).join('');
}

async function loadProfile() {
  try {
    const r = await API.get('/api/profile');
    const p = r.player;
    const el = document.getElementById('profile-content');

    const maxStat = Math.max(p.power_level, p.endurance_level, p.speed_level, p.accuracy_level, p.pet_power || 0, p.pet_endurance || 0, 1);
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
          <span style="font-size:12px">${p.is_online ? IC.online() : IC.offline()}</span>
        </div>
        ${buildDoll(equipped, r.itemRunes, p.avatar_url, p.faction, p.gender, true)}
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
        ${infoRow(p.is_online ? IC.online() : IC.offline(), 'Статус', p.is_online ? 'Зараз онлайн' : 'Офлайн')}
        ${infoRow(IC.level(14), 'Рівень', p.level)}
        ${infoRow(IC.battle(14), 'Фракція', factionLabel(p.faction))}
        ${infoRow(IC.profile(14), 'Стать', p.gender === 'male' ? 'Чоловіча' : 'Жіноча')}
        ${infoRow(IC.exp(14), 'Досвід', `${fmtNum(p.experience)} / ${fmtNum(p.exp_to_next)}`)}
        ${infoRow(IC.hp(14), "Здоров'я", `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `<span onclick="navigate('clans')" style="cursor:pointer;color:#e65100;text-decoration:underline">[${p.clan_tag}] ${p.clan_name}</span>` : 'Не в клані')}
        ${infoRow(IC.glory(14), 'Слава', fmtNum(p.glory))}
        ${infoRow(IC.village(14), 'Місто', p.city_name || '—', '<button class="btn btn-orange btn-sm" onclick="changeCity()">Змінити</button>')}
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
          <div id="profile-pet-train-mini"></div>
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

    const bonusTag = (eq, gift, rune, potion, tali = 0) => {
      const parts = [];
      if (eq     > 0) parts.push(`<span style="color:#e65100">+${eq} ${IC.swords(14)}</span>`);
      if (gift   > 0) parts.push(`<span style="color:#4caf50">+${gift} ${IC.gift(14)}</span>`);
      if (rune   > 0) parts.push(`<span style="color:#7c4dff">+${rune} ${IC.talisman(14)}</span>`);
      if (potion > 0) parts.push(`<span style="color:#0097a7">+${potion} ${IC.pill(14)}</span>`);
      if (tali   > 0) parts.push(`<span style="color:#ff8f00">+${tali} ${IC.talisman(14)}</span>`);
      return parts.length ? ` ${parts.join(' ')}` : '';
    };

    const statRow = (icon, label, base, eq, gift, rune, potion = 0, tali = 0) => {
      const total = base + eq + gift + rune + potion + tali;
      return row(icon, label,
        `<strong>${total}</strong>${bonusTag(eq, gift, rune, potion, tali)}`
      );
    };

    document.getElementById('stats-content').innerHTML = `
      <div class="stats-section">
        <div class="stats-section-title">${IC.settings(14)} Параметри</div>
        ${statRow(IC.power(14),    'Сила',      p.power_level,     p.equip_power,     r.giftPower,     r.runePower,     r.potionPower     || 0, r.taliPower     || 0)}
        ${statRow(IC.endurance(14),'Захист',    p.endurance_level, p.equip_endurance, r.giftEndurance, r.runeEndurance, r.potionEndurance || 0, r.taliEndurance || 0)}
        ${statRow(IC.speed(14),    'Швидкість', p.speed_level,     p.equip_speed,     r.giftSpeed,     r.runeSpeed,     r.potionSpeed    || 0)}
        ${statRow(IC.accuracy(14), 'Точність',  p.accuracy_level,  p.equip_accuracy,  r.giftAccuracy,  r.runeAccuracy,  r.potionAccuracy  || 0)}
        ${row(IC.hp(14), "Здоров'я",        `${fmtNum(p.hp)} / ${fmtNum(p.max_hp)}`)}
        ${row(IC.hp(14), "Макс. здоров'я",  fmtNum(p.max_hp))}
        ${row(IC.hp(14), 'Регенерація',     `${p.hp_regen} в хв`)}
        ${r.harvestGiftPct > 0 ? row(`${IC.wheat(14)}`, 'Бонус врожаю (подарунки)', `+${r.harvestGiftPct}%`) : ''}
        ${(r.potionHarvestPct || 0) > 0 ? row(`${IC.pill(14)}`, 'Бонус врожаю (зілля)', `+${r.potionHarvestPct}%`) : ''}
        ${r.luckAmulets > 0 ? row(IC.star(14), 'Амулетів удачі', `×${1 + r.luckAmulets * 0.5} до бонусів`) : ''}
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
        ${row(IC.online(), 'Здобич у боях',   `${IC.greens(13)} ${fmtNum(r.greensEarned)} ${IC.gold(13)} ${fmtNum(p.gold_earned_battle)}`)}
        ${row('<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e53935;vertical-align:middle"></span>', 'Втрати у боях',   `${IC.greens(13)} ${fmtNum(r.greensLost)} ${IC.gold(13)} ${fmtNum(p.gold_lost_battle)}`)}
        ${row(IC.plot_ic(14), 'Посаджено рослин', fmtNum(p.plants_planted))}
        ${row(IC.water(14), 'Полито рослин',    fmtNum(p.plots_watered))}
        ${row(IC.greens(14), 'Зібрано врожаю',  `${IC.greens(13)} ${fmtNum(p.total_harvest)}`)}
        ${row(IC.pickaxe(14), 'Пройдено шахт',    fmtNum(r.cavesMinesDone))}
        ${row(IC.pickaxe(14), 'Добуто в печерах', `${IC.gold(14)} ${fmtNum(r.cavesGold)}`)}
      </div>
      ${(r.insectsDefeated > 0) ? `<div class="stats-section">
        <div class="stats-section-title">${IC.insect(14)} Комахи</div>
        ${row(`${IC.insect(14)}`, 'Роїв знищено',         fmtNum(r.insectsDefeated))}
        ${row(`${IC.greens(14)}`, 'Врожаю врятовано',     fmtNum(r.insectsGreensSaved))}
      </div>` : ''}
      ${(r.dragonBattles > 0) ? `<div class="stats-section">
        <div class="stats-section-title">${IC.dragon(28)} Дракон</div>
        ${row(`${IC.dragon(28)}`, 'Участей у нападах', fmtNum(r.dragonBattles))}
        ${row(`${IC.swords(14)}`, 'Загальний урон',    fmtNum(r.dragonTotalDamage))}
        ${row(`${IC.greens(14)}`, 'Зароблено зелені',  fmtNum(r.dragonGreensEarned))}
      </div>` : ''}
      ${r.petStats ? `<div class="stats-section">
        <div class="stats-section-title">${IC.paw(14)} Тваринка — ${IC.petIcon(r.petStats.icon, 18)} ${r.petStats.pet_name}</div>
        ${row(IC.swords(14), 'Боїв взято участь',  fmtNum(r.petStats.battles_participated))}
        ${row(IC.wins(14),   'Перемог',             fmtNum(r.petStats.wins))}
        ${row(IC.skull(14),  'Загибелей',           fmtNum(r.petStats.deaths))}
        ${row(IC.hit(14),    'Загальний урон',       fmtNum(r.petStats.total_damage))}
        ${row(IC.paw(14),    'Ворожих тварин вбито', fmtNum(r.petStats.pets_killed))}
        ${r.petStats.ability_procs > 0 ? row(IC.sparkle(14), 'Здібностей активовано', fmtNum(r.petStats.ability_procs)) : ''}
      </div>` : ''}`;

    // Append war stats asynchronously (don't block on failure)
    try {
      const wr = await API.get('/api/clan-war/my-stats');
      const ws = wr.stats || {};
      if (parseInt(ws.total_battles) > 0) {
        const statsEl = document.getElementById('stats-content');
        if (statsEl) statsEl.innerHTML += `
          <div class="stats-section">
            <div class="stats-section-title">${IC.battle(14)} Кланові Війни</div>
            ${row(IC.battle(14), 'Боїв у войнах',           fmtNum(ws.total_battles))}
            ${row(IC.wins(14),   'Перемог у боях',           fmtNum(ws.total_wins))}
            ${row(IC.hit(14),    'Загальний урон',            fmtNum(ws.total_damage))}
            ${row(IC.glory(14),  'Воєн виграно кланом',      fmtNum(wr.warsWonWithClan))}
            ${parseInt(ws.glory_gained) > 0 ? row(IC.glory(14), 'Слави здобуто',  `+${fmtNum(ws.glory_gained)}`) : ''}
            ${parseInt(ws.glory_lost)   > 0 ? row(IC.skull(14), 'Слави втрачено', `-${fmtNum(ws.glory_lost)}`)   : ''}
          </div>`;
      }
    } catch (_) {}
  } catch (e) { toast(e.message, true); }

  // Підвантажити міні-блок тренування тваринки у профілі
  loadProfilePetTrain();
}

async function loadProfilePetTrain() {
  const el = document.getElementById('profile-pet-train-mini');
  if (!el) return;
  try {
    const { pet, training, stats } = await API.get('/api/pets/my');
    if (!pet) {
      el.innerHTML = `<div style="font-weight:700;margin-bottom:6px">${IC.paw(16)} Питомець</div>
        <div style="font-size:13px;color:#888">Тваринки немає · <a href="#" onclick="navigate('pets');return false">Купити у Питомнику</a></div>`;
      return;
    }
    const catalog = { mink:'/icons/pets/beaver.svg',beaver:'/icons/pets/beaver.svg',wolf:'/icons/pets/wolf.svg',bear:'/icons/pets/bear.svg',lizard:'/icons/pets/lizard.svg',silver_wolf:'/icons/pets/wolf.svg',ice_lizard:'/icons/pets/lizard.svg',mighty_bear:'/icons/pets/bear.svg',fire_wolf:'/icons/pets/wolf.svg',dragonling:'/icons/pets/dragon.svg',golden_eagle:'/icons/pets/eagle.svg' };
    const icon = catalog[pet.pet_type] || '/icons/ui/paw.svg';
    const deadBadge = pet.is_dead ? ` <span style="color:#c62828;font-size:11px">${IC.skull(14)}</span>` : '';
    const activeBadge = pet.is_active ? ` <span style="color:#388e3c;font-size:11px">${IC.swords(14)}</span>` : '';

    const statMini = ['power','endurance','speed','accuracy'].map(s => {
      const lvl = training[`${s}_level`] || 1;
      const cost = lvl < 50 ? Math.floor((lvl+1)*(lvl+1)*10+(lvl+1)*20) : null;
      return `<div class="stat-row">
        <span class="stat-icon">${STAT_LABELS[s].split(' ')[0]}</span>
        <div class="stat-info">
          <div class="stat-name">${STAT_LABELS[s].split(' ').slice(1).join(' ')}</div>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:${Math.round((lvl-1)/49*100)}%;background:#66bb6a"></div></div>
        </div>
        <span class="stat-level">Рів.${lvl}</span>
        ${cost ? `<span class="stat-cost">${IC.greens(13)}${fmtNum(cost)}</span>
        <button class="btn btn-orange btn-sm" onclick="trainPetFromProfile('${s}')">▲</button>` : '<span style="color:#388e3c;font-size:11px">MAX</span>'}
      </div>`;
    }).join('');

    el.innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">${IC.paw(16)} Питомець${deadBadge}${activeBadge} — ${IC.petIcon(icon,18)} ${pet.name}</div>
      ${pet.is_dead ? `<div style="color:#c62828;font-size:12px;margin-bottom:6px">${IC.skull(14)} Мертва — <a href="#" onclick="navigate('pets');return false">відновити у Питомнику</a></div>` : ''}
      ${statMini}
      ${stats ? `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:12px;color:#666;display:flex;flex-wrap:wrap;gap:6px">
        <span>${IC.swords(13)} <b>${stats.battles_participated}</b> боїв</span>
        <span>${IC.trophy(13)} <b>${stats.wins}</b> перемог</span>
        <span>${IC.skull(14)} <b>${stats.deaths}</b> загибелей</span>
        <span>${IC.hit(13)} <b>${fmtNum(stats.total_damage)}</b> урону</span>
        ${stats.pets_killed > 0 ? `<span>${IC.paw(13)} <b>${stats.pets_killed}</b> вбито</span>` : ``}
        ${stats.ability_procs > 0 ? `<span>${IC.sparkle(13)} <b>${stats.ability_procs}</b> здібностей</span>` : ''}
      </div>` : ''}
      <div style="margin-top:6px">
        <button class="btn btn-gray btn-sm" onclick="navigate('pets')">${IC.paw(14)} Відкрити Питомник</button>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="font-size:13px;color:#888">${IC.paw(14)} Помилка завантаження тваринки</div>`;
  }
}

async function trainPetFromProfile(stat) {
  try {
    const r = await API.post('/api/pets/train', { stat });
    toast(`${STAT_LABELS[stat]} → рівень ${r.newLevel}!`);
    loadProfilePetTrain();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
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
          <button class="btn btn-red btn-sm" onclick="deleteMail(${m.id})">&times;</button>
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
  const time = kyivTime(m.created_at);
  return `<div class="chat-msg">
    <span class="msg-time">${m.time || time}</span>
    <span class="msg-author">[${m.level}] ${plink(m.player_id, m.username, m.faction)}</span>: ${escHtml(m.message)}
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
        <div class="opponent-avatar">${f.friend_online ? IC.online() : IC.offline()}</div>
        <div class="opponent-info">
          <div class="opponent-name">${plink(f.friend_id, f.friend_name, f.friend_faction)} <span class="text-muted">Рів.${f.friend_level}</span></div>
          <div class="text-muted">${f.status === 'pending' ? (f.requester_id === player.id ? `${IC.timer(14)} Очікує підтвердження` : `${IC.bell(14)} Новий запит`) : `${IC.check(14)} Друг`}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          ${f.status === 'pending' && f.requester_id !== player.id
            ? `<button class="btn btn-green btn-sm" onclick="acceptFriend(${f.id})">Прийняти</button>`
            : ''}
          ${f.status === 'accepted' ? `<button class="btn btn-blue btn-sm" onclick="viewProfile(${f.friend_id})">Профіль</button>` : ''}
          ${f.status === 'accepted' ? `<button class="btn btn-orange btn-sm" onclick="sendGift(${f.friend_id})">${IC.gift(13)}</button>` : ''}
          <button class="btn btn-red btn-sm" onclick="removeFriend(${f.id})">&times;</button>
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
        <div class="opponent-avatar">${p.is_online ? IC.online() : IC.offline()}</div>
        <div class="opponent-info">
          <div class="opponent-name">${plink(p.id, p.username, p.faction)} <span class="text-muted">Рів.${p.level}</span></div>
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
          <div class="rating-name">${plink(p.id, p.username, p.faction)} <span class="text-muted">Рів.${p.level}</span></div>
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
  if (!el) el = document.getElementById('clans-list');
  if (!el) return;
  const [r, warData, tasksData] = await Promise.all([
    API.get('/api/clans/my'),
    API.get('/api/clan-war/current').catch(() => ({ war: null })),
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

  // War section (new API)
  const war = warData.war;
  const myClanId = warData.myClanId || c.id;
  let warHtml = '';
  if (war) {
    const isAttacker = war.attacker_clan_id == myClanId;
    const myDmg  = parseInt(isAttacker ? war.attacker_total_damage : war.defender_total_damage) || 0;
    const foeDmg = parseInt(isAttacker ? war.defender_total_damage : war.attacker_total_damage) || 0;
    const foeName = isAttacker
      ? `[${war.defender_tag}] ${war.defender_name}`
      : `[${war.attacker_tag}] ${war.attacker_name}`;
    const totalDmg = (myDmg + foeDmg) || 1;
    const myPct  = Math.round(myDmg  / totalDmg * 100);
    const foePct = Math.round(foeDmg / totalDmg * 100);
    const secsLeft = Math.max(0, Math.floor((new Date(war.ends_at) - Date.now()) / 1000));
    const aheadLabel = myDmg > foeDmg ? '↑ Ми попереду' : myDmg < foeDmg ? '↑ Вони попереду' : '';
    _activeWarId   = war.id;
    _warIsAttacker = isAttacker;
    warHtml = `
      <div class="clan-war-box">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">${IC.battle(14)} Активна Кланова Війна!</div>
        <div style="font-size:13px;margin-bottom:4px">Суперник: <b>${foeName}</b></div>
        <div style="font-size:12px;color:#888;margin-bottom:6px" id="war-timer-hdr">Залишилось: ${fmtTime(secsLeft)}</div>
        <div style="margin-bottom:4px;font-size:12px;display:flex;align-items:center;gap:8px">
          <span style="color:#2e7d32">Ми: <b id="war-dmg-my">${fmtNum(myDmg)}</b></span>
          &nbsp;${IC.swords(13)}&nbsp;
          <span style="color:#c62828">Вони: <b id="war-dmg-foe">${fmtNum(foeDmg)}</b></span>
          ${aheadLabel ? `<span style="font-size:11px;color:#888" id="war-ahead-label">${aheadLabel}</span>` : `<span id="war-ahead-label"></span>`}
        </div>
        <div style="background:#eee;border-radius:6px;height:10px;overflow:hidden;display:flex;margin-bottom:8px">
          <div id="war-bar-my"  style="background:#2e7d32;width:${myPct}%;transition:width .4s"></div>
          <div id="war-bar-foe" style="background:#c62828;width:${foePct}%;transition:width .4s"></div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-red btn-sm" onclick="loadWarMainPanel(${war.id})">${IC.battle(13)} Бойова панель</button>
          <button class="btn btn-gray btn-sm" onclick="loadClanWarStats()">📊 Статистика</button>
        </div>
      </div>`;
  } else {
    warHtml = `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0">
        <span class="text-muted" style="font-size:13px">Активних воєн немає</span>
        ${isLeader ? `<button class="btn btn-red btn-sm" onclick="showDeclareWarModal()">${IC.swords(14)} Оголосити війну</button>` : ''}
        <button class="btn btn-gray btn-sm" onclick="loadWarHistory()">Історія воєн</button>
        <button class="btn btn-gray btn-sm" onclick="loadClanWarStats()">📊 Статистика</button>
        <button class="btn btn-blue btn-sm" onclick="loadClanWarRating()">🌍 Рейтинг кланів</button>
      </div>`;
  }

  // Tasks section
  const tasks = tasksData.tasks || [];
  const daily  = tasks.filter(t => t.task_type === 'daily');
  const weekly = tasks.filter(t => t.task_type === 'weekly');
  const taskRow = t => {
    const pct = Math.min(100, Math.round(t.progress / t.goal * 100));
    const reward = [
      t.reward_greens > 0 ? `${IC.greens(12)}${fmtNum(t.reward_greens)}` : ``,
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
      ${t.completed ? `<span style="color:#2e7d32;font-size:18px">&check;</span>` : ''}
    </div>`;
  };
  const tasksHtml = `
    <div style="font-weight:600;font-size:13px;margin-bottom:6px">Щоденні</div>
    ${daily.map(taskRow).join('') || '<p class="text-muted">—</p>'}
    <div style="font-weight:600;font-size:13px;margin:10px 0 6px">Тижневі</div>
    ${weekly.map(taskRow).join('') || '<p class="text-muted">—</p>'}` ;

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
        <div class="opponent-avatar">${m.is_online ? IC.online() : IC.offline()}</div>
        <div class="opponent-info">
          <div class="opponent-name">${plink(m.id, m.username, m.faction)} <span class="text-muted">Рів.${m.level}</span></div>
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

  // Live war countdown timer
  if (_warTimerInterval) { clearInterval(_warTimerInterval); _warTimerInterval = null; }
  if (war) {
    _warTimerEnd = new Date(war.ends_at).getTime();
    _warTimerInterval = setInterval(() => {
      const el2 = document.getElementById('war-timer-hdr');
      if (!el2) { clearInterval(_warTimerInterval); _warTimerInterval = null; return; }
      const s = Math.max(0, Math.floor((_warTimerEnd - Date.now()) / 1000));
      el2.textContent = `Залишилось: ${fmtTime(s)}`;
      if (s === 0) { clearInterval(_warTimerInterval); _warTimerInterval = null; }
    }, 1000);
  }
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
        const time  = kyivDateTime(row.created_at);
        return `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5">
          <span>${plink(row.player_id, row.username)}</span>
          <span style="color:${color}">${sign}${fmtNum(row.amount)} ${cur}</span>
          <span class="text-muted">${time}</span>
        </div>`;
      }).join('') + '</div>';
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
  if (!confirm(`Оголосити Кланову Війну проти "${targetName}"? 24 години бойових дій.`)) return;
  try {
    await API.post(`/api/clan-war/declare/${targetClanId}`);
    toast(`${IC.battle(14)} Оголошено війну проти ${targetName}!`);
    loadClans();
  } catch (e) { toast(e.message, true); }
}

async function loadWarHistory() {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  try {
    const r = await API.get('/api/clan-war/history');
    if (!r.wars.length) { el.innerHTML = '<p class="text-muted" style="margin-top:8px">Воєн ще не було</p>'; return; }
    el.innerHTML = `<div class="panel-header" style="margin-top:12px">${IC.battle(14)} Історія воєн</div>` +
      r.wars.map(w => {
        const isMyWinner = w.winner_clan_id == r.myClanId;
        const isDraw = w.status === 'draw';
        const foe = w.attacker_clan_id == r.myClanId
          ? `[${w.defender_tag}] ${w.defender_name}`
          : `[${w.attacker_tag}] ${w.attacker_name}`;
        const resultColor = isDraw ? '#888' : (isMyWinner ? '#2e7d32' : '#c62828');
        const resultIcon  = isDraw ? IC.balance(13) : (isMyWinner ? IC.trophy(13) : IC.skull(13));
        return `<div style="display:flex;align-items:center;gap:6px;padding:6px 4px;border-bottom:1px solid #eee;font-size:13px">
          <span style="flex:1">${foe}</span>
          <span style="color:${resultColor}">${resultIcon}</span>
          <span class="text-muted" style="font-size:11px">${kyivDate(w.started_at)}</span>
          <button class="btn btn-gray" style="font-size:11px;padding:2px 6px" onclick="loadWarResults(${w.id})">Детально</button>
        </div>`;
      }).join('');
  } catch (e) { toast(e.message, true); }
}

async function loadWarResults(warId) {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  el.innerHTML = `<div class="panel-header" style="margin-top:12px">📋 Результати війни</div><p class="text-muted">Завантаження...</p>`;
  try {
    const r = await API.get(`/api/clan-war/${warId}/results`);
    const w = r.war;
    const isAttacker = w.attacker_clan_id == r.myClanId;
    const myDmg  = parseInt(isAttacker ? w.attacker_total_damage : w.defender_total_damage) || 0;
    const foeDmg = parseInt(isAttacker ? w.defender_total_damage : w.attacker_total_damage) || 0;
    const foeName = isAttacker
      ? `[${w.defender_tag}] ${w.defender_name}`
      : `[${w.attacker_tag}] ${w.attacker_name}`;
    const isWinner = w.winner_clan_id == r.myClanId;
    const isDraw   = w.status === 'draw';

    const resultIcon  = isDraw ? IC.balance(13) : isWinner ? IC.trophy(13) : IC.skull(13);
    const resultText  = isDraw ? 'Нічия' : isWinner ? 'Перемога!' : 'Поразка';
    const resultColor = isDraw ? '#888' : isWinner ? '#2e7d32' : '#c62828';

    const treasuryLine = !isDraw && (w.treasury_taken_green > 0 || w.treasury_taken_gold > 0)
      ? `<div style="font-size:13px;margin-bottom:4px;color:${isWinner ? '#2e7d32' : '#c62828'}">
           ${isWinner ? 'Здобуто' : 'Втрачено'}: ${IC.greens(13)}${fmtNum(w.treasury_taken_green)} ${IC.gold(13)}${fmtNum(w.treasury_taken_gold)}
         </div>` : '';

    const pRow = (p, isMyTeam) => {
      const dmg = fmtNum(parseInt(p.damage_dealt) || 0);
      const gloryPart = isMyTeam
        ? (parseInt(p.glory_gained) > 0 ? ` <span style="color:#2e7d32">+${p.glory_gained}${IC.glory(11)}</span>` : '')
        : (parseInt(p.glory_lost)   > 0 ? ` <span style="color:#c62828">-${p.glory_lost}${IC.glory(11)}</span>` : '');
      return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid #f5f5f5">
        <span>${p.username} <span class="text-muted">Рів.${p.level}</span></span>
        <span>${dmg}${IC.hit(11)} ${p.battles_count || 0}б${gloryPart}</span>
      </div>`;
    };

    el.innerHTML = `
      <div class="panel-header" style="margin-top:12px">📋 Результати vs ${foeName}</div>
      <div style="margin-top:8px;padding:10px;background:#fafafa;border-radius:8px;margin-bottom:10px">
        <div style="font-size:17px;font-weight:700;color:${resultColor};margin-bottom:6px">${resultIcon} ${resultText}</div>
        <div style="font-size:13px;margin-bottom:4px">
          <span style="color:#2e7d32">Ми: <b>${fmtNum(myDmg)}</b></span>
          &nbsp;${IC.swords(13)}&nbsp;
          <span style="color:#c62828">Вони: <b>${fmtNum(foeDmg)}</b></span>
        </div>
        ${treasuryLine}
        ${r.cooldownSecs > 0
          ? `<div id="war-result-cooldown" style="font-size:12px;color:#888;margin-top:4px">⏳ Кулдаун: ${fmtTime(r.cooldownSecs)}</div>`
          : `<div style="font-size:12px;color:#2e7d32;margin-top:4px">✅ Кулдаун минув</div>`}
      </div>
      <div style="font-weight:600;font-size:12px;margin-bottom:4px">МІЙ КЛАН</div>
      ${r.myTeam.length ? r.myTeam.map(p => pRow(p, true)).join('') : '<p class="text-muted" style="font-size:12px">Ніхто не брав участь</p>'}
      <div style="font-weight:600;font-size:12px;margin:8px 0 4px">ВОРОГ</div>
      ${r.enemies.length ? r.enemies.map(p => pRow(p, false)).join('') : '<p class="text-muted" style="font-size:12px">—</p>'}
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-gray btn-sm" onclick="loadWarHistory()">← Назад до історії</button>
      </div>`;

    // Live cooldown countdown
    if (r.cooldownSecs > 0) {
      let secs = r.cooldownSecs;
      const cdIv = setInterval(() => {
        const cdEl = document.getElementById('war-result-cooldown');
        if (!cdEl) { clearInterval(cdIv); return; }
        if (--secs <= 0) {
          cdEl.textContent = '✅ Кулдаун минув';
          cdEl.style.color = '#2e7d32';
          clearInterval(cdIv);
        } else {
          cdEl.textContent = `⏳ Кулдаун: ${fmtTime(secs)}`;
        }
      }, 1000);
    }
  } catch (e) { toast(e.message, true); }
}

// ─── CLAN WAR BATTLE PANEL ────────────────────────────────────────────────────
let _warPanelId       = null;
let _warZones         = ['body', 'body', 'body'];
let _warTimerEnd      = null;
let _warTimerInterval = null;
let _activeWarId      = null;   // set when war box is rendered
let _warIsAttacker    = false;  // my clan is the attacker in this war

async function loadWarMainPanel(warId) {
  _warPanelId = warId;
  const el = document.getElementById('war-history-section');
  if (!el) return;
  el.innerHTML = `<div class="panel-header" style="margin-top:12px">${IC.battle(14)} Бойова панель</div><p class="text-muted">Завантаження...</p>`;
  try {
    const r = await API.get(`/api/clan-war/${warId}/leaderboard`);

    const myTotalDmg  = r.myTeam.reduce((s, p) => s + (parseInt(p.damage_dealt)  || 0), 0);
    const foeTotalDmg = r.enemies.reduce((s, p) => s + (parseInt(p.damage_dealt) || 0), 0);
    const isWinning   = myTotalDmg > foeTotalDmg;
    const isDrawing   = myTotalDmg === foeTotalDmg;

    const aheadBadge = isDrawing ? '' : isWinning
      ? `<span style="color:#2e7d32;font-size:11px;font-weight:700">↑ Ми попереду</span>`
      : `<span style="color:#c62828;font-size:11px;font-weight:700">↑ Вони попереду</span>`;

    const renderMyTeam = (list) => {
      if (!list.length) return `<div style="font-size:12px;color:#aaa;padding:4px 0">Немає учасників</div>`;
      return list.map((p, i) => `
        <div style="font-size:11px;padding:4px 0;border-bottom:1px solid #f0f0f0">
          <div style="display:flex;justify-content:space-between">
            <span>${i+1}. <b>${p.username}</b></span>
            <span style="color:#2e7d32;font-weight:600">${fmtNum(parseInt(p.damage_dealt)||0)}${IC.hit(11)}</span>
          </div>
          <div style="color:#888;font-size:10px">${p.battles_count}б · ${p.wins}п</div>
        </div>`).join('');
    };

    const renderEnemiesPanel = (list) => {
      if (!list.length) return `<div style="font-size:12px;color:#aaa;padding:4px 0">Немає ворогів</div>`;
      return list.map(e => {
        const used    = parseInt(e.attacks_used) || 0;
        const left    = 2 - used;
        const onVac   = !!e.on_vacation;
        const canAtk  = left > 0 && !onVac;
        const cntColor = left === 2 ? '#2e7d32' : left === 1 ? '#e65100' : '#aaa';
        const dmgRec  = parseInt(e.damage_received) || 0;
        return `
        <div style="font-size:11px;padding:4px 0;border-bottom:1px solid #f0f0f0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span><b>${e.username}</b> <span style="color:#888">Рів.${e.level}</span>${onVac ? ' '+IC.vacation(11) : ''}</span>
            <span style="color:${cntColor};font-weight:700;font-size:12px">${left}/2</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px">
            <span style="color:#888;font-size:10px">${IC.power(10)}${e.power_level||0} ${IC.endurance(10)}${e.endurance_level||0}${dmgRec>0?' · '+fmtNum(dmgRec)+IC.shield(10):''}</span>
            ${canAtk
              ? `<button class="btn btn-red" style="font-size:10px;padding:2px 6px;min-height:0;line-height:1.5" onclick="warAttackPrepare(${warId},${e.player_id},'${e.username}')">${IC.battle(11)}</button>`
              : `<span style="font-size:10px;color:#aaa">${left===0?'✕':''}</span>`}
          </div>
        </div>`;
      }).join('');
    };

    el.innerHTML = `
      <div class="panel-header" style="margin-top:12px">${IC.battle(14)} Бойова панель</div>
      <div style="display:flex;align-items:center;gap:8px;margin:6px 0 8px;font-size:12px">
        <span style="color:#2e7d32"><b>${fmtNum(myTotalDmg)}</b> ми</span>
        <span>${IC.swords(13)}</span>
        <span style="color:#c62828"><b>${fmtNum(foeTotalDmg)}</b> вони</span>
        ${aheadBadge}
      </div>
      <div id="war-leaderboard-table" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <div style="font-weight:600;font-size:11px;color:#2e7d32;margin-bottom:4px">МІЙ КЛАН</div>
          ${renderMyTeam(r.myTeam)}
        </div>
        <div>
          <div style="font-weight:600;font-size:11px;color:#c62828;margin-bottom:4px">ВОРОГ</div>
          ${renderEnemiesPanel(r.enemies)}
        </div>
      </div>`;
  } catch (e) { toast(e.message, true); }
}

async function loadWarLeaderboard(warId) {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  if (!document.getElementById('war-leaderboard-table'))
    el.innerHTML = `<div class="panel-header" style="margin-top:12px">${IC.trophy(13)} Рейтинг урону</div><p class="text-muted">Завантаження...</p>`;
  try {
    const r = await API.get(`/api/clan-war/${warId}/leaderboard`);
    const myTotalDmg  = r.myTeam.reduce((s, p)  => s + (parseInt(p.damage_dealt)   || 0), 0);
    const foeTotalDmg = r.enemies.reduce((s, p) => s + (parseInt(p.damage_dealt) || 0), 0);
    const isWinning   = myTotalDmg > foeTotalDmg;
    const isDrawing   = myTotalDmg === foeTotalDmg;

    // My team: nickname | damage dealt | battles | wins
    const renderMyTeam = (list) => {
      if (!list.length) return `<div style="font-size:12px;color:#aaa">Немає учасників</div>`;
      return list.map((p, i) => `
        <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f0f0f0">
          <span>${i+1}. <b>${p.username}</b></span>
          <span style="color:#2e7d32">${fmtNum(parseInt(p.damage_dealt)||0)}${IC.hit(11)} ${p.battles_count}б ${p.wins}п</span>
        </div>`).join('');
    };
    // Enemy team: nickname | damage received from us (= their damage_received)
    const renderEnemies = (list) => {
      if (!list.length) return `<div style="font-size:12px;color:#aaa">Немає учасників</div>`;
      return list.map((p, i) => `
        <div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f0f0f0">
          <span>${i+1}. <b>${p.username}</b></span>
          <span style="color:#c62828">${fmtNum(parseInt(p.damage_received)||0)}${IC.shield(10)}</span>
        </div>`).join('');
    };

    const aheadBadge = isDrawing ? '' : isWinning
      ? `<span style="color:#2e7d32;font-size:12px;font-weight:700">↑ Ми попереду</span>`
      : `<span style="color:#c62828;font-size:12px;font-weight:700">↑ Вони попереду</span>`;

    el.innerHTML = `
      <div class="panel-header" style="margin-top:12px">${IC.trophy(13)} Рейтинг урону</div>
      <div style="display:flex;align-items:center;gap:10px;margin:6px 0;font-size:13px">
        <span style="color:#2e7d32"><b>${fmtNum(myTotalDmg)}</b> ми</span>
        <span>${IC.swords(13)}</span>
        <span style="color:#c62828"><b>${fmtNum(foeTotalDmg)}</b> вони</span>
        ${aheadBadge}
      </div>
      <div id="war-leaderboard-table" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
        <div>
          <div style="font-weight:600;font-size:11px;color:#2e7d32;margin-bottom:4px">МІЙ КЛАН (урон нанесений)</div>
          ${renderMyTeam(r.myTeam)}
        </div>
        <div>
          <div style="font-weight:600;font-size:11px;color:#c62828;margin-bottom:4px">ВОРОГ (урон отриманий)</div>
          ${renderEnemies(r.enemies)}
        </div>
      </div>
      <button class="btn btn-gray btn-sm" style="margin-top:8px" onclick="loadWarMainPanel(${warId})">← Бойова панель</button>`;
  } catch (e) { toast(e.message, true); }
}

async function warAttackPrepare(warId, defenderId, defenderName) {
  try {
    await API.post(`/api/clan-war/${warId}/attack/${defenderId}`, {});
    // Open fight zone selector
    _warZones = ['body', 'body', 'body'];
    document.getElementById('clan-modal-body').innerHTML = `
      <div style="padding:14px">
        <div style="font-weight:700;margin-bottom:10px">${IC.battle(14)} Атакуєш: ${defenderName}</div>
        <div style="font-size:13px;margin-bottom:12px">Обери зону удару для кожного раунду:</div>
        ${[0,1,2].map(i => `
          <div style="margin-bottom:10px">
            <div style="font-size:12px;color:#888;margin-bottom:4px">Раунд ${i+1}</div>
            <div style="display:flex;gap:6px">
              ${['head','body','legs'].map(z => {
                const label = {head:`Голова ${IC.accuracy(10)}×1.3`,body:'Тіло ×1.0',legs:'Ноги ×0.8'}[z];
                return `<button class="btn btn-sm zone-btn-${i}" data-zone="${z}" data-round="${i}"
                  onclick="warSetZone(${i},'${z}')"
                  style="flex:1;font-size:11px">${label}</button>`;
              }).join('')}
            </div>
          </div>`).join('')}
        <button class="btn btn-red btn-full" style="margin-top:8px" onclick="warDoFight(${defenderId})">${IC.swords(14)} Атакувати!</button>
      </div>`;
    document.getElementById('clan-modal').style.display = 'flex';
    // Highlight default zones
    [0,1,2].forEach(i => warSetZone(i, 'body'));
  } catch (e) { toast(e.message, true); }
}

function warSetZone(round, zone) {
  _warZones[round] = zone;
  document.querySelectorAll(`.zone-btn-${round}`).forEach(b => {
    b.classList.toggle('btn-orange', b.dataset.zone === zone);
    b.classList.toggle('btn-gray',   b.dataset.zone !== zone);
  });
}

async function warDoFight(defenderId) {
  closeClanModal();
  try {
    const r = await API.post('/api/battle/fight', { defenderId, zones: _warZones });
    const resultColor = r.attackerWon ? '#2e7d32' : '#c62828';
    const resultText  = r.attackerWon ? `${IC.swords(14)} Перемога!` : `${IC.shield(14)} Поразка`;
    const petLine = r.petResult
      ? `<div style="font-size:12px;color:#7b5ea7;margin-bottom:4px">
           ${IC.paw(13)} Тваринка: +${fmtNum(r.petResult.attackerPetDamage)} урону твоя
           · +${fmtNum(r.petResult.defenderPetDamage)} ворожа
         </div>` : '';
    const roundHit = (side) => side.type === 'miss'
      ? '<span style="color:#888">промах</span>'
      : `<b>+${side.damage}</b>${side.type==='crit'?' '+IC.hit(11):side.type==='double'?' ×2':''}`;
    document.getElementById('clan-modal-body').innerHTML = `
      <div style="padding:14px">
        <div style="font-weight:700;font-size:16px;color:${resultColor};margin-bottom:10px">${resultText}</div>
        <div style="font-size:13px;margin-bottom:4px">
          Ти завдав: <b>${fmtNum(r.attackerDamageDealt)}</b> урону
        </div>
        <div style="font-size:13px;margin-bottom:6px">
          Суперник завдав: <b>${fmtNum(r.defenderDamageDealt)}</b> урону
        </div>
        ${petLine}
        <div style="border-top:1px solid #eee;padding-top:10px;margin-top:8px">
          ${r.rounds.map((rnd, i) => {
            const petPart = (rnd.aPetAction && rnd.aPetAction.damage > 0)
              ? ` <span style="color:#7b5ea7;font-size:11px">${IC.paw(11)}+${rnd.aPetAction.damage}</span>` : '';
            return `<div style="font-size:12px;margin-bottom:4px">
              Раунд ${i+1}: Ти ${roundHit(rnd.attacker)}${petPart}
              · Суперник ${roundHit(rnd.defender)}
            </div>`;
          }).join('')}
        </div>
        <button class="btn btn-gray btn-full" style="margin-top:12px" onclick="closeClanModal();loadWarMainPanel(${_warPanelId})">← Назад</button>
      </div>`;
    document.getElementById('clan-modal').style.display = 'flex';
    loadClans();
  } catch (e) {
    toast(e.message, true);
  }
}

async function loadClanWarRating() {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  el.innerHTML = `<div class="panel-header" style="margin-top:12px">🌍 Рейтинг кланів</div><p class="text-muted">Завантаження...</p>`;
  try {
    const r = await API.get('/api/clan-war/rating');
    const factionEmoji = { elves: '🧝', orcs: '👹', humans: '👤' };
    el.innerHTML = `<div class="panel-header" style="margin-top:12px">🌍 Рейтинг кланів</div>` +
      (r.clans.length ? r.clans.map((c, i) => {
        const total  = (parseInt(c.wars_won) || 0) + (parseInt(c.wars_lost) || 0);
        const winPct = total > 0 ? Math.round((parseInt(c.wars_won) || 0) / total * 100) : 0;
        const emoji  = factionEmoji[c.faction] || '';
        return `
        <div class="flex-between" style="padding:6px 4px;border-bottom:1px solid #f0f0f0;font-size:13px">
          <span>${i+1}. <b>[${c.tag}]</b> ${c.name}
            <span class="badge-faction ${c.faction}" style="font-size:10px;margin-left:4px">${emoji} ${factionLabel(c.faction)}</span>
          </span>
          <span class="text-muted">${IC.glory(12)}${fmtNum(c.total_glory)} · ${c.wars_won}П/${c.wars_lost}П · ${winPct}%</span>
        </div>`;
      }).join('') : '<p class="text-muted">Немає даних</p>');
  } catch (e) { toast(e.message, true); }
}

async function loadClanWarStats() {
  const el = document.getElementById('war-history-section');
  if (!el) return;
  el.innerHTML = `<div class="panel-header" style="margin-top:12px">📊 Статистика клану у войнах</div><p class="text-muted">Завантаження...</p>`;
  try {
    const r = await API.get('/api/clan-war/clan-stats');
    const t = r.totals || {};
    const streakLabel = r.streakType === 'win'  ? `${IC.trophy(13)} ${r.streak} перемог поспіль`
                      : r.streakType === 'loss' ? `${IC.skull(13)} ${r.streak} поразок поспіль`
                      : '—';

    const statLine = (label, value) =>
      `<div class="flex-between" style="padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:13px">
         <span class="text-muted">${label}</span><span><b>${value}</b></span>
       </div>`;

    const lastWarsHtml = r.lastWars.length ? `
      <div style="font-weight:600;font-size:13px;margin:12px 0 6px">Останні 10 воєн</div>
      ${r.lastWars.map(w => {
        const isMine  = w.attacker_clan_id == r.myClanId;
        const foeTag  = isMine ? `[${w.defender_tag}] ${w.defender_name}` : `[${w.attacker_tag}] ${w.attacker_name}`;
        const myDmg   = parseInt(isMine ? w.attacker_total_damage : w.defender_total_damage) || 0;
        const foeDmg  = parseInt(isMine ? w.defender_total_damage : w.attacker_total_damage) || 0;
        const isWin   = w.winner_clan_id == r.myClanId;
        const isDraw  = w.status === 'draw';
        const icon    = isDraw ? IC.balance(13) : isWin ? IC.trophy(13) : IC.skull(13);
        const date    = w.finished_at ? new Date(w.finished_at).toLocaleDateString('uk-UA') : '—';
        return `<div style="padding:6px 4px;border-bottom:1px solid #f0f0f0;font-size:12px">
          ${icon} <b>${foeTag}</b>
          <span class="text-muted" style="float:right">${date}</span>
          <div class="text-muted" style="margin-top:2px">Ми: ${fmtNum(myDmg)} · Вони: ${fmtNum(foeDmg)}</div>
        </div>`;
      }).join('')}` : '';

    el.innerHTML = `
      <div class="panel-header" style="margin-top:12px">📊 Статистика клану у войнах</div>
      <div style="background:#fff;border-radius:8px;padding:8px 12px;margin-top:6px">
        ${statLine('Всього воєн', fmtNum(t.total_wars || 0))}
        ${statLine('Перемоги', fmtNum(t.wins || 0))}
        ${statLine('Поразки', fmtNum(t.losses || 0))}
        ${statLine('Нічиї', fmtNum(t.draws || 0))}
        ${statLine('Найбільший урон', fmtNum(t.best_damage || 0))}
        ${statLine('Поточна серія', streakLabel)}
        ${r.topPlayer ? statLine('Найактивніший', `${r.topPlayer.username} (${fmtNum(r.topPlayer.total_damage)} урону)`) : ''}
      </div>
      ${lastWarsHtml}
      <button class="btn btn-gray btn-sm" style="margin-top:10px" onclick="document.getElementById('war-history-section').innerHTML=''">✕ Закрити</button>`;
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
  window._viewingPlayerId = id;
  try {
    const r = await API.get(`/api/profile/${id}`);
    const p = r.player;
    const el = document.getElementById('pubprofile-content');

    const friendBtn = r.friendshipStatus === 'accepted'
      ? `<button class="btn btn-gray btn-sm" disabled>${IC.check(14)} Вже друг</button>`
      : r.friendshipStatus === 'pending'
      ? `<button class="btn btn-gray btn-sm" disabled>${IC.timer(14)} Очікує</button>`
      : `<button class="btn btn-green btn-sm" onclick="addFriend(${p.id})">+ До друзів</button>`;

    el.innerHTML = `
      <div class="panel mb-12">
        <div class="panel-header flex-between">
          <span class="profile-nick-header ${p.faction}">${p.username}</span>
          <span style="font-size:12px">${p.is_online ? `${IC.online()} онлайн` : `${IC.offline()} офлайн`}</span>
        </div>
        ${buildDoll(r.equipment, r.itemRunes, p.avatar_url, p.faction, p.gender, false)}
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
        ${infoRow(IC.clan(14), 'Клан', p.clan_name ? `<span onclick="navigate('clans')" style="cursor:pointer;color:#e65100;text-decoration:underline">[${p.clan_tag}] ${p.clan_name}</span>` : 'Не в клані')}
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

      ${r.gifts && r.gifts.length ? `
      <div class="panel mb-12">
        <div class="panel-header">${IC.gift(14)} Активні подарунки</div>
        <div class="panel-body">${renderActiveGifts(r.gifts)}</div>
      </div>` : ``}

      <div class="panel mb-12">
        <div class="panel-header">${IC.paw(14)} Тваринка</div>
        <div class="panel-body" id="pubprofile-pet-body">
          <p class="text-muted" style="font-size:13px">Завантаження...</p>
        </div>
      </div>

      <div class="panel mb-12" id="pubprofile-war-block" style="display:none">
        <div class="panel-header">${IC.battle(14)} Кланові Війни</div>
        <div class="panel-body" id="pubprofile-war-body"></div>
      </div>

      <button class="btn btn-gray btn-sm mb-12" onclick="history.back()">← Назад</button>`;

    _loadPubProfilePet(id);
    _loadPubProfileWarStats(id);
  } catch (e) { toast(e.message, true); }
}

async function _loadPubProfilePet(playerId) {
  const el = document.getElementById('pubprofile-pet-body');
  if (!el) return;
  try {
    const { pet, training, equipment } = await API.get(`/api/pets/player/${playerId}`);
    if (!pet) { el.innerHTML = '<p class="text-muted" style="font-size:13px">Тваринки немає</p>'; return; }

    const rarityColor  = { 1:'#9e9e9e', 2:'#388e3c', 3:'#8e24aa' };
    const rarityBg     = { 1:'#fafafa', 2:'linear-gradient(135deg,#e8f5e9,#f1f8e9)', 3:'linear-gradient(135deg,#fce4ec,#f3e5f5)' };
    const rarityBorder = { 1:'#e0e0e0', 2:'#66bb6a', 3:'#ce93d8' };
    const eq = (slot) => (equipment || []).find(e => e.slot === slot)?.bonus_value || 0;
    const eff = {
      power:     pet.power     + eq('collar'),
      endurance: pet.endurance + eq('amulet'),
      speed:     pet.speed,
      accuracy:  pet.accuracy  + eq('boots'),
      hp_max:    pet.hp_max    + eq('armor'),
    };

    const todayKey = `pet_stroked_${pet.id}_${new Date().toISOString().slice(0,10)}`;
    const alreadyStroked = !!localStorage.getItem(todayKey);

    const hpPct = Math.min(100, Math.floor(pet.hp_current / (eff.hp_max || pet.hp_max) * 100));
    const eqSlots = ['collar','amulet','armor','boots'].map(slot => {
      const e = (equipment || []).find(e => e.slot === slot);
      return `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid #f5f5f5">
        <span>${SLOT_NAMES[slot]}</span>
        ${e ? `<span style="color:#388e3c;font-weight:600">+${e.bonus_value} (рів.${e.item_level})</span>` : '<span style="color:#bbb">—</span>'}
      </div>`;
    }).join('');

    el.innerHTML = `
      <div style="border:2px solid ${rarityBorder[pet.rarity]};background:${rarityBg[pet.rarity]};border-radius:10px;padding:12px;text-align:center;margin-bottom:12px">
        <div id="pubpet-icon" style="font-size:52px;margin-bottom:4px">${IC.petIcon(pet.icon, 52)}</div>
        <div style="font-weight:700;font-size:17px">${pet.name}${pet.is_dead ? ` ${IC.skull(14)}` : ''}</div>
        <div style="color:${rarityColor[pet.rarity]};font-size:13px;font-weight:600">${RARITY_LABEL[pet.rarity]}</div>
        ${pet.is_dead ? '<div style="color:#c62828;font-size:12px;margin-top:4px">Тваринка мертва</div>' : ''}
      </div>

      ${!pet.is_dead ? `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:2px">
          <span>${IC.heart(14)} HP</span><span>${fmtNum(pet.hp_current)} / ${fmtNum(eff.hp_max || pet.hp_max)}</span>
        </div>
        <div style="background:#f0f0f0;border-radius:4px;height:8px;overflow:hidden">
          <div style="background:${hpPct>50?'#43a047':hpPct>25?'#fb8c00':'#e53935'};height:100%;width:${hpPct}%"></div>
        </div>
      </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        ${['power','endurance','speed','accuracy'].map(k => {
          const lvl = training?.[`${k}_level`] || 1;
          return `<div style="background:#fff;border:1px solid #eee;border-radius:6px;padding:6px;text-align:center">
            <div style="font-size:10px;color:#888">${STAT_LABELS[k]}</div>
            <div style="font-weight:700;font-size:17px">${eff[k] || pet[k]}</div>
            <div style="font-size:10px;color:#bbb">тр.${lvl}/50</div>
          </div>`;
        }).join('')}
      </div>

      ${pet.abilityDesc ? `
      <div style="background:#f3e5f5;border-radius:8px;padding:8px;margin-bottom:10px;font-size:12px">
        <div style="font-weight:600;color:#7b1fa2;margin-bottom:2px">${IC.sparkle(14)} Унікальна здібність</div>
        <div>${pet.abilityDesc}</div>
      </div>` : ''}

      <div style="margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px;color:#555">Екіпіровка</div>
        ${eqSlots}
      </div>

      ${!pet.is_dead ? `
      <div style="display:flex;gap:8px;justify-content:center">
        <button id="stroke-btn" class="btn btn-sm ${alreadyStroked ? 'btn-gray' : 'btn-orange'}"
          onclick="strokeFriendPet(${pet.id},'${todayKey}')"
          ${alreadyStroked ? 'disabled' : ''}>
          ${IC.heart(14)} ${alreadyStroked ? 'Погладили сьогодні' : 'Погладити'}
        </button>
        <button class="btn btn-green btn-sm" onclick="playWithFriendPet(${pet.id})">
          ${IC.sparkle(14)} Пограти (+5 HP)
        </button>
      </div>` : ''}
    `;
  } catch(e) {
    el.innerHTML = '<p class="text-muted" style="font-size:13px">Не вдалось завантажити</p>';
  }
}

async function _loadPubProfileWarStats(playerId) {
  try {
    const wr = await API.get(`/api/clan-war/player-stats/${playerId}`);
    const ws = wr.stats || {};
    if (parseInt(ws.total_battles) <= 0) return;
    const block = document.getElementById('pubprofile-war-block');
    const body  = document.getElementById('pubprofile-war-body');
    if (!block || !body) return;
    const row = (icon, label, val) =>
      `<div class="flex-between" style="padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:13px">
         <span class="text-muted">${icon} ${label}</span><span><b>${val}</b></span>
       </div>`;
    body.innerHTML =
      row(IC.battle(14), 'Боїв у войнах',      fmtNum(ws.total_battles))  +
      row(IC.wins(14),   'Перемог у боях',      fmtNum(ws.total_wins))     +
      row(IC.hit(14),    'Загальний урон',       fmtNum(ws.total_damage))   +
      row(IC.glory(14),  'Воєн виграно кланом', fmtNum(wr.warsWonWithClan)) +
      (parseInt(ws.glory_gained) > 0 ? row(IC.glory(14), 'Слави здобуто',  `+${fmtNum(ws.glory_gained)}`) : '') +
      (parseInt(ws.glory_lost)   > 0 ? row(IC.skull(14), 'Слави втрачено', `-${fmtNum(ws.glory_lost)}`)   : '');
    block.style.display = '';
  } catch (_) {}
}

function strokeFriendPet(petId, todayKey) {
  if (localStorage.getItem(todayKey)) return;
  localStorage.setItem(todayKey, '1');
  // Анімація погладжування
  const icon = document.getElementById('pubpet-icon');
  if (icon) {
    const frames = [1.5, 1, 1.3, 1, 1.4, 1];
    frames.forEach((s, i) => setTimeout(() => { icon.style.transform = `scale(${s})`; icon.style.transition = 'transform .1s'; }, i * 120));
  }
  toast('Ви погладили тваринку!');
  const btn = document.getElementById('stroke-btn');
  if (btn) { btn.innerHTML = `${IC.heart(14)} Погладили сьогодні`; btn.disabled = true; btn.className = 'btn btn-sm btn-gray'; }
}

async function playWithFriendPet(petId) {
  try {
    const r = await API.post(`/api/pets/play/${petId}`);
    toast(`Пограли з тваринкою! +${r.hpAdded} HP`);
    if (window._viewingPlayerId) _loadPubProfilePet(window._viewingPlayerId);
  } catch(e) { toast(e.message, true); }
}

const GIFT_LIST = [
  { type: 'power_statue',    name: 'Статуетка мощі',     icon: IC.lightning(20), stat: '+10% твоєї мощі на 24 год',        cost: 50,  minLevel: 1  },
  { type: 'endurance_seal',  name: 'Печать стійкості',   icon: IC.endurance(20), stat: '+10% твоєї стійкості на 24 год',   cost: 50,  minLevel: 1  },
  { type: 'accuracy_scroll', name: 'Манускрипт точності',icon: IC.accuracy(20),  stat: '+10% твоєї точності на 24 год',    cost: 50,  minLevel: 3  },
  { type: 'speed_flask',     name: 'Флакон швидкості',   icon: IC.speed(20),     stat: '+10% твоєї швидкості на 24 год',   cost: 50,  minLevel: 3  },
  { type: 'harvest_idol',    name: 'Ідол врожаю',        icon: IC.wheat(20),     stat: '+15% до зелені з огороду на 24 год', cost: 80,  minLevel: 5  },
  { type: 'luck_amulet',     name: 'Амулет удачі',       icon: IC.star(20),      stat: 'Підсилює всі подарунки другу на 50%', cost: 150, minLevel: 10 },
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
      <div class="admin-player-row ${p.is_banned ? 'banned' : ''}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #eee">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${p.username} <span style="color:#888;font-weight:400;font-size:12px">Рів.${p.level}</span> ${p.is_online ? IC.online() : IC.offline()}</div>
          ${p.is_banned ? `<span style="background:#c62828;color:#fff;font-size:10px;padding:1px 6px;border-radius:6px">БАН</span>` : ''}
          <div style="font-size:12px;color:#555;margin-top:2px">${IC.greens(12)}${fmtNum(p.greens)} ${IC.gold(12)}${fmtNum(p.gold)} ${IC.diamonds(12)}${p.diamonds||0}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;gap:4px">
            ${p.is_banned
              ? `<button class="btn btn-green btn-sm" onclick="adminUnban(${p.id})">Розбан</button>`
              : `<button class="btn btn-red btn-sm" onclick="adminBan(${p.id})">Бан</button>`}
            <button class="btn btn-orange btn-sm" onclick="adminGive(${p.id})">${IC.moneybag(14)} Дати</button>
          </div>
          <button class="btn btn-blue btn-sm" onclick="adminEdit(${p.id})">${IC.settings(14)} Редагувати</button>
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
  const greens   = parseInt(prompt('Зелень (0 якщо не потрібно):')) || 0;
  const gold     = parseInt(prompt('Золото:')) || 0;
  const diamonds = parseInt(prompt('Алмази:')) || 0;
  if (!greens && !gold && !diamonds) return;
  try {
    await API.post(`/api/admin/players/${id}/give`, { greens, gold, diamonds });
    toast('Видано!');
    adminSearch();
  } catch (e) { toast(e.message, true); }
}

async function adminEdit(id) {
  try {
    const { player: p } = await API.get(`/api/admin/players/${id}`);
    let modal = document.getElementById('admin-edit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'admin-edit-modal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
      document.body.appendChild(modal);
    }
    const field = (label, name, val, type='text') =>
      `<div style="margin-bottom:8px">
        <label style="font-size:12px;color:#666;display:block;margin-bottom:2px">${label}</label>
        <input id="ae-${name}" type="${type}" value="${val ?? ''}" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px;box-sizing:border-box">
      </div>`;
    const chk = (label, name, val) =>
      `<label style="display:flex;align-items:center;gap:6px;font-size:13px;margin-bottom:8px;cursor:pointer">
        <input id="ae-${name}" type="checkbox" ${val ? 'checked' : ''}> ${label}
      </label>`;
    modal.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:20px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto">
        <div style="font-weight:700;font-size:16px;margin-bottom:14px">${IC.settings(16)} Редагування: <span style="color:#1565c0">${p.username}</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
          ${field('Нікнейм','username',p.username)}
          ${field('Рівень','level',p.level,'number')}
          ${field('Фракція','faction',p.faction)}
          ${field('Стать','gender',p.gender)}
          ${field('Статус-текст','status_text',p.status_text)}
          ${field('Місто','city_name',p.city_name)}
        </div>
        <div style="font-weight:600;font-size:13px;margin:8px 0 6px;color:#555">${IC.greens(13)} Ресурси</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 8px">
          ${field('Зелень','greens',p.greens,'number')}
          ${field('Золото','gold',p.gold,'number')}
          ${field('Алмази','diamonds',p.diamonds,'number')}
          ${field('Слава','glory',p.glory,'number')}
          ${field('HP','hp',p.hp,'number')}
          ${field('Max HP','max_hp',p.max_hp,'number')}
          ${field('Рейтинг','rating_points',p.rating_points,'number')}
          ${field('Перемоги','wins',p.wins,'number')}
          ${field('Поразки','losses',p.losses,'number')}
        </div>
        <div style="font-weight:600;font-size:13px;margin:8px 0 6px;color:#555">${IC.power(13)} Тренування (рівні)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
          ${field('Міць','power_level',p.power_level,'number')}
          ${field('Стійкість','endurance_level',p.endurance_level,'number')}
          ${field('Швидкість','speed_level',p.speed_level,'number')}
          ${field('Точність','accuracy_level',p.accuracy_level,'number')}
        </div>
        <div style="font-weight:600;font-size:13px;margin:8px 0 6px;color:#555">Прапори</div>
        ${chk('Адмін-права','is_admin',p.is_admin)}
        ${chk('На канікулах','on_vacation',p.on_vacation)}
        ${chk('Заблокований','is_banned',p.is_banned)}
        ${field('Причина бану','ban_reason',p.ban_reason)}
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn btn-green" style="flex:1" onclick="adminSave(${p.id})">Зберегти</button>
          <button class="btn btn-gray" style="flex:1" onclick="document.getElementById('admin-edit-modal').remove()">Скасувати</button>
        </div>
      </div>`;
  } catch (e) { toast(e.message, true); }
}

async function adminSave(id) {
  const g   = n => document.getElementById(`ae-${n}`);
  const num = n => { const v = g(n)?.value; return v !== '' && v != null ? parseInt(v) : undefined; };
  const str = n => { const v = g(n)?.value?.trim(); return v !== undefined ? v : undefined; };
  const bol = n => g(n) ? g(n).checked : undefined;

  const body = {};
  ['username','faction','gender','status_text','city_name','ban_reason'].forEach(k => { const v=str(k); if(v!==undefined) body[k]=v; });
  ['level','greens','gold','diamonds','glory','hp','max_hp','rating_points','wins','losses',
   'power_level','endurance_level','speed_level','accuracy_level'].forEach(k => { const v=num(k); if(v!==undefined) body[k]=v; });
  ['is_admin','on_vacation','is_banned'].forEach(k => { const v=bol(k); if(v!==undefined) body[k]=v; });

  try {
    await API.put(`/api/admin/players/${id}`, body);
    toast('Збережено!');
    document.getElementById('admin-edit-modal')?.remove();
    adminSearch();
    if (id === player.id) await refreshPlayer();
  } catch (e) { toast(e.message, true); }
}

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
function initSocket() {
  socket = io();

  socket.on('chat:message', (m) => {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="msg-time">${m.time}</span> <span class="msg-author">[${m.level}] ${plink(m.playerId, m.username, m.faction)}</span>: ${escHtml(m.message)}`;
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

  socket.on(`gift:received`, ({ giftName, fromUsername }) => {
    toast(`${IC.gift(14)} ${fromUsername} надіслав тобі подарунок: ${giftName}!`);
    if (document.getElementById('page-profile')?.classList.contains('active'))
      loadProfile();
  });

  socket.on('clan_defense:wave', ({ wave, waveName, waveHp, baseHp, baseHpMax, prevWaveDefeated }) => {
    const msg = prevWaveDefeated === null
      ? `${IC.swords(14)} Оборона бази розпочалась! Хвиля 1: ${waveName}`
      : prevWaveDefeated
        ? `${IC.ok(14)} Хвиля ${wave - 1} відбита! → Хвиля ${wave}: ${waveName} (${fmtNum(waveHp)} HP)`
        : `${IC.no(14)} Хвиля ${wave - 1} прорвалась! База: ${fmtNum(baseHp)}/${fmtNum(baseHpMax)} → Хвиля ${wave}`;
    toast(msg, !prevWaveDefeated && prevWaveDefeated !== null);
    if (document.getElementById('page-clan-defense')?.classList.contains('active')) loadClanDefense();
  });

  socket.on('clan_defense:damage', ({ waveHpCurrent, waveHpMax }) => {
    const bar = document.getElementById('cdef-wave-hp-bar');
    const lbl = document.getElementById('cdef-wave-hp-lbl');
    if (bar) bar.style.width = `${Math.max(0, (waveHpCurrent / waveHpMax) * 100)}%`;
    if (lbl) lbl.textContent = `${fmtNum(waveHpCurrent)} / ${fmtNum(waveHpMax)}`;
  });

  socket.on('clan_defense:ended', ({ waves_survived, is_victory, base_destroyed, playerGreens, playerGlory }) => {
    if (is_victory)       toast(`${IC.trophy(14)} База вистояла! Всі 12 хвиль відбито! +${playerGreens}${IC.greens(14)} +${playerGlory} слави`);
    else if (base_destroyed) toast(`${IC.skull(14)} База зруйнована! Отримай досвід за участь`, true);
    else                  toast(`${IC.swords(14)} Оборона завершена! ${waves_survived} хвиль відбито. +${playerGreens}${IC.greens(14)}`);
    refreshPlayer();
    if (document.getElementById('page-clan-defense')?.classList.contains('active')) loadClanDefense();
  });

  socket.on('daily:available', ({ eventType }) => {
    const names = { quest: `${IC.clipboard(14)} Квест`, tournament: `${IC.swords(14)} Турнір`, wheel: `${IC.slot(14)} Колесо Фортуни` };
    toast(`${IC.celebrate(14)} Новий щоденний івент: ${names[eventType] || eventType}!`);
    const lbl = document.getElementById('daily-menu-label');
    if (lbl) lbl.innerHTML = names[eventType] || 'Щоденний івент';
    if (document.getElementById('page-daily')?.classList.contains('active')) loadDaily();
  });

  socket.on('insects:started', ({ swarmHp, penaltyPct }) => {
    document.getElementById('insect-notif-sub').textContent = `Рій: ${fmtNum(swarmHp)} HP · Штраф якщо не відженеш: ${penaltyPct}%`;
    document.getElementById('insect-notif').style.display = 'flex';
  });

  socket.on('insects:defeated', ({ rewardGreen, rewardExp }) => {
    closeInsectModal();
    toast(`${IC.insect(14)} Рій знищено! +${IC.greens(14)} ${fmtNum(rewardGreen)} зелені +${IC.sparkle(14)} ${rewardExp} exp`);
    refreshPlayer();
  });

  socket.on(`dragon:started`, ({ eventId, hpMax }) => {
    toast(`${IC.dragon(28)} Дракон нападає! HP: ${fmtNum(hpMax)} — Поспішай до битви!`);
    document.getElementById('dragon-notif-sub').textContent = `HP: ${fmtNum(hpMax)} / ${fmtNum(hpMax)}`;
    document.getElementById('dragon-notif').style.display = 'flex';
    loadDragon();
  });

  socket.on('dragon:damage', ({ hpCurrent, hpMax }) => {
    const bar = document.getElementById('dragon-hp-bar');
    const lbl = document.getElementById('dragon-hp-label');
    if (bar) bar.style.width = `${Math.max(0, (hpCurrent / hpMax) * 100)}%`;
    if (lbl) lbl.textContent = `${fmtNum(hpCurrent)} / ${fmtNum(hpMax)}`;
  });

  socket.on('dragon:ended', ({ isKilled, top10 }) => {
    toast(isKilled ? `${IC.dragon(28)} Дракона переможено! Нагороди розподілено!` : `${IC.dragon(28)} Дракон втік! Час вийшов.`);
    document.getElementById('dragon-notif').style.display = 'none';
    if (document.getElementById('page-dragon')?.classList.contains('active')) loadDragon();
  });

  socket.on('events:new', ({ title, icon }) => {
    toast(`${icon || '📋'} ${title}`);
    refreshEventsCount();
  });

  socket.on('events:count', ({ unread_count }) => {
    updateEventsBadge(unread_count);
  });

  socket.on('clan_war:started', ({ warId, attackerClan, defenderClan, endsAt }) => {
    toast(`${IC.swords(14)} Кланова Війна! ${attackerClan.name} vs ${defenderClan.name}`);
    const page = document.getElementById('page-clans');
    if (page && page.classList.contains('active')) renderMyClan();
  });

  socket.on('clan_war:damage', ({ warId, totalA, totalB }) => {
    // Update main war box if it's on screen
    if (_activeWarId === warId) {
      const myTotal  = _warIsAttacker ? (totalA || 0) : (totalB || 0);
      const foeTotal = _warIsAttacker ? (totalB || 0) : (totalA || 0);
      const total    = (myTotal + foeTotal) || 1;
      const myPct    = Math.round(myTotal  / total * 100);
      const foePct   = Math.round(foeTotal / total * 100);
      const barMy  = document.getElementById('war-bar-my');
      const barFoe = document.getElementById('war-bar-foe');
      const dmgMy  = document.getElementById('war-dmg-my');
      const dmgFoe = document.getElementById('war-dmg-foe');
      const ahead  = document.getElementById('war-ahead-label');
      if (barMy)  barMy.style.width  = myPct  + '%';
      if (barFoe) barFoe.style.width = foePct + '%';
      if (dmgMy)  dmgMy.textContent  = fmtNum(myTotal);
      if (dmgFoe) dmgFoe.textContent = fmtNum(foeTotal);
      if (ahead)  ahead.textContent  = myTotal > foeTotal ? '↑ Ми попереду'
                                     : myTotal < foeTotal ? '↑ Вони попереду' : '';
    }
    // Auto-refresh battle panel if currently open
    if (document.getElementById('war-leaderboard-table')) {
      loadWarMainPanel(warId);
    }
  });

  socket.on('clan_war:ended', ({ warId, winner, treasuryTaken, gloryChanges, isWinner, isDraw }) => {
    _warPanelId  = null;
    _activeWarId = null;
    if (_warTimerInterval) { clearInterval(_warTimerInterval); _warTimerInterval = null; }

    const t = treasuryTaken || {};
    if (isDraw) {
      toast(`${IC.balance(13)} Кланова війна завершилась нічиєю`);
    } else if (isWinner) {
      const tPart = (t.green || t.gold)
        ? ` · ${IC.greens(13)}${fmtNum(t.green)} ${IC.gold(13)}${fmtNum(t.gold)}`
        : '';
      toast(`${IC.trophy(13)} Клан "${winner?.name}" переміг! +${gloryChanges} слави${tPart}`);
    } else {
      toast(`${IC.skull(13)} Клан програв. ${gloryChanges} слави`);
    }

    const page = document.getElementById('page-clans');
    if (page && page.classList.contains('active')) {
      renderMyClan().then(() => loadWarResults(warId));
    }
  });

  initChatHistory();
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
function updateEventsBadge(count) {
  const badge = document.getElementById('events-badge');
  const menuLabel = document.getElementById('events-menu-label');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'inline-block';
    if (menuLabel) menuLabel.textContent = `Події (${count})`;
  } else {
    badge.style.display = 'none';
    if (menuLabel) menuLabel.textContent = 'Події';
  }
}

async function refreshEventsCount() {
  try {
    const r = await API.get('/api/events/count');
    updateEventsBadge(r.unread_count);
  } catch (_) {}
}

async function loadEvents() {
  try {
    // mark all as read
    await API.post('/api/events/read-all');
    updateEventsBadge(0);

    const r = await API.get('/api/events');
    const events = r.events;

    // Block 0: mini profile
    const mpEl = document.getElementById('events-miniprofile');
    if (mpEl && player) {
      const pct = player.exp_to_next > 0 ? Math.min(100, player.experience / player.exp_to_next * 100).toFixed(1) : 0;
      mpEl.innerHTML = `
        <div class="panel-body" style="display:flex;align-items:center;gap:12px">
          <div style="font-size:40px;flex-shrink:0">${playerAvatar(player.faction, player.gender)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px">${player.username}</div>
            <div class="text-muted" style="font-size:12px">Рів. ${player.level} · ${factionLabel(player.faction)} · Слава: ${player.glory}</div>
            <div class="exp-bar-wrap" style="margin:4px 0"><div class="exp-bar" style="width:${pct}%"></div></div>
            <div style="font-size:11px;color:#aaa">${fmtNum(player.experience)} / ${fmtNum(player.exp_to_next)} досвіду</div>
          </div>
        </div>`;
    }

    const contentEl = document.getElementById('events-content');
    if (!contentEl) return;

    const SYSTEM  = ['insects_attack','dragon_start','dragon_end','clan_war_start','clan_war_end','greenhouse_full','deposit_ready'];
    const BATTLE  = ['battle_win','battle_lose','battle_attacked_win','battle_attacked_lose','ring_stolen','ring_stolen_from'];
    const SOCIAL  = ['gift_received','friend_request','garden_watered','prank','clan_join','clan_kicked'];
    const REWARDS = ['level_up','quest_done','deposit_done','daily_reward','tournament_end'];

    const sys     = events.filter(e => SYSTEM.includes(e.event_type));
    const battle  = events.filter(e => BATTLE.includes(e.event_type));
    const social  = events.filter(e => SOCIAL.includes(e.event_type));
    const rewards = events.filter(e => REWARDS.includes(e.event_type));

    const COLOR_MAP = { green:'#388e3c', red:'#c62828', orange:'#e65100', gold:'#f9a825', blue:'#1565c0', purple:'#6a1b9a' };

    const renderBlock = (title, list) => {
      if (!list.length) return '';
      return `
        <div class="panel mb-12">
          <div class="panel-header">${title}</div>
          <div class="panel-body" style="padding:0">
            ${list.map(ev => {
              const color = COLOR_MAP[ev.color] || '#555';
              const timeStr = new Date(ev.created_at).toLocaleString('uk-UA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
              return `
              <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-bottom:1px solid #f0f0f0">
                <span style="font-size:22px;flex-shrink:0">${ev.icon || '📋'}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:${color}">${ev.title}</div>
                  ${ev.body ? `<div class="text-muted" style="font-size:12px;margin-top:2px">${ev.body}</div>` : ''}
                  <div style="font-size:11px;color:#bbb;margin-top:3px">${timeStr}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    };

    const html = [
      renderBlock(`${IC.swords(13)} Бойовий журнал`, battle),
      renderBlock(`${IC.bell(13)} Системні події`, sys),
      renderBlock(`${IC.friends(13)} Соціальні події`, social),
      renderBlock(`${IC.trophy(13)} Нагороди`, rewards),
    ].join('');

    contentEl.innerHTML = html || `<div class="panel"><div class="panel-body"><p class="text-muted" style="text-align:center">Подій ще немає</p></div></div>`;
  } catch (e) { toast(e.message, true); }
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
      <div class="cave-npc-speech">${hint}</div>
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
    startCavesCountdown(s.mine_expires_at, `cave-timer-active`);

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
        ${r.mineBonus > 0 ? `<div style="font-size:14px;color:#5d4037;margin-bottom:8px">${IC.pickaxe(14)} +${r.mineBonus} від шахти клану</div>` : ''}
        ${r.rareDrop ? `<div style="font-size:15px;color:#7c4dff;font-weight:600;margin-bottom:8px">${r.rareDrop.emoji} Знайдено: ${r.rareDrop.name}!</div>` : ''}
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
  btn.innerHTML = `${IC.timer(14)} Завантаження...`;

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
  'Руна вогню':        '+8 мощі, +5 точності',
  'Руна льоду':        '+8 стійкості, +5 точності',
  'Руна Блискавки':    '+10 мощі, +10 швидкості',
  'Руна Землі':        '+15 стійкості, +8 здоров\'я',
  'Руна Вітру':        '+12 швидкості, +10 точності',
  'Руна Тьми':         '+20 мощі, -5 стійкості',
  'Руна Світла':       '+15 стійкості, +15 точності',
  'Руна Дракона':      '+25 мощі, +20 стійкості',
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
      <div class="panel-header" style="margin-top:12px">${IC.inventory(14)} Руни у спорядженні</div>
      <div id="rune-socket-ui">${renderRuneSocketUI(r)}</div>`;

    const firstTab = document.querySelector('#jeweler-tabs .cat-tab');
    if (firstTab) filterJeweler('rune', firstTab);
  } catch(e) { toast(e.message, true); }
}

function renderRuneSocketUI(r) {
  const items = r.equipItems || [];
  if (!items.length) return '<p class="text-muted">Немає підходящого спорядження</p>';

  return items.map(item => {
    const maxSlots = ['helmet','shield'].includes(item.category) ? 2 : 3;
    const runesInItem = (r.itemRunes || []).filter(ir => ir.inv_id === item.id);
    const slots = Array.from({length: maxSlots}, (_, i) => {
      const rune = runesInItem.find(r => r.slot_index === i);
      if (rune) {
        const bonParts = [];
        if (rune.power_bonus)     bonParts.push(`${IC.power(11)}+${rune.power_bonus}`);
        if (rune.endurance_bonus) bonParts.push(`${IC.endurance(11)}${rune.endurance_bonus > 0 ? '+' : ''}${rune.endurance_bonus}`);
        if (rune.speed_bonus)     bonParts.push(`${IC.speed(11)}+${rune.speed_bonus}`);
        if (rune.accuracy_bonus)  bonParts.push(`${IC.accuracy(11)}+${rune.accuracy_bonus}`);
        return `<div class="rune-slot filled">
          <div style="font-size:11px;font-weight:600">${rune.rune_name}</div>
          <div style="font-size:10px;color:#aaa">${bonParts.join(` `)}</div>
          <button class="btn btn-red btn-sm" style="margin-top:4px;font-size:10px" onclick="removeRune(${rune.rune_inv_id})">Вийняти 100${IC.greens(14)}</button>
        </div>`;
      }
      return `<div class="rune-slot empty" onclick="openRuneInsert(${item.id}, ${i})">
        <div style="font-size:20px;color:#555">+</div>
        <div style="font-size:10px;color:#888">Слот ${i+1}</div>
      </div>`;
    }).join('');

    return `<div class="item-card" style="flex-direction:column;align-items:stretch;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        ${itemIcon(item.name, 28)}
        <div>
          <div class="item-name">${item.name}${item.upgrade_level ? ` +${item.upgrade_level}` : ''}</div>
          <div style="font-size:11px;color:#888">${item.is_equipped ? `${IC.ok(14)} Одягнено` : `${IC.inventory(14)} В інвентарі`} · ${runesInItem.length}/${maxSlots} рун</div>
        </div>
      </div>
      <div style="display:flex;gap:6px">${slots}</div>
    </div>`;
  }).join('');
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

function openRuneInsert(targetInvId, slot) {
  const r = window._jewelerData;
  if (!r) return;
  const runes = (r.inventory || []).filter(i => i.category === 'rune');
  if (!runes.length) { toast('Немає рун в інвентарі. Купи руни у ювеліра.', true); return; }

  const alreadyInserted = new Set((r.itemRunes || []).map(ir => ir.rune_inv_id));
  const available = runes.filter(ru => !alreadyInserted.has(ru.id));
  if (!available.length) { toast('Всі руни вже вставлені в предмети', true); return; }

  document.getElementById('rune-modal-title').textContent = `Вставити руну в слот ${slot + 1}`;
  document.getElementById('rune-modal-body').innerHTML = available.map(ru => {
    const desc = JEWELER_INFO[ru.name] || '';
    return `<div class="item-card" onclick="confirmInsertRune(${targetInvId}, ${ru.id}, ${slot})" style="cursor:pointer">
      ${itemIcon(ru.name, 24)}
      <div class="item-info">
        <div class="item-name">${ru.name}</div>
        ${desc ? `<div style="font-size:11px;color:#aaa">${desc}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  document.getElementById('rune-modal').style.display = 'flex';
}

function closeRuneModal() {
  document.getElementById('rune-modal').style.display = 'none';
}

async function confirmInsertRune(targetInvId, runeInvId, slot) {
  closeRuneModal();
  try {
    await API.post('/api/jeweler/rune/insert', { invId: runeInvId, targetInvId, slot });
    toast(`${IC.ring(14)} Руну вставлено!`);
    loadJeweler();
  } catch(e) { toast(e.message, true); }
}

async function removeRune(runeInvId) {
  if (!confirm(`Вийняти руну? Коштуватиме 100 ${IC.greens(14)}`)) return;
  try {
    await API.post('/api/jeweler/rune/remove', { runeInvId });
    toast(`${IC.ring(14)} Руну вийнято!`);
    await refreshPlayer();
    loadJeweler();
  } catch(e) { toast(e.message, true); }
}

// ─── ALCHEMIST ────────────────────────────────────────────────────────────────
function potionEffectDesc(p) {
  const rounds = p.effect_rounds;
  const val = p.effect_value;
  const m = {
    power:        `+${val} мощі (${rounds} боїв)`,
    endurance:    `+${val} стійкості (${rounds} боїв)`,
    speed:        `+${val} швидкості (${rounds} боїв)`,
    accuracy:     `+${val} точності (${rounds} боїв)`,
    heal:         `Лікує ${val}% HP миттєво`,
    harvest:      `+${val}% до врожаю (24год)`,
    damage_reduce:`-${val}% отриманих пошкоджень (${rounds} боїв)`,
  };
  return m[p.effect_type] || '';
}

async function loadAlchemist() {
  const el = document.getElementById('alchemist-content');
  if (!el) return;
  el.innerHTML = '<p class="text-muted text-center">Завантаження...</p>';
  try {
    const r = await API.get('/api/alchemist');
    const myIng  = r.ingredients  || [];
    const invMap = r.invIngMap     || {};
    const activeCount = (r.activePotions || []).length;

    function ingHave(ing) {
      if (ing.src === 'plants') {
        const row = myIng.find(i => i.ingredient_name === ing.name);
        return row ? row.quantity : 0;
      }
      return invMap[ing.name] || 0;
    }

    el.innerHTML = `
      <div class="category-tabs">
        <button class="cat-tab active" onclick="showAlchTab('buy',this)">Купити</button>
        <button class="cat-tab" onclick="showAlchTab('craft',this)">Крафт</button>
        <button class="cat-tab" onclick="showAlchTab('ingredients',this)">Склад</button>
        <button class="cat-tab" onclick="showAlchTab('active',this)">Активні${activeCount > 0 ? ` (${activeCount})` : ''}</button>
      </div>

      <div id="alch-buy">
        ${r.potions.map(p => `<div class="item-card">
          ${itemIcon(p.name, 28)}
          <div class="item-info">
            <div class="item-name">${p.name}</div>
            <div class="item-bonuses">${potionEffectDesc(p)}</div>
            <div class="text-muted">Рів.${p.min_level}+</div>
          </div>
          <div>${IC.greens(13)}${fmtNum(p.price)} <button class="btn btn-green btn-sm" onclick="buyAlchPotion(${p.id})">Купити</button></div>
        </div>`).join('') || '<p class="text-muted">Немає</p>'}
      </div>

      <div id="alch-craft" style="display:none">
        ${r.recipes.map(rc => {
          const hasAll = rc.ingredients.every(ing => ingHave(ing) >= ing.qty);
          const ingList = rc.ingredients.map(ing => {
            const have = ingHave(ing);
            const ok   = have >= ing.qty;
            const icon = ing.src === 'plants' ? `${IC.greens(14)}` : IC.inventory(14);
            return `<span style="color:${ok ? '#2d7a2d' : '#c0392b'}">${icon}${ing.name}×${ing.qty}(є:${have})</span>`;
          }).join(' ');
          const pItem = r.potions.find(p => p.name === rc.potion_name);
          return `<div class="item-card">
            <div class="item-info" style="flex:1">
              <div class="item-name">${rc.potion_name}</div>
              ${pItem ? `<div class="text-muted" style="font-size:12px">${potionEffectDesc(pItem)}</div>` : ''}
              <div style="font-size:11px;margin-top:3px">${ingList}</div>
            </div>
            <button class="btn ${hasAll ? 'btn-green' : 'btn-gray'} btn-sm"
              ${hasAll ? `onclick="craftPotion(${rc.id})"` : 'disabled'}>Зварити</button>
          </div>`;
        }).join('') || '<p class="text-muted">Немає рецептів</p>'}
      </div>

      <div id="alch-ingredients" style="display:none">
        <div style="color:#888;font-size:12px;margin-bottom:8px">Рослини збираються з огороду автоматично</div>
        ${myIng.filter(i => i.quantity > 0).map(i => `
          <div class="flex-between" style="padding:6px 0;border-bottom:1px solid #eee">
            <span>${IC.greens(14)} ${i.ingredient_name}</span><b>×${i.quantity}</b>
          </div>`).join('') || '<p class="text-muted">Рослинних інгредієнтів немає — збирай урожай!</p>'}
        ${(r.invPotions || []).length > 0 ? `
          <div style="margin-top:14px;margin-bottom:6px;font-weight:600">${IC.pill(14)} Зілля в інвентарі:</div>
          ${(r.invPotions || []).map(p => `
            <div class="item-card">
              ${itemIcon(p.name, 24)}
              <div class="item-info" style="flex:1">
                <div class="item-name">${p.name}</div>
                <div class="text-muted" style="font-size:12px">${potionEffectDesc(p)}</div>
              </div>
              <button class="btn btn-blue btn-sm" onclick="usePotion(${p.inv_id})">Використати</button>
            </div>`).join('')}` : ''}
      </div>

      <div id="alch-active" style="display:none">
        ${(r.activePotions || []).length === 0
          ? '<p class="text-muted">Активних зіль немає</p>'
          : (r.activePotions || []).map(p => {
            const remains = p.battles_left != null
              ? `Залишилось боїв: <b>${p.battles_left}</b>`
              : `До: <b>${kyivDateTime(p.expires_at)}</b>`;
            const typeIcon = { power:`${IC.swords(14)}`, endurance:`${IC.shield(14)}`, speed:`${IC.lightning(14)}`, accuracy:`${IC.accuracy(14)}`, harvest:`${IC.wheat(14)}`, damage_reduce:`${IC.shield(14)}` }[p.effect_type] || `${IC.pill(14)}`;
            return `<div class="item-card">
              <span style="font-size:22px">${typeIcon}</span>
              <div class="item-info" style="flex:1">
                <div class="item-name">${p.potion_name}</div>
                <div class="text-muted">${potionEffectDesc(p)}</div>
                <div style="font-size:12px;color:#555">${remains}</div>
              </div>
            </div>`;
          }).join('')}
      </div>`;
  } catch(e) { toast(e.message, true); }
}

function showAlchTab(tab, btn) {
  ['buy','craft','ingredients','active'].forEach(t => {
    const el = document.getElementById('alch-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.category-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function showConfirmModal(title, body, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-body').innerHTML = body;
  const okBtn = document.getElementById('confirm-modal-ok');
  okBtn.onclick = () => { closeConfirmModal(); onConfirm(); };
  document.getElementById('confirm-modal').style.display = 'flex';
}
function closeConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

async function usePotion(invId, name, desc) {
  if (name) {
    showConfirmModal(
      'Використати зілля?',
      `<b>${name}</b><br><span style="color:#555">${desc || ''}</span>`,
      () => _doUsePotion(invId)
    );
  } else {
    await _doUsePotion(invId);
  }
}
async function _doUsePotion(invId) {
  try {
    const r = await API.post('/api/alchemist/use/' + invId);
    toast(r.message || 'Зілля використано!');
    await refreshPlayer();
    if (document.getElementById('page-inventory')?.classList.contains('active')) loadInventory();
    else loadAlchemist();
  } catch(e) { toast(e.message, true); }
}

async function discardItem(invId, name, hasRunes) {
  const warn = hasRunes ? '<br><span style="color:#e53935">${IC.warn(14)} Руни у цьому предметі будуть знищені!</span>' : '';
  showConfirmModal(
    'Викинути предмет?',
    `Викинути <b>${name}</b>? Отримаєш 2–5% від базової ціни зеленню.${warn}`,
    async () => {
      try {
        const r = await API.post(`/api/profile/discard/${invId}`);
        toast(`Викинуто! +${r.greens} ${IC.greens(14)}`);
        await refreshPlayer();
        loadInventory();
      } catch(e) { toast(e.message, true); }
    }
  );
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
  smithTab('enchant', document.querySelector('#smith-tabs .cat-tab'));
}

function smithTab(tab, btnEl) {
  document.querySelectorAll('#smith-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  document.getElementById('smith-enchant').style.display   = tab === 'enchant'   ? '' : 'none';
  document.getElementById('smith-rings').style.display     = tab === 'rings'     ? '' : 'none';
  document.getElementById('smith-talismans').style.display = tab === 'talismans' ? '' : 'none';
  if (tab === 'enchant')   loadEnchantItems();
  if (tab === 'rings')     loadSmithRings();
  if (tab === 'talismans') loadSmithTalismans();
}

async function loadSmithRings() {
  const el = document.getElementById('smith-rings-list');
  if (!el) return;
  try {
    const { rings } = await API.get('/api/rings/owned');
    if (!rings.length) { el.innerHTML = '<p class="text-muted text-center">У вас немає кілець</p>'; return; }
    el.innerHTML = rings.map(r => {
      const currIcon = r.currency === 'gold' ? IC.gold(13) : IC.greens(13);
      return `<div class="item-card">
        ${IC.ring(28)}
        <div class="item-info">
          <div class="item-name">${r.name} <span style="color:#e65100">+${r.level}</span></div>
          <div class="text-muted" style="font-size:12px">${r.statLabel}</div>
          ${!r.maxed ? `<div style="font-size:11px;color:#888">${currIcon} ${fmtNum(r.nextCost)}</div>` : ''}
        </div>
        ${r.maxed
          ? `<span style="color:#e65100;font-size:12px;white-space:nowrap">${IC.star(12)} Макс</span>`
          : `<button class="btn btn-orange btn-sm" onclick="smithUpgradeRing(${r.inv_id})">${IC.levelup(13)} +1</button>`}
      </div>`;
    }).join('');
  } catch(e) { toast(e.message, true); }
}

async function smithUpgradeRing(invId) {
  try {
    const r = await API.post(`/api/rings/upgrade/${invId}`);
    toast(`${IC.ring(14)} Кільце покращено до рівня ${r.newLevel}!`);
    await refreshPlayer();
    loadSmithRings();
  } catch(e) { toast(e.message, true); }
}

async function loadSmithTalismans() {
  const el = document.getElementById('smith-talismans-list');
  if (!el) return;
  try {
    const { talismans } = await API.get('/api/talismans/owned');
    if (!talismans.length) { el.innerHTML = '<p class="text-muted text-center">У вас немає талісманів</p>'; return; }
    el.innerHTML = talismans.map(t => {
      const currIcon = t.currency === 'gold' ? IC.gold(13) : IC.greens(13);
      return `<div class="item-card">
        ${IC.talisman(28)}
        <div class="item-info">
          <div class="item-name">${t.name} <span style="color:#e65100">+${t.level}</span></div>
          <div class="text-muted" style="font-size:12px">${t.statLabel}</div>
          ${!t.maxed ? `<div style="font-size:11px;color:#888">${currIcon} ${fmtNum(t.nextCost)}</div>` : ''}
        </div>
        ${t.maxed
          ? `<span style="color:#e65100;font-size:12px;white-space:nowrap">${IC.star(12)} Макс</span>`
          : `<button class="btn btn-orange btn-sm" onclick="smithUpgradeTalisman(${t.inv_id})">${IC.levelup(13)} +1</button>`}
      </div>`;
    }).join('');
  } catch(e) { toast(e.message, true); }
}

async function smithUpgradeTalisman(invId) {
  try {
    const r = await API.post(`/api/talismans/upgrade/${invId}`);
    toast(`${IC.talisman(14)} Талісман покращено до рівня ${r.newLevel}! Бонус: +${r.newBonus}%`);
    await refreshPlayer();
    loadSmithTalismans();
  } catch(e) { toast(e.message, true); }
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
        <div class="item-name">${i.name}${i.upgrade_level ? ` <span style="color:#e65100">+${i.upgrade_level}</span>` : ''}</div>
        <div class="text-muted">${bonusStr(i)}</div>
      </div>
      <button class="btn btn-orange btn-sm" onclick="enchantItem(${i.id})">${IC.levelup(13)} Зачар.</button>
    </div>`).join('') || '<p class="text-muted">Немає предметів для зачарування</p>';
}

async function enchantItem(invId) {
  try {
    const info = await API.get('/api/village/enchant/info/' + invId);
    if (info.currentLevel >= info.maxLevel) { toast('Максимальне зачарування!'); return; }

    let warnParts = [];
    if (info.nextChance < 100) {
      warnParts.push(`${IC.warn(14)} Шанс провалу: ${100 - info.nextChance}%! При провалі зачарування скидається до 0.`);
    }
    if (info.nextChance < 100 && info.hasRunes) {
      warnParts.push(`${IC.skull(14)} При провалі всі руни в предметі будуть ЗНИЩЕНІ!`);
    }
    const warnText = warnParts.length ? '\n\n' + warnParts.join('\n') : '';
    if (!confirm(`Зачарувати до +${info.currentLevel+1}?\nВартість: ${info.nextCost} золота${warnText}`)) return;

    const r = await API.post('/api/village/enchant/' + invId);
    if (r.success) {
      const el = document.getElementById('enchant-items');
      if (el) el.style.animation = 'enchant-success 0.6s ease';
      setTimeout(() => { if (el) el.style.animation = ''; }, 600);
      toast(`${IC.sparkle(14)} Зачарування успішне! +${r.newLevel}`);
    } else {
      const el = document.getElementById('enchant-items');
      if (el) el.style.animation = 'enchant-fail 0.6s ease';
      setTimeout(() => { if (el) el.style.animation = ''; }, 600);
      const runeMsg = r.runesDestroyed > 0 ? ` Знищено рун: ${r.runesDestroyed}.` : '';
      toast(`${IC.skull(14)} Провал! Зачарування скинулось до 0.${runeMsg}`, true);
    }
    await refreshPlayer();
    loadEnchantItems();
    if (marketData) { await loadMarket(); }
  } catch(e) { toast(e.message, true); }
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────
const INV_TABS = [
  { key: 'weapon',      label: `${IC.swords(14)} Зброя`,       cats: ['weapon'] },
  { key: 'armor',       label: `${IC.shield(14)} Броня`,        cats: ['armor','helmet','shield'] },
  { key: 'potion',      label: `${IC.pill(14)} Зілля`,         cats: ['potion'] },
  { key: 'ingredients', label: `${IC.greens(14)} Інгредієнти`,   cats: null },
  { key: 'accessory',   label: `${IC.ring(14)} Аксесуари`,     cats: ['ring','talisman','rune'] },
  { key: 'other',       label: `${IC.package(14)} Інше`,          cats: [] },
];
const KNOWN_CATS = ['weapon','armor','helmet','shield','potion','ring','talisman','rune'];

let _invData = null;

async function loadInventory() {
  try {
    _invData = await API.get('/api/profile/inventory');
    const slotsEl = document.getElementById('inv-slots-info');
    if (slotsEl) slotsEl.textContent = `${_invData.used} / ${_invData.slots} слотів`;

    const tabsEl = document.getElementById('inv-tabs');
    tabsEl.innerHTML = INV_TABS.map((t, i) =>
      `<button class="cat-tab${i===0?' active':''}" onclick="showInvTab('${t.key}',this)">${t.label}</button>`
    ).join('');

    showInvTab('weapon', tabsEl.querySelector('.cat-tab'));
  } catch(e) { toast(e.message, true); }
}

function showInvTab(key, btn) {
  document.querySelectorAll('#inv-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const tab = INV_TABS.find(t => t.key === key);
  const el = document.getElementById('inventory-content');
  if (!_invData) return;

  // Ingredients tab — from separate table
  if (key === 'ingredients') {
    const ing = _invData.ingredients || [];
    el.innerHTML = ing.length
      ? ing.map(i => `<div class="flex-between" style="padding:7px 0;border-bottom:1px solid #eee">
          <span>${IC.greens(14)} ${i.ingredient_name}</span><b>×${i.quantity}</b>
        </div>`).join('')
      : '<p class="text-muted">Інгредієнтів немає — видобувай у шахтах та збирай врожай</p>';
    el.innerHTML += renderInvExpand();
    return;
  }

  let items;
  if (key === 'other') {
    items = (_invData.items || []).filter(i => !KNOWN_CATS.includes(i.category));
  } else {
    items = (_invData.items || []).filter(i => tab.cats.includes(i.category));
  }

  el.innerHTML = (items.length
    ? items.map(i => renderInvItem(i, _invData.itemRunes || [])).join('')
    : `<p class="text-muted">Нічого немає</p>`)
    + renderInvExpand();
}

function renderInvExpand() {
  if (!_invData) return '';
  const slots = _invData.slots || 50;
  const pct = Math.round(_invData.used / slots * 100);
  if (slots >= 200) return `<div style="margin-top:12px;font-size:12px;color:#888;text-align:center">Слоти: ${_invData.used}/${slots} — максимум досягнуто</div>`;
  return `<div style="margin-top:12px;border-top:1px solid #eee;padding-top:10px">
    <div style="font-size:12px;color:#888;margin-bottom:6px">Слоти: ${_invData.used}/${slots} (${pct}%)</div>
    <div style="background:#eee;border-radius:4px;height:6px;margin-bottom:8px">
      <div style="background:#ff8f00;height:6px;border-radius:4px;width:${Math.min(100,pct)}%"></div>
    </div>
    <button class="btn btn-orange btn-sm" onclick="expandInventory()">+10 слотів — 100 ${IC.gold(14)} золота</button>
  </div>`;
}

function renderInvItem(item, allRunes) {
  const myRunes = allRunes.filter(r => r.inv_id === item.id);
  const maxRunes = item.category === 'weapon' || item.category === 'armor' ? 3
    : item.category === 'helmet' || item.category === 'shield' ? 2 : 0;
  const enchant = item.upgrade_level || 0;

  const stats = [];
  if (item.power_bonus > 0)     stats.push(`${IC.lightning(14)}+${item.power_bonus + enchant * 2}`);
  if (item.endurance_bonus > 0) stats.push(`${IC.shield(14)}+${item.endurance_bonus + enchant * 2}`);
  if (item.speed_bonus > 0)     stats.push(`${IC.speed(14)}+${item.speed_bonus}`);
  if (item.accuracy_bonus > 0)  stats.push(`${IC.accuracy(14)}+${item.accuracy_bonus}`);

  const runeDots = maxRunes > 0 ? `<div class="rune-dots" style="margin-top:4px">${
    Array.from({length: maxRunes}, (_,i) =>
      `<span class="rune-dot${i < myRunes.length ? ' filled' : ''}"></span>`
    ).join('')
  }</div>` : '';

  const equippable = ['weapon','armor','helmet','shield','ring','talisman'].includes(item.category);
  const equipBtn = equippable
    ? `<button class="btn ${item.is_equipped ? 'btn-gray' : 'btn-orange'} btn-sm"
         onclick="${item.is_equipped ? `unequipItem(${item.id})` : `equipItem(${item.id})`}">
         ${item.is_equipped ? 'Зняти' : 'Одягнути'}
       </button>`
    : '';

  const potionDesc = item.category === 'potion' ? potionEffectDesc(item) : '';
  const useBtn = item.category === 'potion'
    ? `<button class="btn btn-blue btn-sm" onclick="usePotion(${item.id},'${item.name.replace(/'/g,"\\'")}',' ${potionDesc.replace(/'/g,"\\'")}')">Використати</button>`
    : '';

  const enchantBtn = ['weapon','armor','helmet','shield'].includes(item.category)
    ? `<button class="btn btn-gray btn-sm" onclick="navigate('village')">${IC.pickaxe(14)} Коваль</button>`
    : '';

  const hasRunes = myRunes.length > 0;
  const onAuction = item.is_on_auction;
  const sellBtn = !item.is_equipped && !onAuction && item.category !== 'potion'
    ? `<button class="btn btn-blue btn-sm" onclick="openAuctionListModal(${item.id})">${IC.shop(14)} Продати</button>`
    : onAuction ? `<span style="font-size:12px;color:#ff8f00">На аукціоні</span>` : '';

  return `<div class="inv-item-card${item.is_equipped ? ' is-equipped' : ''}${onAuction ? ' on-auction' : ''}">
    <div style="display:flex;gap:8px;align-items:flex-start">
      <span>${itemIcon(item.name, 32)}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:14px">${item.name}${item.is_equipped ? ' <span class="inv-eq-badge">Одягнуто</span>' : ''}</div>
        <div style="font-size:11px;color:#888">Рів.${item.min_level || 1}+${enchant > 0 ? ` · ${IC.sparkle(14)} +${enchant}` : ''}</div>
        ${stats.length ? `<div style="font-size:12px;color:#555;margin-top:2px">${stats.join(' ')}</div>` : ''}
        ${potionDesc ? `<div style="font-size:12px;color:#0097a7;margin-top:2px">${potionDesc}</div>` : ''}
        ${runeDots}
      </div>
    </div>
    <div class="inv-item-actions">
      ${equipBtn}${useBtn}${enchantBtn}${sellBtn}
      <button class="btn btn-red btn-sm" ${item.is_equipped || onAuction ? 'disabled' : ''}
        onclick="discardItem(${item.id},'${item.name.replace(/'/g,"\\'")}',${hasRunes})">Викинути</button>
    </div>
  </div>`;
}

async function expandInventory() {
  try {
    const r = await API.post('/api/profile/expand-inventory');
    toast(`Розширено до ${r.newSlots} слотів!`);
    await refreshPlayer();
    loadInventory();
  } catch(e) { toast(e.message, true); }
}

// ─── AUCTION ─────────────────────────────────────────────────────────────────
const AUC_ENCHANT_MULT = [1.0, 1.1, 1.25, 1.5, 2.0, 3.0];
let _aucListInvId = null;
let _aucListBasePrice = 0;
let _aucListEnchant = 0;

function loadAuction() {
  showAuctionTab('browse', document.querySelector('#auction-tabs .cat-tab'));
}

function showAuctionTab(tab, btn) {
  document.querySelectorAll('#auction-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('auction-browse').style.display = tab === 'browse' ? '' : 'none';
  document.getElementById('auction-my').style.display    = tab === 'my'     ? '' : 'none';
  if (tab === 'browse') loadAuctionLots();
  if (tab === 'my')     loadMyLots();
}

async function loadAuctionLots() {
  const cat      = document.getElementById('auc-filter-cat')?.value || '';
  const currency = document.getElementById('auc-filter-currency')?.value || '';
  const sort     = document.getElementById('auc-filter-sort')?.value || 'newest';
  const el = document.getElementById('auction-lots-list');
  el.innerHTML = '<p class="text-muted">Завантаження...</p>';
  try {
    const params = new URLSearchParams({ sort });
    if (cat)      params.set('category', cat);
    if (currency) params.set('currency', currency);
    const r = await API.get('/api/auction?' + params);
    el.innerHTML = r.lots.length
      ? r.lots.map(renderAucLot).join('')
      : '<p class="text-muted">Лотів немає</p>';
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadMyLots() {
  const el = document.getElementById('auction-my-list');
  el.innerHTML = '<p class="text-muted">Завантаження...</p>';
  try {
    const r = await API.get('/api/auction/my');
    el.innerHTML = r.lots.length
      ? r.lots.map(lot => `
          <div class="inv-item-card">
            <div style="display:flex;gap:8px;align-items:center">
              <span>${itemIcon(lot.item_name, 28)}</span>
              <div style="flex:1">
                <div style="font-weight:600">${lot.item_name}${lot.enchant_level > 0 ? ` ${IC.sparkle(14)}+${lot.enchant_level}` : ''}</div>
                <div style="font-size:12px;color:#888">Рів.${lot.min_level}+ · ${aucStats(lot)}</div>
                <div style="font-size:13px;color:#2e7d32;font-weight:600">${fmtNum(lot.price)} ${lot.currency === 'gold' ? IC.gold(13) : lot.currency === 'diamonds' ? IC.diamonds(13) : IC.greens(13)}</div>
                <div style="font-size:11px;color:#999">До: ${kyivDate(lot.expires_at)}</div>
              </div>
            </div>
            <div class="inv-item-actions">
              <button class="btn btn-red btn-sm" onclick="cancelLot(${lot.id})">Зняти з аукціону</button>
            </div>
          </div>`).join('')
      : '<p class="text-muted">У вас немає активних лотів</p>';
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

function aucStats(lot) {
  const parts = [];
  if (lot.power_bonus > 0)     parts.push(`${IC.lightning(14)}+${lot.power_bonus}`);
  if (lot.endurance_bonus > 0) parts.push(`${IC.shield(14)}+${lot.endurance_bonus}`);
  if (lot.speed_bonus > 0)     parts.push(`${IC.speed(14)}+${lot.speed_bonus}`);
  if (lot.accuracy_bonus > 0)  parts.push(`${IC.accuracy(14)}+${lot.accuracy_bonus}`);
  return parts.join(' ') || '—';
}

function renderAucLot(lot) {
  const curr = lot.currency === 'gold' ? IC.gold(13) : lot.currency === 'diamonds' ? IC.diamonds(13) : IC.greens(13);
  return `<div class="inv-item-card">
    <div style="display:flex;gap:8px;align-items:center">
      <span>${itemIcon(lot.item_name, 28)}</span>
      <div style="flex:1">
        <div style="font-weight:600">${lot.item_name}${lot.enchant_level > 0 ? ` ${IC.sparkle(14)}+${lot.enchant_level}` : ''}</div>
        <div style="font-size:12px;color:#888">Рів.${lot.min_level}+ · ${aucStats(lot)}</div>
        <div style="font-size:13px;color:#2e7d32;font-weight:600">${fmtNum(lot.price)} ${curr}</div>
        <div style="font-size:11px;color:#999">Продавець: ${lot.seller_name}</div>
      </div>
    </div>
    <div class="inv-item-actions">
      <button class="btn btn-orange btn-sm" onclick="buyLot(${lot.id},'${lot.item_name.replace(/'/g,"\\'")}',${lot.price},'${lot.currency}')">Купити</button>
    </div>
  </div>`;
}

async function buyLot(lotId, name, price, currency) {
  const curr = currency === 'gold' ? `${IC.gold(14)} золота` : currency === 'diamonds' ? `${IC.diamonds(14)} алмазів` : `${IC.greens(14)} зелені`;
  showConfirmModal(
    'Купити лот?',
    `Купити <b>${name}</b> за <b>${fmtNum(price)} ${curr}</b>?`,
    async () => {
      try {
        const r = await API.post(`/api/auction/buy/${lotId}`);
        toast(`Куплено! Комісія: ${r.commission}`);
        await refreshPlayer();
        loadAuctionLots();
      } catch(e) { toast(e.message, true); }
    }
  );
}

async function cancelLot(lotId) {
  showConfirmModal('Зняти лот?', 'Предмет повернеться в інвентар.', async () => {
    try {
      await API.post(`/api/auction/cancel/${lotId}`);
      toast('Лот знято');
      loadMyLots();
    } catch(e) { toast(e.message, true); }
  });
}

function openAuctionListModal(invId) {
  const item = (_invData?.items || []).find(i => i.id === invId);
  if (!item) return;
  _aucListInvId    = invId;
  _aucListBasePrice = item.price || 0;
  _aucListEnchant  = item.upgrade_level || 0;

  document.getElementById('auction-list-item-info').innerHTML =
    `<b>${item.name}</b>${_aucListEnchant > 0 ? ` ${IC.sparkle(14)}+${_aucListEnchant}` : ''}<br>
     <span style="font-size:12px;color:#888">${aucStats(item)}</span>`;
  document.getElementById('auction-list-currency').value = 'greens';
  updateAucMinPrice();
  document.getElementById('auction-list-modal').style.display = 'flex';
}

function closeAuctionListModal() {
  document.getElementById('auction-list-modal').style.display = 'none';
  _aucListInvId = null;
}

function updateAucMinPrice() {
  const mult = AUC_ENCHANT_MULT[_aucListEnchant] || 1;
  const min  = Math.floor(_aucListBasePrice * mult);
  document.getElementById('auc-min-price-hint').textContent = min > 0 ? `(мін. ${fmtNum(min)})` : '';
  const inp = document.getElementById('auction-list-price');
  if (!inp.value || parseInt(inp.value) < min) inp.value = min || 1;
}

async function confirmListItem() {
  const currency = document.getElementById('auction-list-currency').value;
  const price    = parseInt(document.getElementById('auction-list-price').value);
  if (!_aucListInvId || !price) return;
  try {
    await API.post('/api/auction/list', { invId: _aucListInvId, currency, price });
    toast('Виставлено на аукціон!');
    closeAuctionListModal();
    loadInventory();
  } catch(e) { toast(e.message, true); }
}

// ─── DRAGON ──────────────────────────────────────────────────────────────────

function showDragonTab(tab, btn) {
  ['battle','leaderboard','history'].forEach(t => {
    document.getElementById(`dragon-${t}`).style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('#dragon-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (tab === 'leaderboard') loadDragonLeaderboard();
  if (tab === 'history')     loadDragonHistory();
}

function _dragonClearTimers() {
  if (_dragonTimerInterval)     { clearTimeout(_dragonTimerInterval);      _dragonTimerInterval     = null; }
  if (_dragonAttackCdInterval)  { clearInterval(_dragonAttackCdInterval);  _dragonAttackCdInterval  = null; }
  if (_dragonAttackWinInterval) { clearInterval(_dragonAttackWinInterval); _dragonAttackWinInterval = null; }
  _dragonAttackState = 'idle';
}

async function loadDragon() {
  try {
    const r = await API.get('/api/dragon/current');
    _dragonClearTimers();
    if (r.event) {
      renderDragonActive(r);
    } else {
      renderDragonInactive(r.lastEvent);
    }
  } catch(e) { toast(e.message, true); }
}

function renderDragonActive(r) {
  const ev = r.event;
  const hpPct = Math.max(0, (ev.hp_current / ev.hp_max) * 100).toFixed(1);
  const hpColor = hpPct > 60 ? '#e53935' : hpPct > 30 ? '#ff8f00' : '#7b1fa2';

  const el = document.getElementById('dragon-battle');
  el.innerHTML = `
    <div class="dragon-event-card">
      <div class="dragon-avatar">${IC.dragon(28)}</div>
      <div class="dragon-name">Стародавній Дракон</div>
      <div class="dragon-hp-wrap">
        <div class="dragon-hp-bar-bg">
          <div class="dragon-hp-bar" id="dragon-hp-bar" style="width:${hpPct}%;background:${hpColor}"></div>
        </div>
        <div class="dragon-hp-label" id="dragon-hp-label">${fmtNum(ev.hp_current)} / ${fmtNum(ev.hp_max)}</div>
      </div>
      <div class="dragon-my-stats">
        <span>Мій урон: <strong id="dragon-my-dmg">${fmtNum(r.myDamage)}</strong></span>
        <span>Ударів: <strong>${r.myHits}</strong></span>
        <span>Учасників: <strong>${r.participants}</strong></span>
      </div>
      <div class="dragon-timer" id="dragon-timer" style="font-size:14px;margin:6px 0"></div>
      <button class="btn btn-full dragon-attack-btn" id="dragon-attack-btn" onclick="attackDragon()" disabled>${IC.timer(14)} Зачекай...</button>
      <div style="text-align:center;font-size:12px;color:#aaa;margin-top:4px">Подія закінчується о <strong>${new Date(ev.ends_at).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})}</strong></div>
      <div class="dragon-top5" id="dragon-top5">
        ${r.top5.map((p,i) => `<div class="dragon-top-row"><span>#${i+1} ${plink(p.player_id, p.username)}</span><span>${fmtNum(p.damage_dealt)}</span></div>`).join('')}
      </div>
    </div>`;

  // Schedule loadDragon once when event ends (single timeout, no repeating interval)
  const msLeft = new Date(ev.ends_at).getTime() - Date.now();
  if (msLeft <= 0) { loadDragon(); return; }
  _dragonTimerInterval = setTimeout(() => {
    _dragonTimerInterval = null;
    _dragonClearTimers();
    loadDragon();
  }, msLeft);

  _enableDragonAttack();
}

function renderDragonInactive(lastEvent) {
  const el = document.getElementById('dragon-battle');
  if (!lastEvent) {
    el.innerHTML = `<div class="text-center" style="padding:24px">
      <div style="font-size:48px">${IC.dragon(28)}</div>
      <p style="color:#888">Дракон ще не нападав.<br>Наступні атаки о <strong>10:00</strong> та <strong>22:00</strong>.</p>
    </div>`;
    return;
  }
  const killed = lastEvent.is_killed;
  el.innerHTML = `<div style="padding:8px">
    <div class="dragon-ended-card">
      <div style="font-size:32px;text-align:center">${killed ? `${IC.skull(14)}` : ''}</div>
      <div style="text-align:center;font-weight:700;margin-bottom:8px">${killed ? 'Дракона переможено!' : 'Дракон втік!'}</div>
      <div class="dragon-ended-stats">
        <span>Учасників: <strong>${lastEvent.participant_count || 0}</strong></span>
        <span>Урон: <strong>${fmtNum(lastEvent.total_damage)}</strong></span>
      </div>
      ${lastEvent.my_damage ? `<div class="dragon-ended-reward">
        <span>Ваш урон: <b>${fmtNum(lastEvent.my_damage)}</b></span>
        ${lastEvent.reward_green ? `<span>${IC.greens(14)} ${fmtNum(lastEvent.reward_green)}</span>` : ''}
        ${lastEvent.reward_exp   ? `<span>${IC.sparkle(14)} ${fmtNum(lastEvent.reward_exp)} exp</span>` : ''}
        ${lastEvent.rare_drop    ? `<span>${IC.gift(14)} ${lastEvent.rare_drop}</span>` : ''}
      </div>` : ''}
    </div>
    <p class="text-muted text-center" style="margin-top:12px">Наступна атака о <strong>10:00</strong> або <strong>22:00</strong></p>
  </div>`;
}

function _enableDragonAttack() {
  if (_dragonAttackCdInterval)  { clearInterval(_dragonAttackCdInterval);  _dragonAttackCdInterval  = null; }
  if (_dragonAttackWinInterval) { clearInterval(_dragonAttackWinInterval); _dragonAttackWinInterval = null; }
  _dragonAttackState = 'ready';
  const timer = document.getElementById('dragon-timer');
  if (timer) timer.textContent = '';
  const btn = document.getElementById('dragon-attack-btn');
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = `${IC.swords(14)} АТАКУВАТИ!`;
  btn.style.background = '#c62828';
  btn.style.color = '#fff';
  btn.style.animation = '';
}

function startDragonAttackTimer() {
  if (_dragonAttackCdInterval)  { clearInterval(_dragonAttackCdInterval);  _dragonAttackCdInterval  = null; }
  if (_dragonAttackWinInterval) { clearInterval(_dragonAttackWinInterval); _dragonAttackWinInterval = null; }
  _dragonAttackState = 'waiting';
  _dragonAttackCd    = 30 + Math.floor(Math.random() * 91); // 30–120s
  const btn = document.getElementById('dragon-attack-btn');
  if (btn) {
    btn.disabled = true;
    btn.style.background = '#9e9e9e';
    btn.style.color = '#fff';
    btn.style.animation = '';
    btn.textContent = 'Перезаряджання...';
  }
  const timer = document.getElementById('dragon-timer');
  if (timer) timer.innerHTML = `${IC.timer(14)} Наступний удар через: ${_dragonAttackCd}с`;
  _dragonAttackCdInterval = setInterval(() => {
    _dragonAttackCd--;
    if (_dragonAttackCd <= 0) {
      clearInterval(_dragonAttackCdInterval); _dragonAttackCdInterval = null;
      _enableDragonAttack();
      return;
    }
    const t = document.getElementById(`dragon-timer`);
    if (t) t.innerHTML = `${IC.timer(14)} Наступний удар через: ${_dragonAttackCd}с`;
  }, 1000);
}

async function attackDragon() {
  if (_dragonAttackState !== 'ready') return;
  if (_dragonAttackWinInterval) { clearInterval(_dragonAttackWinInterval); _dragonAttackWinInterval = null; }
  _dragonAttackState = 'attacking';
  const btn = document.getElementById('dragon-attack-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = `${IC.swords(14)} Атакую...`; btn.style.background = '#e53935'; }
  try {
    const r = await API.post('/api/dragon/attack');
    const critTxt = r.isCrit ? ' ${IC.hit(14)} КРИТ!' : '';
    toast(`${IC.swords(14)} Урон: ${fmtNum(r.damage)}${critTxt} | Контратака: -${fmtNum(r.counterDmg)} HP`);
    // Update HP bar immediately from REST response (no need to wait for 5-sec broadcast)
    const bar = document.getElementById('dragon-hp-bar');
    const lbl = document.getElementById('dragon-hp-label');
    if (bar) bar.style.width = `${Math.max(0, (r.newDragonHp / r.hpMax) * 100)}%`;
    if (lbl) lbl.textContent = `${fmtNum(r.newDragonHp)} / ${fmtNum(r.hpMax)}`;
    const myDmgEl = document.getElementById('dragon-my-dmg');
    if (myDmgEl) myDmgEl.textContent = fmtNum(parseInt(myDmgEl.textContent.replace(/\s/g,'')) + r.damage);
    if (r.isKilled) { toast(`${IC.dragon(28)} Ти вбив дракона! Фінальний удар твій!`); }
    await refreshPlayer();
    if (r.isKilled) { loadDragon(); return; }
  } catch(e) {
    toast(e.message, true);
    if (e.message.includes('вже переможений') || e.message.includes('Активної')) { loadDragon(); return; }
  }
  startDragonAttackTimer();
}

async function loadDragonLeaderboard() {
  const el = document.getElementById('dragon-leaderboard');
  try {
    const { leaderboard } = await API.get('/api/dragon/leaderboard');
    if (!leaderboard.length) { el.innerHTML = '<p class="text-muted text-center">Поки нікого немає</p>'; return; }
    el.innerHTML = `<table class="dragon-lb-table">
      <thead><tr><th>#</th><th>Гравець</th><th>Боїв</th><th>Урон</th><th>${IC.greens(14)}</th></tr></thead>
      <tbody>${leaderboard.map((p,i) => `<tr>
        <td><strong>#${i+1}</strong></td>
        <td>${p.username}</td>
        <td>${p.battles}</td>
        <td>${fmtNum(p.total_damage)}</td>
        <td>${fmtNum(p.greens_earned)}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadDragonHistory() {
  const el = document.getElementById('dragon-history');
  try {
    const { history } = await API.get('/api/dragon/history');
    if (!history.length) { el.innerHTML = '<p class="text-muted text-center">Ви ще не брали участі</p>'; return; }
    el.innerHTML = history.map(h => `
      <div class="dragon-history-item">
        <div class="flex-between">
          <span>${h.is_killed ? `${IC.skull(14)} Переможено` : 'Втік'} · ${h.participants} уч.</span>
          <span class="text-muted" style="font-size:11px">${kyivDate(h.started_at)}</span>
        </div>
        ${h.my_damage ? `<div style="font-size:13px;margin-top:4px">
          Ваш урон: <b>${fmtNum(h.my_damage)}</b>
          ${h.reward_green ? `· ${IC.greens(14)} ${fmtNum(h.reward_green)}` : ''}
          ${h.rare_drop    ? `· ${IC.gift(14)} ${h.rare_drop}` : ''}
        </div>` : '<div style="font-size:12px;color:#aaa">Ви не брали участі</div>'}
      </div>`).join('');
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

// ─── INSECTS ─────────────────────────────────────────────────────────────────
function closeInsectNotif() {
  document.getElementById('insect-notif').style.display = 'none';
}

function openInsectFight() {
  closeInsectNotif();
  document.getElementById('insect-modal').style.display = 'flex';
  loadInsectFight();
}

function closeInsectModal() {
  document.getElementById('insect-modal').style.display = 'none';
}

let _insectFighting = false;

async function loadInsectFight() {
  const body = document.getElementById('insect-modal-body');
  try {
    const { attack, growingPlots } = await API.get('/api/insects/current');
    if (!attack) {
      body.innerHTML = `<p class="text-center" style="color:#666">Комах немає.<br>Твій огород у безпеці! ${IC.greens(14)}</p>
        <button class="btn btn-gray btn-full" onclick="closeInsectModal()">Закрити</button>`;
      return;
    }
    const hpPct  = Math.max(0, (attack.swarm_hp / attack.swarm_max_hp) * 100).toFixed(1);
    const endsAt = new Date(attack.ends_at).getTime();
    const left   = Math.max(0, endsAt - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    body.innerHTML = `
      <div style="text-align:center;font-size:36px;margin-bottom:4px">${IC.insect(14)}</div>
      <div style="font-weight:700;text-align:center;margin-bottom:8px">Рій комах (${growingPlots} грядок)</div>
      <div class="dragon-hp-bar-bg" style="margin-bottom:4px">
        <div class="dragon-hp-bar" style="width:${hpPct}%;background:#e65100"></div>
      </div>
      <div style="text-align:center;font-size:13px;color:#888;margin-bottom:6px">
        HP: ${fmtNum(attack.swarm_hp)} / ${fmtNum(attack.swarm_max_hp)}
      </div>
      <div style="text-align:center;color:#ff8f00;font-size:13px;margin-bottom:4px">${IC.timer(14)} ${m}хв ${s}с</div>
      <div style="text-align:center;font-size:12px;color:#c62828;margin-bottom:12px">
        ${IC.warn(14)} Якщо не відженеш — штраф -${attack.damage_penalty_pct}% до врожаю!
      </div>
      <button class="btn btn-full" style="background:#e65100;color:#fff;font-size:15px;padding:12px" onclick="fightInsect()" id="insect-fight-btn">${IC.insect(14)} Прогнати!</button>
    `;
  } catch(e) {
    body.innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

async function fightInsect() {
  if (_insectFighting) return;
  _insectFighting = true;
  const btn = document.getElementById('insect-fight-btn');
  if (btn) btn.disabled = true;
  try {
    const r = await API.post('/api/insects/fight');
    if (!r.isDefeated) {
      const hpPct = Math.max(0, (r.newHp / r.hpMax) * 100).toFixed(1);
      const body  = document.getElementById('insect-modal-body');
      const barEl = body?.querySelector('.dragon-hp-bar');
      const lblEl = body?.querySelector('[id="insect-hp-lbl"]');
      if (barEl) barEl.style.width = `${hpPct}%`;
      const lbls = body?.querySelectorAll('div');
      if (lbls) lbls.forEach(d => {
        if (d.textContent.startsWith('HP:')) d.textContent = `HP: ${fmtNum(r.newHp)} / ${fmtNum(r.hpMax)}`;
      });
      toast(`${IC.insect(14)} Урон по рою: ${r.damage}`);
    }
  } catch(e) {
    toast(e.message, true);
    if (e.message.includes('Немає')) loadInsectFight();
  } finally {
    _insectFighting = false;
    if (btn) btn.disabled = false;
  }
}

// ─── DAILY EVENT ─────────────────────────────────────────────────────────────
async function loadDaily() {
  const el = document.getElementById('daily-content');
  el.innerHTML = '<p class="text-muted text-center">Завантаження...</p>';
  try {
    const { event: ev, progress, wheelSpunToday } = await API.get('/api/daily/today');
    const titleEl = document.getElementById('daily-panel-title');

    if (ev.event_type === 'quest') {
      if (titleEl) titleEl.innerHTML = `${IC.clipboard(14)} Щоденний квест`;
      renderDailyQuest(el, ev, progress);
    } else if (ev.event_type === 'tournament') {
      if (titleEl) titleEl.innerHTML = `${IC.swords(14)} Щоденний турнір`;
      renderDailyTournament(el, ev, progress);
    } else {
      if (titleEl) titleEl.innerHTML = `${IC.slot(14)} Колесо Фортуни`;
      renderDailyWheel(el, ev, wheelSpunToday);
    }
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

function renderDailyQuest(el, ev, progress) {
  const q = ev.details;
  const cur = progress ? progress.progress : 0;
  const pct = Math.min(100, Math.round((cur / q.target) * 100));
  const completed = progress?.is_completed;
  const claimed   = progress?.reward_claimed;

  el.innerHTML = `
    <div class="daily-card">
      <div class="daily-type-badge">${IC.clipboard(14)} Квест від НПС</div>
      <div class="daily-task">${q.task}</div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="daily-progress-label">${cur} / ${q.target} (${pct}%)</div>
      <div class="daily-rewards">
        ${q.rewardGreen  ? `<span>${IC.greens(14)} ${q.rewardGreen}</span>`  : ''}
        ${q.rewardExp    ? `<span>${IC.sparkle(14)} ${q.rewardExp} exp</span>` : ''}
        ${q.rewardGold   ? `<span>${IC.gold(14)} ${q.rewardGold}</span>`   : ''}
        ${q.rewardGlory  ? `<span>${IC.star(14)} +${q.rewardGlory} слави</span>` : ''}
        <span>${IC.gift(14)} Випадковий предмет</span>
      </div>
      ${completed && !claimed
        ? `<button class="btn btn-green btn-full" onclick="claimDailyQuest()">${IC.gift(14)} Забрати нагороду!</button>`
        : claimed
          ? `<div class="daily-done">${IC.ok(14)} Нагороду отримано!</div>`
          : `<div class="daily-hint">Виконуй квест протягом дня</div>`
      }
    </div>`;
}

async function claimDailyQuest() {
  try {
    const r = await API.post(`/api/daily/claim`);
    toast(`${IC.celebrate(14)} Нагорода: ${IC.greens(14)}${r.rewardGreen} ${r.rewardGold ? `${IC.gold(14)}${r.rewardGold}` : ''} + предмет!`);
    await refreshPlayer();
    loadDaily();
  } catch(e) { toast(e.message, true); }
}

function renderDailyTournament(el, ev, progress) {
  const maxFights  = ev.details.maxFights || 5;
  const fightsDone = progress ? Math.floor(progress.progress / 10) : 0;
  const wins       = progress ? (progress.progress % 10)           : 0;
  const completed  = progress?.is_completed;
  const claimed    = progress?.reward_claimed;

  const tiers = [
    { min: 5, label: `${IC.medal1(14)} 1 місце`, reward: `500 ${IC.greens(14)} + слава` },
    { min: 3, label: `${IC.medal2(14)} 2–3 місце`, reward: `200 ${IC.greens(14)}` },
    { min: 1, label: 'Учасник', reward: `50 ${IC.greens(14)}` },
  ];

  el.innerHTML = `
    <div class="daily-card">
      <div class="daily-type-badge">${IC.swords(14)} Щоденний турнір</div>
      <div class="daily-task">5 боїв проти гравців близького рівня</div>
      <div class="daily-tournament-score">
        <span>Боїв: <strong>${fightsDone}/${maxFights}</strong></span>
        <span>Перемог: <strong>${wins}</strong></span>
      </div>
      <div class="daily-tiers">
        ${tiers.map(t => `<div class="daily-tier ${wins >= t.min && completed ? 'achieved' : ''}">
          ${t.label}: ${t.reward}
        </div>`).join('')}
      </div>
      ${!completed
        ? `<button class="btn btn-red btn-full" onclick="tournamentFight()" id="tournament-fight-btn">${IC.swords(14)} Бій!</button>`
        : claimed
          ? `<div class="daily-done">${IC.ok(14)} Нагороду отримано!</div>`
          : `<button class="btn btn-green btn-full" onclick="claimTournament()">${IC.trophy(14)} Забрати нагороду!</button>`
      }
    </div>`;
}

let _tournamentFighting = false;
async function tournamentFight() {
  if (_tournamentFighting) return;
  _tournamentFighting = true;
  const btn = document.getElementById('tournament-fight-btn');
  if (btn) btn.disabled = true;
  try {
    const r = await API.post('/api/daily/tournament/fight');
    const resultTxt = r.won ? `${IC.ok(14)} Перемога над ${r.opponentName}!` : `${IC.no(14)} Поразка від ${r.opponentName}`;
    toast(`${IC.swords(14)} ${resultTxt} (${r.wins}/${r.fightsDone} перемог)`);
    if (r.isCompleted) { toast(`${IC.trophy(14)} Усі турнірні бої завершено!`); }
    loadDaily();
  } catch(e) { toast(e.message, true); } finally {
    _tournamentFighting = false;
  }
}

async function claimTournament() {
  try {
    const r = await API.post('/api/daily/tournament/claim');
    toast(`${IC.trophy(14)} ${r.rank}: +${r.rewardGreen} ${IC.greens(14)} ${r.rewardGlory ? '+'+r.rewardGlory+' слави' : ''}`);
    await refreshPlayer();
    loadDaily();
  } catch(e) { toast(e.message, true); }
}

const WHEEL_SECTOR_ICONS = {
  greens: IC.greens(24), gold: IC.gold(24), potion: IC.pill(24),
  item: IC.package(24), diamond: IC.diamonds(24), rare: IC.gift(24)
};

function renderDailyWheel(el, ev, spunToday) {
  const sectors = [
    { type: 'greens',  label: `${IC.greens(14)} Зелень`,    chance: '35%', color: '#4caf50' },
    { type: 'gold',    label: `${IC.gold(14)} Золото`,     chance: '25%', color: '#ff8f00' },
    { type: 'potion',  label: `${IC.pill(14)} Зілля`,      chance: '20%', color: '#7c4dff' },
    { type: 'item',    label: `${IC.package(14)} Предмет`,    chance: '10%', color: '#0097a7' },
    { type: 'diamond', label: `${IC.diamonds(14)} Алмази`,     chance: '7%',  color: '#1565c0' },
    { type: 'rare',    label: `${IC.gift(14)} Рідкісний`,  chance: '3%',  color: '#c62828' },
  ];

  el.innerHTML = `
    <div class="daily-card">
      <div class="daily-type-badge">${IC.slot(14)} Колесо Фортуни</div>
      <div class="wheel-container">
        <div class="wheel" id="fortune-wheel">
          ${sectors.map((s, i) => `
            <div class="wheel-sector" style="--i:${i};--clr:${s.color}">
              <span>${s.label}</span>
            </div>`).join('')}
        </div>
        <div class="wheel-pointer">▼</div>
      </div>
      <div class="wheel-chances">
        ${sectors.map(s => `<span style="color:${s.color}">${s.label}: ${s.chance}</span>`).join('')}
      </div>
      <div id="wheel-result" style="text-align:center;font-size:15px;font-weight:700;margin:10px 0;min-height:24px"></div>
      ${spunToday
        ? `<div class="daily-done">${IC.ok(14)} Сьогодні вже крутив! Повертайся завтра.</div>`
        : `<button class="btn btn-full daily-spin-btn" id="spin-btn" onclick="spinWheel()">${IC.slot(14)} Крутити колесо!</button>`
      }
    </div>`;
}

let _spinning = false;
async function spinWheel() {
  if (_spinning) return;
  _spinning = true;
  const btn = document.getElementById('spin-btn');
  const wheel = document.getElementById('fortune-wheel');
  const resultEl = document.getElementById('wheel-result');
  if (btn) btn.disabled = true;
  if (resultEl) resultEl.textContent = '';

  // Start spinning animation
  if (wheel) {
    wheel.classList.add('spinning');
  }

  try {
    const r = await API.post('/api/daily/spin');
    // Wait for spin animation (1.5s) then show result
    await new Promise(res => setTimeout(res, 1500));
    if (wheel) wheel.classList.remove('spinning');
    if (resultEl) resultEl.innerHTML = `
      <span style="font-size:24px">${WHEEL_SECTOR_ICONS[r.sectorType] || IC.gift(24)}</span><br>
      <span style="color:#2e7d32">${r.prizeLabel}</span>`;
    toast(`${IC.slot(14)} Колесо Фортуни: ${r.prizeLabel}!`);
    await refreshPlayer();
    // Reload to show "already spun" state
    setTimeout(() => loadDaily(), 2000);
  } catch(e) {
    if (wheel) wheel.classList.remove('spinning');
    toast(e.message, true);
    if (btn) btn.disabled = false;
  } finally {
    _spinning = false;
  }
}

// ─── CLAN DEFENSE ─────────────────────────────────────────────────────────────
let _cdefTimerInterval = null;
let _cdefDefending     = false;

function showCdefTab(tab, btn) {
  ['battle','history'].forEach(t => {
    document.getElementById(`cdef-${t}`).style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('#cdef-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (tab === 'history') loadCdefHistory();
}

async function loadClanDefense() {
  const el = document.getElementById('cdef-battle');
  if (_cdefTimerInterval) { clearInterval(_cdefTimerInterval); _cdefTimerInterval = null; }
  try {
    const r = await API.get('/api/clan-defense/current');
    if (!r.event) {
      renderCdefInactive(el, r.lastEvent, r.reason);
    } else {
      renderCdefActive(el, r);
    }
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

const WAVE_DANGER = ['',
  IC.ok(14),IC.ok(14),IC.ok(14),
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc107;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc107;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ffc107;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff9800;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff9800;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff9800;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e53935;vertical-align:middle"></span>',
  '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e53935;vertical-align:middle"></span>',
  IC.skull(14)
];

function renderCdefActive(el, r) {
  const ev      = r.event;
  const basePct = Math.max(0, (ev.base_hp_current / ev.base_hp_max) * 100).toFixed(1);
  const wavePct = Math.max(0, (ev.wave_hp_current / r.waveHpMax) * 100).toFixed(1);
  const waveIdx = ev.current_wave - 1;

  el.innerHTML = `
    <div class="cdef-base-card">
      <div class="cdef-base-title">${IC.castle(32)} База клану</div>
      <div class="cdef-hp-row">
        <div class="cdef-hp-bar-bg">
          <div class="cdef-hp-bar base" style="width:${basePct}%"></div>
        </div>
        <span class="cdef-hp-lbl">${fmtNum(ev.base_hp_current)} / ${fmtNum(ev.base_hp_max)}</span>
      </div>
    </div>
    <div class="cdef-wave-card">
      <div class="cdef-wave-header">
        <span>${WAVE_DANGER[ev.current_wave] || `${IC.swords(14)}`} Хвиля ${ev.current_wave}/12: ${r.waveName}</span>
        <span class="cdef-wave-timer" id="cdef-wave-timer">${IC.timer(14)} ...</span>
      </div>
      <div class="cdef-hp-row">
        <div class="cdef-hp-bar-bg">
          <div class="cdef-hp-bar wave" id="cdef-wave-hp-bar" style="width:${wavePct}%"></div>
        </div>
        <span class="cdef-hp-lbl" id="cdef-wave-hp-lbl">${fmtNum(ev.wave_hp_current)} / ${fmtNum(r.waveHpMax)}</span>
      </div>
    </div>
    <div class="cdef-stats">
      <span>Учасників: <b>${r.participants}</b></span>
      <span>Мій урон: <b>${fmtNum(r.myDamage)}</b></span>
      <span>Хвиль відбито: <b>${ev.waves_survived}</b></span>
    </div>
    <button class="btn btn-red btn-full cdef-defend-btn" id="cdef-defend-btn" onclick="cdefDefend()">${IC.swords(14)} Захищати!</button>
  `;

  const waveEndsAt = new Date(ev.wave_starts_at).getTime() + 5 * 60 * 1000;
  _cdefTimerInterval = setInterval(() => {
    const left = Math.max(0, waveEndsAt - Date.now());
    const timerEl = document.getElementById(`cdef-wave-timer`);
    if (timerEl) {
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      timerEl.innerHTML = left > 0 ? `${IC.timer(14)} ${m}:${s.toString().padStart(2,'0')}` : `${IC.timer(14)} Перехід...`;
    }
    if (left === 0) { clearInterval(_cdefTimerInterval); setTimeout(() => loadClanDefense(), 5000); }
  }, 1000);
}

function renderCdefInactive(el, lastEvent, reason) {
  if (reason === 'not_in_clan') {
    el.innerHTML = `<div class="text-center" style="padding:20px">
      <p style="color:#888">Ви не в клані.<br>Вступіть до клану, щоб брати участь в обороні бази!</p>
      <button class="btn btn-green" onclick="navigate('clans')">Клани</button>
    </div>`;
    return;
  }
  if (!lastEvent) {
    el.innerHTML = `<div class="text-center" style="padding:20px">
      <div style="font-size:48px">${IC.castle(32)}</div>
      <p style="color:#888">Подія ще не починалась.<br>Наступна оборона — <strong>субота о 20:00</strong>.</p>
    </div>`;
    return;
  }
  const statusIcon = lastEvent.is_victory ? `${IC.trophy(14)}` : lastEvent.status === 'defeated' ? `${IC.skull(14)}` : `${IC.swords(14)}`;
  el.innerHTML = `
    <div class="cdef-result-card">
      <div style="text-align:center;font-size:32px">${statusIcon}</div>
      <div style="text-align:center;font-weight:700;font-size:15px;margin:6px 0">
        ${lastEvent.is_victory ? 'Перемога! База вистояла!' : lastEvent.status === 'defeated' ? 'База зруйнована...' : 'Оборона завершена'}
      </div>
      <div class="cdef-result-stats">
        <span>Хвиль відбито: <b>${lastEvent.waves_survived}/12</b></span>
        ${lastEvent.my_damage ? `<span>Ваш урон: <b>${fmtNum(lastEvent.my_damage)}</b></span>` : ''}
      </div>
    </div>
    <p class="text-muted text-center" style="margin-top:10px">Наступна оборона — <b>субота о 20:00</b></p>
  `;
}

let _cdefLastDefend = 0;
async function cdefDefend() {
  const now = Date.now();
  if (now - _cdefLastDefend < 2000) return;
  _cdefLastDefend = now;
  const btn = document.getElementById('cdef-defend-btn');
  if (btn) btn.disabled = true;
  try {
    const r = await API.post('/api/clan-defense/defend');
    toast(`${IC.swords(14)} Удар по хвилі: ${fmtNum(r.damage)} урону!`);
  } catch(e) {
    toast(e.message, true);
    if (e.message.includes('Немає')) loadClanDefense();
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadCdefHistory() {
  const el = document.getElementById('cdef-history');
  try {
    const { history } = await API.get('/api/clan-defense/history');
    if (!history.length) { el.innerHTML = '<p class="text-muted text-center">Ще не було обороних подій</p>'; return; }
    el.innerHTML = history.map(h => `
      <div class="dragon-history-item">
        <div class="flex-between">
          <span>${h.is_victory ? `${IC.trophy(14)} Перемога` : h.status === 'defeated' ? `${IC.skull(14)} Поразка` : `${IC.swords(14)} Завершено`} · ${h.participant_count} уч.</span>
          <span class="text-muted" style="font-size:11px">${kyivDate(h.started_at)}</span>
        </div>
        <div style="font-size:13px;margin-top:4px">
          Хвиль: <b>${h.waves_survived}/12</b>
          ${h.my_damage ? ` · Ваш урон: <b>${fmtNum(h.my_damage)}</b>` : ''}
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

// ─── ПИТОМНИК ─────────────────────────────────────────────────────────────────

function showPetsTab(tab, btn) {
  ['my','shop','train'].forEach(t => {
    document.getElementById(`pets-${t}`).style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('#pets-tabs .cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (tab === 'shop')  renderPetsShop();
  if (tab === 'train') renderPetsTrain();
}

async function loadPets() {
  try {
    petsData = await API.get('/api/pets/my');
    renderPetsMy();
  } catch(e) {
    document.getElementById('pets-my').innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

function renderPetsMy() {
  const el = document.getElementById('pets-my');
  if (!petsData) return;
  const { pet, training, equipment, stats } = petsData;

  if (!pet) {
    el.innerHTML = `
      <div style="text-align:center;padding:24px">
        <div style="margin-bottom:12px">${IC.paw(48)}</div>
        <p style="color:#666;margin-bottom:16px">У вас ще немає тваринки</p>
        <button class="btn btn-green" onclick="showPetsTab('shop', document.querySelector('#pets-tabs .cat-tab:nth-child(2)'))">${IC.shop(14)} До магазину</button>
      </div>`;
    return;
  }

  const eff = pet.effective || {};
  const isDead = pet.is_dead;
  const hpPct = Math.min(100, Math.floor((pet.hp_current / (eff.hp_max || pet.hp_max)) * 100));
  const _revSpent = training?.total_green_spent || 0;
  const reviveGreenCost = Math.max(0, Math.floor(_revSpent * 0.5));
  const reviveGoldCost  = _revSpent === 0 ? 100 : Math.min(500, 50 * (Math.floor(_revSpent / 5000) + 1));
  const reviveCostLabel = [reviveGreenCost > 0 ? `${fmtNum(reviveGreenCost)} ${IC.greens(14)}` : null, `${fmtNum(reviveGoldCost)} ${IC.gold(14)}`].filter(Boolean).join(' + ');

  const eqSlots = ['collar','amulet','armor','boots'].map(slot => {
    const eq = equipment.find(e => e.slot === slot);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0">
      <span>${SLOT_NAMES[slot]}</span>
      ${eq ? `<span style="color:#388e3c;font-weight:600">+${eq.bonus_value} (рів.${eq.item_level})</span>` : `<span class="text-muted">Порожньо</span>`}
    </div>`}).join('');

  const rarityColors = { 1: '#9e9e9e', 2: '#388e3c', 3: '#8e24aa' };
  const rarityBg     = { 1: '#fafafa', 2: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', 3: 'linear-gradient(135deg,#fce4ec,#f3e5f5)' };
  const rarityBorder = { 1: '#e0e0e0', 2: '#66bb6a', 3: '#ce93d8' };

  el.innerHTML = `
    <div style="border-radius:12px;border:2px solid ${rarityBorder[pet.rarity]};background:${rarityBg[pet.rarity]};padding:14px;margin-bottom:14px;text-align:center">
      <div style="font-size:52px;margin-bottom:6px">${IC.petIcon(pet.icon, 52)}</div>
      <div style="font-weight:700;font-size:18px;margin-bottom:2px">${pet.name}</div>
      <div style="color:${rarityColors[pet.rarity]};font-size:13px;font-weight:600">${RARITY_LABEL[pet.rarity] || ''}</div>
      ${isDead ? `<div style="color:#c62828;font-weight:700;margin-top:6px;font-size:15px">${IC.skull(14)} МЕРТВА</div>` : ``}
    </div>

    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-bottom:2px">
        <span>${IC.heart(14)} HP</span><span>${fmtNum(pet.hp_current)} / ${fmtNum(eff.hp_max || pet.hp_max)}</span>
      </div>
      <div style="background:#f0f0f0;border-radius:6px;height:10px;overflow:hidden">
        <div style="background:${hpPct > 50 ? '#43a047' : hpPct > 25 ? '#fb8c00' : '#e53935'};height:100%;width:${hpPct}%;transition:width .3s"></div>
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:2px">Регенерація: +10% HP/год</div>
    </div>

    <div style="margin-bottom:16px">
      ${['power','endurance','speed','accuracy'].map(k => {
        const val  = eff[k] || pet[k];
        const lvl  = training?.[`${k}_level`] || 1;
        const pct  = Math.floor((lvl - 1) / 49 * 100);
        const eqB  = (k==='power' ? equipment.find(e=>e.slot==='collar')?.bonus_value
                    : k==='endurance' ? equipment.find(e=>e.slot==='amulet')?.bonus_value
                    : k==='accuracy'  ? equipment.find(e=>e.slot==='boots')?.bonus_value : 0) || 0;
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5">
            <div style="width:76px;font-size:12px;color:#555">${STAT_LABELS[k]}</div>
            <div style="flex:1">
              <div style="background:#f0f0f0;border-radius:4px;height:6px;overflow:hidden">
                <div style="background:#66bb6a;height:100%;width:${pct}%;transition:width .3s"></div>
              </div>
              <div style="font-size:10px;color:#bbb;margin-top:1px">тр. ${lvl}/50${eqB > 0 ? ` · екіп. +${eqB}` : ''}</div>
            </div>
            <div style="font-weight:700;font-size:18px;min-width:36px;text-align:right">${val}</div>
          </div>`;
      }).join('')}
    </div>

    ${pet.abilityDesc ? `
      <div style="background:#f3e5f5;border-radius:8px;padding:10px;margin-bottom:12px">
        <div style="font-weight:600;color:#7b1fa2;margin-bottom:4px">${IC.sparkle(14)} Унікальна здібність</div>
        <div style="font-size:13px">${pet.abilityDesc}</div>
      </div>` : ''}

    <div style="background:#e8f5e9;border-radius:8px;padding:10px;margin-bottom:12px;font-size:13px">
      <div style="font-weight:600;margin-bottom:6px">${IC.swords(14)} Бойові характеристики</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div>${IC.lightning(14)} Урон за удар:<br><b>${Math.max(1,Math.floor((eff.power||pet.power)*0.8))}–${Math.floor((eff.power||pet.power)*1.2)}</b></div>
        <div>${IC.accuracy(14)} Шанс влучення:<br><b>${Math.min(100,Math.round(50+(eff.accuracy||pet.accuracy)*0.625))}%</b></div>
        <div>${IC.shield(14)} Зниження урону:<br><b>${Math.min(40,Math.round((eff.endurance||pet.endurance)*0.5))}%</b></div>
        <div>${IC.speed(14)} Ініціатива:<br><b>${eff.speed||pet.speed} оч.</b></div>
      </div>
    </div>

    <div style="margin-bottom:16px">
      <div style="font-weight:600;margin-bottom:8px">Екіпіровка</div>
      ${eqSlots}
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${isDead
        ? `<div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px">
             ${IC.skull(14)} Тваринка загинула.<br>
             Вартість відновлення: <b>${reviveCostLabel}</b><br>
             <span style="color:#777;font-size:11px">Після відновлення HP = 50% від максимуму · HP надалі відновлюється на 10%/год</span>
           </div>
           <button class="btn btn-red" onclick="revivePet()">${IC.pill(14)} Відновити (${reviveCostLabel})</button>`
        : `<button class="btn ${pet.is_active ? 'btn-gray' : 'btn-green'}" onclick="togglePet()">
             ${pet.is_active ? `${IC.home(14)} Лишити вдома` : `${IC.swords(14)} Взяти в бій`}
           </button>
           <button class="btn btn-blue btn-sm" onclick="healPet()">${IC.syringe(14)} Вилікувати</button>`
      }
    </div>

    ${stats ? `
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#666;display:flex;flex-wrap:wrap;gap:8px">
        <span>${IC.swords(14)} Боїв: <b>${stats.battles_participated}</b></span>
        <span>${IC.trophy(14)} Перемог: <b>${stats.wins}</b></span>
        <span>${IC.skull(14)} Загибель: <b>${stats.deaths}</b>р</span>
        <span>${IC.hit(14)} Урон: <b>${fmtNum(stats.total_damage)}</b></span>
        ${stats.pets_killed > 0 ? `<span>${IC.paw(14)} Вбито ворожих: <b>${stats.pets_killed}</b></span>` : ''}
        ${stats.ability_procs > 0 ? `<span>${IC.sparkle(14)} Здібність: <b>${stats.ability_procs}</b>р</span>` : ''}
      </div>` : ''}
  `;
}

async function togglePet() {
  try {
    const r = await API.post('/api/pets/toggle');
    toast(r.is_active ? `${IC.swords(14)} Тваринка йде в бій!` : `${IC.home(14)} Тваринка залишається вдома`);
    await loadPets();
  } catch(e) { toast(e.message, true); }
}

async function revivePet() {
  try {
    const { training } = petsData || await API.get('/api/pets/my');
    const spent = training?.total_green_spent || 0;
    const green = Math.max(0, Math.floor(spent * 0.5));
    const gold  = spent === 0 ? 100 : Math.min(500, 50 * (Math.floor(spent / 5000) + 1));
    const costParts = [];
    if (green > 0) costParts.push(`${fmtNum(green)} ${IC.greens(14)}`);
    costParts.push(`${fmtNum(gold)} ${IC.gold(14)}`);
    if (!confirm(`Відновлення тваринки коштує: ${costParts.join(' + ')}.\nПісля відновлення HP = 50% від максимуму.\nПродовжити?`)) return;
    const r = await API.post('/api/pets/revive');
    const spent2 = [r.greenCost > 0 ? `${fmtNum(r.greenCost)} ${IC.greens(14)}` : null, `${fmtNum(r.goldCost)} ${IC.gold(14)}`].filter(Boolean).join(' + ');
    toast(`${IC.pill(14)} Тваринка відновлена! HP: ${fmtNum(r.hpCurrent)} · Витрачено: ${spent2}`);
    await loadPets();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}

async function healPet() {
  try {
    const r = await API.post('/api/pets/heal');
    toast(`${IC.syringe(14)} HP відновлено! Витрачено ${fmtNum(r.cost)} ${IC.greens(14)}`);
    await loadPets();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}

function _petCard(p, hasPet) {
  const dmgMin = Math.max(1, Math.floor(p.power * 0.8));
  const dmgMax = Math.floor(p.power * 1.2);
  const hitPct = Math.min(100, Math.round(50 + p.accuracy * 0.625));
  const defPct = Math.min(40, Math.round(p.endurance * 0.5));
  const statRow = `
    <div class="pet-stats-grid">
      <div class="pet-stat-chip"><span>${IC.lightning(14)} Міць</span><b>${p.power}</b></div>
      <div class="pet-stat-chip"><span>${IC.shield(14)} Стійк</span><b>${p.endurance}</b></div>
      <div class="pet-stat-chip"><span>${IC.speed(14)} Швид</span><b>${p.speed}</b></div>
      <div class="pet-stat-chip"><span>${IC.accuracy(14)} Точн</span><b>${p.accuracy}</b></div>
      <div class="pet-stat-chip" style="grid-column:1/-1"><span>${IC.heart(14)} HP</span><b>${p.hp}</b></div>
    </div>
    <div style="font-size:11px;color:#777;background:rgba(0,0,0,.04);border-radius:6px;padding:4px 6px;margin-bottom:6px">
      Урон: ${dmgMin}–${dmgMax} · Влучення: ${hitPct}% · Захист: ${defPct}%
    </div>`;
  const abilityBox = p.abilityDesc
    ? `<div class="pet-ability-box">${IC.sparkle(14)} ${p.abilityDesc}</div>`
    : '';
  const btnLabel = `${p.price} ${p.currency === 'diamonds' ? IC.diamonds(14) : IC.gold(14)}`;
  return `
    <div class="pet-card rarity-${p.rarity}">
      <div class="pet-card-icon">${IC.petIcon(p.icon, 52)}</div>
      <div class="pet-card-name">${p.name}</div>
      <div class="pet-card-rarity">${RARITY_LABEL[p.rarity]}</div>
      ${statRow}
      ${abilityBox}
      <button class="btn btn-sm" style="width:100%;${p.currency==='diamonds'?'background:#8e24aa;color:#fff':''}"
        onclick="buyPet('${p.type}')" ${hasPet ? 'disabled' : ''}>${btnLabel} Придбати</button>
    </div>`;
}

async function renderPetsShop() {
  const el = document.getElementById('pets-shop');
  el.innerHTML = '<p class="text-muted">Завантаження...</p>';
  try {
    const { catalog, equipment, hasPet } = await API.get('/api/pets/shop');

    const hasPetNote = hasPet
      ? `<div style="background:#fff3e0;border-radius:8px;padding:10px;font-size:13px;color:#e65100;margin-bottom:12px">
           ${IC.warn(14)} У вас вже є тваринка. Нову купити неможливо — тваринка одна на все життя.
         </div>`
      : '';

    const common    = catalog.filter(p => p.rarity === 1);
    const rare      = catalog.filter(p => p.rarity === 2);
    const legendary = catalog.filter(p => p.rarity === 3);

    // Equipment: show current level for pet (if any)
    const myEq = petsData?.equipment || [];
    const eqRows = equipment.map(eq => {
      const owned = myEq.find(e => e.slot === eq.slot);
      const curLvl = owned?.item_level || 0;
      const statLabel = eq.slot === 'armor' ? 'HP' : STAT_LABELS[eq.stat] || eq.stat;
      return `
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:700">${SLOT_NAMES[eq.slot]}</span>
            ${owned
              ? `<span style="color:#388e3c;font-size:13px;font-weight:600">&check; Рів.${owned.item_level} (+${owned.bonus_value} ${statLabel})</span>`
              : `<span style="color:#aaa;font-size:12px">Не встановлено</span>`}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${eq.levels.map(l => {
              const isCurrent = l.level === curLvl;
              const isLower   = l.level < curLvl;
              const isNext    = l.level === curLvl + 1;
              if (isLower) return ''; // не показуємо нижчі рівні
              return `<button class="btn btn-sm ${isCurrent ? 'btn-green' : isNext ? 'btn-blue' : 'btn-gray'}"
                onclick="buyEquip('${eq.slot}',${l.level})"
                ${(!hasPet || isCurrent) ? 'disabled' : ''}
                title="${l.bonus > 0 ? `+${l.bonus} до ${statLabel}` : ''}">
                ${isCurrent ? `&check; Рів.${l.level}` : `Рів.${l.level}: +${l.bonus} · ${fmtNum(l.price)}${IC.gold(14)}`}
              </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    el.innerHTML = `
      ${hasPetNote}

      <div class="pet-section-title">${IC.star(14)} Звичайні — за золото</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${common.map(p => _petCard(p, hasPet)).join('')}
      </div>

      <div class="pet-section-title rare">${IC.star(13)}${IC.star(13)} Рідкісні — +25% до всіх статів</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${rare.map(p => _petCard(p, hasPet)).join('')}
        <div></div>
      </div>

      <div class="pet-section-title legendary">${IC.star(13)}${IC.star(13)}${IC.star(13)} Легендарні — +50% статів + унікальна здібність</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${legendary.map(p => _petCard(p, hasPet)).join('')}
        <div></div>
      </div>

      <div class="pet-section-title" style="margin-top:20px">${IC.shield(14)} Екіпіровка тваринки</div>
      ${!hasPet ? '<p style="font-size:13px;color:#888;margin-bottom:8px">Спочатку придбайте тваринку</p>' : ''}
      ${eqRows}

      <div class="pet-section-title" style="margin-top:20px">${IC.pill(14)} Зілля для тваринки</div>
      ${!hasPet
        ? `<p style="font-size:13px;color:#888;margin-bottom:8px">Спочатку придбайте тваринку</p>`
        : (() => {
            const myPet = petsData?.pet;
            const hpFull = myPet && myPet.hp_current >= (myPet.effective?.hp_max || myPet.hp_max);
            return `
              <div style="font-size:12px;color:#888;margin-bottom:10px">${IC.clipboard(14)} Разові предмети — купівля = миттєве використання</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:10px;padding:12px;text-align:center">
                  <div style="font-size:28px">${IC.heart(14)}</div>
                  <div style="font-weight:600;margin:4px 0;font-size:14px">Зілля HP</div>
                  <div style="font-size:12px;color:#666;margin-bottom:8px">Відновлює 30% HP тваринки миттєво</div>
                  <div style="font-size:12px;font-weight:600;color:#e65100;margin-bottom:6px">200 ${IC.gold(14)}</div>
                  ${hpFull
                    ? `<div style="font-size:11px;color:#388e3c">${IC.ok(14)} HP вже повне</div>`
                    : `<button class="btn btn-sm btn-orange" onclick="buyPetPotion('hp')">Використати</button>`}
                </div>
                <div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:10px;padding:12px;text-align:center">
                  <div style="font-size:28px">${IC.lightning(14)}</div>
                  <div style="font-weight:600;margin:4px 0;font-size:14px">Зілля мощі</div>
                  <div style="font-size:12px;color:#666;margin-bottom:8px">+1 до Мощі назавжди</div>
                  <div style="font-size:12px;font-weight:600;color:#1565c0;margin-bottom:6px">400 ${IC.gold(14)}</div>
                  <button class="btn btn-sm btn-blue" onclick="buyPetPotion('power')">Використати</button>
                </div>
              </div>`;
          })()}
    `;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function buyPet(petType) {
  if (!confirm(`Купити тваринку? Ця дія незворотня — тваринка одна на все життя.`)) return;
  try {
    const r = await API.post('/api/pets/buy', { petType });
    toast(`${IC.paw(14)} ${r.pet.name} тепер ваша тваринка!`);
    await loadPets();
    showPetsTab('my', document.querySelector('#pets-tabs .cat-tab'));
  } catch(e) { toast(e.message, true); }
}

async function buyEquip(slot, level) {
  const { equipment } = await API.get('/api/pets/shop');
  const slotData = equipment.find(e => e.slot === slot);
  const lvlData  = slotData?.levels.find(l => l.level === level);
  if (!lvlData) return;
  const statLabel = slot === 'armor' ? 'HP' : STAT_LABELS[slotData.stat] || slotData.stat;
  if (!confirm(`${SLOT_NAMES[slot]} рівень ${level}\n+${lvlData.bonus} до ${statLabel}\nВартість: ${fmtNum(lvlData.price)} ${IC.gold(14)}\nПридбати?`)) return;
  try {
    const r = await API.post(`/api/pets/equip`, { slot, level });
    toast(`${IC.ok(14)} ${SLOT_NAMES[slot]} рів.${level} (+${r.bonus} ${statLabel}) встановлено!`);
    await loadPets();
    renderPetsShop();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}

async function buyPetPotion(type) {
  const names = { hp: 'Зілля HP (відновить 30% HP)', power: 'Зілля мощі (+1 до Мощі назавжди)' };
  const costs = { hp: 200, power: 400 };
  if (!confirm(`${names[type]}\nВартість: ${fmtNum(costs[type])} ${IC.gold(14)}\nВикористати?`)) return;
  try {
    const r = await API.post('/api/pets/potion', { type });
    if (type === 'hp') toast(`${IC.heart(14)} Зілля HP! +${r.restored} HP · Залишок: ${fmtNum(r.hpCurrent)}`);
    else toast(`${IC.lightning(14)} Зілля мощі! Міць тепер ${r.newPower}`);
    await loadPets();
    renderPetsShop();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}

async function renderPetsTrain() {
  const el = document.getElementById('pets-train');
  if (!petsData?.pet) {
    el.innerHTML = '<p class="text-muted">Спочатку придбайте тваринку</p>';
    return;
  }
  const { pet, training, equipment } = petsData;
  if (!training) { el.innerHTML = '<p class="text-muted">Дані тренування недоступні</p>'; return; }

  // Базові стати тваринки (до тренувань) — pet.power вже включає тренування
  // Тому базовий = pet.power - (training.power_level - 1) (рівень 1 = +0)
  const BASE_STAT = {
    power:     pet.power     - (training.power_level     - 1),
    endurance: pet.endurance - (training.endurance_level - 1),
    speed:     pet.speed     - (training.speed_level     - 1),
    accuracy:  pet.accuracy  - (training.accuracy_level  - 1),
  };

  const rows = ['power','endurance','speed','accuracy'].map(stat => {
    const lvl = training[`${stat}_level`] || 1;
    const nextLvl = lvl + 1;
    const cost = lvl >= 50 ? null : Math.floor(nextLvl * nextLvl * 10 + nextLvl * 20);
    const costNext = lvl >= 49 ? null : Math.floor((nextLvl+1)*(nextLvl+1)*10 + (nextLvl+1)*20);
    const pct = Math.floor((lvl - 1) / 49 * 100);
    const trainBonus = lvl - 1;
    const eqBonus = (stat === 'power' ? equipment.find(e=>e.slot==='collar')?.bonus_value
                   : stat === 'endurance' ? equipment.find(e=>e.slot==='amulet')?.bonus_value
                   : stat === 'accuracy' ? equipment.find(e=>e.slot==='boots')?.bonus_value
                   : 0) || 0;
    const total = BASE_STAT[stat] + trainBonus + eqBonus;

    return `
      <div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-weight:700">${STAT_LABELS[stat]}</span>
          <span style="font-size:20px;font-weight:700;color:#2e7d32">${total}</span>
        </div>
        <div style="font-size:11px;color:#999;margin-bottom:6px">
          База ${BASE_STAT[stat]}
          ${trainBonus > 0 ? ` + тренування ${trainBonus}` : ''}
          ${eqBonus > 0 ? ` + екіп. ${eqBonus}` : ''}
          · Рів. <b>${lvl}/50</b>
        </div>
        <div style="background:#f0f0f0;border-radius:6px;height:6px;margin-bottom:8px;overflow:hidden">
          <div style="background:#66bb6a;height:100%;width:${pct}%;transition:width .3s"></div>
        </div>
        ${lvl < 50
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
               <button class="btn btn-green btn-sm" onclick="trainPet('${stat}')">
                 ▲ +1 · ${fmtNum(cost)} ${IC.greens(14)}
               </button>
               ${[5,10,20,50].filter(t => t > lvl).slice(0,2).map(t => {
                 let bulkCost = 0;
                 for (let l = lvl+1; l <= t; l++) bulkCost += Math.floor(l*l*10+l*20);
                 return `<button class="btn btn-gray btn-sm" onclick="trainPetBulk('${stat}',${t})">до рів.${t} · ${fmtNum(bulkCost)} ${IC.greens(14)}</button>`;
               }).join('')}
             </div>`
          : `<span style="color:#388e3c;font-size:13px;font-weight:600">${IC.ok(14)} Максимум</span>`}
      </div>`;
  }).join(``);

  // Таблиця витрат
  const totalAll       = Math.floor(training.total_green_spent);
  const revGreen       = Math.max(0, Math.floor(totalAll * 0.5));
  const revGold        = totalAll === 0 ? 100 : Math.min(500, 50 * (Math.floor(totalAll / 5000) + 1));
  const revCostStr     = [revGreen > 0 ? `${fmtNum(revGreen)} ${IC.greens(14)}` : null, `${fmtNum(revGold)} ${IC.gold(14)}`].filter(Boolean).join(` + `);

  el.innerHTML = `
    <div style="background:#f1f8e9;border-radius:8px;padding:10px;margin-bottom:14px;font-size:13px">
      ${IC.moneybag(14)} Витрачено зелені: <b>${fmtNum(totalAll)}</b> ${IC.greens(14)}
      · Вартість відновлення: <b>${revCostStr}</b>
    </div>
    <div class="pet-combat-legend">
      <div class="pet-combat-legend-item"><b>${IC.lightning(14)} Міць</b>Урон за удар</div>
      <div class="pet-combat-legend-item"><b>${IC.shield(14)} Стійкість</b>Зниження вх. урону (до 40%)</div>
      <div class="pet-combat-legend-item"><b>${IC.speed(14)} Швидкість</b>Ініціатива — хто б'є першим</div>
      <div class="pet-combat-legend-item"><b>${IC.accuracy(14)} Точність</b>Шанс влучення (50%–100%)</div>
    </div>
    <div style="font-size:12px;color:#999;margin-bottom:12px">
      Формула прокачки: рівень² × 10 + рівень × 20 · Макс рівень: 50
    </div>
    ${rows}
  `;
}

async function trainPet(stat) {
  try {
    const r = await API.post('/api/pets/train', { stat });
    toast(`${STAT_LABELS[stat]} → рівень ${r.newLevel}! Витрачено ${fmtNum(r.cost)} ${IC.greens(14)}`);
    await loadPets();
    renderPetsTrain();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}

async function trainPetBulk(stat, targetLevel) {
  try {
    const r = await API.post('/api/pets/train-bulk', { stat, targetLevel });
    toast(`${STAT_LABELS[stat]} → рівень ${r.newLevel}! Витрачено ${fmtNum(r.cost)} ${IC.greens(14)}`);
    await loadPets();
    renderPetsTrain();
    refreshPlayer();
  } catch(e) { toast(e.message, true); }
}
