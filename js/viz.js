/* 台灣的夜市 — 互動視覺化元件 */
'use strict';

const WIDGETS = [
  { id: 'map', icon: '🗺️', c: 'teal', t: ['夜市地圖', '夜市仔地圖'], lead: ['點選地圖上的燈籠，認識全臺知名夜市。紅色＝固定型、紫色＝流動型。', '揤地圖頂面的燈籠，熟似全台出名的夜市仔。紅色＝固定型、紫色＝流動型。'] },
  { id: 'food', icon: '🍢', c: 'orange', t: ['小吃圖鑑', '小食圖鑑'], lead: ['點卡片翻面看介紹，學會用台語說小吃名稱！', '揤卡片翻面看紹介，學會用台語講小食名！'] },
  { id: 'budget', icon: '🪙', c: 'green', t: ['200 元逛夜市', '200 箍踅夜市仔'], lead: ['你只有 200 元，要怎麼吃得滿足又不超支？練習規劃預算。（價格為教學示意）', '你干焦有 200 箍，欲按怎食甲滿足閣無超過？練習規劃預算。（價數是教學示意）'] },
  { id: 'sim', icon: '📈', c: 'red', t: ['攤販經營模擬器', '攤販經營模擬器'], lead: ['選商品、訂價格、看天氣，找出讓利潤最高的價格！', '揀商品、定價數、看天氣，揣出趁上濟的價數！'] },
  { id: 'week', icon: '📅', c: 'purple', t: ['輪流夜市週曆', '輪流夜市週曆'], lead: ['點選星期幾，看看臺南今晚哪個夜市有開！', '揤禮拜幾，看台南今仔暗佗一个夜市仔有開！'] },
  { id: 'ring', icon: '⭕', c: 'pink', t: ['套圈圈與機率', '套圈仔佮機率'], lead: ['每局 50 元、10 個圈，套中就得獎。玩越多局，看看「平均」是賺還是賠？', '一局 50 箍、10 个圈，套著就得獎。耍越濟局，看「平均」是趁抑是了？'] },
  { id: 'timeline', icon: '⏳', c: 'blue', t: ['夜市時光機', '夜市仔時光機'], lead: ['點選年代，或按播放，看夜市如何一路演變。', '揤年代，抑是揤播放，看夜市仔按怎一路演變。'] },
];

/* ---------- 1. 夜市地圖 ---------- */
const TW_OUTLINE = [[25.30,121.54],[25.28,121.62],[25.15,121.75],[25.10,121.90],[25.01,122.00],[24.85,121.83],[24.70,121.82],[24.59,121.87],[24.30,121.75],[24.00,121.63],[23.60,121.50],[23.10,121.38],[22.75,121.17],[22.45,120.95],[22.10,120.88],[21.90,120.85],[21.95,120.72],[22.25,120.62],[22.45,120.48],[22.62,120.27],[22.90,120.17],[23.10,120.08],[23.40,120.12],[23.70,120.18],[24.00,120.38],[24.25,120.50],[24.50,120.65],[24.75,120.90],[24.95,121.05],[25.10,121.30],[25.18,121.42],[25.27,121.50]];
const proj = (lat, lon) => [((lon - 119.85) * 150).toFixed(1), ((25.45 - lat) * 160).toFixed(1)];
let mapSel = 1;
function wMap(el) {
  const pts = TW_OUTLINE.map(p => proj(p[0], p[1]).join(',')).join(' ');
  // 臺北三個夜市點過近，稍微錯開
  const offs = { 1: [-14, -6], 2: [16, 4], 3: [-16, 10] };
  const pins = MARKETS.map((m, i) => {
    let [x, y] = proj(m.lat, m.lon).map(Number);
    if (offs[i]) { x += offs[i][0]; y += offs[i][1]; }
    const col = m.type === 'fixed' ? 'var(--red)' : 'var(--purple)';
    return `<g class="pin${i === mapSel ? ' on' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${L(m.n)}">
      ${i === mapSel ? `<circle class="pulse" cx="${x}" cy="${y}" r="10" fill="${col}" opacity=".5"/>` : ''}
      <line x1="${x}" y1="${y - 26}" x2="${x}" y2="${y - 34}" stroke="#7a4b00" stroke-width="2"/>
      <ellipse cx="${x}" cy="${y - 16}" rx="10" ry="12" fill="${col}" stroke="#fff" stroke-width="2"/>
      <rect x="${x - 6}" y="${y - 30}" width="12" height="4" rx="1" fill="#ffc533"/>
      <rect x="${x - 6}" y="${y - 6}" width="12" height="4" rx="1" fill="#ffc533"/>
    </g>`;
  }).join('');
  const m = MARKETS[mapSel];
  const typeTxt = m.type === 'fixed' ? L(['固定型', '固定型']) : L(['流動型', '流動型']);
  el.innerHTML = `<div class="map-wrap">
    <svg class="map-svg" viewBox="0 0 330 580" role="img" aria-label="${L(['臺灣夜市分布示意圖', '台灣夜市仔分布示意圖'])}">
      <rect class="sea" x="0" y="0" width="330" height="580" rx="24"/>
      <g opacity=".35">${Array.from({ length: 8 }, (_, i) => `<path d="M${20 + i * 5} ${60 + i * 62} q14 -8 28 0 t28 0" stroke="var(--blue)" fill="none" stroke-width="2"/>`).join('')}</g>
      <polygon class="island" points="${pts}"/>
      <text x="200" y="300" font-size="18" fill="var(--green)" font-weight="900" opacity=".55" transform="rotate(-70 200 300)">${L(['中央山脈', '中央山脈'])}</text>
      ${pins}
      <g font-size="13" font-weight="800"><circle cx="30" cy="535" r="8" fill="var(--red)"/><text x="44" y="540" fill="var(--ink)">${L(['固定型', '固定型'])}</text>
      <circle cx="120" cy="535" r="8" fill="var(--purple)"/><text x="134" y="540" fill="var(--ink)">${L(['流動型', '流動型'])}</text></g>
    </svg>
    <div>
      <div class="mk-detail">
        <div class="row"><b style="font-size:24px;font-family:var(--display)">🏮 ${L(m.n)}</b><span class="chip">${L(m.city)}</span><span class="chip" style="background:${m.type === 'fixed' ? 'var(--red)' : 'var(--purple)'};color:#fff">${typeTxt}</span></div>
        <p style="margin:.5em 0 0">${L(m.f)}</p>
      </div>
      <div class="mk-list">${MARKETS.map((x, i) => `<button class="mk-item${i === mapSel ? ' on' : ''}" data-i="${i}"><span>${x.type === 'fixed' ? '🔴' : '🟣'}</span>${L(x.n)}<span class="ty chip">${L(x.city)}</span></button>`).join('')}</div>
    </div></div>`;
  el.querySelectorAll('[data-i]').forEach(b => {
    const pick = () => { mapSel = +b.dataset.i; sfx('pop'); wMap(el); if (b.classList.contains('mk-item') && el.querySelector('.map-wrap').clientWidth < 700) { const d = el.querySelector('.mk-detail'); window.scrollTo({ top: d.getBoundingClientRect().top + scrollY - 150, behavior: 'smooth' }); } };
    b.addEventListener('click', pick);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
}

/* ---------- 2. 小吃圖鑑 ---------- */
let foodCat = 'all';
const catColor = { salty: 'orange', fried: 'red', sweet: 'pink', drink: 'teal' };
function wFood(el) {
  const list = FOODS.filter(f => foodCat === 'all' || f.c === foodCat);
  el.innerHTML = `<div class="filters" role="group">${Object.keys(FOOD_CATS).map(k => `<button data-cat="${k}" aria-pressed="${k === foodCat}">${L(FOOD_CATS[k])}</button>`).join('')}</div>
  <div class="food-grid">${list.map(f => `<button class="fcard c-${catColor[f.c]}" aria-label="${f.zh}">
    <div class="fcard-in">
      <div class="fface"><span class="price">${L(FOOD_CATS[f.c])}</span><span class="fe">${f.e}</span><b>${lang === 'tw' ? f.tw : f.zh}</b>${lang === 'tw' ? `<span class="tl-rom">${f.tl}</span>` : `<span class="muted" style="font-size:16px">${L(['點我翻面', '揤我翻面'])}</span>`}</div>
      <div class="fface back"><b style="font-size:20px">${f.zh}｜${f.tw}</b><span class="tl-rom">${f.tl}</span><p style="margin:.4em 0 0">${L(f.d)}</p></div>
    </div></button>`).join('')}</div>`;
  el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { foodCat = b.dataset.cat; sfx('click'); wFood(el); });
  el.querySelectorAll('.fcard').forEach(c => c.onclick = () => { c.classList.toggle('flip'); sfx('flip'); });
}

/* ---------- 3. 200 元挑戰 ---------- */
let cart = {};
function wBudget(el) {
  const total = Object.entries(cart).reduce((s, [k, q]) => s + FOODS[k].p * q, 0);
  const left = 200 - total;
  const kinds = Object.keys(cart).length;
  const cats = new Set(Object.keys(cart).map(k => FOODS[k].c));
  let verdict = '';
  if (total > 0) {
    if (cats.size >= 3 && left >= 0) verdict = L(['🌟 很棒！鹹甜飲料都有，搭配均衡又守住預算。', '🌟 真讚！鹹的甜的飲料攏有，配甲真四配閣守著預算。']);
    else if (left < 30 && cats.size < 3) verdict = L(['🤔 錢快花完了，但種類有點單一，可以換成不同類別試試。', '🤔 錢欲開了矣，毋過種類較單調，會使換無仝類的試看覓。']);
    else verdict = L(['👍 繼續挑選吧，試著湊齊「鹹食＋甜點＋飲料」！', '👍 繼續揀，試看覓湊齊「鹹的＋甜的＋飲料」！']);
  }
  el.innerHTML = `<div class="sim-grid">
    <div>
      <div class="row" style="justify-content:space-between"><b style="font-size:22px">${L(['剩餘', '賰'])}：<span style="color:${left < 40 ? 'var(--red)' : 'var(--green)'};font-size:30px;font-family:var(--display)">${left}</span> ${L(['元', '箍'])}</b><button class="btn ghost sm" id="bReset">${L(['清空', '清掉'])}</button></div>
      <div class="budget-bar" style="margin:8px 0 16px"><i style="width:${Math.min(100, total / 2)}%"></i></div>
      <div class="menu-grid">${FOODS.map((f, i) => `<button class="menu-item" data-k="${i}" ${f.p > left ? 'disabled style="opacity:.4"' : ''}>${cart[i] ? `<span class="qty">${cart[i]}</span>` : ''}<span class="me">${f.e}</span>${lang === 'tw' ? f.tw : f.zh}<span style="color:var(--red)">$${f.p}</span></button>`).join('')}</div>
    </div>
    <div>
      <div class="receipt">
        <div style="text-align:center;font-weight:900">🏮 ${L(['夜市消費明細', '夜市仔開錢明細'])} 🏮</div>
        ${kinds ? Object.entries(cart).map(([k, q]) => `<div class="ln"><span>${FOODS[k].e} ${lang === 'tw' ? FOODS[k].tw : FOODS[k].zh} ×${q} <button data-rm="${k}" aria-label="remove" style="border:0;background:none;color:var(--red);font-weight:900">－</button></span><span>$${FOODS[k].p * q}</span></div>`).join('') : `<p style="text-align:center;margin:12px 0">${L(['點左邊的小吃加入', '揤倒爿的小食加入去'])}</p>`}
        <div class="ln" style="font-weight:900;border:0"><span>${L(['合計', '總共'])}</span><span>$${total}</span></div>
      </div>
      <p style="margin-top:22px;font-weight:700">${verdict}</p>
      ${kinds ? `<button class="btn grn" id="bDone">✅ ${L(['完成採買並記錄', '買好閣記錄'])}</button>` : ''}
    </div></div>`;
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; cart[k] = (cart[k] || 0) + 1; sfx('coin'); wBudget(el); });
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const k = b.dataset.rm; if (--cart[k] <= 0) delete cart[k]; sfx('click'); wBudget(el); });
  el.querySelector('#bReset').onclick = () => { cart = {}; sfx('click'); wBudget(el); };
  const done = el.querySelector('#bDone');
  if (done) done.onclick = () => {
    const items = Object.entries(cart).map(([k, q]) => `${FOODS[k].zh}×${q}`).join('、');
    logEvent('explore', '🪙', L(['200 元逛夜市', '200 箍踅夜市仔']), `${items}｜${L(['花費', '開'])} ${total}／${L(['種類', '種類'])} ${cats.size}`);
    sfx('win'); confetti(); toast(L(['已記錄到學習歷程！', '已經記錄佇學習跤跡！']));
  };
}

/* ---------- 4. 攤販經營模擬器 ---------- */
const sim = { item: 0, price: 75, weather: 'sun', day: 'weekday' };
function simCalc(price, s = sim) {
  const it = SIM_ITEMS[s.item];
  const crowd = (s.day === 'weekend' ? 1500 : 800) * ({ sun: 1, rain: 0.5, cold: 0.8 }[s.weather]);
  let pref = 1;
  if (s.weather === 'cold') pref = it.hot ? 1.35 : 0.6;
  if (s.weather === 'sun' && !it.hot) pref = 1.2;
  const conv = 0.16 * pref * Math.exp(-2.2 * (price - it.ref) / it.ref);
  const cap = 320; // 一晚最多做得出的份數
  const q = Math.max(0, Math.min(cap, Math.round(crowd * conv)));
  const revenue = q * price, cost = q * it.cost + 1500;
  return { q, revenue, cost, profit: revenue - cost };
}
function wSim(el) {
  const it = SIM_ITEMS[sim.item];
  const lo = it.cost, hi = it.ref * 2;
  if (sim.price < lo || sim.price > hi) sim.price = it.ref;
  const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, lab]) => `<button data-${k}="${v}" aria-pressed="${sim[k] === v}">${lab}</button>`).join('')}</div>`;
  el.innerHTML = `<div class="sim-grid">
    <div>
      <div class="field"><span>① ${L(['選擇商品', '揀商品'])}</span><div class="seg" role="group">${SIM_ITEMS.map((s, i) => `<button data-item="${i}" aria-pressed="${sim.item === i}">${s.e} ${L(s.n)}</button>`).join('')}</div></div>
      <div class="field"><span>② ${L(['天氣', '天氣'])}</span>${seg('weather', [['sun', '☀️ ' + L(['晴天', '好天'])], ['rain', '🌧️ ' + L(['雨天', '落雨'])], ['cold', '🥶 ' + L(['寒流', '寒流'])]])}</div>
      <div class="field"><span>③ ${L(['日子', '日子'])}</span>${seg('day', [['weekday', L(['平日', '平常日'])], ['weekend', L(['假日', '歇睏日'])]])}</div>
      <div class="field"><span>④ ${L(['售價', '賣價'])}：<b id="simPv" style="color:var(--red);font-size:28px">$${sim.price}</b> <small class="muted">（${L(['成本', '本錢'])} $${it.cost}／${L(['份', '份'])}，${L(['租金', '租金'])} $1500／${L(['晚', '暗'])}）</small></span>
        <input type="range" id="simPrice" min="${lo}" max="${hi}" value="${sim.price}" aria-label="price"></div>
    </div>
    <div id="simOut"></div></div>`;
  el.querySelectorAll('[data-item]').forEach(b => b.onclick = () => { sim.item = +b.dataset.item; sim.price = SIM_ITEMS[sim.item].ref; sfx('click'); wSim(el); });
  el.querySelectorAll('[data-weather]').forEach(b => b.onclick = () => { sim.weather = b.dataset.weather; sfx('click'); wSim(el); });
  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { sim.day = b.dataset.day; sfx('click'); wSim(el); });
  const rng = el.querySelector('#simPrice');
  rng.oninput = () => { sim.price = +rng.value; el.querySelector('#simPv').textContent = '$' + sim.price; sfx('tick'); simOut(el); };
  simOut(el);
}
function simOut(el) {
  const it = SIM_ITEMS[sim.item];
  const lo = it.cost, hi = it.ref * 2;
  const r = simCalc(sim.price);
  let best = { p: lo, profit: -1e9 }; const pts = [];
  for (let p = lo; p <= hi; p++) { const v = simCalc(p).profit; pts.push([p, v]); if (v > best.profit) best = { p, profit: v }; }
  const minV = Math.min(...pts.map(p => p[1]), 0), maxV = Math.max(...pts.map(p => p[1]), 100);
  const W = 520, H = 240, pad = 36;
  const X = p => pad + (p - lo) / (hi - lo) * (W - pad * 1.5), Y = v => H - pad - (v - minV) / (maxV - minV) * (H - pad * 1.6);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
  const box = el.querySelector('#simOut');
  box.innerHTML = `
      <div class="kpis">
        <div class="kpi"><span>${L(['賣出份數', '賣出份數'])}</span><b>${r.q}</b></div>
        <div class="kpi"><span>${L(['營業額', '營業額'])}</span><b>$${r.revenue.toLocaleString()}</b></div>
        <div class="kpi"><span>${L(['總成本', '總本錢'])}</span><b>$${r.cost.toLocaleString()}</b></div>
        <div class="kpi ${r.profit >= 0 ? 'pos' : 'neg'}"><span>${L(['利潤', '利純'])}</span><b>${r.profit >= 0 ? '' : '−'}$${Math.abs(r.profit).toLocaleString()}</b></div>
      </div>
      <div class="chart card" style="margin-top:12px;padding:10px">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="profit curve">
          <line x1="${pad}" x2="${W - pad / 2}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--ink2)" stroke-dasharray="4 4"/>
          <text x="${pad}" y="${Y(0) - 6}" font-size="13" fill="var(--ink2)">${L(['損益兩平', '無趁無了'])}</text>
          <path d="${path}" fill="none" stroke="var(--orange)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="${X(best.p)}" cy="${Y(best.profit)}" r="6" fill="var(--green)"/>
          <circle cx="${X(sim.price)}" cy="${Y(r.profit)}" r="10" fill="var(--red)" stroke="#fff" stroke-width="3"/>
          <text x="${pad}" y="${H - 8}" font-size="13" fill="var(--ink2)">$${lo}</text><text x="${W - pad - 10}" y="${H - 8}" font-size="13" fill="var(--ink2)">$${hi}</text>
          <text x="${W / 2}" y="${H - 8}" font-size="13" fill="var(--ink2)" text-anchor="middle">${L(['售價 →', '賣價 →'])}</text>
        </svg>
      </div>
      <p style="margin-top:10px;font-weight:600">${Math.abs(sim.price - best.p) <= 2 ? '🎉 ' + L(['你找到接近最佳的價格了！', '你揣著倚近上好的價數矣！']) : sim.price > best.p ? '⬇️ ' + L(['價格偏高，客人變少了，試試降價。', '價數傷懸，人客變少，試看覓降價。']) : '⬆️ ' + L(['價格偏低，賣很多卻賺得少，試試提高。', '價數傷俗，賣真濟煞趁較少，試看覓起價。'])}
      <br><small class="muted">${L(['綠點＝最高利潤，紅點＝你的定價。這個模型只是教學示意。', '青點＝上濟利純，紅點＝你的定價。這个模型干焦是教學示意。'])}</small></p>
      <button class="btn sm alt" id="simLog">📒 ${L(['記錄這次經營結果', '記錄這擺經營結果'])}</button>`;
  box.querySelector('#simLog').onclick = () => {
    logEvent('explore', '📈', L(['攤販經營模擬器', '攤販經營模擬器']), `${SIM_ITEMS[sim.item].n[0]}｜$${sim.price}｜${sim.weather}/${sim.day}｜利潤 ${r.profit}（最佳 $${best.p}）`);
    sfx('coin'); toast(L(['已記錄！', '記錄好矣！']));
  };
}

/* ---------- 5. 輪流夜市週曆 ---------- */
let weekDay = ((new Date().getDay() + 6) % 7) + 1;
function wWeek(el) {
  const names = lang === 'tw' ? ['一', '二', '三', '四', '五', '六', '日'] : ['一', '二', '三', '四', '五', '六', '日'];
  const pre = L(['週', '禮拜']);
  const rot = MARKETS.filter(m => m.type === 'rotate');
  const colors = ['red', 'teal', 'orange'];
  const open = rot.filter(m => m.days.includes(weekDay));
  el.innerHTML = `<div class="week" role="group">${names.map((n, i) => `<button class="day" data-d="${i + 1}" aria-pressed="${weekDay === i + 1}"><small>${pre}</small>${n}</button>`).join('')}</div>
    <div class="rot-markets">${rot.map((m, i) => `<div class="rot c-${colors[i]}${m.days.includes(weekDay) ? ' open' : ''}"><div class="ri">${m.days.includes(weekDay) ? '🏮' : '🌙'}</div><b style="font-size:22px">${L(m.n)}</b><div class="muted">${pre}${m.days.map(d => names[d - 1]).join('、')}</div><span class="opent">${m.days.includes(weekDay) ? L(['今晚營業', '今仔暗有開']) : L(['休息', '歇睏'])}</span></div>`).join('')}</div>
    <p class="card" style="margin-top:16px;font-weight:600">${open.length ? `${pre}${names[weekDay - 1]}：${L(['可以去', '會使去'])} ${open.map(m => '「' + L(m.n) + '」').join('、')} 🎉` : ''}
    ${L(['輪流開市讓攤商一週七天都有生意，居民也天天有夜市可逛！', '輪流開市予攤商一禮拜七工攏有生理，居民嘛逐工有夜市仔通踅！'])}</p>`;
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { weekDay = +b.dataset.d; sfx('pop'); wWeek(el); });
}

/* ---------- 6. 套圈圈 ---------- */
const PRIZES = [
  { e: '🧸', v: 150, p: 0.04 }, { e: '🎁', v: 80, p: 0.08 }, { e: '🥤', v: 20, p: 0.25 }, { e: '🍬', v: 5, p: 0.35 }, { e: '🎎', v: 100, p: 0.06 },
  { e: '🍭', v: 10, p: 0.3 }, { e: '🚗', v: 120, p: 0.05 }, { e: '🍫', v: 15, p: 0.28 }, { e: '🎈', v: 10, p: 0.3 }, { e: '🪀', v: 30, p: 0.18 },
];
const ring = { rings: 10, rounds: 0, spent: 0, won: 0, hits: 0, throws: 0, busy: false };
function wRing(el) {
  const ev = PRIZES.reduce((s, x) => s + x.v * x.p, 0) / PRIZES.length * 10; // 每局期望值
  el.innerHTML = `<div class="ring-stage" id="stage">
      <div class="bottles">${PRIZES.map((x, i) => `<button class="bottle" data-p="${i}" aria-label="target ${i + 1}" style="border:0;background:none;cursor:pointer">${x.e}<div style="font-size:14px;font-weight:900;color:#5a2a00">$${x.v}</div></button>`).join('')}</div>
      <div class="ring" id="ringEl"></div>
      <div style="position:absolute;left:12px;bottom:12px;font-weight:900;color:#5a2a00;font-size:18px">⭕ × ${ring.rings}</div>
    </div>
    <p class="muted" style="margin:8px 0 0">${L(['點選想套的獎品丟出圈圈！獎品越貴，越難套中。', '揤想欲套的獎品擲圈仔！獎品越貴，越歹套著。'])}</p>
    <div class="ring-stats">
      <div class="kpi"><span>${L(['已玩局數', '耍幾局'])}</span><b>${ring.rounds}</b></div>
      <div class="kpi"><span>${L(['花費', '開錢'])}</span><b>$${ring.spent}</b></div>
      <div class="kpi"><span>${L(['獎品價值', '獎品價值'])}</span><b>$${ring.won}</b></div>
      <div class="kpi"><span>${L(['命中率', '命中率'])}</span><b>${ring.throws ? Math.round(ring.hits / ring.throws * 100) : 0}%</b></div>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn sm" id="newRound" ${ring.rings > 0 ? 'disabled' : ''}>💰 ${L(['再玩一局（50 元）', '閣耍一局（50 箍）'])}</button><button class="btn sm ghost" id="auto100">🤖 ${L(['模擬玩 100 局', '模擬耍 100 局'])}</button><button class="btn sm ghost" id="ringReset">${L(['歸零', '歸零'])}</button></div>
    <div class="card think" style="margin-top:14px"><b>🧮 ${L(['機率小教室', '機率小教室'])}</b><p style="margin:.3em 0 0">${L([`依照每個獎品的命中機率與價值計算，每局平均只能拿回約 $${ev.toFixed(0)} 的獎品，卻要付 $50——長期來看玩家會賠、老闆會賺。這就是「期望值」！`, `照逐个獎品的命中機率佮價值來算，一局平均干焦提轉來差不多 $${ev.toFixed(0)} 的獎品，煞愛付 $50——長期來看耍的人會了、頭家會趁。這就是「期望值」！`])}</p></div>`;
  if (ring.rounds === 0 && ring.spent === 0) { ring.rounds = 1; ring.spent = 50; wRing(el); return; }
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => throwRing(el, +b.dataset.p, b));
  el.querySelector('#newRound').onclick = () => { ring.rings = 10; ring.rounds++; ring.spent += 50; sfx('coin'); wRing(el); };
  el.querySelector('#ringReset').onclick = () => { Object.assign(ring, { rings: 10, rounds: 0, spent: 0, won: 0, hits: 0, throws: 0 }); wRing(el); };
  el.querySelector('#auto100').onclick = () => {
    for (let r = 0; r < 100; r++) { ring.rounds++; ring.spent += 50; for (let k = 0; k < 10; k++) { const x = PRIZES[Math.floor(Math.random() * PRIZES.length)]; ring.throws++; if (Math.random() < x.p) { ring.hits++; ring.won += x.v; } } }
    sfx('coin');
    logEvent('explore', '⭕', L(['套圈圈與機率', '套圈仔佮機率']), `累計 ${ring.rounds} 局，花費 $${ring.spent}，獎品 $${ring.won}`);
    wRing(el);
  };
}
function throwRing(el, i, target) {
  if (ring.busy || ring.rings <= 0) { if (ring.rings <= 0) toast(L(['圈圈用完了，再玩一局吧！', '圈仔用了矣，閣耍一局！'])); return; }
  ring.busy = true; ring.rings--; ring.throws++;
  const stage = el.querySelector('#stage'), r = el.querySelector('#ringEl');
  const sb = stage.getBoundingClientRect(), tb = target.getBoundingClientRect();
  const hit = Math.random() < PRIZES[i].p;
  const dx = hit ? 0 : (Math.random() < .5 ? -1 : 1) * (20 + Math.random() * 25);
  sfx('whoosh');
  r.style.left = (tb.left - sb.left + tb.width / 2 - 28 + dx) + 'px';
  r.style.bottom = (sb.bottom - tb.bottom + (hit ? 4 : -8)) + 'px';
  r.style.transform = 'rotateX(60deg) scale(.8)';
  setTimeout(() => {
    if (hit) { ring.hits++; ring.won += PRIZES[i].v; sfx('win'); target.classList.add('hit'); toast('🎉 ' + L(['套中了！', '套著矣！']) + ` ${PRIZES[i].e} $${PRIZES[i].v}`); }
    else sfx('miss');
    setTimeout(() => { ring.busy = false; wRing(el); }, hit ? 700 : 300);
  }, 650);
}

/* ---------- 7. 時光機 ---------- */
let tlIdx = 0, tlTimer = null;
function wTimeline(el) { renderTimeline(el, true); }
function renderTimeline(el, withPlay) {
  const e = TIMELINE[tlIdx];
  el.innerHTML = `<div class="tl">
    <div class="tl-track">${TIMELINE.map((x, i) => `<button class="tl-node${i <= tlIdx ? ' passed' : ''}" data-t="${i}" aria-pressed="${i === tlIdx}"><span class="dot">${x.icon}</span><small>${L(x.era)}</small></button>`).join('')}</div>
    <div class="card tl-detail" style="border-color:var(--orange)">
      <div class="row"><span style="font-size:48px">${e.icon}</span><div><span class="chip">${L(e.era)}</span><h3 style="font-size:26px;margin:.2em 0 0">${L(e.t)}</h3></div></div>
      <p style="margin:.6em 0 0;font-size:1.05em">${L(e.d)}</p>
    </div>
    ${withPlay ? `<div class="row"><button class="btn sm yel" id="tlPlay">${tlTimer ? '⏸️ ' + L(['暫停', '暫停']) : '▶️ ' + L(['自動播放', '自動播放'])}</button><button class="btn sm ghost" id="tlPrev">◀</button><button class="btn sm ghost" id="tlNext">▶</button></div>` : ''}
  </div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tlIdx = +b.dataset.t; sfx('pop'); renderTimeline(el, withPlay); });
  if (!withPlay) return;
  el.querySelector('#tlPrev').onclick = () => { tlIdx = (tlIdx + TIMELINE.length - 1) % TIMELINE.length; sfx('click'); renderTimeline(el, true); };
  el.querySelector('#tlNext').onclick = () => { tlIdx = (tlIdx + 1) % TIMELINE.length; sfx('click'); renderTimeline(el, true); };
  el.querySelector('#tlPlay').onclick = () => {
    if (tlTimer) { clearInterval(tlTimer); tlTimer = null; }
    else tlTimer = setInterval(() => { if (!el.isConnected) { clearInterval(tlTimer); tlTimer = null; return; } tlIdx = (tlIdx + 1) % TIMELINE.length; sfx('pop'); renderTimeline(el, true); }, 2600);
    renderTimeline(el, true);
  };
}

const WIDGET_RENDER = { map: wMap, food: wFood, budget: wBudget, sim: wSim, week: wWeek, ring: wRing, timeline: wTimeline };
