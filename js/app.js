/* 台灣的夜市 — 主程式（路由、設定、音效、練習、測驗、學習歷程） */
'use strict';

/* ================= 儲存 ================= */
const KEY = 'nightmkt_v1_';
const store = {
  get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};
const DEFAULTS = { full: 'off', sound: 'on', device: 'auto', layout: 'auto', lang: 'zh', font: 'normal', theme: 'system' };
const S = Object.assign({}, DEFAULTS, store.get('settings', {}));
S.full = 'off';
let lang = S.lang;

/* ================= 工具 ================= */
const $ = (s, r = document) => r.querySelector(s);
const L = x => Array.isArray(x) ? (lang === 'tw' ? (x[1] ?? x[0]) : x[0]) : x;
const T = k => L(I18N[k] || k);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad2 = n => String(n).padStart(2, '0');
const fmtTime = d => { d = new Date(d); return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }

/* ================= 音效（Web Audio 合成，無外部檔案） ================= */
let actx = null;
function tone(freq, dur, type = 'sine', vol = .18, when = 0, slide = 0) {
  if (S.sound !== 'on') return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + .02);
  } catch (e) { /* ignore */ }
}
function sfx(name) {
  const m = {
    click: () => tone(660, .07, 'triangle', .12),
    tick: () => tone(1200, .03, 'square', .04),
    pop: () => { tone(520, .08, 'sine', .16, 0, 380); },
    flip: () => { tone(400, .09, 'triangle', .1, 0, 300); tone(800, .06, 'sine', .06, .06); },
    coin: () => { tone(988, .08, 'square', .09); tone(1319, .22, 'square', .09, .08); },
    ok: () => { tone(660, .1, 'triangle', .16); tone(880, .1, 'triangle', .16, .09); tone(1175, .2, 'triangle', .16, .18); },
    bad: () => { tone(220, .18, 'sawtooth', .08, 0, -60); tone(180, .24, 'sawtooth', .08, .14, -40); },
    whoosh: () => tone(300, .35, 'sine', .08, 0, 600),
    miss: () => tone(320, .22, 'triangle', .1, 0, -160),
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .15, i * .09)); tone(1319, .4, 'sine', .1, .36); },
    gong: () => { tone(196, 1.2, 'sine', .2); tone(294, 1, 'sine', .08, .02); },
  };
  (m[name] || m.click)();
}

/* ================= 學習歷程 ================= */
let LOG = store.get('log', []);
const seen = new Set();
function logEvent(type, icon, title, detail = '', score = null) {
  LOG.push({ t: Date.now(), type, icon, title, detail, score });
  if (LOG.length > 800) LOG = LOG.slice(-800);
  store.set('log', LOG);
}
function logOnce(key, type, icon, title, detail) { if (seen.has(key)) return; seen.add(key); logEvent(type, icon, title, detail); }
// 學習時間
let secs = store.get('secs', 0);
setInterval(() => { if (!document.hidden) { secs++; if (secs % 10 === 0) store.set('secs', secs); } }, 1000);

/* ================= 集點卡 ================= */
const STAMPS = [
  { id: 'home', i: '🏠', n: ['首頁', '頭頁'] }, { id: 'guide', i: '🧭', n: ['指引', '指引'] }, { id: 'learn', i: '📖', n: ['閱讀', '讀冊'] },
  { id: 'explore', i: '🎮', n: ['探索', '探索'] }, { id: 'adv', i: '🔭', n: ['延伸', '延伸'] }, { id: 'practice', i: '✏️', n: ['練習', '練習'] },
  { id: 'quiz', i: '📝', n: ['測驗', '小考'] }, { id: 'log', i: '📒', n: ['歷程', '跤跡'] }, { id: 'units', i: '🏮', n: ['讀完6單元', '讀了6單元'] }, { id: 'master', i: '🏆', n: ['測驗80+', '小考80+'] },
];
let stamps = store.get('stamps', {});
function stamp(id) {
  if (stamps[id]) return;
  stamps[id] = Date.now(); store.set('stamps', stamps);
  const s = STAMPS.find(x => x.id === id);
  setTimeout(() => { sfx('coin'); toast(`${s.i} ${L(['獲得集點章：', '提著集點印仔：'])}${L(s.n)}`); }, 400);
  if (Object.keys(stamps).length === STAMPS.length) setTimeout(() => { sfx('win'); confetti(); toast('🏆 ' + L(['恭喜成為夜市達人！', '恭喜你變做夜市達人！'])); logEvent('badge', '🏆', L(['成為夜市達人', '變做夜市達人']), '集滿 10 點'); }, 1500);
  renderTabs();
}

/* ================= 設定 ================= */
const SETTING_DEFS = [
  { k: 'full', icon: '⛶', l: 'set_full', o: ['on', 'off'] },
  { k: 'sound', icon: '🔊', l: 'set_sound', o: ['on', 'off'] },
  { k: 'device', icon: '📱', l: 'set_device', o: ['auto', 'phone', 'tablet', 'desktop'] },
  { k: 'layout', icon: '🧭', l: 'set_layout', o: ['auto', 'portrait', 'landscape'] },
  { k: 'lang', icon: '🗣️', l: 'set_lang', o: ['zh', 'tw'] },
  { k: 'font', icon: '🔤', l: 'set_font', o: ['small', 'normal', 'large'] },
  { k: 'theme', icon: '🎨', l: 'set_theme', o: ['system', 'light', 'dark'] },
];
function effLayout() {
  if (S.layout !== 'auto') return S.layout;
  if (S.device === 'phone') return 'portrait';
  if (S.device === 'tablet') return innerWidth > innerHeight ? 'landscape' : 'portrait';
  return (innerWidth > innerHeight && innerWidth >= 1024) ? 'landscape' : 'portrait';
}
function applySettings() {
  const h = document.documentElement;
  h.dataset.theme = S.theme; h.dataset.device = S.device; h.dataset.layout = S.layout; h.dataset.font = S.font;
  h.dataset.effLayout = effLayout();
  h.lang = lang === 'tw' ? 'nan-Hant-TW' : 'zh-Hant-TW';
  $('#soundQuick').textContent = S.sound === 'on' ? '🔊' : '🔇';
  $('#langQuick').textContent = lang === 'tw' ? '台→國' : '國→台';
  const dark = S.theme === 'dark' || (S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name=theme-color]').content = dark ? '#17163a' : '#ef4136';
  const save = Object.assign({}, S); delete save.full; store.set('settings', save);
}
function setSetting(k, v) {
  if (k === 'full') { toggleFull(v === 'on'); return; }
  const langChanged = k === 'lang' && v !== lang;
  S[k] = v; if (k === 'lang') lang = v;
  applySettings(); sfx('click');
  if (langChanged) { renderStatic(); renderTabs(); render(); toast(v === 'tw' ? '已切換做台語' : '已切換為國語'); }
  renderSettings();
}
function toggleFull(on) {
  const d = document;
  try {
    if (on && !d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
    else if (!on && d.fullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { toast(L(['此瀏覽器不支援全螢幕', '這个瀏覽器無支援規个螢幕'])); }
}
document.addEventListener('fullscreenchange', () => { S.full = document.fullscreenElement ? 'on' : 'off'; renderSettings(); });
function renderSettings() {
  $('#settingsBody').innerHTML = SETTING_DEFS.map(d => `<div class="set-row"><b><span aria-hidden="true">${d.icon}</span>(${SETTING_DEFS.indexOf(d) + 1}) ${T(d.l)}</b>
    <div class="seg" role="group" aria-label="${T(d.l)}">${d.o.map(o => `<button data-sk="${d.k}" data-sv="${o}" aria-pressed="${S[d.k] === o}">${T(o)}</button>`).join('')}</div></div>`).join('');
  $('#settingsBody').querySelectorAll('[data-sk]').forEach(b => b.onclick = () => setSetting(b.dataset.sk, b.dataset.sv));
}
function openSettings(open) {
  $('#settings').classList.toggle('open', open); $('#settings').setAttribute('aria-hidden', !open);
  $('#drawerMask').hidden = !open; if (open) { renderSettings(); sfx('pop'); $('#closeSettings').focus(); }
}

/* ================= 靜態文字 / 導覽 ================= */
function renderStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = T(el.dataset.i18n));
  document.title = `${T('appTitle')}｜${T('appSub')}`;
}
const NAV = [
  { id: 'home', i: '🏠', c: 'red' }, { id: 'guide', i: '🧭', c: 'orange' }, { id: 'learn', i: '📖', c: 'teal' }, { id: 'explore', i: '🎮', c: 'purple' },
  { id: 'adv', i: '🔭', c: 'green' }, { id: 'practice', i: '✏️', c: 'pink' }, { id: 'quiz', i: '📝', c: 'blue' }, { id: 'log', i: '📒', c: 'yellow' },
];
let route = 'home';
function renderTabs() {
  $('#tabs').innerHTML = NAV.map(n => `<button class="tab c-${n.c}" data-go="${n.id}" ${route === n.id ? 'aria-current="page"' : ''}><span class="ti" aria-hidden="true">${n.i}</span><span class="tl-lab">${T('nav_' + n.id)}</span>${stamps[n.id] && route !== n.id ? '<span class="stamp-dot" title="✓"></span>' : ''}</button>`).join('');
  const cur = $('#tabs [aria-current]');
  if (cur && effLayout() === 'portrait') { const tabs = $('#tabs'); tabs.scrollTo({ left: cur.offsetLeft - tabs.clientWidth / 2 + cur.clientWidth / 2, behavior: 'smooth' }); }
}
function go(r, sub) {
  if (!NAV.find(n => n.id === r)) r = 'home';
  route = r; if (sub != null) subState[r] = sub;
  const h = '#' + r + (subState[r] != null && sub != null ? '/' + sub : '');
  if (location.hash !== h) history.replaceState(null, '', h);
  renderTabs(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  stamp(r);
  logOnce('nav:' + r, 'visit', NAV.find(n => n.id === r).i, L(['進入', '入去']) + '「' + T('nav_' + r) + '」');
}
const subState = { learn: 0, explore: 'map', guide: 'teacher', practice: null };
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); sfx('click'); go(b.dataset.go, b.dataset.sub != null ? (isNaN(b.dataset.sub) ? b.dataset.sub : +b.dataset.sub) : undefined); } });

function render() {
  const v = $('#view');
  v.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'view-enter'; v.appendChild(wrap);
  ({ home: vHome, guide: vGuide, learn: vLearn, explore: vExplore, adv: vAdv, practice: vPractice, quiz: vQuiz, log: vLog })[route](wrap);
}
const head = (icon, color, title, sub) => `<div class="sec-head c-${color}"><span class="badge" aria-hidden="true">${icon}</span><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div></div>`;

/* ================= 首頁 ================= */
function stallSVG(x, color, sign, icon, delay) {
  let stripes = '';
  for (let i = 0; i < 6; i++) stripes += `<rect x="${x + i * 25}" y="230" width="25" height="34" fill="${i % 2 ? '#fff' : color}"/>`;
  let scal = '';
  for (let i = 0; i < 6; i++) scal += `<path d="M${x + i * 25} 264 q12.5 18 25 0" fill="${i % 2 ? '#fff' : color}"/>`;
  return `<g>
    <rect x="${x + 6}" y="262" width="6" height="100" fill="#7a4b00"/><rect x="${x + 138}" y="262" width="6" height="100" fill="#7a4b00"/>
    <rect x="${x - 4}" y="222" width="158" height="10" rx="5" fill="#7a4b00"/>${stripes}${scal}
    <rect x="${x + 30}" y="194" width="90" height="32" rx="10" fill="#fff8ec" stroke="${color}" stroke-width="4"/>
    <text x="${x + 75}" y="217" text-anchor="middle" font-size="19" font-weight="900" fill="${color}" font-family="Huninn,Noto Sans TC,sans-serif">${sign}</text>
    <rect x="${x}" y="318" width="150" height="48" rx="8" fill="#ffe1a8" stroke="#c98a2b" stroke-width="3"/>
    <text x="${x + 75}" y="306" text-anchor="middle" font-size="34">${icon}</text>
    <g fill="#fff"><circle class="steam" style="animation-delay:${delay}s" cx="${x + 62}" cy="280" r="7"/><circle class="steam" style="animation-delay:${delay + .8}s" cx="${x + 84}" cy="276" r="6"/><circle class="steam" style="animation-delay:${delay + 1.5}s" cx="${x + 74}" cy="284" r="5"/></g>
  </g>`;
}
function heroSVG() {
  const lanterns = [60, 150, 240, 330, 420, 510].map((x, i) => {
    const y = 58 + Math.sin(i * 1.1) * 14 + (i % 2) * 10;
    const col = ['#ef4136', '#ffc533', '#ff5d8f', '#ef4136', '#ff8a00', '#ff5d8f'][i];
    return `<g class="lantern" style="animation-delay:${-i * .4}s"><line x1="${x}" y1="${y - 22}" x2="${x}" y2="${y - 8}" stroke="#5a2a00" stroke-width="2"/>
      <ellipse cx="${x}" cy="${y + 12}" rx="22" ry="24" fill="${col}"/><ellipse cx="${x}" cy="${y + 12}" rx="10" ry="24" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2"/>
      <rect x="${x - 12}" y="${y - 12}" width="24" height="6" rx="2" fill="#7a3b00"/><rect x="${x - 12}" y="${y + 33}" width="24" height="6" rx="2" fill="#7a3b00"/>
      <line x1="${x}" y1="${y + 39}" x2="${x}" y2="${y + 52}" stroke="#ffc533" stroke-width="3"/>
      <ellipse cx="${x}" cy="${y + 12}" rx="34" ry="34" fill="${col}" opacity=".18"/></g>`;
  }).join('');
  const stars = Array.from({ length: 16 }, (_, i) => `<circle class="twinkle" style="animation-delay:${(i * .37) % 2}s" cx="${(i * 97) % 600}" cy="${(i * 53) % 150 + 6}" r="${1.5 + (i % 3)}" fill="#fff"/>`).join('');
  return `<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    ${stars}<circle cx="520" cy="60" r="28" fill="#fff4c2"/><circle cx="532" cy="52" r="26" fill="#ff8a6b" opacity=".0"/>
    <path d="M-300 30 Q-150 90 0 36 Q150 96 300 46 T600 40 Q750 90 900 34" stroke="#5a2a00" stroke-width="3" fill="none"/>
    ${lanterns}
    <rect x="-600" y="362" width="1800" height="300" fill="#5b3fae"/><rect x="-600" y="362" width="1800" height="6" fill="#ffc533" opacity=".6"/>
    ${stallSVG(20, '#ef4136', lang === 'tw' ? '小食' : '小吃', '🍢', 0)}${stallSVG(225, '#11a6b4', lang === 'tw' ? '遊戲' : '遊戲', '🎯', .6)}${stallSVG(430, '#22b36b', lang === 'tw' ? '飲料' : '飲料', '🧋', 1.2)}
  </svg>`;
}
function vHome(el) {
  const doneUnits = store.get('unitsDone', []).length;
  el.innerHTML = `
  <section class="hero">
    <div class="hero-copy">
      <h1>${T('appTitle')}<span class="tw-alt">${lang === 'tw' ? 'Tâi-uân ê iā-tshī-á' : 'TAIWAN NIGHT MARKET'}</span></h1>
      <p>${T('heroLead')}</p>
      <div class="row"><button class="btn" data-go="learn">📖 ${T('start')}</button><button class="btn alt" data-go="explore">🎮 ${T('heroBtn2')}</button></div>
    </div>
    <div class="hero-art">${heroSVG()}
      ${['🧋', '🍢', '🦪', '🌽', '🍡'].map((f, i) => `<span class="float-food" role="button" tabindex="0" aria-label="food" style="left:${6 + i * 19}%;bottom:${3 + (i % 2) * 5}%;animation-delay:${-i * .7}s">${f}</span>`).join('')}
    </div>
  </section>
  <div class="stats">
    <div class="stat c-red"><b>6</b><span>${T('stat_units')}</span></div>
    <div class="stat c-teal"><b>${WIDGETS.length}</b><span>${T('stat_widgets')}</span></div>
    <div class="stat c-purple"><b>${QUIZ.length}</b><span>${T('stat_quiz')}</span></div>
    <div class="stat c-orange"><b>${Object.keys(stamps).length}/10</b><span>${T('stat_stamps')}</span></div>
  </div>
  <div class="grid-2">
    <div class="card"><h2>🎫 ${T('stampCard')}</h2><p class="muted">${T('stampHint')}</p>
      <div class="stamps-wrap"><div class="stamps">${STAMPS.map(s => `<div class="stamp${stamps[s.id] ? ' on' : ''}" title="${L(s.n)}">${s.i}<small>${L(s.n)}</small></div>`).join('')}</div></div>
      <p style="margin:6px 0 0" class="muted">📖 ${L(['已讀完單元', '已經讀了的單元'])}：<b>${doneUnits}/6</b></p></div>
    <div class="card"><h2>🚀 ${T('quickLinks')}</h2>
      <div class="quick">${[
        ['guide', '🧭', 'orange', T('student'), L(['學習目標與路徑', '學習目標佮路線'])],
        ['learn', '📖', 'teal', T('nav_learn'), L(['6 個主題單元', '6 个主題單元'])],
        ['practice', '✏️', 'pink', T('nav_practice'), L(['5 種反覆練習', '5 種一直練'])],
        ['quiz', '📝', 'blue', T('nav_quiz'), L(['檢核學習成果', '檢查學習成果'])],
      ].map(q => `<button class="qcard c-${q[2]}" data-go="${q[0]}"><span class="qi">${q[1]}</span><span><b>${q[3]}</b><span>${q[4]}</span></span></button>`).join('')}</div></div>
  </div>
  <div class="card" style="margin-top:18px"><h2>🏮 ${L(['六大學習單元', '六大學習單元'])}</h2>
    <div class="quick">${UNITS.map((u, i) => `<button class="qcard c-${u.color}" data-go="learn" data-sub="${i}"><span class="qi">${u.icon}</span><span><b>${i + 1}. ${L(u.title)}</b><span>${L(u.sum)}</span></span></button>`).join('')}</div></div>`;
  el.querySelectorAll('.float-food').forEach(f => f.onclick = () => { sfx('pop'); f.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6) rotate(20deg)' }, { transform: 'scale(1)' }], { duration: 500 }); });
}

/* ================= 學習指引 ================= */
let pickTimer = null, cdTimer = null, cdLeft = 300;
function vGuide(el) {
  const tab = subState.guide;
  el.innerHTML = head('🧭', 'orange', T('nav_guide'), L(['老師怎麼教、學生怎麼學，一次看清楚。', '老師按怎教、學生按怎學，一擺看清楚。'])) +
    `<div class="seg" role="group" style="margin-bottom:18px"><button data-gt="teacher" aria-pressed="${tab === 'teacher'}">👩‍🏫 ${T('teacher')}</button><button data-gt="student" aria-pressed="${tab === 'student'}">🧑‍🎓 ${T('student')}</button></div><div id="gbody"></div>`;
  el.querySelectorAll('[data-gt]').forEach(b => b.onclick = () => { subState.guide = b.dataset.gt; sfx('click'); vGuide(el); });
  const g = $('#gbody', el);
  const li = arr => `<ul class="list">${arr.map(x => `<li><span>${L(x)}</span></li>`).join('')}</ul>`;
  if (tab === 'teacher') {
    g.innerHTML = `<div class="grid-2">
      <div class="card c-red"><h3>🎯 ${L(['教學目標', '教學目標'])}</h3>${li(TEACHER.goals)}</div>
      <div class="card c-teal"><h3>🌟 ${L(['核心素養', '核心素養'])}</h3>${li(TEACHER.competencies)}
        <p style="margin:.8em 0 .3em;font-weight:800">${L(['議題融入', '議題融入'])}</p>${TEACHER.issues.map((x, i) => `<span class="tag" style="--c:var(--${['orange', 'green', 'purple', 'pink'][i]})">${L(x)}</span>`).join('')}</div>
    </div>
    <div class="card" style="margin-top:18px"><h3>🗓️ ${L(['教學流程（建議 3 節課，每節 45 分鐘）', '教學流程（建議 3 節課，一節 45 分鐘）'])}</h3>
      <div class="flow">${TEACHER.flow.map((f, i) => `<div class="flow-card c-${['red', 'teal', 'purple'][i]}"><b style="font-size:21px;font-family:var(--display)">${L(f.p)}</b>${li(f.steps)}</div>`).join('')}</div></div>
    <div class="grid" style="margin-top:18px">
      <div class="card c-orange"><h3>💬 ${L(['關鍵提問', '關鍵提問'])}</h3>${li(TEACHER.questions)}</div>
      <div class="card c-green"><h3>🪜 ${L(['差異化教學', '差異化教學'])}</h3>${li(TEACHER.diff)}</div>
      <div class="card c-purple"><h3>✅ ${L(['評量方式', '評量方式'])}</h3>${li(TEACHER.assess)}</div>
    </div>
    <div class="grid-2" style="margin-top:18px">
      <div class="card"><h3>⏱️ ${L(['課堂計時器', '課堂計時器'])}</h3><div class="timer" id="cd">${pad2(Math.floor(cdLeft / 60))}:${pad2(cdLeft % 60)}</div>
        <div class="row" style="justify-content:center;margin-top:12px">${[1, 3, 5, 10].map(m => `<button class="btn sm ghost" data-min="${m}">${m} ${L(['分', '分'])}</button>`).join('')}<button class="btn sm grn" id="cdGo">${cdTimer ? '⏸️' : '▶️'}</button></div></div>
      <div class="card"><h3>🎲 ${L(['隨機抽號', '隨機抽號'])}</h3><div class="timer" id="pickN" style="color:var(--purple)">?</div>
        <div class="row" style="justify-content:center;margin-top:12px"><label>${L(['人數', '人數'])} <input type="text" inputmode="numeric" id="pickMax" value="${store.get('pickMax', 30)}" style="width:90px;display:inline-block"></label><button class="btn sm pur" id="pickGo">🎲 ${L(['抽！', '抽！'])}</button></div></div>
    </div>`;
    const cd = $('#cd', g), upd = () => cd.textContent = `${pad2(Math.floor(cdLeft / 60))}:${pad2(cdLeft % 60)}`;
    g.querySelectorAll('[data-min]').forEach(b => b.onclick = () => { cdLeft = +b.dataset.min * 60; upd(); sfx('click'); });
    $('#cdGo', g).onclick = e => {
      if (cdTimer) { clearInterval(cdTimer); cdTimer = null; e.target.textContent = '▶️'; return; }
      e.target.textContent = '⏸️';
      cdTimer = setInterval(() => { cdLeft--; if (document.getElementById('cd')) document.getElementById('cd').textContent = `${pad2(Math.floor(cdLeft / 60))}:${pad2(cdLeft % 60)}`; if (cdLeft <= 0) { clearInterval(cdTimer); cdTimer = null; cdLeft = 0; sfx('gong'); toast('⏰ ' + L(['時間到！', '時間到矣！'])); } }, 1000);
    };
    $('#pickGo', g).onclick = () => {
      const max = Math.max(2, Math.min(99, parseInt($('#pickMax', g).value) || 30)); store.set('pickMax', max);
      let n = 0; clearInterval(pickTimer);
      pickTimer = setInterval(() => { $('#pickN', g).textContent = 1 + Math.floor(Math.random() * max); sfx('tick'); if (++n > 18) { clearInterval(pickTimer); sfx('ok'); } }, 70);
    };
  } else {
    const chk = store.get('selfcheck', {});
    g.innerHTML = `<div class="card c-teal"><h3>🎯 ${L(['學完這個單元，我能……', '學了這个單元，我會當……'])}</h3>${li(STUDENT.goals)}</div>
      <div class="card" style="margin-top:18px"><h3>🗺️ ${L(['學習路徑（點選前往）', '學習路線（揤落去就去）'])}</h3>
        <div class="path">${STUDENT.path.map(p => `<button data-go="${p.nav}"><span class="pi">${p.icon}</span>${L(p.t)}${stamps[p.nav] ? ' ✅' : ''}</button>`).join('')}</div></div>
      <div class="grid-2" style="margin-top:18px">
        <div class="card c-yellow"><h3>💡 ${L(['學習小撇步', '學習小撇步'])}</h3>${li(STUDENT.tips)}</div>
        <div class="card"><h3>☑️ ${L(['自我檢核', '家己檢查'])}</h3><div class="checklist list">${STUDENT.check.map((c, i) => `<label><input type="checkbox" data-c="${i}" ${chk[i] ? 'checked' : ''}>${L(c)}</label>`).join('')}</div>
          <p class="muted" style="margin-top:10px" id="chkSum"></p></div>
      </div>`;
    const sum = () => { const n = Object.values(store.get('selfcheck', {})).filter(Boolean).length; $('#chkSum', g).textContent = `${L(['已達成', '已經做著'])} ${n}/${STUDENT.check.length}`; };
    sum();
    g.querySelectorAll('[data-c]').forEach(c => c.onchange = () => { const s = store.get('selfcheck', {}); s[c.dataset.c] = c.checked; store.set('selfcheck', s); sfx(c.checked ? 'ok' : 'click'); sum(); if (c.checked) logEvent('check', '☑️', L(['自我檢核', '家己檢查']), L(STUDENT.check[c.dataset.c])); });
  }
}

/* ================= 認識夜市 ================= */
function vLearn(el) {
  const idx = Math.max(0, Math.min(UNITS.length - 1, subState.learn || 0));
  const u = UNITS[idx], done = store.get('unitsDone', []);
  el.innerHTML = head('📖', 'teal', T('nav_learn'), L(['六個單元，帶你從歷史走到未來。', '六个單元，𤆬你對歷史行到未來。'])) +
    `<div class="unit-nav">${UNITS.map((x, i) => `<button class="unit-btn c-${x.color}" data-u="${i}" aria-current="${i === idx}"><span>${x.icon}</span>${i + 1}. ${L(x.title)}${done.includes(x.id) ? '<span class="done-mark">✓</span>' : ''}</button>`).join('')}</div>
    <article class="c-${u.color}">
      <div class="unit-hero"><span class="big" aria-hidden="true">${u.icon}</span><div><span class="chip">${T('unit')} ${idx + 1}</span><h2>${L(u.title)}</h2><p>${L(u.sum)}</p></div></div>
      ${u.paras.map(p => `<p class="para">${L(p)}</p>`).join('')}
      ${u.timeline ? `<div class="card" style="margin:16px 0"><h3>⏳ ${T('timeline')}</h3><div id="utl"></div></div>` : ''}
      ${u.id === 'u3' ? `<div class="card" style="margin:16px 0"><h3>🗺️ ${L(['動手看地圖', '動手看地圖'])}</h3><div id="umap"></div></div>` : ''}
      <div class="card" style="margin:16px 0"><h3>📌 ${T('keyPoints')}</h3><ul class="list">${u.points.map(p => `<li><span>${L(p)}</span></li>`).join('')}</ul></div>
      <div class="card think"><h3>🤔 ${T('think')}</h3><p style="font-weight:700">${L(u.think.q)}</p>
        <textarea id="thinkIn" placeholder="${L(['寫下你的想法……', '寫落你的想法……'])}">${esc(store.get('think_' + u.id, ''))}</textarea>
        <div class="row" style="margin-top:10px"><button class="btn sm yel" id="showAns">💡 ${T('showAns')}</button></div><div id="ansBox"></div></div>
      <div class="row" style="justify-content:space-between;margin-top:18px">
        <button class="btn ghost" id="uPrev" ${idx === 0 ? 'disabled' : ''}>◀ ${T('prev')}</button>
        <button class="btn grn" id="uDone">${done.includes(u.id) ? '✅ ' + T('done') : '📗 ' + T('markDone')}</button>
        <button class="btn ghost" id="uNext" ${idx === UNITS.length - 1 ? 'disabled' : ''}>${T('next')} ▶</button>
      </div>
    </article>`;
  if (u.timeline) renderTimeline($('#utl', el), false);
  if (u.id === 'u3') wMap($('#umap', el));
  el.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { subState.learn = +b.dataset.u; sfx('flip'); vLearn(el); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#uPrev', el).onclick = () => { subState.learn = idx - 1; sfx('flip'); vLearn(el); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#uNext', el).onclick = () => { subState.learn = idx + 1; sfx('flip'); vLearn(el); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#thinkIn', el).oninput = e => store.set('think_' + u.id, e.target.value);
  $('#showAns', el).onclick = () => {
    const ans = $('#thinkIn', el).value.trim();
    $('#ansBox', el).innerHTML = `<div class="think-ans">💡 ${L(u.think.a)}</div>`; sfx('pop');
    if (ans) logEvent('think', '🤔', `${L(u.title)}・${T('think')}`, ans);
  };
  $('#uDone', el).onclick = () => {
    const d = store.get('unitsDone', []);
    if (!d.includes(u.id)) { d.push(u.id); store.set('unitsDone', d); logEvent('unit', u.icon, `${T('unit')} ${idx + 1}：${L(u.title)}`, L(['完成閱讀', '讀了矣'])); sfx('ok'); }
    if (d.length === UNITS.length) { stamp('units'); confetti(); }
    if (idx < UNITS.length - 1) subState.learn = idx + 1;
    vLearn(el); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  logOnce('unit-view:' + u.id, 'read', u.icon, `${L(['閱讀', '讀'])}${T('unit')} ${idx + 1}`, L(u.title));
}

/* ================= 互動探索 ================= */
function vExplore(el) {
  const cur = WIDGETS.find(w => w.id === subState.explore) || WIDGETS[0];
  el.innerHTML = head('🎮', 'purple', T('nav_explore'), L([`${WIDGETS.length} 個互動元件，動手玩出夜市知識！`, `${WIDGETS.length} 个互動元件，動手耍出夜市仔的知識！`])) +
    `<div class="wnav">${WIDGETS.map(w => `<button class="c-${w.c}" data-w="${w.id}" aria-current="${w.id === cur.id}"><span class="wi">${w.icon}</span>${L(w.t)}</button>`).join('')}</div>
    <section class="card widget c-${cur.c}"><h2><span>${cur.icon}</span>${L(cur.t)}</h2><p class="lead">${L(cur.lead)}</p><div id="wbody"></div></section>`;
  el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { subState.explore = b.dataset.w; sfx('pop'); vExplore(el); });
  WIDGET_RENDER[cur.id]($('#wbody', el));
  logOnce('w:' + cur.id, 'explore', cur.icon, L(['操作互動元件', '操作互動元件']), L(cur.t));
}

/* ================= 進階延伸 ================= */
const STALL_EMOJI = ['🍢', '🍗', '🧋', '🦪', '🌽', '🍡', '🍧', '🎯', '🎈', '🧸'];
function vAdv(el) {
  const field = store.get('field', {}), st = store.get('stall', { name: '', e: '🍢', item: '', price: '', slogan: '', eco: '' });
  el.innerHTML = head('🔭', 'green', T('nav_adv'), L(['深入夜市經濟、國際觀光與永續，再挑戰探究任務！', '深入夜市仔經濟、國際觀光佮永續，閣挑戰探究任務！'])) +
    `<div class="grid-2">${ADVANCED.map(a => `<div class="card adv-card c-${a.color}"><h3><span>${a.icon}</span>${L(a.t)}</h3>${a.world ?
      `<div class="table-wrap"><table><thead><tr><th>${L(['地點', '所在'])}</th><th>${L(['形式', '形式'])}</th><th>${L(['特色', '特色'])}</th></tr></thead><tbody>${WORLD.map(w => `<tr><td><b>${w.flag} ${L(w.place)}</b></td><td>${L(w.form)}</td><td>${L(w.feat)}</td></tr>`).join('')}</tbody></table></div>` :
      `<ul class="list">${a.body.map(b => `<li><span>${L(b)}</span></li>`).join('')}</ul>`}</div>`).join('')}</div>
    <div class="card" style="margin-top:18px"><h2>🔍 ${L(['探究任務一：夜市田野調查單', '探究任務一：夜市仔田野調查單'])}</h2>
      <p class="muted">${L(['實際走訪一個夜市（或上網查資料），完成下列調查。內容會自動儲存。', '實際去踅一个夜市仔（抑是上網查資料），完成下面的調查。內容會自動儲存。'])}</p>
      <div class="form-grid">${FIELD_QS.map((q, i) => `<label class="field"><span>${i + 1}. ${L(q)}</span><textarea data-f="${i}" rows="2">${esc(field[i] || '')}</textarea></label>`).join('')}</div>
      <div class="row"><button class="btn grn" id="fSave">💾 ${L(['完成並記錄', '完成閣記錄'])}</button><button class="btn ghost" id="fDl">⬇️ ${L(['下載調查單 (.txt)', '下載調查單 (.txt)'])}</button></div></div>
    <div class="card" style="margin-top:18px"><h2>🎨 ${L(['探究任務二：設計我的夜市攤位', '探究任務二：設計我的夜市攤仔'])}</h2>
      <div class="sim-grid">
        <div class="form-grid">
          <label class="field"><span>${L(['攤位名稱', '攤仔名'])}</span><input type="text" data-s="name" maxlength="12" value="${esc(st.name)}" placeholder="${L(['例：阿嬤的古早味', '例：阿媽的古早味'])}"></label>
          <div class="field"><span>${L(['招牌圖示', '招牌圖示'])}</span><div class="row">${STALL_EMOJI.map(e => `<button class="pill" data-se="${e}" style="${st.e === e ? 'background:var(--yellow)' : ''}">${e}</button>`).join('')}</div></div>
          <label class="field"><span>${L(['主打商品', '主打商品'])}</span><input type="text" data-s="item" maxlength="14" value="${esc(st.item)}"></label>
          <label class="field"><span>${L(['售價（元）', '賣價（箍）'])}</span><input type="text" inputmode="numeric" data-s="price" maxlength="5" value="${esc(st.price)}"></label>
          <label class="field"><span>${L(['宣傳口號', '宣傳口號'])}</span><input type="text" data-s="slogan" maxlength="20" value="${esc(st.slogan)}"></label>
          <label class="field"><span>${L(['我的環保做法', '我的環保做法'])}</span><input type="text" data-s="eco" maxlength="22" value="${esc(st.eco)}"></label>
        </div>
        <div><canvas id="poster" width="600" height="800" class="stall-poster" aria-label="poster"></canvas>
          <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="pDl">🖼️ ${L(['下載海報 PNG', '下載海報 PNG'])}</button><button class="btn alt" id="pLog">📒 ${L(['記錄到歷程', '記錄去跤跡'])}</button></div></div>
      </div></div>
    <div class="card think" style="margin-top:18px"><h3>📚 ${L(['延伸搜尋關鍵字', '延伸揣資料的關鍵字'])}</h3>
      <div class="row">${['臺灣夜市 歷史', '輪流夜市', '夜市 群聚效應', '新加坡 小販文化 UNESCO', '米其林 必比登 夜市', '夜市 減塑'].map(k => `<span class="chip">🔎 ${k}</span>`).join('')}</div></div>`;
  el.querySelectorAll('[data-f]').forEach(t => t.oninput = () => { const f = store.get('field', {}); f[t.dataset.f] = t.value; store.set('field', f); });
  $('#fSave', el).onclick = () => {
    const f = store.get('field', {}), n = Object.values(f).filter(v => v && v.trim()).length;
    if (!n) { toast(L(['請先填寫內容', '請先寫內容'])); sfx('bad'); return; }
    logEvent('task', '🔍', L(['田野調查單', '田野調查單']), `${L(['完成', '完成'])} ${n}/${FIELD_QS.length} ${L(['題', '題'])}：${(f[0] || '').slice(0, 30)}`); sfx('ok'); toast(T('toastSaved'));
  };
  $('#fDl', el).onclick = () => {
    const f = store.get('field', {}), info = store.get('info', {});
    const txt = `${L(['夜市田野調查單', '夜市仔田野調查單'])}\n${T('yourClass')}：${info.cls || ''}　${T('yourNo')}：${info.no || ''}　${T('yourName')}：${info.name || ''}\n${fmtTime(Date.now())}\n\n` + FIELD_QS.map((q, i) => `${i + 1}. ${L(q)}\n${f[i] || ''}\n`).join('\n');
    downloadFile('夜市田野調查單.txt', txt, 'text/plain'); sfx('coin');
  };
  const draw = () => drawPoster($('#poster', el), store.get('stall', st));
  el.querySelectorAll('[data-s]').forEach(i => i.oninput = () => { const s = store.get('stall', st); s[i.dataset.s] = i.value; store.set('stall', s); draw(); });
  el.querySelectorAll('[data-se]').forEach(b => b.onclick = () => { const s = store.get('stall', st); s.e = b.dataset.se; store.set('stall', s); sfx('pop'); vAdv(el); });
  $('#pDl', el).onclick = () => { const a = document.createElement('a'); a.href = $('#poster', el).toDataURL('image/png'); a.download = '我的夜市攤位.png'; a.click(); sfx('coin'); };
  $('#pLog', el).onclick = () => { const s = store.get('stall', st); if (!s.name) { toast(L(['請先取個攤位名稱', '請先號一个攤仔名'])); sfx('bad'); return; } logEvent('task', '🎨', L(['設計我的攤位', '設計我的攤仔']), `${s.e} ${s.name}｜${s.item} $${s.price}｜${s.slogan}｜♻️ ${s.eco}`); sfx('win'); confetti(); toast(T('toastSaved')); };
  draw();
}
function drawPoster(c, s) {
  const x = c.getContext('2d'), W = 600, H = 800, F = '"Huninn","Noto Sans TC","Microsoft JhengHei",sans-serif';
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff9f45'); g.addColorStop(.5, '#ff6f61'); g.addColorStop(1, '#7a5cd6');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.15 + (i % 3) * .1) + ')'; x.beginPath(); x.arc((i * 137) % W, (i * 71) % 260, 2 + i % 3, 0, 7); x.fill(); }
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : '#ef4136'; x.fillRect(i * 75, 70, 75, 70); x.beginPath(); x.arc(i * 75 + 37.5, 140, 37.5, 0, Math.PI); x.fill(); }
  x.fillStyle = '#fff8ec'; roundRect(x, 50, 220, 500, 520, 36); x.fill();
  x.textAlign = 'center'; x.font = `150px ${F}`; x.fillText(s.e || '🍢', W / 2, 400);
  x.fillStyle = '#ef4136'; x.font = `900 60px ${F}`; x.fillText(s.name || L(['我的攤位', '我的攤仔']), W / 2, 490, 460);
  x.fillStyle = '#2b2236'; x.font = `700 38px ${F}`; x.fillText(`${s.item || L(['主打商品', '主打商品'])}${s.price ? '　$' + s.price : ''}`, W / 2, 555, 460);
  x.fillStyle = '#7a5cd6'; x.font = `700 32px ${F}`; x.fillText(s.slogan ? `「${s.slogan}」` : '', W / 2, 615, 470);
  if (s.eco) { x.fillStyle = '#22b36b'; roundRect(x, 90, 650, 420, 56, 28); x.fill(); x.fillStyle = '#fff'; x.font = `700 26px ${F}`; x.fillText('♻️ ' + s.eco, W / 2, 688, 400); }
  x.fillStyle = '#fff'; x.font = `700 26px ${F}`; x.fillText('🏮 ' + T('appTitle') + '・' + T('appSub'), W / 2, 780);
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

/* ================= 練習 ================= */
const MODES = [
  { id: 'flash', i: '🃏', c: 'orange', t: ['小吃閃卡', '小食閃卡'], d: ['國語↔台語', '國語↔台語'] },
  { id: 'tf', i: '⭕', c: 'teal', t: ['是非快答', '是非緊答'], d: ['10 題', '10 題'] },
  { id: 'match', i: '🔗', c: 'purple', t: ['夜市配對', '夜市仔配對'], d: ['夜市↔城市', '夜市仔↔城市'] },
  { id: 'sort', i: '♻️', c: 'green', t: ['垃圾分類', '垃圾分類'], d: ['12 樣物品', '12 項物件'] },
  { id: 'order', i: '🔢', c: 'red', t: ['時間排序', '時間排序'], d: ['夜市演變', '夜市仔演變'] },
];
let P = null; // 目前練習狀態
function bestSet(mode, pct) { const b = store.get('best', {}); const cnt = store.get('pcount', {}); cnt[mode] = (cnt[mode] || 0) + 1; store.set('pcount', cnt); if (pct > (b[mode] ?? -1)) { b[mode] = pct; store.set('best', b); } }
function vPractice(el) {
  const best = store.get('best', {});
  el.innerHTML = head('✏️', 'pink', T('nav_practice'), L(['題目每次都會重新洗牌，可以一直練到熟練！', '題目逐擺攏會重洗，會當一直練到熟！'])) +
    `<div class="mode-grid">${MODES.map(m => `<button class="mode c-${m.c}" data-m="${m.id}" aria-current="${P && P.mode === m.id}"><span class="mi">${m.i}</span>${L(m.t)}<small style="opacity:.9">${L(m.d)}${best[m.id] != null ? `｜${L(['最佳', '上好'])} ${best[m.id]}%` : ''}</small></button>`).join('')}</div><div id="pbody"></div>`;
  el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { startPractice(b.dataset.m); sfx('pop'); vPractice(el); });
  const box = $('#pbody', el);
  if (!P) { box.innerHTML = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:64px">👆</div><p style="font-size:22px;font-weight:700">${L(['選一種練習模式開始吧！', '揀一款練習模式來開始！'])}</p></div>`; return; }
  ({ flash: pFlash, tf: pTF, match: pMatch, sort: pSort, order: pOrder })[P.mode](box, el);
}
function startPractice(mode) {
  if (mode === 'flash') P = { mode, deck: shuffle(FOODS.map((_, i) => i)), i: 0, known: 0, flip: false };
  if (mode === 'tf') P = { mode, list: shuffle(TF).slice(0, 10), i: 0, ok: 0, ans: null };
  if (mode === 'match') { const pairs = shuffle(MATCH).slice(0, 5); P = { mode, pairs, right: shuffle(pairs.map((_, i) => i)), sel: null, done: [], miss: 0 }; }
  if (mode === 'sort') P = { mode, list: shuffle(TRASH), i: 0, ok: 0, fb: null };
  if (mode === 'order') { let o; do { o = shuffle(TIMELINE.map((_, i) => i)); } while (o.every((v, i) => v === i)); P = { mode, order: o, checked: false }; }
}
function finishPractice(box, el, ok, total, label) {
  const pct = Math.round(ok / total * 100);
  bestSet(P.mode, pct);
  logEvent('practice', MODES.find(m => m.id === P.mode).i, `${T('nav_practice')}：${label}`, `${ok}/${total}`, pct);
  stamp('practice');
  sfx(pct >= 80 ? 'win' : 'ok'); if (pct >= 80) confetti();
  const mode = P.mode;
  box.innerHTML = `<div class="card result"><div style="font-size:60px">${pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div><div class="big-score">${pct}<small style="font-size:.35em">%</small></div>
    <p style="font-size:22px;font-weight:700">${label}：${ok} / ${total}</p><p class="muted">${pct >= 80 ? L(['太厲害了！', '傷厲害矣！']) : L(['多練幾次會更熟練喔！', '加練幾擺會較熟喔！'])}</p>
    <button class="btn" id="again">🔁 ${T('again')}</button></div>`;
  $('#again', box).onclick = () => { startPractice(mode); sfx('pop'); vPractice(el); };
}
function pFlash(box, el) {
  if (P.i >= P.deck.length) return finishPractice(box, el, P.known, P.deck.length, L(['小吃閃卡', '小食閃卡']));
  const f = FOODS[P.deck[P.i]];
  box.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><b>${P.i + 1} / ${P.deck.length}</b><span class="chip">✅ ${P.known}</span></div>
    <div class="progress"><i style="width:${P.i / P.deck.length * 100}%"></i></div>
    <div class="flash fcard${P.flip ? ' flip' : ''}" id="fc" role="button" tabindex="0"><div class="fcard-in">
      <div class="fface"><span class="fe">${f.e}</span><b style="font-size:34px">${f.zh}</b><span class="muted">${L(['台語怎麼說？點卡片翻面', '台語按怎講？揤卡片翻面'])}</span></div>
      <div class="fface back c-orange"><span style="font-size:50px">${f.e}</span><b style="font-size:34px">${f.tw}</b><span class="tl-rom" style="font-size:22px">${f.tl}</span><p style="margin:.4em 0 0">${L(f.d)}</p></div>
    </div></div>
    <div class="row" style="justify-content:center;margin-top:16px"><button class="btn ghost" id="fNo">🔁 ${L(['再練習', '閣練'])}</button><button class="btn grn" id="fYes">✅ ${L(['我會了', '我會矣'])}</button></div></div>`;
  const fc = $('#fc', box);
  const flip = () => { P.flip = !P.flip; fc.classList.toggle('flip', P.flip); sfx('flip'); };
  fc.onclick = flip; fc.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
  $('#fYes', box).onclick = () => { P.known++; P.i++; P.flip = false; sfx('ok'); pFlash(box, el); };
  $('#fNo', box).onclick = () => { P.deck.push(P.deck[P.i]); P.deck.splice(P.i, 1); P.flip = false; sfx('click'); if (P.deck.length > 40) P.i++; pFlash(box, el); };
}
function pTF(box, el) {
  if (P.i >= P.list.length) return finishPractice(box, el, P.ok, P.list.length, L(['是非快答', '是非緊答']));
  const [q, a] = P.list[P.i];
  box.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><b>${P.i + 1} / ${P.list.length}</b><span class="chip">✅ ${P.ok}</span></div>
    <div class="progress"><i style="width:${P.i / P.list.length * 100}%"></i></div>
    <p class="qtext">${L(q)}</p>
    <div class="tf-btns"><button class="btn grn" data-a="1" ${P.ans != null ? 'disabled' : ''}>⭕ ${L(['對', '著'])}</button><button class="btn" data-a="0" ${P.ans != null ? 'disabled' : ''}>❌ ${L(['錯', '毋著'])}</button></div>
    ${P.ans != null ? `<div class="feedback ${P.ans === a ? 'ok' : 'no'}">${P.ans === a ? '🎉 ' + T('correct') : '😮 ' + L(['正確答案是', '正確答案是']) + '「' + (a ? L(['對', '著']) : L(['錯', '毋著'])) + '」'}</div><div class="row" style="margin-top:12px"><button class="btn alt" id="tfNext">${T('nextQ')} ▶</button></div>` : ''}</div>`;
  box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { P.ans = b.dataset.a === '1'; if (P.ans === a) { P.ok++; sfx('ok'); } else sfx('bad'); pTF(box, el); });
  const n = $('#tfNext', box); if (n) { n.onclick = () => { P.i++; P.ans = null; sfx('click'); pTF(box, el); }; n.focus(); }
}
function pMatch(box, el) {
  if (P.done.length === P.pairs.length) return finishPractice(box, el, P.pairs.length, P.pairs.length + P.miss, L(['夜市配對（含錯誤次數）', '夜市仔配對（含毋著的次數）']));
  box.innerHTML = `<div class="card"><p class="muted">${L(['先點左邊的夜市，再點右邊的城市。', '先揤倒爿的夜市仔，才揤正爿的城市。'])}　❌ ${P.miss}</p>
    <div class="match-cols"><div>${P.pairs.map((p, i) => `<button class="mbtn${P.done.includes(i) ? ' ok' : ''}${P.sel === i ? ' sel' : ''}" data-l="${i}" ${P.done.includes(i) ? 'disabled' : ''}>🏮 ${L(p[0])}</button>`).join('')}</div>
    <div>${P.right.map(i => `<button class="mbtn${P.done.includes(i) ? ' ok' : ''}" data-r="${i}" ${P.done.includes(i) ? 'disabled' : ''}>📍 ${L(P.pairs[i][1])}</button>`).join('')}</div></div></div>`;
  box.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { P.sel = +b.dataset.l; sfx('click'); pMatch(box, el); });
  box.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    if (P.sel == null) { toast(L(['請先點左邊的夜市', '請先揤倒爿的夜市仔'])); return; }
    const r = +b.dataset.r;
    // 城市相同也算對（如兩個夜市同城）
    if (L(P.pairs[r][1]) === L(P.pairs[P.sel][1])) { P.done.push(P.sel); if (r !== P.sel) { const k = P.right.indexOf(r), j = P.right.indexOf(P.sel); [P.right[k], P.right[j]] = [P.right[j], P.right[k]]; } P.sel = null; sfx('ok'); pMatch(box, el); }
    else { P.miss++; sfx('bad'); b.classList.add('bad'); setTimeout(() => pMatch(box, el), 400); }
  });
}
function pSort(box, el) {
  if (P.i >= P.list.length) return finishPractice(box, el, P.ok, P.list.length, L(['垃圾分類', '垃圾分類']));
  const it = P.list[P.i];
  box.innerHTML = `<div class="card" style="text-align:center"><div class="row" style="justify-content:space-between"><b>${P.i + 1} / ${P.list.length}</b><span class="chip">✅ ${P.ok}</span></div>
    <div class="progress"><i style="width:${P.i / P.list.length * 100}%"></i></div>
    <p class="muted">${L(['這個要丟到哪裡？', '這愛擲去佗位？'])}</p><div class="sort-item"><span style="font-size:52px">${it.e}</span>${L(it.n)}</div>
    ${P.fb ? `<div class="feedback ${P.fb.ok ? 'ok' : 'no'}">${P.fb.ok ? '🎉 ' + T('correct') : '😮 ' + L(['應該丟「', '應該擲「']) + L(BINS[it.b]) + '」'}</div>` : ''}
    <div class="bins">${Object.keys(BINS).map(k => `<button class="bin ${k}" data-b="${k}" ${P.fb ? 'disabled' : ''}><span class="bi">${{ trash: '🗑️', recycle: '♻️', food: '🥬' }[k]}</span>${L(BINS[k])}</button>`).join('')}</div></div>`;
  box.querySelectorAll('[data-b]').forEach(b => b.onclick = () => {
    const ok = b.dataset.b === it.b; if (ok) P.ok++; P.fb = { ok }; sfx(ok ? 'ok' : 'bad'); pSort(box, el);
    setTimeout(() => { P.i++; P.fb = null; if (box.isConnected) pSort(box, el); }, ok ? 700 : 1500);
  });
}
function pOrder(box, el) {
  box.innerHTML = `<div class="card"><p class="muted">${L(['用 ▲▼ 把夜市的發展依時間先後排好（上＝最早）。', '用 ▲▼ 共夜市仔的發展照時間先後排好（頂懸＝上早）。'])}</p>
    <div class="order-list">${P.order.map((t, i) => `<div class="order-item${P.checked ? (t === i ? ' ok' : ' bad') : ''}"><span class="oi">${TIMELINE[t].icon}</span><span>${L(TIMELINE[t].t)}${P.checked ? `<br><small class="muted">${L(TIMELINE[t].era)}</small>` : ''}</span>
      <span class="mv"><button data-up="${i}" ${i === 0 || P.checked ? 'disabled' : ''} aria-label="up">▲</button><button data-dn="${i}" ${i === P.order.length - 1 || P.checked ? 'disabled' : ''} aria-label="down">▼</button></span></div>`).join('')}</div>
    <div class="row" style="margin-top:14px">${P.checked ? `<button class="btn" id="oFin">${T('finish')} ▶</button>` : `<button class="btn alt" id="oChk">✔️ ${T('check')}</button>`}</div></div>`;
  box.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; [P.order[i - 1], P.order[i]] = [P.order[i], P.order[i - 1]]; sfx('tick'); pOrder(box, el); });
  box.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { const i = +b.dataset.dn; [P.order[i + 1], P.order[i]] = [P.order[i], P.order[i + 1]]; sfx('tick'); pOrder(box, el); });
  const c = $('#oChk', box); if (c) c.onclick = () => { P.checked = true; const ok = P.order.filter((t, i) => t === i).length; sfx(ok === P.order.length ? 'ok' : 'bad'); pOrder(box, el); };
  const f = $('#oFin', box); if (f) f.onclick = () => finishPractice(box, el, P.order.filter((t, i) => t === i).length, P.order.length, L(['時間排序', '時間排序']));
}

/* ================= 測驗 ================= */
let Q = null;
function vQuiz(el) {
  el.innerHTML = head('📝', 'blue', T('nav_quiz'), L(['驗證你的學習成果，80 分以上就能獲得「夜市達人」章！', '驗證你的學習成果，80 分以上就會當提著「夜市達人」印仔！'])) + '<div id="qbody"></div>';
  const box = $('#qbody', el);
  if (!Q) {
    const hist = LOG.filter(x => x.type === 'quiz');
    box.innerHTML = `<div class="grid-2"><div class="card" style="text-align:center"><div style="font-size:72px">📝</div><h2>${L(['準備好了嗎？', '準備好矣未？'])}</h2>
      <p class="muted">${L([`題庫共 ${QUIZ.length} 題，每次隨機抽題、選項順序也會打亂。`, `題庫總共 ${QUIZ.length} 題，逐擺隨機抽題、選項順序嘛會拍亂。`])}</p>
      <div class="row" style="justify-content:center"><button class="btn alt" data-n="10">⚡ 10 ${L(['題', '題'])}</button><button class="btn pur" data-n="20">🔥 20 ${L(['題', '題'])}</button></div></div>
      <div class="card"><h3>📈 ${L(['我的測驗紀錄', '我的小考紀錄'])}</h3>${hist.length ? `<div class="bars">${hist.slice(-6).map(h => `<div class="barrow c-${h.score >= 80 ? 'green' : h.score >= 60 ? 'orange' : 'red'}"><span style="font-size:15px">${fmtTime(h.t).slice(5)}</span><span class="bt"><i style="width:${h.score}%"></i></span><b>${h.score}</b></div>`).join('')}</div>` : `<p class="muted">${T('noRecord')}</p>`}</div></div>`;
    box.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      const list = shuffle(QUIZ).slice(0, +b.dataset.n).map(q => ({ q, order: shuffle(q.o.map((_, i) => i)) }));
      Q = { list, i: 0, picks: [], start: Date.now() }; sfx('gong'); vQuiz(el);
    });
    return;
  }
  if (Q.i >= Q.list.length) return quizResult(box, el);
  const item = Q.list[Q.i], picked = Q.picks[Q.i];
  box.innerHTML = `<div class="card"><div class="row" style="justify-content:space-between"><b>${L(['第', '第'])} ${Q.i + 1} / ${Q.list.length} ${L(['題', '題'])}</b><span class="chip">⏱️ <span id="qclock">0:00</span></span></div>
    <div class="progress"><i style="width:${Q.i / Q.list.length * 100}%"></i></div>
    <p class="qtext">${L(item.q.q)}</p>
    <div class="opts">${item.order.map((oi, k) => `<button class="opt${picked != null ? (oi === item.q.a ? ' right' : picked === oi ? ' bad' : '') : ''}" data-o="${oi}" ${picked != null ? 'disabled' : ''}><span class="k">${'ABCD'[k]}</span>${L(item.q.o[oi])}</button>`).join('')}</div>
    ${picked != null ? `<div class="feedback ${picked === item.q.a ? 'ok' : 'no'}">${picked === item.q.a ? '🎉 ' + T('correct') : '💡 ' + T('wrong')}　${L(item.q.x)}</div>
      <div class="row" style="margin-top:12px"><button class="btn alt" id="qNext">${Q.i === Q.list.length - 1 ? T('finish') : T('nextQ')} ▶</button></div>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" id="qQuit">✕ ${L(['放棄本次測驗', '放棄這擺小考'])}</button></div></div>`;
  const clk = () => { const c = document.getElementById('qclock'); if (!c || !Q) return; const s = Math.floor((Date.now() - Q.start) / 1000); c.textContent = `${Math.floor(s / 60)}:${pad2(s % 60)}`; };
  clk(); clearInterval(vQuiz._t); vQuiz._t = setInterval(clk, 1000);
  box.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { Q.picks[Q.i] = +b.dataset.o; sfx(+b.dataset.o === item.q.a ? 'ok' : 'bad'); vQuiz(el); });
  const n = $('#qNext', box); if (n) { n.onclick = () => { Q.i++; sfx('click'); vQuiz(el); }; n.focus({ preventScroll: true }); }
  $('#qQuit', box).onclick = () => { if (confirm(L(['確定放棄嗎？', '確定欲放棄？']))) { Q = null; vQuiz(el); } };
}
function quizResult(box, el) {
  clearInterval(vQuiz._t);
  const ok = Q.list.filter((it, i) => Q.picks[i] === it.q.a).length, total = Q.list.length, score = Math.round(ok / total * 100);
  const sec = Math.floor((Date.now() - Q.start) / 1000);
  if (!Q.logged) {
    Q.logged = true;
    logEvent('quiz', '📝', `${T('nav_quiz')}（${total} ${L(['題', '題'])}）`, `${L(['答對', '答著'])} ${ok}/${total}｜${L(['用時', '用時'])} ${Math.floor(sec / 60)}:${pad2(sec % 60)}`, score);
    if (score >= 80) { stamp('master'); confetti(); sfx('win'); } else sfx('ok');
  }
  box.innerHTML = `<div class="card result"><div style="font-size:60px">${score >= 80 ? '🏆' : score >= 60 ? '👍' : '📚'}</div><div class="big-score">${score}</div><p style="font-size:22px;font-weight:700">${L(['答對', '答著'])} ${ok} / ${total}｜⏱️ ${Math.floor(sec / 60)}:${pad2(sec % 60)}</p>
    <p class="muted">${score >= 80 ? L(['恭喜通過！你已經是夜市達人！', '恭喜過關！你已經是夜市達人矣！']) : L(['建議回到「認識夜市」複習後再挑戰。', '建議轉去「熟似夜市仔」複習了後閣挑戰。'])}</p>
    <div class="row" style="justify-content:center"><button class="btn" id="qAgain">🔁 ${L(['再測一次', '閣考一擺'])}</button><button class="btn ghost" data-go="learn">📖 ${L(['回去複習', '轉去複習'])}</button></div>
    <div class="review">${Q.list.map((it, i) => { const r = Q.picks[i] === it.q.a; return `<div class="ri${r ? '' : ' no'}"><b>${r ? '✅' : '❌'} ${i + 1}. ${L(it.q.q)}</b><br>${L(['正解', '正解'])}：${L(it.q.o[it.q.a])}${r ? '' : `｜${L(['你的答案', '你的答案'])}：${L(it.q.o[Q.picks[i]])}`}<br><small class="muted">${L(it.q.x)}</small></div>`; }).join('')}</div></div>`;
  $('#qAgain', box).onclick = () => { Q = null; vQuiz(el); };
}

/* ================= 學習歷程 ================= */
function downloadFile(name, content, type) {
  const blob = new Blob([type.startsWith('text/csv') ? '﻿' + content : content], { type: type + ';charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const TYPE_NAME = { visit: ['瀏覽', '瀏覽'], read: ['閱讀', '讀'], unit: ['完成單元', '完成單元'], think: ['想一想', '想看覓'], explore: ['互動探索', '互動探索'], practice: ['練習', '練習'], quiz: ['測驗', '小考'], task: ['探究任務', '探究任務'], check: ['自我檢核', '家己檢查'], badge: ['成就', '成就'] };
function vLog(el) {
  const info = store.get('info', {}), best = store.get('best', {}), cnt = store.get('pcount', {});
  const quizzes = LOG.filter(x => x.type === 'quiz'), bestQ = quizzes.length ? Math.max(...quizzes.map(q => q.score)) : null;
  const units = store.get('unitsDone', []).length;
  el.innerHTML = head('📒', 'yellow', T('nav_log'), L(['每一步學習都會自動記錄，可以下載交給老師。', '逐步學習攏會自動記錄，會當下載交予老師。'])) +
    `<div class="card"><h3>🧑‍🎓 ${L(['學生資料', '學生資料'])}</h3><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr))">
      <label class="field"><span>${T('yourClass')}</span><input type="text" id="iCls" value="${esc(info.cls || '')}" maxlength="10"></label>
      <label class="field"><span>${T('yourNo')}</span><input type="text" id="iNo" value="${esc(info.no || '')}" maxlength="4" inputmode="numeric"></label>
      <label class="field"><span>${T('yourName')}</span><input type="text" id="iName" value="${esc(info.name || '')}" maxlength="12"></label></div></div>
    <div class="stats">
      <div class="stat c-teal"><b>${Math.floor(secs / 60)}</b><span>${L(['學習分鐘', '學習分鐘'])}</span></div>
      <div class="stat c-red"><b>${units}/6</b><span>${L(['完成單元', '完成單元'])}</span></div>
      <div class="stat c-purple"><b>${Object.values(cnt).reduce((a, b) => a + b, 0)}</b><span>${L(['練習次數', '練習次數'])}</span></div>
      <div class="stat c-orange"><b>${bestQ ?? '—'}</b><span>${L(['測驗最高分', '小考上懸分'])}</span></div>
    </div>
    <div class="grid-2">
      <div class="card"><h3>📊 ${L(['練習最佳答對率', '練習上好答著率'])}</h3><div class="bars">${MODES.map(m => `<div class="barrow c-${m.c}"><span>${m.i} ${L(m.t)}</span><span class="bt"><i style="width:${best[m.id] || 0}%"></i></span><b>${best[m.id] != null ? best[m.id] + '%' : '—'}</b></div>`).join('')}</div></div>
      <div class="card"><h3>🎫 ${T('stampCard')}（${Object.keys(stamps).length}/10）</h3><div class="stamps-wrap"><div class="stamps">${STAMPS.map(s => `<div class="stamp${stamps[s.id] ? ' on' : ''}" title="${L(s.n)}">${s.i}<small>${L(s.n)}</small></div>`).join('')}</div></div></div>
    </div>
    <div class="card" style="margin-top:18px"><div class="row" style="justify-content:space-between"><h3 style="margin:0">🕒 ${L(['學習歷程時間軸', '學習跤跡時間軸'])}（${LOG.length}）</h3>
      <div class="row"><button class="btn sm grn" id="dCsv">⬇️ CSV</button><button class="btn sm alt" id="dTxt">⬇️ ${L(['學習報告', '學習報告'])} TXT</button><button class="btn sm pur" id="dJson">⬇️ JSON</button><button class="btn sm ghost" id="dPrint">🖨️</button><button class="btn sm ghost" id="dClear">🗑️ ${T('clear')}</button></div></div>
      <hr class="dash"><div class="log-list">${LOG.length ? LOG.slice().reverse().map(x => `<div class="log-item"><span class="li">${x.icon}</span><div><b>${esc(x.title)}${x.score != null ? `　<span class="chip">${x.score}${x.type === 'quiz' ? L(['分', '分']) : '%'}</span>` : ''}</b><span>${esc(L(TYPE_NAME[x.type] || x.type))}${x.detail ? '｜' + esc(x.detail) : ''}</span></div><time>${fmtTime(x.t)}</time></div>`).join('') : `<p class="muted" style="text-align:center">${T('noRecord')}</p>`}</div></div>`;
  ['iCls', 'iNo', 'iName'].forEach(id => $('#' + id, el).oninput = () => store.set('info', { cls: $('#iCls', el).value, no: $('#iNo', el).value, name: $('#iName', el).value }));
  const who = () => { const i = store.get('info', {}); return `${i.cls || ''}_${i.no || ''}_${i.name || ''}`.replace(/^_+|_+$/g, '') || L(['學生', '學生']); };
  $('#dCsv', el).onclick = () => {
    const i = store.get('info', {});
    const rows = [['班級', '座號', '姓名', '時間', '類型', '項目', '內容', '分數']].concat(LOG.map(x => [i.cls || '', i.no || '', i.name || '', fmtTime(x.t), (TYPE_NAME[x.type] || [x.type])[0], x.title, x.detail, x.score ?? '']));
    downloadFile(`台灣的夜市_學習歷程_${who()}.csv`, rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n'), 'text/csv'); sfx('coin');
  };
  $('#dJson', el).onclick = () => { downloadFile(`台灣的夜市_學習歷程_${who()}.json`, JSON.stringify({ info: store.get('info', {}), minutes: Math.floor(secs / 60), unitsDone: store.get('unitsDone', []), best, stamps: Object.keys(stamps), log: LOG }, null, 2), 'application/json'); sfx('coin'); };
  $('#dTxt', el).onclick = () => {
    const i = store.get('info', {});
    const think = UNITS.map((u, k) => { const v = store.get('think_' + u.id, ''); return v ? `【${T('unit')}${k + 1} ${L(u.title)}】${v}` : ''; }).filter(Boolean).join('\n');
    const txt = `🏮 ${T('appTitle')}・${L(['學習報告', '學習報告'])}\n${T('yourClass')}：${i.cls || ''}　${T('yourNo')}：${i.no || ''}　${T('yourName')}：${i.name || ''}\n${L(['產出時間', '產出時間'])}：${fmtTime(Date.now())}\n\n` +
      `■ ${L(['學習時間', '學習時間'])}：${Math.floor(secs / 60)} ${L(['分鐘', '分鐘'])}\n■ ${L(['完成單元', '完成單元'])}：${units}/6\n■ ${L(['測驗最高分', '小考上懸分'])}：${bestQ ?? '—'}\n■ ${L(['集點', '集點'])}：${Object.keys(stamps).length}/10\n` +
      `■ ${L(['練習最佳答對率', '練習上好答著率'])}：\n${MODES.map(m => `   - ${L(m.t)}：${best[m.id] != null ? best[m.id] + '%' : '—'}`).join('\n')}\n\n■ ${L(['我的想法', '我的想法'])}：\n${think || '—'}\n\n■ ${L(['歷程明細', '跤跡明細'])}：\n` +
      LOG.map(x => `${fmtTime(x.t)}　[${L(TYPE_NAME[x.type] || x.type)}] ${x.title}${x.detail ? '｜' + x.detail : ''}${x.score != null ? '｜' + x.score : ''}`).join('\n');
    downloadFile(`台灣的夜市_學習報告_${who()}.txt`, txt, 'text/plain'); sfx('coin');
  };
  $('#dPrint', el).onclick = () => window.print();
  $('#dClear', el).onclick = () => {
    if (!confirm(L(['確定要清除所有學習紀錄嗎？此動作無法復原。', '確定欲清掉所有的學習紀錄？這个動作袂當恢復。']))) return;
    LOG = []; store.set('log', LOG); ['unitsDone', 'best', 'pcount', 'stamps', 'selfcheck', 'field', 'secs'].forEach(k => store.set(k, k === 'unitsDone' ? [] : k === 'secs' ? 0 : {}));
    UNITS.forEach(u => store.set('think_' + u.id, '')); stamps = {}; secs = 0; seen.clear(); sfx('bad'); renderTabs(); vLog(el);
  };
}

/* ================= 彩帶 ================= */
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#ef4136', '#ff8a00', '#ffc533', '#22b36b', '#11a6b4', '#7a5cd6', '#ff5d8f'];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)] }));
  let f = 0;
  (function loop() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
    if (++f < 150) requestAnimationFrame(loop); else x.clearRect(0, 0, c.width, c.height);
  })();
}

/* ================= 初始化 ================= */
function init() {
  applySettings(); renderStatic();
  $('#openSettings').onclick = () => openSettings(true);
  $('#closeSettings').onclick = () => openSettings(false);
  $('#drawerMask').onclick = () => openSettings(false);
  $('#resetSettings').onclick = () => { if (document.fullscreenElement) toggleFull(false); const l = lang; Object.assign(S, DEFAULTS); lang = S.lang; applySettings(); renderStatic(); renderTabs(); if (l !== lang) render(); renderSettings(); sfx('pop'); };
  $('#langQuick').onclick = () => setSetting('lang', lang === 'zh' ? 'tw' : 'zh');
  $('#soundQuick').onclick = () => { S.sound = S.sound === 'on' ? 'off' : 'on'; applySettings(); sfx('pop'); renderSettings(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') openSettings(false); });
  addEventListener('resize', () => { const before = document.documentElement.dataset.effLayout; applySettings(); if (before !== document.documentElement.dataset.effLayout) renderTabs(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySettings);
  const [r, sub] = location.hash.slice(1).split('/');
  if (r === 'learn' && sub != null) subState.learn = +sub || 0;
  if (r === 'explore' && sub) subState.explore = sub;
  go(decodeURIComponent(r || 'home'));
  addEventListener('hashchange', () => { const [h, s] = location.hash.slice(1).split('/'); if (h && h !== route) go(decodeURIComponent(h), s != null && h === 'learn' ? +s || 0 : undefined); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.search.includes('nosw')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}
init();
