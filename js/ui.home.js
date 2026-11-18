/* Home — mobile: today's workout with big exercise images (gym use).
           PC: 16:9 dashboard (today, week & partner, level, body trend, recent log, nutrition). */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;

  const todayInfo = () => {
    const s = F.S, k = F.today();
    const pl = F.E.planFor(k);
    const ses = s.sessions[k];
    const done = ses && (ses.status === 'done' || ses.status === 'partial');
    const tid = pl || done ? (done ? ses.templateId : F.E.templateFor(k)) : null;
    return { k, pl, ses, done, tid, t: tid ? F.TEMPLATES[tid] : null };
  };

  V.home = () => (UI.isPC() ? dash() : mobileHome());

  /* ======================= MOBILE ======================= */
  const mobileHome = () => {
    const s = F.S;
    const { k, pl, ses, done, t } = todayInfo();
    const d = new Date();
    const ph = F.E.phase();
    const monday = F.mondayOf(k);
    const week = F.E.week(monday);
    const ws = F.E.weekStats(monday);
    let head = '', body = '';
    const dateLine = `<div class="t-label mute">${F.DAY_EN[d.getDay()]} · ${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())} · WEEK ${F.pad(F.E.programWeek(k))}</div>`;
    if (done) {
      head = `${dateLine}<h1 class="t-title" style="margin-top:8px">${esc(t ? t.name : '운동')} 완료</h1>
        <p class="mute2" style="margin-top:6px">${ses.exDone || 0}종목 · 유산소 ${ses.cardioMin || 0}분 · ${F.num(ses.kcal || 0)}kcal · <b>+${ses.xp || 0} XP</b></p>`;
      body = `<div class="card ink" style="margin:16px var(--pad) 0;display:flex;gap:16px;align-items:center">
          <div class="done-stamp" style="width:76px;height:76px;margin:0;font-size:12px;border-width:3px;animation:none">DONE<br>${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())}</div>
          <div><b style="font-size:16px">오늘 출석 도장 획득</b><p class="t-small mute">단백질 챙기고 7시간 이상 푹 자는 것까지가 운동이에요.</p></div></div>
        <div class="btn-row" style="padding:12px var(--pad) 0"><a class="btn" href="#log">운동 일지</a><a class="btn" href="#food">회복 식단</a></div>`;
    } else if (pl) {
      const cp = F.E.cardioPlan(k, t.id);
      const mins = F.E.estimateMinutes(t.id);
      const exs = t.ex.filter((id) => F.EXERCISES[id]);
      head = `${dateLine}<h1 class="t-title" style="margin-top:8px">${esc(t.name)}</h1>
        <p class="mute2" style="margin-top:6px"><b class="t-num">${pl.time}</b> 시작 · 약 ${mins}분 · ${exs.length}종목 + ${esc(cp.M.short)} ${cp.min}분${pl.moved ? ' · <b>대체일</b>' : ''}</p>`;
      body = `<div class="swipe" style="margin-top:16px">${exs.map((id, i) => {
          const ex = F.EXERCISES[id]; const rx = UI.rx(id, { parts: true });
          return `<a class="bigex" href="${F.exHref(id)}">${UI.exFig(ex, { eager: i < 2 })}
            <div class="cap"><div class="row between"><span class="t-label mute">${F.pad(i + 1)} / ${F.pad(exs.length)}</span><span class="t-xs mute">${esc((ex.muscles || []).slice(0, 2).join(' · '))}</span></div>
            <div class="t-h2" style="margin-top:4px">${esc(ex.name)}</div>
            <div class="t-num-m" style="margin-top:4px">${rx.load} · ${rx.reps} · ${rx.sets}</div></div></a>`;
        }).join('')}
          <a class="bigex" href="${F.exHref(cp.machine)}">${UI.exFig(F.EXERCISES[cp.machine])}<div class="cap"><span class="t-label mute">CARDIO</span><div class="t-h2" style="margin-top:4px">${esc(cp.M.name)}</div><div class="t-num-m" style="margin-top:4px">${esc(cp.main)} · ${cp.min}분</div></div></a>
        </div>
        <div class="sticky-cta"><button class="btn primary xl block" data-act="start-session" data-date="${k}">${F.icon('play')}운동 시작</button></div>
        <div style="padding:8px var(--pad) 0;text-align:center"><button class="t-small link" data-act="open-resched" data-date="${k}">약속이 생겼어요 — 대체일 잡기</button></div>`;
    } else {
      const nx = F.E.nextPlanned(F.addDays(k, 1));
      const nt = nx ? F.TEMPLATES[F.E.templateFor(nx)] : null;
      const tg = F.E.targets(k);
      head = `${dateLine}<h1 class="t-title" style="margin-top:8px">회복하는 날</h1>
        <p class="mute2" style="margin-top:6px">${nx ? `다음 운동 <b>${F.dateLabel(nx)} ${(F.E.planFor(nx) || {}).time || ''}</b> · ${esc(nt ? nt.name : '')}` : ''}</p>`;
      body = `<div class="card" style="margin:16px var(--pad) 0"><div class="t-label mute" style="margin-bottom:6px">TODAY 3</div>
          <div class="list"><div><span class="num-idx">01</span><span class="grow">가볍게 걷기 30분 (8,000보)</span></div>
          <div><span class="num-idx">02</span><span class="grow">단백질 ${tg.protein}g — 매 끼니 손바닥 1개</span></div>
          <div><span class="num-idx">03</span><span class="grow">물 8컵 · 7시간 이상 수면</span></div></div></div>
        <div style="padding:12px var(--pad) 0"><button class="btn block" data-act="start-free">${F.icon('plus')}오늘 추가로 운동하기</button></div>`;
    }
    const strip = `<div class="weekstrip">${week.map((w) => `<a class="wd ${w.k === k ? 'today' : ''}" href="#plan"><span class="t-label">${F.DAY_EN[w.dow]}</span><span class="dn">${F.parseKey(w.k).getDate()}</span>${UI.stamp(w.status === 'today' ? 'today' : w.status)}</a>`).join('')}</div>
      <div class="row wrap t-xs" style="margin-top:8px;gap:6px"><span class="${ws.done >= ws.freq ? 'pill-ok' : 'tag'}">이번 주 ${ws.done}/${ws.freq}회</span><span class="${ws.weekdayOk ? 'pill-ok' : 'tag'}">주중 ${ws.weekdayDone}/2회</span>${F.E.streakWeeks() ? `<span class="tag line">${F.E.streakWeeks()}주 연속</span>` : ''}</div>`;
    const tg = F.E.targets(k);
    const dd = F.E.dietDay(k);
    const b = F.E.body();
    const lv = F.E.level();
    const mates = (F.Sync.members || []).filter((m) => m.uid !== F.Sync.uid);
    const rows = `<div class="list" style="margin-top:4px">
        <a href="#food"><span class="grow"><b>식단</b> <span class="mute t-small">${F.num(tg.kcal)}kcal · 단백질 ${tg.protein}g · ${dd.size} 분량</span></span>${F.icon('chevR', 'sm')}</a>
        <a href="#body"><span class="grow"><b>체중</b> <span class="mute t-small">${F.num1(b.weight)}kg → 목표 ${F.num1(s.profile.goalWeight)}kg</span></span>${F.icon('chevR', 'sm')}</a>
        <a href="#rec"><span class="grow"><b>레벨</b> <span class="mute t-small">Lv.${lv.lv} ${esc(lv.title)} · ${F.num(lv.xp)} XP</span></span>${F.icon('chevR', 'sm')}</a>
        ${mates.map((m) => `<a href="#rec"><span class="grow"><b>${esc(m.name || '파트너')}</b> <span class="mute t-small">이번 주 ${(m.week || []).length}/${m.freq || 3}회 · Lv.${m.lv || 1}</span></span>${F.icon('chevR', 'sm')}</a>`).join('')}
      </div>`;
    return `<div class="today-head">${head}</div>${body}
      <div class="coachbar"><img src="${F.coachImg('hero')}" alt=""><p><b>${esc(F.coachName())} · ${esc(ph.name)}</b>${esc(UI.coachLine())}</p></div>
      <div class="page" style="padding-top:18px">${strip}<div class="sec" style="margin-top:22px">${rows}</div></div>`;
  };

  /* ======================= PC DASHBOARD ======================= */
  const dash = () => {
    const s = F.S;
    const { k, pl, ses, done, t } = todayInfo();
    const d = new Date();
    const ph = F.E.phase();
    const monday = F.mondayOf(k);
    const week = F.E.week(monday);
    const ws = F.E.weekStats(monday);
    const lv = F.E.level();
    const tg = F.E.targets(k);
    const dd = F.E.dietDay(k);
    const b = F.E.body();
    const p = s.profile;

    /* 1. today */
    let today;
    if (done) {
      today = `<h2 class="t-title" style="font-size:38px">${esc(t ? t.name : '운동')} 완료</h2>
        <p class="mute2" style="margin-top:6px">${ses.exDone || 0}종목 · 유산소 ${ses.cardioMin || 0}분 · ${F.num(ses.kcal || 0)}kcal · 볼륨 ${F.num(ses.volume || 0)}kg · +${ses.xp || 0} XP</p>
        ${logDetail(ses)}`;
    } else if (pl) {
      const cp = F.E.cardioPlan(k, t.id);
      today = `<div class="row between" style="align-items:flex-end"><h2 class="t-title" style="font-size:38px">${esc(t.name)}</h2><span class="t-num-m">${pl.time}</span></div>
        <p class="mute2 t-small" style="margin:4px 0 10px">${esc(t.focus)} · 약 ${F.E.estimateMinutes(t.id)}분 · ${esc(ph.name)}</p>
        <div class="cell-scroll"><table class="tbl"><thead><tr><th>#</th><th>운동</th><th>무게</th><th>횟수</th><th>세트</th><th>휴식</th></tr></thead><tbody>
          ${t.ex.filter((id) => F.EXERCISES[id]).map((id, i) => { const pr = F.E.prescription(id); const ex = pr.ex; return `<tr><td>${F.pad(i + 1)}</td><td class="k"><a class="link" href="${F.exHref(id)}">${esc(ex.name)}</a></td><td>${F.E.isLoaded(ex) ? F.E.loadLabel(ex, pr.w) : '맨몸'}</td><td>${F.E.repsLabel(ex, pr.r)}</td><td>${pr.sets}</td><td>${pr.rest}s</td></tr>`; }).join('')}
          <tr><td>${F.icon('heart', 'sm')}</td><td class="k">${esc(cp.M.short)}</td><td colspan="3">${esc(cp.main)}</td><td>${cp.min}분</td></tr>
        </tbody></table></div>
        <div class="btn-row" style="margin-top:12px;flex:none"><button class="btn primary" data-act="start-session" data-date="${k}">${F.icon('play', 'sm')}운동 시작</button><button class="btn" data-act="open-resched" data-date="${k}">약속 생김</button></div>`;
    } else {
      const nx = F.E.nextPlanned(F.addDays(k, 1));
      const nt = nx ? F.TEMPLATES[F.E.templateFor(nx)] : null;
      today = `<h2 class="t-title" style="font-size:38px">회복하는 날</h2>
        <p class="mute2" style="margin-top:6px">${nx ? `다음 운동 ${F.dateLabel(nx)} ${(F.E.planFor(nx) || {}).time || ''} · ${esc(nt ? nt.name : '')}` : ''}</p>
        <div class="list" style="margin-top:12px"><div><span class="num-idx">01</span>가볍게 걷기 30분 (8,000보)</div><div><span class="num-idx">02</span>단백질 ${tg.protein}g 채우기</div><div><span class="num-idx">03</span>물 8컵 · 7시간 이상 수면</div></div>
        <button class="btn" style="margin-top:12px" data-act="start-free">${F.icon('plus', 'sm')}추가 운동하기</button>`;
    }

    /* 2. week + partner */
    const mates = F.Sync.members || [];
    const partner = mates.length ? mates.map((m) => {
      const me = m.uid === F.Sync.uid;
      const wk = (m.monday === monday ? m.week || [] : []);
      return `<div class="mate"><img src="${F.img.trainer(m.coach || 'm', 'hero')}" alt=""><div><b>${esc(m.name || (me ? '나' : '파트너'))}${me ? ' <span class="mute t-xs">(나)</span>' : ''}</b>
        <div class="dots">${F.weekKeys(monday).map((x) => `<i class="${wk.includes(x) ? 'on' : ''}" title="${F.dateLabel(x)}"></i>`).join('')}</div></div>
        <div style="text-align:right"><div class="t-num">${wk.length}/${m.freq || 3}</div><div class="t-xs mute">Lv.${m.lv || 1} · ${m.streak || 0}주</div></div></div>`;
    }).join('') : `<p class="t-small mute">${F.Sync.mode === 'cloud' ? '여자친구가 같은 링크로 들어오면 서로의 출석이 여기 보여요.' : 'claude.ai 링크로 열면 두 사람의 출석이 함께 보여요.'}</p>`;
    const weekCell = `<div class="weekstrip">${week.map((w) => `<a class="wd ${w.k === k ? 'today' : ''}" href="#plan"><span class="t-label">${F.DAY_EN[w.dow]}</span><span class="dn">${F.parseKey(w.k).getDate()}</span>${UI.stamp(w.status === 'today' ? 'today' : w.status)}</a>`).join('')}</div>
      <div class="row wrap t-xs" style="margin-top:8px;gap:6px"><span class="${ws.done >= ws.freq ? 'pill-ok' : 'tag'}">완료 ${ws.done}/${ws.freq}</span><span class="${ws.weekdayOk ? 'pill-ok' : 'tag'}">주중 ${ws.weekdayDone}/2</span><span class="tag line">${F.E.streakWeeks()}주 연속</span></div>
      <div class="t-label mute" style="margin:16px 0 4px">TOGETHER</div>${partner}`;

    /* 3. level */
    const got = F.BADGES.filter((x) => s.badges[x.id]);
    const levelCell = `<div class="row" style="gap:12px;align-items:flex-end"><div class="t-display">Lv.${lv.lv}</div><div class="t-h2" style="padding-bottom:6px">${esc(lv.title)}</div></div>
      <div class="bar" style="margin-top:12px"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
      <div class="row between t-xs mute" style="margin-top:6px"><span>${F.num(lv.xp)} XP</span><span>다음 레벨까지 ${F.num(lv.need - lv.cur)}</span></div>
      <div class="kpis" style="margin-top:14px"><div><span class="t-label mute">SESSIONS</span><div class="t-num-l">${F.E.doneSessions().length}</div></div><div><span class="t-label mute">CARDIO</span><div class="t-num-l">${F.num(F.E.cardioMinutesTotal())}<span class="unit">분</span></div></div><div><span class="t-label mute">BADGES</span><div class="t-num-l">${got.length}<span class="unit">/${F.BADGES.length}</span></div></div></div>
      <div class="coachbar" style="margin:14px 0 0;padding:12px 0;border-bottom:0"><img src="${F.coachImg('hero')}" alt=""><p><b>${esc(F.coachName())}</b>${esc(UI.coachLine())}</p></div>`;

    /* 4. body trend */
    const ib = F.E.sortedInbody();
    const last = ib[ib.length - 1];
    const bodyCell = `<div class="row" style="gap:18px;align-items:flex-end"><div><span class="t-label mute">WEIGHT</span><div class="t-num-xl">${F.num1(b.weight)}<span class="unit">kg</span></div></div>
        <div><span class="t-label mute">GOAL</span><div class="t-num-l">${F.num1(p.goalWeight)}<span class="unit">kg</span></div></div>
        ${last ? `<div><span class="t-label mute">SMM</span><div class="t-num-l">${last.smm != null ? F.num1(last.smm) : '–'}<span class="unit">kg</span></div></div><div><span class="t-label mute">PBF</span><div class="t-num-l">${last.pbf != null ? F.num1(last.pbf) : '–'}<span class="unit">%</span></div></div>` : ''}</div>
      <div class="chart-wrap" data-chart="weight" style="margin-top:10px;flex:1;min-height:150px"></div>`;

    /* 5. recent log */
    const recent = F.E.doneSessions().slice(-8).reverse();
    const logCell = recent.length ? `<table class="tbl"><thead><tr><th>날짜</th><th>루틴</th><th>종목</th><th>볼륨</th><th>유산소</th><th>XP</th></tr></thead><tbody>
        ${recent.map((x) => `<tr><td>${F.dateLabel(x.date)}</td><td class="k">${esc((F.TEMPLATES[x.templateId] || {}).name || '운동')}</td><td>${x.exDone || 0}</td><td>${F.num(x.volume || 0)}</td><td>${x.cardioMin || 0}분</td><td>+${x.xp || 0}</td></tr>`).join('')}</tbody></table>`
      : `<div class="empty">첫 운동을 기록하면 여기 일지가 쌓여요.</div>`;

    /* 6. nutrition */
    const checks = (F.DIET && F.DIET.checks) || [];
    const foodCell = `<div class="row" style="gap:18px;align-items:flex-end"><div><span class="t-label mute">KCAL</span><div class="t-num-xl">${F.num(tg.kcal)}</div></div><div><span class="t-label mute">PROTEIN</span><div class="t-num-l">${tg.protein}<span class="unit">g</span></div></div><div><span class="t-label mute">SIZE</span><div class="t-num-l">${dd.size}</div></div></div>
      <div class="list" style="margin-top:10px">${dd.slots.map((x) => `<div><span class="t-num mute" style="width:46px">${x.time}</span><span class="grow ellipsis"><b>${esc(x.m.name)}</b> <span class="mute t-xs">${x.por.kcal}kcal · ${x.por.p}g</span></span>${x.ate ? F.icon('check', 'sm') : ''}</div>`).join('')}</div>
      <div class="row wrap" style="gap:4px;margin-top:10px">${checks.map((c) => `<span class="tag ${dd.checks[c.id] ? 'ink' : ''}">${esc(c.label)}</span>`).join('')}</div>`;

    const html = `<div class="page"><div class="dash">
      <section class="cell fit">${UI.cellH(`TODAY · ${F.DAY_EN[d.getDay()]} ${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())}`, `<a href="#plan">플랜</a>`)}${today}</section>
      <section class="cell">${UI.cellH('THIS WEEK', `<a href="#rec">출석 도장</a>`)}${weekCell}</section>
      <section class="cell">${UI.cellH('LEVEL', `<a href="#rec">배지</a>`)}${levelCell}</section>
      <section class="cell">${UI.cellH('BODY', `<a href="#body">인바디</a>`)}${bodyCell}</section>
      <section class="cell">${UI.cellH('RECENT LOG', `<a href="#log">운동 일지</a>`)}${logCell}</section>
      <section class="cell">${UI.cellH('NUTRITION', `<a href="#food">식단</a>`)}${foodCell}</section>
    </div></div>`;
    const after = (root) => {
      const el = F.$('[data-chart="weight"]', root);
      if (!el) return;
      const map = {};
      for (const w of s.weights || []) map[w.d] = w.w;
      for (const r of s.inbody || []) if (r.weight) map[r.date] = r.weight;
      const data = Object.entries(map).map(([x, y]) => ({ x, y })).sort((a, c) => (a.x < c.x ? -1 : 1));
      F.Chart.line(el, { data, unit: 'kg', dec: 1, h: Math.max(140, el.clientHeight - 10), label: '체중', good: 'down', goal: p.goalWeight, goalLabel: '목표' });
    };
    return { html, after };
  };

  /** per-exercise sets of a finished session (dashboard + log) */
  const logDetail = (ses) => {
    if (!ses || !ses.log) return '';
    const rows = Object.entries(ses.log).map(([id, lg]) => {
      const ex = F.EXERCISES[id]; if (!ex) return '';
      const sets = (lg.s || []).map(([w, r]) => (w ? `${F.num1(w)}×${r}` : `${r}`)).join(' · ');
      return `<tr><td class="k">${esc(ex.name)}</td><td>${sets}</td><td class="k">${lg.rt ? esc(F.E.RATING[lg.rt].label) : '–'}</td></tr>`;
    }).join('');
    return `<table class="tbl" style="margin-top:10px"><thead><tr><th>운동</th><th>세트 (kg×회)</th><th>느낌</th></tr></thead><tbody>${rows}</tbody></table>`;
  };
  UI.logDetail = logDetail;

  A['supp-toggle'] = (el) => {
    const k = el.dataset.k || F.today(), id = el.dataset.id;
    const r = (F.S.supp[k] = F.S.supp[k] || {});
    r[id] = !r[id];
    F.save();
    el.classList.toggle('on', !!r[id]);
  };
})(window.F);
