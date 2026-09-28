/* ---------- Globe: an orthographic canvas map with a flying camera ---------- */
if (!window.d3 || !window.topojson) document.getElementById('loading').textContent = 'The map library did not load. Check your connection and reload.';
const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const Globe = (() => {
  const cv = document.getElementById('map');
  const g = cv.getContext('2d');
  const base = document.createElement('canvas');
  const bg = base.getContext('2d');
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.3);
  const pathB = d3.geoPath(proj, bg), pathO = d3.geoPath(proj, g);
  const GRAT = d3.geoGraticule().step([15, 15])();
  const SPHERE = { type: 'Sphere' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let land = null, landHi = null, W = 1, H = 1, dpr = 1, baseKey = '', themeV = 0;
  let tw = null, anims = [], running = false, dirty = true, lastDraw = 0, C = {};
  let onPin = () => {};
  const cam = { lon: 30, lat: 28, k: 1, cx: .35 };
  const st = { legs: [], prog: 0, vehicle: false, pins: [], hi: new Set(), clusters: null, money: null, moneyP: 0, coins: false,
    loop: null, broken: null, crow: null, drawn: [], boxes: [], interactive: true, follow: null, safeR: .69 };

  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const A = (c, a) => { if (!c || c[0] !== '#') return c; const [r, gg, b] = hex(c); return `rgba(${r},${gg},${b},${a})`; };
  const line = pts => ({ type: 'LineString', coordinates: pts });
  const visible = ll => d3.geoDistance(ll, [cam.lon, cam.lat]) < Math.PI / 2 - .02;
  const R0 = () => H * .42;

  function readColors() {
    const cs = getComputedStyle(document.getElementById('app'));
    const v = n => cs.getPropertyValue(n).trim();
    C = { stage: v('--stage'), ocean: v('--ocean'), edge: v('--ocean-edge'), land: v('--land'), coast: v('--coast'), grat: v('--grat'),
      ink: v('--ink'), muted: v('--muted'), faint: v('--faint'), card: v('--card'), india: v('--india'), sea: v('--sea'),
      abroad: v('--abroad'), warn: v('--warn'), ok: v('--ok') };
    themeV++; dirty = true; kick();
  }
  function resize() {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = base.width = Math.round(W * dpr); cv.height = base.height = Math.round(H * dpr);
    baseKey = ''; dirty = true; kick();
  }

  function densify(pts, step = .6) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(d3.geoDistance(a, b) / RAD / step)), ip = d3.geoInterpolate(a, b);
      for (let j = 1; j <= n; j++) out.push(ip(j / n));
    }
    return out;
  }
  function mkPath(pts) {
    const d = densify(pts), cum = [0];
    for (let i = 1; i < d.length; i++) cum.push(cum[i - 1] + d3.geoDistance(d[i - 1], d[i]));
    return { pts: d, cum, len: cum[cum.length - 1] };
  }
  function partial(l, f) {
    if (f >= 1) return l.pts;
    const target = f * l.len; let j = clamp(d3.bisectLeft(l.cum, target), 1, l.pts.length - 1);
    const t = clamp((target - l.cum[j - 1]) / ((l.cum[j] - l.cum[j - 1]) || 1), 0, 1);
    return l.pts.slice(0, j).concat([d3.geoInterpolate(l.pts[j - 1], l.pts[j])(t)]);
  }
  function posAt(p) {
    if (!st.legs.length) return null;
    const i = clamp(Math.floor(p), 0, st.legs.length - 1), l = st.legs[i], pts = partial(l, clamp(p - i, 0, 1));
    return { ll: pts[pts.length - 1], leg: l };
  }

  /* ---- drawing ---- */
  function setProj() { proj.rotate([-cam.lon, -cam.lat]).scale(R0() * cam.k).translate([cam.cx * W, H * .47]); }
  function drawBase(moving) {
    const hi = landHi && cam.k > 1.6 && !(moving && cam.k < 3);
    const L = hi ? landHi : (land || landHi);
    const key = [cam.lon.toFixed(3), cam.lat.toFixed(3), cam.k.toFixed(4), cam.cx.toFixed(4), W, H, themeV, !!L, hi].join();
    if (key === baseKey) return; baseKey = key;
    const c = bg; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const [x, y] = proj.translate(), R = proj.scale();
    const halo = c.createRadialGradient(x, y, R * .98, x, y, R * 1.14);
    halo.addColorStop(0, A(C.india, .14)); halo.addColorStop(1, A(C.india, 0));
    c.fillStyle = halo; c.beginPath(); c.arc(x, y, R * 1.14, 0, 2 * Math.PI); c.fill();
    const oc = c.createRadialGradient(x - R * .35, y - R * .4, R * .05, x, y, R * 1.02);
    oc.addColorStop(0, C.ocean); oc.addColorStop(1, C.edge);
    c.beginPath(); pathB(SPHERE); c.fillStyle = oc; c.fill();
    c.beginPath(); pathB(GRAT); c.strokeStyle = C.grat; c.lineWidth = .8; c.stroke();
    if (L) { c.beginPath(); pathB(L); c.fillStyle = C.land; c.fill(); c.strokeStyle = C.coast; c.lineWidth = .6; c.stroke(); }
    c.beginPath(); pathB(SPHERE); c.strokeStyle = A(C.coast, .7); c.lineWidth = 1; c.stroke();
    if (cam.k >= 1.8) { region(c, 'INDIA', [79.5, 23.2]); region(c, 'UNITED STATES', [-99, 39.5]); }
  }
  function region(c, txt, ll) {
    if (!visible(ll)) return;
    const [x, y] = proj(ll), fs = clamp(W * .0085 * Math.min(1.6, Math.sqrt(cam.k)), 9, 16);
    c.font = `600 ${fs}px "Oswald", system-ui, sans-serif`; c.fillStyle = A(C.muted, .5);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '0.35em';
    c.fillText(txt, x, y);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  }
  function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function label(x, y, t1, t2, col, strong) {
    const c = g, fs = clamp(W * .0082, 10.5, 14);
    if (W < 520) t2 = null; // small screens: one-line labels
    t1 = String(t1).toUpperCase();
    const TITLE = `500 ${fs}px "Oswald", system-ui, sans-serif`, SUB = `600 ${fs * .86}px "Manrope", system-ui, sans-serif`;
    const ls = on => { if ('letterSpacing' in c) c.letterSpacing = on ? '0.06em' : '0px'; };
    c.font = TITLE; ls(true); const w1 = c.measureText(t1).width; ls(false);
    c.font = SUB; const w2 = t2 ? c.measureText(t2).width : 0;
    const w = Math.max(w1, w2) + 14, h = t2 ? fs * 2.6 : fs * 1.75;
    const top = W * .052, bottom = H - W * .085, right = W * st.safeR;
    for (const [tx, ty] of [[x + 12, y - h / 2], [x - 12 - w, y - h / 2], [x - w / 2, y - h - 12], [x - w / 2, y + 12]]) {
      if (tx < 6 || ty < top || tx + w > right || ty + h > bottom) continue;
      if (st.boxes.some(o => tx < o.x + o.w && tx + w > o.x && ty < o.y + o.h && ty + h > o.y)) continue;
      st.boxes.push({ x: tx, y: ty, w, h });
      c.beginPath(); rr(c, tx, ty, w, h, h / 2 > 12 ? 10 : h / 2); c.fillStyle = A(C.card, .9); c.fill();
      c.lineWidth = strong ? 1.6 : 1; c.strokeStyle = A(col, strong ? .9 : .45); c.stroke();
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = TITLE; ls(true); c.fillStyle = strong ? col : C.ink; c.fillText(t1, tx + 7, ty + fs * 1.2); ls(false);
      if (t2) { c.font = SUB; c.fillStyle = C.muted; c.fillText(t2, tx + 7, ty + fs * 2.25); }
      return true;
    }
    return false;
  }
  function drawRoute() {
    const c = g; c.lineCap = 'round'; c.lineJoin = 'round';
    c.setLineDash([3, 5]); c.lineWidth = 1.2;
    for (const l of st.legs) { c.beginPath(); pathO(line(l.pts)); c.strokeStyle = A(C[l.side], .45); c.stroke(); }
    c.setLineDash([]);
    st.legs.forEach((l, i) => {
      if (st.prog <= i) return;
      const pts = partial(l, Math.min(1, st.prog - i));
      c.beginPath(); pathO(line(pts)); c.strokeStyle = A(C.stage, .85); c.lineWidth = 6; c.stroke();
      c.beginPath(); pathO(line(pts)); c.strokeStyle = C[l.side]; c.lineWidth = l.kind === 'truck' ? 2.4 : 3.2;
      if (l.kind === 'plane') c.setLineDash([8, 5]);
      c.stroke(); c.setLineDash([]);
    });
  }
  function drawVehicle() {
    if (!st.vehicle) return;
    const pos = posAt(st.prog); if (!pos || !visible(pos.ll)) return;
    const [x, y] = proj(pos.ll), c = g;
    c.beginPath(); c.arc(x, y, 11, 0, 2 * Math.PI); c.fillStyle = C[pos.leg.side]; c.fill(); c.lineWidth = 2.5; c.strokeStyle = C.card; c.stroke();
    c.fillStyle = C.card; c.beginPath();
    if (pos.leg.kind === 'ship') { c.moveTo(x - 6.5, y); c.lineTo(x + 6.5, y); c.lineTo(x + 4, y + 4.5); c.lineTo(x - 4, y + 4.5); c.closePath(); c.rect(x - 3.5, y - 4.5, 5, 3.5); }
    else if (pos.leg.kind === 'plane') { c.moveTo(x + 7, y); c.lineTo(x - 5, y - 5.5); c.lineTo(x - 2.5, y); c.lineTo(x - 5, y + 5.5); c.closePath(); }
    else { c.rect(x - 6.5, y - 4, 8.5, 6.5); c.rect(x + 2.5, y - 1.5, 4, 4); }
    c.fill();
  }
  function drawCrow() {
    const { a, b, text } = st.crow, c = g;
    c.setLineDash([2, 6]); c.lineWidth = 1.6; c.strokeStyle = A(C.ink, .55);
    c.beginPath(); pathO(line(densify([a, b], 1))); c.stroke(); c.setLineDash([]);
    const mid = d3.geoInterpolate(a, b)(.5);
    if (visible(mid)) { const [x, y] = proj(mid); label(x, y, text, 'as the crow flies', C.ink, true); }
  }
  function drawMoney(now) {
    const m = st.money; if (!m || st.moneyP <= 0) return false;
    const c = g, col = m.frozen ? C.faint : C.india;
    c.setLineDash([6, 5]); c.lineWidth = 2.4; c.strokeStyle = col;
    c.beginPath(); pathO(line(partial(m, st.moneyP))); c.stroke(); c.setLineDash([]);
    if (!st.coins || m.frozen || reduce.matches) return false;
    for (let i = 0; i < 4; i++) {
      const f = (now / 5200 + i / 4) % 1; if (f > st.moneyP) continue;
      const pp = partial(m, f), ll = pp[pp.length - 1]; if (!visible(ll)) continue;
      const [x, y] = proj(ll);
      c.beginPath(); c.arc(x, y, 7, 0, 2 * Math.PI); c.fillStyle = C.india; c.fill(); c.lineWidth = 1.5; c.strokeStyle = C.card; c.stroke();
      c.fillStyle = C.card; c.font = '800 9px "Manrope", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(f < .5 ? '$' : '₹', x, y + .5);
    }
    return true;
  }
  function ring(x, y, now, col, period, r0, spread, alpha) {
    const t = (now % period) / period; g.beginPath(); g.arc(x, y, r0 + t * spread, 0, 2 * Math.PI);
    g.strokeStyle = A(col, (1 - t) * alpha); g.lineWidth = 2; g.stroke();
  }
  function drawBroken(now) {
    const b = st.broken; if (!visible(b.ll)) return;
    const [x, y] = proj(b.ll), c = g;
    if (!reduce.matches) { ring(x, y, now, C.warn, 1400, 9, 30, .75); ring(x, y, now + 700, C.warn, 1400, 9, 30, .75); }
    c.beginPath(); c.arc(x, y, 9, 0, 2 * Math.PI); c.fillStyle = C.warn; c.fill(); c.lineWidth = 2; c.strokeStyle = C.card; c.stroke();
    c.beginPath(); c.moveTo(x - 3.3, y - 3.3); c.lineTo(x + 3.3, y + 3.3); c.moveTo(x + 3.3, y - 3.3); c.lineTo(x - 3.3, y + 3.3); c.lineWidth = 2.2; c.stroke();
    label(x, y, b.label, b.sub, C.warn, true);
  }
  function drawLoop(now) {
    const ll = st.loop; if (!visible(ll)) return;
    const [x, y] = proj(ll), c = g;
    if (!reduce.matches) ring(x, y, now, C.ok, 2400, 15, 24, .55);
    c.beginPath(); c.arc(x, y, 15, 0, 2 * Math.PI); c.fillStyle = A(C.card, .9); c.fill(); c.strokeStyle = C.ok; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 1.5, y + 4.5); c.lineTo(x + 6, y - 4.5); c.strokeStyle = C.ok; c.lineWidth = 2.8; c.stroke();
  }
  function drawClusters() {
    for (const k of st.clusters.list) {
      if (!visible(k.ll) || k.id === st.clusters.sel) continue; // the maker pin already marks your own cluster
      const [x, y] = proj(k.ll), sel = false;
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = sel ? C.india : A(C.india, .6); g.fillRect(-4.5, -4.5, 9, 9);
      g.strokeStyle = C.card; g.lineWidth = 1.5; g.strokeRect(-4.5, -4.5, 9, 9); g.restore();
      st.drawn.push({ p: { step: 2 }, x, y });
      label(x, y, k.name, k.what, C.india, sel);
    }
  }
  function drawPins(now) {
    const order = st.pins.slice().sort((a, b) => (st.hi.has(b.id) - st.hi.has(a.id)) || ((b.major | 0) - (a.major | 0)));
    let pulse = false;
    for (const p of order) {
      if (!visible(p.ll)) continue;
      const [x, y] = proj(p.ll), hi = st.hi.has(p.id), col = C[p.side] || C.ink, c = g;
      c.globalAlpha = st.hi.size && !hi ? .55 : 1;
      if (hi && !reduce.matches) { ring(x, y, now, col, 1800, 6, 18, .55); pulse = true; }
      c.beginPath(); if (p.office) c.rect(x - 5, y - 5, 10, 10); else c.arc(x, y, hi ? 6 : 5, 0, 2 * Math.PI);
      c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = C.card; c.stroke();
      c.globalAlpha = 1;
      st.drawn.push({ p, x, y });
      if (hi || (!st.hi.size && p.major)) label(x, y, p.label, p.sub, col, hi);
    }
    return pulse;
  }
  function draw(now, moving) {
    setProj(); drawBase(moving);
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(base, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    st.drawn = []; st.boxes = [];
    if (st.legs.length) drawRoute();
    let pulse = drawMoney(now);
    if (st.broken) { drawBroken(now); pulse = true; }
    if (st.crow) drawCrow();
    if (st.loop) { drawLoop(now); pulse = true; }
    pulse = drawPins(now) || pulse;
    if (st.clusters) drawClusters();
    drawVehicle();
    return pulse;
  }

  /* ---- animation loop ---- */
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }
  function frame(now) {
    let active = false;
    if (tw) {
      const t = clamp((now - tw.t0) / tw.dur, 0, 1), e = ease(t), [lo, la] = tw.gi(e);
      cam.lon = lo; cam.lat = la; cam.cx = tw.from.cx + (tw.to.cx - tw.from.cx) * e;
      cam.k = Math.exp(tw.lk0 + (tw.lk1 - tw.lk0) * e) * (1 - tw.bump * Math.sin(Math.PI * e));
      if (t >= 1) { const r = tw.res; tw = null; r(); }
      active = true;
    }
    for (const a of anims.slice()) {
      const t = clamp((now - a.t0) / a.dur, 0, 1); a.fn(a.ease ? ease(t) : t);
      if (t >= 1) { anims.splice(anims.indexOf(a), 1); a.res(); }
      active = true;
    }
    if (st.follow && !tw) {
      const pos = posAt(st.prog);
      if (pos) {
        const [lo, la] = pos.ll, dl = ((lo - cam.lon + 540) % 360) - 180;
        cam.lon += dl * .09; cam.lat += (la - cam.lat) * .09; cam.k += (st.follow.k - cam.k) * .06; cam.cx += (.5 - cam.cx) * .1;
        active = true;
      }
    }
    let pulse = true;
    if (dirty || active || now - lastDraw > 33) { pulse = draw(now, active); lastDraw = now; dirty = false; }
    if (active || pulse) requestAnimationFrame(frame); else running = false;
  }
  function stopTween() { if (tw) { const r = tw.res; tw = null; r(); } }
  function flyTo(t, dur = 1800) {
    const to = { lon: t.lon ?? cam.lon, lat: t.lat ?? cam.lat, k: t.k ?? cam.k, cx: t.cx ?? cam.cx };
    st.follow = null; stopTween();
    if (reduce.matches || dur <= 0) { Object.assign(cam, to); dirty = true; kick(); return Promise.resolve(); }
    const from = { ...cam }, dist = d3.geoDistance([from.lon, from.lat], [to.lon, to.lat]);
    return new Promise(res => {
      tw = { from, to, t0: performance.now(), dur, res, gi: d3.geoInterpolate([from.lon, from.lat], [to.lon, to.lat]),
        lk0: Math.log(from.k), lk1: Math.log(to.k), bump: Math.min(.55, dist / Math.PI * 1.2) };
      kick();
    });
  }
  function animate(fn, dur, eased = true) {
    if (reduce.matches || dur <= 0) { fn(1); dirty = true; kick(); return Promise.resolve(); }
    return new Promise(res => { anims.push({ fn, dur, t0: performance.now(), ease: eased, res }); kick(); });
  }
  function cancel() { for (const a of anims) a.res(); anims = []; stopTween(); st.follow = null; }
  function fit(points, margin = .86) {
    let x = 0, y = 0, z = 0;
    for (const [lo, la] of points) { const l = lo * RAD, p = la * RAD; x += Math.cos(p) * Math.cos(l); y += Math.cos(p) * Math.sin(l); z += Math.sin(p); }
    const n = Math.hypot(x, y, z) || 1, lon = Math.atan2(y, x) / RAD, lat = Math.asin(clamp(z / n, -1, 1)) / RAD;
    let dm = 0; for (const p of points) dm = Math.max(dm, d3.geoDistance(p, [lon, lat]));
    return { lon, lat, k: clamp(margin / Math.sin(Math.min(dm, 1.5)), .9, 7) };
  }

  /* ---- input ---- */
  function hit(e) {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 16;
    for (const o of st.drawn) { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function bindInput() {
    let d = null;
    cv.addEventListener('pointerdown', e => { if (st.interactive) d = { x: e.clientX, y: e.clientY, lon: cam.lon, lat: cam.lat, moved: false, id: e.pointerId }; });
    cv.addEventListener('pointermove', e => {
      if (d) {
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) > 4) { d.moved = true; try { cv.setPointerCapture(d.id); } catch (_) {} cancel(); }
        if (d.moved) { const R = R0() * cam.k; cam.lon = d.lon - dx / R / RAD; cam.lat = clamp(d.lat + dy / R / RAD, -70, 80); dirty = true; kick(); }
        return;
      }
      cv.style.cursor = st.interactive && hit(e) ? 'pointer' : '';
    });
    cv.addEventListener('pointerup', e => { if (d && !d.moved) { const h = hit(e); if (h) onPin(h.p); } d = null; });
    cv.addEventListener('pointercancel', () => { d = null; });
    cv.addEventListener('wheel', e => {
      if (!st.interactive) return;
      e.preventDefault(); cancel();
      cam.k = clamp(cam.k * Math.exp(-e.deltaY * .0015), .8, 16); dirty = true; kick();
    }, { passive: false });
  }

  return {
    cam, st, flyTo, animate, cancel, fit, mkPath, posAt,
    init() {
      readColors(); resize(); new ResizeObserver(resize).observe(cv);
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors);
      new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      bindInput();
    },
    setLand(a, b) { if (a) land = a; if (b) landHi = b; baseKey = ''; dirty = true; kick(); },
    setRoute(legs) { st.legs = legs.map(l => ({ ...l, ...mkPath(l.pts) })); dirty = true; kick(); },
    legKm(i) { return (st.legs[i] ? st.legs[i].len : 0) * 6371; },
    refresh() { baseKey = ''; dirty = true; kick(); },
    redraw() { dirty = true; kick(); },
    onPin(fn) { onPin = fn; }
  };
})();
