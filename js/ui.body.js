/* Body: InBody photo upload → OCR → confirm → save (original kept in IndexedDB),
   monthly trend charts, analysis & projections, quick weight log. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const UI = F.UI, V = F.V, A = F.act, esc = F.esc;
  const M = () => F.E.METRICS;
  let showMore = false;

  const FIELDS = [
    ['weight', '체중', 'kg', 0.1, true], ['smm', '골격근량', 'kg', 0.1], ['bfm', '체지방량', 'kg', 0.1], ['pbf', '체지방률', '%', 0.1],
    ['bmi', 'BMI', 'kg/m²', 0.1], ['vfl', '내장지방 레벨', '', 1], ['bmr', '기초대사량', 'kcal', 1], ['score', '인바디 점수', '점', 1],
    ['whr', '복부지방률', '', 0.01], ['tbw', '체수분', 'L', 0.1], ['ffm', '제지방량', 'kg', 0.1],
  ];

  const weightSeries = () => {
    const map = {};
    for (const w of F.S.weights || []) map[w.d] = w.w;
    for (const r of F.S.inbody || []) if (r.weight) map[r.date] = r.weight;
    return Object.entries(map).map(([x, y]) => ({ x, y })).sort((a, b) => (a.x < b.x ? -1 : 1));
  };

  V.body = () => {
    const s = F.S;
    const an = F.E.inbodyAnalysis();
    const list = F.E.sortedInbody();
    const last = list[list.length - 1];
    const k = F.today();
    const nextDue = last ? F.addDays(last.date, 30) : k;
    const p = s.profile;
    const b = F.E.body();

    const upload = `<div class="card accent">
      <div class="row between"><span class="t-label">INBODY · MONTHLY</span><span class="t-label">${last ? `NEXT ${F.dateLabel(nextDue, false)}` : 'FIRST SCAN'}</span></div>
      <h2 class="t-h1" style="margin:10px 0 6px">${last ? (F.diffDays(last.date, k) >= 28 ? '측정할 때가 됐어요' : '다음 측정까지 ' + Math.max(0, F.diffDays(k, nextDue)) + '일') : '인바디 결과지를 찍어주세요'}</h2>
      <p class="t-small" style="font-weight:600">결과지 전체가 나오게, 그림자 없이 정면에서 찍어주세요. 체중·골격근량·체지방 등 핵심 수치를 자동으로 읽고 원본도 함께 저장해요.</p>
      <div class="btn-row" style="margin-top:14px">
        <label class="btn dark" style="flex:1.4;cursor:pointer">${F.icon('camera')}사진 올리기<input type="file" accept="image/*" class="sr" data-change="ib-file"></label>
        <button class="btn" style="background:transparent" data-act="ib-manual">${F.icon('edit')}직접 입력</button>
      </div>
      <details class="acc" style="margin-top:12px;border-color:rgba(0,0,0,.25)"><summary class="t-small">정확하게 측정하는 법 ${F.icon('chevD', 'sm')}</summary><div class="t-small" style="font-weight:600">
        · 아침 공복, 화장실 다녀온 뒤 측정해요<br>· 측정 전 운동·사우나·샤워는 피해요 (수분 변화)<br>· 매번 같은 기계, 같은 시간대, 비슷한 옷차림으로<br>· 측정 간격은 4주 — 너무 자주 재면 오차가 변화보다 커요</div></details>
    </div>`;

    let summary = '';
    if (last) {
      const prev = an.prev;
      const cell = (key) => {
        const m = M()[key];
        const v = last[key];
        const dv = an.deltas[key] ? an.deltas[key].prev : null;
        let cls = '';
        if (dv != null && dv !== 0) cls = (dv < 0) === (m.good === 'down') ? 'good' : 'bad';
        return `<div><span class="t-label mute">${esc(m.label)}</span><div class="t-num-l" style="margin-top:6px">${v != null ? F.num(v, m.dec) : '–'}<span class="unit">${esc(m.unit)}</span></div>${dv != null ? `<span class="delta ${cls}">${F.signed(dv, m.dec)} <span class="mute" style="font-weight:500">전월</span></span>` : '<span class="t-xs mute">기준값</span>'}</div>`;
      };
      summary = `<div class="row between" style="margin-bottom:10px"><span class="t-klabel">${F.dateLong(last.date)} 측정${prev ? ` · 이전 ${F.dateLong(prev.date)}` : ''}</span>${last.img ? `<button class="t-xs link" data-act="ib-view" data-id="${last.id}">원본 보기</button>` : ''}</div>
        <div class="mgrid">${['weight', 'smm', 'bfm', 'pbf', 'bmi', 'vfl', 'bmr', 'score'].map(cell).join('')}</div>`;
    }

    const insights = an ? `<div>${an.insights.map((it) => `<div class="insight ${it.lv}"><span class="mk">${F.icon(it.lv === 'good' ? 'check' : it.lv === 'warn' ? 'info' : 'chart', 'sm')}</span><div class="grow"><b>${esc(it.title)}</b><p>${esc(it.body)}</p>
        ${it.act && it.act.kcalAdj ? `<button class="btn sm" style="margin-top:8px" data-act="apply-adj" data-v="${it.act.kcalAdj}">추천 적용: 하루 ${F.signed(it.act.kcalAdj, 0)}kcal</button>` : ''}</div></div>`).join('')}
        ${s.settings.kcalAdj ? `<p class="t-xs mute" style="margin-top:8px">현재 칼로리 보정: ${F.signed(s.settings.kcalAdj, 0)}kcal <button class="link" data-act="apply-adj" data-v="reset">초기화</button></p>` : ''}</div>` : '';

    let projection = '';
    if (an && an.projection) {
      const pr = an.projection;
      projection = `<div class="card ink" style="margin-top:12px"><span class="t-label mute">PROJECTION</span>
        ${pr.date ? `<div class="t-h2" style="color:#fff;margin-top:8px">지금 속도면 <span class="acc">${F.dateLong(pr.date)}</span>에 목표 ${F.num1(p.goalWeight)}kg 도달</div><p class="mute t-small" style="margin-top:4px">주당 ${F.num1(-pr.slopeWeek)}kg 감량 추세 (인바디 ${list.length}회 기록 기반 직선 추세)</p>`
        : `<div class="t-h3" style="color:#fff;margin-top:8px">아직 감량 추세가 뚜렷하지 않아요</div><p class="mute t-small" style="margin-top:4px">2~3회 더 측정하면 목표 도달 예상일을 계산해 드려요.</p>`}</div>`;
    }

    const charts = ['weight', 'smm', 'bfm', 'pbf'].concat(showMore ? ['bmi', 'vfl', 'bmr', 'score'] : []);
    const chartHtml = charts.map((key) => {
      const m = M()[key];
      const data = key === 'weight' ? weightSeries() : list.filter((r) => r[key] != null).map((r) => ({ x: r.date, y: r[key] }));
      const lastV = data.length ? data[data.length - 1].y : null;
      const firstV = data.length ? data[0].y : null;
      const dv = data.length > 1 ? lastV - firstV : null;
      let cls = '';
      if (dv != null && dv !== 0) cls = (dv < 0) === (m.good === 'down') ? 'good' : 'bad';
      return `<div class="card"><div class="row between"><div><span class="t-label mute">${esc(m.label)}${key === 'weight' ? ' · 인바디+체중기록' : ''}</span>
          <div class="t-num-l" style="margin-top:4px">${lastV != null ? F.num(lastV, m.dec) : '–'}<span class="unit">${esc(m.unit)}</span></div></div>
          ${dv != null ? `<span class="delta ${cls}">${F.signed(dv, m.dec)} 시작 대비</span>` : ''}</div>
          <div class="chart-wrap" data-chart="${key}" style="margin-top:10px"></div></div>`;
    }).join('');

    const table = list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>DATE</th><th>체중</th><th>골격근</th><th>체지방</th><th>체지방률</th><th>BMI</th><th>내장</th><th>BMR</th><th>점수</th><th></th></tr></thead><tbody>
        ${list.slice().reverse().map((r) => `<tr><td>${F.dateLong(r.date)}</td><td>${F.num(r.weight, 1)}</td><td>${r.smm != null ? F.num(r.smm, 1) : '–'}</td><td>${r.bfm != null ? F.num(r.bfm, 1) : '–'}</td><td>${r.pbf != null ? F.num(r.pbf, 1) : '–'}</td><td>${r.bmi != null ? F.num(r.bmi, 1) : '–'}</td><td>${r.vfl != null ? r.vfl : '–'}</td><td>${r.bmr != null ? F.num(r.bmr) : '–'}</td><td>${r.score != null ? r.score : '–'}</td>
          <td class="k"><span class="row" style="gap:2px">${r.img ? `<button class="icon-btn" style="width:32px;height:32px" data-act="ib-view" data-id="${r.id}" aria-label="원본">${F.icon('camera', 'sm')}</button>` : ''}<button class="icon-btn" style="width:32px;height:32px" data-act="ib-edit" data-id="${r.id}" aria-label="수정">${F.icon('edit', 'sm')}</button></span></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">아직 인바디 기록이 없어요. 첫 기록이 기준점이 돼요.</div>`;

    const lw = (s.weights || []).slice(-1)[0];
    const quick = `<div class="card"><span class="t-label mute">QUICK LOG · 인바디 사이 체중</span>
      <div class="row" style="margin-top:10px;gap:8px"><div class="input-unit grow"><input class="input num" id="qw" type="number" inputmode="decimal" step="0.1" placeholder="${F.num1(b.weight)}"><em>kg</em></div><button class="btn dark" data-act="quick-weight">기록</button></div>
      <p class="t-xs mute" style="margin-top:8px">주 1회 같은 요일 아침 공복에 재면 추세가 정확해요.${lw ? ` 마지막 기록: ${F.dateLabel(lw.d, false)} ${F.num1(lw.w)}kg` : ''}</p></div>`;

    const html = `${UI.ph('BODY', '바디 · 인바디', '한 달에 한 번 인바디 결과지를 올리면 핵심 지표를 읽어 변화 추이를 분석해 드려요.')}
      <div class="cols">
        <div>
          <section>${upload}</section>
          ${last ? `<section class="sec">${UI.secH('LATEST', '최근 측정 결과', '')}${summary}</section>` : ''}
          <section class="sec">${UI.secH('TREND', '월별 변화 추이', `<button data-act="ib-more">${showMore ? '접기' : '지표 더 보기'} ${F.icon(showMore ? 'minus' : 'plus', 'sm')}</button>`)}
            <div class="grid g-md-2">${chartHtml}</div></section>
        </div>
        <div>
          ${an ? `<section class="sec">${UI.secH('ANALYSIS', `${esc(F.coachName())}의 분석`, '')}${insights}${projection}</section>` : `<section class="sec">${UI.secH('ANALYSIS', '분석', '')}<div class="empty">인바디를 등록하면 감량의 질(지방 vs 근육), 속도, 목표 도달 예상일을 분석해요.</div></section>`}
          <section class="sec">${quick}</section>
        </div>
      </div>
      <section class="sec">${UI.secH('HISTORY', '측정 기록 · 원본', '')}${table}</section>`;

    const after = (root) => {
      F.$$('[data-chart]', root).forEach((elc) => {
        const key = elc.dataset.chart;
        const m = M()[key];
        const data = key === 'weight' ? weightSeries() : list.filter((r) => r[key] != null).map((r) => ({ x: r.date, y: r[key] }));
        F.Chart.line(elc, { data, unit: m.unit === 'kg' || m.unit === '%' ? m.unit : '', dec: m.dec, h: 170, label: m.label, good: m.good, goal: key === 'weight' ? p.goalWeight : null, goalLabel: '목표' });
      });
    };
    return { html, after };
  };

  A['ib-more'] = () => { showMore = !showMore; UI.refresh(); };
  A['apply-adj'] = (el) => {
    const v = el.dataset.v;
    if (v === 'reset') F.S.settings.kcalAdj = 0;
    else F.S.settings.kcalAdj = F.clamp((F.S.settings.kcalAdj || 0) + +v, -300, 300);
    F.save();
    F.toast(`칼로리 보정 ${F.signed(F.S.settings.kcalAdj, 0)}kcal 적용 — 식단 목표가 바뀌었어요`);
    UI.refresh();
  };
  A['quick-weight'] = () => {
    const v = parseFloat(F.$('#qw').value);
    if (!(v > 30 && v < 250)) { F.toast('체중을 확인해 주세요'); return; }
    const k = F.today();
    F.S.weights = (F.S.weights || []).filter((w) => w.d !== k);
    F.S.weights.push({ d: k, w: Math.round(v * 10) / 10 });
    F.E.addXP(`weigh:${F.mondayOf(k)}`, 10, '주간 체중 기록');
    F.E.checkBadges();
    F.save(); F.toast('체중을 기록했어요'); UI.refresh();
  };

  /* ---------- OCR flow ---------- */
  let pending = null; // {file, url}
  A['ib-file'] = async (input) => {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (pending && pending.url) URL.revokeObjectURL(pending.url);
    pending = { file, url: URL.createObjectURL(file) };
    const w = F.sheet(`<div class="t-label mute">SCANNING</div><h2 class="t-h2" style="margin:6px 0 12px">결과지를 읽고 있어요</h2>
      <div class="media" style="max-height:340px"><img src="${pending.url}" alt="인바디 결과지" style="object-fit:contain;max-height:340px;background:#fff"></div>
      <div class="ocr-prog"><i id="ocr-bar" style="width:4%"></i></div>
      <p class="t-small mute2" id="ocr-msg" style="margin-top:8px">한국어 인식 엔진을 준비하는 중… (처음 한 번은 10~20초 걸려요)</p>`);
    const bar = F.$('#ocr-bar', w), msg = F.$('#ocr-msg', w);
    const labels = { 'loading tesseract core': '엔진 불러오는 중', 'initializing tesseract': '엔진 준비 중', 'loading language traineddata': '한국어 데이터 불러오는 중', 'initializing api': '인식기 준비 중', 'recognizing text': '글자 인식 중' };
    try {
      const text = await F.OCR.recognize(file, (m) => {
        if (!bar.isConnected) return;
        const base = m.status === 'recognizing text' ? 40 : 5;
        const span = m.status === 'recognizing text' ? 58 : 30;
        bar.style.width = `${Math.round(base + (m.progress || 0) * span)}%`;
        msg.textContent = `${labels[m.status] || m.status}… ${Math.round((m.progress || 0) * 100)}%`;
      });
      const parsed = F.OCR.parse(text, { height: F.S.profile.height });
      const found = Object.keys(parsed.values).filter((k2) => parsed.src[k2] === 'ocr').length;
      openForm({ values: parsed.values, src: parsed.src, warnings: parsed.warnings, date: parsed.date || F.today(), img: true, note: found ? `${found}개 항목을 자동으로 읽었어요. 원본과 비교해 확인 후 저장해 주세요.` : '글자를 충분히 읽지 못했어요. 사진을 보며 직접 입력해 주세요 (원본은 함께 저장돼요).' });
    } catch (e) {
      console.warn(e);
      openForm({ values: {}, src: {}, warnings: [], date: F.today(), img: true, note: `자동 인식을 사용할 수 없어요 (${e.message || e}). 사진을 보며 직접 입력해 주세요 — 원본은 함께 저장돼요.` });
    }
  };
  A['ib-manual'] = () => { pending = null; openForm({ values: {}, src: {}, warnings: [], date: F.today(), img: false, note: '' }); };
  A['ib-edit'] = (el) => {
    const r = F.S.inbody.find((x) => x.id === el.dataset.id);
    if (!r) return;
    pending = null;
    const values = {}; FIELDS.forEach(([k2]) => { if (r[k2] != null) values[k2] = r[k2]; });
    openForm({ values, src: {}, warnings: [], date: r.date, img: !!r.img, editId: r.id, note: '' });
  };

  const openForm = (o) => {
    const fields = FIELDS.map(([key, label, unit, step, req]) => {
      const v = o.values[key];
      const src = o.src[key];
      const badge = src === 'ocr' ? '<span class="pill-ok" style="padding:1px 6px">자동</span>' : src === 'calc' ? '<span class="tag" style="height:20px">계산</span>' : src === 'check' ? '<span class="pill-no" style="padding:1px 6px">확인</span>' : '';
      return `<label class="field" style="margin:0"><span class="row between">${label}${req ? ' *' : ''} ${badge}</span>
        <div class="input-unit"><input class="input num" name="${key}" type="number" inputmode="decimal" step="${step}" value="${v != null ? v : ''}" style="${req && v == null ? 'border-color:var(--bad)' : ''}"><em>${unit}</em></div></label>`;
    }).join('');
    const imgHtml = o.img && pending ? `<div class="media" style="max-height:300px;margin-bottom:14px"><img src="${pending.url}" alt="원본" style="object-fit:contain;max-height:300px;background:#fff"></div>` : '';
    F.sheet(`<div class="t-label mute">${o.editId ? 'EDIT' : 'CONFIRM'}</div><h2 class="t-h2" style="margin:6px 0 8px">인바디 수치 확인</h2>
      ${o.note ? `<div class="callout" style="margin-bottom:12px">${F.icon('info')}<div class="t-small">${esc(o.note)}</div></div>` : ''}
      ${(o.warnings || []).map((w) => `<div class="callout warn" style="margin-bottom:8px">${F.icon('info')}<div class="t-small">${esc(w)}</div></div>`).join('')}
      ${imgHtml}
      <form id="ib-form" autocomplete="off">
        <label class="field" style="margin-bottom:14px"><span>측정일</span><input class="input num" type="date" name="date" value="${o.date}" max="${F.today()}"></label>
        <div class="grid g2" style="gap:12px">${fields}</div>
        <button class="btn primary lg block" style="margin-top:18px" type="submit">${F.icon('check')}${o.editId ? '수정 저장' : '저장하고 분석하기'}</button>
        ${o.editId ? `<button class="btn ghost block" style="margin-top:8px" type="button" data-act="ib-del" data-id="${o.editId}">${F.icon('trash', 'sm')}이 기록 삭제</button>` : ''}
      </form>`, {
      wide: true,
      onOpen: (w) => {
        F.$('#ib-form', w).addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const rec = o.editId ? F.S.inbody.find((x) => x.id === o.editId) : { id: F.uid() };
          rec.date = fd.get('date') || F.today();
          for (const [key] of FIELDS) { const v = fd.get(key); rec[key] = v === '' || v == null ? null : parseFloat(v); }
          if (!(rec.weight > 30 && rec.weight < 250)) { F.toast('체중은 꼭 입력해 주세요'); return; }
          if (rec.pbf == null && rec.bfm != null) rec.pbf = Math.round((rec.bfm / rec.weight) * 1000) / 10;
          if (rec.bfm == null && rec.pbf != null) rec.bfm = Math.round((rec.weight * rec.pbf) / 10) / 10;
          if (rec.bmi == null) rec.bmi = Math.round(F.E.bmi(rec.weight, F.S.profile.height) * 10) / 10;
          if (o.img && pending && pending.file) {
            const fid = 'ib_' + rec.id;
            try { await F.idb.put(fid, pending.file); rec.img = fid; } catch (err) { F.toast('원본 사진 저장에 실패했어요 (저장 공간 확인)'); }
          }
          if (!o.editId) {
            F.S.inbody.push(rec);
            F.E.addXP(`inbody:${rec.date.slice(0, 7)}`, 80, '인바디 기록');
          }
          F.E.checkBadges();
          F.save(true);
          pending = null;
          F.closeSheet();
          F.toast(o.editId ? '수정했어요' : '인바디를 저장했어요 · 칼로리·단백질 목표가 갱신됐어요');
          location.hash = '#/body';
          UI.refresh();
        });
      },
    });
  };
  A['ib-del'] = async (el) => {
    const id = el.dataset.id;
    if (!confirm('이 인바디 기록과 원본 사진을 삭제할까요?')) return;
    const r = F.S.inbody.find((x) => x.id === id);
    if (r && r.img) { try { await F.idb.del(r.img); } catch (e) { /* ignore */ } }
    F.S.inbody = F.S.inbody.filter((x) => x.id !== id);
    F.save(true); F.closeSheet(); UI.refresh();
  };
  A['ib-view'] = async (el) => {
    const r = F.S.inbody.find((x) => x.id === el.dataset.id);
    if (!r) return;
    const url = await F.fileURL(r.img);
    F.sheet(`<div class="t-label mute">ORIGINAL · ${F.dateLong(r.date)}</div><h2 class="t-h2" style="margin:6px 0 12px">인바디 원본</h2>
      ${url ? `<img src="${url}" alt="인바디 원본" style="width:100%;background:#fff">` : '<div class="empty">원본 사진을 찾을 수 없어요 (다른 기기에서 등록했거나 저장소가 비워졌어요)</div>'}`, { wide: true });
  };
})(window.F);
