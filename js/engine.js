/* Engine — all the "PT brain": body metrics, nutrition targets, meal solver, program phases,
   schedule + rescheduling, load progression, cardio prescription, XP/levels/badges, InBody analysis. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const E = (F.E = {});
  const S = () => F.S;

  /* =========================================================
     BODY
     ========================================================= */
  E.bmi = (w, hcm) => (w && hcm ? w / Math.pow(hcm / 100, 2) : null);

  E.sortedInbody = () => (S().inbody || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));

  /** Latest known body numbers: newest of (profile weight log, quick weights, InBody). */
  E.body = () => {
    const p = S().profile || {};
    const ib = E.sortedInbody();
    const last = ib[ib.length - 1] || null;
    let weight = p.weight, wDate = p.createdAt || F.today(), wSrc = '프로필';
    const ws = (S().weights || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
    const lw = ws[ws.length - 1];
    if (lw && lw.d >= wDate) { weight = lw.w; wDate = lw.d; wSrc = '체중 기록'; }
    if (last && last.weight && last.date >= wDate) { weight = last.weight; wDate = last.date; wSrc = '인바디'; }
    const out = { weight, wDate, wSrc, height: p.height, age: p.age, sex: p.sex, inbody: last };
    if (last) {
      out.pbf = last.pbf != null ? last.pbf : last.bfm && last.weight ? (last.bfm / last.weight) * 100 : null;
      out.smm = last.smm; out.bmrMeasured = last.bmr; out.vfl = last.vfl;
      out.ibDate = last.date;
    }
    if (out.pbf != null) { out.bfm = (weight * out.pbf) / 100; out.ffm = weight - out.bfm; }
    else { out.ffm = E.lbmBoer(weight, p.height, p.sex); out.ffmEst = true; }
    out.bmi = E.bmi(weight, p.height);
    return out;
  };

  E.lbmBoer = (w, h, sex) => (sex === 'f' ? 0.252 * w + 0.473 * h - 48.3 : 0.407 * w + 0.267 * h - 19.2);
  E.mifflin = (w, h, age, sex) => 10 * w + 6.25 * h - 5 * age + (sex === 'f' ? -161 : 5);
  E.katch = (ffm) => 370 + 21.6 * ffm;
  E.hrZone = (age) => { const max = Math.round(208 - 0.7 * age); return { max, lo: Math.round(max * 0.6), hi: Math.round(max * 0.7) }; };

  /* =========================================================
     NUTRITION TARGETS
     ========================================================= */
  E.isGymDay = (k) => !!E.planFor(k);

  E.targets = (k) => {
    k = k || F.today();
    const b = E.body();
    const st = S().settings;
    const reasons = [];
    let bmr, bmrSrc;
    const ibFresh = b.inbody && b.bmrMeasured && F.diffDays(b.ibDate, k) <= 90;
    if (ibFresh) { bmr = b.bmrMeasured; bmrSrc = `인바디 측정 기초대사량 (${F.dateLabel(b.ibDate, false)})`; }
    else if (b.pbf != null) { bmr = E.katch(b.ffm); bmrSrc = 'Katch-McArdle 공식 (제지방량 기반)'; }
    else { bmr = E.mifflin(b.weight, b.height, b.age, b.sex); bmrSrc = 'Mifflin-St Jeor 공식 (성별·나이·키·체중)'; }
    const freq = st.freq;
    const factor = 1.25 + 0.05 * freq;
    const tdee = bmr * factor;
    const pct = { easy: 0.15, normal: 0.2, fast: 0.25 }[st.pace] || 0.2;
    let base = tdee * (1 - pct) + (st.kcalAdj || 0);
    const floor = Math.max(Math.round(bmr), b.sex === 'f' ? 1200 : 1500);
    let floored = false;
    if (base < floor) { base = floor; floored = true; }
    const gym = E.isGymDay(k);
    const restDelta = -Math.round((freq * 100) / Math.max(1, 7 - freq));
    const dayDelta = gym ? 100 : restDelta;
    const kcal = Math.round((base + dayDelta) / 10) * 10;
    // protein from fat-free mass, bounded by body-weight rules for people with obesity
    const protein = F.round(F.clamp(2.2 * b.ffm, 1.3 * b.weight, 2.0 * b.weight), 5);
    const fat = Math.round((kcal * 0.28) / 9);
    const carb = Math.max(80, Math.round((kcal - protein * 4 - fat * 9) / 4));
    const fiber = Math.round((kcal / 1000) * 14);
    const water = Math.round((b.weight * 33 + (gym ? 500 : 0)) / 100) / 10;
    reasons.push(`기초대사량 ${F.num(bmr)}kcal — ${bmrSrc}`);
    reasons.push(`활동계수 ×${factor.toFixed(2)} (주 ${freq}회 운동 + 일상 활동) = 유지 칼로리 ${F.num(tdee)}kcal`);
    reasons.push(`감량 적자 ${Math.round(pct * 100)}%${st.kcalAdj ? ` · 보정 ${F.signed(st.kcalAdj, 0)}kcal` : ''} → 기본 ${F.num(Math.round(base / 10) * 10)}kcal${floored ? ' (기초대사량 밑으로는 내리지 않아요)' : ''}`);
    reasons.push(gym ? '운동하는 날 +100kcal (운동 전후 탄수화물로 회복)' : `쉬는 날 ${restDelta}kcal (주간 평균 유지)`);
    reasons.push(`단백질 ${protein}g = 제지방량 ${F.num1(b.ffm)}kg × 2.2g — 감량 중 근육을 지키는 양${b.ffmEst ? ' (제지방량 추정치 — 인바디 등록 시 더 정확해져요)' : ''}`);
    reasons.push(`지방은 칼로리의 28% (${fat}g, 호르몬·포만감 유지), 나머지를 탄수화물 ${carb}g으로 채워 운동 에너지를 확보해요`);
    return { k, bmr: Math.round(bmr), bmrSrc, factor, tdee: Math.round(tdee), pct, base: Math.round(base), kcal, protein, fat, carb, fiber, water, gym, reasons, body: b };
  };

  /* Expected weekly loss from the planned deficit (7700 kcal ≈ 1 kg fat) */
  E.expectedWeekly = () => {
    const t = E.targets(F.today());
    const deficit = t.tdee - t.base;
    return (deficit * 7) / 7700;
  };

  /* =========================================================
     MEAL SOLVER
     ========================================================= */
  const SPLIT = { breakfast: [0.25, 0.25], lunch: [0.32, 0.3], snack: [0.13, 0.15], dinner: [0.3, 0.3] };
  E.SPLIT = SPLIT;
  E.SLOT_LABEL = { breakfast: '아침', lunch: '점심', snack: '간식', dinner: '저녁' };
  E.SLOT_EN = { breakfast: 'BREAKFAST', lunch: 'LUNCH', snack: 'SNACK', dinner: 'DINNER' };

  const dayIndex = (k) => Math.floor(F.parseKey(k).getTime() / 864e5);
  E.mealsFor = (slot) => (F.MEALS || []).filter((m) => m.slot === slot);

  E.pickMeal = (k, slot, gym) => {
    const rec = S().meals[k];
    if (rec && rec.pick && rec.pick[slot]) {
      const m = (F.MEALS || []).find((x) => x.id === rec.pick[slot]);
      if (m) return m;
    }
    let list = E.mealsFor(slot);
    if (slot === 'snack') {
      if (gym) { const sh = list.find((m) => m.id === 'sn_shake'); if (sh) return sh; }
      list = list.filter((m) => m.id !== 'sn_shake');
    }
    if (!list.length) return null;
    return list[(dayIndex(k) * (slot === 'lunch' ? 3 : slot === 'dinner' ? 2 : 1)) % list.length];
  };

  E.scaleMeal = (meal, kcalT, pT) => {
    const FD = F.FOODS;
    const items = meal.items.map((it) => Object.assign({}, it));
    const sum = (arr, key) => arr.reduce((a, it) => a + (FD[it.food][key] * it.g) / 100, 0);
    const prot = items.filter((i) => i.role === 'protein');
    const carb = items.filter((i) => i.role === 'carb');
    const others = items.filter((i) => i.role !== 'protein');
    const pOther = sum(others, 'p');
    const pBase = sum(prot, 'p');
    if (pBase > 0) {
      const fp = F.clamp((pT - pOther) / pBase, 0.6, 2.0);
      prot.forEach((i) => (i.g *= fp));
    }
    const nonCarb = items.filter((i) => i.role !== 'carb');
    const kOther = sum(nonCarb, 'kcal');
    const kBase = sum(carb, 'kcal');
    if (kBase > 0) {
      const fc = F.clamp((kcalT - kOther) / kBase, 0.3, 2.2);
      carb.forEach((i) => (i.g *= fc));
    }
    // round to kitchen-friendly amounts
    items.forEach((i) => {
      const fd = FD[i.food];
      if (fd.piece) {
        const n = Math.max(0.5, Math.round((i.g / fd.piece.g) * 2) / 2);
        i.g = n * fd.piece.g; i.pieces = n;
      } else i.g = Math.max(5, i.g >= 50 ? Math.round(i.g / 10) * 10 : Math.round(i.g / 5) * 5);
      i.kcal = (fd.kcal * i.g) / 100; i.p = (fd.p * i.g) / 100; i.c = (fd.c * i.g) / 100; i.f = (fd.f * i.g) / 100;
    });
    const tot = items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 });
    return { meal, items, ...tot };
  };

  /* Meal times follow the gym time and rule 3 of the easy diet ("finish eating by 8 pm";
     the one exception is the shake after a late workout). */
  E.mealTimes = (k) => {
    const gym = E.planFor(k);
    const gt = F.timeToMin(S().settings.gymTime);
    const t = { breakfast: 8 * 60, lunch: 12 * 60 + 30, snack: 16 * 60, dinner: 19 * 60 };
    const note = {};
    if (gym) {
      if (gt >= 17 * 60) {
        t.lunch = 12 * 60 + 30; note.lunch = '밥으로 운동할 에너지 채우기';
        if (gt + 100 <= 20 * 60) {
          // early evening: shake before, dinner right after the workout, done before 8 pm
          t.snack = gt - 90; note.snack = '운동 1시간 30분 전 — 단백질 채우기';
          t.dinner = gt + 100; note.dinner = '운동 후 저녁 — 8시 전에 끝내요';
        } else {
          // late evening (e.g. 19:30): dinner before the gym, only the shake after it
          t.dinner = Math.max(17 * 60 + 30, gt - 90); note.dinner = '운동 1시간 30분 전 — 평소 양으로 먹고 가요';
          t.snack = gt + 80; note.snack = '운동 직후 — 늦게 운동한 날의 예외 1잔';
        }
      } else if (gt <= 10 * 60) {
        t.pre = gt - 45;
        t.breakfast = gt + 90; note.breakfast = '운동 후 아침 — 단백질 + 탄수화물';
        note.snack = '오후 간식 — 단백질 채우기';
      } else {
        t.pre = gt - 60;
        t.lunch = gt + 100; note.lunch = '운동 후 점심 — 회복 식사';
        t.snack = Math.max(16 * 60, gt + 240); note.snack = '오후 간식 — 단백질 채우기';
      }
    }
    return { t, note };
  };

  E.mealPlan = (k) => {
    k = k || F.today();
    const tg = E.targets(k);
    const { t, note } = E.mealTimes(k);
    const slots = ['breakfast', 'lunch', 'snack', 'dinner'].map((slot) => {
      const meal = E.pickMeal(k, slot, tg.gym);
      if (!meal) return null;
      const [kr, pr] = SPLIT[slot];
      const sm = E.scaleMeal(meal, tg.kcal * kr, tg.protein * pr);
      return Object.assign(sm, { slot, time: F.minToTime(t[slot]), note: note[slot] || '' });
    }).filter(Boolean).sort((a, b) => (a.time < b.time ? -1 : 1));
    const tot = slots.reduce((a, s) => ({ kcal: a.kcal + s.kcal, p: a.p + s.p, c: a.c + s.c, f: a.f + s.f }), { kcal: 0, p: 0, c: 0, f: 0 });
    const rec = S().meals[k] || {};
    const eaten = slots.filter((s) => rec.done && rec.done[s.slot]).reduce((a, s) => ({ kcal: a.kcal + s.kcal, p: a.p + s.p }), { kcal: 0, p: 0 });
    return { k, tg, slots, tot, eaten, pre: t.pre != null ? F.minToTime(t.pre) : null, rec };
  };

  /* =========================================================
     EASY DIET (F.DIET): pick a portion size from the calorie target
     ========================================================= */
  E.dietSize = (kcal) => (kcal < 1700 ? 'S' : kcal < 2100 ? 'M' : 'L');
  E.DIET_SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
  E.dietPick = (k, slot, gym) => {
    const D = F.DIET; if (!D) return null;
    const rec = S().meals[k];
    if (rec && rec.pick && rec.pick[slot] && D.meals[rec.pick[slot]]) return rec.pick[slot];
    const ids = D.slots[slot] || [];
    if (!ids.length) return null;
    const STYLE = { cvs: ['편의점'], home: ['집밥', '5분'], out: ['외식', '배달'] }[(S().settings.dietStyle) || 'auto'];
    if (STYLE && slot !== 'snack') {
      const pref = ids.filter((id) => D.meals[id] && STYLE.some((t) => (D.meals[id].tag || '').includes(t)));
      if (pref.length) return pref[dayIndex(k) % pref.length];
    }
    if (slot === 'snack') return gym ? (ids.find((x) => x.includes('shake')) || ids[0]) : (ids.find((x) => !x.includes('shake')) || ids[0]);
    return ids[(dayIndex(k) + (slot === 'lunch' ? 1 : slot === 'dinner' ? 2 : 0)) % ids.length];
  };
  E.dietDay = (k) => {
    k = k || F.today();
    const D = F.DIET;
    const tg = E.targets(k);
    const size = E.dietSize(tg.kcal);
    const { t, note } = E.mealTimes(k);
    const rec = S().meals[k] || {};
    const slots = E.DIET_SLOTS.map((slot) => {
      const id = E.dietPick(k, slot, tg.gym);
      const m = id && D ? D.meals[id] : null;
      if (!m) return null;
      const por = m.size[size] || m.size.M;
      return { slot, id, m, por, size, time: F.minToTime(t[slot]), note: note[slot] || '', ate: !!(rec.ate && rec.ate[slot]) };
    }).filter(Boolean).sort((a, b) => (a.time < b.time ? -1 : 1));
    const tot = slots.reduce((a, x) => ({ kcal: a.kcal + x.por.kcal, p: a.p + x.por.p }), { kcal: 0, p: 0 });
    const eaten = slots.filter((x) => x.ate).reduce((a, x) => ({ kcal: a.kcal + x.por.kcal, p: a.p + x.por.p }), { kcal: 0, p: 0 });
    const checks = rec.checks || {};
    return { k, tg, size, slots, tot, eaten, checks, water: rec.water || 0, pre: t.pre != null ? F.minToTime(t.pre) : null };
  };

  /* =========================================================
     PROGRAM: sessions, phases, rotation
     ========================================================= */
  E.doneSessions = () => Object.values(S().sessions || {})
    .filter((s) => s && (s.status === 'done' || s.status === 'partial'))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  E.phase = () => {
    const freq = S().settings.freq;
    const n = E.doneSessions().filter((s) => s.kind !== 'home').length;
    const weeksEq = n / freq;
    const idx = weeksEq < 4 ? 0 : weeksEq < 8 ? 1 : 2;
    const ph = F.PHASES[idx];
    const nextAt = idx < 2 ? Math.ceil((idx + 1) * 4 * freq) : null;
    return Object.assign({}, ph, { done: n, nextAt, toNext: nextAt ? nextAt - n : 0, weeksEq, cycle: weeksEq >= 12 ? Math.floor(weeksEq / 12) + 1 : 1 });
  };

  E.programWeek = (k) => {
    const p = S().profile; if (!p) return 1;
    return Math.max(1, Math.floor(F.diffDays(F.mondayOf(p.startDate), F.mondayOf(k || F.today())) / 7) + 1);
  };

  /* ---------- splits: 무분할(full) · 2분할(ul) · 3분할(ppl) ---------- */
  E.splitId = () => {
    const s = S();
    const sp = s.settings.split || 'auto';
    if (sp !== 'auto' && F.SPLIT_ROT[sp]) return sp;
    return s.settings.freq >= 4 ? 'ul' : 'full';
  };
  E.recommendSplit = () => {
    const fq = S().settings.freq;
    const ph = E.phase();
    if (fq >= 4) return { id: 'ul', why: `주 ${fq}회라면 상체·하체를 나눠야 같은 근육이 이틀 연속 일하지 않고, 근육마다 주 2번씩 자극돼요.` };
    if (ph.id >= 3 && fq === 3) return { id: 'full', alt: 'ppl', why: '주 3회 전신은 근육마다 주 3번 자극이라 여전히 가장 효율적이에요. 운동 시간이 길어지면 3분할(밀기·당기기·하체)로 바꿔도 좋아요.' };
    return { id: 'full', why: `주 ${fq}회 초보자는 전신 운동이 근육마다 주 ${fq}번 자극을 줘서 가장 빨리 늘어요. 동작을 자주 반복하니 자세도 빨리 익어요.` };
  };
  E.rotation = () => {
    const s = S();
    const sp = E.splitId();
    const fq = s.settings.freq;
    if (sp === 'full' && fq <= 2) return ['FA', 'FB'];
    if (sp === 'ul' && fq >= 5) return ['UA', 'LA', 'CC', 'UB', 'LB'];
    return F.SPLIT_ROT[sp] || F.ROTATION[fq] || F.ROTATION[3];
  };

  /** Exercises of a template after this person's swaps (level-ups, sore-free choices, preferences). */
  E.templateEx = (tid) => {
    const t = F.TEMPLATES[tid]; if (!t) return [];
    const sw = (S().settings.swaps || {})[tid] || {};
    const out = [];
    for (const id of t.ex) { const x = sw[id] || id; if (F.EXERCISES[x] && !out.includes(x)) out.push(x); }
    return out;
  };
  E.groupOf = (id) => (F.GROUPS || []).find((g) => g.ladder.includes(id) || g.side.includes(id)) || null;
  E.swapOptions = (id) => { const g = E.groupOf(id); return g ? g.ladder.concat(g.side).filter((x) => F.EXERCISES[x]) : []; };
  /** Show `to` wherever `from` is shown in template tid (all = every template, used for level-ups). */
  E.swapEx = (tid, from, to, all) => {
    const s = S();
    s.settings.swaps = s.settings.swaps || {};
    for (const t of all ? Object.keys(F.TEMPLATES) : [tid]) {
      const T = F.TEMPLATES[t]; if (!T) continue;
      const sw = s.settings.swaps[t] || {};
      for (const orig of T.ex) if ((sw[orig] || orig) === from) { if (to === orig) delete sw[orig]; else sw[orig] = to; }
      if (Object.keys(sw).length) s.settings.swaps[t] = sw; else delete s.settings.swaps[t];
    }
    F.save();
  };
  E.resetSwaps = (tid) => { const s = S(); if (s.settings.swaps) delete s.settings.swaps[tid]; F.save(); };
  /** Beginner → intermediate: exercises handled well twice in a row can move one step up their ladder. */
  E.levelUps = () => {
    const ph = E.phase();
    const seen = new Set();
    const out = [];
    for (const tid of E.rotation()) for (const id of E.templateEx(tid)) {
      if (seen.has(id)) continue; seen.add(id);
      const g = E.groupOf(id); if (!g) continue;
      const i = g.ladder.indexOf(id); if (i < 0 || i >= g.ladder.length - 1) continue;
      const next = g.ladder[i + 1]; const nx = F.EXERCISES[next];
      if (!nx || (nx.level || 1) > ph.id + 1) continue;
      const st = S().ex[id]; if (!st || !st.hist) continue;
      const ses = st.hist.filter((h) => h.src === 'session').slice(-2);
      if (ses.length < 2 || ses.some((h) => h.rating === 'hard')) continue;
      out.push({ from: id, to: next, group: g.label,
        why: `${F.josa(F.EXERCISES[id].name, '을/를')} 최근 2번 안정적으로 해냈어요. 같은 근육을 쓰는 다음 단계 ${F.josa(nx.name, '으로/로')} 넘어갈 때예요.` });
    }
    return out;
  };
  /** Choose which routine a planned day gets (null = back to the automatic order). */
  E.setDayTemplate = (k, tid) => {
    const s = S();
    const ov = s.overrides[k];
    if (!tid) { if (ov) { delete ov.tpl; if (ov.type === 'tpl') delete s.overrides[k]; } }
    else if (ov) ov.tpl = tid;
    else s.overrides[k] = { type: 'tpl', tpl: tid };
    F.save(true);
  };

  /* Is date k a planned gym day (pattern or override)? returns override info */
  E.planFor = (k) => {
    const s = S();
    if (!s.profile || k < s.profile.startDate) return null;
    const ov = s.overrides[k];
    if (ov && ov.type === 'skip') return null;
    if (ov && ov.type === 'add') return { date: k, moved: true, from: ov.from, time: ov.time || s.settings.gymTime };
    if (s.settings.days.includes(F.dow(k))) return { date: k, moved: false, time: (s.settings.dayTimes && s.settings.dayTimes[F.dow(k)]) || s.settings.gymTime };
    return null;
  };

  /* Template for a date: completed sessions keep their template; future planned dates take
     the rotation in order starting from the next template. */
  E.templateFor = (k) => {
    const s = S();
    const ses = s.sessions[k];
    if (ses && ses.templateId && (ses.status === 'done' || ses.status === 'partial')) return ses.templateId;
    const own = s.overrides[k];
    if (own && own.tpl && F.TEMPLATES[own.tpl]) return own.tpl;
    const rot = E.rotation();
    const done = E.doneSessions().filter((x) => x.kind !== 'home' && F.TEMPLATES[x.templateId]);
    let idx = 0;
    if (done.length) {
      const lastT = done[done.length - 1].templateId;
      const li = rot.indexOf(lastT);
      idx = li >= 0 ? li + 1 : done.length;
    }
    // walk the planned, not-done dates between today and k: each takes the next routine,
    // and a day with a chosen routine restarts the cycle right after it
    const today = F.today();
    let cursor = today < k ? today : k;
    for (let i = 0; i < 60 && cursor < k; i++) {
      const pl = E.planFor(cursor);
      const sx = s.sessions[cursor];
      if (pl && !(sx && (sx.status === 'done' || sx.status === 'partial'))) {
        const o = s.overrides[cursor];
        idx = o && o.tpl && rot.includes(o.tpl) ? rot.indexOf(o.tpl) + 1 : idx + 1;
      }
      cursor = F.addDays(cursor, 1);
    }
    return rot[idx % rot.length];
  };

  /* Week view */
  E.week = (monday) => {
    const s = S();
    const today = F.today();
    return F.weekKeys(monday).map((k) => {
      const pl = E.planFor(k);
      const ses = s.sessions[k];
      const ov = s.overrides[k];
      let status = 'rest';
      if (ses && ses.status === 'done') status = 'done';
      else if (ses && ses.status === 'partial') status = 'partial';
      else if (pl) status = k < today ? 'missed' : k === today ? 'today' : 'planned';
      else if (ov && ov.type === 'skip') status = ov.to ? 'moved' : 'skipped';
      const tid = pl || (ses && ses.templateId) ? (ses && ses.templateId) || E.templateFor(k) : null;
      return { k, dow: F.dow(k), status, plan: pl, ses, ov, tid, time: pl ? pl.time : null };
    });
  };

  E.weekStats = (monday) => {
    const w = E.week(monday);
    const done = w.filter((d) => d.status === 'done' || d.status === 'partial');
    const weekdayDone = done.filter((d) => d.dow >= 1 && d.dow <= 5).length;
    const freq = S().settings.freq;
    const planned = w.filter((d) => d.plan).length;
    return { done: done.length, weekdayDone, freq, planned, goalMet: done.length >= freq && weekdayDone >= 2, weekdayOk: weekdayDone >= 2 };
  };

  E.streakWeeks = () => {
    const p = S().profile; if (!p) return 0;
    let m = F.mondayOf(F.today());
    let n = 0;
    // current week counts only if already met
    if (E.weekStats(m).goalMet) n++;
    m = F.addDays(m, -7);
    while (m >= F.mondayOf(p.startDate)) {
      if (E.weekStats(m).goalMet) n++; else break;
      m = F.addDays(m, -7);
    }
    return n;
  };

  E.nextPlanned = (fromK) => {
    let k = fromK || F.today();
    for (let i = 0; i < 21; i++) {
      const ses = S().sessions[k];
      if (E.planFor(k) && !(ses && (ses.status === 'done' || ses.status === 'partial'))) return k;
      k = F.addDays(k, 1);
    }
    return null;
  };

  /* =========================================================
     RESCHEDULE
     ========================================================= */
  E.rescheduleOptions = (fromK) => {
    const s = S();
    const today = F.today();
    const monday = F.mondayOf(fromK);
    const days = F.weekKeys(monday);
    const rot = E.rotation();
    const split = s.settings.freq >= 4;
    const tid = E.templateFor(fromK);
    const region = (F.TEMPLATES[tid] || {}).region || 'full';
    const sessionDays = days.filter((k) => k !== fromK && (E.planFor(k) || (s.sessions[k] && s.sessions[k].status !== undefined)));
    const regionOf = (k) => { const t = F.TEMPLATES[E.templateFor(k)]; return t ? t.region : 'full'; };
    const weekdayBase = sessionDays.filter((k) => F.isWeekday(k)).length;
    const opts = [];
    for (const c of days) {
      if (c === fromK || c < today || sessionDays.includes(c)) continue;
      let score = 100;
      const why = [];
      const warn = [];
      const dist = Math.abs(F.diffDays(fromK, c));
      score -= dist * 6;
      if (c > fromK) { score += 4; why.push(`원래 날짜에서 ${dist}일 뒤로 미뤄요`); }
      else why.push(`원래 날짜보다 ${dist}일 앞당겨요`);
      const nb = sessionDays.filter((k) => Math.abs(F.diffDays(k, c)) === 1);
      if (nb.length) {
        if (!split || region === 'full' || region === 'cardio') {
          if (region === 'cardio') { score -= 5; why.push('유산소+코어라 연속일이어도 부담이 적어요'); }
          else { score -= 35; warn.push('전신 운동이 이틀 연속이에요 → 세트를 1개씩 줄여 회복을 지켜요'); }
        } else {
          const same = nb.some((k) => regionOf(k) === region);
          if (same) { score -= 35; warn.push('같은 부위가 이틀 연속이에요 → 볼륨을 줄여요'); }
          else { score -= 3; why.push('앞뒤 날과 다른 부위라 회복에 문제 없어요'); }
        }
      } else why.push('앞뒤로 쉬는 날이 있어 회복 48시간이 보장돼요');
      const wkCount = weekdayBase + (F.isWeekday(c) ? 1 : 0);
      if (wkCount < 2) { score -= 50; warn.push('이 날로 옮기면 주중 출석이 2회 미만이 돼요'); }
      else if (F.isWeekday(c)) { score += 6; why.push('주중 출석 원칙(최소 2회)을 지켜요'); }
      else why.push('주말이지만 주중 2회는 이미 확보돼 있어요');
      opts.push({ date: c, score, why, warn, consecutive: nb.length > 0 });
    }
    opts.sort((a, b) => b.score - a.score);
    return { from: fromK, tid, best: opts[0] || null, options: opts.slice(0, 4), weekdayBase };
  };

  E.applyReschedule = (fromK, toK, reason) => {
    const s = S();
    const time = (E.planFor(fromK) || {}).time || s.settings.gymTime;
    // if fromK itself was an added day, drop it instead of stacking overrides
    if (s.overrides[fromK] && s.overrides[fromK].type === 'add') delete s.overrides[fromK];
    else s.overrides[fromK] = { type: 'skip', to: toK || null, reason: reason || '' };
    if (toK) {
      if (s.overrides[toK] && s.overrides[toK].type === 'skip') delete s.overrides[toK];
      if (!E.planFor(toK)) s.overrides[toK] = { type: 'add', from: fromK, time };
    }
    F.save();
  };

  E.undoOverride = (k) => {
    const s = S();
    const ov = s.overrides[k];
    if (!ov) return;
    if (ov.type === 'skip' && ov.to && s.overrides[ov.to] && s.overrides[ov.to].type === 'add') delete s.overrides[ov.to];
    if (ov.type === 'add' && ov.from && s.overrides[ov.from]) delete s.overrides[ov.from];
    delete s.overrides[k];
    F.save();
  };

  /* =========================================================
     LOADS & PROGRESSION
     ========================================================= */
  const MAIN = ['leg_press', 'goblet_squat', 'deadlift', 'hip_thrust', 'chest_press', 'db_bench', 'lat_pulldown', 'seated_row', 'back_squat', 'bench_press', 'barbell_row', 'ohp', 'assisted_pullup'];
  E.MAIN = MAIN;
  const DB_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50];

  E.roundLoad = (ex, x) => {
    if (!isFinite(x)) x = 0;
    if (ex.equip === 'dumbbell') {
      let best = DB_STEPS[0];
      for (const v of DB_STEPS) if (Math.abs(v - x) < Math.abs(best - x) || (Math.abs(v - x) === Math.abs(best - x) && v < best)) best = v;
      return best;
    }
    const inc = ex.inc || 2.5;
    const min = ex.equip === 'barbell' ? 20 : inc;
    if (ex.id === 'hip_thrust' || ex.id === 'deadlift') return Math.max(20, Math.round(x / 2.5) * 2.5);
    return Math.max(min, Math.round(x / inc) * inc);
  };
  E.stepLoad = (ex, w, dir) => {
    if (ex.equip === 'dumbbell') {
      const i = DB_STEPS.findIndex((v) => v >= w - 1e-9);
      const j = F.clamp((i < 0 ? DB_STEPS.length - 1 : i) + dir, 0, DB_STEPS.length - 1);
      return DB_STEPS[j];
    }
    const inc = ex.inc || 2.5;
    return Math.max(ex.equip === 'barbell' ? 20 : inc, Math.round((w + dir * inc) / (inc / 2)) * (inc / 2));
  };

  E.rangeFor = (ex, ph) => {
    if (ex.unit === 'sec') return ph.id === 1 ? [20, 30] : ph.id === 2 ? [30, 45] : [40, 60];
    if (ex.unit === 'bw') return ex.repsUnit && ex.repsUnit.includes('한쪽') ? (ph.id === 1 ? [6, 8] : ph.id === 2 ? [8, 10] : [10, 12]) : ph.id === 1 ? [6, 10] : ph.id === 2 ? [8, 12] : [10, 15];
    return ph.reps;
  };
  E.setsFor = (exId, ph) => {
    const ex = F.EXERCISES[exId];
    if (ex.unit === 'sec' || ex.unit === 'bw') return ph.id === 1 ? 2 : 3;
    return ph.sets + (ph.id === 3 && MAIN.includes(exId) ? 1 : 0);
  };
  E.restFor = (exId, ph) => {
    const ex = F.EXERCISES[exId];
    if (ex.unit === 'sec' || ex.unit === 'bw') return 45;
    return ph.rest + (MAIN.includes(exId) ? 15 : 0);
  };
  E.isLoaded = (ex) => ex.unit === 'kg' || ex.unit === 'kg_each';

  E.exState = (exId) => {
    const s = S();
    const ex = F.EXERCISES[exId];
    const ph = E.phase();
    const [lo] = E.rangeFor(ex, ph);
    let st = s.ex[exId];
    if (!st) {
      const sex = (s.profile && s.profile.sex) || 'm';
      st = s.ex[exId] = { w: E.isLoaded(ex) && ex.start ? E.roundLoad(ex, ex.start[sex] != null ? ex.start[sex] : ex.start.m) : null, r: lo, phase: ph.id, hist: [], cal: null, hard: 0 };
    }
    if (st.phase !== ph.id) {
      // convert load across phases with the e1RM relation so effort stays similar
      const old = F.PHASES[st.phase - 1] || ph;
      if (E.isLoaded(ex) && st.w) {
        const e1 = st.w * (1 + (st.r + old.rir) / 30);
        st.w = E.roundLoad(ex, e1 / (1 + (lo + ph.rir) / 30));
      }
      st.r = lo; st.phase = ph.id;
    }
    return st;
  };

  E.prescription = (exId) => {
    const ex = F.EXERCISES[exId];
    const ph = E.phase();
    const st = E.exState(exId);
    const range = E.rangeFor(ex, ph);
    return { exId, ex, w: st.w, r: st.r, sets: E.setsFor(exId, ph), rest: E.restFor(exId, ph), range, unit: ex.unit, calibrated: !!st.cal, ph };
  };

  E.loadLabel = (ex, w) => {
    if (!E.isLoaded(ex) || w == null) return ex.unit === 'sec' ? '맨몸' : '맨몸';
    if (ex.unit === 'kg_each') return `${F.num1(w)}kg ×2`;
    if (ex.assist) return `보조 ${F.num1(w)}kg`;
    return `${F.num1(w)}kg`;
  };
  E.repsLabel = (ex, r) => (ex.unit === 'sec' ? `${r}초` : ex.repsUnit && ex.repsUnit.includes('한쪽') ? `${r}회(한쪽)` : `${r}회`);

  const RIR = { easy: 5, good: 2, hard: 0 };
  E.RATING = {
    easy: { label: '할만했다', en: 'EASY', desc: '여유가 4회 이상 남았어요' },
    good: { label: '조금 어려웠다', en: 'GOOD', desc: '마지막 1~2회가 힘들었어요' },
    hard: { label: '너무 힘들었다', en: 'HARD', desc: '자세가 무너지거나 겨우 했어요' },
  };

  /** Calibration test: user tried w × r and rated it. */
  E.calibrate = (exId, w, r, rating) => {
    const ex = F.EXERCISES[exId];
    const ph = E.phase();
    const st = E.exState(exId);
    const [lo, hi] = E.rangeFor(ex, ph);
    const rir = RIR[rating];
    const explain = [];
    let nw = st.w, nr = lo;
    if (ex.assist) {
      // help weight: easy → less help, hard → more help
      nw = rating === 'easy' ? E.stepLoad(ex, w, -2) : rating === 'good' ? w : E.stepLoad(ex, w, +1);
      nr = lo;
      explain.push(`보조 ${F.num1(w)}kg로 ${r}회를 '${E.RATING[rating].label}'로 평가했어요`);
      explain.push(rating === 'easy' ? `보조를 ${F.num1(w - nw)}kg 줄여요 — 보조가 적을수록 내 힘으로 더 많이 당겨요` : rating === 'good' ? '지금 보조 무게가 딱 맞아요 — 그대로 진행해요' : `보조를 ${F.num1(nw - w)}kg 늘려 자세부터 익혀요`);
    } else if (E.isLoaded(ex)) {
      const e1 = w * (1 + (r + rir) / 30);
      nw = E.roundLoad(ex, e1 / (1 + (lo + ph.rir) / 30));
      explain.push(`${E.loadLabel(ex, w)} × ${r}회를 '${E.RATING[rating].label}'(여유 약 ${rir}회)로 평가 → 추정 최대근력(1RM) ${F.num1(ex.unit === 'kg_each' ? e1 : e1)}kg${ex.unit === 'kg_each' ? ' (한 손)' : ''}`);
      explain.push(`${ph.name} 목표는 ${lo}~${hi}회, 여유 ${ph.rir}회 → ${E.loadLabel(ex, nw)} × ${lo}회가 딱 맞아요`);
      if (nw > w) explain.push(`테스트보다 ${F.num1(nw - w)}kg 올렸어요 — 지금 무게는 근육에 충분한 자극이 안 돼요`);
      else if (nw < w) explain.push(`테스트보다 ${F.num1(w - nw)}kg 낮췄어요 — 목표 횟수를 좋은 자세로 채우는 게 먼저예요`);
      else explain.push('지금 무게가 딱 맞아요 — 그대로 진행해요');
      st.e1 = Math.round(e1 * 10) / 10;
    } else {
      const f = { easy: 1.0, good: 0.85, hard: 0.7 }[rating];
      nr = F.clamp(Math.round(r * f), lo, hi + (ex.unit === 'sec' ? 20 : 5));
      if (ex.unit === 'sec') nr = Math.round(nr / 5) * 5;
      explain.push(`${E.repsLabel(ex, r)}을(를) '${E.RATING[rating].label}'로 평가 → 목표 ${E.repsLabel(ex, nr)}로 맞췄어요`);
    }
    st.w = nw; st.r = nr; st.cal = F.today(); st.hard = 0; st.phase = ph.id;
    st.hist.push({ d: F.today(), w, r, rating, src: 'test' });
    F.save();
    return { w: nw, r: nr, sets: E.setsFor(exId, ph), explain };
  };

  /** A day the member chose to go lighter: keep the history, leave the prescription as it was. */
  E.recordLight = (exId, perf, rating) => {
    const st = E.exState(exId);
    const reps = perf.reps.filter((x) => x != null);
    st.hist.push({ d: F.today(), w: perf.w != null ? perf.w : st.w, r: reps.length ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : st.r, reps, rating, src: 'light' });
    if (st.hist.length > 60) st.hist = st.hist.slice(-60);
    F.save();
    return { prev: { w: st.w, r: st.r }, next: { w: st.w, r: st.r }, dir: 'same', msg: '컨디션을 낮춘 날이라 다음 무게는 원래대로 둘게요. 오늘은 나온 것만으로 충분해요.' };
  };

  /** After the last set of an exercise in a session. perf = {w, reps:[..]} */
  E.applyRating = (exId, perf, rating) => {
    const ex = F.EXERCISES[exId];
    const ph = E.phase();
    const st = E.exState(exId);
    const [lo, hi] = E.rangeFor(ex, ph);
    const target = st.r;
    const reps = perf.reps.filter((x) => x != null);
    const allHit = reps.length > 0 && reps.every((x) => x >= target);
    const prev = { w: st.w, r: st.r };
    let w = E.isLoaded(ex) ? (perf.w != null ? perf.w : st.w) : null;
    let r = target;
    let msg = '', dir = 'same';
    const isBW = !E.isLoaded(ex);
    const step = ex.unit === 'sec' ? 5 : 1;
    if (ex.assist) {
      // assisted machine: less help = harder
      if (rating === 'easy') { st.hard = 0; w = E.stepLoad(ex, w, -1); msg = `할만했다면 보조를 줄일 때예요! 다음엔 보조 ${F.num1(w)}kg × ${r}회.`; dir = 'up'; }
      else if (rating === 'good') { st.hard = 0; if (allHit) { r += 1; if (r > hi) { w = E.stepLoad(ex, w, -1); r = lo; msg = `최대 반복 달성! 다음엔 보조를 ${F.num1(w)}kg로 줄여요.`; } else msg = `딱 좋아요. 같은 보조로 ${r}회에 도전해요.`; dir = 'up'; } else msg = `적정 강도예요. 모든 세트 ${target}회가 다음 목표예요.`; }
      else { w = E.stepLoad(ex, w, +1); r = lo; st.hard = 0; dir = 'down'; msg = `오늘은 버거웠어요. 다음엔 보조를 ${F.num1(w)}kg로 늘려 자세부터 다져요.`; }
      st.w = w; st.r = r;
      st.hist.push({ d: F.today(), w: perf.w != null ? perf.w : prev.w, r: reps.length ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : target, reps, rating, src: 'session' });
      if (st.hist.length > 60) st.hist = st.hist.slice(-60);
      F.save();
      return { prev, next: { w, r }, msg, dir };
    }
    if (rating === 'easy') {
      st.hard = 0;
      if (isBW) { r = Math.min(hi + (ex.unit === 'sec' ? 30 : 6), r + step * 2); msg = `여유가 있었네요! 다음엔 ${E.repsLabel(ex, r)}로 늘려요.`; dir = 'up'; }
      else {
        const nw = E.stepLoad(ex, w, +1);
        if ((nw - w) / w > 0.15 && r + 2 <= hi) { r += 2; msg = `무게 단위가 커서 먼저 횟수를 ${r}회로 늘려요. 다 채우면 ${E.loadLabel(ex, nw)}로 올라가요.`; dir = 'up'; }
        else { w = nw; if (r >= hi) r = lo; msg = `할만했다면 올릴 때예요! 다음엔 ${E.loadLabel(ex, w)} × ${r}회.`; dir = 'up'; }
      }
    } else if (rating === 'good') {
      st.hard = 0;
      if (allHit) {
        r += step;
        if (r > hi) {
          if (isBW) { r = hi + step; msg = `목표 범위를 넘었어요. 다음엔 ${E.repsLabel(ex, r)} — 더 어려운 버전도 시도해 보세요.`; }
          else { w = E.stepLoad(ex, w, +1); r = lo; msg = `최대 반복 달성! 다음엔 ${E.loadLabel(ex, w)} × ${lo}회부터 다시 쌓아요.`; }
        } else msg = `딱 좋은 강도예요. 같은 무게로 ${E.repsLabel(ex, r)}에 도전해요.`;
        dir = 'up';
      } else msg = `적정 강도예요. 목표 ${E.repsLabel(ex, target)}를 모든 세트에서 채우는 게 다음 목표예요.`;
    } else {
      st.hard = (st.hard || 0) + 1;
      if (!allHit || st.hard >= 2) {
        if (isBW) { r = Math.max(Math.round(lo * 0.8), r - step * 2); msg = `무리하지 말아요. 다음엔 ${E.repsLabel(ex, r)}로 줄여 자세를 지켜요.`; }
        else {
          const cut = Math.max(E.stepLoad(ex, w, -1), E.roundLoad(ex, w * 0.9));
          w = Math.min(w, cut); if (w === prev.w) w = E.stepLoad(ex, w, -1);
          r = lo; msg = `오늘은 무게가 버거웠어요. 다음엔 ${E.loadLabel(ex, w)} × ${lo}회로 낮춰 자세부터 다져요.`;
        }
        st.hard = 0; dir = 'down';
      } else msg = '힘들었지만 목표는 채웠어요. 같은 조건으로 한 번 더 — 몸이 적응하면 쉬워져요.';
    }
    st.w = w; st.r = r;
    st.hist.push({ d: F.today(), w: perf.w != null ? perf.w : prev.w, r: reps.length ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : target, reps, rating, src: 'session' });
    if (st.hist.length > 60) st.hist = st.hist.slice(-60);
    F.save();
    return { prev, next: { w, r }, msg, dir };
  };

  /* =========================================================
     CARDIO
     ========================================================= */
  E.cardioState = (machine) => {
    const s = S();
    if (!s.cardio[machine]) {
      const b = E.body();
      let L = b.bmi >= 35 ? 1 : b.bmi >= 30 ? 2 : b.bmi >= 27 ? 3 : 4;
      if (b.age >= 50) L = Math.max(1, L - 1);
      s.cardio[machine] = { level: L, hist: [] };
    }
    return s.cardio[machine];
  };

  E.cardioKcal = (machine, cfg, min, kg) => {
    if (machine === 'treadmill') {
      const S_ = (cfg.speed * 1000) / 60; // m/min
      const vo2 = 0.1 * S_ + 1.8 * S_ * (cfg.incline / 100) + 3.5; // ACSM walking equation
      return Math.round(((vo2 * kg) / 1000) * 5 * min);
    }
    return Math.round(((cfg.met * 3.5 * kg) / 200) * min);
  };

  E.cardioPlan = (k, tid, o = {}) => {
    const s = S();
    const ph = E.phase();
    let machine = o.machine || s.settings.cardio || 'treadmill';
    const M = F.CARDIO[machine];
    if (M.minPhase && ph.id < M.minPhase) machine = 'treadmill';
    const st = E.cardioState(machine);
    const L = F.clamp(Math.floor(st.level) + (o.dl || 0), 1, ph.cardioMax);
    const cfg = F.CARDIO[machine].levels[L];
    const t = F.TEMPLATES[tid] || {};
    let min = cfg.min;
    if (t.longCardio) min += 15;
    if (s.settings.freq === 2) min += 10;
    min = Math.min(min, 60);
    if (o.min != null) min = o.min;
    const b = E.body();
    const hr = E.hrZone(b.age || 30);
    const kcal = E.cardioKcal(machine, cfg, min, b.weight);
    let main;
    if (machine === 'treadmill') main = `경사 ${cfg.incline}% · 속도 ${cfg.speed.toFixed(1)}km/h`;
    else if (machine === 'bike') main = `저항 ${cfg.level} · ${cfg.rpm} RPM`;
    else if (machine === 'elliptical') main = `저항 ${cfg.level} · 경사 ${cfg.ramp}`;
    else main = `레벨 ${cfg.level}`;
    const warm = machine === 'treadmill' ? '경사 0~2% · 4.0km/h' : machine === 'stairmill' ? '레벨 1 · 천천히' : '저항 2~3 · 가볍게';
    const cool = machine === 'treadmill' ? '경사 0% · 3.5~4.0km/h' : '저항 1~2 · 천천히';
    const segments = [
      { label: '워밍업', min: 3, text: warm },
      { label: '메인', min: Math.max(5, min - 5), text: main },
      { label: '쿨다운', min: 2, text: cool },
    ];
    return { machine, M: F.CARDIO[machine], level: L, cfg, min, kcal, hr, main, segments, capped: Math.floor(st.level) > ph.cardioMax };
  };

  E.applyCardioRating = (machine, rating, minDone, minPlan) => {
    const st = E.cardioState(machine);
    const ph = E.phase();
    const before = Math.floor(st.level);
    let d = rating === 'easy' ? 1 : rating === 'good' ? 0.5 : -1;
    if (minDone < minPlan * 0.8 && rating !== 'easy') d = Math.min(d, -0.5);
    st.level = F.clamp(st.level + d, 1, 12);
    st.hist.push({ d: F.today(), rating, min: minDone, level: before });
    if (st.hist.length > 60) st.hist = st.hist.slice(-60);
    F.save();
    const after = F.clamp(Math.floor(st.level), 1, ph.cardioMax);
    const cfg = F.CARDIO[machine].levels[after];
    let msg;
    if (after > before) msg = '다음 유산소는 한 단계 올려요';
    else if (after < before) msg = '다음 유산소는 한 단계 낮춰 꾸준함을 지켜요';
    else msg = rating === 'good' ? '좋아요! 한 번 더 이 강도로 하면 다음 단계로 올라가요' : '같은 강도로 한 번 더 적응해요';
    return { before, after, cfg, msg };
  };

  /* =========================================================
     SESSION BUILDER
     ========================================================= */
  /* Today's condition → what a trainer would change (sets, load, exercise count, cardio). */
  const COND = {
    great: { w: 1, main: +1, acc: 0, keep: 99, cardio: +5, dl: 0 },
    normal: { w: 1, main: 0, acc: 0, keep: 99, cardio: 0, dl: 0 },
    tired: { w: 0.9, main: 0, acc: -1, keep: 99, cardio: -5, dl: -1 },
    bad: { w: 0.8, main: -9, acc: -9, keep: 3, cardio: null, dl: -2 },
  };
  E.COND = COND;
  const lighter = (ex, w, f) => {
    if (w == null || f >= 1) return w;
    if (ex.assist) return E.stepLoad(ex, w, f <= 0.8 ? +2 : +1); // more help = lighter
    let nw = E.roundLoad(ex, w * f);
    if (nw >= w) nw = E.stepLoad(ex, w, -1);
    return Math.min(nw, w);
  };
  /** The day's plan after condition, sore areas and time. o = {cond, sore:[], time:'full'|'short'} */
  E.sessionPlan = (k, tid, o = {}) => {
    const cond = COND[o.cond] ? o.cond : 'normal';
    const fx = COND[cond];
    const sore = o.sore || [];
    const short = o.time === 'short';
    const t = F.TEMPLATES[tid] || {};
    const notes = [];
    const swaps = [];
    const removed = [];
    const consecutive = (() => { // a full-body day right after another session gets one set less
      const ys = S().sessions[F.addDays(k, -1)];
      return t.region === 'full' && !!ys && (ys.status === 'done' || ys.status === 'partial');
    })();
    // sore areas: swap to a safe exercise for the same day, or leave it out
    let list = [];
    for (const id of E.templateEx(tid)) {
      let x = id;
      for (const a of sore) {
        const m = (F.SORE_SWAP || {})[a] || {};
        if (Object.prototype.hasOwnProperty.call(m, x)) { const to = m[x]; if (to) swaps.push({ from: x, to, area: a }); else removed.push({ id: x, area: a }); x = to; if (!x) break; }
      }
      if (x && F.EXERCISES[x] && !list.includes(x)) list.push(x);
    }
    const keep = Math.min(fx.keep, short ? (cond === 'bad' ? 3 : 4) : 99);
    if (list.length > keep) { for (const id of list.slice(keep)) removed.push({ id, why: short ? 'time' : 'cond' }); list = list.slice(0, keep); }
    const items = list.map((id, i) => {
      const pr = E.prescription(id);
      const ex = pr.ex;
      const isMain = i < 2;
      let sets = pr.sets - (consecutive ? 1 : 0);
      if (cond === 'bad') sets = Math.min(2, sets);
      else sets += isMain ? fx.main : fx.acc;
      if (short) sets = Math.min(2, sets);
      sets = F.clamp(sets, 1, 5);
      const w = E.isLoaded(ex) ? lighter(ex, pr.w, fx.w) : pr.w;
      return { exId: id, w, r: pr.r, sets, rest: short ? Math.max(45, pr.rest - 15) : pr.rest, base: { w: pr.w, sets: pr.sets } };
    });
    let machine = null;
    if (sore.includes('knee')) machine = 'bike';
    const cp0 = E.cardioPlan(k, tid, { machine });
    let cmin = cp0.min;
    if (cond === 'bad') cmin = 15;
    else cmin += fx.cardio;
    if (short) cmin = Math.min(cmin, 10);
    cmin = F.clamp(cmin, 10, 60);
    if (cond === 'great') notes.push('컨디션 최고 — 메인 2종목 1세트씩 추가, 유산소 +5분');
    if (cond === 'tired') notes.push('피곤한 날 — 무게 10%↓, 보조 운동 1세트↓, 유산소 -5분 · 가볍게');
    if (cond === 'bad') notes.push('컨디션 나쁜 날 — 무게 20%↓, 3종목 · 2세트만, 가벼운 유산소 15분');
    if (short) notes.push('짧게 — 4종목 이내 · 2세트 · 유산소 10분');
    if (consecutive) notes.push('어제도 운동해서 세트를 1개씩 줄였어요');
    return { items, cardio: { machine: machine || cp0.machine, min: cmin, dl: fx.dl || 0 }, notes, swaps, removed, consecutive, cond, sore, time: short ? 'short' : 'full' };
  };

  E.buildSession = (k, tid, o = {}) => {
    const plan = E.sessionPlan(k, tid, o);
    const short = plan.time === 'short';
    const steps = [];
    if (!o.noCheck) steps.push({ type: 'check' });
    steps.push({ type: 'warmup', exId: 'warmup', dur: (short ? 4 : 6) * 60 });
    for (const it of plan.items) {
      steps.push({ type: 'form', exId: it.exId });
      for (let i = 1; i <= it.sets; i++) steps.push({ type: 'set', exId: it.exId, set: i, of: it.sets, w: it.w, r: it.r, rest: it.rest });
      steps.push({ type: 'rate', exId: it.exId });
    }
    steps.push({ type: 'cardio', machine: plan.cardio.machine, min: plan.cardio.min, dl: plan.cardio.dl });
    steps.push({ type: 'cooldown', exId: 'cooldown', dur: (short ? 3 : 5) * 60 });
    steps.push({ type: 'done' });
    return { date: k, templateId: tid, steps, i: 0, log: {}, startedAt: Date.now(), consecutive: plan.consecutive,
      cond: plan.cond, sore: plan.sore, time: plan.time, notes: plan.notes, swaps: plan.swaps, removed: plan.removed, exIds: plan.items.map((x) => x.exId) };
  };

  E.estimateMinutes = (tid, o) => {
    if (!F.TEMPLATES[tid]) return 0;
    const plan = E.sessionPlan(F.today(), tid, o || {});
    let sec = (plan.time === 'short' ? 7 : 11) * 60;
    for (const it of plan.items) sec += it.sets * (45 + it.rest) + 90;
    sec += plan.cardio.min * 60;
    return Math.round(sec / 60 / 5) * 5;
  };

  /* =========================================================
     XP · LEVELS · BADGES
     ========================================================= */
  E.xpTotal = () => { const s = S(); return s.xpTotal || (s.xp || []).reduce((a, x) => a + x.xp, 0); };
  E.lvThreshold = (n) => (150 * n * (n - 1)) / 2;
  E.level = (xp) => {
    xp = xp == null ? E.xpTotal() : xp;
    let n = 1;
    while (E.lvThreshold(n + 1) <= xp) n++;
    const cur = xp - E.lvThreshold(n), need = E.lvThreshold(n + 1) - E.lvThreshold(n);
    let title = F.LEVEL_TITLES[0][1];
    for (const [lv, t] of F.LEVEL_TITLES) if (n >= lv) title = t;
    return { lv: n, title, xp, cur, need, pct: cur / need };
  };
  /** add XP once per idempotency key */
  E.addXP = (key, xp, note, d) => {
    const s = S();
    if (key && s.xpKeys[key]) return 0;
    if (key) s.xpKeys[key] = 1;
    if (!s.xpTotal) s.xpTotal = (s.xp || []).reduce((a, x) => a + x.xp, 0);
    s.xpTotal += xp;
    s.xp.push({ d: d || F.today(), k: key || 'misc', xp, note });
    if (s.xp.length > 80) s.xp = s.xp.slice(-80);
    F.save();
    return xp;
  };

  E.cardioMinutesTotal = () => Object.values(S().sessions).reduce((a, s) => a + ((s && s.cardioMin) || 0), 0);

  E.checkBadges = () => {
    const s = S();
    const earned = [];
    const give = (id) => { if (!s.badges[id]) { s.badges[id] = F.today(); earned.push(id); } };
    const n = E.doneSessions().length;
    if (n >= 1) give('first_session');
    if (n >= 10) give('sessions10');
    if (n >= 30) give('sessions30');
    if (n >= 50) give('sessions50');
    if (Object.values(s.ex).some((x) => x.cal)) give('first_test');
    const cm = E.cardioMinutesTotal();
    if (cm >= 300) give('cardio300');
    if (cm >= 1000) give('cardio1000');
    const ib = E.sortedInbody();
    if (ib.length >= 1) give('inbody1');
    if (ib.length >= 3) give('inbody3');
    if (s.profile) {
      const loss = s.profile.weight - E.body().weight;
      if (loss >= 3) give('loss3');
      if (loss >= 5) give('loss5');
      if (loss >= 10) give('loss10');
    }
    if (ib.length >= 2) {
      const a = ib[0], b = ib[ib.length - 1];
      if (a.pbf != null && b.pbf != null && a.pbf - b.pbf >= 3) give('pbf3');
      if (a.smm != null && b.smm != null && b.smm >= a.smm && b.weight < a.weight) give('smm_up');
    }
    // weekly
    const m = F.mondayOf(F.today());
    for (let i = 0; i < 2; i++) {
      const ws = E.weekStats(F.addDays(m, -7 * i));
      if (ws.goalMet) give('week_goal');
      if (ws.weekdayDone >= 2) give('weekday2');
    }
    const st = E.streakWeeks();
    if (st >= 4) give('streak4');
    if (st >= 8) give('streak8');
    if (Object.values(s.sessions).some((x) => x && x.moved && (x.status === 'done' || x.status === 'partial'))) give('comeback');
    const mealDays = Object.values(s.meals).filter((r) => r && ((r.checks && Object.values(r.checks).filter(Boolean).length >= 4) || (r.done && Object.values(r.done).filter(Boolean).length >= 3))).length;
    if (mealDays >= 7) give('meal7');
    if (earned.length) F.save();
    return earned;
  };

  /** Awards XP for a completed session (idempotent per date). Returns breakdown. */
  E.awardSession = (rec) => {
    const k = rec.date;
    const items = [];
    const add = (key, xp, note) => { const got = E.addXP(key, xp, note, k); if (got) items.push({ xp: got, note }); };
    if (rec.kind === 'home') { add(`home:${k}`, 60, '홈 대체 운동'); }
    else {
      add(`ses:${k}`, rec.status === 'done' ? 100 : 50, rec.status === 'done' ? '세션 완료' : '세션 부분 완료');
      if (rec.exDone) add(`exs:${k}`, rec.exDone * 10, `운동 ${rec.exDone}종목 × 10`);
      if (rec.cardioMin) add(`car:${k}`, 30 + Math.max(0, Math.floor((rec.cardioMin - 20) / 10)) * 5, `유산소 ${rec.cardioMin}분`);
      if (rec.planned) add(`kept:${k}`, 20, '예정일 출석');
      if (rec.moved) add(`moved:${k}`, 30, '대체일 출석 — 포기하지 않았어요');
    }
    const m = F.mondayOf(k);
    const ws = E.weekStats(m);
    if (ws.weekdayDone >= 2) add(`wk2:${m}`, 50, '주중 2회 출석 달성');
    if (ws.goalMet) {
      add(`wkgoal:${m}`, 100, '주간 목표 달성');
      const st = E.streakWeeks();
      if (st >= 2) add(`streak:${m}`, Math.min(200, 20 * st), `${st}주 연속 달성 보너스`);
    }
    return items;
  };

  /* =========================================================
     INBODY ANALYSIS
     ========================================================= */
  E.METRICS = {
    weight: { label: '체중', unit: 'kg', dec: 1, good: 'down' },
    smm: { label: '골격근량', unit: 'kg', dec: 1, good: 'up' },
    bfm: { label: '체지방량', unit: 'kg', dec: 1, good: 'down' },
    pbf: { label: '체지방률', unit: '%', dec: 1, good: 'down' },
    bmi: { label: 'BMI', unit: '', dec: 1, good: 'down' },
    vfl: { label: '내장지방 레벨', unit: '', dec: 0, good: 'down' },
    bmr: { label: '기초대사량', unit: 'kcal', dec: 0, good: 'up' },
    score: { label: '인바디 점수', unit: '점', dec: 0, good: 'up' },
  };

  E.inbodyAnalysis = () => {
    const list = E.sortedInbody();
    if (!list.length) return null;
    const p = S().profile || {};
    const last = list[list.length - 1], prev = list.length > 1 ? list[list.length - 2] : null, first = list[0];
    const d = (a, b, key) => (a && b && a[key] != null && b[key] != null ? a[key] - b[key] : null);
    const deltas = {};
    for (const key of Object.keys(E.METRICS)) deltas[key] = { prev: d(last, prev, key), first: d(last, first, key) };
    const insights = [];
    const sex = p.sex || 'm';
    // weight pace
    if (prev) {
      const days = Math.max(1, F.diffDays(prev.date, last.date));
      const dw = last.weight - prev.weight;
      const perWeekPct = (dw / prev.weight) * 100 / (days / 7);
      if (dw < 0) {
        if (perWeekPct <= -1.2) insights.push({ lv: 'warn', title: '감량 속도가 너무 빨라요', body: `주당 ${F.num1(-perWeekPct)}% 감량 중이에요. 근손실 위험이 커요 — 하루 100~150kcal를 늘리고 단백질을 꼭 채우세요.`, act: { kcalAdj: 150 } });
        else if (perWeekPct <= -0.4) insights.push({ lv: 'good', title: '이상적인 감량 속도', body: `${days}일 동안 ${F.num1(-dw)}kg 감량 (주당 ${F.num1(-perWeekPct)}%). 근육을 지키며 빼는 최적 구간(주 0.5~1%)이에요.` });
        else insights.push({ lv: 'info', title: '감량이 조금 느려요', body: `주당 ${F.num1(-perWeekPct)}% 감량 중이에요. 하루 100kcal를 줄이거나 유산소를 10분 늘려보세요.`, act: { kcalAdj: -100 } });
      } else {
        insights.push({ lv: 'warn', title: '체중이 정체/증가했어요', body: `${days}일 동안 ${F.signed(dw)}kg. 주말 외식·음주·간식을 점검하고, 하루 150kcal 줄이기를 추천해요.`, act: { kcalAdj: -150 } });
      }
      // fat ratio of loss
      if (dw < -0.3 && last.bfm != null && prev.bfm != null) {
        const ratio = (last.bfm - prev.bfm) / dw;
        if (ratio >= 0.75) insights.push({ lv: 'good', title: `감량의 ${Math.round(Math.min(1, ratio) * 100)}%가 지방`, body: '빠진 체중 대부분이 지방이에요. 근력 운동과 단백질 섭취가 제대로 작동하고 있어요.' });
        else if (ratio >= 0.5) insights.push({ lv: 'info', title: `감량의 ${Math.round(ratio * 100)}%가 지방`, body: '수분·근육 비중이 조금 있어요. 근력 운동 무게를 꾸준히 올리고 단백질을 체중 1kg당 1.4g 이상 지켜요.' });
        else insights.push({ lv: 'warn', title: `감량의 ${Math.round(Math.max(0, ratio) * 100)}%만 지방`, body: '근육·수분 손실 비중이 커요. 칼로리 적자를 줄이고(+150kcal) 근력 운동 출석을 우선하세요.', act: { kcalAdj: 150 } });
      }
      const dsmm = d(last, prev, 'smm');
      if (dsmm != null) {
        if (dsmm >= 0) insights.push({ lv: 'good', title: `골격근량 ${F.signed(dsmm)}kg`, body: '감량 중에 근육을 지키거나 늘렸어요. 기초대사량을 지키는 가장 중요한 지표예요.' });
        else if (dsmm > -0.5) insights.push({ lv: 'info', title: `골격근량 ${F.signed(dsmm)}kg`, body: '측정 오차 수준의 작은 감소예요. 단백질과 근력 운동 강도를 유지하세요.' });
        else insights.push({ lv: 'warn', title: `골격근량 ${F.signed(dsmm)}kg`, body: '근육이 줄고 있어요. 근력 운동을 거르지 말고, 무게 테스트로 강도를 다시 맞춰보세요.' });
      }
    } else {
      insights.push({ lv: 'info', title: '첫 인바디 등록 완료', body: '이 기록이 기준점이 돼요. 4주 뒤 같은 조건(아침 공복, 화장실 후)으로 다시 측정하면 변화를 분석해 드려요.' });
    }
    // absolute status
    if (last.pbf != null) {
      const [lo, hi] = sex === 'f' ? [18, 28] : [10, 20];
      if (last.pbf > hi) {
        const targetW = last.weight * (1 - last.pbf / 100) / (1 - hi / 100);
        insights.push({ lv: 'info', title: `체지방률 ${F.num1(last.pbf)}% → 목표 ${hi}% 이하`, body: `근육을 지키며 체지방만 줄인다면 약 ${F.num1(targetW)}kg에서 표준 범위(${lo}~${hi}%)에 들어와요.` });
      } else insights.push({ lv: 'good', title: `체지방률 ${F.num1(last.pbf)}% — 표준 범위`, body: '이제 근육량을 늘리는 쪽으로 무게 중심을 옮겨도 좋아요.' });
    }
    if (last.vfl != null) {
      if (last.vfl >= 10) insights.push({ lv: 'warn', title: `내장지방 레벨 ${last.vfl} (높음)`, body: '10 이상은 대사질환 위험 구간이에요. 유산소(경사 걷기)와 음주·야식 조절이 가장 효과적이에요.' });
      else insights.push({ lv: 'good', title: `내장지방 레벨 ${last.vfl}`, body: '10 미만으로 관리되고 있어요.' });
    }
    // projection with linear regression over weight
    let projection = null;
    if (list.length >= 2 && p.goalWeight) {
      const t0 = F.parseKey(list[0].date).getTime();
      const xs = list.map((r) => (F.parseKey(r.date).getTime() - t0) / 864e5), ys = list.map((r) => r.weight);
      const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
      const slope = den ? num / den : 0; // kg/day
      if (slope < -0.005 && last.weight > p.goalWeight) {
        const days = (last.weight - p.goalWeight) / -slope;
        projection = { slopeWeek: slope * 7, days: Math.round(days), date: F.addDays(last.date, Math.round(days)) };
      } else projection = { slopeWeek: slope * 7, days: null, date: null };
    }
    return { list, last, prev, first, deltas, insights, projection };
  };
})(window.F);
