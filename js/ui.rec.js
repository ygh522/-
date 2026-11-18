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

    const xpLog = (s.xp || []).slice(-14).reverse().map((x) => `<div><span class="t-num mute" style="width:52px;font-size:13px">${F.dateLabel(x.d, false)}</span><span class="grow t-small">${esc(x.note || '')}</span><span class="t-num">+${x.xp}</span></div>`).join('');
    const hist = done.slice(-10).reverse().map((x) => `<div><span class="t-num" style="width:58px;font-size:14px">${F.dateLabel(x.date, false)}</span><span class="grow"><b style="font-weight:800">${esc((F.TEMPLATES[x.templateId] || {}).name || (x.kind === 'home' ? '홈 대체 운동' : '운동'))}</b> <span class="t-xs mute">${x.exDone || 0}종목 · 유산소 ${x.cardioMin || 0}분 · ${F.num(x.kcal || 0)}kcal</span></span><span class="${x.status === 'done' ? 'pill-ok' : 'tag'}">${x.status === 'done' ? '완료' : '부분'}</span></div>`).join('');

    return `<div class="page">${UI.ph('RECORDS', '출석 · 경험치', '꾸준함이 곧 결과예요. 출석할 때마다 도장과 경험치가 쌓여요.')}
      ${UI.isPC() ? '' : UI.logTabs('rec')}
      <div class="split">
        <section>
          <div class="card ink">
            <div class="row between"><span class="t-label mute">LEVEL</span><span class="tag" style="background:#fff;color:#000">${F.num(lv.xp)} XP</span></div>
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
        </section>
        <section>
          <section class="sec">${UI.secH('BADGES', `배지 ${Object.keys(s.badges).length}/${F.BADGES.length}`, '')}<div class="badges">${badges}</div></section>
          <section class="sec">${UI.secH('XP LOG', '최근 경험치', '')}<div class="list">${xpLog || '<div class="mute">아직 기록이 없어요</div>'}</div></section>
          <section class="sec">${UI.secH('HISTORY', '운동 기록', '<a href="#log">일지 전체</a>')}<div class="list">${hist || '<div class="mute">첫 운동을 기다리고 있어요</div>'}</div></section>
        </section>
      </div></div>`;
  };

  /* =========================== WORKOUT LOG =========================== */
  UI.logTabs = (cur) => `<div class="seg sm" style="margin-bottom:18px">${[['log', '운동 일지'], ['body', '바디 · 인바디'], ['rec', '출석 · 레벨']].map(([id, l]) => `<button class="${cur === id ? 'on' : ''}" data-act="go" data-href="#${id}">${l}</button>`).join('')}</div>`;
  let openRow = null, exSel = null;
  V.log = () => {
    const s = F.S;
    const done = F.E.doneSessions().slice().reverse();
    const used = Object.keys(s.ex).filter((id) => F.EXERCISES[id] && (s.ex[id].hist || []).length);
    if (!exSel || !used.includes(exSel)) exSel = used[0] || null;
    const totalVol = done.reduce((a, x) => a + (x.volume || 0), 0);
    const thisMonth = done.filter((x) => x.date.slice(0, 7) === F.today().slice(0, 7));
    const kpis = `<div class="kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))"><div><span class="t-label mute">SESSIONS</span><div class="t-num-l">${done.length}</div></div><div><span class="t-label mute">THIS MONTH</span><div class="t-num-l">${thisMonth.length}</div></div><div><span class="t-label mute">VOLUME</span><div class="t-num-l">${F.num(totalVol / 1000, 1)}<span class="unit">t</span></div></div><div><span class="t-label mute">CARDIO</span><div class="t-num-l">${F.num(F.E.cardioMinutesTotal())}<span class="unit">분</span></div></div></div>`;
    const table = done.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>날짜</th><th>루틴</th><th>상태</th><th>종목</th><th>볼륨(kg)</th><th>유산소</th><th>kcal</th><th>XP</th></tr></thead><tbody>
        ${done.map((x) => `<tr class="${openRow === x.date ? 'open' : ''}" data-act="log-open" data-d="${x.date}" style="cursor:pointer"><td>${F.dateLabel(x.date)}</td><td class="k"><b>${esc((F.TEMPLATES[x.templateId] || {}).name || '운동')}</b></td><td class="k">${x.status === 'done' ? '완료' : '부분'}</td><td>${x.exDone || 0}</td><td>${F.num(x.volume || 0)}</td><td>${x.cardioMin || 0}분</td><td>${F.num(x.kcal || 0)}</td><td>+${x.xp || 0}</td></tr>
          ${openRow === x.date ? `<tr class="open"><td colspan="8" class="k" style="white-space:normal">${UI.logDetail(x) || '<span class="mute">세트 기록 없음</span>'}</td></tr>` : ''}`).join('')}
      </tbody></table></div>` : '<div class="empty">아직 기록이 없어요. 첫 운동을 끝내면 세트별 무게·횟수가 여기 쌓여요.</div>';
    const prog = exSel ? (() => {
      const ex = F.EXERCISES[exSel]; const h = s.ex[exSel].hist || [];
      return `<div class="chips" style="margin-bottom:10px">${used.map((id) => `<button class="chip ${id === exSel ? 'on' : ''}" data-act="log-ex" data-id="${id}">${esc(F.EXERCISES[id].name)}</button>`).join('')}</div>
        <div class="row" style="gap:14px;align-items:center"><img src="${F.img.ex(exSel)}" alt="" style="width:64px;height:96px;object-fit:cover;object-position:top;background:#EDEDED"><div><div class="t-h2">${esc(ex.name)}</div><div class="t-num-m" style="margin-top:4px">현재 ${UI.rx(exSel)}</div></div></div>
        <div class="chart-wrap" data-prog="1" style="margin-top:12px"></div>
        <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>날짜</th><th>무게</th><th>횟수</th><th>느낌</th><th>구분</th></tr></thead><tbody>${h.slice().reverse().map((x) => `<tr><td>${F.dateLabel(x.d, false)}</td><td>${x.w != null ? F.num1(x.w) + 'kg' : '–'}</td><td>${x.reps ? x.reps.join('/') : x.r}</td><td class="k">${esc(F.E.RATING[x.rating] ? F.E.RATING[x.rating].label : '')}</td><td class="k">${x.src === 'test' ? '테스트' : '세션'}</td></tr>`).join('')}</tbody></table></div>`;
    })() : '<div class="empty">운동을 기록하면 종목별 무게 변화 그래프가 그려져요.</div>';
    const html = `<div class="page">${UI.ph('WORKOUT LOG', '운동 일지', '세트별 무게·횟수와 종목별 성장 기록이에요.')}
      ${UI.isPC() ? '' : UI.logTabs('log')}
      ${kpis}
      <div class="split wide-l" style="margin-top:16px"><section>${UI.secH('SESSIONS', '세션 기록', '')}${table}</section><section>${UI.secH('PROGRESS', '종목별 성장', '')}${prog}</section></div></div>`;
    const after = (root) => {
      const el = F.$('[data-prog]', root);
      if (!el || !exSel) return;
      const ex = F.EXERCISES[exSel];
      const h = s.ex[exSel].hist || [];
      const loaded = F.E.isLoaded(ex);
      F.Chart.line(el, { data: h.map((x) => ({ x: x.d, y: loaded ? x.w : x.r })).filter((d) => d.y != null), unit: loaded ? 'kg' : '', dec: loaded ? 1 : 0, h: 170, label: ex.name, good: 'up' });
    };
    return { html, after };
  };
  A['log-open'] = (el) => { openRow = openRow === el.dataset.d ? null : el.dataset.d; UI.refresh(); };
  A['log-ex'] = (el) => { exSel = el.dataset.id; UI.refresh(); };
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

    const Y = F.Sync;
    const P = F.profiles();
    const mates = (Y.members || []).filter((m) => m.uid !== Y.uid);
    const together = Y.mode === 'cloud'
      ? `<div class="callout">${F.icon('check')}<div class="t-small"><b>클라우드 동기화 켜짐${Y.me && Y.me.name ? ` · ${esc(Y.me.name)}` : ''}</b>이 링크를 폰과 PC에서 같은 Claude 계정으로 열면 기록이 자동으로 이어져요.</div></div>
         <div class="list" style="margin-top:10px">${mates.length ? mates.map((m) => `<div><span class="grow"><b>${esc(m.name || '파트너')}</b> <span class="t-xs mute">Lv.${m.lv || 1} · 이번 주 ${(m.week || []).length}/${m.freq || 3}회 · 누적 ${m.sessions || 0}회</span></span></div>`).join('') : '<div class="t-small mute">아직 함께하는 사람이 없어요.</div>'}</div>
         <ol class="steps" style="margin-top:10px"><li>claude.ai에서 이 페이지 오른쪽 위 <b>공유</b>를 눌러요.</li><li>여자친구 이메일을 넣고 권한을 <b>편집 가능(Editor)</b>으로 초대해요. 공개 링크로 공유하면 기록 저장이 안 되니 꼭 이메일 초대로!</li><li>여자친구가 자기 Claude 계정으로 링크를 열면 본인 프로필이 따로 만들어지고, 서로의 출석이 대시보드에 보여요.</li></ol>`
      : `<div class="callout">${F.icon('info')}<div class="t-small"><b>지금은 이 기기에만 저장돼요</b>폰·PC 동기화와 2인 사용은 claude.ai 링크로 열 때 자동으로 켜져요. 이 기기를 둘이 같이 쓴다면 아래에서 프로필을 나눠 쓰세요.</div></div>
         <div class="list" style="margin-top:10px">${P.list.map((x) => `<div><span class="grow"><b>${esc(x.id === F.profileId ? (F.S.profile && F.S.profile.name) || x.name || '나' : x.name || '프로필')}</b>${x.id === F.profileId ? ' <span class="tag ink">사용 중</span>' : ''}</span>${x.id === F.profileId ? '' : `<button class="btn sm" data-act="prof-switch" data-id="${x.id}">전환</button>`}</div>`).join('')}</div>
         <button class="btn block" style="margin-top:8px" data-act="prof-add">${F.icon('plus', 'sm')}프로필 추가 (예: 여자친구)</button>`;
    return `<div class="page">${UI.ph('SETTINGS', '설정', '')}
      <div class="split">
        <section>
          <section>${UI.secH('TOGETHER', '함께 쓰기 · 동기화', '')}${together}</section>
          <section class="sec">${UI.secH('FIGURE', '운동 이미지 모델', '')}
            <div class="seg">${[['m', '남성 모델'], ['f', '여성 모델']].map(([v, l]) => `<button data-act="set-figure" data-v="${v}" class="${F.figure() === v ? 'on' : ''}">${l}</button>`).join('')}</div>
            <p class="t-xs mute" style="margin-top:6px">자세 이미지에 나오는 모델이에요. 기본값은 내 성별이고, 자세 가이드에서 남/여를 바로 바꿔 볼 수도 있어요.</p></section>
          <section class="sec">${UI.secH('COACH', '트레이너', '')}
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
            <button class="btn primary block" style="margin-top:8px" data-act="set-ics">${F.icon('download')}휴대폰 캘린더에 운동 일정 추가 (.ics)</button>
            <div class="callout" style="margin-top:12px">${F.icon('info')}<div class="t-small"><b>앱을 닫아도 알람을 받으려면</b>웹앱은 화면이 꺼져 있으면 알람을 울릴 수 없어요. 위 버튼으로 8주치 일정을 캘린더에 추가하면 휴대폰이 직접 알람을 울려줘요. 일정을 옮긴 뒤엔 다시 내보내 주세요.</div></div>
          </section>
        </section>
        <section>
          <section>${UI.secH('PROFILE', '내 정보', '')}
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
              <button class="btn primary block" style="margin-top:14px" type="submit">${F.icon('check')}내 정보 저장</button>
            </form>
          </section>

          <section class="sec">${UI.secH('DISPLAY', '화면', '')}
            <div class="seg">${[['light', '라이트'], ['dark', '다크'], ['system', '시스템']].map(([v, l]) => `<button data-act="set-theme" data-v="${v}" class="${st.theme === v ? 'on' : ''}">${F.icon(v === 'dark' ? 'moon' : 'sun', 'sm')} ${l}</button>`).join('')}</div>
          </section>

          <section class="sec">${UI.secH('DATA', '데이터 · 백업', '')}
            <p class="t-small mute2" style="margin-bottom:10px">${F.Sync.mode === 'cloud' ? '기록은 내 Claude 계정에 비공개로 저장되고 폰·PC가 자동으로 맞춰져요. 만일을 위해 가끔 백업 파일도 받아 두세요.' : '기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 함께 지워지니 가끔 백업해 두세요.'}</p>
            <div class="btn-row"><button class="btn" data-act="backup">${F.icon('download')}백업 내보내기</button>
              <label class="btn" style="cursor:pointer">${F.icon('upload')}백업 불러오기<input type="file" accept="application/json,.json" class="sr" data-change="restore"></label></div>
            <button class="btn ghost block" style="margin-top:8px;color:var(--bad);border-color:var(--bad)" data-act="reset">${F.icon('trash', 'sm')}모든 데이터 초기화</button>
          </section>

          <section class="sec"><p class="t-xs mute">MY PT는 일반적인 운동·영양 가이드를 제공해요. 질환이 있거나 약을 복용 중이라면 운동·식단·영양제 시작 전 의사·약사와 상담하세요. 운동 중 날카로운 통증, 어지러움, 가슴 통증이 있으면 즉시 중단하세요.</p></section>
        </section>
      </div></div>`;
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

  A['set-figure'] = (el) => { F.S.settings.figure = el.dataset.v; F.save(); UI.refresh(); };
  A['prof-switch'] = (el) => { F.switchProfile(el.dataset.id); location.hash = '#home'; F.$('#app').dataset.shell = ''; F.render(); };
  A['prof-add'] = async () => { const n = await F.askText({ label: 'PROFILE', title: '새 프로필 추가', body: '이 기기를 함께 쓰는 사람의 이름을 적어 주세요.', placeholder: '예: 여자친구 이름', ok: '추가' }); if (n === null) return; F.addProfile(n); location.hash = '#home'; F.$('#app').dataset.shell = ''; F.render(); };
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
      try {
        let b = null;
        if (typeof r.img === 'object') { const u = await F.Sync.fileURL(r.img); b = u ? await (await fetch(u)).blob() : null; }
        else b = await F.idb.get(r.img);
        if (b) files[r.id] = await F.blobToDataURL(b);
      } catch (e) { /* skip */ }
    }
    const data = { app: 'mypt', v: 2, exportedAt: new Date().toISOString(), state: F.S, files };
    F.Sync.download(`mypt-backup-${F.today()}.json`, JSON.stringify(data), 'application/json');
  };
  A.restore = async (input) => {
    const f = input.files && input.files[0];
    input.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'mypt' || !data.state || !data.state.profile) throw new Error('MY PT 백업 파일이 아니에요');
      if (!(await F.ask({ label: 'RESTORE', title: '백업으로 바꿀까요?', body: '지금 내 기록이 백업 파일 내용으로 바뀌어요.', ok: '바꾸기', danger: true }))) return;
      const st = F.normalize(data.state);
      for (const r of st.inbody || []) {
        const url = (data.files || {})[r.id] || (data.files || {})[r.img];
        if (!url) { r.img = null; continue; }
        try { r.img = await F.Sync.putFile(await F.dataURLToBlob(url), 'ib_' + r.id); } catch (e) { r.img = null; }
      }
      F.S = st;
      F.save(true);
      F.toast('백업을 불러왔어요');
      location.hash = '#home';
      F.$('#app').dataset.shell = ''; F.render();
    } catch (e) { F.toast(`불러오기 실패: ${e.message}`); }
  };
  A.reset = async () => {
    if (!(await F.ask({ label: 'RESET', title: '모든 기록을 지울까요?', body: '운동·식단·인바디·경험치가 모두 삭제되고 처음부터 시작해요. 되돌릴 수 없어요.', ok: '모두 삭제', danger: true }))) return;
    for (const r of F.S.inbody || []) if (r.img) await F.Sync.deleteFile(r.img);
    if (F.Sync.mode === 'cloud') await F.Sync.resetCloud();
    F.resetAll(); F.writeLocal(); location.hash = ''; F.$('#app').dataset.shell = ''; F.render();
  };
})(window.F);
