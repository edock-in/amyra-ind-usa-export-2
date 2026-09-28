
/* ---------- App state and shared helpers ---------- */
const { PRODUCTS, PLACES, LANES, CLUSTERS, STEPS, PARTS, GLOSS, BREAKS, RULE_BREAKS, CUSTOMER, SESSION, GAME_ID } = window.G;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const appEl = $('#app'), panel = $('#panel');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const SIDE_NAME = { india: 'India', sea: 'In between', abroad: 'United States' };
const S = { prod: 'cushion', mode: 'sea', tab: 'journey', step: null, brk: null, price: null, day: 120, touring: false, term: null, booted: false };
let viewTok = 0;
const P = () => PRODUCTS[S.prod];
const isPhone = () => matchMedia('(max-width: 760px)').matches;
const cxFor = () => (S.touring || isPhone()) ? .5 : .35;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (inner, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const km = v => (v >= 1000 ? (Math.round(v / 100) * 100).toLocaleString('en-US') : Math.round(v / 10) * 10) + ' km';
const usd = v => (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(2);
const inr = v => (v < 0 ? '−₹' : '₹') + Math.round(Math.abs(v)).toLocaleString('en-IN');
const clockIn = tz => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date());

/* ---------- links back to Edock ---------- */
function tagged(url, campaign, placement) {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', GAME_ID); u.searchParams.set('utm_medium', 'game');
    u.searchParams.set('utm_campaign', campaign); u.searchParams.set('utm_content', placement); u.searchParams.set('utm_term', S.prod);
    return u.toString();
  } catch (e) { return url; }
}
function promo(placement) {
  const live = Date.now() < Date.parse(SESSION.endsAt);
  const href = live ? tagged(SESSION.url, SESSION.campaign, placement) : tagged(SESSION.allUrl, SESSION.allCampaign, placement);
  return `<div class="promo">
    <div class="eye">${live ? 'Live session' : 'Keep going'}</div>
    <p>${live ? 'Ask people who export for real everything this page could not answer.' : 'Edock runs live sessions where people who export for real answer your questions.'}</p>
    ${live ? `<div class="ev"><div class="cal"><b>${SESSION.month}</b><span>${SESSION.day}</span></div>
      <div><div class="ev-t">${esc(SESSION.title)}</div><div class="psub">${esc(SESSION.when)}</div><div class="psub">${esc(SESSION.host)}</div></div></div>` : ''}
    <a class="cta" href="${esc(href)}" target="_blank" rel="noopener">${live ? 'Save my seat' : 'See upcoming sessions'} →</a>
    <div class="psub">Opens edock.io in a new tab.</div>
  </div>`;
}

/* ---------- route, pins and camera shots for the chosen product ---------- */
function legsFor(p = P(), mode = S.mode) {
  const sea = mode === 'sea';
  const india = [...(p.farm ? [p.farm.ll] : []), p.maker.ll, ...(sea ? p.inland : []), sea ? p.port.ll : p.airport.ll];
  const cross = sea ? LANES[p.lane] : [p.airport.ll, PLACES.jfk];
  const us = [sea ? PLACES.nynj : PLACES.jfk, PLACES.fba, PLACES.customer];
  return [{ side: 'india', kind: 'truck', pts: india }, { side: 'sea', kind: sea ? 'ship' : 'plane', pts: cross }, { side: 'abroad', kind: 'truck', pts: us }];
}
function pinsFor(p = P(), mode = S.mode) {
  const sea = mode === 'sea';
  return [
    { id: 'maker', ll: p.maker.ll, label: p.maker.name, sub: `${p.maker.region} · the maker`, side: 'india', major: true, step: 2 },
    p.farm && { id: 'farm', ll: p.farm.ll, label: p.farm.name, sub: 'pepper farms', side: 'india', step: 2 },
    { id: 'dgft', ll: PLACES.delhi, label: 'New Delhi', sub: 'DGFT · exporter ID', side: 'india', office: true, step: 4 },
    sea ? { id: 'portin', ll: p.port.ll, label: p.port.name, sub: `${p.port.sub} · export port`, side: 'sea', major: true, step: 9 }
        : { id: 'portin', ll: p.airport.ll, label: p.airport.name, sub: `${p.airport.code} · air cargo`, side: 'sea', major: true, step: 9 },
    sea ? { id: 'portus', ll: PLACES.nynj, label: 'Port of NY & NJ', sub: 'US customs', side: 'abroad', major: true, step: 9 }
        : { id: 'portus', ll: PLACES.jfk, label: 'JFK airport', sub: 'New York · US customs', side: 'abroad', major: true, step: 9 },
    { id: 'uspto', ll: PLACES.uspto, label: 'USPTO', sub: 'Alexandria, Virginia · trademarks', side: 'abroad', office: true, step: 3 },
    { id: 'irs', ll: PLACES.irs, label: 'IRS', sub: 'Washington, DC · US tax ID', side: 'sea', office: true, step: 5 },
    p.rules.pin && { id: 'rules', ll: p.rules.pin.ll, label: p.rules.pin.name, sub: p.rules.pin.sub, side: 'abroad', office: true, step: 7 },
    { id: 'fba', ll: PLACES.fba, label: 'Amazon warehouse', sub: 'FBA · New Jersey', side: 'sea', step: 10 },
    { id: 'customer', ll: PLACES.customer, label: CUSTOMER.name, sub: 'the customer', side: 'abroad', major: true, step: 8 }
  ].filter(Boolean);
}
const pinLL = id => (Globe.st.pins.find(p => p.id === id) || {}).ll;
function shot(name) {
  const p = P();
  const views = {
    overview: () => Globe.fit(legsFor().flatMap(l => l.pts).concat([PLACES.customer])),
    origin: () => ({ lon: p.maker.ll[0], lat: p.maker.ll[1] - .4, k: 5 }),
    india: () => ({ lon: 79.5, lat: 20.5, k: 3 }),
    portin: () => { const ll = pinLL('portin'); return { lon: ll[0] - 2, lat: ll[1], k: 4.2 }; },
    dc: () => ({ lon: -76.9, lat: 39.1, k: 9 }),
    nyc: () => ({ lon: -74.4, lat: 40.5, k: 9 }),
    us: () => ({ lon: -79.2, lat: 40, k: 4.4 })
  };
  return { ...(views[name] || views.overview)(), cx: cxFor() };
}
function go(name, dur = 1800) { const d = S.booted ? dur : 0; S.booted = true; return Globe.flyTo(shot(name), d); }
function moneyPath(frozen = false) { const m = Globe.mkPath([PLACES.customer, P().maker.ll]); m.frozen = frozen; return m; }
function mapState(o = {}) {
  const st = Globe.st;
  st.hi = new Set(o.hi || []);
  st.clusters = o.clusters ? { list: CLUSTERS, sel: P().cluster } : null;
  st.prog = o.prog ?? 3; st.vehicle = !!o.vehicle; st.crow = o.crow || null;
  st.money = o.money ? moneyPath(o.money === 'frozen') : null; st.moneyP = o.money ? (o.moneyP ?? 1) : 0; st.coins = !!o.coins;
  st.loop = o.loop ? P().maker.ll : null; st.broken = o.broken || null;
  st.safeR = (S.touring || isPhone()) ? 1 : .69;
  Globe.redraw();
}
function caption(e, l, s, anim = true) {
  $('#capE').textContent = e || ''; $('#capL').textContent = l || ''; $('#capS').textContent = s || '';
  const cap = $('#cap');
  if (anim) { cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap'); }
}

/* ---------- price model (per unit, in dollars) ---------- */
function loadPrice() {
  let saved = null; try { saved = JSON.parse(store.get('gomh:price:' + S.prod) || 'null'); } catch (e) {}
  return { ...P().price, ...(saved || {}) };
}
function calc(v = S.price, mode = S.mode) {
  const ship = v.ship * (mode === 'air' ? 4 : 1);
  const refFee = v.price * v.ref / 100, payout = v.price - refFee - v.fba - v.ads;
  const convFee = Math.max(0, payout) * v.conv / 100, factory = v.cost / v.fx, duty = factory * v.duty / 100;
  const profit = payout - convFee - factory - ship - duty;
  const be = ((factory + ship + duty) / (1 - v.conv / 100) + v.fba + v.ads) / (1 - v.ref / 100);
  return { ship, refFee, payout, convFee, factory, duty, profit, be, margin: profit / v.price, inrPerUnit: (payout - convFee) * v.fx };
}

/* ---------- shell: product picker, mode, tabs ---------- */
function buildShell() {
  $('#prodSeg').innerHTML = '<span class="drop" aria-hidden="true"></span>' + Object.values(PRODUCTS).map(p =>
    `<button type="button" data-p="${p.id}" aria-pressed="false" title="${esc(p.kind)}">${svg(p.icon)}${esc(p.short)}</button>`).join('');
  $$('#prodSeg button').forEach(b => b.onclick = () => { if (S.prod !== b.dataset.p) { S.prod = b.dataset.p; applyProduct(); } });
  $$('#modeSeg button').forEach(b => b.onclick = () => { if (S.mode !== b.dataset.mode) { S.mode = b.dataset.mode; store.set('gomh:mode', S.mode); applyProduct(true); } });
  $$('#tabs .tab').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $('#play').onclick = () => startTour();
  Globe.onPin(p => { if (!S.touring && p.step) openStep(p.step); });
  addEventListener('resize', () => { placeDrops(); if (!S.touring) { Globe.cam.cx = cxFor(); Globe.st.safeR = isPhone() ? 1 : .69; Globe.redraw(); } });
  $('#themeBtn').onclick = () => { const next = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); store.set('edockTheme', next); paintTheme(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme);
  new MutationObserver(paintTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // Liquid glass: the specular highlight follows the pointer
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('.lg, .play'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}
const theme = () => { const t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || t === 'light' ? t : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); };
const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>';
const MOON = '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>';
function paintTheme() {
  const next = theme() === 'dark' ? 'light' : 'dark', b = $('#themeBtn');
  b.innerHTML = svg(next === 'dark' ? MOON : SUN) + (next === 'dark' ? 'Dark' : 'Light');
  b.setAttribute('aria-label', `Switch to the ${next} theme`);
}
// Slide each glass control's droplet under its selected option
function placeDrops() {
  $$('.seg, .tabs').forEach(box => {
    const drop = $('.drop', box), on = $('[aria-pressed="true"], [aria-selected="true"]', box);
    if (!drop) return;
    if (!on || !on.offsetWidth) { drop.style.opacity = '0'; return; }
    drop.style.width = on.offsetWidth + 'px'; drop.style.height = on.offsetHeight + 'px';
    drop.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`; drop.style.opacity = '1';
  });
}
function applyProduct(keepStep) {
  store.set('gomh:prod', S.prod);
  S.price = loadPrice(); S.brk = null; if (!keepStep) S.step = null;
  $$('#prodSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === S.prod)));
  $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)));
  placeDrops();
  Globe.setRoute(legsFor()); Globe.st.pins = pinsFor();
  if (S.touring) restartTour(); else render();
}
function setTab(t) {
  if (S.touring) stopTour(false);
  S.tab = t; if (t === 'journey') S.step = null;
  $$('#tabs .tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  render();
}
function render() {
  viewTok++; Globe.cancel(); Globe.st.interactive = true;
  $$('#tabs .tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === S.tab)));
  placeDrops();
  ({ journey: renderJourney, break: renderBreak, price: renderPrice, money: renderMoney, dict: renderDict })[S.tab]();
  panel.scrollTop = 0;
}

/* ---------- Journey tab ---------- */
const doneKey = n => `gomh:done:${S.prod}:${n}`;
const isDone = n => store.get(doneKey(n)) === '1';
function renderJourney() {
  if (S.step) return renderStep(S.step);
  const p = P(), done = STEPS.filter(s => isDone(s.n)).length;
  panel.innerHTML = `
    <div class="eye">Your product</div>
    <div class="pcard">
      <div class="prow"><span class="pico">${svg(p.icon)}</span>
        <div><div class="pname">${esc(p.name)}</div><div class="psub">${esc(p.maker.name)}, ${esc(p.maker.region)} → ${esc(CUSTOMER.name)}</div></div></div>
      <div class="chips">
        <span class="chip">Trademark class ${p.tm[0]}</span><span class="chip">HS ${p.hs[0]}</span>
        <span class="chip ${p.rules.level === 'Light' ? 'ok' : 'warn'}">US rules: ${p.rules.level.toLowerCase()}</span>
        <span class="chip">${S.mode === 'sea' ? 'By sea' : 'By air'}</span></div>
      <div><div class="bar"><i style="width:${done / 11 * 100}%"></i></div><div class="psub" style="margin-top:4px">${done} of 11 steps done</div></div>
    </div>
    ${PARTS.map(pt => `<div class="part"><div class="part-h"><span class="part-n">Part ${pt.n}</span><span class="part-t">${esc(pt.title)}</span></div>
      ${STEPS.filter(s => s.part === pt.n).map(s => `<button type="button" class="srow${isDone(s.n) ? ' done' : ''}" data-side="${s.side}" data-step="${s.n}">
        <span class="n">${s.n}</span><span><span class="tt">${esc(s.title)}</span><span class="ww">${esc(s.where)}</span></span><span class="ck">✓</span></button>`).join('')}
    </div>`).join('')}
    ${promo('journey-end')}`;
  $$('.srow', panel).forEach(b => b.onclick = () => openStep(+b.dataset.step));
  mapState({ prog: 3 });
  go('overview');
  caption('The whole journey', `${p.short}: ${p.maker.name} to ${CUSTOMER.short}`, 'Drag the globe, tap a pin or a step, or press Play for the two-minute story.');
}
function openStep(n) {
  if (S.touring) stopTour(false);
  S.tab = 'journey'; S.step = n; render();
}
function stepLine(n) {
  const p = P();
  return ({ 1: p.pick, 3: 'An Indian trademark means nothing in an American court.', 7: p.rules.line, 8: p.keywords })[n] || STEPS[n - 1].line;
}
function productNote(n) {
  const p = P(), sea = S.mode === 'sea', lc = p.short.toLowerCase();
  switch (n) {
    case 1: return `<b>Your ${esc(lc)}:</b> ${esc(p.pick)}<div class="fit">${p.fit.map(([k, ok]) => `<div><span class="mk ${ok ? 'y' : 'n'}">${ok ? '✓' : '✕'}</span>${esc(k)}</div>`).join('')}</div>`;
    case 2: return `<b>Your cluster:</b> ${esc(p.maker.note)}${p.rules.pin && p.id === 'pepper' ? ' The packing facility is the one the FDA registers in Step 7, so choose a cooperative one.' : ''}`;
    case 3: return `<b>Your class:</b> ${p.tm[0]}, ${esc(p.tm[1])}. Each extra class is a separate fee.`;
    case 4: return p.extraIndia ? `<b>Extra for spices:</b> ${esc(p.extraIndia)}` : '<b>Same for every product:</b> the IEC, GST with an LUT, and the AD code.';
    case 6: return `<b>Branding a ${esc(lc)}:</b> ${esc(p.brand)}`;
    case 7: return `<b>${esc(p.rules.line)}</b><ul>${p.rules.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>${p.rules.gated ? 'Amazon keeps this category locked until you upload the proof.' : 'Plain home textiles are usually not a locked category on Amazon.'}`;
    case 8: return `<b>Words that sell:</b> ${esc(p.keywords)}${p.claims ? ' ' + esc(p.claims) : ''}`;
    case 9: return `<b>${sea ? `${esc(p.port.name)} to New York by sea` : `${esc(p.airport.name)} to New York JFK by air`}:</b> about ${km(Globe.legKm(1))} ${sea ? 'on this illustrative route; six to eight weeks door to Amazon.' : 'along the great circle; fast, and roughly four times the price of sea.'} The likely HS code is ${p.hs[0]} (${esc(p.hs[1])}); your forwarder confirms the full US code.${p.shipNote ? ' ' + esc(p.shipNote) : ''}`;
    case 10: return `<b>First batch:</b> a few hundred ${esc(p.plural)}. ${p.rules.gated ? 'Your category is gated, so approvals come before the listing goes live.' : 'Your category is usually open to new sellers.'}`;
    case 11: { const r = calc(); return `<b>One sale at the example price:</b> the customer pays ${usd(S.price.price)}, and about ${inr(r.inrPerUnit)} reaches your bank after Amazon's fees and conversion, before your own costs.`; }
  }
  return '';
}
function stepMap(n) {
  const p = P(), tok = viewTok;
  const V = {
    1: ['origin', ['maker']], 2: ['india', ['maker'], { clusters: 1 }], 3: ['dc', ['uspto']], 4: ['india', ['dgft', 'maker']],
    5: ['dc', ['irs']], 6: ['origin', ['maker']], 7: [p.rules.pin ? 'dc' : 'nyc', [p.rules.pin ? 'rules' : 'portus']],
    8: ['us', ['customer']], 9: ['overview', ['portin', 'portus'], { ride: 1 }], 10: ['us', ['fba', 'customer'], { deliver: 1 }],
    11: ['overview', ['maker', 'customer'], { money: 1 }]
  }[n];
  const o = V[2] || {};
  mapState({ hi: V[1], clusters: o.clusters, prog: o.ride ? 1 : o.deliver ? 2 : 3, vehicle: o.ride || o.deliver, money: o.money ? 'on' : null, moneyP: 0, coins: true });
  go(V[0]);
  const st = Globe.st;
  if (o.ride) Globe.animate(e => { st.prog = 1 + e; }, 4200).then(() => { if (tok === viewTok) { st.vehicle = false; Globe.redraw(); } });
  if (o.deliver) Globe.animate(e => { st.prog = 2 + e; }, 2600).then(() => { if (tok === viewTok) { st.vehicle = false; Globe.redraw(); } });
  if (o.money) Globe.animate(e => { st.moneyP = e; }, 2600).then(() => { if (tok === viewTok) { st.loop = p.maker.ll; Globe.redraw(); } });
}
function renderStep(n) {
  const s = STEPS[n - 1], note = productNote(n);
  panel.innerHTML = `
    <button type="button" class="back" id="back">← All 11 steps</button>
    <div data-side="${s.side}" style="margin-top:.7cqw">
      <span class="where">Step ${n} · ${SIDE_NAME[s.side]}</span>
      <h2>${esc(s.title)}</h2>
      <p class="lede">${esc(s.line)}</p>
      ${note ? `<div class="note">${note}</div>` : ''}
      <h3>In plain words</h3>${s.plain.map(t => `<p>${esc(t)}</p>`).join('')}
      <div class="analogy"><b>Think of it like</b> ${esc(s.analogy)}</div>
      <h3>Jargon decoded</h3>
      <dl class="jar">${s.jargon.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="watch"><b>Watch out:</b> ${esc(s.watch)}</div>
      <div class="looks"><span class="psub">In the dictionary:</span>${(s.tags || []).map(t => { const g = GLOSS.find(x => x.id === t); return g ? `<button type="button" class="tagl" data-term="${t}">${esc(g.k)}</button>` : ''; }).join('')}</div>
      <label class="donebox"><input type="checkbox" id="doneBox" ${isDone(n) ? 'checked' : ''}> Mark step ${n} done</label>
      <div class="nav2">
        <button type="button" class="btn" id="prevS" ${n === 1 ? 'disabled' : ''}>← ${n > 1 ? 'Step ' + (n - 1) : 'Start'}</button>
        <button type="button" class="btn pri" id="nextS" ${n === 11 ? 'disabled' : ''}>${n < 11 ? 'Step ' + (n + 1) : 'Done'} →</button>
      </div>
    </div>`;
  $('#back').onclick = () => { S.step = null; render(); };
  $('#prevS').onclick = () => openStep(n - 1);
  $('#nextS').onclick = () => openStep(n + 1);
  $('#doneBox').onchange = e => store.set(doneKey(n), e.target.checked ? '1' : '0');
  $$('.tagl', panel).forEach(b => b.onclick = () => { S.term = b.dataset.term; setTab('dict'); });
  stepMap(n);
  caption(`Step ${n} · ${SIDE_NAME[s.side]}`, stepLine(n), '');
}
