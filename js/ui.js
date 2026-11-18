/* UI shell: router, navigation, shared components, actions registry, onboarding. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = (F.UI = F.UI || {});
  const V = (F.V = F.V || {});
  const A = (F.act = F.act || {});
  const esc = F.esc;

  F.coachName = () => F.S.settings.trainerNames[F.S.settings.trainer] || '코치';
  F.coachImg = (pose) => F.img.trainer(F.S.settings.trainer, pose);

  /* ---------- Theme ---------- */
  // 'system' follows the viewer: claude.ai's own theme (data-theme on <html>) or the OS setting.
  // An explicit choice in the app goes on data-app-theme so it never fights the host's attribute.
  UI.isDark = () => {
    const de = document.documentElement;
    const t = de.dataset.appTheme || de.dataset.theme;
    if (t) return t === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  };
  UI.applyTheme = () => {
    const t = (F.S && F.S.settings && F.S.settings.theme) || 'system';
    const de = document.documentElement;
    if (t === 'light' || t === 'dark') de.dataset.appTheme = t; else delete de.dataset.appTheme;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', UI.isDark() ? '#000000' : '#FFFFFF');
  };
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => UI.applyTheme());

  /* ---------- Layout mode: mobile portrait (gym) vs PC 16:9 (information) ---------- */
  UI.mode = () => (window.innerWidth >= 1024 && window.innerWidth > window.innerHeight ? 'pc' : 'mobile');
  UI.applyMode = () => { const m = UI.mode(); const changed = document.documentElement.dataset.mode !== m; document.documentElement.dataset.mode = m; return changed; };
  UI.isPC = () => document.documentElement.dataset.mode === 'pc';
  let rz = null;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (UI.applyMode() && F.S.profile) { F.$('#app').dataset.shell = ''; F.render(); } }, 150); });

  /* ---------- Shared components ---------- */
  UI.ph = (label, title, desc) => `<header class="ph"><div class="t-label">${esc(label)}</div><h1 class="t-h1">${title}</h1>${desc ? `<p>${desc}</p>` : ''}</header>`;
  UI.secH = (label, title, right = '') => `<div class="sec-h"><div><span class="t-label">${esc(label)}</span><h2 class="t-h2">${title}</h2></div>${right}</div>`;
  UI.cellH = (label, right = '') => `<div class="cell-h"><span class="t-label">${esc(label)}</span>${right}</div>`;

  /** Exercise figure: stacked START/FINISH image (male or female figure). */
  UI.exFig = (ex, o = {}) => {
    if (!ex) return '';
    const g = o.g || F.figure();
    const lbl = ex.layout === '2p' ? '<span class="pl s">START</span><span class="pl f">FINISH</span>' : '';
    const gsw = o.switch ? `<div class="gsw" role="group" aria-label="이미지 성별"><button class="${g === 'm' ? 'on' : ''}" data-act="fig-g" data-g="m" data-id="${ex.id}">남</button><button class="${g === 'f' ? 'on' : ''}" data-act="fig-g" data-g="f" data-id="${ex.id}">여</button></div>` : '';
    const zoom = o.zoom ? `<button class="zoom" data-act="zoom" data-src="${F.img.ex(ex.id, g)}" aria-label="크게 보기">${F.icon('plus', 'sm')}</button>` : '';
    return `<figure class="exfig l-${ex.layout || '2p'} ${o.cls || ''}" data-ex="${ex.id}"><img src="${F.img.ex(ex.id, g)}" alt="${esc(ex.name)} ${ex.layout === '2p' ? '시작·끝 자세' : '자세'}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async">${lbl}${gsw}${zoom}</figure>`;
  };
  UI.exMedia = (ex) => UI.exFig(ex);
  A['fig-g'] = (el) => {
    const fig = el.closest('.exfig');
    const g = el.dataset.g, id = el.dataset.id;
    fig.querySelector('img').src = F.img.ex(id, g);
    fig.querySelectorAll('.gsw button').forEach((b) => b.classList.toggle('on', b.dataset.g === g));
    const z = fig.querySelector('.zoom'); if (z) z.dataset.src = F.img.ex(id, g);
  };
  A.zoom = (el) => {
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.innerHTML = `<img src="${el.dataset.src}" alt=""><button aria-label="닫기">${F.icon('x')}</button>`;
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
  };

  UI.rx = (exId, opt = {}) => {
    const p = F.E.prescription(exId);
    const ex = p.ex;
    const load = F.E.isLoaded(ex) ? F.E.loadLabel(ex, p.w) : '맨몸';
    return opt.parts ? { load, reps: F.E.repsLabel(ex, p.r), sets: `${p.sets}세트`, p } : `${load} × ${F.E.repsLabel(ex, p.r)} × ${p.sets}세트`;
  };
  /** 4-cell prescription box: load / reps / sets / rest */
  UI.rxBox = (exId) => {
    const p = F.E.prescription(exId), ex = p.ex;
    const load = F.E.isLoaded(ex) ? `${F.num1(p.w)}<small>kg${ex.unit === 'kg_each' ? ' ×2' : ''}</small>` : '<small>맨몸</small>';
    return `<div class="rxbox"><div><span class="t-label">WEIGHT</span><div class="v">${load}</div></div>
      <div><span class="t-label">REPS</span><div class="v">${p.r}<small>${ex.unit === 'sec' ? '초' : ex.repsUnit && ex.repsUnit.includes('한쪽') ? '회/한쪽' : '회'}</small></div></div>
      <div><span class="t-label">SETS</span><div class="v">${p.sets}<small>세트</small></div></div>
      <div><span class="t-label">REST</span><div class="v">${p.rest}<small>초</small></div></div></div>`;
  };
  /** Recommended first-session load for men and women */
  UI.mfStart = (ex) => {
    if (!ex.start) return '';
    const u = ex.unit === 'kg_each' ? 'kg (한 손)' : 'kg';
    return `<div class="mf"><div><span class="t-label mute">남성 시작</span><div class="t-num-m">${F.num1(ex.start.m)}<span class="unit">${u}</span></div></div><div><span class="t-label mute">여성 시작</span><div class="t-num-m">${F.num1(ex.start.f)}<span class="unit">${u}</span></div></div></div>`;
  };

  UI.stamp = (status) => {
    const ic = status === 'done' ? F.icon('check') : status === 'missed' ? F.icon('x') : status === 'moved' || status === 'skipped' ? F.icon('arrowR') : '';
    return `<span class="st ${status}">${ic}</span>`;
  };
  UI.statusText = { done: '완료', partial: '부분 완료', planned: '예정', today: '오늘', missed: '놓침', moved: '이동됨', skipped: '건너뜀', rest: '휴식' };
  UI.myName = () => (F.S.profile && F.S.profile.name) || (F.Sync.me && F.Sync.me.name) || '';

  /* Trainer lines — contextual, PT tone */
  UI.coachLine = () => {
    const s = F.S, k = F.today();
    const pl = F.E.planFor(k);
    const ses = s.sessions[k];
    const h = new Date().getHours();
    const nm = UI.myName();
    const name = nm ? `${nm}님` : '회원님';
    const streak = F.E.streakWeeks();
    if (s.active && s.active.date === k) return `${name}, 운동이 아직 진행 중이에요. 이어서 끝내볼까요?`;
    if (ses && (ses.status === 'done' || ses.status === 'partial')) return pick([`오늘 운동 완벽했어요! 단백질 챙기고 7시간 이상 푹 자는 것까지가 운동이에요.`, `수고했어요 ${name}. 오늘 기록은 다음 세션 무게에 그대로 반영해 둘게요.`]);
    if (pl) {
      const t = F.TEMPLATES[F.E.templateFor(k)];
      const gt = F.timeToMin(pl.time);
      if (F.nowMin() > gt + 90) return `오늘 ${t.name} 일정이 지났어요. 못 가면 '약속 생김'으로 대체일을 잡아둘게요.`;
      return pick([`오늘은 ${t.name}! ${pl.time}에 만나요. ${gt >= 18 * 60 + 20 ? `저녁은 ${F.minToTime(Math.max(17 * 60 + 30, gt - 90))}쯤 먹고 오세요.` : '운동 1시간 30분 전엔 뭐라도 먹어두세요.'}`, `${name}, 오늘 ${t.name}이에요. 지난 기록 보고 무게 맞춰놨어요.`, `${pl.time} 운동 잊지 마세요. 시작만 하면 끝까지 이끌어 드릴게요.`]);
    }
    const nx = F.E.nextPlanned(F.addDays(k, 1));
    if (h < 11) return `오늘은 회복일이에요. 근육은 쉬는 날 자라요. 걷기 30분 + 단백질은 꼭!`;
    if (streak >= 2) return `${streak}주 연속 목표 달성 중! ${nx ? F.dateLabel(nx) : '다음 운동'}에 만나요.`;
    return `쉬는 날도 관리는 계속돼요. 다음 운동은 ${nx ? F.dateLabel(nx) : '곧'}이에요.`;
  };
  const pick = (arr) => arr[new Date().getDate() % arr.length];

  /* ---------- Shell ---------- */
  const NAV = [
    { id: 'home', mo: '오늘', pc: '대시보드', icon: 'home' },
    { id: 'plan', mo: '플랜', pc: '운동 플랜', icon: 'plan' },
    { id: 'lib', mo: '자세', pc: '운동 가이드', icon: 'dumbbell' },
    { id: 'food', mo: '식단', pc: '식단', icon: 'bowl' },
    { id: 'log', mo: '기록', pc: '운동 일지', icon: 'list' },
    { id: 'body', pc: '바디 · 인바디', icon: 'body', pcOnly: true },
    { id: 'rec', pc: '출석 · 레벨', icon: 'stamp', pcOnly: true },
    { id: 'set', pc: '설정', icon: 'gear', pcOnly: true },
  ];
  const TAB_OF = { ex: 'lib', rec: 'rec', body: 'body', log: 'log' };
  UI.shell = () => {
    const root = F.$('#app');
    if (root.dataset.shell === '1') return;
    root.dataset.shell = '1';
    root.innerHTML = `
      <header class="topbar">
        <a class="logo" href="#home"><i></i>MY PT</a>
        <div class="top-right">
          <span class="sync-dot ${F.Sync.mode === 'cloud' ? (F.Sync.status === 'error' ? 'err' : 'on') : ''}" title="${F.Sync.mode === 'cloud' ? '클라우드 동기화' : '이 기기에만 저장'}"></span>
          <a class="who" href="#set" id="who"></a>
          <a class="icon-btn mo-only" href="#set" aria-label="설정">${F.icon('gear')}</a>
        </div>
      </header>
      <main id="view" tabindex="-1"></main>
      <nav class="tabbar" aria-label="메인 메뉴">
        ${NAV.map((t) => `<a href="#${t.id}" data-tab="${t.id}" class="${t.pcOnly ? 'pc-only' : ''}">${F.icon(t.icon)}<span class="mo-only">${t.mo || ''}</span><span class="pc-only">${t.pc}</span></a>`).join('')}
      </nav>
      <div id="session" aria-live="polite"></div>`;
  };
  UI.updateTop = () => {
    const lv = F.E.level();
    const el = F.$('#who');
    const nm = UI.myName();
    if (el) el.innerHTML = `<img src="${F.coachImg('hero')}" alt=""><span>${esc(nm || '내 기록')}</span><b>Lv.${lv.lv}</b>`;
    const d = F.$('.sync-dot');
    if (d) d.className = 'sync-dot ' + (F.Sync.mode === 'cloud' ? (F.Sync.status === 'error' ? 'err' : 'on') : '');
  };

  /* ---------- Router ---------- */
  F.route = () => {
    let h = location.hash.replace(/^#\/?/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* keep raw */ }
    if (h.startsWith('ex-')) return { name: 'ex', rest: [h.slice(3).replace(/-/g, '_')] };
    const [name, ...rest] = h.split('/'); // legacy #/ex/<id> links still work outside claude.ai
    return { name: name || 'home', rest };
  };
  F.go = (hash) => { if (location.hash === hash) F.render(); else location.hash = hash; };
  F.render = () => {
    UI.applyTheme();
    UI.applyMode();
    if (!F.S.profile) { V.onboard(); return; }
    UI.shell();
    const r = F.route();
    const view = V[r.name] || V.home;
    const out = view(r.rest) || '';
    const html = typeof out === 'string' ? out : out.html;
    const main = F.$('#view');
    main.innerHTML = html;
    const tab = TAB_OF[r.name] || r.name;
    const moTab = ['body', 'rec', 'log'].includes(tab) ? 'log' : tab;
    F.$$('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (UI.isPC() ? tab : moTab)));
    UI.updateTop();
    if (out && out.after) requestAnimationFrame(() => out.after(main));
    if (UI._lastRoute !== location.hash) { (UI.isPC() ? main : window).scrollTo(0, 0); UI._lastRoute = location.hash; }
    if (F.S.active && !F.$('#session.on') && !UI._resumeAsked) {
      UI._resumeAsked = true;
      if (F.S.active.date === F.today()) UI.askResume();
    }
  };
  UI.refresh = () => {
    const sc = UI.isPC() ? F.$('#view') : document.scrollingElement;
    const y = sc ? sc.scrollTop : 0;
    F.render();
    if (sc) sc.scrollTop = y;
  };
  window.addEventListener('hashchange', F.render);

  /* ---------- Events ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = A[el.dataset.act];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const fn = A[el.dataset.change];
    if (fn) fn(el, e);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { F.closeSheet(); const lb = F.$('.lb'); if (lb) lb.remove(); } });
  A['sheet-close'] = () => F.closeSheet();
  A.go = (el) => F.go(el.dataset.href);

  /* ---------- Alarm modal ---------- */
  UI.alarmModal = (k, kind, title, body) => {
    const tid = F.E.templateFor(k);
    const t = F.TEMPLATES[tid];
    F.sheet(`
      <div class="coach-row" style="grid-template-columns:1fr 110px">
        <div class="coach-say" style="box-shadow:4px 4px 0 var(--ink)"><b>${esc(F.coachName())}</b>${esc(body)}</div>
        <img src="${F.coachImg('hero')}" alt="" style="width:110px;height:150px;object-fit:cover;object-position:top">
      </div>
      <div class="t-label mute" style="margin-top:6px">${kind === 'lead' ? 'REMINDER' : 'GYM TIME'}</div>
      <h2 class="t-h1" style="margin:6px 0 4px">${esc(title)}</h2>
      <p class="mute2">${esc(t ? t.name + ' · ' + t.focus : '')}</p>
      <div class="stack" style="margin-top:18px">
        <button class="btn primary lg block" data-act="start-session" data-date="${k}">${F.icon('play')}지금 운동 시작</button>
        <div class="btn-row"><button class="btn" data-act="snooze">${F.icon('clock')}10분 뒤</button><button class="btn" data-act="open-resched" data-date="${k}">오늘 못 가요</button></div>
      </div>`);
  };
  A.snooze = () => F.Alarm.snooze(10);

  UI.askResume = () => {
    const a = F.S.active;
    const t = F.TEMPLATES[a.templateId];
    F.sheet(`<div class="t-label mute">IN PROGRESS</div><h2 class="t-h2" style="margin:6px 0 8px">진행 중인 운동이 있어요</h2>
      <p class="mute2">${esc(t ? t.name : '')} · ${a.i + 1}/${a.steps.length} 단계에서 멈췄어요.</p>
      <div class="btn-row" style="margin-top:18px"><button class="btn primary lg" data-act="resume-session">${F.icon('play')}이어하기</button><button class="btn lg" data-act="discard-session">처음부터</button></div>`);
  };

  /* ---------- Onboarding ---------- */
  const ONB = { step: 0, d: null };
  const onbDefaults = () => ({ trainer: 'm', name: '', sex: 'm', age: 32, height: 171, weight: 90, goalWeight: null, pace: 'normal', freq: 3, days: [1, 3, 5], gymTime: '19:30' });

  UI.boot = () => {
    const root = F.$('#app');
    root.dataset.shell = '';
    root.innerHTML = `<div class="boot"><span class="logo"><i></i>MY PT</span>
      <div class="t-h2">내 기록을 불러오는 중이에요</div>
      <div class="bar"><i></i></div>
      <p class="t-small mute">휴대폰과 PC의 기록을 맞추고 있어요.</p></div>`;
  };

  V.onboard = () => {
    const root = F.$('#app');
    root.dataset.shell = '';
    if (!ONB.d) { ONB.d = onbDefaults(); if (F.Sync.me && F.Sync.me.name) ONB.d.name = String(F.Sync.me.name).slice(0, 12); }
    const d = ONB.d;
    const steps = ['코치', '기본 정보', '목표', '스케줄', '시작'];
    const top = `<div class="onb-top"><div class="row between"><span class="logo"><i></i>MY PT</span><span class="t-label mute">${String(ONB.step + 1).padStart(2, '0')} / 05</span></div>
      <div class="ticks" style="margin-top:14px">${steps.map((_, i) => `<i class="${i <= ONB.step ? 'on' : ''}"></i>`).join('')}</div></div>`;
    let body = '', foot = '';
    const bmi = F.E.bmi(d.weight, d.height);
    if (ONB.step === 0) {
      body = `<div class="t-label mute">WELCOME</div>
        <h1 class="t-h1" style="font-size:34px;margin:10px 0 10px">오늘부터 당신의<br>전담 PT예요.</h1>
        <p class="mute2">운동 루틴, 자세, 식단, 영양제, 인바디 분석까지 — 함께할 코치를 골라주세요. 언제든 바꿀 수 있어요.</p>
        <div class="pick-coach" style="margin-top:22px">
          ${['m', 'f'].map((g) => `<button data-act="onb-coach" data-g="${g}" class="${d.trainer === g ? 'on' : ''}" aria-pressed="${d.trainer === g}">
            <div class="pc-img"><img src="${F.img.trainer(g, 'hero')}" alt="${g === 'm' ? '남성' : '여성'} 트레이너"></div>
            <div class="pc-t"><div class="t-h3">${esc(F.S.settings.trainerNames[g])}</div><div class="t-xs mute">${g === 'm' ? '근력·자세 교정 전문 · 32세' : '다이어트·체형 관리 전문 · 31세'}</div></div></button>`).join('')}
        </div>`;
      foot = `<button class="btn primary lg block" data-act="onb-next">${esc(F.josa(F.S.settings.trainerNames[d.trainer], '과/와'))} 시작하기 ${F.icon('arrowR')}</button>`;
    } else if (ONB.step === 1) {
      body = `<div class="t-label mute">BASIC INFO</div>
        <h1 class="t-h1" style="margin:10px 0 18px">몸 상태부터<br>알려주세요.</h1>
        <label class="field"><span>이름 (선택)</span><input class="input" id="o-name" value="${esc(d.name)}" placeholder="코치가 부를 이름" maxlength="12"></label>
        <div class="field"><span>성별</span><div class="seg" role="group">${[['m', '남성'], ['f', '여성']].map(([v, l]) => `<button data-act="onb-set" data-k="sex" data-v="${v}" class="${d.sex === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="grid g3" style="margin-top:16px">
          <label class="field" style="margin:0"><span>나이</span><div class="input-unit"><input class="input num" id="o-age" type="number" inputmode="numeric" value="${d.age}" min="15" max="90"><em>세</em></div></label>
          <label class="field" style="margin:0"><span>키</span><div class="input-unit"><input class="input num" id="o-height" type="number" inputmode="decimal" value="${d.height}" min="120" max="230"><em>cm</em></div></label>
          <label class="field" style="margin:0"><span>체중</span><div class="input-unit"><input class="input num" id="o-weight" type="number" inputmode="decimal" step="0.1" value="${d.weight}" min="30" max="250"><em>kg</em></div></label>
        </div>
        <div class="card" style="margin-top:18px"><div class="row between"><div class="kpi"><span class="t-label">BMI</span><div class="t-num-l" id="o-bmi">${F.num1(bmi)}</div></div>
        <p class="t-small mute2" style="max-width:62%">${bmi >= 30 ? '비만 2단계 구간이에요. 관절 부담이 적은 머신·경사 걷기로 시작해서 단계적으로 강도를 올릴게요.' : bmi >= 25 ? '비만 1단계 구간이에요. 근력 + 유산소 병행이 가장 효과적이에요.' : '정상 범위예요. 근육량을 늘리며 체지방을 다듬어요.'}</p></div></div>`;
      foot = `<button class="btn lg" data-act="onb-prev">${F.icon('arrowL')}</button><button class="btn primary lg" style="flex:1" data-act="onb-next">다음</button>`;
    } else if (ONB.step === 2) {
      const bmi24 = Math.round(24 * Math.pow(d.height / 100, 2) * 10) / 10;
      const m10 = Math.round(d.weight * 0.9 * 10) / 10;
      if (d.goalWeight == null) d.goalWeight = Math.max(bmi24, Math.round((d.weight - 15) * 10) / 10);
      body = `<div class="t-label mute">GOAL</div>
        <h1 class="t-h1" style="margin:10px 0 8px">목표를 정해요.</h1>
        <p class="mute2">처음엔 체중의 10% 감량이 가장 현실적이고 건강 효과가 커요.</p>
        <div class="chips" style="margin:18px 0 12px">
          <button class="chip ${d.goalWeight === m10 ? 'on' : ''}" data-act="onb-goal" data-v="${m10}">1차 목표 −10% · ${m10}kg</button>
          <button class="chip ${d.goalWeight === bmi24 ? 'on' : ''}" data-act="onb-goal" data-v="${bmi24}">BMI 24 · ${bmi24}kg</button>
        </div>
        <label class="field"><span>목표 체중</span><div class="input-unit"><input class="input num" id="o-goal" type="number" inputmode="decimal" step="0.1" value="${d.goalWeight}"><em>kg</em></div></label>
        <div class="field"><span>감량 속도</span><div class="seg">${[['easy', '여유'], ['normal', '표준'], ['fast', '적극']].map(([v, l]) => `<button data-act="onb-set" data-k="pace" data-v="${v}" class="${d.pace === v ? 'on' : ''}">${l}</button>`).join('')}</div>
        <p class="t-small mute" style="margin-top:8px">${(() => { const pct = { easy: 0.15, normal: 0.2, fast: 0.25 }[d.pace]; const tdee = F.E.mifflin(d.weight, d.height, d.age, d.sex) * 1.4; const kg = (tdee * pct * 7) / 7700; return `유지 칼로리(약 ${F.num(tdee)}kcal)의 ${Math.round(pct * 100)}% 적자 · 지방 기준 주 약 ${F.num1(kg)}kg 감량${d.pace === 'fast' ? ' (배고픔↑, 단백질 필수)' : d.pace === 'normal' ? ' (권장)' : ''} · 초반 1~2주는 수분이 빠져 더 빨리 줄어요`; })()}</p></div>`;
      foot = `<button class="btn lg" data-act="onb-prev">${F.icon('arrowL')}</button><button class="btn primary lg" style="flex:1" data-act="onb-next">다음</button>`;
    } else if (ONB.step === 3) {
      const pat = F.PATTERNS[d.freq];
      const wk = d.days.filter((x) => x >= 1 && x <= 5).length;
      body = `<div class="t-label mute">SCHEDULE</div>
        <h1 class="t-h1" style="margin:10px 0 8px">언제 헬스장에<br>갈 수 있나요?</h1>
        <p class="mute2">주중 최소 2회는 꼭 지키도록 짜드려요. 초보자에겐 주 3회를 가장 추천해요.</p>
        <div class="field" style="margin-top:18px"><span>주 몇 회?</span><div class="seg">${[2, 3, 4, 5].map((n) => `<button data-act="onb-freq" data-v="${n}" class="${d.freq === n ? 'on' : ''}">${n}회</button>`).join('')}</div></div>
        <div class="field"><span>요일 (추천: ${pat.title})</span><div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button data-act="onb-day" data-v="${w}" class="${d.days.includes(w) ? 'on' : ''} ${w === 0 || w === 6 ? 'wk' : ''}">${F.DAY_NAMES[w]}</button>`).join('')}</div>
          <p class="t-small" style="margin-top:8px">${d.days.length !== d.freq ? `<span class="pill-no">${d.days.length}/${d.freq}일 선택됨</span>` : '<span class="pill-ok">요일 선택 완료</span>'} ${wk < 2 ? '<span class="pill-no">주중 2회 이상 필요</span>' : '<span class="pill-ok">주중 ' + wk + '회</span>'}</p></div>
        <label class="field"><span>운동 시작 시간 (알람)</span><input class="input num" id="o-time" type="time" value="${d.gymTime}"></label>
        <div class="card" style="margin-top:18px"><div class="t-label mute" style="margin-bottom:6px">WHY ${esc(pat.title)}</div>${pat.reasons.map((r, i) => `<div class="reason"><b>0${i + 1}</b><span>${esc(r)}</span></div>`).join('')}</div>`;
      const ok = d.days.length === d.freq && wk >= 2;
      foot = `<button class="btn lg" data-act="onb-prev">${F.icon('arrowL')}</button><button class="btn primary lg" style="flex:1" data-act="onb-next" ${ok ? '' : 'disabled'}>다음</button>`;
    } else {
      const coach = F.S.settings.trainerNames[d.trainer];
      body = `<div class="t-label mute">READY</div>
        <h1 class="t-h1" style="margin:10px 0 16px">플랜이 준비됐어요.</h1>
        <div class="card ink">
          <div class="row between"><div class="kpi"><span class="t-label">START</span><div class="t-num-xl">${F.num1(d.weight)}<span class="unit">kg</span></div></div>
          <div style="font-family:var(--num);font-size:28px">→</div>
          <div class="kpi"><span class="t-label">GOAL</span><div class="t-num-xl">${F.num1(d.goalWeight)}<span class="unit">kg</span></div></div></div>
          <div class="divider"></div>
          <div class="list">
            <div><span class="t-label mute" style="width:72px">PROGRAM</span><span class="grow">12주 3단계 (적응기 → 기초 근력 → 강화기)</span></div>
            <div><span class="t-label mute" style="width:72px">WEEKLY</span><span class="grow">주 ${d.freq}회 · ${d.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((w) => F.DAY_NAMES[w]).join('·')} ${d.gymTime}</span></div>
            <div><span class="t-label mute" style="width:72px">COACH</span><span class="grow">${esc(coach)}</span></div>
          </div>
        </div>
        <p class="mute2" style="margin-top:16px">다음 단계: 인바디 결과지를 찍어 올리면 체지방·근육량 기준으로 칼로리와 단백질을 더 정확하게 맞춰드려요. (나중에 해도 돼요)</p>`;
      foot = `<button class="btn lg" data-act="onb-prev">${F.icon('arrowL')}</button><button class="btn primary lg" style="flex:1" data-act="onb-finish">${F.icon('check')}플랜 시작하기</button>`;
    }
    root.innerHTML = `<div class="onb">${top}<div class="onb-body">${body}</div><div class="onb-foot"><div>${foot}</div></div></div>`;
    const bind = (id, key, num) => { const el = F.$('#' + id); if (el) el.addEventListener('input', () => { ONB.d[key] = num ? parseFloat(el.value) : el.value; if (id === 'o-height' || id === 'o-weight') { const b = F.$('#o-bmi'); if (b) b.textContent = F.num1(F.E.bmi(ONB.d.weight, ONB.d.height)); } }); };
    bind('o-name', 'name'); bind('o-age', 'age', true); bind('o-height', 'height', true); bind('o-weight', 'weight', true); bind('o-goal', 'goalWeight', true); bind('o-time', 'gymTime');
  };
  A['onb-coach'] = (el) => { ONB.d.trainer = el.dataset.g; F.S.settings.trainer = el.dataset.g; V.onboard(); };
  A['onb-set'] = (el) => { ONB.d[el.dataset.k] = el.dataset.v; V.onboard(); };
  A['onb-goal'] = (el) => { ONB.d.goalWeight = parseFloat(el.dataset.v); V.onboard(); };
  A['onb-freq'] = (el) => { const n = +el.dataset.v; ONB.d.freq = n; ONB.d.days = F.PATTERNS[n].days.slice(); V.onboard(); };
  A['onb-day'] = (el) => { const w = +el.dataset.v; const ds = ONB.d.days; const i = ds.indexOf(w); if (i >= 0) ds.splice(i, 1); else ds.push(w); V.onboard(); };
  A['onb-prev'] = () => { ONB.step = Math.max(0, ONB.step - 1); V.onboard(); window.scrollTo(0, 0); };
  A['onb-next'] = () => {
    const d = ONB.d;
    if (ONB.step === 1) {
      if (!(d.age >= 15 && d.age <= 90) || !(d.height >= 120 && d.height <= 230) || !(d.weight >= 30 && d.weight <= 250)) { F.toast('나이·키·체중을 확인해 주세요'); return; }
      d.goalWeight = null;
    }
    if (ONB.step === 2 && !(d.goalWeight > 30 && d.goalWeight < d.weight + 30)) { F.toast('목표 체중을 확인해 주세요'); return; }
    ONB.step = Math.min(4, ONB.step + 1); V.onboard(); window.scrollTo(0, 0);
  };
  A['onb-finish'] = () => {
    const d = ONB.d, s = F.S;
    const today = F.today();
    s.profile = { name: (d.name || '').trim(), sex: d.sex, age: Math.round(d.age), height: +d.height, weight: +d.weight, goalWeight: +d.goalWeight, createdAt: today, startDate: today };
    Object.assign(s.settings, { trainer: d.trainer, freq: d.freq, days: d.days.slice(), gymTime: d.gymTime, pace: d.pace });
    s.weights.push({ d: today, w: +d.weight });
    F.E.addXP('onboard', 50, '플랜 시작 보너스');
    F.save(true);
    ONB.step = 0; ONB.d = null;
    location.hash = '#home';
    F.render();
    setTimeout(() => F.toast(`${F.coachName()}: 잘 부탁해요! 오늘부터 시작이에요.`), 300);
  };
})(window.F);
