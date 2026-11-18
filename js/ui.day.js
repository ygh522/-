/* Today with your trainer (트쌤): the day plan — easy meals, supplements at their best time, the workout —
   plus 내 영양제 (register · schedule · intake · reminders), diet styles, product picks and home-workout videos. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, E = F.E, esc = F.esc;
  const SLOT_KO = { breakfast: '아침', lunch: '점심', snack: '간식', dinner: '저녁' };

  /* =========================================================
     SUPPLEMENTS — catalog, best-time schedule, conflicts
     ========================================================= */
  const WHEN = { night: 'bed', bed: 'bed', post: 'postWorkout', morning: 'breakfast', meal: 'breakfast' };
  const CAT = () => F.SUPP_CATALOG || (F.SUPPLEMENTS || []).map((x) => ({ id: x.id, name: x.name, cat: '기타', slots: [WHEN[(x.when || [])[0]] || 'breakfast'], gymSlot: (x.when || []).includes('post') ? 'postWorkout' : null, why: x.why, timing: x.timing, caution: x.caution, dose: x.dose }));
  const SLOTS = () => F.SUPP_SLOTS || { wake: { label: '기상 직후 · 공복' }, beforeBreakfast: { label: '아침 식사 30분 전' }, breakfast: { label: '아침 식사 직후' }, lunch: { label: '점심 식사 직후' }, dinner: { label: '저녁 식사 직후' }, preWorkout: { label: '운동 30분 전' }, postWorkout: { label: '운동 직후' }, bed: { label: '잠들기 30분 전' } };
  const slotLabel = (k) => (SLOTS()[k] || {}).label || k;
  E.suppInfo = (id) => {
    const c = CAT().find((x) => x.id === id);
    if (c) return c;
    const m = (F.S.mySupps || []).find((x) => x.id === id);
    return m && m.custom ? { id, name: m.custom.name, cat: '직접 추가', slots: [m.custom.slot || 'breakfast'], custom: true, why: '직접 추가한 영양제예요.', timing: '제품 설명서의 복용 시간을 우선으로 지켜요.', caution: '' } : null;
  };
  E.daySettings = () => { const st = F.S.settings; return { wake: F.timeToMin(st.wakeTime || '07:00'), bed: F.timeToMin(st.bedTime || '23:30') }; };
  /** Clock time (minutes) of each supplement slot for date k, following meals, the workout and bedtime. */
  E.slotTimes = (k) => {
    const { t } = E.mealTimes(k);
    const ds = E.daySettings();
    const pl = E.planFor(k);
    const gt = pl ? F.timeToMin(pl.time) : null;
    return {
      wake: ds.wake, beforeBreakfast: t.breakfast - 30, breakfast: t.breakfast, lunch: t.lunch, dinner: t.dinner,
      preWorkout: gt != null ? gt - 30 : null, postWorkout: gt != null ? gt + 80 : null, bed: ds.bed - 30,
    };
  };
  /** Place each supplement the member takes at its best slot, keeping "don't take together" pairs apart. */
  E.suppSchedule = (k) => {
    const T = E.slotTimes(k);
    const gym = !!E.planFor(k);
    const placed = [];
    for (const m of (F.S.mySupps || []).filter((x) => x.on !== false)) {
      const info = E.suppInfo(m.id); if (!info) continue;
      let cands = [];
      if (m.slot) cands.push(m.slot);
      if (gym && info.gymSlot) cands.push(info.gymSlot);
      cands = cands.concat(info.slots || [], ['breakfast', 'lunch', 'dinner']).filter((s2, i, a) => a.indexOf(s2) === i && T[s2] != null);
      let chosen = null;
      for (const sl of cands) {
        const at = T[sl];
        const clash = placed.some((p) => {
          const pi = E.suppInfo(p.id) || {};
          const conflict = (info.avoid || []).includes(p.id) || (pi.avoid || []).includes(m.id);
          const gap = Math.max(info.gapHours || 0, pi.gapHours || 0) * 60;
          return conflict && Math.abs(p.at - at) < Math.max(gap, 1);
        });
        if (!clash) { chosen = { id: m.id, slot: sl, at, moved: sl !== cands[0] }; break; }
      }
      if (!chosen && cands.length) chosen = { id: m.id, slot: cands[0], at: T[cands[0]], clash: true };
      if (chosen) placed.push(chosen);
    }
    return placed.sort((a, b) => a.at - b.at);
  };
  const groupsOf = (list) => {
    const g = {};
    for (const p of list) (g[p.at] = g[p.at] || []).push(p);
    return Object.entries(g).map(([at, ps]) => ({ at: +at, ids: ps.map((p) => p.id), slot: ps[0].slot })).sort((a, b) => a.at - b.at);
  };
  /** What is due now / missed / next for the reminder banner. */
  E.suppDue = (k) => {
    const now = F.nowMin();
    const taken = F.S.supp[k] || {};
    const list = groupsOf(E.suppSchedule(k).filter((p) => !taken[p.id]));
    return { soon: list.find((g) => now >= g.at - 30 && now <= g.at + 90) || null, missed: list.filter((g) => now > g.at + 90), next: list.find((g) => g.at > now) || null, all: list };
  };
  const names = (ids) => ids.map((id) => (E.suppInfo(id) || { name: id }).name).join(' · ');

  /* =========================================================
     THE DAY PLAN — one timeline the trainer walks you through
     ========================================================= */
  E.dayPlan = (k) => {
    k = k || F.today();
    const T = E.slotTimes(k);
    const ds = E.daySettings();
    const pl = E.planFor(k);
    const ses = F.S.sessions[k];
    const taken = F.S.supp[k] || {};
    const items = [{ kind: 'wake', at: ds.wake, title: '기상', sub: '일어나면 물 한 컵부터' }];
    if (F.DIET) {
      const dd = E.dietDay(k);
      for (const x of dd.slots) items.push({ kind: 'meal', at: F.timeToMin(x.time), slot: x.slot, meal: x, title: SLOT_KO[x.slot] || x.slot, done: !!x.ate });
    }
    if (pl) {
      const tid = E.templateFor(k);
      items.push({ kind: 'workout', at: F.timeToMin(pl.time), tid, done: !!(ses && (ses.status === 'done' || ses.status === 'partial')), minutes: E.estimateMinutes(tid) });
    }
    items.push({ kind: 'bed', at: ds.bed, title: '잠자리', sub: '7시간 이상 자야 근육이 회복돼요' });
    for (const g of groupsOf(E.suppSchedule(k))) {
      const host = items.find((it) => it.at === g.at && (it.kind === 'meal' || it.kind === 'wake'));
      const done = g.ids.every((id) => taken[id]);
      if (host) Object.assign(host, { supps: g.ids, suppSlot: g.slot, suppDone: done });
      else items.push({ kind: 'supp', at: g.at, supps: g.ids, suppSlot: g.slot, title: '영양제', done });
    }
    const ord = { wake: 0, supp: 1, meal: 2, workout: 3, bed: 4 };
    return items.sort((a, b) => a.at - b.at || ord[a.kind] - ord[b.kind]);
  };

  const suppLine = (ids, slot, done) => `<div class="tl-supp ${done ? 'ok' : ''}">${F.icon('pill', 'sm')}<span><b>${esc(names(ids))}</b> · ${esc(slotLabel(slot))}</span>${done ? F.icon('check', 'sm') : `<button class="t-xs link" data-act="supp-take" data-ids="${ids.join(',')}">먹었어요</button>`}</div>`;
  /** The day's timeline. compact = PC dashboard cell. */
  UI.timeline = (k, compact) => {
    k = k || F.today();
    const items = E.dayPlan(k);
    const now = F.nowMin();
    const isToday = k === F.today();
    const D = F.DIET;
    let nowPut = false;
    const out = [];
    for (const it of items) {
      if (isToday && !nowPut && it.at > now) { out.push(`<div class="tl-now"><span class="t-num">${F.minToTime(now)}</span><i></i></div>`); nowPut = true; }
      const past = isToday && it.at + 60 < now;
      let body = '';
      if (it.kind === 'meal') {
        const x = it.meal;
        const opts = D ? D.slots[x.slot] || [] : [];
        const nextId = opts.length > 1 ? opts[(opts.indexOf(x.id) + 1) % opts.length] : null;
        body = `<div class="tl-h"><b>${esc(it.title)}</b><span class="t-xs mute">${esc(x.note || '')}</span></div>
          <div class="tl-s"><b>${esc(x.m.name)}</b> <span class="t-num mute">${x.por.kcal}kcal · ${x.por.p}g</span></div>
          ${compact ? '' : `<div class="t-xs mute2">${esc((x.por.items || []).join(' · '))}</div>`}
          ${it.supps ? suppLine(it.supps, it.suppSlot, it.suppDone) : ''}
          <div class="tl-a"><button class="chk ${it.done ? 'on' : ''}" data-act="diet-ate" data-k="${k}" data-slot="${x.slot}">${F.icon('check', 'sm')}${it.done ? '먹었어요' : '먹으면 체크'}</button>${nextId ? `<button class="t-xs link" data-act="diet-pick" data-k="${k}" data-slot="${x.slot}" data-id="${nextId}">다른 메뉴 ›</button>` : ''}</div>`;
      } else if (it.kind === 'workout') {
        const T = F.TEMPLATES[it.tid] || {};
        body = `<div class="tl-h"><b>운동</b><span class="t-xs mute">${esc(T.name || '')} · 약 ${it.minutes}분</span></div>
          <div class="tl-s">${esc(F.E.templateEx(it.tid).slice(0, 3).map((id) => F.EXERCISES[id].name).join(' · '))} 외</div>
          <div class="tl-a">${it.done ? `<span class="pill-ok">출석 완료</span>` : `<button class="btn sm primary" data-act="start-session" data-date="${k}">${F.icon('play', 'sm')}운동 시작</button><a class="t-xs link" href="#plan">루틴 보기 ›</a>`}</div>`;
      } else if (it.kind === 'supp') {
        body = `<div class="tl-h"><b>영양제</b><span class="t-xs mute">${esc(slotLabel(it.suppSlot))}</span></div>${suppLine(it.supps, it.suppSlot, it.done)}`;
      } else {
        body = `<div class="tl-h"><b>${esc(it.title)}</b></div><div class="tl-s mute2">${esc(it.sub)}</div>${it.supps ? suppLine(it.supps, it.suppSlot, it.suppDone) : ''}`;
      }
      out.push(`<div class="tl-i k-${it.kind} ${past ? 'past' : ''} ${it.done || it.suppDone ? 'done' : ''}"><div class="tl-t t-num">${F.minToTime(it.at)}</div><div class="tl-b">${body}</div></div>`);
    }
    if (isToday && !nowPut) out.push(`<div class="tl-now"><span class="t-num">${F.minToTime(now)}</span><i></i></div>`);
    const noSupp = !(F.S.mySupps || []).length;
    return `<div class="tl ${compact ? 'compact' : ''}">${out.join('')}</div>
      ${noSupp ? `<a class="tl-add" href="#supp">${F.icon('pill', 'sm')}<span>가지고 있는 영양제를 등록하면 먹을 시간까지 챙겨 드려요</span>${F.icon('chevR', 'sm')}</a>` : ''}`;
  };

  /** "곧 종합비타민 · 오메가3 섭취 시간이에요" */
  UI.suppBanner = () => {
    if (!(F.S.mySupps || []).length) return '';
    const k = F.today();
    const due = E.suppDue(k);
    const now = F.nowMin();
    const g = due.soon || (due.missed.length ? due.missed[due.missed.length - 1] : null);
    if (!g) return '';
    const info = E.suppInfo(g.ids[0]) || {};
    const msg = g.at > now ? `곧 ${names(g.ids)} 섭취 시간이에요` : due.soon === g ? `지금 ${names(g.ids)} 드실 시간이에요` : `아직 ${names(g.ids)} 안 드셨어요`;
    return `<div class="sbanner ${g.at <= now ? 'now' : ''}"><div class="sb-ic">${F.icon('pill')}</div>
      <div class="grow"><b>${esc(msg)}</b><span class="t-xs">${F.minToTime(g.at)} · ${esc(slotLabel(g.slot))}${info.withFood === false ? ' · 공복에' : ''}</span></div>
      <button class="btn sm white" data-act="supp-take" data-ids="${g.ids.join(',')}">먹었어요</button></div>`;
  };

  /** Trainer card: greeting, today's coaching line and quick questions. */
  UI.coachCard = (compact) => {
    const h = Math.floor(F.nowMin() / 60);
    const nm = UI.myName();
    const greet = (nm ? `${nm}님, ` : '') + (h < 5 ? '아직 깨어 있네요. 오늘은 푹 자요' : h < 11 ? '좋은 아침이에요!' : h < 14 ? '점심은 맛있게 드셨어요?' : h < 18 ? '오후도 같이 힘내요!' : '오늘 하루 수고 많았어요!');
    const k = F.today();
    const pl = E.planFor(k);
    const tid = pl ? E.templateFor(k) : null;
    const first = tid ? F.EXERCISES[E.templateEx(tid)[0]] : null;
    const qs = pl ? ['운동 전에 뭐 먹으면 좋아요?', first ? `${first.name} 자세 다시 알려줘요` : '오늘 운동 순서 알려줘요', '오늘 컨디션이 별로예요'] : ['쉬는 날엔 뭐 하면 좋아요?', '오늘 홈트 하나 추천해 줘요', '영양제 같이 먹어도 돼요?'];
    return `<section class="coachcard ${compact ? 'compact' : ''}">
      <div class="cc-top"><img src="${F.coachImg(compact ? 'face' : 'coach')}" alt="">
        <div class="cc-say"><span class="t-label">${esc(F.coachName())} · 1:1 코칭</span><b>${esc(greet)}</b><p>${esc(UI.coachLine())}</p></div></div>
      <div class="chips cc-q">${qs.map((q) => `<button class="chip" data-act="home-ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="cc-in" data-home-ask><input class="input" id="home-q" placeholder="${esc(F.coachName())}에게 무엇이든 물어보세요" maxlength="300" autocomplete="off"><button class="btn primary" type="submit" aria-label="질문 보내기">${F.icon('send')}</button></form>
    </section>`;
  };
  const askNow = (q) => { q = String(q || '').trim(); if (!q) return; location.hash = '#ask'; setTimeout(() => UI.coach && UI.coach.send(q), 160); };
  A['home-ask'] = (el) => askNow(el.dataset.q);
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-home-ask]');
    if (!f) return;
    e.preventDefault();
    const inp = F.$('#home-q', f);
    askNow(inp ? inp.value : '');
  });

  /* ---------- intake ---------- */
  A['supp-take'] = (el) => {
    const k = F.today();
    const r = (F.S.supp[k] = F.S.supp[k] || {});
    const ids = String(el.dataset.ids || '').split(',').filter(Boolean);
    for (const id of ids) if (!r[id]) { r[id] = Date.now(); E.addXP(`supp:${id}:${k}`, 2, `${(E.suppInfo(id) || {}).name || id} 섭취`); }
    F.save();
    F.toast(`${names(ids)} 섭취 완료! 꾸준함이 제일 중요해요`);
    UI.refresh();
  };
  A['supp-untake'] = (el) => { const r = F.S.supp[F.today()] || {}; delete r[el.dataset.id]; F.save(); UI.refresh(); };

  /* reminders: ring at each supplement time while the app is open */
  if (F.Alarm) {
    const base = F.Alarm.check;
    F.Alarm.check = () => {
      base();
      const s = F.S;
      if (!s.profile || s.settings.suppAlarm === false || !(s.mySupps || []).length) return;
      const k = F.today();
      const now = F.nowMin();
      const g = E.suppDue(k).soon;
      if (!g || now < g.at) return;
      const key = `${k}|supp|${g.at}`;
      if (s.alarmFired[key]) return;
      s.alarmFired[key] = 1; F.save();
      F.beep([[880, 0.12], [0, 0.06], [1175, 0.22]]); F.vibrate([120, 80, 120]);
      F.Alarm.notify(`${names(g.ids)} 드실 시간이에요`, `${slotLabel(g.slot)} · ${F.coachName()}이 챙겨 드려요`);
      F.toast(`${names(g.ids)} 드실 시간이에요`);
      if (F.route().name === 'home' && !F.$('.sheet-wrap') && !F.$('#session.on')) UI.refresh();
    };
  }

  /* =========================================================
     내 영양제 page
     ========================================================= */
  const POPULAR = ['multi', 'omega3', 'vitd', 'magnesium', 'probiotics', 'vitc', 'creatine', 'whey'];
  V.supp = () => {
    const s = F.S;
    const k = F.today();
    const mine = s.mySupps || [];
    const sched = E.suppSchedule(k);
    const taken = s.supp[k] || {};
    const at = (id) => sched.find((p) => p.id === id);
    const today = groupsOf(sched).map((g) => `<div class="sgroup"><div class="t-num-m">${F.minToTime(g.at)}</div><div class="grow"><div class="t-xs mute">${esc(slotLabel(g.slot))}</div>
        ${g.ids.map((id) => `<button class="sitem ${taken[id] ? 'on' : ''}" data-act="${taken[id] ? 'supp-untake' : 'supp-take'}" data-id="${id}" data-ids="${id}">${F.icon('check', 'sm')}<span>${esc((E.suppInfo(id) || {}).name || id)}</span></button>`).join('')}</div></div>`).join('');
    const cards = mine.map((m) => {
      const info = E.suppInfo(m.id) || { name: m.id };
      const p = at(m.id);
      const slots = Object.keys(SLOTS());
      return `<article class="scard ${m.on === false ? 'off' : ''}">
        <div class="row between"><div><span class="tag">${esc(info.cat || '')}</span> <b class="t-h3">${esc(info.name)}</b></div>
          <button class="t-xs link" data-act="supp-remove" data-id="${m.id}">삭제</button></div>
        <div class="row wrap" style="gap:8px;margin-top:8px;align-items:center"><span class="t-num-m">${p ? F.minToTime(p.at) : '--:--'}</span>
          <select class="input sm" data-change="supp-slot" data-id="${m.id}" aria-label="먹는 시간"><option value="">추천 시간 (${esc(slotLabel((info.slots || ['breakfast'])[0]))})</option>${slots.map((sl) => `<option value="${sl}" ${m.slot === sl ? 'selected' : ''}>${esc(slotLabel(sl))}</option>`).join('')}</select></div>
        ${p && p.moved ? `<p class="t-xs" style="margin-top:6px"><b>함께 먹으면 안 되는 영양제와 시간을 띄웠어요.</b></p>` : ''}
        ${info.dose ? `<p class="t-small" style="margin-top:8px"><b>얼마나</b> ${esc(info.dose)}</p>` : ''}
        ${info.timing ? `<p class="t-small" style="margin-top:4px"><b>언제</b> ${esc(info.timing)}</p>` : ''}
        ${info.why ? `<p class="t-small mute2" style="margin-top:4px">${esc(info.why)}</p>` : ''}
        ${info.caution ? `<div class="callout hot" style="margin-top:8px">${F.icon('info', 'sm')}<div class="t-xs">${esc(info.caution)}</div></div>` : ''}
      </article>`;
    }).join('');
    const empty = `<div class="card" style="text-align:left"><div class="coach-mini"><img src="${F.coachImg('face')}" alt=""><p><b>${esc(F.coachName())}</b>가지고 있는 영양제를 알려 주세요. 가장 흡수가 잘 되는 시간에 맞춰 알림을 드리고, 먹었는지까지 같이 챙길게요.</p></div>
        <div class="chips" style="margin-top:12px">${POPULAR.filter((id) => CAT().some((c) => c.id === id)).map((id) => `<button class="chip" data-act="supp-add" data-id="${id}">${F.icon('plus', 'sm')}${esc(E.suppInfo(id).name)}</button>`).join('')}</div></div>`;
    const st = s.settings;
    const settings = `<div class="grid g2" style="gap:10px">
        <label class="field" style="margin:0"><span>일어나는 시간</span><input class="input num" type="time" value="${st.wakeTime || '07:00'}" data-change="set-wake"></label>
        <label class="field" style="margin:0"><span>잠드는 시간</span><input class="input num" type="time" value="${st.bedTime || '23:30'}" data-change="set-bed"></label></div>
      <label class="row" style="gap:8px;margin-top:12px"><input type="checkbox" data-change="set-suppalarm" ${st.suppAlarm === false ? '' : 'checked'}> <span class="t-small">먹을 시간에 소리 · 알림으로 알려주기 (앱이 열려 있을 때)</span></label>`;
    const rules = (F.SUPP_RULES || []).map((r, i) => `<div class="rule"><span class="n">0${i + 1}</span><div><b class="t-h3">${esc(r.title)}</b><p class="t-small mute2">${esc(r.body)}</p></div></div>`).join('');
    const left = `<section>${UI.secH('TODAY', '오늘 먹을 시간', mine.length ? `<button class="btn sm" data-act="supp-open-add">${F.icon('plus', 'sm')}추가</button>` : '')}
        ${mine.length ? (today || '<div class="empty">켜져 있는 영양제가 없어요</div>') : empty}
        ${mine.length ? `<div class="sec">${UI.secH('MINE', `내 영양제 ${mine.length}개`, '')}<div class="scards">${cards}</div></div>` : ''}</section>`;
    const right = `<section>${UI.secH('TIME', '내 하루 시간', '')}${settings}
        <p class="t-xs mute" style="margin-top:8px">식사 시간과 운동 시간은 식단 · 플랜에서 정한 대로 따라가요. 운동하는 날은 운동 전후 영양제가 운동 시간에 맞춰 움직여요.</p>
        ${rules ? `<div class="sec">${UI.secH('RULES', '영양제 기본 원칙', '')}${rules}</div>` : ''}
        <p class="t-xs mute" style="margin-top:12px">약을 먹고 있거나 임신 · 수유 중이라면 영양제를 시작하기 전에 꼭 의사 · 약사와 상담하세요.</p></section>`;
    return `<div class="page">${UI.ph('SUPPLEMENTS', '내 영양제', '가지고 있는 영양제를 등록하면 가장 좋은 시간에 맞춰 알려 드리고, 먹었는지까지 챙겨요.')}
      <div class="split wide-l">${left}${right}</div></div>`;
  };
  A['supp-add'] = (el) => {
    const s = F.S;
    s.mySupps = s.mySupps || [];
    if (!s.mySupps.some((x) => x.id === el.dataset.id)) s.mySupps.push({ id: el.dataset.id, on: true, added: F.today() });
    F.save(true);
    F.toast(`${(E.suppInfo(el.dataset.id) || {}).name || '영양제'} 추가 — 먹을 시간을 잡아 뒀어요`);
    if (F.$('.sheet-wrap')) renderAdd(); else UI.refresh();
  };
  A['supp-remove'] = async (el) => {
    const info = E.suppInfo(el.dataset.id) || {};
    if (!(await F.ask({ label: 'SUPPLEMENT', title: `${info.name || '영양제'}를 목록에서 뺄까요?`, ok: '빼기' }))) return;
    F.S.mySupps = (F.S.mySupps || []).filter((x) => x.id !== el.dataset.id);
    F.save(true); UI.refresh();
  };
  A['supp-slot'] = (el) => { const m = (F.S.mySupps || []).find((x) => x.id === el.dataset.id); if (m) { m.slot = el.value || null; F.save(true); UI.refresh(); } };
  A['set-wake'] = (el) => { F.S.settings.wakeTime = el.value || '07:00'; F.save(); UI.refresh(); };
  A['set-bed'] = (el) => { F.S.settings.bedTime = el.value || '23:30'; F.save(); UI.refresh(); };
  A['set-suppalarm'] = (el) => { F.S.settings.suppAlarm = !!el.checked; F.save(); if (el.checked && F.Alarm && F.Alarm.permission() === 'default') F.Alarm.request(); };

  /* add sheet: search the catalog or add your own */
  let addQ = '', addCat = '전체';
  const renderAdd = () => {
    const mine = new Set((F.S.mySupps || []).map((x) => x.id));
    const cats = ['전체'].concat([...new Set(CAT().map((c) => c.cat))]);
    const q = addQ.trim();
    const list = CAT().filter((c) => (addCat === '전체' || c.cat === addCat) && (!q || c.name.includes(q) || (c.aka || []).some((a) => a.includes(q))));
    const html = `<div class="t-label mute">ADD SUPPLEMENT</div><h2 class="t-h1" style="margin:6px 0 10px">영양제 추가</h2>
      <input class="input" id="supp-q" placeholder="이름으로 찾기 (예: 오메가, 비타민D)" value="${esc(addQ)}" autocomplete="off">
      <div class="chips" style="margin-top:10px">${cats.map((c) => `<button class="chip ${addCat === c ? 'on' : ''}" data-act="supp-cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="list" style="margin-top:10px">${list.map((c) => `<div style="align-items:flex-start"><div class="grow" style="min-width:0"><b>${esc(c.name)}</b> <span class="t-xs mute">${esc(slotLabel((c.slots || [])[0]))}</span><div class="t-xs mute2">${esc(c.why || '')}</div></div>
          ${mine.has(c.id) ? '<span class="pill-ok">추가됨</span>' : `<button class="btn sm" data-act="supp-add" data-id="${c.id}">${F.icon('plus', 'sm')}추가</button>`}</div>`).join('') || '<div class="empty">찾는 영양제가 없어요. 아래에서 직접 추가해 주세요.</div>'}</div>
      <div class="divider"></div>
      <div class="t-label">목록에 없는 영양제</div>
      <div class="row" style="gap:6px;margin-top:6px"><input class="input" id="supp-custom" placeholder="이름" maxlength="20" style="flex:1;min-width:0">
        <select class="input" id="supp-custom-slot" style="width:auto">${Object.keys(SLOTS()).map((sl) => `<option value="${sl}">${esc(slotLabel(sl))}</option>`).join('')}</select>
        <button class="btn" data-act="supp-custom">추가</button></div>`;
    const open = F.$('.sheet-wrap.on .sheet-body');
    if (open && open.dataset.supp === '1') { const y = open.parentElement.scrollTop; open.innerHTML = html; open.parentElement.scrollTop = y; }
    else { const w = F.sheet(html, { wide: true }); F.$('.sheet-body', w).dataset.supp = '1'; }
    const inp = F.$('#supp-q');
    if (inp) inp.addEventListener('input', () => { addQ = inp.value; clearTimeout(renderAdd.t); renderAdd.t = setTimeout(() => { renderAdd(); const i2 = F.$('#supp-q'); if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); } }, 180); });
  };
  A['supp-open-add'] = () => { addQ = ''; addCat = '전체'; renderAdd(); };
  A['supp-cat'] = (el) => { addCat = el.dataset.v; renderAdd(); };
  A['supp-custom'] = () => {
    const n = ((F.$('#supp-custom') || {}).value || '').trim();
    if (!n) { F.toast('이름을 적어 주세요'); return; }
    const slot = (F.$('#supp-custom-slot') || {}).value || 'breakfast';
    F.S.mySupps = F.S.mySupps || [];
    F.S.mySupps.push({ id: 'c_' + Date.now().toString(36), on: true, custom: { name: n, slot } });
    F.save(true); F.toast(`${n} 추가 — ${slotLabel(slot)}에 알려 드릴게요`); renderAdd();
  };

  /* =========================================================
     DIET STYLE + PRODUCT PICKS (used on the diet page)
     ========================================================= */
  UI.dietStyle = () => {
    const cur = F.S.settings.dietStyle || 'auto';
    const opts = [['auto', '골고루', '편의점 · 집밥 · 외식을 번갈아'], ['cvs', '편의점 위주', '사서 바로 먹는 메뉴'], ['home', '집밥 위주', '10분 안에 만드는 메뉴'], ['out', '외식 · 배달 위주', '회사 근처 · 배달 메뉴']];
    return `<div class="dstyle">${opts.map(([v, l, d]) => `<button class="${cur === v ? 'on' : ''}" data-act="set-dietstyle" data-v="${v}"><b>${l}</b><span>${d}</span></button>`).join('')}</div>`;
  };
  A['set-dietstyle'] = (el) => {
    F.S.settings.dietStyle = el.dataset.v;
    const k = F.today();
    const rec = F.S.meals[k];
    if (rec && rec.pick) { // let today's untouched picks follow the new style
      for (const sl of Object.keys(rec.pick)) if (!(rec.ate || {})[sl]) delete rec.pick[sl];
    }
    F.save(); UI.refresh();
  };
  const ext = (url, label) => `<a class="ext" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
  UI.products = () => {
    const R = F.RECO || {};
    const ch = (R.chicken || []).map((c) => `<div class="prod"><div class="grow" style="min-width:0"><b>${esc(c.brand)}</b> <span class="t-xs mute">${esc(c.pick || '')}</span><div class="t-xs mute2">${esc(c.why || '')}</div></div>${ext(c.url, '쿠팡')}</div>`).join('');
    const zero = (R.zero || []).filter((z) => z.name !== 'all' && z.id !== 'all').map((z) => `<div class="prod"><div class="grow" style="min-width:0"><b>${esc(z.name)}</b> <span class="tag">${esc(z.type || '')}</span><div class="t-xs mute2">${esc(z.note || '')}</div></div>${ext(z.url, '쿠팡')}</div>`).join('');
    const allZero = (R.zero || []).find((z) => z.name === 'all' || z.id === 'all');
    if (!ch && !zero) return '';
    return `<section class="sec">${UI.secH('PROTEIN', '맛있는 닭가슴살 베스트', ext('https://www.coupang.com/np/search?q=' + encodeURIComponent('닭가슴살') + '&sorter=saleCountDesc', '판매량순 전체'))}
        <p class="t-xs mute" style="margin-bottom:6px">단백질은 매 끼니 손바닥 1개. 질리지 않게 맛을 바꿔 가며 드세요.</p><div class="prods">${ch}</div></section>
      <section class="sec">${UI.secH('ZERO', '단 음료 대신 제로 음료', allZero ? ext(allZero.url, '판매량순 전체') : '')}
        <p class="t-xs mute" style="margin-bottom:6px">달달한 음료 한 캔이 밥 반 공기예요. 당길 땐 제로로 바꿔요. 카페인 든 음료는 오후 3시 전까지만.</p><div class="prods">${zero}</div></section>
      <p class="t-xs mute" style="margin-top:8px">링크는 쿠팡 검색 결과(판매량순)로 열려요. 가격 · 재고는 그때그때 달라요.</p>`;
  };

  /* =========================================================
     HOME WORKOUT — legendary Korean routines, played in the app (landscape, full screen)
     ========================================================= */
  const inClaude = () => !!(window.claude && typeof window.claude.use === 'function');
  const allVids = () => (F.HOMEFIT || []).concat(((F.RECO || {}).videos || []).filter((v) => v.id && !(F.HOMEFIT || []).some((h) => h.id === v.id)));
  const catLabel = (c) => ((F.HOMEFIT_CATS || []).find((x) => x.id === c) || { label: c || '추가 추천' }).label;
  const viewsLabel = (n) => (n ? `${F.num(n)}만 회` : '');
  const ytUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
  let hf = { cat: 'all', quiet: false, short: false };
  const vcard = (v, small) => {
    const thumb = inClaude() ? '' : `<img class="yt" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy">`;
    const inner = `<div class="vthumb">${thumb}<span class="vplay">${F.icon('play')}</span>${v.min ? `<span class="vdur t-num">${v.min}분</span>` : ''}</div>
      <div class="vbody"><b class="vc-title">${esc(v.title)}</b>
        <span class="t-xs mute">${esc(v.ch || v.channel || '')}${v.views ? ` · 조회수 약 ${viewsLabel(v.views)}` : ''}</span>
        ${small ? '' : `<p class="t-small mute2">${esc(v.desc || v.why || '')}</p>`}
        <div class="vc-top"><span class="tag">${esc(v.level || '초급')}</span>${v.quiet ? '<span class="tag line">층간소음 걱정 없음</span>' : ''}${v.knee ? '<span class="tag line">무릎 부담 적음</span>' : ''}</div></div>`;
    return inClaude()
      ? `<a class="vcard ${small ? 'sm' : ''}" href="${ytUrl(v.id)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<button class="vcard ${small ? 'sm' : ''}" data-act="hf-play" data-id="${v.id}" aria-label="${esc(v.title)} 재생">${inner}</button>`;
  };
  const brokenThumbs = (root) => (root || document).querySelectorAll('img.yt').forEach((img) => img.addEventListener('error', () => img.remove(), { once: true }));
  V.homefit = () => {
    const vids = allVids();
    const cats = (F.HOMEFIT_CATS || []).filter((c) => vids.some((v) => v.cat === c.id));
    const list = vids.filter((v) => (hf.cat === 'all' || v.cat === hf.cat) && (!hf.quiet || v.quiet) && (!hf.short || (v.min && v.min <= 10)));
    const groups = (hf.cat === 'all' ? cats.map((c) => c.id) : [hf.cat]).map((cid) => ({ cid, items: list.filter((v) => v.cat === cid).sort((a, b) => (b.views || 0) - (a.views || 0)) })).filter((g) => g.items.length);
    const extra = list.filter((v) => !cats.some((c) => c.id === v.cat));
    const html = `<div class="page">${UI.ph('HOME TRAINING', '홈트 영상', `헬스장에 못 가는 날을 위한 국내 홈트 레전드 루틴만 모았어요. ${inClaude() ? 'claude.ai 안에서는 영상이 유튜브로 열려요.' : '누르면 앱 안에서 가로 전체화면으로 바로 재생돼요.'}`)}
      <div class="chips">${[['all', '전체']].concat(cats.map((c) => [c.id, c.label])).map(([id, l]) => `<button class="chip ${hf.cat === id ? 'on' : ''}" data-act="hf-cat" data-v="${id}">${esc(l)}</button>`).join('')}</div>
      <div class="chips" style="margin-top:8px"><button class="chip ${hf.quiet ? 'on' : ''}" data-act="hf-toggle" data-k="quiet">${F.icon('check', 'sm')}층간소음 걱정 없음</button><button class="chip ${hf.short ? 'on' : ''}" data-act="hf-toggle" data-k="short">${F.icon('clock', 'sm')}10분 이하</button></div>
      ${groups.map((g) => `<section class="sec">${UI.secH(((F.HOMEFIT_CATS || []).find((c) => c.id === g.cid) || {}).en || '', `${esc(catLabel(g.cid))} <span class="t-num mute" style="font-size:14px">${g.items.length}</span>`, '')}<div class="vgrid">${g.items.map((v) => vcard(v)).join('')}</div></section>`).join('')}
      ${extra.length ? `<section class="sec">${UI.secH('MORE', '추가 추천', '')}<div class="vgrid">${extra.map((v) => vcard(v)).join('')}</div></section>` : ''}
      ${!list.length ? '<div class="empty" style="margin-top:14px">조건에 맞는 영상이 없어요. 필터를 바꿔 보세요.</div>' : ''}
      <p class="t-xs mute" style="margin-top:14px">처음엔 영상 속도를 다 따라가지 말고, 자세가 무너지면 쉬었다 가요. 무릎 · 허리가 아프면 점프 동작은 빼고 같은 동작을 제자리에서 천천히 해요. 조회수는 영상 소개 기준이에요.</p></div>`;
    return { html, after: (root) => brokenThumbs(root) };
  };
  A['hf-cat'] = (el) => { hf.cat = el.dataset.v; UI.refresh(); };
  A['hf-toggle'] = (el) => { hf[el.dataset.k] = !hf[el.dataset.k]; UI.refresh(); };

  /** Two picks for today (rest days on home): a fat-burning routine and a stretch, rotating by date. */
  UI.homefitPicks = (k) => {
    const vids = allVids(); if (!vids.length) return '';
    const n = Math.floor(F.parseKey(k || F.today()).getTime() / 864e5);
    const burn = vids.filter((v) => v.cat === 'cardio' && v.quiet);
    const core = vids.filter((v) => v.cat === 'core');
    const st = vids.filter((v) => v.cat === 'stretch');
    const picks = [burn[n % Math.max(1, burn.length)], (n % 2 ? core : st)[n % Math.max(1, (n % 2 ? core : st).length)]].filter(Boolean);
    return `<section class="sec" style="padding:0 var(--pad)">${UI.secH('HOME TRAINING', '오늘의 홈트', '<a class="t-xs link" href="#homefit">전체 보기 ›</a>')}<div class="vgrid">${picks.map((v) => vcard(v, true)).join('')}</div></section>`;
  };

  /* the in-app player: full screen, landscape (rotates itself when the phone can't), back to the list */
  let player = null;
  const fitRotate = () => { if (player) player.classList.toggle('rotate', window.innerHeight > window.innerWidth); }; // still portrait after the lock → turn the stage itself
  UI.playVideo = async (v) => {
    closePlayer(true);
    const el = document.createElement('div');
    el.className = 'vplayer';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', v.title);
    el.innerHTML = `<div class="vp-stage"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <div class="vp-bar"><button class="vp-back" data-act="hf-close">${F.icon('arrowL', 'sm')}목록으로</button><span class="vp-title">${esc(v.title)}</span><a class="vp-yt" href="${ytUrl(v.id)}" target="_blank" rel="noopener noreferrer">유튜브에서 열기 ↗</a></div></div>`;
    document.body.appendChild(el);
    document.body.classList.add('noscroll');
    player = el;
    try { history.pushState({ tsamPlayer: 1 }, '', location.href); el.dataset.pushed = '1'; } catch (e) { /* ignore */ }
    try {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) { /* not allowed: stays full window */ }
    try { if (screen.orientation && screen.orientation.lock) { await screen.orientation.lock('landscape'); el.dataset.locked = '1'; } } catch (e) { /* e.g. iPhone: rotate with CSS */ }
    fitRotate();
    setTimeout(fitRotate, 400);
  };
  const closePlayer = (silent) => {
    if (!player) return;
    const el = player;
    player = null;
    try { if (document.fullscreenElement) document.exitFullscreen(); else if (document.webkitFullscreenElement) document.webkitExitFullscreen(); } catch (e) { /* ignore */ }
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ignore */ }
    el.remove();
    if (!F.$('.sheet-wrap') && !F.$('#session.on')) document.body.classList.remove('noscroll');
    if (!silent && el.dataset.pushed === '1' && history.state && history.state.tsamPlayer) history.back();
  };
  A['hf-play'] = (el) => { const v = allVids().find((x) => x.id === el.dataset.id); if (v) UI.playVideo(v); };
  A['hf-close'] = () => closePlayer(false);
  window.addEventListener('popstate', () => { if (player) closePlayer(true); });
  window.addEventListener('resize', fitRotate);
  document.addEventListener('keydown', (e) => { if (player && e.key === 'Escape' && !document.fullscreenElement) closePlayer(false); });
})(window.F);
