/* Plan: phase, weekly schedule (with rescheduling), routines with load prescriptions, cardio. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let weekOffset = 0;
  let tab = null;

  V.plan = () => {
    const s = F.S, k = F.today();
    const ph = F.E.phase();
    const monday = F.addDays(F.mondayOf(k), weekOffset * 7);
    const week = F.E.week(monday);
    const ws = F.E.weekStats(monday);
    const rot = F.E.rotation();
    const nextK = F.E.nextPlanned(k);
    const nextT = nextK ? F.E.templateFor(nextK) : rot[0];
    if (!tab || !rot.includes(tab)) tab = nextT;
    const pat = F.PATTERNS[s.settings.freq];
    const custom = pat.days.slice().sort().join() !== s.settings.days.slice().sort().join();

    /* phase card */
    const phaseCard = `<div class="card ink">
      <div class="row between"><span class="t-label mute">PHASE ${ph.id} / 3 · ${ph.en}${ph.cycle > 1 ? ' · CYCLE ' + ph.cycle : ''}</span><span class="tag" style="background:#fff;color:#000">${ph.reps[0]}~${ph.reps[1]}회 · ${ph.sets}세트</span></div>
      <h2 class="t-h1" style="color:#fff;margin:10px 0 6px">${esc(ph.name)}</h2>
      <p class="mute" style="font-size:14px">${esc(ph.goal)}</p>
      <div class="phase-steps">${F.PHASES.map((p) => `<div class="${p.id === ph.id ? 'on' : p.id < ph.id ? 'past' : ''}"><b>P${p.id}</b>${esc(p.name)}</div>`).join('')}</div>
      <div class="list" style="margin-top:14px">${ph.focus.map((f, i) => `<div><span class="num-idx">${F.pad(i + 1)}</span><span class="grow">${esc(f)}</span></div>`).join('')}</div>
      ${ph.nextAt ? `<div style="margin-top:14px"><div class="row between t-xs"><span class="mute">다음 단계까지</span><span class="t-num">${ph.done} / ${ph.nextAt}회</span></div><div class="bar" style="margin-top:6px"><i style="width:${Math.round((ph.done / ph.nextAt) * 100)}%"></i></div><p class="t-xs mute" style="margin-top:6px">달력 기준이 아니라 실제 완료한 운동 횟수로 단계가 올라가요. 빠진 날이 있어도 몸이 준비된 만큼만 진행해요.</p></div>` : '<p class="t-xs mute" style="margin-top:12px">12주 과정을 마쳤어요. 강화기를 반복하며 인바디로 재평가해요.</p>'}
    </div>`;

    /* week */
    const rows = week.map((w) => {
      const t = w.tid ? F.TEMPLATES[w.tid] : null;
      const isToday = w.k === k;
      let main = '', act = '';
      if (w.status === 'rest') main = `<span class="mute">휴식</span>`;
      else if (w.status === 'moved' || w.status === 'skipped') main = `<span class="mute">${w.ov && w.ov.to ? `${F.dateLabel(w.ov.to)}로 이동` : '건너뜀'}</span>`;
      else main = `<b style="font-weight:800">${esc(t ? t.name : '')}</b> <span class="t-num mute" style="font-size:13px">${w.time || ''}</span>${w.plan && w.plan.moved ? ' <span class="tag">대체일</span>' : ''}${w.ov && w.ov.tpl && !w.ses ? ' <span class="tag">직접 고름</span>' : ''}`;
      if ((w.status === 'planned' || w.status === 'today') && w.k >= k) act = `<button class="btn sm ghost" data-act="open-daytpl" data-date="${w.k}" aria-label="이 날 루틴 바꾸기">${F.icon('swap', 'sm')}</button><button class="btn sm ghost" data-act="open-resched" data-date="${w.k}">약속 생김</button>`;
      if (w.status === 'today') act = `<button class="btn sm primary" data-act="start-session" data-date="${w.k}">${F.icon('play', 'sm')}시작</button>` + act;
      if ((w.status === 'moved' || w.status === 'skipped' || (w.plan && w.plan.moved)) && w.k >= k && !w.ses) act += `<button class="btn sm ghost" data-act="undo-ov" data-date="${w.k}" aria-label="되돌리기">${F.icon('refresh', 'sm')}</button>`;
      if (w.status === 'done' || w.status === 'partial') act = `<span class="tag" style="background:#fff;color:#000">+${(w.ses && w.ses.xp) || 0} XP</span>`;
      if (w.status === 'missed') act = `<span class="pill-no">놓침</span>`;
      return `<div class="${isToday ? 'today-row' : ''}" style="${isToday ? 'background:var(--surface-2);margin:0 -10px;padding-left:10px;padding-right:10px;border-left:3px solid var(--hot)' : ''}">
        <div style="width:58px;flex:none"><div class="t-label ${isToday ? 'acc' : 'mute'}">${F.DAY_EN[w.dow]}</div><div class="t-num" style="font-size:17px">${F.dateLabel(w.k, false)}</div></div>
        ${UI.stamp(w.status === 'today' ? 'today' : w.status)}
        <div class="grow" style="min-width:0">${main}</div>
        <div class="row" style="gap:6px;flex:none">${act}</div></div>`;
    }).join('');

    const weekHtml = `<div class="row between" style="margin-bottom:8px">
        <button class="icon-btn" data-act="week-nav" data-d="-1" aria-label="이전 주">${F.icon('chevL')}</button>
        <div style="text-align:center"><div class="t-label mute">${weekOffset === 0 ? 'THIS WEEK' : weekOffset > 0 ? `+${weekOffset} WEEK` : `${weekOffset} WEEK`}</div><div class="t-num-m">${F.dateLabel(monday, false)} – ${F.dateLabel(F.addDays(monday, 6), false)}</div></div>
        <button class="icon-btn" data-act="week-nav" data-d="1" aria-label="다음 주">${F.icon('chevR')}</button></div>
      <div class="list">${rows}</div>
      <div class="row wrap" style="margin-top:12px;gap:6px">
        <span class="${ws.done >= ws.freq ? 'pill-ok' : 'tag'}">완료 ${ws.done}/${ws.freq}</span>
        <span class="${ws.weekdayOk ? 'pill-ok' : 'tag'}">주중 ${ws.weekdayDone}/2</span>
        <span class="tag">예정 ${ws.planned}일</span>
      </div>
      <details class="acc" style="margin-top:14px"><summary>왜 이 요일인가요? ${F.icon('chevD', 'sm')}</summary><div>
        ${pat.reasons.map((r, i) => `<div class="reason"><b>0${i + 1}</b><span>${esc(r)}</span></div>`).join('')}
        ${custom ? `<div class="callout" style="margin-top:10px">${F.icon('info')}<div><b>요일을 직접 바꿨어요</b>추천 패턴(${esc(pat.title)})과 달라요. ${s.settings.freq <= 3 ? '전신 운동은 연속일이 생기지 않게 배치하는 게 좋아요.' : ''}</div></div>` : ''}
        <a class="btn sm" href="#set" style="margin-top:12px">요일 · 시간 바꾸기</a></div></details>`;

    /* split (분할) */
    const spId = F.E.splitId();
    const SPI = (F.SPLITS_INFO || {})[spId] || { name: spId, level: '', freq: '' };
    const rec = F.E.recommendSplit();
    const splitCard = `<div class="card" style="margin-bottom:14px">
        <div class="row between"><span class="t-label mute">SPLIT · 분할 방식</span><a class="t-xs link" href="#split">분할 가이드 · 바꾸기 ›</a></div>
        <div class="row" style="gap:10px;align-items:baseline;margin-top:6px;flex-wrap:wrap"><h3 class="t-h2">${esc(SPI.name)}</h3><span class="tag">${esc(SPI.level || '')}</span>${s.settings.split === 'auto' ? '<span class="tag line">자동 추천</span>' : ''}</div>
        <div class="split-cycle">${rot.map((id) => `<span class="${id === nextT ? 'on' : ''}">${esc(F.TEMPLATES[id].name)}</span>`).join('<i>→</i>')}<i>↺</i></div>
        <p class="t-xs mute" style="margin-top:8px">${esc(rec.id === spId ? rec.why : `추천은 ${((F.SPLITS_INFO || {})[rec.id] || {}).name || rec.id}이에요. ${rec.why}`)}</p>
      </div>`;
    const ups = F.E.levelUps();
    const upCard = ups.length ? `<div class="card ink" style="margin-bottom:14px">
        <div class="row between"><span class="t-label mute">LEVEL UP · 다음 단계 운동</span><span class="tag" style="background:var(--hot);color:#000">${ups.length}</span></div>
        <p class="t-small mute" style="margin-top:6px">초보 → 중급으로 가는 순서예요. 바꾸면 이 운동이 들어간 모든 루틴에 적용돼요.</p>
        <div class="list" style="margin-top:8px">${ups.map((u) => `<div style="align-items:flex-start"><div class="grow" style="min-width:0"><b style="color:#fff">${esc(F.EXERCISES[u.from].name)} → ${esc(F.EXERCISES[u.to].name)}</b><div class="t-xs mute">${esc(u.why)}</div></div><button class="btn sm white" data-act="do-levelup" data-from="${u.from}" data-to="${u.to}">바꾸기</button></div>`).join('')}</div>
      </div>` : '';

    /* routine tabs */
    const t = F.TEMPLATES[tab];
    const tEx = F.E.templateEx(tab);
    const swapped = Object.keys((s.settings.swaps || {})[tab] || {}).length;
    const routine = `${splitCard}${upCard}<div class="chips" style="margin-bottom:14px">${rot.map((id, i) => `<button class="chip ${id === tab ? 'on' : ''}" data-act="plan-tab" data-id="${id}">${String.fromCharCode(65 + i)} · ${esc(F.TEMPLATES[id].name)}${id === nextT ? ' · 다음' : ''}</button>`).join('')}</div>
      <div class="card">
        <div class="row between"><div><div class="t-label mute">${esc(t.en)}</div><h3 class="t-h2" style="margin-top:4px">${esc(t.name)}</h3><p class="t-small mute2">${esc(t.focus)} · 약 ${F.E.estimateMinutes(tab)}분</p></div></div>
        <div style="margin-top:6px">
          <div class="exrow" style="border-top:1px solid var(--line-soft)"><div class="thumb"><img src="${F.img.ex('warmup')}" alt="" loading="lazy"></div><div class="grow"><b>워밍업</b><div class="t-xs mute">러닝머신/사이클 5분 + 동적 스트레칭 4종</div></div><span class="t-num mute" style="font-size:13px">6분</span></div>
          ${tEx.map((id, i) => {
            const ex = F.EXERCISES[id];
            const p = F.E.prescription(id);
            const g = F.E.groupOf(id);
            return `<div class="exrow"><a class="thumb" href="${F.exHref(id)}"><img src="${F.img.ex(id)}" alt="" loading="lazy"></a>
              <div class="grow" style="min-width:0"><a href="${F.exHref(id)}"><b style="font-weight:800">${F.pad(i + 1)} ${esc(ex.name)}</b></a>
                <div class="rx">${UI.rx(id)}</div>
                <div class="row wrap" style="gap:6px 10px;margin-top:4px"><span class="t-xs mute">휴식 ${p.rest}초 · ${p.calibrated ? '<b>테스트 반영됨</b>' : F.E.isLoaded(ex) ? '추정 시작 무게' : '자세 우선'}</span>
                <button class="t-xs link" data-act="open-test" data-id="${id}">${F.E.isLoaded(ex) ? '무게 테스트' : '횟수 테스트'} ›</button>
                ${g && F.E.swapOptions(id).length > 1 ? `<button class="t-xs link" data-act="open-swap" data-tid="${tab}" data-id="${id}">운동 바꾸기 ›</button>` : ''}</div></div></div>`;
          }).join('')}
          <div class="exrow"><div class="thumb"><img src="${F.img.ex(F.E.cardioPlan(k, tab).machine)}" alt="" loading="lazy"></div><div class="grow"><b>유산소 · ${esc(F.E.cardioPlan(k, tab).M.short)}</b><div class="rx">${esc(F.E.cardioPlan(k, tab).main)} · ${F.E.cardioPlan(k, tab).min}분</div></div></div>
          <div class="exrow"><div class="thumb"><img src="${F.img.ex('cooldown')}" alt="" loading="lazy"></div><div class="grow"><b>쿨다운</b><div class="t-xs mute">정적 스트레칭 4종 · 각 30초</div></div><span class="t-num mute" style="font-size:13px">5분</span></div>
        </div>
        ${swapped ? `<div class="row between" style="margin-top:10px"><span class="t-xs mute">이 루틴에서 ${swapped}개 운동을 바꿨어요</span><button class="t-xs link" data-act="reset-swaps" data-tid="${tab}">기본 루틴으로</button></div>` : ''}
        <div class="callout" style="margin-top:14px">${F.icon('info')}<div><b>무게는 자동으로 조정돼요</b>세트 후 '할만했다 / 조금 어려웠다 / 너무 힘들었다'로 평가하면 다음 세션의 무게·횟수를 다시 계산해요. 처음이라면 '무게 테스트'로 시작 무게를 맞춰보세요.</div></div>
      </div>`;

    /* cardio */
    const cp = F.E.cardioPlan(k, tab);
    const st = F.E.cardioState(cp.machine);
    const cardio = `<div class="chips" style="margin-bottom:12px">${F.CARDIO_ORDER.map((id) => {
        const M = F.CARDIO[id]; const locked = M.minPhase && ph.id < M.minPhase;
        return `<button class="chip ${s.settings.cardio === id ? 'on' : ''}" data-act="cardio-pick" data-id="${id}" ${locked ? 'disabled style="opacity:.45"' : ''}>${locked ? F.icon('lock', 'sm') : ''}${esc(M.short)}</button>`;
      }).join('')}</div>
      <div class="card">
        <div class="grid g-md-2" style="gap:16px">
          ${UI.exMedia(F.EXERCISES[cp.machine] || { id: cp.machine, name: cp.M.name, layout: '1p' })}
          <div>
            <div class="t-label mute">LEVEL ${cp.level} / 12 · ${esc(cp.M.name)}</div>
            <div class="t-num-l" style="margin:8px 0 2px;font-size:26px">${esc(cp.main)}</div>
            <div class="t-num-xl">${cp.min}<span class="unit">분</span></div>
            <div class="grid g2" style="margin-top:14px">
              <div class="kpi"><span class="t-label">HEART RATE</span><div class="t-num-m">${cp.hr.lo}–${cp.hr.hi}<span class="unit">bpm</span></div></div>
              <div class="kpi"><span class="t-label">BURN</span><div class="t-num-m">~${F.num(cp.kcal)}<span class="unit">kcal</span></div></div>
            </div>
          </div>
        </div>
        <div class="list" style="margin-top:14px">${cp.segments.map((sg) => `<div><span class="t-label mute" style="width:64px">${esc(sg.label)}</span><span class="grow">${esc(sg.text)}</span><span class="t-num">${sg.min}분</span></div>`).join('')}</div>
        <div class="callout" style="margin-top:14px">${F.icon('heart')}<div><b>왜 이 설정인가요?</b>체중 ${F.num1(F.E.body().weight)}kg인 지금은 달리기보다 경사 걷기가 무릎 부담은 적고 지방 연소 구간(최대심박의 60~70%, ${cp.hr.lo}–${cp.hr.hi}bpm)을 오래 유지하기 좋아요. 말은 할 수 있지만 노래는 힘든 강도가 정답이에요. 끝나고 평가하면 다음 강도가 자동으로 조절돼요${cp.capped ? ' (현재 단계 최대치에 도달 — 다음 단계에서 더 올라가요)' : ''}.</div></div>
        ${st.hist.length ? `<p class="t-xs mute" style="margin-top:10px">최근 기록: ${st.hist.slice(-3).map((h) => `${F.dateLabel(h.d, false)} ${h.min}분(${F.E.RATING[h.rating].label})`).join(' · ')}</p>` : ''}
      </div>`;

    return `<div class="page">${UI.ph('PLAN', '운동 플랜', `${esc(F.josa(F.coachName(), '이/가'))} 짠 주 ${s.settings.freq}회 루틴이에요. 기록할수록 무게와 유산소 강도가 내 몸에 맞게 조정돼요. <a class="link" href="#learn">왜 이렇게 운동하나요? ›</a>`)}
      <div class="split w3">
        <section>${phaseCard}<div class="sec">${UI.secH('SCHEDULE', '주간 스케줄', '')}${weekHtml}</div></section>
        <section>${UI.secH('ROUTINE', '루틴 · 무게 처방', '')}${routine}</section>
        <section>${UI.secH('CARDIO', '유산소 세팅값', '')}${cardio}</section>
      </div></div>`;
  };

  A['week-nav'] = (el) => { weekOffset = F.clamp(weekOffset + +el.dataset.d, -26, 8); UI.refresh(); };
  A['plan-tab'] = (el) => { tab = el.dataset.id; UI.refresh(); };
  A['cardio-pick'] = (el) => { F.S.settings.cardio = el.dataset.id; F.save(); UI.refresh(); };
  A['open-daytpl'] = (el) => {
    const k = el.dataset.date;
    const cur = F.E.templateFor(k);
    const ov = F.S.overrides[k];
    const ids = F.E.rotation().concat(F.E.rotation().includes('CC') ? [] : ['CC']);
    F.sheet(`<div class="t-label mute">ROUTINE · ${F.dateLabel(k)}</div>
      <h2 class="t-h1" style="margin:6px 0 6px">이 날 할 루틴</h2>
      <p class="mute2">평소엔 순서대로 돌아가요. 오늘 하체가 무겁다면 상체로 바꾸는 것처럼 직접 고를 수 있어요. 고른 다음 날부터는 그다음 루틴으로 이어져요.</p>
      <div class="stack" style="margin-top:14px">${ids.map((id) => { const T = F.TEMPLATES[id]; return `<button class="opt ${id === cur ? 'best' : ''}" data-act="set-daytpl" data-date="${k}" data-id="${id}"><div class="row between"><b class="t-h3">${esc(T.name)}</b><span class="t-label">${esc(T.en)}</span></div><div class="t-xs mute2" style="margin-top:2px">${esc(T.focus)}</div><div class="t-xs mute" style="margin-top:4px">${F.E.templateEx(id).map((x) => esc(F.EXERCISES[x].name)).join(' · ')}</div></button>`; }).join('')}</div>
      ${ov && ov.tpl ? `<button class="btn block ghost" style="margin-top:10px" data-act="set-daytpl" data-date="${k}" data-id="">자동 순서로 되돌리기</button>` : ''}`);
  };
  A['set-daytpl'] = (el) => { F.E.setDayTemplate(el.dataset.date, el.dataset.id || null); F.closeSheet(); F.toast(el.dataset.id ? `${F.dateLabel(el.dataset.date)}은 ${F.TEMPLATES[el.dataset.id].name}로 할게요` : '자동 순서로 되돌렸어요'); UI.refresh(); };
  A['open-swap'] = (el) => {
    const tid = el.dataset.tid, id = el.dataset.id;
    const g = F.E.groupOf(id);
    const orig = (F.TEMPLATES[tid].ex.find((o) => ((F.S.settings.swaps || {})[tid] || {})[o] === id)) || id;
    const LV = ['', '입문', '초급', '중급'];
    const item = (x) => { const ex = F.EXERCISES[x]; return `<button class="opt swap-opt ${x === id ? 'best' : ''}" data-act="do-swap" data-tid="${tid}" data-from="${id}" data-to="${x}"><img src="${F.img.ex(x)}" alt=""><div class="grow" style="min-width:0"><div class="row between"><b class="t-h3">${esc(ex.name)}</b><span class="tag">${LV[ex.level || 1] || ''}</span></div><div class="t-xs mute2">${esc(ex.equipLabel || '')}${x === orig ? ' · 기본 루틴' : ''}${x === id ? ' · 지금' : ''}</div></div></button>`; };
    F.sheet(`<div class="t-label mute">SWAP · ${esc(g ? g.label : '')}</div>
      <h2 class="t-h1" style="margin:6px 0 6px">${esc(F.EXERCISES[id].name)} 바꾸기</h2>
      <p class="mute2">같은 근육을 쓰는 운동끼리만 바꿀 수 있어요. ${g && g.ladder.length ? '위에서 아래로 갈수록 어려워져요 (맨몸·머신 → 덤벨 → 바벨).' : ''}</p>
      ${g && g.ladder.length ? `<div class="t-label" style="margin-top:14px">단계별</div><div class="stack" style="margin-top:6px">${g.ladder.filter((x) => F.EXERCISES[x]).map(item).join('')}</div>` : ''}
      ${g && g.side.length ? `<div class="t-label" style="margin-top:14px">${g.ladder.length ? '같은 근육, 다른 기구' : '같은 그룹'}</div><div class="stack" style="margin-top:6px">${g.side.filter((x) => F.EXERCISES[x]).map(item).join('')}</div>` : ''}
      <label class="row" style="gap:8px;margin-top:14px"><input type="checkbox" id="swap-all"> <span class="t-small">이 운동이 들어간 모든 루틴에 적용</span></label>`);
  };
  A['do-swap'] = (el) => {
    const all = !!(F.$('#swap-all') || {}).checked;
    F.E.swapEx(el.dataset.tid, el.dataset.from, el.dataset.to, all);
    F.closeSheet(); F.toast(`${F.EXERCISES[el.dataset.to].name}로 바꿨어요`); UI.refresh();
  };
  A['do-levelup'] = (el) => { F.E.swapEx(null, el.dataset.from, el.dataset.to, true); F.E.addXP(`lvup:${el.dataset.to}`, 30, `${F.EXERCISES[el.dataset.to].name}로 레벨업`); F.toast(`레벨업! 이제 ${F.EXERCISES[el.dataset.to].name}로 해요`); UI.refresh(); };
  A['reset-swaps'] = (el) => { F.E.resetSwaps(el.dataset.tid); F.toast('기본 루틴으로 되돌렸어요'); UI.refresh(); };
  A['undo-ov'] = (el) => { F.E.undoOverride(el.dataset.date); F.toast('원래 일정으로 되돌렸어요'); UI.refresh(); };

  /* ---------- Reschedule sheet ---------- */
  A['open-resched'] = (el) => {
    const k = el.dataset.date;
    const r = F.E.rescheduleOptions(k);
    const t = F.TEMPLATES[r.tid];
    const opts = r.options.map((o, i) => `<button class="opt ${i === 0 ? 'best' : ''}" data-act="do-resched" data-from="${k}" data-to="${o.date}">
        <div class="row between"><span class="t-h3">${F.dateLabel(o.date)} · ${F.S.settings.gymTime}</span>${i === 0 ? '<span class="tag dark">추천</span>' : ''}</div>
        <ul class="why">${o.why.map((w) => `<li>${esc(w)}</li>`).join('')}${o.warn.map((w) => `<li class="w">${esc(w)}</li>`).join('')}</ul></button>`).join('');
    F.sheet(`<div class="t-label mute">RESCHEDULE</div>
      <h2 class="t-h1" style="margin:6px 0 6px">약속이 생겼나요?</h2>
      <p class="mute2">${F.dateLabel(k)} <b>${esc(t ? t.name : '')}</b> 대신 갈 수 있는 날을 회복 시간과 '주중 2회' 원칙에 맞춰 골랐어요.</p>
      <div style="margin-top:16px">${opts || `<div class="empty">이번 주에는 옮길 수 있는 날이 없어요.<br>건너뛰어도 루틴 순서는 그대로 이어져요 — 다음 운동이 오늘 루틴(${esc(t ? t.name : '')})이 돼요.</div>`}</div>
      <div class="divider"></div>
      <button class="btn block ghost" data-act="do-resched" data-from="${k}" data-to="">이번엔 그냥 건너뛰기</button>
      <p class="t-xs mute" style="margin-top:8px">건너뛰어도 다음 세션은 놓친 루틴부터 이어서 진행돼요. 대신 주간 목표 달성 보너스는 못 받을 수 있어요.</p>`);
  };
  A['do-resched'] = (el) => {
    const from = el.dataset.from, to = el.dataset.to || null;
    F.E.applyReschedule(from, to, '약속');
    F.closeSheet();
    F.toast(to ? `${F.dateLabel(to)}로 옮겼어요. 알람도 같이 옮겨졌어요.` : '이번 운동은 건너뛸게요. 다음에 이어서 해요.');
    F.render();
  };

  /* ---------- Load test (calibration) sheet ---------- */
  const T = { id: null, w: 0, r: 12, rating: null };
  A['open-test'] = (el) => {
    const id = el.dataset.id;
    const ex = F.EXERCISES[id];
    const p = F.E.prescription(id);
    T.id = id; T.w = p.w || 0; T.r = ex.unit === 'sec' ? p.r : Math.max(p.r, ex.unit === 'bw' ? p.r : 12); T.rating = null;
    renderTest();
  };
  const renderTest = (result) => {
    const ex = F.EXERCISES[T.id];
    const loaded = F.E.isLoaded(ex);
    const unitTxt = ex.unit === 'sec' ? '초' : '회';
    const html = `<div class="t-label mute">${loaded ? 'LOAD TEST' : 'REP TEST'}</div>
      <h2 class="t-h1" style="margin:6px 0 6px">${esc(ex.name)} ${loaded ? '무게 찾기' : '횟수 찾기'}</h2>
      <p class="mute2">${loaded ? '자세가 무너지지 않는 무게로 한 세트 해보세요. 몇 kg으로 몇 회 했는지, 느낌이 어땠는지 알려주면 지금 단계에 맞는 무게·횟수·세트를 다시 짜드려요.' : '좋은 자세로 할 수 있는 만큼 해보고, 기록과 느낌을 알려주세요.'}</p>
      ${UI.exMedia(ex)}
      <div class="grid ${loaded ? 'g2' : ''}" style="margin-top:16px">
        ${loaded ? `<div class="field" style="margin:0"><span>무게 ${ex.unit === 'kg_each' ? '(한 손)' : ''}</span><div class="stepper"><button data-act="t-step" data-k="w" data-d="-1" aria-label="무게 감소">${F.icon('minus')}</button><div class="v"><span id="t-w">${F.num1(T.w)}</span><small>kg</small></div><button data-act="t-step" data-k="w" data-d="1" aria-label="무게 증가">${F.icon('plus')}</button></div></div>` : ''}
        <div class="field" style="margin:0"><span>${ex.unit === 'sec' ? '버틴 시간' : '반복 횟수'}</span><div class="stepper"><button data-act="t-step" data-k="r" data-d="-1" aria-label="감소">${F.icon('minus')}</button><div class="v"><span id="t-r">${T.r}</span><small>${unitTxt}</small></div><button data-act="t-step" data-k="r" data-d="1" aria-label="증가">${F.icon('plus')}</button></div></div>
      </div>
      <div class="field" style="margin-top:16px"><span>느낌은 어땠나요?</span>
        <div class="stack">${Object.entries(F.E.RATING).map(([key, r]) => `<button class="opt ${T.rating === key ? 'best' : ''}" data-act="t-rate" data-v="${key}" style="${T.rating === key ? 'background:var(--ink);color:var(--bg)' : ''}"><div class="row between"><b class="t-h3">${esc(r.label)}</b><span class="t-label">${r.en}</span></div><div class="t-xs" style="opacity:.75;margin-top:2px">${esc(r.desc)}</div></button>`).join('')}</div></div>
      ${result ? `<div class="card ink" style="margin-top:16px"><div class="t-label mute">NEW PRESCRIPTION</div>
          <div class="t-num-xl" style="color:#fff;margin:8px 0">${loaded ? F.E.loadLabel(ex, result.w) + ' × ' : ''}${F.E.repsLabel(ex, result.r)} × ${result.sets}세트</div>
          <div class="list">${result.explain.map((x, i) => `<div><span class="num-idx">${F.pad(i + 1)}</span><span class="grow t-small">${esc(x)}</span></div>`).join('')}</div></div>
          <button class="btn primary lg block" style="margin-top:12px" data-act="sheet-close">확인 — 이 무게로 진행할게요</button>`
        : `<button class="btn primary lg block" style="margin-top:16px" data-act="t-calc" ${T.rating ? '' : 'disabled'}>루틴 다시 짜기</button>`}`;
    const open = F.$('.sheet-wrap.on .sheet-body');
    if (open && open.dataset.test === '1') { open.innerHTML = html; return; }
    const w = F.sheet(html);
    F.$('.sheet-body', w).dataset.test = '1';
  };
  A['t-step'] = (el) => {
    const ex = F.EXERCISES[T.id];
    const d = +el.dataset.d;
    if (el.dataset.k === 'w') T.w = Math.max(0, F.E.stepLoad(ex, T.w || (ex.equip === 'barbell' ? 20 : 0), d));
    else T.r = Math.max(1, T.r + d * (ex.unit === 'sec' ? 5 : 1));
    const wEl = F.$('#t-w'), rEl = F.$('#t-r');
    if (wEl) wEl.textContent = F.num1(T.w);
    if (rEl) rEl.textContent = T.r;
  };
  A['t-rate'] = (el) => { T.rating = el.dataset.v; renderTest(); };
  A['t-calc'] = () => {
    const ex = F.EXERCISES[T.id];
    const res = F.E.calibrate(T.id, F.E.isLoaded(ex) ? T.w : null, T.r, T.rating);
    F.E.addXP(`test:${T.id}:${F.today()}`, 10, `${ex.name} 무게 테스트`);
    F.E.checkBadges();
    renderTest(res);
    if (['plan', 'ex', 'home'].includes(F.route().name)) setTimeout(() => UI.refresh(), 0);
  };
})(window.F);
