/* Nutrition: daily targets with reasoning, auto-portioned meal plan, water, food guide,
   eating-out tips, supplements (pharmacist view). */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let off = 0;

  const grams = (it) => {
    const fd = F.FOODS[it.food];
    if (it.pieces != null && fd.piece) return `${F.num1(it.pieces)}${fd.piece.label} (${Math.round(it.g)}g)`;
    return `${Math.round(it.g)}g`;
  };

  V.food = () => {
    const s = F.S;
    const k = F.addDays(F.today(), off);
    const mp = F.E.mealPlan(k);
    const tg = mp.tg;
    const rec = s.meals[k] || {};
    const water = rec.water || 0;
    const cups = Math.min(16, Math.ceil(tg.water / 0.25));
    const wk = F.E.expectedWeekly();
    const pK = tg.protein * 4, cK = tg.carb * 4, fK = tg.fat * 9;
    const tot = pK + cK + fK;
    const macro = (lab, g, kc, color) => `<div class="macro"><span>${lab}</span><div class="bar thin" style="background:#2e2e2e"><i style="width:${Math.round((kc / tot) * 100)}%;background:${color}"></i></div><span class="t-num">${g}g · ${Math.round((kc / tot) * 100)}%</span></div>`;

    const target = `<div class="card ink">
      <div class="row between"><span class="t-label mute">TARGET · ${tg.gym ? 'TRAINING DAY' : 'REST DAY'}</span><span class="tag acc">${F.dateLabel(k)}</span></div>
      <div class="t-display" style="color:#fff;margin:12px 0 2px">${F.num(tg.kcal)}<span class="unit" style="font-size:18px">kcal</span></div>
      <p class="mute t-small">유지 칼로리 ${F.num(tg.tdee)}kcal에서 ${Math.round(tg.pct * 100)}% 줄였어요 · 지키면 주 약 ${F.num1(wk)}kg 감량 예상</p>
      <div style="margin-top:14px">
        ${macro('단백질', tg.protein, pK, 'var(--accent)')}
        ${macro('탄수화물', tg.carb, cK, '#F4F4F0')}
        ${macro('지방', tg.fat, fK, '#8E8E86')}
      </div>
      <div class="grid g2" style="margin-top:12px">
        <div class="kpi on-dark"><span class="t-label">FIBER</span><div class="t-num-m">${tg.fiber}<span class="unit">g</span></div></div>
        <div class="kpi on-dark"><span class="t-label">WATER</span><div class="t-num-m">${tg.water}<span class="unit">L</span></div></div>
      </div>
      <details class="acc" style="margin-top:12px;border-color:#2b2b2b"><summary>왜 이 숫자인가요? ${F.icon('chevD', 'sm')}</summary><div>
        ${tg.reasons.map((r, i) => `<div class="reason" style="border-color:#2b2b2b"><b>0${i + 1}</b><span>${esc(r)}</span></div>`).join('')}
      </div></details>
    </div>`;

    const eatK = Math.min(100, Math.round((mp.eaten.kcal / tg.kcal) * 100));
    const eatP = Math.min(100, Math.round((mp.eaten.p / tg.protein) * 100));
    const progress = `<div class="card">
      <div class="row between"><span class="t-label mute">EATEN TODAY</span><span class="t-xs mute">식사 체크 시 자동 합산</span></div>
      <div class="grid g2" style="margin-top:10px">
        <div><div class="t-num-l">${F.num(mp.eaten.kcal)}<span class="unit">/ ${F.num(tg.kcal)}kcal</span></div><div class="bar thin" style="margin-top:8px"><i style="width:${eatK}%"></i></div></div>
        <div><div class="t-num-l">${F.num(mp.eaten.p)}<span class="unit">/ ${tg.protein}g P</span></div><div class="bar thin ink" style="margin-top:8px"><i style="width:${eatP}%"></i></div></div>
      </div></div>`;

    const meals = mp.slots.map((sl) => {
      const done = rec.done && rec.done[sl.slot];
      const m = sl.meal;
      return `<article class="meal ${done ? 'done' : ''}">
        <div class="media"><img src="${F.img.food(m.img || m.id)}" alt="${esc(m.name)}" loading="lazy"></div>
        <div class="mbody">
          <div class="time"><span class="t-num-m">${sl.time}</span><span class="t-label mute">${F.E.SLOT_EN[sl.slot]}</span><span class="t-klabel">${F.E.SLOT_LABEL[sl.slot]}</span></div>
          ${sl.note ? `<div class="t-xs acc" style="font-weight:800;margin-top:2px">${esc(sl.note)}</div>` : ''}
          <h3 class="t-h2" style="margin-top:6px">${esc(m.name)}</h3>
          <div class="tags" style="margin-top:6px">${(m.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${m.eatOut ? '<span class="tag dark">외식 가능</span>' : ''}</div>
          <ul class="items">${sl.items.map((it) => `<li><span>${esc(F.FOODS[it.food].name)}</span><span>${grams(it)}</span></li>`).join('')}</ul>
          <div class="row" style="gap:16px;margin-top:10px">
            <span><span class="t-num-m">${F.num(sl.kcal)}</span><span class="t-xs mute"> kcal</span></span>
            <span><span class="t-num-m">${F.num(sl.p)}</span><span class="t-xs mute"> g 단백질</span></span>
            <span class="t-xs mute">탄 ${F.num(sl.c)} · 지 ${F.num(sl.f)}g</span>
          </div>
          ${m.how ? `<p class="t-small mute2" style="margin-top:10px">${esc(m.how)}</p>` : ''}
          ${m.tip ? `<p class="t-xs" style="margin-top:6px;font-weight:700">${F.icon('info', 'sm')} ${esc(m.tip)}</p>` : ''}
          <div class="btn-row" style="margin-top:12px">
            <button class="btn sm ${done ? 'dark' : ''}" data-act="meal-done" data-k="${k}" data-slot="${sl.slot}">${F.icon('check', 'sm')}${done ? '먹었어요' : '먹었으면 체크'}</button>
            <button class="btn sm ghost" data-act="meal-swap" data-k="${k}" data-slot="${sl.slot}">${F.icon('swap', 'sm')}다른 메뉴</button>
          </div>
        </div></article>`;
    }).join('<div style="height:12px"></div>');

    const preNote = mp.pre ? `<div class="callout" style="margin-bottom:12px">${F.icon('bolt')}<div><b>${mp.pre} 운동 전 간단 간식</b>바나나 1개 또는 그릭요거트 1컵. 운동 1~1.5시간 전 소량의 탄수화물이 힘을 내줘요. (빈속 고강도 운동은 어지러울 수 있어요)</div></div>` : '';

    const waterHtml = `<div class="card"><div class="row between"><span class="t-label mute">WATER · 1컵 250ml</span><span class="t-num">${F.num1(water * 0.25)} / ${tg.water}L</span></div>
      <div class="water" style="margin-top:12px;grid-template-columns:repeat(${Math.min(cups, 12)},1fr)">${Array.from({ length: cups }, (_, i) => `<button class="${i < water ? 'on' : ''}" data-act="water" data-k="${k}" data-n="${i + 1}" aria-label="${i + 1}컵"></button>`).join('')}</div>
      <p class="t-xs mute" style="margin-top:10px">물은 포만감을 높이고 운동 수행 능력을 지켜요. 식사 전 1컵씩 마시는 습관부터.</p></div>`;

    const guide = (F.FOOD_GUIDE || []).map((g) => `<article class="card" style="padding:0">
        <div class="media r43"><img src="${F.img.food(g.img)}" alt="${esc(g.title)}" loading="lazy"></div>
        <div style="padding:14px 16px 16px">
          <h3 class="t-h3">${esc(g.title)}</h3>
          ${g.sub ? `<p class="t-small mute2" style="margin-top:4px">${esc(g.sub)}</p>` : ''}
          <ul class="items">${(g.items || []).map((x) => `<li><span>${esc(x)}</span><span></span></li>`).join('')}</ul>
          ${(g.tips || []).length ? `<div style="margin-top:10px">${g.tips.map((t) => `<p class="t-xs" style="margin-top:4px;font-weight:700">→ ${esc(t)}</p>`).join('')}</div>` : ''}
        </div></article>`).join('');

    const eatingOut = (F.EATING_OUT || []).map((e) => `<details class="acc"><summary>${esc(e.place)} ${F.icon('chevD', 'sm')}</summary><div>
        <div class="grid g-md-2" style="gap:14px">
          <div><div class="t-label" style="color:var(--good);margin-bottom:6px">PICK</div><ul class="items">${e.pick.map((x) => `<li><span>${esc(x)}</span><span>✓</span></li>`).join('')}</ul></div>
          <div><div class="t-label" style="color:var(--bad);margin-bottom:6px">AVOID</div><ul class="items">${e.avoid.map((x) => `<li><span>${esc(x)}</span><span>✕</span></li>`).join('')}</ul></div>
        </div>
        ${e.tip ? `<div class="callout" style="margin-top:10px">${F.icon('info')}<div>${esc(e.tip)}</div></div>` : ''}</div></details>`).join('');

    const rules = (F.DIET_RULES || []).map((r, i) => `<div class="reason"><b>${F.pad(i + 1)}</b><span><b style="font-weight:800;display:block">${esc(r.title)}</b>${esc(r.body)}</span></div>`).join('');

    const sr = s.supp[k] || {};
    const whenLbl = { morning: '아침', meal: '식사와 함께', pre: '운동 전', post: '운동 후', night: '자기 전' };
    const supps = (F.SUPPLEMENTS || []).slice().sort((a, b) => a.priority - b.priority).map((x) => `<div class="supp">
        <div class="media"><img src="${F.img.supp(x.img ? x.img.replace(/^supp_/, '') : x.id)}" alt="" loading="lazy"></div>
        <div style="min-width:0">
          <div class="row between" style="align-items:flex-start">
            <div><span class="pri acc">${x.priority <= 2 ? 'CORE' : x.priority <= 4 ? 'RECOMMENDED' : 'OPTIONAL'} · 근거 ${esc(x.evidence)}</span><h3 class="t-h3">${esc(x.name)}</h3></div>
            <button class="check ${sr[x.id] ? 'on' : ''}" data-act="supp-toggle" data-id="${x.id}" data-k="${k}" aria-label="${esc(x.name)} 복용 체크">${F.icon('check')}</button>
          </div>
          <div class="tags" style="margin-top:6px"><span class="tag dark">${esc(x.dose)}</span>${(x.when || []).map((w) => `<span class="tag">${esc(whenLbl[w] || w)}</span>`).join('')}</div>
          <p class="t-small" style="margin-top:8px">${esc(x.why)}</p>
          <details class="acc" style="margin-top:8px"><summary class="t-small">복용법 · 주의사항 ${F.icon('chevD', 'sm')}</summary><div>
            <p class="t-small"><b>복용법</b> ${esc(x.how)}</p>
            <div class="callout warn" style="margin-top:8px">${F.icon('info')}<div class="t-small">${esc(x.caution)}</div></div></div></details>
        </div></div>`).join('');
    const avoid = (F.SUPP_AVOID || []).map((x) => `<li>${F.icon('x', 'sm')}<span><b style="font-weight:800">${esc(x.name)}</b> — ${esc(x.reason)}</span></li>`).join('');

    return `${UI.ph('NUTRITION', '식단 · 영양', `${esc(F.josa(F.coachName(), '이/가'))} 체중 ${F.num1(tg.body.weight)}kg, 제지방량 ${F.num1(tg.body.ffm)}kg 기준으로 계산했어요. 끼니 양은 목표에 맞게 자동으로 조절돼요.`)}
      <div class="row between" style="margin-bottom:12px">
        <button class="icon-btn" data-act="food-day" data-d="-1" aria-label="이전 날">${F.icon('chevL')}</button>
        <div style="text-align:center"><div class="t-label mute">${off === 0 ? 'TODAY' : off === 1 ? 'TOMORROW' : off === -1 ? 'YESTERDAY' : (off > 0 ? '+' : '') + off + ' DAYS'}</div><div class="t-num-m">${F.dateLabel(k)}</div></div>
        <button class="icon-btn" data-act="food-day" data-d="1" aria-label="다음 날">${F.icon('chevR')}</button>
      </div>
      <div class="cols">
        <div>
          <section>${target}<div style="height:12px"></div>${progress}</section>
          <section class="sec">${UI.secH('MEAL PLAN', '오늘의 식단', '')}${preNote}${meals}</section>
        </div>
        <div>
          <section class="sec">${UI.secH('HYDRATION', '물 마시기', '')}${waterHtml}</section>
          <section class="sec">${UI.secH('SUPPLEMENTS', '영양제 가이드', '')}
            <p class="t-small mute2" style="margin-bottom:6px">약사 관점에서 근거가 확실한 순서로 정리했어요. 체크하면 오늘 복용 기록이 남아요.</p>${supps}
            <div class="card" style="margin-top:14px"><div class="t-label" style="color:var(--bad)">NOT RECOMMENDED</div><h3 class="t-h3" style="margin:4px 0 6px">다이어트 보조제, 이건 비추천</h3><ul class="mistakes">${avoid}</ul></div>
            <p class="t-xs mute" style="margin-top:10px">복용 중인 약이나 질환(신장·간·심혈관), 임신·수유 중이라면 시작 전에 꼭 의사·약사와 상담하세요.</p>
          </section>
        </div>
      </div>
      <section class="sec">${UI.secH('FOOD GUIDE', '뭘 먹으면 좋을까', '')}<div class="grid g-md-2 g-md-4" style="gap:12px">${guide}</div></section>
      <div class="cols" style="margin-top:0">
        <section class="sec">${UI.secH('EATING OUT', '외식 · 회식 가이드', '')}${eatingOut}</section>
        <section class="sec">${UI.secH('RULES', '감량 식사 원칙', '')}${rules}</section>
      </div>`;
  };

  A['food-day'] = (el) => { off = F.clamp(off + +el.dataset.d, -7, 7); UI.refresh(); };
  A['meal-done'] = (el) => {
    const k = el.dataset.k, slot = el.dataset.slot;
    const r = (F.S.meals[k] = F.S.meals[k] || {});
    r.done = r.done || {};
    r.done[slot] = !r.done[slot];
    if (r.done[slot] && k <= F.today()) {
      F.E.addXP(`meal:${k}:${slot}`, 5, `${F.E.SLOT_LABEL[slot]} 식단 체크`, k);
      const mp = F.E.mealPlan(k);
      if (mp.slots.every((s) => r.done[s.slot])) { const got = F.E.addXP(`meals:${k}`, 10, '하루 식단 100% 달성', k); if (got) F.toast('식단 100% 달성! +10 XP'); }
      F.E.checkBadges();
    }
    F.save(); UI.refresh(); UI.updateTop();
  };
  A['meal-swap'] = (el) => {
    const k = el.dataset.k, slot = el.dataset.slot;
    const tg = F.E.targets(k);
    const split = F.E.SPLIT[slot];
    const cur = F.E.pickMeal(k, slot, tg.gym);
    const list = F.E.mealsFor(slot).map((m) => {
      const sm = F.E.scaleMeal(m, tg.kcal * split[0], tg.protein * split[1]);
      return `<button class="opt ${cur && cur.id === m.id ? 'best' : ''}" data-act="meal-pick" data-k="${k}" data-slot="${slot}" data-id="${m.id}" style="display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center">
        <div class="media r43"><img src="${F.img.food(m.img || m.id)}" alt="" loading="lazy"></div>
        <div><div class="row between"><b class="t-h3">${esc(m.name)}</b>${cur && cur.id === m.id ? '<span class="tag dark">현재</span>' : ''}</div>
        <div class="t-xs mute" style="margin-top:2px">${F.num(sm.kcal)}kcal · 단백질 ${F.num(sm.p)}g${m.eatOut ? ' · 외식 가능' : ''}${m.prep ? ` · ${m.prep}분` : ''}</div></div></button>`;
    }).join('');
    F.sheet(`<div class="t-label mute">SWAP · ${F.E.SLOT_EN[slot]}</div><h2 class="t-h2" style="margin:6px 0 4px">${F.E.SLOT_LABEL[slot]} 메뉴 바꾸기</h2>
      <p class="t-small mute2" style="margin-bottom:14px">어떤 메뉴를 골라도 목표 칼로리·단백질에 맞춰 양이 다시 계산돼요.</p>${list}`);
  };
  A['meal-pick'] = (el) => {
    const k = el.dataset.k;
    const r = (F.S.meals[k] = F.S.meals[k] || {});
    r.pick = r.pick || {};
    r.pick[el.dataset.slot] = el.dataset.id;
    F.save(); F.closeSheet(); UI.refresh();
  };
  A.water = (el) => {
    const k = el.dataset.k, n = +el.dataset.n;
    const r = (F.S.meals[k] = F.S.meals[k] || {});
    r.water = r.water === n ? n - 1 : n;
    const tg = F.E.targets(k);
    if (r.water * 0.25 >= tg.water && k <= F.today()) { const got = F.E.addXP(`water:${k}`, 5, '물 목표 달성', k); if (got) F.toast('물 목표 달성! +5 XP'); }
    F.save(); UI.refresh(); UI.updateTop();
  };
  // shared with home (overrides the simple version to support a date key)
  A['supp-toggle'] = (el) => {
    const k = el.dataset.k || F.today(), id = el.dataset.id;
    const r = (F.S.supp[k] = F.S.supp[k] || {});
    r[id] = !r[id];
    F.save();
    el.classList.toggle('on', !!r[id]);
  };
})(window.F);
