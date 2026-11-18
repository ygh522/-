/* Core utilities: DOM, dates, formatting, persistence (localStorage + IndexedDB), UI primitives. */
window.F = window.F || {};
(function (F) {
  'use strict';

  /* ---------- DOM ---------- */
  F.$ = (sel, root) => (root || document).querySelector(sel);
  F.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  F.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);

  /* ---------- Dates (all local time, keys are 'YYYY-MM-DD') ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  F.pad = pad;
  F.dkey = (d) => { d = d || new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  F.today = () => F.dkey(new Date());
  F.parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  F.addDays = (k, n) => { const d = F.parseKey(k); d.setDate(d.getDate() + n); return F.dkey(d); };
  F.dow = (k) => F.parseKey(k).getDay();
  F.mondayOf = (k) => { const d = F.parseKey(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return F.dkey(d); };
  F.diffDays = (a, b) => Math.round((F.parseKey(b) - F.parseKey(a)) / 864e5); // b - a
  F.isWeekday = (k) => { const w = F.dow(k); return w >= 1 && w <= 5; };
  F.weekKeys = (monday) => Array.from({ length: 7 }, (_, i) => F.addDays(monday, i));
  F.monthKeys = (y, m) => { // m: 0-based
    const n = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => F.dkey(new Date(y, m, i + 1)));
  };
  F.timeToMin = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  F.minToTime = (m) => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  F.nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

  /* ---------- Formatting ---------- */
  F.num = (n, dec = 0) => {
    if (n == null || isNaN(n)) return '–';
    return Number(n).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  F.num1 = (n) => (n == null || isNaN(n) ? '–' : (Math.round(n * 10) / 10).toLocaleString('ko-KR', { maximumFractionDigits: 1 }));
  F.signed = (n, dec = 1) => {
    if (n == null || isNaN(n)) return '–';
    const v = Math.round(n * 10 ** dec) / 10 ** dec;
    return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v).toFixed(dec);
  };
  F.dateLabel = (k, withDow = true) => {
    const d = F.parseKey(k);
    return `${d.getMonth() + 1}.${pad(d.getDate())}${withDow ? ' (' + F.DAY_NAMES[d.getDay()] + ')' : ''}`;
  };
  F.dateLong = (k) => { const d = F.parseKey(k); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`; };
  /** Korean particle after a word: F.josa('강 코치', '이/가') → '강 코치가' */
  F.josa = (word, pair) => {
    const [withB, noB] = pair.split('/');
    const ch = String(word || '').trim().slice(-1);
    const code = ch.charCodeAt(0) - 0xac00;
    const batchim = code >= 0 && code <= 11171 && code % 28 !== 0;
    if (pair === '으로/로' && batchim && code % 28 === 8) return word + noB; // ㄹ받침 + 로
    return word + (batchim ? withB : noB);
  };
  F.round = (n, step) => Math.round(n / step) * step;
  F.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  F.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ---------- State (local cache per profile; cloud sync lives in sync.js) ---------- */
  const V1KEY = 'mypt.state.v1';
  const PKEY = 'mypt.profiles';
  F.defaultState = () => ({
    v: 2,
    profile: null,          // set by onboarding
    settings: {
      trainer: 'm',
      trainerNames: { m: '강 코치', f: '윤 코치' },
      freq: 3, days: [1, 3, 5], gymTime: '19:30',
      alarmOn: true, alarmLead: 30,
      cardio: 'treadmill', pace: 'normal', kcalAdj: 0,
      theme: 'system', sound: true, figure: null,
    },
    ex: {}, cardio: {}, sessions: {}, overrides: {}, inbody: [], weights: [],
    meals: {}, supp: {}, xp: [], xpTotal: 0, xpKeys: {}, badges: {}, active: null,
    alarmFired: {}, updatedAt: 0,
  });
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  F.normalize = (s) => {
    const d = F.defaultState();
    if (!s || typeof s !== 'object') return d;
    for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
    s.settings = Object.assign({}, d.settings, s.settings || {});
    s.settings.trainerNames = Object.assign({}, d.settings.trainerNames, s.settings.trainerNames || {});
    if (!s.xpTotal && Array.isArray(s.xp) && s.xp.length) s.xpTotal = s.xp.reduce((a, x) => a + (x.xp || 0), 0);
    s.v = 2;
    return s;
  };
  /* local profiles: lets two people share one device when the app runs outside claude.ai */
  F.profiles = () => { try { return JSON.parse(safeGet(PKEY) || 'null') || { list: [], cur: null }; } catch (e) { return { list: [], cur: null }; } };
  F.saveProfiles = (p) => safeSet(PKEY, JSON.stringify(p));
  F.localKey = (id) => `mypt.state.v2.${id}`;
  F.loadLocal = () => {
    let P = F.profiles();
    if (!P.list.length) {
      const id = 'p1';
      P = { list: [{ id, name: '' }], cur: id };
      const v1 = safeGet(V1KEY);
      if (v1) safeSet(F.localKey(id), v1);            // migrate v1 data into the first profile
      F.saveProfiles(P);
    }
    if (!P.cur || !P.list.some((x) => x.id === P.cur)) { P.cur = P.list[0].id; F.saveProfiles(P); }
    let s = null;
    try { s = JSON.parse(safeGet(F.localKey(P.cur)) || 'null'); } catch (e) { s = null; }
    F.profileId = P.cur;
    return F.normalize(s);
  };
  F.load = F.loadLocal;
  F.S = F.loadLocal();
  let saveTimer = null;
  F.writeLocal = () => {
    const key = F.Sync && F.Sync.mode === 'cloud' ? `mypt.cache.${F.Sync.uid}` : F.localKey(F.profileId);
    if (!safeSet(key, JSON.stringify(F.S))) F.toast('기기 저장 공간이 부족해요. 설정 > 백업을 이용해 주세요.');
  };
  /** Persist: always to the local cache, and to the cloud when synced (debounced). */
  F.save = (now) => {
    F.S.updatedAt = Date.now();
    clearTimeout(saveTimer);
    const run = () => { F.writeLocal(); if (F.Sync && F.Sync.push) F.Sync.push(); };
    if (now) run(); else saveTimer = setTimeout(run, 400);
  };
  window.addEventListener('pagehide', () => { F.writeLocal(); if (F.Sync && F.Sync.push) F.Sync.push(true); });
  F.switchProfile = (id) => { const P = F.profiles(); P.cur = id; F.saveProfiles(P); F.S = F.loadLocal(); };
  F.addProfile = (name) => { const P = F.profiles(); const id = 'p' + Date.now().toString(36); P.list.push({ id, name: name || '' }); P.cur = id; F.saveProfiles(P); F.S = F.loadLocal(); return id; };
  F.resetAll = () => { try { localStorage.removeItem(F.localKey(F.profileId)); } catch (e) { /* ignore */ } F.S = F.defaultState(); };
  F.storageKey = V1KEY;

  /* ---------- IndexedDB for original InBody photos ---------- */
  const DB_NAME = 'mypt-files', STORE = 'files';
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    if (!('indexedDB' in window)) { rej(new Error('no idb')); return; }
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, mode); const st = t.objectStore(STORE);
      const out = fn(st);
      t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
      t.onerror = () => rej(t.error);
    });
  };
  F.idb = {
    put: (id, blob) => tx('readwrite', (st) => st.put(blob, id)),
    get: (id) => tx('readonly', (st) => st.get(id)),
    del: (id) => tx('readwrite', (st) => st.delete(id)),
    keys: () => tx('readonly', (st) => st.getAllKeys()),
  };
  const urlCache = {};
  F.fileURL = async (id) => {
    if (!id) return null;
    if (urlCache[id]) return urlCache[id];
    try { const b = await F.idb.get(id); if (!b) return null; return (urlCache[id] = URL.createObjectURL(b)); }
    catch (e) { return null; }
  };

  /* ---------- Toast ---------- */
  F.toast = (msg, ms = 2600) => {
    let el = F.$('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), ms);
  };

  /* ---------- Sheet / dialog ---------- */
  F.sheet = (html, opts = {}) => {
    F.closeSheet(true);
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap' + (opts.wide ? ' wide' : '');
    wrap.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>
      <section class="sheet" role="dialog" aria-modal="true">
        <button class="sheet-x icon-btn" data-act="sheet-close" aria-label="닫기">${F.icon('x')}</button>
        <div class="sheet-body">${html}</div>
      </section>`;
    document.body.appendChild(wrap);
    document.body.classList.add('noscroll');
    requestAnimationFrame(() => wrap.classList.add('on'));
    if (opts.onOpen) opts.onOpen(wrap);
    return wrap;
  };
  /** In-page confirm. Resolves true/false. */
  F.ask = (o = {}) => new Promise((res) => {
    let done = false;
    const fin = (v) => { if (done) return; done = true; res(v); };
    const w = F.sheet(`<div class="ask">
        <div class="t-label">${F.esc(o.label || 'CHECK')}</div>
        <h2 class="t-h2" style="margin:6px 0 8px">${F.esc(o.title || '계속할까요?')}</h2>
        ${o.body ? `<p class="t-small mute2">${F.esc(o.body)}</p>` : ''}
        ${o.input ? `<input class="input" id="ask-in" maxlength="${o.max || 20}" placeholder="${F.esc(o.placeholder || '')}" value="${F.esc(o.value || '')}" style="margin-top:12px">` : ''}
        <div class="row" style="gap:8px;margin-top:18px">
          <button class="btn grow" data-ask="0">${F.esc(o.cancel || '취소')}</button>
          <button class="btn grow ${o.danger ? 'hot' : 'primary'}" data-ask="1">${F.esc(o.ok || '확인')}</button>
        </div></div>`);
    const inp = w.querySelector('#ask-in');
    if (inp) setTimeout(() => inp.focus(), 60);
    w.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ask]');
      if (b) { e.stopPropagation(); const ok = b.dataset.ask === '1'; fin(ok ? (inp ? inp.value.trim() : true) : (inp ? null : false)); F.closeSheet(); return; }
    }, true);
    w._onClose = () => fin(inp ? null : false); // backdrop, close button or Esc
    if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { fin(inp.value.trim()); F.closeSheet(); } });
  });
  /** In-page text prompt. Resolves the trimmed text, or null when cancelled. */
  F.askText = (o = {}) => F.ask(Object.assign({}, o, { input: true }));
  F.closeSheet = (instant) => {
    F.$$('.sheet-wrap').forEach((w) => {
      if (w._onClose) { const f = w._onClose; w._onClose = null; f(); }
      if (instant) w.remove();
      else { w.classList.remove('on'); setTimeout(() => w.remove(), 180); }
    });
    if (!F.$('#session.on')) document.body.classList.remove('noscroll');
  };

  /* ---------- Icons (24px grid, square caps, miter joins) ---------- */
  const IC = {
    home: '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/>',
    plan: '<path d="M3 5h18v16H3zM3 10h18M8 2v5M16 2v5"/>',
    dumbbell: '<path d="M2 9v6M5 6v12M19 6v12M22 9v6M5 12h14"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM12 11V4M8 11 6 6M16 11l2-5"/>',
    body: '<path d="M4 20 12 4l8 16zM8 14h8"/>',
    scale: '<path d="M4 4h16v16H4zM8 9a4 4 0 0 1 8 0M12 9l2-2"/>',
    stamp: '<path d="M4 4h16v16H4zM8 12l3 3 5-6"/>',
    gear: '<path d="M3 6h10M19 6h2M3 12h4M13 12h8M3 18h12M21 18h0"/><path d="M13 3.5h6v5h-6zM7 9.5h6v5H7zM15 15.5h6v5h-6z"/>',
    x: '<path d="M5 5l14 14M19 5 5 19"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    arrowR: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowL: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    chevD: '<path d="M5 9l7 7 7-7"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    minus: '<path d="M4 12h16"/>',
    clock: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 3"/>',
    bell: '<path d="M6 17V10a6 6 0 0 1 12 0v7l2 2H4zM10 21h4"/>',
    camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
    upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
    download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
    chart: '<path d="M3 21h18M5 17l5-6 4 3 6-8"/>',
    flame: '<path d="M12 22c-4 0-7-3-7-7 0-5 5-6 5-12 3 2 9 7 9 12 0 4-3 7-7 7zM12 22c-2 0-3-1.5-3-3.5S12 14 12 14s3 2.5 3 4.5-1 3.5-3 3.5z"/>',
    swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
    info: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7v1"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    heart: '<path d="M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6z"/>',
    drop: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
    pill: '<path d="M4 14 14 4a4.2 4.2 0 0 1 6 6L10 20a4.2 4.2 0 0 1-6-6zM9 9l6 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4"/>',
    target: '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h.01"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8"/>',
    timer: '<path d="M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 10v4M9 2h6"/>',
    skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
    sun: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3"/>',
    moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z"/>',
    walk: '<path d="M13 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 22l3-8 3 3v5M12 14l-1-5-4 3M11 9l4 1 3 3"/>',
    water: '<path d="M6 3h12l-2 18H8zM6.5 8h11"/>',
    lock: '<path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"/>',
    flag: '<path d="M5 22V3h12l-2 4 2 4H5"/>',
  };
  F.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[name] || IC.info}</svg>`;

  /* ---------- Assets ---------- */
  F.figure = () => (F.S && F.S.settings && F.S.settings.figure) || (F.S && F.S.profile && F.S.profile.sex) || 'm';
  F.exHref = (id) => '#ex-' + String(id || '').replace(/_/g, '-');
  F.img = {
    ex: (id, g) => `assets/img/ex/${id}_${g || F.figure()}.webp`,
    food: (id) => `assets/img/food/${id}.webp`,
    trainer: (g, pose) => `assets/img/trainers/${g}-${pose || 'hero'}.webp`,
  };

  /* ---------- Misc ---------- */
  F.vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } };
  let actx = null;
  F.beep = (pattern = [[880, 0.12], [0, 0.08], [880, 0.12], [0, 0.08], [1320, 0.28]]) => {
    if (F.S && F.S.settings && F.S.settings.sound === false) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      let t = actx.currentTime + 0.02;
      for (const [f, d] of pattern) {
        if (f) {
          const o = actx.createOscillator(), g = actx.createGain();
          o.type = 'square'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t + d);
          o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
        }
        t += d;
      }
    } catch (e) { /* audio unavailable */ }
  };
  // Unlock audio on first interaction (mobile autoplay policies)
  window.addEventListener('pointerdown', function unlock() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) { /* ignore */ }
    window.removeEventListener('pointerdown', unlock);
  });

  F.download = (name, data, type) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  F.blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
  F.dataURLToBlob = async (u) => (await fetch(u)).blob();
})(window.F);
