/* Gym alarms: in-app checker (sound + vibration + system notification while the app is open)
   and an .ics export so the phone's own calendar can ring even when the app is closed. */
window.F = window.F || {};
(function (F) {
  'use strict';
  const A = (F.Alarm = {});

  A.permission = () => ('Notification' in window ? Notification.permission : 'unsupported');
  A.request = async () => {
    if (!('Notification' in window)) { F.toast('이 브라우저는 알림을 지원하지 않아요. 캘린더 내보내기를 이용해 주세요.'); return 'unsupported'; }
    const r = await Notification.requestPermission();
    F.toast(r === 'granted' ? '알림이 켜졌어요' : '알림이 차단돼 있어요 — 브라우저 설정에서 허용해 주세요');
    return r;
  };

  A.notify = async (title, body) => {
    if (A.permission() !== 'granted') return;
    const opts = { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', tag: 'mypt-gym', renotify: true, vibrate: [200, 100, 200] };
    try {
      const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
      if (reg) { await reg.showNotification(title, opts); return; }
    } catch (e) { /* fall through */ }
    try { new Notification(title, opts); } catch (e) { /* ignore */ }
  };

  /** Triggers for a date: [{at:minutes, kind:'lead'|'start'}] */
  A.triggers = (k) => {
    const pl = F.E.planFor(k);
    if (!pl) return [];
    const t = F.timeToMin(pl.time);
    const lead = +F.S.settings.alarmLead || 0;
    const out = [{ at: t, kind: 'start' }];
    if (lead > 0) out.unshift({ at: t - lead, kind: 'lead' });
    return out;
  };

  A.check = () => {
    const s = F.S;
    if (!s.profile || !s.settings.alarmOn) return;
    const k = F.today();
    const ses = s.sessions[k];
    if (ses && (ses.status === 'done' || ses.status === 'partial')) return;
    if (s.active && s.active.date === k) return;
    const now = F.nowMin();
    const snooze = s.snoozeUntil && s.snoozeUntil.k === k ? s.snoozeUntil.at : null;
    if (snooze != null && now >= snooze && !s.alarmFired[`${k}|snooze${snooze}`]) {
      s.alarmFired[`${k}|snooze${snooze}`] = 1; F.save();
      A.fire(k, 'start');
      return;
    }
    for (const tr of A.triggers(k)) {
      const key = `${k}|${tr.kind}`;
      if (s.alarmFired[key]) continue;
      if (now >= tr.at && now < tr.at + 45) { s.alarmFired[key] = 1; F.save(); A.fire(k, tr.kind); break; }
    }
    // tidy old keys
    const old = Object.keys(s.alarmFired).filter((x) => x.slice(0, 10) < F.addDays(k, -14));
    if (old.length) { old.forEach((x) => delete s.alarmFired[x]); F.save(); }
  };

  A.fire = (k, kind) => {
    const tid = F.E.templateFor(k);
    const t = F.TEMPLATES[tid];
    const pl = F.E.planFor(k);
    const coach = F.coachName();
    const title = kind === 'lead' ? `${F.S.settings.alarmLead}분 뒤 운동 시작이에요` : '운동 갈 시간이에요!';
    const body = `${t ? t.name : '오늘 운동'} · ${pl ? pl.time : ''} — ${F.josa(coach, '이/가')} 기다리고 있어요.`;
    F.beep(); F.vibrate([300, 120, 300, 120, 600]);
    A.notify(title, body);
    if (F.UI && F.UI.alarmModal) F.UI.alarmModal(k, kind, title, body);
  };

  A.snooze = (min = 10) => {
    F.S.snoozeUntil = { k: F.today(), at: F.nowMin() + min };
    F.save(); F.closeSheet();
    F.toast(`${min}분 뒤에 다시 알려드릴게요`);
  };

  A.start = () => {
    clearInterval(A._iv);
    A._iv = setInterval(A.check, 20000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) A.check(); });
    setTimeout(A.check, 1500);
  };

  /* ---------- .ics export (next N weeks) ---------- */
  const icsEsc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const fold = (line) => { // RFC 5545: 75 octets per line
    const out = []; let cur = ''; let bytes = 0;
    for (const ch of line) {
      const b = new TextEncoder().encode(ch).length;
      if (bytes + b > 73) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
    }
    out.push(cur); return out.join('\r\n');
  };
  const stamp = (k, min) => `${k.replace(/-/g, '')}T${F.pad(Math.floor(min / 60))}${F.pad(min % 60)}00`;

  A.exportICS = (weeks = 8) => {
    const s = F.S;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MY PT//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:MY PT 운동', 'X-WR-TIMEZONE:Asia/Seoul',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Seoul', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0900', 'TZOFFSETTO:+0900', 'TZNAME:KST', 'END:STANDARD', 'END:VTIMEZONE'];
    let k = F.today();
    const end = F.addDays(k, weeks * 7);
    const now = new Date();
    const dtstamp = `${now.getUTCFullYear()}${F.pad(now.getUTCMonth() + 1)}${F.pad(now.getUTCDate())}T${F.pad(now.getUTCHours())}${F.pad(now.getUTCMinutes())}00Z`;
    let n = 0;
    while (k < end) {
      const pl = F.E.planFor(k);
      const ses = s.sessions[k];
      if (pl && !(ses && ses.status)) {
        const tid = F.E.templateFor(k);
        const t = F.TEMPLATES[tid];
        const st = F.timeToMin(pl.time);
        const dur = F.E.estimateMinutes(tid) || 75;
        const exNames = t.ex.map((id) => (F.EXERCISES[id] ? F.EXERCISES[id].name : id)).join(', ');
        lines.push('BEGIN:VEVENT',
          `UID:mypt-${k}@mypt.local`, `DTSTAMP:${dtstamp}`,
          `DTSTART;TZID=Asia/Seoul:${stamp(k, st)}`, `DTEND;TZID=Asia/Seoul:${stamp(k, Math.min(st + dur, 23 * 60 + 59))}`,
          fold(`SUMMARY:${icsEsc(`🏋️ 헬스 · ${t.name}`)}`),
          fold(`DESCRIPTION:${icsEsc(`${F.josa(F.coachName(), '과/와')} ${t.name}\n${exNames}\n+ 유산소\nMY PT 앱에서 '운동 시작'을 눌러 주세요.`)}`),
          'BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${icsEsc('운동 갈 시간이에요!')}`), 'TRIGGER:PT0M', 'END:VALARM');
        if (+s.settings.alarmLead > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${icsEsc(`${s.settings.alarmLead}분 뒤 운동 시작`)}`), `TRIGGER:-PT${+s.settings.alarmLead}M`, 'END:VALARM');
        lines.push('END:VEVENT');
        n++;
      }
      k = F.addDays(k, 1);
    }
    lines.push('END:VCALENDAR');
    F.Sync.download(`mypt-schedule-${F.today()}.ics`, lines.join('\r\n'), 'text/calendar;charset=utf-8');
    F.toast(`${n}개의 운동 일정을 캘린더 파일로 내보냈어요`);
    return n;
  };
})(window.F);
