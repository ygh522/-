/* Form library: browse by body part, and a full form guide per exercise. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let part = 'all';

  V.lib = () => {
    const ids = (F.EX_ORDER || Object.keys(F.EXERCISES)).filter((id) => F.EXERCISES[id]);
    const list = ids.filter((id) => part === 'all' || (F.EXERCISES[id].parts || [F.EXERCISES[id].part]).includes(part));
    const counts = {};
    for (const id of ids) for (const p of F.EXERCISES[id].parts || [F.EXERCISES[id].part]) counts[p] = (counts[p] || 0) + 1;
    const chips = (F.PARTS || []).filter((p) => p.id === 'all' || counts[p.id]).map((p) => `<button class="chip ${part === p.id ? 'on' : ''}" data-act="lib-part" data-id="${p.id}">${esc(p.label)} <span class="t-num" style="opacity:.6">${p.id === 'all' ? ids.length : counts[p.id]}</span></button>`).join('');
    const cards = list.map((id) => {
      const ex = F.EXERCISES[id];
      return `<a class="excard" href="#/ex/${id}">${UI.exMedia(ex, 'r32', false)}
        <div class="body"><div class="name">${esc(ex.name)}</div><div class="meta">${esc((ex.muscles || []).slice(0, 2).join(' · '))} · ${esc(ex.equipLabel || '')}</div></div></a>`;
    }).join('');
    return `${UI.ph('FORM LIBRARY', '자세 모아보기', '부위별로 정확한 자세만 모았어요. 주황색이 지금 일하는 근육이에요.')}
      <div class="chips" style="margin-bottom:16px">${chips}</div>
      <div class="ex-grid">${cards || '<div class="empty">해당 부위 운동이 없어요</div>'}</div>`;
  };
  A['lib-part'] = (el) => { part = el.dataset.id; UI.refresh(); };

  V.ex = (rest) => {
    const id = rest[0];
    const ex = F.EXERCISES[id];
    if (!ex) return `${UI.ph('FORM', '운동을 찾을 수 없어요', '')}<a class="btn" href="#/lib">목록으로</a>`;
    const isStrength = !['cardio', 'mobility'].includes(ex.part);
    const st = F.S.ex[id];
    let rxCard = '';
    if (isStrength) {
      const p = F.E.prescription(id);
      const hist = (st && st.hist) || [];
      const spark = F.E.isLoaded(ex) ? F.Chart.spark(hist.map((h) => h.w)) : F.Chart.spark(hist.map((h) => h.r));
      rxCard = `<div class="card ink">
        <div class="row between"><span class="t-label mute">MY PRESCRIPTION · ${esc(p.ph.name)}</span>${p.calibrated ? '<span class="tag acc">테스트 반영</span>' : '<span class="tag" style="background:#222;color:#bbb;border-color:#333">추정값</span>'}</div>
        <div class="t-num-xl" style="color:#fff;margin:10px 0 4px">${UI.rx(id)}</div>
        <p class="mute t-small">목표 범위 ${p.range[0]}~${p.range[1]}${ex.unit === 'sec' ? '초' : '회'} · 세트 사이 휴식 ${p.rest}초${ex.tempo ? ` · 템포 ${esc(ex.tempo)} (내리기-멈춤-올리기 초)` : ''}</p>
        ${hist.length ? `<div class="row between" style="margin-top:12px"><span class="t-xs mute">최근 ${hist.length}회 기록 · 마지막 ${F.dateLabel(hist[hist.length - 1].d, false)} (${esc(F.E.RATING[hist[hist.length - 1].rating].label)})</span>${spark}</div>` : ''}
        <button class="btn primary block" style="margin-top:14px" data-act="open-test" data-id="${id}">${F.E.isLoaded(ex) ? '무게 테스트로 다시 맞추기' : '횟수 테스트'}</button>
      </div>`;
    }
    const extra = ex.part === 'cardio' ? `
        ${ex.settingsGuide ? `<section class="sec">${UI.secH('SETTINGS', '머신 세팅법', '')}<p>${esc(ex.settingsGuide)}</p></section>` : ''}
        ${ex.hrGuide ? `<section class="sec">${UI.secH('INTENSITY', '강도 맞추기', '')}<p>${esc(ex.hrGuide)}</p></section>` : ''}
        ${ex.caution ? `<div class="callout warn" style="margin-top:16px">${F.icon('info')}<div>${esc(ex.caution)}</div></div>` : ''}` : '';
    const moves = ex.moves ? `<section class="sec">${UI.secH('SEQUENCE', '동작 4가지', '')}<div class="list">${ex.moves.map((m, i) => `<div style="align-items:flex-start"><span class="grid-lbl" style="position:static;width:24px;height:24px;display:grid;place-items:center;background:var(--ink);color:var(--bg);font-family:var(--num);font-weight:700;flex:none">${i + 1}</span><span class="grow"><b style="font-weight:800">${esc(m.name)}</b> <span class="t-num acc">${esc(m.dur)}</span><span class="t-small mute2" style="display:block">${esc(m.desc)}</span></span></div>`).join('')}</div></section>` : '';
    const alts = (ex.alt || []).filter((a) => F.EXERCISES[a]);
    return `<a class="row t-small" href="#/lib" style="margin-bottom:14px;font-weight:750">${F.icon('arrowL', 'sm')}자세 모아보기</a>
      <div class="cols">
        <div>
          ${UI.exMedia(ex)}
          <div style="margin-top:16px">
            <div class="t-label mute">${esc(ex.en || '')} · LEVEL ${ex.level || 1}</div>
            <h1 class="t-h1" style="margin:6px 0 10px;font-size:34px">${esc(ex.name)}</h1>
            <div class="tags">${(ex.muscles || []).map((m) => `<span class="tag acc">${esc(m)}</span>`).join('')}${(ex.secondary || []).map((m) => `<span class="tag">${esc(m)}</span>`).join('')}<span class="tag dark">${esc(ex.equipLabel || '')}</span></div>
          </div>
          ${isStrength ? `<section class="sec">${UI.secH('CHECKPOINT', '핵심 체크포인트 3', '')}<div class="cues">${(ex.cues || []).map((c, i) => `<div class="cue"><b>${i + 1}</b>${esc(c)}</div>`).join('')}</div></section>` : ''}
          ${moves}
          ${ex.setup && ex.setup.length ? `<section class="sec">${UI.secH('SETUP', '준비 · 세팅', '')}<ol class="steps">${ex.setup.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
          <section class="sec">${UI.secH('HOW TO', '동작 순서', '')}<ol class="steps">${(ex.steps || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>
        </div>
        <div>
          ${rxCard ? `<section class="sec">${rxCard}</section>` : ''}
          ${!isStrength && ex.cues ? `<section class="sec">${UI.secH('CHECKPOINT', '핵심 체크포인트', '')}<div class="cues">${ex.cues.map((c, i) => `<div class="cue"><b>${i + 1}</b>${esc(c)}</div>`).join('')}</div></section>` : ''}
          <section class="sec">${UI.secH('AVOID', '이렇게 하면 안 돼요', '')}<ul class="mistakes">${(ex.mistakes || []).map((x) => `<li>${F.icon('x', 'sm')}<span>${esc(x)}</span></li>`).join('')}</ul></section>
          ${ex.breathing ? `<section class="sec">${UI.secH('BREATH', '호흡', '')}<p class="t-h3" style="font-weight:700">${esc(ex.breathing)}</p></section>` : ''}
          ${ex.tip ? `<div class="callout" style="margin-top:20px">${F.icon('info')}<div><b>${esc(F.coachName())}의 팁</b>${esc(ex.tip)}</div></div>` : ''}
          ${extra}
          ${alts.length ? `<section class="sec">${UI.secH('ALTERNATIVE', '대체 운동', '')}<div class="grid g2">${alts.map((a) => `<a class="excard" href="#/ex/${a}">${UI.exMedia(F.EXERCISES[a], 'r32', false)}<div class="body"><div class="name" style="font-size:14px">${esc(F.EXERCISES[a].name)}</div></div></a>`).join('')}</div></section>` : ''}
        </div>
      </div>`;
  };
})(window.F);
