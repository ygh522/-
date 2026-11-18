// In-page stand-in for the claude.ai runtime (db / user / assets / sample / downloads), for tests only.
// Data persists in localStorage under "mock.*" so reloads behave like a returning viewer.
window.__mockInit = () => {
  const LS = window.localStorage;
  const uid = () => LS.getItem('mock.uid') || 'u1';
  const store = () => JSON.parse(LS.getItem('mock.db') || '{}');
  const save = (s) => LS.setItem('mock.db', JSON.stringify(s));
  const failGets = () => Number(LS.getItem('mock.failGets') || 0);
  const listeners = [];
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  const log = (m) => { (window.__mockLog = window.__mockLog || []).push(m); };
  const snap = (path) => { const d = store()[path]; return { id: path.split('/').pop(), exists: !!d, data: () => clone(d), metadata: { fromCache: false, hasPendingWrites: false } }; };
  const qsnap = (coll, prev) => {
    const s = store();
    const docs = Object.keys(s).filter((k) => k.startsWith(coll + '/') && !k.slice(coll.length + 1).includes('/')).sort().map((k) => snap(k));
    const changes = [];
    const seen = new Set();
    for (const d of docs) { seen.add(d.id); const j = JSON.stringify(d.data()); if (!prev || prev[d.id] === undefined) changes.push({ type: 'added', doc: d }); else if (prev[d.id] !== j) changes.push({ type: 'modified', doc: d }); }
    if (prev) for (const id of Object.keys(prev)) if (!seen.has(id)) changes.push({ type: 'removed', doc: { id, exists: false, data: () => undefined, metadata: {} } });
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => changes, metadata: { fromCache: false, hasPendingWrites: false }, _state: Object.fromEntries(docs.map((d) => [d.id, JSON.stringify(d.data())])) };
  };
  const notify = (path) => setTimeout(() => { for (const l of listeners) l(path); }, 30);
  const docRef = (path) => ({
    id: path.split('/').pop(), path,
    get: () => new Promise((res, rej) => setTimeout(() => {
      const n = failGets();
      if (n > 0) { LS.setItem('mock.failGets', String(n - 1)); log('get-fail ' + path); return rej({ code: 'unavailable', message: 'offline (mock)' }); }
      res(snap(path));
    }, 120)),
    set: async (data) => { const s = store(); s[path] = clone(data); save(s); log('set ' + path); notify(path); },
    update: async (data) => { const s = store(); s[path] = Object.assign(s[path] || {}, clone(data)); save(s); notify(path); },
    delete: async () => { const s = store(); delete s[path]; save(s); log('delete ' + path); notify(path); },
    onSnapshot: (next) => { const fn = (p) => { if (p === path) next(snap(path)); }; listeners.push(fn); setTimeout(() => next(snap(path)), 50); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; },
    collection: (name) => collRef(path + '/' + name),
  });
  const collRef = (path) => {
    const q = {
      doc: (id) => docRef(path + '/' + id),
      limit: () => q, orderBy: () => q, where: () => q,
      get: async () => { if (failGets() > 0) { LS.setItem('mock.failGets', String(failGets() - 1)); throw { code: 'unavailable' }; } return qsnap(path); },
      onSnapshot: (next) => {
        let prev = null;
        const emit = () => { const qs = qsnap(path, prev); prev = qs._state; next(qs); };
        const fn = (p) => { if (p.startsWith(path + '/')) emit(); };
        listeners.push(fn); setTimeout(emit, 50);
        return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
      },
    };
    return q;
  };
  const self = (p) => p.replace('{self}', uid());
  const db = { doc: (p) => docRef(self(p)), collection: (p) => collRef(self(p)) };
  const blobs = {};
  const caps = {
    db,
    user: { id: async () => uid(), me: async () => ({ name: uid() === 'u1' ? '테스터' : '여자친구' }) },
    assets: { upload: async (blob) => { const id = 'a' + Math.random().toString(36).slice(2, 10); blobs[id] = blob; return { id, url: URL.createObjectURL(blob) }; } },
    sample: (() => {
      const fn = async (input, opts = {}) => {
        window.__lastSampleInput = input;
        const txt = '좋은 질문이에요. 오늘은 무게를 10% 낮추고 2세트만 해요. 통증이 날카로우면 바로 멈추세요.';
        for (let i = 1; i <= 3; i++) { await new Promise((r) => setTimeout(r, 60)); if (opts.onText) opts.onText({ text: txt.slice(0, Math.ceil((txt.length * i) / 3)) }); }
        return { text: txt, truncated: false };
      };
      fn.limits = async () => ({ images: { maxCount: 4, mediaTypes: ['image/jpeg', 'image/png'] } });
      fn.json = async () => ({ date: '2026-11-01', weight: 89.4, smm: 33.1, bfm: 30.2, pbf: 33.8, bmi: 30.6, vfl: 12, bmr: 1720, score: 68 });
      return fn;
    })(),
    downloads: { save: async (o) => { log('download ' + o.filename); } },
  };
  window.claude = { use: (n) => new Promise((res) => setTimeout(() => res(caps[n] || null), 40)) };
};
window.__mockInit();
