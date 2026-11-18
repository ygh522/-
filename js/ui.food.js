/* Easy diet — no scale, no cooking skills: pick one of 2–3 easy options per meal
   (편의점 · 5분 · 외식 · 배달 · 집밥 10분), portions in 공기/개/컵/손바닥 sized to the person's
   calorie target (S/M/L), five yes/no habits, water, swaps, eating-out, supplements. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let off = 0;
  const SLOT = { breakfast: ['아침', 'BREAKFAST'], lunch: ['점심', 'LUNCH'], snack: ['간식', 'SNACK'], dinner: ['저녁', 'DINNER'] };
  const SUPP_IC = { whey: 'bolt', creatine: 'flame', omega3: 'drop', vitd: 'sun', magnesium: 'moon', multi: 'pill', fiber: 'bowl' };

  V.food = () => {
    const D = F.DIET;
    if (!D) return `<div class="page"><div class="empty">식단 데이터를 불러오지 못했어요</div></div>`;
    const k = F.addDays(F.today(), off);
    const dd = F.E.dietDay(k);
    const tg = dd.tg;
    const nav = `<div class="row between" style="margin-bottom:10px">
        <button class="icon-btn" data-act="food-day" data-d="-1" aria-label="이전 날">${F.icon('chevL')}</button>
        <div style="text-align:center"><div class="t-label mute">${off === 0 ? 'TODAY' : off === 1 ? 'TOMORROW' : off === -1 ? 'YESTERDAY' : (off > 0 ? '+' : '') + off + ' DAYS'} · ${tg.gym ? '운동하는 날' : '쉬는 날'}</div><div class="t-num-m">${F.dateLabel(k)}</div></div>
        <button class="icon-btn" data-act="food-day" data-d="1" aria-label="다음 날">${F.icon('chevR')}</button></div>`;

    const target = `<div class="card ink">
        <div class="row between"><span class="t-label mute">TODAY'S TARGET</span><span class="tag" style="background:#fff;color:#000">${dd.size} 분량 · ${esc(D.sizes[dd.size])}</span></div>
        <div class="row" style="gap:20px;margin-top:10px;align-items:flex-end"><div><div class="t-display" style="color:#fff">${F.num(tg.kcal)}</div><div class="t-xs mute">kcal</div></div>
          <div><div class="t-num-xl" style="color:#fff">${tg.protein}<span class="unit">g</span></div><div class="t-xs mute">단백질 = 손바닥 약 ${Math.round(tg.protein / 25)}번</div></div></div>
        <p class="t-small mute" style="margin-top:10px">아래 메뉴 중 하나씩만 고르면 분량이 자동으로 맞춰져요. 지키면 주 약 ${F.num1(F.E.expectedWeekly())}kg 감량 페이스예요.</p>
        <details class="acc" style="margin-top:8px;border-color:#2A2A2A"><summary class="t-small">왜 이 숫자인가요? ${F.icon('chevD', 'sm')}</summary><div>${tg.reasons.map((r, i) => `<div class="reason" style="border-color:#2A2A2A"><b>0${i + 1}</b><span class="t-small">${esc(r)}</span></div>`).join('')}</div></details>
      </div>`;

    // rule 1 (the plate rule) gets its picture: half vegetables, a palm of protein, a fist of rice
    const plate = D.meals.meal_plate_rule ? `<img class="rule-img" src="${F.img.food('meal_plate_rule')}" alt="접시 법칙 예시: 채소 2주먹, 단백질 손바닥 1개, 밥 주먹 1개" loading="lazy">` : '';
    const rules = `<div>${D.rules.map((r, i) => `<div class="rule"><span class="n">0${i + 1}</span><div><b class="t-h3">${esc(r.title)}</b><p class="t-small mute2">${esc(r.body)}</p>${i === 0 ? plate : ''}</div></div>`).join('')}</div>`;

    const meals = dd.slots.map((x) => {
      const opts = D.slots[x.slot] || [];
      return `<section class="sec" style="margin-top:22px">
        <div class="row between" style="margin-bottom:8px"><div class="row" style="gap:10px;align-items:baseline"><span class="t-num-m">${x.time}</span><span class="t-h2">${SLOT[x.slot][0]}</span>${x.note ? `<span class="t-xs mute">${esc(x.note)}</span>` : ''}</div>
          <button class="check ${x.ate ? 'on' : ''}" data-act="diet-ate" data-k="${k}" data-slot="${x.slot}" aria-label="${SLOT[x.slot][0]} 먹었어요">${F.icon('check')}</button></div>
        <div class="mealpick ${opts.length === 2 ? 'n2' : ''}">${opts.map((id) => { const m = D.meals[id]; return `<button class="mopt ${id === x.id ? 'on' : ''}" data-act="diet-pick" data-k="${k}" data-slot="${x.slot}" data-id="${id}"><div class="media"><img src="${F.img.food(m.img || id)}" alt="" loading="lazy"></div><div class="mo-b"><b>${esc(m.name)}</b><span class="tag">${esc(m.tag)}</span></div></button>`; }).join('')}</div>
        <div class="meal-detail"><div class="md-b">
          <div class="row between"><b class="t-h3">${esc(x.m.name)}</b><span class="t-num">${x.por.kcal}kcal · ${x.por.p}g</span></div>
          <ul class="items">${x.por.items.map((it) => `<li><span>${esc(it)}</span><span></span></li>`).join('')}</ul>
          <p class="t-small mute2" style="margin-top:8px">${esc(x.m.how || '')}</p>
          ${x.m.tip ? `<p class="t-xs" style="margin-top:6px;font-weight:750">→ ${esc(x.m.tip)}</p>` : ''}
        </div></div></section>`;
    }).join('');

    const checks = `<div class="list">${D.checks.map((c) => `<div><button class="check ${dd.checks[c.id] ? 'on' : ''}" data-act="diet-check" data-k="${k}" data-id="${c.id}" aria-label="${esc(c.label)}">${F.icon('check')}</button><span class="grow"><b>${esc(c.label)}</b><span class="t-xs mute" style="display:block">${esc(c.hint)}</span></span></div>`).join('')}</div>
      <div class="t-label mute" style="margin:14px 0 6px">WATER · ${dd.water}/8컵</div>
      <div class="water">${Array.from({ length: 8 }, (_, i) => `<button class="${i < dd.water ? 'on' : ''}" data-act="water" data-k="${k}" data-n="${i + 1}" aria-label="${i + 1}컵"></button>`).join('')}</div>`;

    const swaps = `<div class="list">${(D.swaps || []).map((x) => `<div><span class="grow"><span class="mute">${esc(x.from)}</span> → <b>${esc(x.to)}</b></span><span class="t-num">${esc(x.save)}</span></div>`).join('')}</div>`;
    const eatout = `${(D.eatout || []).map((e) => `<details class="acc"><summary>${esc(e.place)} ${F.icon('chevD', 'sm')}</summary><div class="t-small"><p><b>고르기</b> ${esc(e.pick)}</p><p style="margin-top:4px"><b>피하기</b> ${esc(e.avoid)}</p></div></details>`).join('')}`;

    const mine = F.S.mySupps || [];
    const mySupp = mine.length && F.E.suppSchedule
      ? `<div class="list">${F.E.suppSchedule(k).map((p) => { const info = F.E.suppInfo(p.id) || {}; const on = !!(F.S.supp[k] || {})[p.id]; return `<div><span class="t-num" style="width:48px">${F.minToTime(p.at)}</span><span class="grow"><b>${esc(info.name || p.id)}</b> <span class="t-xs mute">${esc(((F.SUPP_SLOTS || {})[p.slot] || {}).label || '')}</span></span><button class="check ${on ? 'on' : ''}" data-act="${on ? 'supp-untake' : 'supp-take'}" data-id="${p.id}" data-ids="${p.id}" aria-label="${esc(info.name || '')} 섭취">${F.icon('check')}</button></div>`; }).join('')}</div>`
      : `<a class="tl-add" href="#supp">${F.icon('pill', 'sm')}<span>가지고 있는 영양제를 등록하면 먹을 시간까지 챙겨 드려요</span>${F.icon('chevR', 'sm')}</a>`;
    const left = `${nav}${UI.dietStyle ? `<div class="t-label mute" style="margin:2px 0 6px">식단 스타일 · 끼니마다 고르는 메뉴의 기본값</div>${UI.dietStyle()}` : ''}${target}${meals}`;
    const right = `<section class="sec" style="margin-top:0">${UI.secH('3 RULES', '이것만 지켜요', '')}${rules}</section>
      <section class="sec">${UI.secH('DAILY CHECK', '오늘 체크 5', '')}${checks}</section>
      <section class="sec">${UI.secH('SWAP', '바꿔 먹기', '')}${swaps}</section>
      <section class="sec">${UI.secH('EATING OUT', '외식 · 회식', '')}${eatout}</section>
      <section class="sec">${UI.secH('SUPPLEMENTS', '내 영양제', '<a class="t-xs link" href="#supp">관리 ›</a>')}${mySupp}</section>
      ${UI.products ? UI.products() : ''}`;
    if (UI.isPC()) return `<div class="page">${UI.ph('NUTRITION', '쉬운 식단', '저울도, 요리 실력도 필요 없어요. 끼니마다 하나만 고르세요.')}<div class="split wide-l"><section>${left}</section><section>${right}</section></div></div>`;
    return `<div class="page">${UI.ph('NUTRITION', '쉬운 식단', '저울도, 요리 실력도 필요 없어요. 끼니마다 하나만 고르세요.')}${left}<div class="sec">${right}</div></div>`;
  };

  A['food-day'] = (el) => { off = F.clamp(off + +el.dataset.d, -7, 7); UI.refresh(); };
  const day = (k) => (F.S.meals[k] = F.S.meals[k] || {});
  A['diet-pick'] = (el) => { const r = day(el.dataset.k); r.pick = r.pick || {}; r.pick[el.dataset.slot] = el.dataset.id; F.save(); UI.refresh(); };
  A['diet-ate'] = (el) => {
    const k = el.dataset.k, slot = el.dataset.slot, r = day(k);
    r.ate = r.ate || {}; r.ate[slot] = !r.ate[slot];
    if (r.ate[slot] && k <= F.today()) F.E.addXP(`meal:${k}:${slot}`, 5, `${SLOT[slot][0]} 식단 지킴`, k);
    F.save(); UI.refresh(); UI.updateTop();
  };
  A['diet-check'] = (el) => {
    const k = el.dataset.k, id = el.dataset.id, r = day(k);
    r.checks = r.checks || {}; r.checks[id] = !r.checks[id];
    if (r.checks[id] && k <= F.today()) {
      F.E.addXP(`chk:${k}:${id}`, 3, '식단 습관 체크', k);
      if (F.DIET.checks.every((c) => r.checks[c.id])) { const got = F.E.addXP(`chkall:${k}`, 10, '식단 습관 5개 달성', k); if (got) F.toast('오늘 식단 습관 5개 달성! +10 XP'); }
      F.E.checkBadges();
    }
    F.save(); UI.refresh(); UI.updateTop();
  };
  A.water = (el) => {
    const k = el.dataset.k, n = +el.dataset.n, r = day(k);
    r.water = r.water === n ? n - 1 : n;
    if (r.water >= 8 && k <= F.today()) { const got = F.E.addXP(`water:${k}`, 5, '물 8컵 달성', k); if (got) F.toast('물 8컵 달성! +5 XP'); }
    F.save(); UI.refresh(); UI.updateTop();
  };
})(window.F);
