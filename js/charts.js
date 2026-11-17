/* Minimal SVG line charts (single series, small multiples). 2px line, >=8px markers with a
   surface ring, hairline recessive grid, selective direct label, crosshair + tooltip on hover. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const C = (F.Chart = {});

  const niceStep = (span, n) => {
    const raw = span / Math.max(1, n);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return step * mag;
  };

  /**
   * opt: { data:[{x:'YYYY-MM-DD', y:Number}], unit:'kg', dec:1, h:180, goal:Number|null, goalLabel:'목표',
   *        good:'down'|'up', label:'체중' }
   */
  C.line = (el, opt) => {
    const data = (opt.data || []).filter((d) => d.y != null && !isNaN(d.y)).sort((a, b) => (a.x < b.x ? -1 : 1));
    const W = Math.max(260, Math.round(el.clientWidth || 320));
    const H = opt.h || 180;
    const P = { l: 44, r: 18, t: 22, b: 28 };
    const dec = opt.dec == null ? 1 : opt.dec;
    const fmt = (v) => F.num(v, dec);
    if (!data.length) { el.innerHTML = `<div class="chart-empty">기록이 쌓이면 그래프가 그려져요</div>`; return; }
    const t = data.map((d) => F.parseKey(d.x).getTime());
    let t0 = t[0], t1 = t[t.length - 1];
    if (t0 === t1) { t0 -= 15 * 864e5; t1 += 15 * 864e5; }
    let lo = Math.min(...data.map((d) => d.y)), hi = Math.max(...data.map((d) => d.y));
    if (opt.goal != null) { lo = Math.min(lo, opt.goal); hi = Math.max(hi, opt.goal); }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const step = niceStep(hi - lo, 3);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    if (hi === lo) hi = lo + step;
    const X = (ms) => P.l + ((ms - t0) / (t1 - t0)) * (W - P.l - P.r);
    const Y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    const pts = data.map((d, i) => ({ x: X(t[i]), y: Y(d.y), d }));
    const ticks = [];
    for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
    const tickDec = step < 1 ? 1 : 0;
    const grid = ticks.map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="c-grid"/>
      <text x="${P.l - 8}" y="${Y(v) + 4}" class="c-ytick" text-anchor="end">${F.num(v, tickDec)}</text>`).join('');
    // x labels: all if few, else first / middle / last
    const idxs = data.length <= 5 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];
    const xl = idxs.map((i) => `<text x="${pts[i].x}" y="${H - 8}" class="c-xtick" text-anchor="${i === 0 && data.length > 1 ? 'start' : i === data.length - 1 && data.length > 1 ? 'end' : 'middle'}">${F.dateLabel(data[i].x, false)}</text>`).join('');
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
    const area = data.length > 1 ? `${line}L${pts[pts.length - 1].x.toFixed(1)},${(H - P.b).toFixed(1)}L${pts[0].x.toFixed(1)},${(H - P.b).toFixed(1)}Z` : '';
    const goal = opt.goal != null ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(opt.goal)}" y2="${Y(opt.goal)}" class="c-goal"/>
      <text x="${W - P.r}" y="${Y(opt.goal) - 6}" class="c-goal-t" text-anchor="end">${F.esc(opt.goalLabel || '목표')} ${fmt(opt.goal)}</text>` : '';
    const marks = pts.map((p, i) => `<rect x="${(p.x - 5).toFixed(1)}" y="${(p.y - 5).toFixed(1)}" width="10" height="10" class="c-mark${i === pts.length - 1 ? ' last' : ''}" data-i="${i}"/>`).join('');
    const lp = pts[pts.length - 1];
    const lastLabel = `<text x="${Math.min(lp.x, W - P.r - 2)}" y="${Math.max(12, lp.y - 12)}" class="c-last" text-anchor="${data.length > 1 ? 'end' : 'middle'}">${fmt(lp.d.y)}${F.esc(opt.unit || '')}</text>`;
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${F.esc(opt.label || '')} 추이">
        ${grid}${xl}${goal}
        ${area ? `<path d="${area}" class="c-area"/>` : ''}
        <path d="${line}" class="c-line"/>
        <line class="c-cross" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" style="display:none"/>
        ${marks}${lastLabel}
        <rect class="c-hit" x="${P.l - 10}" y="0" width="${W - P.l - P.r + 20}" height="${H}"/>
      </svg><div class="c-tip" hidden></div>`;
    // hover layer
    const svg = el.querySelector('svg'), tip = el.querySelector('.c-tip'), cross = el.querySelector('.c-cross');
    const hit = el.querySelector('.c-hit');
    const show = (ev) => {
      const r = svg.getBoundingClientRect();
      const mx = ((ev.clientX - r.left) / r.width) * W;
      let bi = 0, bd = Infinity;
      pts.forEach((p, i) => { const dd = Math.abs(p.x - mx); if (dd < bd) { bd = dd; bi = i; } });
      const p = pts[bi];
      cross.setAttribute('x1', p.x); cross.setAttribute('x2', p.x); cross.style.display = '';
      el.querySelectorAll('.c-mark').forEach((m) => m.classList.toggle('hot', +m.dataset.i === bi));
      const prev = bi > 0 ? data[bi - 1].y : null;
      const delta = prev != null ? p.d.y - prev : null;
      let cls = '';
      if (delta != null && opt.good) cls = (delta < 0) === (opt.good === 'down') ? 'up-good' : delta === 0 ? '' : 'up-bad';
      tip.innerHTML = `<b>${F.dateLong(p.d.x)}</b><span class="n">${fmt(p.d.y)}<small>${F.esc(opt.unit || '')}</small></span>${delta != null ? `<span class="d ${cls}">${F.signed(delta, dec)}</span>` : ''}`;
      tip.hidden = false;
      const px = (p.x / W) * r.width;
      tip.style.left = `${F.clamp(px, 60, r.width - 60)}px`;
      tip.style.top = `${(p.y / H) * r.height}px`;
    };
    const hide = () => { tip.hidden = true; cross.style.display = 'none'; el.querySelectorAll('.c-mark.hot').forEach((m) => m.classList.remove('hot')); };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
  };

  /* tiny inline sparkline for exercise history (no axes) */
  C.spark = (vals, w = 120, h = 32) => {
    vals = vals.filter((v) => v != null);
    if (vals.length < 2) return '';
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 8) + 4, h - 4 - ((v - lo) / span) * (h - 8)]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
    const l = pts[pts.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}" class="c-line"/><rect x="${l[0] - 4}" y="${l[1] - 4}" width="8" height="8" class="c-mark last"/></svg>`;
  };
})(window.F);
