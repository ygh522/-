/* Exercise guide — every machine, free-weight and bodyweight move with large start/finish images
   (male and female figures), numbered checkpoints that match the image markers, setup, steps,
   mistakes, breathing, prescription and recommended starting weights.
   Mobile: big cards → full detail. PC: master–detail on one 16:9 screen. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let part = 'all';
  let kind = 'all';
  const KIND = { all: '전체', bw: '맨몸', machine: '머신', free: '프리웨이트', cardio: '유산소 · 스트레칭' };
  const kindOf = (ex) => (['bodyweight', 'mat'].includes(ex.equip) && ex.part !== 'mobility' ? 'bw' : ['machine', 'cable'].includes(ex.equip) ? 'machine' : ['barbell', 'dumbbell'].includes(ex.equip) ? 'free' : 'cardio');
  const LV = ['', '입문', '초급', '중급'];

  const ids = () => (F.EX_ORDER || Object.keys(F.EXERCISES)).filter((id) => F.EXERCISES[id]);
  const filtered = () => ids().filter((id) => (part === 'all' || (F.EXERCISES[id].parts || [F.EXERCISES[id].part]).includes(part)) && (kind === 'all' || kindOf(F.EXERCISES[id]) === kind))
    .map((id, i) => [id, i]).sort((a, b) => ((F.EXERCISES[a[0]].level || 1) - (F.EXERCISES[b[0]].level || 1)) || a[1] - b[1]).map((x) => x[0]);
  const EQUIP = { machine: '머신', cable: '케이블', barbell: '바벨', dumbbell: '덤벨', bodyweight: '맨몸', mat: '매트', cardio: '유산소 기구' };

  const chips = () => {
    const counts = {};
    for (const id of ids()) for (const p of F.EXERCISES[id].parts || [F.EXERCISES[id].part]) counts[p] = (counts[p] || 0) + 1;
    return `<div class="chips">${Object.entries(KIND).map(([k, l]) => `<button class="chip ${kind === k ? 'on' : ''}" data-act="lib-kind" data-id="${k}">${esc(l)}</button>`).join('')}</div>
      <div class="chips" style="margin-top:8px">${(F.PARTS || []).filter((p) => p.id === 'all' || counts[p.id]).map((p) => `<button class="chip ${part === p.id ? 'on' : ''}" data-act="lib-part" data-id="${p.id}">${esc(p.label)} <span class="t-num" style="opacity:.55">${p.id === 'all' ? ids().length : counts[p.id]}</span></button>`).join('')}</div>`;
  };
  const card = (id, on) => {
    const ex = F.EXERCISES[id];
    return `<a class="excard ${on ? 'on' : ''}" href="${F.exHref(id)}" style="${on ? 'border-color:var(--line);outline:2px solid var(--ink);outline-offset:-2px' : ''}"><div class="media"><img src="${F.img.ex(id)}" alt="" loading="lazy"></div>
      <div class="body"><div class="name">${esc(ex.name)}</div><div class="meta"><b class="lv lv${ex.level || 1}">${LV[ex.level || 1] || ''}</b> ${esc(EQUIP[ex.equip] || '')} · ${esc((ex.muscles || []).slice(0, 2).join(' · '))}</div></div></a>`;
  };

  V.lib = () => {
    if (UI.isPC()) { const first = filtered()[0]; return V.ex([first], true); }
    return `<div class="page">${UI.ph('EXERCISE GUIDE', '자세 가이드', '초보에서 중급까지 꼭 필요한 기본 운동만 모았어요. 위는 시작, 아래는 끝 자세이고 주황색이 지금 쓰는 근육이에요. 사진 속 번호가 체크 포인트예요.')}
      ${chips()}<div class="ex-grid" style="margin-top:12px">${filtered().map((id) => card(id)).join('')}</div></div>`;
  };
  A['lib-kind'] = (el) => {
    kind = el.dataset.id;
    if (UI.isPC()) { const first = filtered()[0]; if (first) location.hash = F.exHref(first); F.render(); }
    else UI.refresh();
  };
  A['lib-part'] = (el) => {
    part = el.dataset.id;
    if (UI.isPC()) { const first = filtered()[0]; location.hash = F.exHref(first); F.render(); }
    else UI.refresh();
  };

  /** Where this exercise sits on the beginner → intermediate path of its movement. */
  const ladder = (ex) => {
    const g = F.E.groupOf(ex.id);
    if (!g || (!g.ladder.length && g.side.length < 2)) return '';
    const steps = g.ladder.filter((x) => F.EXERCISES[x]);
    const side = g.side.filter((x) => F.EXERCISES[x] && x !== ex.id);
    const chip = (x) => `<a class="ld ${x === ex.id ? 'on' : ''}" href="${F.exHref(x)}"><span class="t-label">${LV[F.EXERCISES[x].level || 1] || ''}</span><b>${esc(F.EXERCISES[x].name)}</b></a>`;
    return `<section class="sec">${UI.secH('PATH', `${esc(g.label)} 단계`, '')}
      ${steps.length ? `<div class="ladder">${steps.map(chip).join('<i>→</i>')}</div><p class="t-xs mute" style="margin-top:6px">맨몸 · 머신 → 덤벨 → 바벨 순서로 배우면 자세가 무너지지 않고 무게를 올릴 수 있어요. 두 번 연속 안정적으로 해내면 플랜에서 다음 단계를 추천해 드려요.</p>` : ''}
      ${side.length ? `<div class="t-xs mute2" style="margin-top:8px">같은 근육, 다른 기구: ${side.map((x) => `<a class="link" href="${F.exHref(x)}">${esc(F.EXERCISES[x].name)}</a>`).join(' · ')}</div>` : ''}</section>`;
  };

  const detail = (ex) => {
    const id = ex.id;
    const isStrength = !['cardio', 'mobility'].includes(ex.part);
    const st = F.S.ex[id];
    const hist = (st && st.hist) || [];
    const marks = ex.mark === 'grid' ? '각 칸의 번호 = 아래 동작 순서' : ex.mark === 'start' ? '번호는 위(START) 사진에 표시돼 있어요' : ex.mark === 'image' ? '번호는 사진에 표시돼 있어요' : '번호는 아래(FINISH) 사진에 표시돼 있어요';
    const rx = isStrength ? `<section class="sec">${UI.secH('MY PRESCRIPTION', '오늘 내 처방', `<button data-act="open-test" data-id="${id}">${F.E.isLoaded(ex) ? '무게 테스트' : '횟수 테스트'}</button>`)}
        ${UI.rxBox(id)}
        <p class="t-xs mute" style="margin-top:8px">목표 ${F.E.prescription(id).range[0]}~${F.E.prescription(id).range[1]}${ex.unit === 'sec' ? '초' : '회'} · ${esc(F.E.phase().name)} 단계${ex.tempo ? ` · 템포 ${esc(ex.tempo)} (내리기-멈춤-올리기 초)` : ''}${F.S.ex[id] && F.S.ex[id].cal ? ' · 무게 테스트 반영' : ' · 추정 시작값'}</p>
        ${ex.start ? `<div style="margin-top:10px">${UI.mfStart(ex)}</div><p class="t-xs mute" style="margin-top:6px">처음 운동하는 성인 기준 첫 세션 추천 무게예요. 12~15회를 좋은 자세로 할 수 있는 무게가 정답 — 무게 테스트로 내 몸에 맞춰요.</p>` : ''}
        ${hist.length ? `<div class="row between" style="margin-top:10px"><span class="t-xs mute">최근 ${hist.length}회 · 마지막 ${F.dateLabel(hist[hist.length - 1].d, false)} (${esc(F.E.RATING[hist[hist.length - 1].rating].label)})</span>${F.Chart.spark(F.E.isLoaded(ex) ? hist.map((h) => h.w) : hist.map((h) => h.r))}</div>` : ''}</section>` : '';
    const cardio = ex.part === 'cardio' ? `${ex.settingsGuide ? `<section class="sec">${UI.secH('SETTINGS', '머신 세팅', '')}<p class="t-small">${esc(ex.settingsGuide)}</p></section>` : ''}${ex.hrGuide ? `<section class="sec">${UI.secH('INTENSITY', '강도', '')}<p class="t-small">${esc(ex.hrGuide)}</p></section>` : ''}${ex.caution ? `<div class="callout hot" style="margin-top:14px">${F.icon('info')}<div class="t-small">${esc(ex.caution)}</div></div>` : ''}` : '';
    const moves = ex.moves ? `<section class="sec">${UI.secH('SEQUENCE', '동작 4가지', '')}<div class="list">${ex.moves.map((m, i) => `<div style="align-items:flex-start"><span class="cue" style="padding:0;background:none;color:inherit"><b style="background:var(--ink);color:var(--inv)">${i + 1}</b></span><span class="grow"><b>${esc(m.name)}</b> <span class="t-num">${esc(m.dur)}</span><span class="t-small mute2" style="display:block">${esc(m.desc)}</span></span></div>`).join('')}</div></section>` : '';
    const alts = (ex.alt || []).filter((a) => F.EXERCISES[a]);
    const textA = `
      <div class="t-label mute">${esc(ex.en || '')} · ${esc(EQUIP[ex.equip] || '')} · LEVEL ${ex.level || 1}</div>
      <h1 class="t-title" style="margin:6px 0 10px">${esc(ex.name)}</h1>
      <div class="tags">${(ex.muscles || []).map((m) => `<span class="tag ink">${esc(m)}</span>`).join('')}${(ex.secondary || []).map((m) => `<span class="tag">${esc(m)}</span>`).join('')}<span class="tag line">${esc(ex.equipLabel || '')}</span></div>
      <section class="sec">${UI.secH('CHECKPOINT', '사진 속 번호 = 핵심 포인트', '')}<div class="cues">${(ex.cues || []).map((c, i) => `<div class="cue"><b>${i + 1}</b>${esc(c)}</div>`).join('')}</div><p class="t-xs mute" style="margin-top:6px">${marks}</p></section>
      ${ladder(ex)}
      ${rx}
      <button class="btn block" data-act="ask-ex" data-id="${id}" style="margin-top:14px">${F.icon('chat', 'sm')}이 운동 ${esc(F.coachName())}에게 질문하기</button>`;
    const textB = `
      ${moves}
      ${ex.setup && ex.setup.length ? `<section class="sec">${UI.secH('SETUP', '기구 세팅 · 준비', '')}<ol class="steps">${ex.setup.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
      <section class="sec">${UI.secH('HOW TO', '동작 순서', '')}<ol class="steps">${(ex.steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <section class="sec">${UI.secH('AVOID', '이렇게 하면 안 돼요', '')}<ul class="mistakes">${(ex.mistakes || []).map((x) => `<li>${F.icon('x', 'sm')}<span>${esc(x)}</span></li>`).join('')}</ul></section>
      ${ex.breathing ? `<section class="sec">${UI.secH('BREATH', '호흡', '')}<p class="t-h3" style="font-weight:700">${esc(ex.breathing)}</p></section>` : ''}
      ${ex.tip ? `<div class="callout" style="margin-top:18px">${F.icon('info')}<div><b>${esc(F.coachName())}의 팁</b>${esc(ex.tip)}</div></div>` : ''}
      ${cardio}
      ${alts.length ? `<section class="sec">${UI.secH('ALTERNATIVE', '대체 운동', '')}<div class="grid g2">${alts.map((a) => card(a)).join('')}</div></section>` : ''}`;
    return { textA, textB };
  };

  V.ex = (rest, fromLib) => {
    const id = rest[0];
    const ex = F.EXERCISES[id];
    if (!ex) return `<div class="page">${UI.ph('GUIDE', '운동을 찾을 수 없어요', '')}<a class="btn" href="#lib">목록으로</a></div>`;
    const { textA, textB } = detail(ex);
    if (UI.isPC()) {
      const list = filtered();
      return `<div class="page" style="padding-top:16px">
        <div class="row between" style="margin-bottom:12px"><h1 class="t-h1">운동 가이드</h1>${chips()}</div>
        <div class="split" style="grid-template-columns:240px minmax(0,1fr) minmax(0,1fr);height:calc(100vh - var(--top-h) - 96px)">
          <section style="overflow:auto;padding:12px">${list.map((x) => `<a class="row" href="${F.exHref(x)}" style="padding:6px;gap:10px;${x === id ? 'background:var(--ink);color:var(--inv)' : ''}"><img src="${F.img.ex(x)}" alt="" style="width:40px;height:52px;object-fit:cover;object-position:top;background:#EDEDED"><span class="t-small" style="font-weight:800">${esc(F.EXERCISES[x].name)}</span></a>`).join('')}</section>
          <section style="overflow:auto;padding:16px;display:flex;align-items:flex-start;justify-content:center;background:var(--surface-2)">${UI.exFig(ex, { switch: true, zoom: true, eager: true, cls: 'pc-fig' })}</section>
          <section style="overflow:auto;padding:20px 22px">${textA}${textB}</section>
        </div></div>`;
    }
    return `<div class="page" style="padding-top:12px"><a class="row t-small" href="#lib" style="margin-bottom:10px;font-weight:800">${F.icon('arrowL', 'sm')}자세 가이드</a></div>
      ${UI.exFig(ex, { switch: true, zoom: true, eager: true })}
      <div class="page" style="padding-top:16px">${textA}${textB}</div>`;
  };
})(window.F);
