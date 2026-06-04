async function api(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) { const err = new Error(data.error || 'Помилка запиту'); Object.assign(err, data); throw err; }
  return data;
}

const API = {
  get:    (url)       => api('GET', url),
  post:   (url, body) => api('POST', url, body),
  put:    (url, body) => api('PUT', url, body),
  delete: (url)       => api('DELETE', url),
};

function toast(msg, isError = false) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.background = isError ? '#c62828' : '#333';
  el.innerHTML = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

function fmtTime(seconds) {
  if (seconds <= 0) return 'Готово!';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}г ${m}хв`;
  if (m > 0) return `${m}хв ${s}с`;
  return `${s}с`;
}

function fmtNum(n) {
  return Number(n).toLocaleString('uk-UA');
}

// Kyiv timezone date/time formatters (formatToParts — no timezone label in output)
const _KV_FMT = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'Europe/Kiev',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false
});
function _kyiv(d) {
  return Object.fromEntries(_KV_FMT.formatToParts(new Date(d)).map(p => [p.type, p.value]));
}
function kyivDate(d)     { const p = _kyiv(d); return `${p.day}.${p.month}.${p.year}`; }
function kyivTime(d)     { const p = _kyiv(d); return `${p.hour}:${p.minute}`; }
function kyivDateTime(d) { const p = _kyiv(d); return `${p.day}.${p.month} ${p.hour}:${p.minute}`; }

function playerAvatar(faction, gender) {
  if (faction === 'elves') return gender === 'female' ? '🧝‍♀️' : '🧝‍♂️';
  return gender === 'female' ? '👹' : '👹';
}

function factionLabel(f) {
  return { elves: 'Ельфи', orcs: 'Орки', humans: 'Люди' }[f] || f || '—';
}
