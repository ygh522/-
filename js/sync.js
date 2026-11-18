/* Cloud sync for two people (claude.ai artifact runtime).
   - Inside claude.ai: each signed-in viewer gets a private state doc  data/users/<uid>/app
     (+ sub-collections sessions/<date>, inbody/<id>), live-synced between phone and PC.
     A small public summary  members/<uid>  lets the two of them see each other's attendance.
     InBody photos go to `assets`; the InBody sheet is read by Claude (`sample` with images).
   - Anywhere else: local storage only (core.js), with local profiles for a shared device. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const Y = (F.Sync = { mode: 'local', status: 'local', uid: null, me: null, members: [], caps: {}, ready: false });
  const SPLIT = ['sessions', 'inbody'];
  const LOCAL_ONLY = ['alarmFired', 'snoozeUntil'];
  const DEVICE = (() => { try { let d = localStorage.getItem('mypt.device'); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('mypt.device', d); } return d; } catch (e) { return 'dev'; } })();
  let db = null, appRef = null, exists = false;
  let sentState = '', sentKeys = {}, sentSes = {}, sentIb = {}, sentMember = '';
  let pushing = false, again = false, timer = null, onRemote = null, unsub = [];

  const use = (n) => (window.claude && typeof window.claude.use === 'function' ? window.claude.use(n).catch(() => null) : Promise.resolve(null));
  const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const setStatus = (s) => { Y.status = s; const d = document.querySelector('.sync-dot'); if (d) d.className = 'sync-dot ' + (s === 'ok' ? 'on' : s === 'error' ? 'err' : ''); };

  /* ---------- shape of the cloud state doc ---------- */
  const keepDays = (map, days) => {
    const cut = F.addDays(F.today(), -days);
    for (const k of Object.keys(map || {})) if (k < cut) delete map[k];
  };
  Y.compact = (S) => {
    for (const st of Object.values(S.ex || {})) if (st && st.hist && st.hist.length > 30) st.hist = st.hist.slice(-30);
    for (const st of Object.values(S.cardio || {})) if (st && st.hist && st.hist.length > 30) st.hist = st.hist.slice(-30);
    keepDays(S.meals, 120); keepDays(S.supp, 120);
    if (Array.isArray(S.xp) && S.xp.length > 80) S.xp = S.xp.slice(-80);
    const cut = F.addDays(F.today(), -200);
    for (const k of Object.keys(S.xpKeys || {})) { const m = k.match(/\d{4}-\d{2}-\d{2}/); if (m && m[0] < cut) delete S.xpKeys[k]; }
    for (const k of Object.keys(S.overrides || {})) if (k < F.addDays(F.today(), -60)) delete S.overrides[k];
  };
  const cloudBody = () => {
    const o = {};
    for (const [k, v] of Object.entries(F.S)) if (!SPLIT.includes(k) && !LOCAL_ONLY.includes(k)) o[k] = v === undefined ? null : v;
    o.device = DEVICE;
    return o;
  };
  const memberSummary = () => {
    const S = F.S, p = S.profile || {};
    const lv = F.E.level();
    const m = F.mondayOf(F.today());
    const week = F.weekKeys(m).filter((k) => S.sessions[k] && (S.sessions[k].status === 'done' || S.sessions[k].status === 'partial'));
    return { name: (p.name || (Y.me && Y.me.name) || ''), sex: p.sex || null, coach: S.settings.trainer, lv: lv.lv, title: lv.title, xp: lv.xp,
      monday: m, week, freq: S.settings.freq, days: S.settings.days, streak: F.E.streakWeeks(), sessions: F.E.doneSessions().length,
      last: (F.E.doneSessions().slice(-1)[0] || {}).date || null, updatedAt: Date.now() };
  };

  /* ---------- init ---------- */
  Y.init = async (cb) => {
    onRemote = cb;
    if (!window.claude || typeof window.claude.use !== 'function') { Y.ready = true; return false; }
    const [d, user, assets, sample, downloads] = await Promise.all(['db', 'user', 'assets', 'sample', 'downloads'].map(use));
    Y.caps = { db: !!d, user: !!user, assets: !!assets, sample: !!sample, downloads: !!downloads };
    Y.assets = assets; Y.sample = sample; Y.downloads = downloads; Y.user = user;
    const uid = user ? await user.id().catch(() => null) : null;
    if (!d || !uid) { Y.ready = true; return false; }
    db = d; Y.uid = uid;
    try { Y.me = await user.me(); } catch (e) { Y.me = null; }
    appRef = db.doc(`data/users/${uid}/app`);
    setStatus('syncing');
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(`mypt.cache.${uid}`) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.profile) {
      // paint this person's last copy at once; the cloud copy is compared when it arrives
      F.S = F.normalize(cached); Y.mode = 'cloud';
      if (Y.onEarly) try { Y.onEarly(); } catch (e) { /* ignore */ }
    }

    // read the cloud copy; until it has been read once, saves stay in the local cache (Y.ready = false)
    const load = async () => {
      const snap = await timeout(appRef.get(), 15000);
      const local = F.S && F.S.profile ? F.S : null; // what this device has right now (cache or local profile)
      Y.mode = 'cloud';
      let needPush = false;
      if (snap.exists) {
        exists = true;
        const c = F.normalize(snap.data() || {});
        c.sessions = {}; c.inbody = [];
        sentSes = {}; sentIb = {};
        const ses = await timeout(appRef.collection('sessions').limit(1000).get(), 15000);
        for (const doc of ses.docs) { const r = doc.data(); if (r) { c.sessions[doc.id] = r; sentSes[doc.id] = JSON.stringify(r); } }
        const ib = await timeout(appRef.collection('inbody').limit(500).get(), 15000);
        for (const doc of ib.docs) { const r = doc.data(); if (r) { c.inbody.push(r); sentIb[doc.id] = JSON.stringify(r); } }
        for (const k of LOCAL_ONLY) c[k] = local && local[k] ? local[k] : {};
        F.S = c;
        sentState = JSON.stringify(cloudBody());
        if (local && local.profile && (local.updatedAt || 0) > (c.updatedAt || 0)) {
          // this device saved changes the cloud never got (weak signal at the gym): keep them,
          // add anything only the cloud has, then upload
          for (const [k, r] of Object.entries(c.sessions)) if (!local.sessions[k]) local.sessions[k] = r;
          const have = new Set((local.inbody || []).map((x) => x.id));
          for (const r of c.inbody) if (!have.has(r.id)) local.inbody.push(r);
          F.S = F.normalize(local);
          needPush = true;
        }
      } else {
        // first visit in the cloud: bring along anything used on this device before
        exists = false;
        F.S = local || F.defaultState();
        needPush = !!F.S.profile;
      }
      F.writeLocal();
      setStatus('ok');
      Y.ready = true;
      startListeners();
      if (needPush) Y.push(true);
    };

    try { await load(); return true; }
    catch (e) {
      // offline or slow: keep working from this device and retry quietly
      setStatus('error');
      const retry = () => load().then(() => { if (onRemote) onRemote('state'); }).catch(() => setTimeout(retry, 15000));
      setTimeout(retry, 8000);
      return Y.mode === 'cloud';
    }
  };

  /* ---------- live updates from the other device ---------- */
  const startListeners = () => {
    if (!appRef) return;
    unsub.forEach((u) => { try { u(); } catch (e) { /* ignore */ } });
    unsub = [];
    unsub.push(appRef.onSnapshot((snap) => {
      if (!snap.exists || snap.metadata.hasPendingWrites) return;
      const data = snap.data() || {};
      if (data.device === DEVICE) return;
      if ((data.updatedAt || 0) <= (F.S.updatedAt || 0)) return;
      const mine = JSON.parse(sentState || '{}');
      for (const [k, v] of Object.entries(data)) {
        if (k === 'device' || SPLIT.includes(k) || LOCAL_ONLY.includes(k)) continue;
        const localChanged = JSON.stringify(F.S[k] === undefined ? null : F.S[k]) !== JSON.stringify(mine[k] === undefined ? null : mine[k]);
        if (!localChanged) F.S[k] = v;
      }
      F.S = F.normalize(F.S);
      sentState = JSON.stringify(data);   // cloud copy as it stands; unsynced local keys still differ and get pushed
      F.writeLocal();
      if (onRemote) onRemote('state');
    }, () => setStatus('error')));
    unsub.push(appRef.collection('sessions').limit(1000).onSnapshot((qs) => {
      let changed = false;
      for (const ch of qs.docChanges()) {
        const id = ch.doc.id;
        if (ch.type === 'removed') { if (F.S.sessions[id]) { delete F.S.sessions[id]; delete sentSes[id]; changed = true; } continue; }
        const r = ch.doc.data(); const j = JSON.stringify(r);
        if (sentSes[id] !== j) { F.S.sessions[id] = r; sentSes[id] = j; changed = true; }
      }
      if (changed) { F.writeLocal(); if (onRemote) onRemote('sessions'); }
    }, () => {}));
    unsub.push(appRef.collection('inbody').limit(500).onSnapshot((qs) => {
      let changed = false;
      for (const ch of qs.docChanges()) {
        const id = ch.doc.id;
        if (ch.type === 'removed') { const n = F.S.inbody.length; F.S.inbody = F.S.inbody.filter((x) => x.id !== id); if (F.S.inbody.length !== n) changed = true; delete sentIb[id]; continue; }
        const r = ch.doc.data(); const j = JSON.stringify(r);
        if (sentIb[id] !== j) { F.S.inbody = F.S.inbody.filter((x) => x.id !== id).concat([r]); sentIb[id] = j; changed = true; }
      }
      if (changed) { F.writeLocal(); if (onRemote) onRemote('inbody'); }
    }, () => {}));
    unsub.push(db.collection('members').limit(20).onSnapshot((qs) => {
      Y.members = qs.docs.map((d) => Object.assign({ uid: d.id }, d.data() || {}));
      if (onRemote) onRemote('members');
    }, () => {}));
  };

  /* ---------- push local changes (one write at a time per doc) ---------- */
  Y.push = (now) => {
    if (Y.mode !== 'cloud' || !appRef || !Y.ready) return; // before the first cloud read, saves stay in the local cache
    clearTimeout(timer);
    timer = setTimeout(doPush, now ? 0 : 700);
  };
  const doPush = async () => {
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      if (!F.S.profile) return;
      Y.compact(F.S);
      const body = cloudBody();
      const j = JSON.stringify(body);
      if (j !== sentState) {
        if (j.length > 240000) { F.toast('기록이 너무 커서 오래된 항목을 정리했어요'); }
        await appRef.set(body);
        exists = true; sentState = j;
      }
      for (const [date, rec] of Object.entries(F.S.sessions || {})) {
        const sj = JSON.stringify(rec);
        if (sentSes[date] !== sj) { await appRef.collection('sessions').doc(date).set(rec); sentSes[date] = sj; }
      }
      for (const date of Object.keys(sentSes)) if (!F.S.sessions[date]) { await appRef.collection('sessions').doc(date).delete(); delete sentSes[date]; }
      const ibIds = new Set();
      for (const rec of F.S.inbody || []) {
        ibIds.add(rec.id);
        const ij = JSON.stringify(rec);
        if (sentIb[rec.id] !== ij) { await appRef.collection('inbody').doc(rec.id).set(rec); sentIb[rec.id] = ij; }
      }
      for (const id of Object.keys(sentIb)) if (!ibIds.has(id)) { await appRef.collection('inbody').doc(id).delete(); delete sentIb[id]; }
      const ms = memberSummary(); const mj = JSON.stringify(Object.assign({}, ms, { updatedAt: 0 }));
      if (mj !== sentMember) { await db.doc(`members/${Y.uid}`).set(ms); sentMember = mj; }
      setStatus('ok');
    } catch (e) {
      console.warn('sync', e);
      setStatus('error');
      if (e && e.code === 'quota_exceeded') F.toast('클라우드 저장 공간이 가득 찼어요. 오래된 기록을 정리해 주세요.');
      else setTimeout(() => Y.push(), 8000);
    } finally {
      pushing = false;
      if (again) { again = false; doPush(); }
    }
  };

  Y.resetCloud = async () => {
    if (Y.mode !== 'cloud' || !appRef) return;
    try {
      for (const id of Object.keys(sentSes)) await appRef.collection('sessions').doc(id).delete();
      for (const id of Object.keys(sentIb)) await appRef.collection('inbody').doc(id).delete();
      const blank = F.defaultState(); delete blank.sessions; delete blank.inbody;
      await appRef.set(Object.assign(blank, { device: DEVICE, updatedAt: Date.now() }));
      await db.doc(`members/${Y.uid}`).delete();
      sentSes = {}; sentIb = {}; sentState = ''; sentMember = '';
    } catch (e) { console.warn(e); }
  };

  /* ---------- files: InBody originals ---------- */
  Y.putFile = async (file, localId) => {
    if (Y.mode === 'cloud' && Y.assets) {
      const r = await Y.assets.upload(file);
      return { a: r.id };
    }
    await F.idb.put(localId, file);
    return localId;
  };
  Y.fileURL = async (ref) => {
    if (!ref) return null;
    if (typeof ref === 'object' && ref.a) return '/_blob/' + ref.a;
    return F.fileURL(ref);
  };
  Y.deleteFile = async (ref) => {
    if (!ref) return;
    try {
      if (typeof ref === 'object' && ref.a && Y.assets) await Y.assets.delete(ref.a);
      else await F.idb.del(ref);
    } catch (e) { /* ignore */ }
  };

  /* ---------- downloads (.ics, backup) ---------- */
  Y.download = async (filename, text, type) => {
    if (Y.downloads) {
      try { await Y.downloads.save({ filename, data: new Blob([text], { type: type || 'application/octet-stream' }) }); return; }
      catch (e) { if (e && e.code === 'declined') return; }
    }
    F.download(filename, text, type);
  };

  /* ---------- Claude reads the InBody sheet ---------- */
  Y.canReadImages = async () => {
    if (!Y.sample) return false;
    try { const lim = await Y.sample.limits(); return !!(lim && lim.images); } catch (e) { return false; }
  };
  const shrink = (file, max = 1800) => new Promise((res) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => res(b || file), 'image/jpeg', 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(file); };
    img.src = url;
  });
  Y.readInbody = async (file) => {
    const blob = await shrink(file);
    const prompt = 'This image is a photo of a body-composition (InBody-style) result sheet, usually in Korean. Read the MEASURED values (not the normal ranges or bar-chart scale numbers) and answer with JSON only, no prose: '
      + '{"date":"YYYY-MM-DD or null","weight":number|null,"smm":number|null,"bfm":number|null,"pbf":number|null,"bmi":number|null,"vfl":number|null,"bmr":number|null,"score":number|null,"whr":number|null,"tbw":number|null,"ffm":number|null}. '
      + 'weight=체중 kg, smm=골격근량 kg, bfm=체지방량 kg, pbf=체지방률 %, bmi=BMI, vfl=내장지방레벨, bmr=기초대사량 kcal, score=인바디점수, whr=복부지방률, tbw=체수분 L, ffm=제지방량 kg. Use null for anything you cannot read with confidence.';
    const out = await Y.sample.json(prompt, { images: [blob], modelTier: 'default' });
    const v = {};
    for (const k of ['weight', 'smm', 'bfm', 'pbf', 'bmi', 'vfl', 'bmr', 'score', 'whr', 'tbw', 'ffm']) {
      const n = out && out[k] != null ? parseFloat(out[k]) : NaN;
      if (isFinite(n)) v[k] = n;
    }
    const date = out && typeof out.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(out.date) ? out.date : null;
    return { values: v, date };
  };
})(window.F);
