/* Guided session (focus mode): warm-up → sets with rest timer → rating → cardio → cool-down → done.
   Every step advances only when the user taps, like a PT standing next to you. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, A = F.act, esc = F.esc;
  const SS = (UI.sess = {});
  let tick = null, wake = null;

  const act = () => F.S.active;
  /** A trainer line for this moment ({name} = coach, {me} = the member). */
  const line = (key, i = 0) => {
    const L = (F.COACH_LINES || {})[key];
    if (!L || !L.length) return '';
    return L[Math.abs(i) % L.length].replace(/\{name\}/g, F.coachName()).replace(/\{me\}/g, UI.myName() || '회원');
  };
  SS.line = line;
  const coachRow = (text, pose) => text ? `<div class="s-coach"><img src="${F.coachImg(pose || 'face')}" alt=""><div><b>${esc(F.coachName())}</b><span>${esc(text)}</span></div></div>` : '';
  const cardioOpts = (step) => (step ? { machine: step.machine, min: step.min, dl: step.dl || 0 } : {});
  const cardioStep = (a) => a.steps.find((x) => x.type === 'cardio');
  const light = (a) => a.cond === 'tired' || a.cond === 'bad';
  const el = () => F.$('#session');
  const fmtClock = (sec) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? `${h}:${F.pad(m)}:${F.pad(s)}` : `${F.pad(m)}:${F.pad(s)}`;
  };

  /* ---------- open / close ---------- */
  SS.open = () => {
    const root = el();
    root.classList.add('on');
    document.body.classList.add('noscroll');
    SS.render();
    clearInterval(tick);
    tick = setInterval(SS.tick, 500);
    try { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch (e) { /* ignore */ }
  };
  SS.hide = () => {
    el().classList.remove('on');
    el().innerHTML = '';
    document.body.classList.remove('noscroll');
    clearInterval(tick); tick = null;
    try { wake && wake.release(); } catch (e) { /* ignore */ } wake = null;
    F.render();
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && el() && el().classList.contains('on') && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {});
  });

  A['start-session'] = (b) => {
    const k = b.dataset.date || F.today();
    F.closeSheet(true);
    const s = F.S;
    if (s.active && s.active.date === k) { SS.open(); return; }
    const tid = F.E.templateFor(k);
    s.active = F.E.buildSession(k, tid);
    s.active.planned = !!F.E.planFor(k);
    s.active.moved = !!(F.E.planFor(k) || {}).moved;
    F.save(true);
    SS.open();
  };
  A['start-free'] = () => {
    const k = F.today();
    const s = F.S;
    const tid = F.E.templateFor(k);
    s.active = F.E.buildSession(k, tid);
    s.active.planned = false; s.active.free = true;
    F.save(true);
    SS.open();
  };
  A['resume-session'] = () => { F.closeSheet(true); SS.open(); };
  A['discard-session'] = () => {
    const a = act();
    F.closeSheet(true);
    if (!a) return;
    F.S.active = F.E.buildSession(a.date, a.templateId);
    Object.assign(F.S.active, { planned: a.planned, moved: a.moved, free: a.free });
    F.save(true);
    SS.open();
  };

  /* ---------- timers ---------- */
  const timerOf = (a) => a.timer || (a.timer = { key: a.i, running: false, acc: 0, since: null });
  const elapsedOf = (t) => t.acc + (t.running && t.since ? Date.now() - t.since : 0);
  SS.tick = () => {
    const a = act(); if (!a) return;
    const clock = F.$('#s-clock');
    if (clock) clock.textContent = fmtClock((Date.now() - a.startedAt) / 1000);
    // rest
    if (a.rest) {
      const left = (a.rest.until - Date.now()) / 1000;
      const t = F.$('#rest-t');
      const ring = F.$('#rest-ring');
      if (t) t.textContent = fmtClock(Math.ceil(Math.max(0, left)));
      if (ring) {
        const C = 2 * Math.PI * 45;
        const pct = F.clamp(left / a.rest.dur, 0, 1);
        const fg = ring.querySelector('.fgc');
        if (fg) fg.style.strokeDashoffset = String(C * (1 - pct));
        if (left <= 0 && !ring.classList.contains('done')) {
          ring.classList.add('done');
          const lab = F.$('#rest-lab'); if (lab) lab.textContent = '휴식 끝! 다음 세트';
          const nb = F.$('#rest-next'); if (nb) nb.classList.add('primary');
        }
      }
      if (left <= 0 && !a.rest.beeped) { a.rest.beeped = true; F.beep([[988, 0.15], [0, 0.07], [988, 0.15], [0, 0.07], [1319, 0.35]]); F.vibrate([250, 100, 250]); F.save(); }
      return;
    }
    // step timers (warmup, cardio, cooldown)
    const step = a.steps[a.i];
    if (step && a.timer && a.timer.key === a.i && (step.type === 'cardio' || step.type === 'warmup' || step.type === 'cooldown')) {
      const total = step.type === 'cardio' ? step.min * 60 : step.dur;
      const el2 = elapsedOf(a.timer) / 1000;
      const left = total - el2;
      const t = F.$('#step-t');
      if (t) t.textContent = fmtClock(Math.ceil(Math.max(0, left)));
      const bar = F.$('#step-bar');
      if (bar) bar.style.width = `${F.clamp((el2 / total) * 100, 0, 100)}%`;
      if (step.type === 'cardio') {
        let accm = 0;
        const segs = F.$$('.seg-row');
        const cp = F.E.cardioPlan(a.date, a.templateId, cardioOpts(step));
        cp.segments.forEach((sg, i) => {
          const on = el2 / 60 >= accm && el2 / 60 < accm + sg.min;
          if (segs[i]) segs[i].classList.toggle('on', on && a.timer.running);
          accm += sg.min;
        });
        const kc = F.$('#cardio-kcal');
        if (kc) kc.textContent = F.num(cp.kcal * F.clamp(el2 / total, 0, 1));
      }
      if (left <= 0 && !a.timer.beeped) { a.timer.beeped = true; F.beep(); F.vibrate([300, 120, 300]); F.save(); }
    }
  };

  /* ---------- render ---------- */
  SS.render = () => {
    const a = act(); if (!a) { SS.hide(); return; }
    const step = a.steps[a.i];
    const nSteps = a.steps.length - 1;
    const prog = a.steps.slice(0, nSteps).map((_, i) => `<i class="${i < a.i ? 'on' : i === a.i ? 'cur' : ''}"></i>`).join('');
    const top = `<div class="s-top"><button class="icon-btn" data-act="s-menu" aria-label="운동 메뉴">${F.icon('x')}</button><div class="s-prog">${prog}</div><div class="s-clock" id="s-clock">${fmtClock((Date.now() - a.startedAt) / 1000)}</div></div>`;
    let body = '', foot = '';
    const r = (step && R[step.type]) ? R[step.type](a, step) : R.done(a);
    body = r.body; foot = r.foot;
    el().innerHTML = `${top}<div class="s-body" id="s-body"><div class="s-inner">${body}</div></div>${foot ? `<div class="s-foot"><div class="s-inner">${foot}</div></div>` : ''}`;
    const sb = F.$('#s-body'); if (sb) sb.scrollTop = 0;
    SS.tick();
  };

  const exIndexInfo = (a, exId) => {
    const ids = [...new Set(a.steps.filter((s) => s.type === 'set').map((s) => s.exId))];
    return { idx: ids.indexOf(exId) + 1, n: ids.length };
  };

  const R = {};

  /* 0. today's condition → the session adapts like a trainer would */
  const DEF_COND = { great: { label: '최고예요', sub: '잠 잘 잤고 힘이 넘쳐요' }, normal: { label: '보통이에요', sub: '평소와 비슷해요' }, tired: { label: '피곤해요', sub: '잠이 부족하거나 몸이 무거워요' }, bad: { label: '많이 안 좋아요', sub: '기운이 없고 많이 지쳤어요' } };
  const DEF_SORE = { shoulder: { label: '어깨' }, back: { label: '허리' }, knee: { label: '무릎' }, wrist: { label: '손목' } };
  if (!F.COND) F.COND = DEF_COND;
  if (!F.SORE) F.SORE = DEF_SORE;
  R.check = (a) => {
    const o = (a.pre = a.pre || { cond: 'normal', sore: [], time: 'full' });
    const C = F.COND || DEF_COND;
    const plan = F.E.sessionPlan(a.date, a.templateId, o);
    const t = F.TEMPLATES[a.templateId] || {};
    const first = !F.E.doneSessions().length;
    const condBtns = ['great', 'normal', 'tired', 'bad'].map((k) => {
      const c = C[k] || { label: k, sub: '' };
      return `<button class="cond ${o.cond === k ? 'on' : ''}" data-act="s-cond" data-v="${k}"><b>${esc(c.label)}</b><span>${esc(c.sub || '')}</span></button>`;
    }).join('');
    const sore = ['shoulder', 'back', 'knee', 'wrist'].map((k) => `<button class="chip ${o.sore.includes(k) ? 'on' : ''}" data-act="s-sore" data-v="${k}">${esc(((F.SORE || {})[k] || {}).label || k)}</button>`).join('');
    const changes = [].concat(
      plan.notes,
      plan.swaps.map((x) => `${F.EXERCISES[x.from].name} → ${F.EXERCISES[x.to].name} (${((F.SORE || {})[x.area] || {}).label || ''} 보호)`),
      plan.removed.filter((x) => x.area).map((x) => `${F.EXERCISES[x.id].name} 빼기 (${((F.SORE || {})[x.area] || {}).label || ''} 보호)`)
    );
    const soreAdvice = o.sore.map((k) => ((F.SORE || {})[k] || {}).advice).filter(Boolean);
    const body = `<div class="s-pad">
        ${coachRow(first ? line('firstDay') : ((C[o.cond] || {}).line || line('form')).replace(/\{name\}/g, F.coachName()).replace(/\{me\}/g, UI.myName() || '회원'), 'coach')}
        <div class="t-label" style="margin-top:18px">CONDITION CHECK · ${esc(t.name || '')}</div>
        <h1 class="t-h1" style="margin:6px 0 12px">오늘 몸 상태는 어때요?</h1>
        <div class="cond-grid">${condBtns}</div>
        <div class="t-label" style="margin-top:18px">아픈 곳이 있나요? <span style="text-transform:none;letter-spacing:0">(선택)</span></div>
        <div class="chips s-chips" style="margin-top:8px">${sore}</div>
        ${soreAdvice.length ? `<p class="t-xs mute" style="margin-top:8px">${soreAdvice.map(esc).join('<br>')}</p>` : ''}
        <div class="t-label" style="margin-top:18px">오늘 쓸 수 있는 시간</div>
        <div class="seg s-seg" style="margin-top:8px">${Object.entries(F.TIME || { full: { label: '기본', sub: '' }, short: { label: '짧게', sub: '약 30분' } }).map(([k, v]) => `<button class="${o.time === k ? 'on' : ''}" data-act="s-time" data-v="${k}">${esc(v.label)} <small>${esc(v.sub || '')}</small></button>`).join('')}</div>
        ${o.time === 'short' && F.TIME_LINE ? `<p class="t-xs mute" style="margin-top:8px">${esc(F.TIME_LINE)}</p>` : ''}
        <div class="s-card" style="margin-top:18px">
          <div class="row between"><span class="t-label">TODAY'S PLAN</span><span class="t-num">${plan.items.length}종목 · 약 ${F.E.estimateMinutes(a.templateId, o)}분</span></div>
          <div class="s-plan">${plan.items.map((it, i) => { const ex = F.EXERCISES[it.exId]; return `<div><span class="t-num">${F.pad(i + 1)}</span><span class="grow">${esc(ex.name)}</span><span class="t-num">${F.E.isLoaded(ex) ? F.E.loadLabel(ex, it.w) + ' · ' : ''}${it.sets}세트</span></div>`; }).join('')}
            <div><span class="t-num">${F.icon('heart', 'sm')}</span><span class="grow">유산소</span><span class="t-num">${plan.cardio.min}분</span></div></div>
          ${changes.length ? `<ul class="s-changes">${changes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="t-xs mute" style="margin-top:8px">계획대로 진행해요.</p>'}
        </div>
      </div>`;
    const foot = `<button class="btn primary lg block" data-act="s-check-go">${F.icon('play')}이대로 시작</button>`;
    return { body, foot };
  };

  /* before the first set of every exercise: check the three numbered points in the photo */
  R.form = (a, step) => {
    const ex = F.EXERCISES[step.exId];
    const info = exIndexInfo(a, step.exId);
    const cues = ex.cues || [];
    const fc = ((a.fc = a.fc || {})[ex.id] = a.fc[ex.id] || cues.map(() => false));
    const all = fc.every(Boolean);
    const firstSet = a.steps.find((x) => x.type === 'set' && x.exId === ex.id) || {};
    const where = ex.mark === 'start' ? '위(START) 사진의 번호' : ex.mark === 'image' ? '사진 속 번호' : ex.mark === 'grid' ? '각 칸의 번호' : '아래(FINISH) 사진의 번호';
    const target = `${F.E.isLoaded(ex) ? F.E.loadLabel(ex, firstSet.w) + ' × ' : ''}${F.E.repsLabel(ex, firstSet.r)} × ${firstSet.of || 0}세트 · 휴식 ${firstSet.rest || 0}초`;
    const body = `<div class="s-exfig">${UI.exFig(ex, { eager: true, switch: true })}</div>
      <div class="s-pad">
        <div class="row between"><span class="t-label">FORM CHECK · EXERCISE ${info.idx}/${info.n}</span><button class="t-xs link" data-act="s-detail" data-id="${ex.id}" style="color:#ddd">자세 자세히</button></div>
        <h1 class="t-h1" style="margin:6px 0 10px">${esc(ex.name)}</h1>
        ${coachRow(line('form', info.idx - 1))}
        <div class="t-label" style="margin-top:16px">${esc(where)}을 보며 하나씩 눌러 확인해요</div>
        <div class="fc-list">${cues.map((c, i) => `<button class="fc ${fc[i] ? 'on' : ''}" data-act="s-fc" data-i="${i}"><b>${i + 1}</b><span>${esc(c)}</span>${F.icon('check', 'sm')}</button>`).join('')}</div>
        <div class="s-card" style="margin-top:14px"><span class="t-label">오늘 목표</span><div class="t-num-m" style="margin-top:4px;color:#fff">${esc(target)}</div>${ex.tempo ? `<div class="t-xs mute" style="margin-top:4px">템포 ${esc(ex.tempo)} (내리기-멈춤-올리기 초)</div>` : ''}</div>
        ${ex.setup && ex.setup.length ? `<details class="s-acc"><summary>기구 세팅 · 준비 ${F.icon('chevD', 'sm')}</summary><ol class="steps">${ex.setup.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>` : ''}
      </div>`;
    const foot = `<button class="btn ${all ? 'primary' : 'dim'} lg block" data-act="s-form-go">${all ? F.icon('check') + '준비 완료 · 1세트 시작' : `포인트 ${fc.filter(Boolean).length}/${cues.length} 확인`}</button>
      <button class="btn ghost block s-skip" data-act="s-form-go" data-skip="1">바로 시작하기</button>`;
    return { body, foot };
  };

  R.warmup = R.cooldown = (a, step) => {
    const ex = F.EXERCISES[step.exId] || { name: step.type === 'warmup' ? '워밍업' : '쿨다운', moves: [] };
    const t = timerOf(a); if (t.key !== a.i) Object.assign(t, { key: a.i, running: false, acc: 0, since: null, beeped: false });
    const isW = step.type === 'warmup';
    const body = `<div class="s-exfig">${UI.exFig(ex, { eager: true })}</div>
      <div class="s-pad">
        <div class="t-label">${isW ? 'WARM-UP' : 'COOL-DOWN'} · ${Math.round(step.dur / 60)} MIN</div>
        <h1 class="t-h1" style="margin:6px 0 4px">${esc(ex.name)}</h1>
        <p class="mute">${isW ? '먼저 트레드밀이나 사이클로 5분 가볍게 몸을 데운 뒤, 아래 4가지 동작을 순서대로 해요.' : '운동 직후 근육이 따뜻할 때 늘려줘야 회복이 빨라요. 반동 없이 천천히.'}</p>
        <div class="row" style="margin-top:16px;gap:14px;align-items:center">
          <div class="t-display" id="step-t">${fmtClock(step.dur - elapsedOf(t) / 1000)}</div>
          <button class="btn ${t.running ? '' : 'white'}" data-act="s-timer" style="min-width:110px">${t.running ? F.icon('pause') + '일시정지' : F.icon('play') + '타이머'}</button>
        </div>
        <div class="bar thin" style="margin-top:10px;background:#262626"><i id="step-bar" style="width:0"></i></div>
        <div class="list" style="margin-top:16px">${(ex.moves || []).map((m, i) => `<div style="align-items:flex-start"><span class="num-idx" style="color:#fff">${i + 1}</span><span class="grow"><b style="font-weight:800">${esc(m.name)}</b> <span class="t-num" style="color:#fff">${esc(m.dur)}</span><span class="t-small mute" style="display:block">${esc(m.desc)}</span></span></div>`).join('')}</div>
      </div>`;
    const foot = `<button class="btn primary lg block" data-act="s-next">${isW ? '워밍업 완료 · 운동 시작' : '쿨다운 완료'} ${F.icon('arrowR')}</button>`;
    return { body, foot };
  };

  R.set = (a, step) => {
    const ex = F.EXERCISES[step.exId];
    const info = exIndexInfo(a, step.exId);
    const loaded = F.E.isLoaded(ex);
    if (!a.cur || a.cur.i !== a.i) {
      const lg = (a.log[step.exId] || { sets: [] }).sets;
      const prevSet = lg[lg.length - 1];
      a.cur = { i: a.i, w: prevSet && prevSet.w != null ? prevSet.w : step.w, r: step.r };
    }
    if (a.rest) return R.rest(a, step, ex);
    const unitLbl = ex.unit === 'sec' ? '초' : '회';
    const loadBig = loaded ? `${ex.assist ? '<span class="t-label" style="align-self:center">보조</span>' : ''}<span class="t-mega">${F.num1(a.cur.w)}</span><span class="t-num-m" style="color:#888">kg${ex.unit === 'kg_each' ? ' ×2' : ''}</span><span class="x">×</span>` : '';
    const body = `<div class="s-exfig">${UI.exFig(ex, { eager: true })}</div>
      <div class="s-pad">
        <div class="row between"><span class="t-label">EXERCISE ${info.idx}/${info.n} · SET ${step.set}/${step.of}</span><button class="t-xs link" data-act="s-detail" data-id="${ex.id}" style="color:#ddd">자세 자세히</button></div>
        <h1 class="t-h1" style="margin:6px 0 2px">${esc(ex.name)}</h1>
        <div class="t-small mute">${esc((ex.muscles || []).join(' · '))}${a.consecutive ? ' · 연속 운동일이라 1세트 줄였어요' : ''}${light(a) && step.set === 1 ? ' · 오늘은 컨디션에 맞춰 가볍게' : ''}</div>
        <div class="rx" style="margin-top:14px">${loadBig}<span class="t-mega" style="color:var(--hot)" id="cur-r">${a.cur.r}</span><span class="t-num-m" style="color:#888">${ex.repsUnit && ex.repsUnit.includes('한쪽') ? '회 (한쪽)' : unitLbl}</span></div>
        ${step.set === 1 ? coachRow(line('setStart', info.idx)) : step.set === step.of ? coachRow('마지막 세트예요. 마지막 2회가 진짜 운동이에요 — 자세는 끝까지!') : ''}
        <div class="cues" style="margin-top:16px">${(ex.cues || []).map((c, i) => `<div class="cue"><b>${i + 1}</b>${esc(c)}</div>`).join('')}</div>
        <div class="t-label" style="margin-top:20px">실제로 한 기록 (다르면 조정)</div>
        <div class="grid ${loaded ? 'g2' : ''}" style="margin-top:8px">
          ${loaded ? `<div class="stepper"><button data-act="s-adj" data-k="w" data-d="-1" aria-label="무게 감소">${F.icon('minus')}</button><div class="v"><span id="adj-w">${F.num1(a.cur.w)}</span><small>kg</small></div><button data-act="s-adj" data-k="w" data-d="1" aria-label="무게 증가">${F.icon('plus')}</button></div>` : ''}
          <div class="stepper"><button data-act="s-adj" data-k="r" data-d="-1" aria-label="감소">${F.icon('minus')}</button><div class="v"><span id="adj-r">${a.cur.r}</span><small>${unitLbl}</small></div><button data-act="s-adj" data-k="r" data-d="1" aria-label="증가">${F.icon('plus')}</button></div>
        </div>
        <p class="t-xs mute" style="margin-top:12px">${esc(ex.breathing || '')}</p>
      </div>`;
    const foot = `<button class="btn primary lg block" data-act="s-set-done">${F.icon('check')}세트 ${step.set} 완료</button>`;
    return { body, foot };
  };

  R.rest = (a, step, ex) => {
    const nxt = a.steps[a.i + 1];
    const C = 2 * Math.PI * 45;
    const left = (a.rest.until - Date.now()) / 1000;
    const body = `<div class="s-pad" style="text-align:center">
        <div class="t-label" style="margin-top:12px">REST · SET ${step.set}/${step.of} 완료</div>
        <div class="rest-ring ${left <= 0 ? 'done' : ''}" id="rest-ring"><svg viewBox="0 0 100 100"><circle class="bgc" cx="50" cy="50" r="45"/><circle class="fgc" cx="50" cy="50" r="45" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - F.clamp(left / a.rest.dur, 0, 1))}"/></svg>
          <div class="rt"><div><div class="t-display" id="rest-t">${fmtClock(Math.max(0, Math.ceil(left)))}</div><div class="t-small mute" id="rest-lab">${left <= 0 ? '휴식 끝! 다음 세트' : '숨 고르고 물 한 모금'}</div></div></div></div>
        <div class="btn-row" style="justify-content:center;max-width:320px;margin:0 auto"><button class="btn sm" data-act="s-rest-add" data-d="-15">−15초</button><button class="btn sm" data-act="s-rest-add" data-d="30">+30초</button></div>
        <div class="card" style="margin-top:22px;text-align:left;background:#141414;border-color:#262626;color:#F4F4F0">
          <div class="t-label">NEXT</div>
          <div class="t-h2" style="margin-top:4px">${esc(ex.name)} · 세트 ${nxt.set}/${nxt.of}</div>
          <div class="t-num-l" style="margin-top:6px;color:#fff">${F.E.isLoaded(ex) ? F.E.loadLabel(ex, a.cur.w) + ' × ' : ''}${F.E.repsLabel(ex, a.cur.r)}</div>
          <p class="t-small mute" style="margin-top:8px">${esc((ex.cues || [])[a.rest.cue % Math.max(1, (ex.cues || []).length)] || '')} — 다음 세트에서 이것 하나만 신경 써요.</p>
        </div>
        <div style="margin-top:14px;text-align:left">${coachRow(line('rest', step.set + (ex.id.length % 3)))}</div>
        <button class="btn ghost sm" data-act="s-ask" data-id="${ex.id}" style="margin-top:10px;color:#ddd">${F.icon('chat', 'sm')}코치에게 질문하기</button>
      </div>`;
    const foot = `<button class="btn lg block ${left <= 0 ? 'primary' : ''}" id="rest-next" data-act="s-rest-skip">${F.icon('skip')}다음 세트 시작</button>`;
    return { body, foot };
  };

  R.rate = (a, step) => {
    const ex = F.EXERCISES[step.exId];
    const lg = a.log[step.exId] || { sets: [] };
    const res = lg.result;
    const summary = lg.sets.map((s, i) => `<span class="tag" style="background:#1a1a1a;border-color:#333;color:#ddd">${i + 1}세트 ${F.E.isLoaded(ex) ? F.num1(s.w) + 'kg×' : ''}${s.r}${ex.unit === 'sec' ? '초' : '회'}</span>`).join('');
    let body, foot;
    if (!res) {
      body = `<div class="s-pad">
        <div class="t-label" style="margin-top:8px">FEEDBACK · ${esc(ex.name)}</div>
        <h1 class="t-h1" style="margin:8px 0 10px">이번 운동,<br>어땠나요?</h1>
        <div class="tags" style="margin-bottom:18px">${summary || '<span class="mute">기록 없음</span>'}</div>
        ${Object.entries(F.E.RATING).map(([k, r]) => `<button class="rate-btn ${k}" data-act="s-rate" data-v="${k}"><span class="em">${r.en}</span><span><b>${esc(r.label)}</b><span>${esc(r.desc)}</span></span></button>`).join('')}
        <p class="t-xs mute" style="margin-top:14px">마지막 세트 기준으로 골라주세요. 평가에 따라 ${esc(F.josa(F.coachName(), '이/가'))} 다음 무게·횟수를 다시 짜요.</p>
      </div>`;
      foot = `<button class="btn block" data-act="s-rate-skip">평가 건너뛰기</button>`;
    } else {
      const dirTxt = res.dir === 'up' ? 'LEVEL UP' : res.dir === 'down' ? 'ADJUST DOWN' : 'HOLD';
      body = `<div class="s-pad">
        <div class="t-label" style="margin-top:8px">NEXT SESSION · ${esc(ex.name)}</div>
        <div class="row" style="gap:12px;margin:12px 0 4px;align-items:baseline;flex-wrap:wrap">
          <span class="t-num-l" style="color:#777;text-decoration:line-through">${F.E.isLoaded(ex) ? F.E.loadLabel(ex, res.prev.w) + ' × ' : ''}${F.E.repsLabel(ex, res.prev.r)}</span>
          <span class="t-num-l" style="color:#fff">→</span>
          <span class="t-num-xl" style="color:#fff">${F.E.isLoaded(ex) ? F.E.loadLabel(ex, res.next.w) + ' × ' : ''}${F.E.repsLabel(ex, res.next.r)}</span>
        </div>
        <span class="tag" style="background:${res.dir === 'up' ? '#fff' : res.dir === 'down' ? 'var(--hot)' : '#333'};border:0;color:${res.dir === 'up' || res.dir === 'down' ? '#000' : '#fff'}">${dirTxt}</span>
        <div style="margin-top:22px">${coachRow(res.msg + (res.dir === 'up' ? ' ' + line('rateEasy', ex.id.length) : res.dir === 'down' ? ' ' + line('rateHard', ex.id.length) : ''), 'coach')}</div>
      </div>`;
      const nextStep = a.steps[a.i + 1];
      const nextLbl = nextStep && nextStep.type === 'set' ? `다음: ${esc(F.EXERCISES[nextStep.exId].name)}` : nextStep && nextStep.type === 'cardio' ? '다음: 유산소' : '다음';
      foot = `<button class="btn primary lg block" data-act="s-next">${nextLbl} ${F.icon('arrowR')}</button>`;
    }
    return { body, foot };
  };

  R.cardio = (a, step) => {
    const cp = F.E.cardioPlan(a.date, a.templateId, cardioOpts(step));
    const t = timerOf(a); if (t.key !== a.i) Object.assign(t, { key: a.i, running: false, acc: 0, since: null, beeped: false });
    const ex = F.EXERCISES[cp.machine] || { id: cp.machine, name: cp.M.name, layout: '1p' };
    const c = a.cardioRes;
    if (a.cardioRating) {
      const body = `<div class="s-pad"><div class="t-label" style="margin-top:8px">CARDIO RESULT</div>
        <div class="t-num-xl" style="margin:10px 0 4px">${a.cardioMin}<span class="unit">분</span> · ~${F.num(a.cardioKcal)}<span class="unit">kcal</span></div>
        <div style="margin-top:18px">${coachRow(`${c.msg} — 다음 세팅: ${cardioMainText(cp.machine, c.cfg)} · ${c.cfg.min}분`, 'coach')}</div></div>`;
      return { body, foot: `<button class="btn primary lg block" data-act="s-next">쿨다운으로 ${F.icon('arrowR')}</button>` };
    }
    if (a.cardioAsk) {
      const body = `<div class="s-pad">
        <div class="t-label" style="margin-top:8px">FEEDBACK · ${esc(cp.M.name)}</div>
        <h1 class="t-h1" style="margin:8px 0 12px">유산소 강도는<br>어땠나요?</h1>
        <div class="t-label">실제로 한 시간</div>
        <div class="stepper" style="margin:8px 0 18px;max-width:260px"><button data-act="s-cmin" data-d="-1" aria-label="감소">${F.icon('minus')}</button><div class="v"><span id="cmin">${a.cardioMin}</span><small>분</small></div><button data-act="s-cmin" data-d="1" aria-label="증가">${F.icon('plus')}</button></div>
        ${Object.entries({ easy: ['할만했다', '대화하며 할 수 있었어요'], good: ['조금 어려웠다', '말은 되지만 노래는 힘든 정도'], hard: ['너무 힘들었다', '숨이 차서 말하기 어려웠어요'] }).map(([k, [l, d]]) => `<button class="rate-btn ${k}" data-act="s-cardio-rate" data-v="${k}"><span class="em">${F.E.RATING[k].en}</span><span><b>${l}</b><span>${d}</span></span></button>`).join('')}
      </div>`;
      return { body, foot: '' };
    }
    const el2 = elapsedOf(t) / 1000;
    const body = `<div class="s-exfig">${UI.exFig(ex, { eager: true })}</div>
      <div class="s-pad">
        <div class="t-label">CARDIO · LEVEL ${cp.level}/12</div>
        <h1 class="t-h1" style="margin:6px 0 2px">${esc(cp.M.name)}</h1>
        <div class="t-num-l" style="margin-top:10px;color:var(--hot);font-size:26px">${esc(cp.main)}</div>
        <div class="row" style="margin-top:14px;gap:14px;align-items:center">
          <div class="t-mega" id="step-t" style="font-size:clamp(56px,16vw,88px)">${fmtClock(step.min * 60 - el2)}</div>
          <button class="btn ${t.running ? '' : 'white'}" data-act="s-timer" style="min-width:110px">${t.running ? F.icon('pause') + '일시정지' : F.icon('play') + (el2 > 0 ? '계속' : '시작')}</button>
        </div>
        <div class="bar thin" style="margin-top:10px;background:#262626"><i id="step-bar" style="width:0"></i></div>
        <div style="margin-top:14px">${cp.segments.map((sg) => `<div class="seg-row"><span class="t-label">${esc(sg.label)}</span><span>${esc(sg.text)}</span><span class="t-num">${sg.min}분</span></div>`).join('')}</div>
        <div class="grid g2" style="margin-top:16px">
          <div class="kpi on-dark"><span class="t-label">TARGET HR</span><div class="t-num-m">${cp.hr.lo}–${cp.hr.hi}<span class="unit">bpm</span></div></div>
          <div class="kpi on-dark"><span class="t-label">BURNED</span><div class="t-num-m"><span id="cardio-kcal">0</span><span class="unit">/ ${F.num(cp.kcal)}kcal</span></div></div>
        </div>
        <div class="cues" style="margin-top:16px">${((F.EXERCISES[cp.machine] || {}).cues || ['손잡이 잡지 않기', '말은 되고 노래는 힘든 강도', '힘들면 속도부터 낮추기']).map((x, i) => `<div class="cue"><b>${i + 1}</b>${esc(x)}</div>`).join('')}</div>
      </div>`;
    const foot = `<button class="btn primary lg block" data-act="s-cardio-done">${F.icon('check')}유산소 완료</button>`;
    return { body, foot };
  };
  const cardioMainText = (machine, cfg) => machine === 'treadmill' ? `경사 ${cfg.incline}% · ${cfg.speed.toFixed(1)}km/h` : machine === 'bike' ? `저항 ${cfg.level} · ${cfg.rpm}RPM` : machine === 'elliptical' ? `저항 ${cfg.level} · 경사 ${cfg.ramp}` : `레벨 ${cfg.level}`;

  R.done = (a) => {
    const rec = a.result;
    if (!rec) return { body: '', foot: '' };
    const lv = F.E.level();
    const d = F.parseKey(a.date);
    const body = `<div class="s-pad" style="text-align:center">
        <div class="done-stamp">${rec.status === 'done' ? 'DONE' : 'GOOD<br>EFFORT'}<br>${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())}</div>
        <h1 class="t-h1" style="margin-top:18px">${rec.status === 'done' ? '오늘 운동 완료!' : '오늘도 출석 성공!'}</h1>
        <p class="mute">${esc((F.TEMPLATES[a.templateId] || {}).name || '')} · ${fmtClock((rec.endedAt - rec.startedAt) / 1000)}</p>
        <div class="grid g3" style="margin-top:20px;text-align:left">
          <div class="kpi on-dark"><span class="t-label">EXERCISE</span><div class="t-num-l">${rec.exDone}<span class="unit">종목</span></div></div>
          <div class="kpi on-dark"><span class="t-label">VOLUME</span><div class="t-num-l">${F.num(rec.volume)}<span class="unit">kg</span></div></div>
          <div class="kpi on-dark"><span class="t-label">BURN</span><div class="t-num-l">${F.num(rec.kcal)}<span class="unit">kcal</span></div></div>
        </div>
        <div class="s-cheer"><img src="${F.coachImg('cheer')}" alt=""><div><b>${esc(F.coachName())}</b><span>${esc(rec.status === 'done' ? (line('done', d.getDate()) || '완벽했어요!') + ' 30분 안에 단백질 챙기고, 오늘 밤은 7시간 이상 푹 자요.' : '끝까지 다 못 했어도 출석한 게 제일 중요해요. 다음엔 오늘 못 한 부분부터 이어서 해요.')}</span></div></div>
        ${(() => { const nx = Object.entries(a.log || {}).filter(([, lg]) => lg.result && lg.result.dir === 'up').map(([id, lg]) => { const ex = F.EXERCISES[id]; return `<div><span class="grow">${esc(ex.name)}</span><span class="t-num" style="color:#fff">${F.E.isLoaded(ex) ? F.E.loadLabel(ex, lg.result.next.w) + ' × ' : ''}${F.E.repsLabel(ex, lg.result.next.r)}</span></div>`; }); return nx.length ? `<div style="text-align:left;margin-top:16px"><div class="t-label">NEXT GOAL · 다음에 도전할 것</div><div class="list" style="margin-top:6px">${nx.join('')}</div></div>` : ''; })()}
        <div style="text-align:left;margin-top:8px">
          <div class="t-label">XP +${rec.xp}</div>
          <div class="list" style="margin-top:6px">${(rec.xpItems || []).map((x) => `<div><span class="grow t-small">${esc(x.note)}</span><span class="t-num" style="color:#fff">+${x.xp}</span></div>`).join('')}</div>
          <div class="row between" style="margin-top:14px"><span class="t-h3">Lv.${lv.lv} ${esc(lv.title)}</span><span class="t-num mute">${F.num(lv.cur)} / ${F.num(lv.need)}</span></div>
          <div class="bar" style="margin-top:8px;background:#262626"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
          ${rec.levelUp ? `<div class="callout" style="margin-top:14px;background:#1c1c1c;color:#fff">${F.icon('trophy')}<div><b>레벨 업!</b>Lv.${lv.lv} ${esc(lv.title)}이 됐어요.</div></div>` : ''}
          ${(rec.badges || []).map((id) => { const bd = F.BADGES.find((x) => x.id === id); return bd ? `<div class="callout" style="margin-top:10px;background:#1c1c1c;color:#fff">${F.icon('trophy')}<div><b>배지 획득 · ${esc(bd.name)}</b>${esc(bd.desc)}</div></div>` : ''; }).join('')}
        </div>
      </div>`;
    const foot = `<div class="btn-row"><button class="btn lg" data-act="s-close-done" data-to="#rec">출석 도장</button><button class="btn primary lg" data-act="s-close-done" data-to="#home">홈으로</button></div>`;
    return { body, foot };
  };

  /* ---------- actions ---------- */
  A['s-next'] = () => {
    const a = act(); if (!a) return;
    a.rest = null; a.cur = null;
    a.i = Math.min(a.steps.length - 1, a.i + 1);
    if (a.steps[a.i].type === 'done') { finish(a); return; }
    F.save(); SS.render();
  };
  A['s-timer'] = () => {
    const a = act(); const t = timerOf(a);
    if (t.running) { t.acc += Date.now() - t.since; t.running = false; t.since = null; }
    else { t.running = true; t.since = Date.now(); }
    F.save(); SS.render();
  };
  A['s-adj'] = (b) => {
    const a = act(); const step = a.steps[a.i]; const ex = F.EXERCISES[step.exId];
    const d = +b.dataset.d;
    if (b.dataset.k === 'w') { a.cur.w = F.E.stepLoad(ex, a.cur.w || 0, d); F.$('#adj-w').textContent = F.num1(a.cur.w); }
    else { a.cur.r = Math.max(0, a.cur.r + d * (ex.unit === 'sec' ? 5 : 1)); F.$('#adj-r').textContent = a.cur.r; const cr = F.$('#cur-r'); if (cr) cr.textContent = a.cur.r; }
    F.save();
  };
  A['s-set-done'] = () => {
    const a = act(); const step = a.steps[a.i];
    const lg = (a.log[step.exId] = a.log[step.exId] || { sets: [] });
    lg.sets.push({ w: F.E.isLoaded(F.EXERCISES[step.exId]) ? a.cur.w : null, r: a.cur.r, t: Date.now() });
    F.vibrate(40);
    if (step.set < step.of) {
      a.rest = { until: Date.now() + step.rest * 1000, dur: step.rest, cue: step.set, beeped: false };
      F.save(); SS.render();
    } else { a.cur = null; a.i++; F.save(); SS.render(); }
  };
  A['s-rest-add'] = (b) => { const a = act(); if (!a.rest) return; a.rest.until += +b.dataset.d * 1000; a.rest.dur = Math.max(10, a.rest.dur + +b.dataset.d); a.rest.beeped = false; F.save(); SS.render(); };
  A['s-rest-skip'] = () => {
    const a = act(); if (!a) return;
    const keep = { w: a.cur.w, r: a.cur.r };
    a.rest = null; a.i++;
    a.cur = { i: a.i, w: keep.w, r: a.steps[a.i].r != null ? a.steps[a.i].r : keep.r };
    F.save(); SS.render();
  };
  A['s-rate'] = (b) => {
    const a = act(); const step = a.steps[a.i];
    const lg = (a.log[step.exId] = a.log[step.exId] || { sets: [] });
    const reps = lg.sets.map((s) => s.r);
    const w = lg.sets.length ? lg.sets[lg.sets.length - 1].w : null;
    lg.rating = b.dataset.v;
    if (light(a)) lg.result = F.E.recordLight(step.exId, { w, reps }, b.dataset.v);
    else lg.result = F.E.applyRating(step.exId, { w, reps }, b.dataset.v);
    F.save(); SS.render();
  };
  A['s-rate-skip'] = () => { A['s-next'](); };
  A['s-cond'] = (b) => { const a = act(); (a.pre = a.pre || { cond: 'normal', sore: [], time: 'full' }).cond = b.dataset.v; F.save(); SS.render(); };
  A['s-sore'] = (b) => { const a = act(); const o = (a.pre = a.pre || { cond: 'normal', sore: [], time: 'full' }); const v = b.dataset.v; o.sore = o.sore.includes(v) ? o.sore.filter((x) => x !== v) : o.sore.concat([v]); F.save(); SS.render(); };
  A['s-time'] = (b) => { const a = act(); (a.pre = a.pre || { cond: 'normal', sore: [], time: 'full' }).time = b.dataset.v; F.save(); SS.render(); };
  A['s-check-go'] = () => {
    const a = act(); if (!a) return;
    const o = a.pre || { cond: 'normal', sore: [], time: 'full' };
    const nb = F.E.buildSession(a.date, a.templateId, Object.assign({}, o, { noCheck: true }));
    a.steps = [{ type: 'check', done: true }].concat(nb.steps);
    Object.assign(a, { cond: nb.cond, sore: nb.sore, time: nb.time, notes: nb.notes, swaps: nb.swaps, removed: nb.removed, exIds: nb.exIds, consecutive: nb.consecutive, startedAt: Date.now() });
    a.i = 1; a.rest = null; a.cur = null;
    F.save(); SS.render();
  };
  A['s-fc'] = (b) => {
    const a = act(); const step = a.steps[a.i]; if (!step || step.type !== 'form') return;
    const arr = a.fc[step.exId]; const i = +b.dataset.i; arr[i] = !arr[i];
    F.vibrate(15); F.save(); SS.render();
  };
  A['s-form-go'] = (b) => {
    const a = act(); const step = a.steps[a.i];
    const arr = (a.fc || {})[step.exId] || [];
    if (!b.dataset.skip && arr.length && !arr.every(Boolean)) { F.toast('사진 속 번호를 보며 3가지를 하나씩 눌러 확인해 주세요'); return; }
    A['s-next']();
  };
  A['s-ask'] = (b) => {
    if (UI.coach && UI.coach.openSheet) UI.coach.openSheet(b.dataset.id);
  };
  A['s-cardio-done'] = () => {
    const a = act(); const t = timerOf(a);
    if (t.running) { t.acc += Date.now() - t.since; t.running = false; t.since = null; }
    const step = a.steps[a.i];
    const m = Math.round(elapsedOf(t) / 60000);
    a.cardioMin = m > 0 ? m : step.min;
    a.cardioAsk = true;
    F.save(); SS.render();
  };
  A['s-cmin'] = (b) => { const a = act(); a.cardioMin = F.clamp((a.cardioMin || 0) + +b.dataset.d, 0, 120); F.$('#cmin').textContent = a.cardioMin; F.save(); };
  A['s-cardio-rate'] = (b) => {
    const a = act(); const step = a.steps[a.i];
    const cp = F.E.cardioPlan(a.date, a.templateId, cardioOpts(step));
    a.cardioKcal = Math.round((cp.kcal / cp.min) * a.cardioMin);
    a.cardioRes = light(a) ? { cfg: F.E.cardioPlan(a.date, a.templateId, { machine: step.machine }).cfg, msg: '컨디션을 낮춘 날이라 다음 유산소 강도는 그대로 둘게요' }
      : F.E.applyCardioRating(cp.machine, b.dataset.v, a.cardioMin, step.min);
    a.cardioRating = b.dataset.v; a.cardioAsk = false;
    F.save(); SS.render();
  };
  A['s-detail'] = (b) => {
    const ex = F.EXERCISES[b.dataset.id];
    F.sheet(`<div class="t-label mute">FORM GUIDE</div><h2 class="t-h2" style="margin:6px 0 12px">${esc(ex.name)}</h2>${UI.exFig(ex)}
      <h3 class="t-h3" style="margin-top:16px">동작 순서</h3><ol class="steps">${(ex.steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <h3 class="t-h3" style="margin-top:16px">이렇게 하면 안 돼요</h3><ul class="mistakes">${(ex.mistakes || []).map((x) => `<li>${F.icon('x', 'sm')}<span>${esc(x)}</span></li>`).join('')}</ul>
      ${ex.tip ? `<div class="callout" style="margin-top:14px">${F.icon('info')}<div>${esc(ex.tip)}</div></div>` : ''}`);
  };
  A['s-menu'] = () => {
    const a = act();
    if (a && a.steps[a.i].type === 'done') { A['s-close-done']({ dataset: { to: '#home' } }); return; }
    F.sheet(`<div class="t-label mute">PAUSE</div><h2 class="t-h2" style="margin:6px 0 14px">운동을 멈출까요?</h2>
      <div class="stack"><button class="btn block lg" data-act="s-leave">잠시 나가기 (이어하기 가능)</button>
      <button class="btn block lg dark" data-act="s-finish-early">여기까지 하고 기록 저장</button>
      <button class="btn block ghost" data-act="s-abandon">기록 없이 취소</button></div>`);
  };
  A['s-leave'] = () => { F.closeSheet(true); UI._resumeAsked = true; SS.hide(); F.toast('홈의 "운동 시작"을 누르면 이어서 할 수 있어요'); };
  A['s-finish-early'] = () => { F.closeSheet(true); const a = act(); if (a) finish(a, true); };
  A['s-abandon'] = () => { F.closeSheet(true); F.S.active = null; F.save(true); SS.hide(); };
  A['s-close-done'] = (b) => { F.S.active = null; F.save(true); SS.hide(); location.hash = b.dataset.to || '#home'; };

  /* ---------- finish & record ---------- */
  const finish = (a, early, silent) => {
    const s = F.S;
    const kg = F.E.body().weight;
    const exIds = (a.exIds && a.exIds.length ? a.exIds : F.E.templateEx(a.templateId)).filter((id) => F.EXERCISES[id]);
    let exDone = 0, volume = 0, rated = 0;
    for (const id of exIds) {
      const lg = a.log[id];
      if (lg && lg.sets.length) {
        exDone++;
        if (lg.rating) rated++;
        if (!F.EXERCISES[id].assist) for (const st of lg.sets) if (st.w) volume += st.w * (F.EXERCISES[id].unit === 'kg_each' ? 2 : 1) * (st.r || 0);
      }
    }
    const endedAt = Date.now();
    const totalMin = (endedAt - a.startedAt) / 60000;
    const cardioMin = a.cardioMin || 0;
    const strengthMin = Math.max(0, totalMin - cardioMin);
    const kcal = Math.round(((3.5 * 3.5 * kg) / 200) * Math.min(strengthMin, 70) + (a.cardioKcal || 0));
    const full = exDone >= Math.ceil(exIds.length * 0.8) && cardioMin >= 10 && !early;
    if (exDone === 0 && cardioMin === 0) { F.S.active = null; F.save(true); if (!silent) { SS.hide(); F.toast('기록된 운동이 없어서 저장하지 않았어요'); } return; }
    const lvBefore = F.E.level().lv;
    const rec = { date: a.date, templateId: a.templateId, status: full ? 'done' : 'partial', exDone, cardioMin, kcal, volume: Math.round(volume), startedAt: a.startedAt, endedAt, planned: !!a.planned, moved: !!a.moved, free: !!a.free, cond: a.cond || 'normal', time: a.time || 'full', log: compactLog(a.log) };
    s.sessions[a.date] = rec;
    if (s.overrides[a.date] && s.overrides[a.date].type === 'skip') delete s.overrides[a.date];
    const items = F.E.awardSession(rec);
    rec.xp = items.reduce((x, i) => x + i.xp, 0);
    rec.badges = F.E.checkBadges();
    rec.xpItems = items;
    rec.levelUp = F.E.level().lv > lvBefore;
    a.result = Object.assign({}, rec);
    delete rec.xpItems; delete rec.badges;
    a.i = a.steps.length - 1;
    a.rest = null;
    if (silent) { F.S.active = null; F.save(true); return; }
    F.save(true);
    F.beep([[784, 0.12], [988, 0.12], [1175, 0.12], [1568, 0.4]]);
    F.vibrate([80, 60, 80, 60, 300]);
    SS.render();
  };
  SS.finishSilently = (a) => finish(a, true, true);
  const compactLog = (log) => {
    const out = {};
    for (const [id, lg] of Object.entries(log)) out[id] = { s: lg.sets.map((x) => [x.w, x.r]), rt: lg.rating || null };
    return out;
  };
})(window.F);
