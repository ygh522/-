/* Records (attendance stamps, XP, badges) and Settings (coach, profile, schedule, alarms, data). */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  let monthOff = 0;

  /* =========================== RECORDS =========================== */
  V.rec = () => {
    const s = F.S;
    const lv = F.E.level();
    const done = F.E.doneSessions();
    const streak = F.E.streakWeeks();
    const cardioMin = F.E.cardioMinutesTotal();
    const volume = done.reduce((a, x) => a + (x.volume || 0), 0);
    const now = new Date();
    const ym = new Date(now.getFullYear(), now.getMonth() + monthOff, 1);
    const keys = F.monthKeys(ym.getFullYear(), ym.getMonth());
    const lead = (new Date(ym.getFullYear(), ym.getMonth(), 1).getDay() + 6) % 7;
    const today = F.today();
    const monthDone = keys.filter((k) => s.sessions[k] && (s.sessions[k].status === 'done' || s.sessions[k].status === 'partial')).length;
    const monthPlanned = keys.filter((k) => F.E.planFor(k) || (s.sessions[k] && s.sessions[k].status)).length;
    const cells = keys.map((k) => {
      const ses = s.sessions[k];
      const pl = F.E.planFor(k);
      const ov = s.overrides[k];
      let cls = '';
      if (ses && ses.status === 'done') cls = 'done';
      else if (ses && ses.status === 'partial') cls = 'partial';
      else if (pl && k < today) cls = 'missed';
      else if (pl) cls = 'planned';
      else if (ov && ov.type === 'skip' && ov.to) cls = 'moved';
      if (k === today) cls += ' today';
      const d = F.parseKey(k).getDate();
      return `<div class="c ${cls}" title="${F.dateLabel(k)}"><span class="d">${d}</span>${ses && ses.status === 'done' ? `<span class="stp">${F.icon('check')}</span>` : ses && ses.xp ? `<span class="xp">+${ses.xp}</span>` : ''}</div>`;
    }).join('');

    const badges = F.BADGES.map((bd) => {
      const got = s.badges[bd.id];
      const ic = { flag: 'flag', scale: 'scale', target: 'target', check2: 'check', bolt: 'bolt', bolt2: 'bolt', n10: 'stamp', n30: 'stamp', n50: 'trophy', heart: 'heart', heart2: 'heart', doc: 'camera', chart: 'chart', down: 'arrowR', down2: 'arrowR', drop: 'drop', muscle: 'dumbbell', swap: 'swap', bowl: 'bowl' }[bd.icon] || 'trophy';
      return `<div class="badge ${got ? '' : 'locked'}"><div class="bi">${F.icon(ic)}</div><b>${esc(bd.name)}</b><span>${got ? F.dateLabel(got, false) + ' 획득' : esc(bd.desc)}</span></div>`;
    }).join('');

    const xpLog = (s.xp || []).slice(-14).reverse().map((x) => `<div><span class="t-num mute" style="width:52px;font-size:13px">${F.dateLabel(x.d, false)}</span><span class="grow t-small">${esc(x.note || '')}</span><span class="t-num acc">+${x.xp}</span></div>`).join('');
    const hist = done.slice(-10).reverse().map((x) => `<div><span class="t-num" style="width:58px;font-size:14px">${F.dateLabel(x.date, false)}</span><span class="grow"><b style="font-weight:800">${esc((F.TEMPLATES[x.templateId] || {}).name || (x.kind === 'home' ? '홈 대체 운동' : '운동'))}</b> <span class="t-xs mute">${x.exDone || 0}종목 · 유산소 ${x.cardioMin || 0}분 · ${F.num(x.kcal || 0)}kcal</span></span><span class="${x.status === 'done' ? 'pill-ok' : 'tag'}">${x.status === 'done' ? '완료' : '부분'}</span></div>`).join('');

    return `${UI.ph('RECORDS', '출석 · 경험치', '꾸준함이 곧 결과예요. 출석할 때마다 도장과 경험치가 쌓여요.')}
      <div class="cols">
        <div>
          <div class="card ink">
            <div class="row between"><span class="t-label mute">LEVEL</span><span class="tag acc">${F.num(lv.xp)} XP</span></div>
            <div class="row" style="gap:14px;align-items:flex-end;margin-top:8px"><div class="t-display" style="color:#fff">Lv.${lv.lv}</div><div class="t-h2" style="color:#fff;padding-bottom:6px">${esc(lv.title)}</div></div>
            <div class="bar" style="margin-top:14px"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
            <div class="row between t-xs mute" style="margin-top:6px"><span>${F.num(lv.cur)} / ${F.num(lv.need)}</span><span>다음 레벨까지 ${F.num(lv.need - lv.cur)} XP</span></div>
            <div class="grid g3" style="margin-top:16px">
              <div class="kpi on-dark"><span class="t-label">SESSIONS</span><div class="t-num-l" style="color:#fff">${done.length}<span class="unit">회</span></div></div>
              <div class="kpi on-dark"><span class="t-label">STREAK</span><div class="t-num-l" style="color:#fff">${streak}<span class="unit">주</span></div></div>
              <div class="kpi on-dark"><span class="t-label">CARDIO</span><div class="t-num-l" style="color:#fff">${F.num(cardioMin)}<span class="unit">분</span></div></div>
            </div>
            <p class="t-xs mute" style="margin-top:12px">누적 볼륨 ${F.num(volume)}kg · 경험치: 세션 완료 +100, 종목당 +10, 유산소 +30~, 예정일 출석 +20, 대체일 출석 +30, 주중 2회 +50, 주간 목표 +100, 연속 주 보너스, 인바디 +80, 식단 체크 +5</p>
          </div>
          <section class="sec">${UI.secH('STAMPS', '출석 도장', '')}
            <div class="row between" style="margin-bottom:10px">
              <button class="icon-btn" data-act="month-nav" data-d="-1" aria-label="이전 달">${F.icon('chevL')}</button>
              <div style="text-align:center"><div class="t-num-m">${ym.getFullYear()}.${F.pad(ym.getMonth() + 1)}</div><div class="t-xs mute">출석 ${monthDone} / 예정 ${monthPlanned}</div></div>
              <button class="icon-btn" data-act="month-nav" data-d="1" aria-label="다음 달">${F.icon('chevR')}</button>
            </div>
            <div class="cal">${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => `<div class="h">${d}</div>`).join('')}${'<div class="c empty"></div>'.repeat(lead)}${cells}</div>
            <div class="row wrap t-xs mute" style="gap:12px;margin-top:10px"><span class="row" style="gap:4px"><span class="st done" style="width:14px;height:14px"></span>출석</span><span class="row" style="gap:4px"><span class="st partial" style="width:14px;height:14px"></span>부분</span><span class="row" style="gap:4px"><span class="st planned" style="width:14px;height:14px"></span>예정</span><span class="row" style="gap:4px"><span class="st missed" style="width:14px;height:14px"></span>놓침</span></div>
          </section>
        </div>
        <div>
          <section class="sec">${UI.secH('BADGES', `배지 ${Object.keys(s.badges).length}/${F.BADGES.length}`, '')}<div class="badges">${badges}</div></section>
          <section class="sec">${UI.secH('XP LOG', '최근 경험치', '')}<div class="list">${xpLog || '<div class="mute">아직 기록이 없어요</div>'}</div></section>
          <section class="sec">${UI.secH('HISTORY', '운동 기록', '')}<div class="list">${hist || '<div class="mute">첫 운동을 기다리고 있어요</div>'}</div></section>
        </div>
      </div>`;
  };
  A['month-nav'] = (el) => { monthOff = F.clamp(monthOff + +el.dataset.d, -24, 6); UI.refresh(); };

  /* =========================== SETTINGS =========================== */
  let draft = null;
  V.set = () => {
    const s = F.S, p = s.profile, st = s.settings;
    if (!draft) draft = { freq: st.freq, days: st.days.slice(), gymTime: st.gymTime };
    const wk = draft.days.filter((x) => x >= 1 && x <= 5).length;
    const valid = draft.days.length === draft.freq && wk >= 2;
    const changed = draft.freq !== st.freq || draft.gymTime !== st.gymTime || draft.days.slice().sort().join() !== st.days.slice().sort().join();
    const perm = F.Alarm.permission();
    const pat = F.PATTERNS[draft.freq];

    return `${UI.ph('SETTINGS', '설정', '')}
      <div class="cols">
        <div>
          <section>${UI.secH('COACH', '트레이너', '')}
            <div class="pick-coach">${['m', 'f'].map((g) => `<button data-act="set-coach" data-g="${g}" class="${st.trainer === g ? 'on' : ''}" aria-pressed="${st.trainer === g}">
              <div class="pc-img"><img src="${F.img.trainer(g, 'hero')}" alt=""></div>
              <div class="pc-t"><div class="t-h3">${esc(st.trainerNames[g])}</div><div class="t-xs mute">${g === 'm' ? '남성 트레이너' : '여성 트레이너'} · 언제든 변경</div></div></button>`).join('')}</div>
            <div class="grid g2" style="margin-top:12px">${['m', 'f'].map((g) => `<label class="field" style="margin:0"><span>${g === 'm' ? '남성' : '여성'} 코치 이름</span><input class="input" data-change="set-coachname" data-g="${g}" value="${esc(st.trainerNames[g])}" maxlength="10"></label>`).join('')}</div>
          </section>

          <section class="sec">${UI.secH('SCHEDULE', '운동 스케줄', '')}
            <div class="field"><span>주 몇 회</span><div class="seg">${[2, 3, 4, 5].map((n) => `<button data-act="set-freq" data-v="${n}" class="${draft.freq === n ? 'on' : ''}">${n}회</button>`).join('')}</div></div>
            <div class="field"><span>요일 (추천 ${esc(pat.title)})</span><div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button data-act="set-day" data-v="${w}" class="${draft.days.includes(w) ? 'on' : ''} ${w === 0 || w === 6 ? 'wk' : ''}">${F.DAY_NAMES[w]}</button>`).join('')}</div>
              <p class="t-small" style="margin-top:8px">${draft.days.length !== draft.freq ? `<span class="pill-no">${draft.days.length}/${draft.freq}일 선택</span>` : '<span class="pill-ok">요일 OK</span>'} ${wk < 2 ? '<span class="pill-no">주중 2회 이상 필요</span>' : `<span class="pill-ok">주중 ${wk}회</span>`}</p></div>
            <label class="field"><span>운동 시작 시간</span><input class="input num" type="time" value="${draft.gymTime}" data-change="set-time"></label>
            <button class="btn ${changed && valid ? 'primary' : ''} block" style="margin-top:14px" data-act="set-save-sched" ${changed && valid ? '' : 'disabled'}>${F.icon('check')}스케줄 저장</button>
            <p class="t-xs mute" style="margin-top:8px">스케줄을 바꿔도 지금까지의 기록과 무게는 그대로예요. 루틴은 다음 순서부터 이어져요.</p>
          </section>

          <section class="sec">${UI.secH('ALARM', '알람', '')}
            <div class="list">
              <div><span class="grow"><b style="font-weight:800">운동 알람</b><span class="t-xs mute" style="display:block">운동 시작 시간과 미리 알림에 소리·진동·알림을 보내요</span></span><button class="toggle ${st.alarmOn ? 'on' : ''}" data-act="set-toggle" data-k="alarmOn" aria-pressed="${st.alarmOn}" aria-label="운동 알람"><i></i></button></div>
              <div><span class="grow"><b style="font-weight:800">알람 소리</b></span><button class="toggle ${st.sound !== false ? 'on' : ''}" data-act="set-toggle" data-k="sound" aria-pressed="${st.sound !== false}" aria-label="알람 소리"><i></i></button></div>
            </div>
            <div class="field" style="margin-top:14px"><span>미리 알림</span><div class="seg">${[0, 10, 30, 60].map((n) => `<button data-act="set-lead" data-v="${n}" class="${+st.alarmLead === n ? 'on' : ''}">${n ? n + '분 전' : '없음'}</button>`).join('')}</div></div>
            <div class="btn-row" style="margin-top:14px">
              <button class="btn" data-act="set-perm">${F.icon('bell')}${perm === 'granted' ? '알림 허용됨' : perm === 'denied' ? '알림 차단됨' : perm === 'unsupported' ? '알림 미지원' : '알림 권한 허용'}</button>
              <button class="btn" data-act="set-test-alarm">${F.icon('play')}알람 테스트</button>
            </div>
            <button class="btn dark block" style="margin-top:8px" data-act="set-ics">${F.icon('download')}휴대폰 캘린더에 운동 일정 추가 (.ics)</button>
            <div class="callout" style="margin-top:12px">${F.icon('info')}<div class="t-small"><b>앱을 닫아도 알람을 받으려면</b>웹앱은 화면이 꺼져 있으면 알람을 울릴 수 없어요. 위 버튼으로 8주치 일정을 캘린더에 추가하면 휴대폰이 직접 알람을 울려줘요. 일정을 옮긴 뒤엔 다시 내보내 주세요.</div></div>
          </section>
        </div>
        <div>
          <section class="sec">${UI.secH('PROFILE', '내 정보', '')}
            <form id="pf-form" autocomplete="off">
              <label class="field"><span>이름</span><input class="input" name="name" value="${esc(p.name || '')}" maxlength="12" placeholder="코치가 부를 이름"></label>
              <div class="field"><span>성별</span><div class="seg">${[['m', '남성'], ['f', '여성']].map(([v, l]) => `<button type="button" data-act="set-sex" data-v="${v}" class="${p.sex === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
              <div class="grid g2" style="margin-top:16px">
                <label class="field" style="margin:0"><span>나이</span><div class="input-unit"><input class="input num" name="age" type="number" inputmode="numeric" value="${p.age}"><em>세</em></div></label>
                <label class="field" style="margin:0"><span>키</span><div class="input-unit"><input class="input num" name="height" type="number" inputmode="decimal" step="0.1" value="${p.height}"><em>cm</em></div></label>
                <label class="field" style="margin:0"><span>시작 체중</span><div class="input-unit"><input class="input num" name="weight" type="number" inputmode="decimal" step="0.1" value="${p.weight}"><em>kg</em></div></label>
                <label class="field" style="margin:0"><span>목표 체중</span><div class="input-unit"><input class="input num" name="goalWeight" type="number" inputmode="decimal" step="0.1" value="${p.goalWeight}"><em>kg</em></div></label>
              </div>
              <div class="field" style="margin-top:16px"><span>감량 속도</span><div class="seg">${[['easy', '여유 15%'], ['normal', '표준 20%'], ['fast', '적극 25%']].map(([v, l]) => `<button type="button" data-act="set-pace" data-v="${v}" class="${st.pace === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
              <button class="btn dark block" style="margin-top:14px" type="submit">${F.icon('check')}내 정보 저장</button>
            </form>
          </section>

          <section class="sec">${UI.secH('DISPLAY', '화면', '')}
            <div class="seg">${[['light', '라이트'], ['dark', '다크'], ['system', '시스템']].map(([v, l]) => `<button data-act="set-theme" data-v="${v}" class="${st.theme === v ? 'on' : ''}">${F.icon(v === 'dark' ? 'moon' : 'sun', 'sm')} ${l}</button>`).join('')}</div>
          </section>

          <section class="sec">${UI.secH('DATA', '데이터 · 백업', '')}
            <p class="t-small mute2" style="margin-bottom:10px">모든 기록은 이 기기의 브라우저에만 저장돼요(서버 전송 없음). 브라우저 데이터를 지우면 함께 지워지니 가끔 백업해 두세요. 백업 파일로 PC ↔ 휴대폰 간 옮길 수도 있어요.</p>
            <div class="btn-row"><button class="btn" data-act="backup">${F.icon('download')}백업 내보내기</button>
              <label class="btn" style="cursor:pointer">${F.icon('upload')}백업 불러오기<input type="file" accept="application/json,.json" class="sr" data-change="restore"></label></div>
            <button class="btn ghost block" style="margin-top:8px;color:var(--bad);border-color:var(--bad)" data-act="reset">${F.icon('trash', 'sm')}모든 데이터 초기화</button>
          </section>

          <section class="sec"><p class="t-xs mute">MY PT는 일반적인 운동·영양 가이드를 제공해요. 질환이 있거나 약을 복용 중이라면 운동·식단·영양제 시작 전 의사·약사와 상담하세요. 운동 중 날카로운 통증, 어지러움, 가슴 통증이 있으면 즉시 중단하세요.</p></section>
        </div>
      </div>`;
  };

  const after = () => {
    const f = F.$('#pf-form');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const p = F.S.profile;
      const n = (k) => parseFloat(fd.get(k));
      if (!(n('age') >= 15 && n('age') <= 90 && n('height') >= 120 && n('height') <= 230 && n('weight') > 30 && n('goalWeight') > 30)) { F.toast('입력값을 확인해 주세요'); return; }
      Object.assign(p, { name: (fd.get('name') || '').trim(), age: Math.round(n('age')), height: n('height'), weight: n('weight'), goalWeight: n('goalWeight') });
      F.save(true); F.toast('저장했어요 — 칼로리·단백질 목표가 다시 계산됐어요'); UI.refresh();
    });
  };
  const origSet = V.set;
  V.set = (rest) => ({ html: origSet(rest), after });

  A['set-coach'] = (el) => { F.S.settings.trainer = el.dataset.g; F.save(); F.toast(`${F.josa(F.coachName(), '으로/로')} 바꿨어요`); UI.refresh(); };
  A['set-coachname'] = (el) => { const v = el.value.trim(); if (v) { F.S.settings.trainerNames[el.dataset.g] = v; F.save(); UI.updateTop(); } };
  A['set-freq'] = (el) => { const n = +el.dataset.v; draft.freq = n; draft.days = F.PATTERNS[n].days.slice(); UI.refresh(); };
  A['set-day'] = (el) => { const w = +el.dataset.v; const i = draft.days.indexOf(w); if (i >= 0) draft.days.splice(i, 1); else draft.days.push(w); UI.refresh(); };
  A['set-time'] = (el) => { draft.gymTime = el.value || draft.gymTime; UI.refresh(); };
  A['set-save-sched'] = () => {
    Object.assign(F.S.settings, { freq: draft.freq, days: draft.days.slice(), gymTime: draft.gymTime });
    // clear future one-off overrides that no longer make sense
    const k = F.today();
    for (const [d, ov] of Object.entries(F.S.overrides)) if (d > k && ov.type === 'skip' && !ov.to) delete F.S.overrides[d];
    F.save(true); draft = null;
    F.toast('스케줄을 저장했어요. 캘린더 알람도 다시 내보내 주세요.');
    UI.refresh();
  };
  A['set-toggle'] = (el) => { const key = el.dataset.k; F.S.settings[key] = !(F.S.settings[key] !== false); F.save(); UI.refresh(); };
  A['set-lead'] = (el) => { F.S.settings.alarmLead = +el.dataset.v; F.save(); UI.refresh(); };
  A['set-perm'] = async () => { await F.Alarm.request(); UI.refresh(); };
  A['set-test-alarm'] = () => { F.Alarm.fire(F.E.nextPlanned(F.today()) || F.today(), 'start'); };
  A['set-ics'] = () => F.Alarm.exportICS(8);
  A['set-sex'] = (el) => { F.S.profile.sex = el.dataset.v; F.save(); UI.refresh(); };
  A['set-pace'] = (el) => { F.S.settings.pace = el.dataset.v; F.save(); UI.refresh(); };
  A['set-theme'] = (el) => { F.S.settings.theme = el.dataset.v; F.save(); UI.applyTheme(); UI.refresh(); };

  A.backup = async () => {
    const files = {};
    for (const r of F.S.inbody || []) {
      if (!r.img) continue;
      try { const b = await F.idb.get(r.img); if (b) files[r.img] = await F.blobToDataURL(b); } catch (e) { /* skip */ }
    }
    const data = { app: 'mypt', v: 1, exportedAt: new Date().toISOString(), state: F.S, files };
    F.download(`mypt-backup-${F.today()}.json`, JSON.stringify(data), 'application/json');
  };
  A.restore = async (input) => {
    const f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'mypt' || !data.state || !data.state.profile) throw new Error('MY PT 백업 파일이 아니에요');
      if (!confirm('지금 기기의 데이터를 백업 파일 내용으로 바꿀까요?')) return;
      for (const [id, url] of Object.entries(data.files || {})) { try { await F.idb.put(id, await F.dataURLToBlob(url)); } catch (e) { /* skip */ } }
      localStorage.setItem(F.storageKey, JSON.stringify(data.state));
      F.S = F.load();
      F.toast('백업을 불러왔어요');
      location.hash = '#/home';
      setTimeout(() => location.reload(), 400);
    } catch (e) { F.toast(`불러오기 실패: ${e.message}`); }
  };
  A.reset = async () => {
    if (!confirm('모든 기록(운동·식단·인바디·경험치)을 삭제하고 처음부터 시작할까요? 되돌릴 수 없어요.')) return;
    try { const ks = await F.idb.keys(); for (const k of ks) await F.idb.del(k); } catch (e) { /* ignore */ }
    F.resetAll(); location.hash = ''; location.reload();
  };
})(window.F);
