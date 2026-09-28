
/* ---------- Break it ---------- */
function breakList() { const p = P(); return BREAKS.map(b => b.id === 'rules' ? { ...b, ...RULE_BREAKS[p.id] } : b); }
function rerender() { const keep = panel.scrollTop; render(); panel.scrollTop = keep; }
function renderBreak() {
  const list = breakList();
  panel.innerHTML = `<div class="eye">Break it · ${esc(P().short)}</div>
    <h2>Skip a step. See what goes wrong.</h2>
    <p class="lede">Each of these is a real way first-time exporters lose a shipment, a payout or an account.</p>
    ${list.map(b => {
      const s = STEPS[b.step - 1], on = b.id === S.brk;
      return `<div class="brkwrap">
        <button type="button" class="brk" data-side="${s.side}" data-b="${b.id}" aria-pressed="${on}"><span class="sn">Step ${b.step}</span><span>${esc(b.title)}</span></button>
        ${on ? `<div class="watch"><b>What happens:</b> ${esc(b.what)}</div><div class="analogy"><b>The fix:</b> ${esc(b.fix)}</div>
        <button type="button" class="btn pri" id="unbreak">Put the step back</button>` : ''}
      </div>`;
    }).join('')}`;
  $$('.brk', panel).forEach(b => b.onclick = () => { S.brk = S.brk === b.dataset.b ? null : b.dataset.b; rerender(); });
  const u = $('#unbreak'); if (u) u.onclick = () => { S.brk = null; rerender(); };
  const b = list.find(x => x.id === S.brk), p = P();
  if (!b) {
    mapState({ prog: 3 }); go('overview');
    caption('Break it', 'Every step exists because skipping it costs something.', 'Pick one to see what goes wrong.');
    return;
  }
  const at = { maker: p.maker.ll, portin: pinLL('portin'), portus: pinLL('portus'), fba: PLACES.fba, customer: PLACES.customer }[b.at];
  mapState({ prog: b.stop ?? 3, vehicle: b.stop != null, broken: { ll: at, label: b.label, sub: `Step ${b.step} skipped` }, money: b.money || null, coins: b.money === 'on' });
  go({ maker: 'origin', portin: 'portin', portus: 'nyc', fba: 'us', customer: 'us' }[b.at]);
  caption(`Break it · Step ${b.step}`, b.title, '');
}

/* ---------- Price it ---------- */
const FIELDS = [
  ['price', 'Sale price on Amazon', '$', 4, 60, .5, 'What the US customer pays.'],
  ['cost', 'Factory cost per unit', '₹', 50, 3000, 10, ''],
  ['ship', 'Freight to Amazon per unit, by sea', '$', 0, 6, .05, 'Air is roughly four times this.'],
  ['duty', 'US import duty', '%', 0, 60, 1, 'A placeholder. Duty on Indian goods changed several times in 2025 and 2026, so look up your HTS code.'],
  ['ref', 'Amazon referral fee', '%', 5, 20, .5, 'About 15% in most categories. Check Amazon’s fee table for yours.'],
  ['fba', 'FBA fee per unit', '$', 2, 12, .05, 'Set by size and weight.'],
  ['ads', 'Ad spend per unit sold', '$', 0, 10, .1, ''],
  ['conv', 'Currency conversion cut', '%', 0, 4, .1, 'Amazon’s converter takes a few percent; other services can be cheaper.'],
  ['fx', 'Rupees per dollar', '₹', 70, 100, .1, 'Use today’s rate.']
];
const fmtField = (u, v) => u === '$' ? usd(v) : u === '₹' ? '₹' + (v >= 100 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(1)) : (+v.toFixed(1)) + '%';
function hintFor(k, h) {
  if (k === 'ref' && S.prod === 'pepper') return 'Grocery items priced at $15 or less pay about 8%, above that about 15%. Check Amazon’s fee table.';
  if (k === 'ship' && S.mode === 'air') return 'You chose air, so the model uses four times this figure.';
  return h;
}
function savePrice() { store.set('gomh:price:' + S.prod, JSON.stringify(S.price)); }
function renderPrice() {
  const p = P();
  panel.innerHTML = `<div class="eye">Price it · ${esc(p.short)}, ${esc(p.price.unit)}</div>
    <h2>What one sale leaves you</h2>
    <div class="kpi"><span class="big" id="kP"></span><span class="psub" id="kS"></span></div>
    <div class="stack" id="stack"></div>
    <div class="legend" id="legend"></div>
    <div class="chart" id="chart"></div>
    <h3>Your numbers <button type="button" class="btn" id="reset">Reset example</button></h3>
    ${FIELDS.map(([k, lab, u, min, max, step, h]) => `<div class="fld"><label for="f-${k}">${esc(lab)}</label><output id="o-${k}" for="f-${k}"></output>
      <input type="range" id="f-${k}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${S.price[k]}">${h ? `<small>${esc(hintFor(k, h))}</small>` : ''}</div>`).join('')}
    <p class="psub" style="margin-top:.8cqw">Example numbers, not quotes. Your forwarder, Amazon’s fee table and your bank give the real ones.</p>`;
  $$('input[type=range]', panel).forEach(i => i.oninput = () => { S.price[i.dataset.k] = +i.value; savePrice(); updatePrice(false); });
  $('#reset').onclick = () => { S.price = { ...P().price }; savePrice(); rerender(); };
  mapState({ prog: 3, money: 'on', coins: true });
  go('overview');
  updatePrice(true);
}
function updatePrice(anim) {
  const v = S.price, r = calc();
  FIELDS.forEach(([k, , u]) => { const o = $('#o-' + k); if (o) o.textContent = fmtField(u, v[k]); });
  const kP = $('#kP'); kP.textContent = usd(r.profit); kP.classList.toggle('neg', r.profit < 0);
  $('#kS').textContent = `per unit (${inr(r.profit * v.fx)}) · ${r.profit < 0 ? 'a loss' : Math.round(r.margin * 100) + '% of the price'}`;
  const segs = [
    ['Amazon referral fee', r.refFee, 'var(--sea)'],
    ['FBA fee', v.fba, 'color-mix(in srgb,var(--sea) 60%,var(--card))'],
    ['Ads', v.ads, 'color-mix(in srgb,var(--sea) 30%,var(--card))'],
    ['Currency conversion', r.convFee, 'var(--faint)'],
    ['Factory cost', r.factory, 'var(--india)'],
    [S.mode === 'air' ? 'Freight by air' : 'Freight by sea', r.ship, 'color-mix(in srgb,var(--india) 45%,var(--card))'],
    ['US duty', r.duty, 'var(--abroad)'],
    ['You keep', Math.max(0, r.profit), 'var(--ok)']
  ];
  const total = Math.max(v.price, segs.reduce((a, s) => a + s[1], 0));
  $('#stack').innerHTML = segs.map(s => `<i style="width:${s[1] / total * 100}%;background:${s[2]}" title="${esc(s[0])}"></i>`).join('');
  $('#legend').innerHTML = segs.map(s => `<span class="sw" style="background:${s[2]}"></span><span>${esc(s[0])}</span><span class="v">${usd(s[1])}</span>`).join('')
    + (r.profit < 0 ? `<span class="sw" style="background:var(--warn)"></span><span>Loss per unit</span><span class="v">${usd(r.profit)}</span>` : '');
  $('#chart').innerHTML = profitChart(r);
  caption('Price it', r.profit >= 0 ? `At ${usd(v.price)}, you keep ${usd(r.profit)} a unit.` : `At ${usd(v.price)}, every sale loses ${usd(-r.profit)}.`,
    `Below ${usd(r.be)}, a sale loses money. That is why cheap products rarely work.`, anim);
}
function profitChart(r) {
  const v = S.price, W = 320, H = 136, L = 40, R = 12, T = 18, B = 22;
  const x0 = 5, x1 = Math.max(45, Math.ceil(v.price / 5) * 5 + 5);
  const prof = pr => calc({ ...v, price: pr }).profit;
  const pts = []; for (let x = x0; x <= x1; x += 1) pts.push([x, prof(x)]);
  const y0 = Math.min(0, pts[0][1]), y1 = Math.max(1, pts[pts.length - 1][1]);
  const sx = x => L + (x - x0) / (x1 - x0) * (W - L - R), sy = y => T + (y1 - y) / (y1 - y0) * (H - T - B);
  const span = y1 - y0, step = span > 40 ? 20 : span > 16 ? 10 : span > 6 ? 5 : 2, yt = [];
  for (let t = Math.ceil(y0 / step) * step; t <= y1 + 1e-9; t += step) yt.push(t);
  const xt = []; for (let t = 10; t <= x1; t += 10) xt.push(t);
  const mono = 'font-family="Manrope, system-ui, sans-serif" font-size="9" font-weight="700"';
  const beIn = r.be > x0 && r.be < x1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profit per unit at each sale price. Break-even is ${usd(r.be)}.">
    <text x="${L}" y="10" ${mono} fill="var(--muted)" letter-spacing="1">PROFIT PER UNIT, BY SALE PRICE</text>
    ${yt.map(t => `<line x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--line-strong)" stroke-width="${t === 0 ? 1.3 : .6}" ${t === 0 ? '' : 'stroke-dasharray="2 3"'}/>
      <text x="${L - 5}" y="${sy(t) + 3}" text-anchor="end" ${mono} fill="var(--muted)">${t < 0 ? '−$' + -t : '$' + t}</text>`).join('')}
    ${xt.map(t => `<text x="${sx(t)}" y="${H - 6}" text-anchor="middle" ${mono} fill="var(--muted)">$${t}</text>`).join('')}
    <polyline points="${pts.map(([a, b]) => `${sx(a).toFixed(1)},${sy(b).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--sea)" stroke-width="2.2" stroke-linejoin="round"/>
    ${beIn ? `<line x1="${sx(r.be)}" x2="${sx(r.be)}" y1="${T}" y2="${H - B}" stroke="var(--warn)" stroke-dasharray="3 3"/>
      <text x="${sx(r.be) + 4}" y="${T + 9}" ${mono} fill="var(--warn)">break-even ${usd(r.be)}</text>` : ''}
    <circle cx="${sx(v.price)}" cy="${sy(r.profit)}" r="4.5" fill="${r.profit < 0 ? 'var(--warn)' : 'var(--ok)'}" stroke="var(--card)" stroke-width="2"/>
  </svg>`;
}

/* ---------- Money home ---------- */
function moneyTimeline() {
  const v = S.price, r = calc(), sea = S.mode === 'sea';
  const units = 300, perDay = 5, value = Math.round(units * v.cost * 1.5);
  const arrive = sea ? 49 : 10, firstSale = arrive + 5, payouts = [];
  let sold = 0, cum = 0, closed = null;
  for (let d = firstSale + 14; d <= 300 && sold < units; d += 14) {
    const n = Math.min(units - sold, perDay * 14); sold += n; cum += n * Math.max(0, r.inrPerUnit);
    payouts.push({ d, cum }); if (closed == null && cum >= value) closed = d;
  }
  return { units, perDay, value, arrive, payouts, closed, deadline: 270, per: r.inrPerUnit };
}
function renderMoney() {
  const p = P(), v = S.price, r = calc(), t = moneyTimeline();
  const link = (side, txt, val) => `<div class="link" data-side="${side}"><span class="ic"></span><span>${txt}</span><span class="v">${val}</span></div>`;
  panel.innerHTML = `<div class="eye">Money home · ${esc(p.short)}</div>
    <h2>How one sale becomes rupees</h2>
    <div class="chain">
      ${link('abroad', `The customer in ${esc(CUSTOMER.short)} pays`, usd(v.price))}
      ${link('sea', 'Amazon keeps its fees and your ad spend', '−' + usd(r.refFee + v.fba + v.ads))}
      ${link('sea', 'Payout to you, about every 14 days', usd(r.payout))}
      ${link('sea', 'Converted to rupees, minus a cut', '−' + usd(r.convFee))}
      ${link('india', 'Lands in your Indian business account', inr(r.inrPerUnit))}
      ${link('india', 'Your bank issues a FIRA receipt', 'proof')}
      ${link('india', 'FIRA + shipping bill, matched on DGFT', 'e-BRC')}
    </div>
    <h3>The nine-month clock</h3>
    <p class="psub">A shipping bill stays open with the central bank until money matching it comes home, within nine months of shipping. This example ships ${t.units} ${esc(p.plural)} declared at ${inr(t.value)}, and sells ${t.perDay} a day.</p>
    <label for="day" class="psub">Days since the goods left India: <b id="dayOut"></b></label>
    <input type="range" id="day" min="0" max="300" step="1" value="${S.day}">
    <div class="clock" id="clock"></div>
    <div class="status" id="status"></div>`;
  $('#day').oninput = e => { S.day = +e.target.value; updateMoney(false); };
  mapState({ prog: 3, money: 'on', coins: true, hi: ['maker', 'customer'] });
  go('overview');
  updateMoney(true);
}
function updateMoney(anim) {
  const t = moneyTimeline(), day = S.day, p = P();
  const home = (t.payouts.filter(x => x.d <= day).pop() || { cum: 0 }).cum;
  const done = t.closed != null && day >= t.closed;
  $('#dayOut').textContent = `${day} (${(day / 30).toFixed(1)} months)`;
  $('#clock').innerHTML = clockSvg(t, day);
  const st = $('#status');
  if (done) { st.className = 'status closed'; st.textContent = `Closed on day ${t.closed}. The payouts cover the ${inr(t.value)} on the shipping bill, the e-BRC is generated, and the promise from Step 4 is kept.`; }
  else if (day >= t.deadline) { st.className = 'status late'; st.textContent = `Nine months have passed and ${inr(t.value - home)} is still missing. Talk to your bank before this blocks the next shipment.`; }
  else { st.className = 'status open'; st.textContent = `Day ${day}: ${inr(home)} of ${inr(t.value)} is home. The shipment stays open until all of it is matched.`; }
  Globe.st.loop = done ? p.maker.ll : null; Globe.redraw();
  caption('Money home', done ? 'Bank receipt plus shipping bill makes an e-BRC. Promise kept.' : 'Goods went out. Now the money has to come home.',
    `Each sale sends about ${inr(t.per)} back to your bank.`, anim);
}
function clockSvg(t, day) {
  const W = 320, H = 78, L = 10, R = 12, y = 36, sx = d => L + d / 300 * (W - L - R);
  const mono = 'font-family="Manrope, system-ui, sans-serif" font-size="9" font-weight="700"';
  const months = [0, 90, 180, 270].map(d => `<line x1="${sx(d)}" x2="${sx(d)}" y1="${y - 4}" y2="${y + 4}" stroke="var(--line-strong)"/>
    <text x="${sx(d)}" y="${y + 18}" text-anchor="middle" ${mono} fill="var(--muted)">${d / 30} mo</text>`).join('');
  const dots = t.payouts.map(x => `<circle cx="${sx(x.d)}" cy="${y}" r="3.2" fill="${x.d <= day ? 'var(--india)' : 'var(--card)'}" stroke="var(--india)" stroke-width="1.4"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline of payouts over nine months">
    <line x1="${sx(0)}" x2="${sx(300)}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
    <line x1="${sx(0)}" x2="${sx(day)}" y1="${y}" y2="${y}" stroke="color-mix(in srgb,var(--sea) 45%,var(--card))" stroke-width="6" stroke-linecap="round"/>
    ${months}
    <line x1="${sx(t.deadline)}" x2="${sx(t.deadline)}" y1="${y - 20}" y2="${y + 6}" stroke="var(--warn)" stroke-dasharray="3 2"/>
    <text x="${sx(t.deadline)}" y="${y - 23}" text-anchor="middle" ${mono} fill="var(--warn)">deadline</text>
    <rect x="${sx(t.arrive) - 3.5}" y="${y - 3.5}" width="7" height="7" fill="var(--sea)"/>
    <text x="${sx(t.arrive)}" y="${y - 10}" text-anchor="middle" ${mono} fill="var(--sea-ink)">at Amazon</text>
    ${dots}
    ${t.closed != null ? `<circle cx="${sx(t.closed)}" cy="${y}" r="6" fill="var(--ok)" stroke="var(--card)" stroke-width="1.5"/>
      <text x="${sx(t.closed) + (t.closed > 200 ? -8 : 8)}" y="${y - 10}" text-anchor="${t.closed > 200 ? 'end' : 'start'}" ${mono} fill="var(--ok)">e-BRC</text>` : ''}
    <line x1="${sx(day)}" x2="${sx(day)}" y1="${y - 12}" y2="${y + 12}" stroke="var(--ink)" stroke-width="1.6"/>
  </svg>`;
}

/* ---------- Dictionary ---------- */
function renderDict() {
  panel.innerHTML = `<div class="eye">Dictionary</div>
    <h2>Every official word, in plain English</h2>
    <label class="search">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 2)}<input type="search" id="q" placeholder="Search, like LUT or Importer of Record" aria-label="Search the dictionary"></label>
    <div id="terms">${GLOSS.map(t => `<div class="term" id="g-${t.id}" data-side="${t.side}"><div class="k">${esc(t.k)}</div><div class="f">${esc(t.full)}</div><div>${esc(t.v)}</div></div>`).join('')}</div>
    <p class="psub" id="noHit" hidden>No term matches that. Try a shorter word.</p>`;
  const q = $('#q');
  q.oninput = () => {
    const s = q.value.trim().toLowerCase(); let n = 0;
    $$('.term', panel).forEach(t => { const on = !s || t.textContent.toLowerCase().includes(s); t.hidden = !on; if (on) n++; });
    $('#noHit').hidden = n > 0;
  };
  if (S.term) {
    const el = $('#g-' + S.term); S.term = null;
    if (el) { el.classList.add('hit'); requestAnimationFrame(() => el.scrollIntoView({ block: 'center' })); setTimeout(() => el.classList.remove('hit'), 2600); }
  }
  mapState({ prog: 3 }); go('overview');
  caption('Dictionary', 'Every official term on the journey, decoded.', 'Amber lives in India, blue in the US, teal with Amazon and the shipping in between.');
}
