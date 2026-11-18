/* Trainer layer: the service intro and trainer pick (first launch), ask-the-trainer chat (Claude inside
   claude.ai, built-in answers elsewhere), "why we train this way" articles and the split guide. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  const C = (UI.coach = {});
  const TR = (g) => Object.assign({ name: (F.S.settings.trainerNames || {})[g] || '코치', title: '', career: '', style: '', intro: '', promise: [] }, (F.TRAINERS || {})[g] || {}, { name: (F.S.settings.trainerNames || {})[g] || ((F.TRAINERS || {})[g] || {}).name || '코치' });
  const fill = (t) => String(t || '').replace(/\{name\}/g, F.coachName()).replace(/\{me\}/g, UI.myName() || '회원');
  const nl = (t) => esc(t).replace(/\n/g, '<br>');

  /* =========================================================
     INTRO — what MY PT is, before the first question
     ========================================================= */
  const introArt = (key, i) => {
    const ex = F.EXERCISES.db_rdl ? 'db_rdl' : Object.keys(F.EXERCISES)[0];
    if (key === 'welcome' || i === 0) {
      return `<div class="ia-duo">${['m', 'f'].map((g) => `<figure><img src="${F.img.trainer(g, 'hero')}" alt="${esc(TR(g).name)}"><figcaption><b>${esc(TR(g).name)}</b><span>${esc(TR(g).title)}</span></figcaption></figure>`).join('')}</div>`;
    }
    if (key === 'plan') {
      const rows = [['레그 프레스', '40kg × 12회 × 2세트'], ['랫풀다운', '30kg × 12회 × 2세트'], ['체스트 프레스', '25kg × 12회 × 2세트'], ['경사 걷기', '경사 8% · 4.5km/h · 25분']];
      return `<div class="ia-plan"><img src="${F.img.trainer('m', 'coach')}" alt=""><div class="ia-card"><div class="t-label">TODAY · 전신 A</div>${rows.map(([a, b], j) => `<div class="r"><span class="t-num">${F.pad(j + 1)}</span><b>${a}</b><span class="t-num">${b}</span></div>`).join('')}
        <div class="ia-rate"><span>할만했다</span><span class="on">조금 어려웠다</span><span>너무 힘들었다</span></div><div class="t-xs mute">평가하면 다음 무게를 다시 짜요</div></div></div>`;
    }
    if (key === 'form') {
      const E1 = F.EXERCISES[ex];
      return `<div class="ia-form"><div class="ia-fig">${UI.exFig(E1, { g: 'f', eager: true })}</div><div class="ia-checks">${(E1.cues || []).map((c, j) => `<div class="fcx"><b>${j + 1}</b><span>${esc(c)}</span>${F.icon('check', 'sm')}</div>`).join('')}<p class="t-xs mute">사진 속 번호 = 체크 포인트</p></div></div>`;
    }
    if (key === 'why') {
      return `<div class="ia-chat"><img src="${F.img.trainer('f', 'coach')}" alt=""><div class="ia-bubbles">
        <div class="b me">왜 처음엔 전신 운동부터 해요?</div>
        <div class="b">초보 때는 같은 근육을 주 2~3번 자극할수록 빨리 늘어요. 전신 운동이면 주 3회로 근육마다 3번씩 운동하게 돼요.</div>
        <div class="b me">무릎이 살짝 아파요</div>
        <div class="b">운동 시작할 때 아픈 곳에 무릎을 눌러 주세요. 스쿼트를 글루트 브릿지로 바꿔 드릴게요.</div></div></div>`;
    }
    // path: the 12-week road from beginner to intermediate
    const P = F.PHASES || [];
    return `<div class="ia-path">${P.map((p, j) => `<div class="step ${j === 0 ? 'on' : ''}"><span class="t-label">P${p.id} · ${p.weeks[0]}~${p.weeks[1]}주</span><b>${esc(p.name)}</b><span class="t-xs">${esc(['머신 · 맨몸, 자세 익히기', '덤벨 · 3세트', '바벨 기초 · 무게 올리기'][j] || '')}</span></div>`).join('<i>→</i>')}
      <div class="ia-split"><span>전신</span><i>→</i><span>상체 / 하체</span><i>→</i><span>밀기 / 당기기 / 하체</span></div></div>`;
  };

  C.renderIntro = (ONB) => {
    const slides = F.INTRO || [];
    const i = F.clamp(ONB.intro || 0, 0, slides.length - 1);
    const sl = slides[i];
    const root = F.$('#app');
    root.dataset.shell = '';
    root.innerHTML = `<div class="intro">
      <div class="intro-top"><span class="logo"><i></i>MY PT</span><button class="t-small link" data-act="intro-skip">건너뛰기</button></div>
      <div class="intro-main">
        <div class="intro-art">${introArt(sl.key, i)}</div>
        <div class="intro-text">
          <div class="t-label mute">${F.pad(i + 1)} / ${F.pad(slides.length)} · ${esc(sl.label || '')}</div>
          <h1 class="intro-title">${nl(sl.title || '')}</h1>
          <p class="intro-body">${esc(sl.body || '')}</p>
          <ul class="intro-points">${(sl.points || []).map((x) => `<li>${F.icon('check', 'sm')}<span>${esc(x)}</span></li>`).join('')}</ul>
        </div>
      </div>
      <div class="intro-foot"><div>
        <div class="dots">${slides.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="btn-row">${i > 0 ? `<button class="btn lg" data-act="intro-prev" aria-label="이전">${F.icon('arrowL')}</button>` : ''}<button class="btn primary lg" style="flex:1" data-act="intro-next">${i === slides.length - 1 ? '트레이너 고르기' : '다음'} ${F.icon('arrowR')}</button></div>
      </div></div></div>`;
    window.scrollTo(0, 0);
  };
  A['intro-next'] = () => { const O = UI.ONB; O.intro = (O.intro || 0) + 1; V.onboard(); };
  A['intro-prev'] = () => { const O = UI.ONB; O.intro = Math.max(0, (O.intro || 0) - 1); V.onboard(); };
  A['intro-skip'] = () => { UI.ONB.intro = 99; V.onboard(); };
  A['intro-replay'] = () => { F.closeSheet(true); UI.ONB.intro = 0; UI.ONB.replay = true; C.renderIntro(UI.ONB); };

  /** Onboarding step 0: pick the trainer who will run every session. */
  C.coachPick = (d) => {
    const t = TR(d.trainer);
    const body = `<div class="t-label mute">YOUR TRAINER</div>
      <h1 class="t-h1" style="margin:10px 0 8px">함께할 트레이너를<br>골라주세요.</h1>
      <p class="mute2">운동할 때마다 옆에서 자세를 체크하고, 무게를 정하고, 궁금한 걸 답해 줘요. 언제든 바꿀 수 있어요.</p>
      <div class="tpick">${['m', 'f'].map((g) => { const x = TR(g); return `<button class="tcard ${d.trainer === g ? 'on' : ''}" data-act="onb-coach" data-g="${g}" aria-pressed="${d.trainer === g}">
          <div class="img"><img src="${F.img.trainer(g, 'hero')}" alt="${esc(x.name)}"></div>
          <div class="txt"><b>${esc(x.name)}</b><span>${esc(x.title)}</span><span class="t-xs mute">${esc(x.career || '')}</span></div>
          <span class="sel">${F.icon('check', 'sm')}</span></button>`; }).join('')}</div>
      <div class="tsay"><img src="${F.img.trainer(d.trainer, 'face')}" alt=""><div><b>${esc(t.name)}</b><p>${esc(fill(t.intro))}</p>
        ${t.promise && t.promise.length ? `<ul>${t.promise.map((p) => `<li>${F.icon('check', 'sm')}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
        ${t.style ? `<p class="t-xs mute" style="margin-top:6px">${esc(t.style)}</p>` : ''}</div></div>`;
    const foot = `<button class="btn primary lg block" data-act="onb-next">${esc(F.josa(t.name, '과/와'))} 시작하기 ${F.icon('arrowR')}</button>`;
    return { body, foot };
  };

  /* =========================================================
     ASK THE TRAINER — Claude answers in the trainer's voice; offline answers otherwise
     ========================================================= */
  C.busy = false;
  let ctxEx = null;
  const canSample = () => !!(F.Sync && F.Sync.sample && typeof F.Sync.sample === 'function');

  const faqAnswer = (q) => {
    const list = F.FAQ || [];
    let best = null, score = 0;
    for (const f of list) {
      let sc = 0;
      for (const k of f.keys || []) if (k && q.includes(k)) sc += k.length >= 3 ? 2 : 1;
      if (sc > score) { score = sc; best = f; }
    }
    if (best) return best.a;
    return '이 질문은 claude.ai 링크에서 앱을 열면 제가 회원님 기록을 보고 직접 답해 드려요. 지금은 아래 "운동 원리"에서 관련 내용을 먼저 찾아보세요.';
  };

  const context = () => {
    const s = F.S, p = s.profile || {};
    const b = F.E.body();
    const ph = F.E.phase();
    const k = F.today();
    const nk = F.E.nextPlanned(k);
    const tid = nk ? F.E.templateFor(nk) : F.E.rotation()[0];
    const T = F.TEMPLATES[tid];
    const lines = [
      `- ${p.sex === 'f' ? '여성' : '남성'}, ${p.age || '?'}세, 키 ${p.height || '?'}cm, 체중 ${F.num1(b.weight)}kg, 목표 ${p.goalWeight || '?'}kg`,
      `- 단계: ${ph.name} (완료한 운동 ${ph.done}회), 분할: ${((F.SPLITS_INFO || {})[F.E.splitId()] || {}).name || F.E.splitId()}, 주 ${s.settings.freq}회 ${s.settings.gymTime}`,
      `- 다음 운동(${nk ? F.dateLabel(nk) : '-'}): ${T ? T.name : '-'} — ${T ? F.E.templateEx(tid).map((id) => { const pr = F.E.prescription(id); const ex = pr.ex; return `${ex.name} ${F.E.isLoaded(ex) ? F.E.loadLabel(ex, pr.w) + '×' : ''}${F.E.repsLabel(ex, pr.r)}×${pr.sets}세트`; }).join(', ') : ''}`,
    ];
    const recent = F.E.doneSessions().slice(-3).map((x) => `${x.date} ${(F.TEMPLATES[x.templateId] || {}).name || ''} ${x.status === 'done' ? '완료' : '일부'}${x.cond && x.cond !== 'normal' ? ' (컨디션 ' + ((F.COND || {})[x.cond] || {}).label + ')' : ''}`);
    if (recent.length) lines.push(`- 최근 운동: ${recent.join(' / ')}`);
    if (ctxEx && F.EXERCISES[ctxEx]) {
      const ex = F.EXERCISES[ctxEx];
      const st = s.ex[ctxEx];
      lines.push(`- 지금 묻는 운동: ${ex.name} (체크포인트: ${(ex.cues || []).join(' / ')})${st && st.hist && st.hist.length ? `, 최근 평가: ${st.hist.slice(-3).map((h) => (F.E.RATING[h.rating] || {}).label).join(', ')}` : ''}`);
    }
    try { const tg = F.E.targets(k); lines.push(`- 식단 목표: ${F.num(tg.kcal)}kcal, 단백질 ${tg.protein}g`); } catch (e) { /* ignore */ }
    return lines.join('\n');
  };

  const buildInput = (q) => {
    const t = TR(F.S.settings.trainer);
    const rules = [
      `너는 MY PT 앱의 퍼스널 트레이너 "${t.name}"(${t.age || 30}대 초반, ${t.title || '퍼스널 트레이너'})야. ${t.chatTone || ''}`,
      '회원은 헬스 완전 초보에서 중급으로 가는 중이야. 한국어 해요체로 4~7문장 안에서 짧고 구체적으로 답해. 무게·횟수·세트·시간을 숫자로 말하고, 왜 그런지 한 문장으로 설명해.',
      '날카로운 통증, 붓기, 저림, 가슴 통증, 어지러움이 있으면 운동을 멈추고 병원에 가라고 먼저 말해. 진단이나 약 처방은 하지 마.',
      '앱 기능을 써서 해결할 수 있으면 알려줘: 운동 시작 때 컨디션 체크(최고/보통/피곤/안 좋음, 아픈 곳, 짧게 30분), 운동마다 자세 포인트 3개 확인, 세트 후 할만했다/조금 어려웠다/너무 힘들었다 평가로 무게 자동 조정, 플랜에서 분할·이 날 루틴·운동 바꾸기, 약속 생김(대체일).',
      '마크다운 제목, 표, 굵은 글씨는 쓰지 말고 필요하면 짧은 줄 목록만 써.',
      '',
      '[회원 정보]',
      context(),
    ].join('\n');
    const hist = [];
    const chat = (F.S.chat || []).filter((m) => m.text && !m.pending && !m.offline);
    for (let i = 0; i < chat.length - 1; i++) if (chat[i].role === 'me' && chat[i + 1].role === 'coach') hist.push(chat[i], chat[i + 1]);
    const msgs = hist.slice(-8).map((m) => ({ role: m.role === 'me' ? 'user' : 'assistant', content: m.text }));
    msgs.push({ role: 'user', content: q });
    msgs[0] = { role: 'user', content: rules + '\n\n[질문]\n' + msgs[0].content };
    return msgs;
  };

  C.send = async (q) => {
    q = String(q || '').trim();
    if (!q || C.busy) return;
    const s = F.S;
    s.chat = s.chat || [];
    s.chat.push({ role: 'me', text: q, t: Date.now(), ex: ctxEx || null });
    const msg = { role: 'coach', text: '', t: Date.now(), pending: true, g: s.settings.trainer };
    s.chat.push(msg);
    C.busy = true;
    C.paint();
    try {
      if (!canSample()) throw { code: 'offline' };
      const out = await F.Sync.sample(buildInput(q), { modelTier: 'default', cache: false, onText: ({ text }) => { msg.text = text; C.paintLast(); } });
      msg.text = (out && out.text) || msg.text || faqAnswer(q);
    } catch (e) {
      msg.text = (e && e.text) || faqAnswer(q);
      msg.offline = !(e && e.text);
      if (e && e.code === 'rate_limited') msg.text = '질문이 몰려서 잠깐 쉬어야 해요. 1분 뒤에 다시 물어봐 주세요.\n\n' + faqAnswer(q);
    }
    msg.pending = false;
    C.busy = false;
    F.save();
    C.paint();
  };

  const bubble = (m) => m.role === 'me'
    ? `<div class="cm me"><div class="b">${nl(m.text)}</div></div>`
    : `<div class="cm"><img src="${F.img.trainer(m.g || F.S.settings.trainer, 'face')}" alt=""><div class="b ${m.pending ? 'typing' : ''}">${m.pending && !m.text ? '<i></i><i></i><i></i>' : nl(m.text)}${m.offline ? '<span class="off">기본 답변 · claude.ai에서 열면 코치가 직접 답해요</span>' : ''}</div></div>`;
  const suggestions = () => {
    if (ctxEx && F.EXERCISES[ctxEx]) {
      const n = F.EXERCISES[ctxEx].name;
      return [`${n} 할 때 허리가 아파요`, `${n} 무게는 언제 올려요?`, `${n} 대신 할 수 있는 운동은?`, `${n}에서 가장 흔한 실수는?`];
    }
    return ['분할 운동이 뭐예요?', '근육통이 있는데 운동해도 돼요?', '오늘 너무 피곤한데 쉬어도 될까요?', '체중이 안 빠져요', '단백질은 얼마나 먹어야 해요?', '헬스장 기구가 어색해요'];
  };
  const chatHTML = () => {
    const t = TR(F.S.settings.trainer);
    const chat = F.S.chat || [];
    const greet = { role: 'coach', g: F.S.settings.trainer, text: `${UI.myName() ? UI.myName() + '님, ' : ''}궁금한 건 뭐든 물어보세요. 자세, 무게, 분할, 식단, 컨디션 — 회원님 기록을 보고 답해 드릴게요.` };
    return `<div class="chat">
      <div class="chat-head"><img src="${F.img.trainer(F.S.settings.trainer, 'face')}" alt=""><div><b>${esc(t.name)}</b><span class="t-xs mute">${esc(t.title)}${canSample() ? ' · 실시간 답변' : ' · 기본 답변 모드'}</span></div>
        ${chat.length ? '<button class="t-xs link" data-act="chat-clear">대화 지우기</button>' : ''}</div>
      ${ctxEx && F.EXERCISES[ctxEx] ? `<div class="chat-ctx">${F.icon('dumbbell', 'sm')}<span>${esc(F.EXERCISES[ctxEx].name)}에 대해 묻는 중</span><button class="t-xs link" data-act="chat-ctx-clear">해제</button></div>` : ''}
      <div class="chat-list" id="chat-list">${bubble(greet)}${chat.map(bubble).join('')}</div>
      <div class="chips chat-sug">${suggestions().map((x) => `<button class="chip" data-act="chat-sug" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <form class="chat-in" data-chat-form><input id="chat-q" class="input" placeholder="코치에게 질문하기" maxlength="300" autocomplete="off"><button class="btn primary" type="submit" aria-label="보내기" ${C.busy ? 'disabled' : ''}>${F.icon('send')}</button></form>
    </div>`;
  };
  const scrollChat = () => { const l = F.$('#chat-list'); if (l) l.scrollTop = l.scrollHeight; const sc = UI.isPC() ? null : document.scrollingElement; if (sc && F.route().name === 'ask') sc.scrollTop = sc.scrollHeight; };
  C.paint = () => {
    const host = F.$('[data-chat-host]');
    if (!host) return;
    const keep = (F.$('#chat-q') || {}).value || '';
    host.innerHTML = chatHTML();
    const inp = F.$('#chat-q'); if (inp) inp.value = keep;
    scrollChat();
  };
  C.paintLast = () => {
    const list = F.$('#chat-list'); if (!list) return;
    const chat = F.S.chat || []; const m = chat[chat.length - 1];
    const last = list.lastElementChild; if (!last || !m) return;
    last.outerHTML = bubble(m);
    scrollChat();
  };
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-chat-form]');
    if (!f) return;
    e.preventDefault();
    const inp = F.$('#chat-q', f);
    const q = inp ? inp.value : '';
    if (inp) inp.value = '';
    C.send(q);
  });
  A['chat-sug'] = (el) => C.send(el.dataset.q);
  A['chat-clear'] = async () => { if (!(await F.ask({ label: 'CHAT', title: '대화를 지울까요?', ok: '지우기', danger: true }))) return; F.S.chat = []; F.save(); C.paint(); };
  A['chat-ctx-clear'] = () => { ctxEx = null; C.paint(); };
  C.openSheet = (exId) => {
    ctxEx = exId || null;
    F.sheet('<div data-chat-host></div>', { wide: true });
    C.paint();
  };
  A['ask-ex'] = (el) => { ctxEx = el.dataset.id || null; if (UI.isPC() || F.$('#session.on')) C.openSheet(ctxEx); else location.hash = '#ask'; };

  V.ask = () => {
    const learn = (F.LEARN || []).slice(0, 6);
    const side = `<section class="learn-side"><div class="sec-h"><div><span class="t-label">WHY</span><h2 class="t-h2">왜 이렇게 운동하나요?</h2></div><a class="t-xs link" href="#learn">전체 보기 ›</a></div>
      <div class="list">${learn.map((a) => `<a href="#learn-${a.id}" class="row between" style="gap:10px"><span class="grow"><b>${esc(a.title)}</b><span class="t-xs mute" style="display:block">${esc(a.summary)}</span></span>${F.icon('chevR', 'sm')}</a>`).join('')}</div>
      <a class="btn block" href="#split" style="margin-top:14px">${F.icon('split', 'sm')}분할 운동 가이드</a></section>`;
    const html = UI.isPC()
      ? `<div class="page">${UI.ph('ASK YOUR TRAINER', '코치에게 질문', '자세, 무게, 분할, 컨디션, 식단까지 — 회원님 기록을 보고 답해요.')}<div class="split wide-l ask-pc"><section data-chat-host></section>${side}</div></div>`
      : `<div class="page ask-mo"><div data-chat-host></div>${side}</div>`;
    return { html, after: () => { C.paint(); } };
  };

  /* =========================================================
     LEARN — short articles a trainer would explain between sets
     ========================================================= */
  const TAGS = ['전체', '기초', '강도', '루틴', '회복'];
  let tagSel = '전체';
  V.learn = (rest) => {
    const list = (F.LEARN || []).filter((a) => tagSel === '전체' || a.tag === tagSel);
    const id = rest && rest[0];
    const art = id ? (F.LEARN || []).find((a) => a.id === id) : null;
    const listHTML = `<div class="chips">${TAGS.map((t) => `<button class="chip ${t === tagSel ? 'on' : ''}" data-act="learn-tag" data-v="${t}">${t}</button>`).join('')}</div>
      <div class="learn-list">${list.map((a, i) => `<a class="learn-item ${art && art.id === a.id ? 'on' : ''}" href="#learn-${a.id}"><span class="t-num">${F.pad(i + 1)}</span><span class="grow"><span class="t-label mute">${esc(a.tag)} · ${a.min}분</span><b>${esc(a.title)}</b><span class="t-xs mute2">${esc(a.summary)}</span></span>${F.icon('chevR', 'sm')}</a>`).join('')}</div>`;
    const artHTML = art ? `<article class="learn-art">
        <div class="t-label mute">${esc(art.tag)} · 읽는 데 ${art.min}분</div>
        <h1 class="t-h1" style="margin:8px 0 10px">${esc(art.title)}</h1>
        <p class="t-h3" style="font-weight:700">${esc(art.summary)}</p>
        ${(art.body || []).map((p) => `<p class="learn-p">${esc(p)}</p>`).join('')}
        ${art.try ? `<div class="callout" style="margin-top:16px">${F.icon('target')}<div><b>다음 운동에서 해볼 것</b>${esc(art.try)}</div></div>` : ''}
        <button class="btn block" data-act="ask-topic" data-q="${esc(art.title)}에 대해 더 알려주세요" style="margin-top:14px">${F.icon('chat', 'sm')}이 내용 코치에게 더 묻기</button>
      </article>` : '';
    if (UI.isPC()) {
      return `<div class="page">${UI.ph('LEARN', '운동 원리', '초보에서 중급으로 가는 동안 트레이너가 설명해 주는 것들이에요.')}
        <div class="split wide-r"><section>${listHTML}</section><section>${artHTML || `<div class="empty">왼쪽에서 읽을 글을 골라 주세요.</div>`}</section></div></div>`;
    }
    if (art) return `<div class="page"><a class="row t-small" href="#learn" style="margin-bottom:10px;font-weight:800">${F.icon('arrowL', 'sm')}운동 원리</a>${artHTML}</div>`;
    return `<div class="page">${UI.ph('LEARN', '운동 원리', '왜 이렇게 운동하는지, 트레이너가 짧게 설명해 줘요.')}${listHTML}</div>`;
  };
  A['learn-tag'] = (el) => { tagSel = el.dataset.v; UI.refresh(); };
  A['ask-topic'] = (el) => { ctxEx = null; location.hash = '#ask'; setTimeout(() => C.send(el.dataset.q), 120); };

  /* =========================================================
     SPLIT GUIDE — what 분할 운동 is and which one fits
     ========================================================= */
  const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
  V.split = () => {
    const s = F.S;
    const cur = F.E.splitId();
    const rec = F.E.recommendSplit();
    const cards = F.SPLIT_ORDER.map((id) => {
      const x = (F.SPLITS_INFO || {})[id] || { name: id };
      const on = cur === id;
      return `<section class="split-card ${on ? 'on' : ''}">
        <div class="row between"><span class="t-label">${esc(x.en || '')}</span>${on ? '<span class="tag dark">지금 사용 중</span>' : rec.id === id ? '<span class="tag">추천</span>' : ''}</div>
        <h2 class="t-h1" style="margin:6px 0 4px">${esc(x.name)}</h2>
        <div class="row wrap" style="gap:6px"><span class="tag line">${esc(x.level || '')}</span><span class="tag line">${esc(x.freq || '')}</span></div>
        <div class="week7">${(x.week || []).map((d, i) => `<div class="${/휴식/.test(d) ? 'rest' : ''}"><span class="t-label">${DAYS[i]}</span><b>${esc(d)}</b></div>`).join('')}</div>
        <p class="t-small" style="margin-top:10px"><b>누구에게:</b> ${esc(x.who || '')}</p>
        <p class="t-small mute2" style="margin-top:6px">${esc(x.why || '')}</p>
        <div class="grid g2" style="margin-top:10px;gap:10px">
          <ul class="pc-list">${(x.pros || []).map((p) => `<li>${F.icon('check', 'sm')}<span>${esc(p)}</span></li>`).join('')}</ul>
          <ul class="pc-list con">${(x.cons || []).map((p) => `<li>${F.icon('x', 'sm')}<span>${esc(p)}</span></li>`).join('')}</ul>
        </div>
        <div class="t-xs mute" style="margin-top:8px">루틴: ${(F.SPLIT_ROT[id] || []).map((t) => esc(F.TEMPLATES[t].name)).join(' → ')} → 반복</div>
        ${on && s.settings.split !== 'auto' ? '' : `<button class="btn ${on ? '' : 'primary'} block" style="margin-top:12px" data-act="set-split" data-v="${id}">${on ? '직접 선택으로 고정' : '이 분할로 하기'}</button>`}
      </section>`;
    }).join('');
    return `<div class="page">${UI.ph('SPLIT', '분할 운동 가이드', esc(F.SPLIT_INTRO || '분할 운동은 날마다 운동할 부위를 나눠서, 근육이 쉬는 동안 다른 부위를 운동하는 방법이에요.'))}
      <div class="callout" style="margin-bottom:14px">${F.icon('info')}<div><b>${s.settings.split === 'auto' ? `자동 추천 사용 중 — 지금은 ${esc(((F.SPLITS_INFO || {})[cur] || {}).name || cur)}` : '직접 고른 분할 사용 중'}</b>${esc(rec.why)} 분할을 바꿔도 운동별 무게 기록은 그대로 이어져요.
        ${s.settings.split !== 'auto' ? '<button class="t-xs link" data-act="set-split" data-v="auto" style="display:block;margin-top:6px">자동 추천으로 돌아가기</button>' : ''}</div></div>
      <div class="split-cards">${cards}</div>
      <a class="btn block" href="#plan" style="margin-top:16px">${F.icon('plan', 'sm')}플랜에서 이 날 루틴 · 운동 바꾸기</a></div>`;
  };
  A['set-split'] = (el) => {
    const v = el.dataset.v;
    F.S.settings.split = v;
    F.save(true);
    F.toast(v === 'auto' ? '자동 추천 분할로 돌아갔어요' : `${((F.SPLITS_INFO || {})[v] || {}).name || v}로 바꿨어요. 다음 운동부터 적용돼요`);
    UI.refresh();
  };
})(window.F);
