/* Home: trainer hero, today's session, week strip, nutrition & body snapshot, XP. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;

  V.home = () => {
    const s = F.S, k = F.today();
    const d = new Date();
    const pl = F.E.planFor(k);
    const ses = s.sessions[k];
    const ph = F.E.phase();
    const monday = F.mondayOf(k);
    const week = F.E.week(monday);
    const ws = F.E.weekStats(monday);
    const tg = F.E.targets(k);
    const b = F.E.body();
    const lv = F.E.level();
    const mp = F.E.mealPlan(k);
    const streak = F.E.streakWeeks();

    /* --- hero --- */
    const hero = `<section class="hero">
      <div class="h-date">
        <div class="t-mega">${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())}</div>
        <div class="t-label">${F.DAY_EN[d.getDay()]} · WEEK ${F.pad(F.E.programWeek(k))} · ${ph.en}</div>
      </div>
      <div class="bubble"><b>${esc(F.coachName())}</b>${esc(UI.coachLine())}</div>
      <img class="coach-img" src="${F.coachImg('hero')}" alt="${esc(F.coachName())}">
    </section>`;

    /* --- today --- */
    let today;
    if (ses && (ses.status === 'done' || ses.status === 'partial')) {
      const t = F.TEMPLATES[ses.templateId];
      today = `<div class="card ink">
        <div class="row between"><span class="t-label mute">TODAY · COMPLETE</span><span class="tag acc">+${ses.xp || 0} XP</span></div>
        <div class="row" style="margin-top:14px;gap:16px">
          <div class="done-stamp" style="width:84px;height:84px;margin:0;font-size:13px;border-width:4px;animation:none">DONE<br>${F.pad(d.getMonth() + 1)}.${F.pad(d.getDate())}</div>
          <div><h2 class="t-h1" style="color:#fff">${esc(t ? t.name : '운동')} 완료</h2>
          <p class="mute">${ses.exDone || 0}종목 · 유산소 ${ses.cardioMin || 0}분 · ${F.num(ses.kcal || 0)}kcal</p></div>
        </div>
        <div class="btn-row" style="margin-top:16px"><a class="btn light" href="#/rec">출석 도장 보기</a><a class="btn light" href="#/food">회복 식단</a></div>
      </div>`;
    } else if (pl) {
      const tid = F.E.templateFor(k);
      const t = F.TEMPLATES[tid];
      const cp = F.E.cardioPlan(k, tid);
      const mins = F.E.estimateMinutes(tid);
      today = `<div class="card ink">
        <div class="row between"><span class="t-label mute">TODAY'S SESSION${pl.moved ? ' · 대체일' : ''}</span><span class="tag acc">${esc(ph.name)}</span></div>
        <h2 class="t-display" style="margin:12px 0 2px;color:#fff;font-family:var(--font);font-weight:800;letter-spacing:-0.04em">${esc(t.name)}</h2>
        <p class="mute">${esc(t.focus)}</p>
        <div class="row" style="gap:18px;margin-top:14px">
          <div class="kpi"><span class="t-label">START</span><div class="t-num-l" style="color:#fff">${pl.time}</div></div>
          <div class="kpi"><span class="t-label">TIME</span><div class="t-num-l" style="color:#fff">${mins}<span class="unit">분</span></div></div>
          <div class="kpi"><span class="t-label">BURN</span><div class="t-num-l" style="color:#fff">~${F.num(cp.kcal + 180)}<span class="unit">kcal</span></div></div>
        </div>
        <div class="list" style="margin-top:16px">
          ${t.ex.filter((id) => F.EXERCISES[id]).map((id, i) => {
            const ex = F.EXERCISES[id];
            const rx = UI.rx(id, { parts: true });
            return `<a href="#/ex/${id}"><span class="num-idx">${F.pad(i + 1)}</span><span class="grow ellipsis" style="font-weight:750">${esc(ex.name)}</span><span class="t-num" style="font-size:14px;white-space:nowrap">${rx.load} · ${rx.reps} · ${rx.sets}</span></a>`;
          }).join('')}
          <div><span class="num-idx">${F.icon('heart', 'sm')}</span><span class="grow ellipsis" style="font-weight:750">${esc(cp.M.short)}</span><span class="t-num" style="font-size:14px;white-space:nowrap">${esc(cp.main)} · ${cp.min}분</span></div>
        </div>
        <button class="btn primary lg block" style="margin-top:16px" data-act="start-session" data-date="${k}">${F.icon('play')}운동 시작</button>
        <div class="btn-row" style="margin-top:8px"><button class="btn light" data-act="open-resched" data-date="${k}">${F.icon('swap')}약속 생겼어요</button><a class="btn light" href="#/plan">플랜 전체</a></div>
      </div>`;
    } else {
      const nx = F.E.nextPlanned(F.addDays(k, 1));
      const nt = nx ? F.TEMPLATES[F.E.templateFor(nx)] : null;
      today = `<div class="card ink">
        <div class="row between"><span class="t-label mute">TODAY · RECOVERY</span><span class="tag acc">휴식일</span></div>
        <h2 class="t-h1" style="margin:12px 0 4px;color:#fff">오늘은 회복일이에요</h2>
        <p class="mute">근육은 쉬는 날 자라요. 대신 이 세 가지는 지켜요.</p>
        <div class="list" style="margin-top:12px">
          <div><span class="num-idx">01</span><span class="grow">가볍게 걷기 30분 또는 8,000보</span>${F.icon('walk', 'sm')}</div>
          <div><span class="num-idx">02</span><span class="grow">단백질 ${tg.protein}g 채우기</span>${F.icon('bowl', 'sm')}</div>
          <div><span class="num-idx">03</span><span class="grow">물 ${tg.water}L · 7시간 이상 수면</span>${F.icon('water', 'sm')}</div>
        </div>
        ${nx ? `<div class="divider"></div><div class="row between"><div><span class="t-label mute">NEXT</span><div class="t-h3" style="color:#fff;margin-top:4px">${F.dateLabel(nx)} · ${esc(nt ? nt.name : '')} · ${(F.E.planFor(nx) || {}).time || ''}</div></div><a class="btn light sm" href="#/plan">플랜</a></div>` : ''}
        <button class="btn light block" style="margin-top:14px" data-act="start-free">${F.icon('plus')}오늘 추가로 운동하기</button>
      </div>`;
    }

    /* --- week strip --- */
    const strip = `<div class="weekstrip">${week.map((w) => `<a class="wd ${w.k === k ? 'today' : ''}" href="#/plan" aria-label="${F.dateLabel(w.k)} ${UI.statusText[w.status]}">
        <span class="t-label">${F.DAY_EN[w.dow]}</span><span class="dn">${F.parseKey(w.k).getDate()}</span>${UI.stamp(w.status === 'today' ? 'today' : w.status)}</a>`).join('')}</div>
      <div class="row wrap" style="margin-top:10px;gap:6px">
        <span class="${ws.done >= ws.freq ? 'pill-ok' : 'tag'}">이번 주 ${ws.done}/${ws.freq}회</span>
        <span class="${ws.weekdayOk ? 'pill-ok' : 'tag'}">주중 ${ws.weekdayDone}/2회 ${ws.weekdayOk ? '달성' : ''}</span>
        ${streak ? `<span class="tag dark">${streak}주 연속 달성</span>` : ''}
      </div>`;

    /* --- nutrition snapshot --- */
    const eatenPct = Math.min(100, Math.round((mp.eaten.kcal / tg.kcal) * 100));
    const protPct = Math.min(100, Math.round((mp.eaten.p / tg.protein) * 100));
    const food = `<a class="card" href="#/food" style="display:block">
        <div class="row between"><span class="t-label mute">TODAY · ${tg.gym ? 'TRAINING DAY' : 'REST DAY'}</span>${F.icon('chevR', 'sm')}</div>
        <div class="grid g2" style="margin-top:12px">
          <div class="kpi"><div class="t-num-xl">${F.num(tg.kcal)}<span class="unit">kcal</span></div><div class="sub">섭취 ${F.num(mp.eaten.kcal)} · ${eatenPct}%</div><div class="bar thin" style="margin-top:8px"><i style="width:${eatenPct}%"></i></div></div>
          <div class="kpi"><div class="t-num-xl">${tg.protein}<span class="unit">g 단백질</span></div><div class="sub">섭취 ${F.num(mp.eaten.p)}g · ${protPct}%</div><div class="bar thin ink" style="margin-top:8px"><i style="width:${protPct}%"></i></div></div>
        </div>
        <div class="divider"></div>
        <div class="row wrap" style="gap:6px">${mp.slots.map((sl) => `<span class="tag ${mp.rec.done && mp.rec.done[sl.slot] ? 'dark' : ''}">${sl.time} ${F.E.SLOT_LABEL[sl.slot]}</span>`).join('')}</div>
      </a>`;

    /* --- body snapshot --- */
    const p = s.profile;
    const lost = p.weight - b.weight;
    const totalToLose = Math.max(0.1, p.weight - p.goalWeight);
    const prog = F.clamp(lost / totalToLose, 0, 1);
    const ib = F.E.sortedInbody();
    const lastIb = ib[ib.length - 1];
    const due = !lastIb || F.diffDays(lastIb.date, k) >= 28;
    const body = `<a class="card" href="#/body" style="display:block">
        <div class="row between"><span class="t-label mute">BODY · ${esc(b.wSrc)} ${F.dateLabel(b.wDate, false)}</span>${F.icon('chevR', 'sm')}</div>
        <div class="row between" style="margin-top:12px;align-items:flex-end">
          <div><div class="t-num-xl">${F.num1(b.weight)}<span class="unit">kg</span></div>
          <div class="delta ${lost > 0 ? 'good' : lost < 0 ? 'bad' : ''}" style="margin-top:6px">시작 대비 ${F.signed(-lost)}kg</div></div>
          <div style="text-align:right"><span class="t-label mute">GOAL</span><div class="t-num-l">${F.num1(p.goalWeight)}<span class="unit">kg</span></div></div>
        </div>
        <div class="bar" style="margin-top:12px"><i style="width:${Math.round(prog * 100)}%"></i></div>
        <div class="row between t-xs mute" style="margin-top:6px"><span>${Math.round(prog * 100)}% 달성</span><span>남은 ${F.num1(Math.max(0, b.weight - p.goalWeight))}kg</span></div>
        ${due ? `<div class="callout" style="margin-top:14px">${F.icon('camera')}<div><b>${lastIb ? '인바디 측정할 때예요' : '첫 인바디를 등록해 주세요'}</b>${lastIb ? `마지막 측정 ${F.diffDays(lastIb.date, k)}일 전 · 월 1회 같은 조건으로 측정해요.` : '결과지 사진만 올리면 핵심 수치를 자동으로 읽어와요.'}</div></div>` : ''}
      </a>`;

    /* --- level --- */
    const level = `<a class="card line" href="#/rec" style="display:block">
        <div class="row between"><span class="t-label mute">LEVEL · ATTENDANCE</span>${F.icon('chevR', 'sm')}</div>
        <div class="row" style="gap:14px;margin-top:10px;align-items:flex-end">
          <div class="t-num-xl">Lv.${lv.lv}</div><div class="t-h3" style="padding-bottom:4px">${esc(lv.title)}</div>
        </div>
        <div class="bar" style="margin-top:12px"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
        <div class="row between t-xs mute" style="margin-top:6px"><span>${F.num(lv.xp)} XP</span><span>다음 레벨까지 ${F.num(lv.need - lv.cur)} XP</span></div>
      </a>`;

    const supp = (F.SUPPLEMENTS || []).slice().sort((a, b) => a.priority - b.priority).slice(0, 4);
    const sr = s.supp[k] || {};
    const suppHtml = supp.length ? `<div class="card"><div class="row between"><span class="t-label mute">SUPPLEMENTS · TODAY</span><a class="t-xs link" href="#/food">자세히</a></div>
        <div class="list" style="margin-top:8px">${supp.map((x) => `<div><button class="check ${sr[x.id] ? 'on' : ''}" data-act="supp-toggle" data-id="${x.id}" aria-label="${esc(x.name)} 복용 체크">${F.icon('check')}</button><span class="grow"><b style="font-weight:800">${esc(x.name)}</b><span class="t-xs mute" style="display:block">${esc(x.dose)} · ${esc(x.timing)}</span></span></div>`).join('')}</div></div>` : '';

    const html = `${hero}
      <div class="cols" style="margin-top:22px">
        <div>
          <section>${today}</section>
          <section class="sec">${UI.secH('THIS WEEK', '이번 주 출석', '<a href="#/plan">일정 변경 ' + F.icon('chevR', 'sm') + '</a>')}${strip}</section>
        </div>
        <div>
          <section class="sec">${UI.secH('FUEL', '오늘 식단 목표', '')}${food}</section>
          <section class="sec">${UI.secH('BODY', '체중 · 목표', '')}${body}</section>
          <section class="sec">${level}${suppHtml ? '<div style="height:12px"></div>' + suppHtml : ''}</section>
        </div>
      </div>`;
    return html;
  };

  A['supp-toggle'] = (el) => {
    const k = F.today(), id = el.dataset.id;
    const r = (F.S.supp[k] = F.S.supp[k] || {});
    r[id] = !r[id];
    F.save();
    el.classList.toggle('on', !!r[id]);
  };
})(window.F);
