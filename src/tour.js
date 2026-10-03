
/* ---------- The guided story (Play) ---------- */
const T = { i: 0, beats: [], tok: 0, timer: 0, paused: false, t0: 0, left: 0 };
const alive = tok => tok === T.tok && S.touring;
const card = (eye, title, body, side) => `<div${side ? ` data-side="${side}"` : ''}><div class="eye">${eye}</div><div class="t">${title}</div>${body || ''}</div>`;
const stamps = list => `<div class="stamps">${list.map(([t, side], i) => `<span class="stamp land" data-side="${side}" style="animation-delay:${(.35 + i * .45).toFixed(2)}s">${esc(t)}</span>`).join('')}</div>`;
const kv = rows => `<div class="kv">${rows.map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join('')}</div>`;

function tourBeats() {
  const p = P(), sea = S.mode === 'sea', r = calc(), v = S.price;
  const dist = d3.geoDistance(p.maker.ll, PLACES.customer) * 6371, cross = km(Globe.legKm(1));
  const count = side => STEPS.filter(s => s.side === side).length;
  const from = sea ? p.port.name : p.airport.name, to = sea ? 'New York' : 'JFK, New York';
  const crow = { a: p.maker.ll, b: PLACES.customer, text: km(dist) };
  const beats = [
    { eye: 'Where it starts', line: `${p.a}, made in ${p.maker.name}.`, sub: p.maker.note,
      ctx: card('The product', esc(p.name), kv([['Made in', `${esc(p.maker.name)}, ${esc(p.maker.region)}`], ['Kind', esc(p.kind)], ['Sold on', 'Amazon.com']])),
      run: () => { mapState({ hi: ['maker'], prog: 0 }); go('origin', 2600); } },
    { eye: 'Where it is going', line: `Its buyer lives in ${CUSTOMER.name}, ${km(dist)} away.`,
      sub: `Right now it is ${clockIn('Asia/Kolkata')} in ${p.maker.name} and ${clockIn(CUSTOMER.tz)} in ${CUSTOMER.short}.`,
      run: () => { mapState({ hi: ['maker', 'customer'], prog: 0, crow }); go('overview', 2800); } },
    { eye: 'The catch', line: 'Amazon can deliver it in two days. Getting it into Amazon is the hard part.',
      sub: 'Paperwork on two continents, a long crossing, and money that has to find its way home.',
      run: () => { mapState({ hi: ['customer'], prog: 0, crow }); } },
    { eye: 'Eleven steps', line: `Eleven steps stand in between: ${count('india')} in India, ${count('sea')} in between, ${count('abroad')} over there.`,
      sub: 'Each pin marks a place where one of them happens.',
      ctx: card('Where the steps happen', 'Eleven steps, three places', `<div class="legend3"><div data-side="india"><span class="n">${count('india')}</span>in India</div><div data-side="sea"><span class="n">${count('sea')}</span>online, or on the way</div><div data-side="abroad"><span class="n">${count('abroad')}</span>in the United States</div></div>`),
      run: () => { mapState({ prog: 0 }); go('overview', 1200); } },
    { eye: 'Step 1 · Pick', line: p.pick, sub: 'Anything under about fifteen dollars rarely leaves profit once Amazon’s fees are paid.',
      ctx: card('Fit check', esc(p.short), `<div class="fit">${p.fit.map(([k, ok]) => `<div><span class="mk ${ok ? 'y' : 'n'}">${ok ? '✓' : '✕'}</span>${esc(k)}</div>`).join('')}</div>`),
      run: () => { mapState({ hi: ['maker'], prog: 0 }); go('origin', 2400); } },
    { eye: 'Step 2 · The maker', line: 'India makes things in clusters.',
      sub: `${p.maker.name} for your ${p.short.toLowerCase()}. Moradabad for brass, Kanpur for leather, Tiruppur for textiles, Guntur for spices.`,
      run: () => { mapState({ hi: ['maker'], clusters: true, prog: 0 }); go('india', 2400); } },
    { eye: 'Step 3 · The name', line: 'An Indian trademark means nothing in an American court.',
      sub: 'File with the US trademark office. Amazon accepts an application that is still pending.',
      ctx: card('Your trademark class', `Class ${p.tm[0]}`, `<p>${esc(p.tm[1])}. There are 45 classes, and each one is a separate fee.</p>`, 'abroad'),
      run: () => { mapState({ hi: ['uspto'], prog: 0 }); go('dc', 3000); } },
    { eye: 'Step 4 · India says yes', line: 'Before anything leaves India: an exporter ID, a tax promise, and a bank code.',
      sub: p.extraIndia || 'An IEC from the DGFT, an LUT on the GST portal, and an AD code from your bank.',
      ctx: card('Papers, India', p.extraIndia ? 'Four stamps to leave' : 'Three stamps to leave', stamps([['IEC', 'india'], ['GST + LUT', 'india'], ['AD code', 'india']].concat(p.extraIndia ? [['Spices Board', 'india']] : []))),
      run: () => { mapState({ hi: ['dgft', 'maker'], prog: 0 }); go('india', 3000); } },
    { eye: 'The promise', line: 'The tax promise lets you skip IGST upfront. In return, the money must come home.',
      sub: 'Remember this promise. It comes due at the very end.',
      ctx: card('Letter of Undertaking', 'Promise open', '<p>Filed free on the GST portal and renewed every April. It is closed by an e-BRC in Step 11.</p>', 'india'),
      run: () => { mapState({ hi: ['maker'], prog: 0 }); go('origin', 2400); } },
    { eye: 'Step 5 · The shop', line: 'Amazon opens your US shop. The US tax office needs to know you are not American.',
      sub: 'Skip the W-8BEN form and Amazon may hold back up to 30% of every payout.',
      ctx: card('Papers, online', 'Three more stamps', stamps([['Global Selling', 'sea'], ['EIN', 'sea'], ['W-8BEN-E', 'sea']])),
      run: () => { mapState({ hi: ['irs'], prog: 0 }); go('dc', 3000); } },
    { eye: 'Step 6 · The trap', line: 'File the name first. Print it on the product second. Photograph it third.',
      sub: `Brand Registry needs real photos with the brand permanently on the product. ${p.brand}`,
      ctx: card('The order that trips people up', 'File, print, photograph', '<div class="order"><div>Trademark filed in the US</div><div>Brand printed on the first batch</div><div>Photos sent to Brand Registry</div></div>'),
      run: () => { mapState({ hi: ['maker'], prog: 0 }); go('origin', 3000); } },
    { eye: 'Step 7 · Their rules', line: p.rules.line,
      sub: p.rules.gated ? 'Amazon keeps this category locked until you upload the proof.' : 'Every US import must also be marked with its country of origin.',
      ctx: card(`US rules · ${p.rules.level.toLowerCase()}`, esc(p.short), `<ul style="margin:.2em 0 0;padding-left:1.1em">${p.rules.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`, 'abroad'),
      run: () => { mapState({ hi: [p.rules.pin ? 'rules' : 'portus'], prog: 0 }); go(p.rules.pin ? 'dc' : 'nyc', 2600); } },
    { eye: 'Step 8 · The listing', line: p.keywords, sub: 'Main photo on pure white. Brand owners add A+ Content with the maker’s story.',
      run: () => { mapState({ hi: ['customer'], prog: 0 }); go('us', 2400); } },
    { eye: 'Step 9 · The crossing', line: sea ? 'By sea: six to eight weeks to the US. Cheap and slow.' : 'By air: fast, and roughly four times the price of sea.',
      sub: `${from} to ${to}, about ${cross}. Most sellers fly the first small batch and ship later ones by sea.`, dur: 12500,
      ctx: card(sea ? 'By sea' : 'By air', `${esc(from)} → ${esc(to)}`, kv([['Distance', `about ${cross}${sea ? ', illustrative route' : ''}`], ['Time', sea ? '6 to 8 weeks, door to Amazon' : 'fast, at about 4× the price'], ['HS code', `${p.hs[0]} · ${esc(p.hs[1])}`]]), 'sea'),
      run: async tok => {
        mapState({ prog: 0, vehicle: true }); const st = Globe.st;
        await go('portin', 1800); if (!alive(tok)) return;
        await Globe.animate(e => { st.prog = e; }, 1600); if (!alive(tok)) return;
        st.follow = { k: sea ? 2.1 : 1.5 };
        await Globe.animate(e => { st.prog = 1 + e; }, sea ? 7600 : 5600, false); if (!alive(tok)) return;
        st.follow = null;
      } },
    { eye: 'Customs', line: 'Amazon will never sign for customs. Someone must be the Importer of Record.',
      sub: `You, with a US tax number and a customs bond, or a broker for a fee. ${p.shipNote || ''}`,
      ctx: card('On arrival', 'Importer of Record', kv([['Who', 'You, or a customs broker'], ['Needs', 'A US tax number and a customs bond'], ['Never', 'Amazon']]), 'abroad'),
      run: () => { mapState({ hi: ['portus'], prog: 2, vehicle: true }); go('nyc', 2200); } },
    { eye: 'Step 10 · Launch', line: 'Start with a few hundred units. Ads and honest reviews get you seen.',
      sub: 'Amazon stores it, packs it, and delivers it in two days.',
      ctx: card('Launch small', 'Learn fast', kv([['First batch', `A few hundred ${esc(p.plural)}`], ['Reviews', 'Amazon Vine, up to 30 free units'], ['Delivery', 'Two days']]), 'sea'),
      run: async tok => {
        mapState({ hi: ['fba', 'customer'], prog: 2, vehicle: true }); const st = Globe.st;
        await go('us', 2000); if (!alive(tok)) return;
        await Globe.animate(e => { st.prog = 2 + e; }, 3200); if (!alive(tok)) return;
        st.vehicle = false; Globe.redraw();
      } },
    { eye: 'Step 11 · Money home', line: `The customer pays ${usd(v.price)}. Amazon keeps its fees and pays you every two weeks.`,
      sub: `About ${inr(r.inrPerUnit)} of each sale reaches your Indian bank, before your own costs.`, dur: 9000,
      ctx: card('One sale, example numbers', `${usd(v.price)} → ${inr(r.inrPerUnit)}`, kv([['Customer pays', usd(v.price)], ['Amazon keeps', `${usd(r.refFee + v.fba + v.ads)} in fees and ads`], ['Conversion', usd(r.convFee)], ['Your bank', inr(r.inrPerUnit)]]), 'india'),
      run: async tok => {
        mapState({ hi: ['customer', 'maker'], prog: 3, money: 'on', moneyP: 0, coins: true }); const st = Globe.st;
        await go('overview', 2200); if (!alive(tok)) return;
        await Globe.animate(e => { st.moneyP = e; }, 3000);
      } },
    { eye: 'Promise kept', line: 'Bank receipt plus shipping bill makes an e-BRC. The promise is kept.',
      sub: 'The money has to come home within nine months of shipping.',
      ctx: card('Closing the loop', 'FIRA + shipping bill = e-BRC', stamps([['FIRA', 'india'], ['Shipping bill', 'india'], ['e-BRC', 'india'], ['Promise kept', 'ok']])),
      run: () => { mapState({ hi: ['maker'], prog: 3, money: 'on', coins: true, loop: true }); go('origin', 2400); } },
    { eye: 'The loop', line: 'Goods went one way. Money and proof came back the other.',
      sub: 'Now open any step, break one on purpose, or price your own product.', dur: 14000, ctx: promo('story-end'),
      run: () => { mapState({ prog: 3, money: 'on', coins: true, loop: true }); go('overview', 2800); } }
  ];
  return beats.map(b => ({ dur: 7800, ...b }));
}

function startTour() {
  if (S.touring) return;
  S.touring = true; appEl.classList.add('touring');
  Globe.st.interactive = false; T.paused = false; setPauseIcon();
  T.beats = tourBeats(); goBeat(0); poke();
}
function restartTour() { T.beats = tourBeats(); goBeat(Math.min(T.i, T.beats.length - 1)); }
function stopTour(rerender = true) {
  if (!S.touring) return;
  S.touring = false; T.tok++; clearTimeout(T.timer); clearTimeout(idleT);
  appEl.classList.remove('touring', 'idle'); $('#ctx').classList.remove('on');
  Globe.cancel(); Globe.st.interactive = true;
  if (rerender) render();
}
function goBeat(i) {
  if (i >= T.beats.length) { stopTour(); return; }
  T.i = Math.max(0, i);
  const tok = ++T.tok, b = T.beats[T.i], ctx = $('#ctx');
  clearTimeout(T.timer); Globe.cancel();
  caption(b.eye, b.line, b.sub);
  if (b.ctx) { ctx.classList.remove('on'); ctx.innerHTML = b.ctx; void ctx.offsetWidth; ctx.classList.add('on'); }
  else ctx.classList.remove('on');
  $('#tDots').innerHTML = T.beats.map((_, j) => `<i class="${j === T.i ? 'on' : j < T.i ? 'done' : ''}"></i>`).join('');
  b.run(tok);
  T.left = b.dur; schedule();
}
function schedule() {
  clearTimeout(T.timer); if (T.paused) return;
  T.t0 = performance.now(); T.timer = setTimeout(() => goBeat(T.i + 1), T.left);
}
function togglePause() {
  T.paused = !T.paused;
  if (T.paused) { clearTimeout(T.timer); T.left = Math.max(1500, T.left - (performance.now() - T.t0)); } else schedule();
  setPauseIcon();
}
function setPauseIcon() {
  const b = $('#tPause');
  b.setAttribute('aria-label', T.paused ? 'Resume' : 'Pause');
  b.innerHTML = T.paused ? svg('<path d="M7 5l12 7-12 7z" fill="currentColor"/>', 2) : svg('<path d="M9 5v14M15 5v14"/>', 2.4);
}
let idleT = 0;
function poke() { appEl.classList.remove('idle'); clearTimeout(idleT); if (S.touring) idleT = setTimeout(() => appEl.classList.add('idle'), 2500); }

$('#tPrev').onclick = () => goBeat(T.i - 1);
$('#tNext').onclick = () => goBeat(T.i + 1);
$('#tPause').onclick = togglePause;
$('#tExit').onclick = () => stopTour();
appEl.addEventListener('pointermove', poke);
document.addEventListener('keydown', e => {
  if (!S.touring || e.target.closest('input, textarea, select')) return;
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
  else if (e.key === 'ArrowRight') goBeat(T.i + 1);
  else if (e.key === 'ArrowLeft') goBeat(T.i - 1);
  else if (e.key === 'Escape') stopTour();
  poke();
});

/* ---------- Start ---------- */
/* The coastlines are data, fetched as JSON and pinned by hash: a changed file on
   the CDN is refused. (They used to come in as a module, which runs as code.) */
const LAND = {
  coarse: ['land-110m.json', 'sha384-5oFOGoMd0tkagYW08lVco4uAi7XDEDBwBxOdeKx+SA1ihbsHiR/aFAJGretluTzG'],
  fine: ['land-50m.json', 'sha384-c0VeCJd1wVbV5WQZNjf1hcMqPr9QXweEArnbdgS1k75TBNjta2M/NddyAulA/Glb'],
};
async function landJson([file, integrity]) {
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/' + file, { integrity, mode: 'cors', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
async function loadLand() {
  try { const t = await landJson(LAND.coarse); Globe.setLand(topojson.feature(t, t.objects.land), null); }
  catch (e) { console.warn('Could not load coastlines', e); }
  $('#loading').classList.add('done');
  try { const t = await landJson(LAND.fine); Globe.setLand(null, topojson.feature(t, t.objects.land)); }
  catch (e) { console.warn('Could not load detailed coastlines', e); }
}
function boot() {
  const savedTheme = store.get('edockTheme');
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.setAttribute('data-theme', savedTheme);
  Globe.init(); buildShell(); paintTheme();
  const h = location.hash.slice(1), saved = store.get('gomh:prod');
  S.prod = PRODUCTS[h] ? h : (PRODUCTS[saved] ? saved : 'cushion');
  S.mode = store.get('gomh:mode') === 'air' ? 'air' : 'sea';
  applyProduct();
  loadLand();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { Globe.refresh(); placeDrops(); });
  if (h === 'play') setTimeout(startTour, 900);
}
try { boot(); }
catch (e) { console.error(e); $('#loading').textContent = 'The map could not start. Check your connection and reload.'; }
