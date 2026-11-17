/* Boot */
(function (F) {
  'use strict';
  const a = F.S.active;
  if (a && a.result) F.S.active = null;
  else if (a && a.date < F.today()) {
    if (a.log && Object.keys(a.log).length) F.UI.sess.finishSilently(a);
    F.S.active = null;
  }
  F.save(true);
  F.UI.applyTheme();
  F.render();
  F.Alarm.start();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  // re-render at midnight so "today" rolls over
  let day = F.today();
  setInterval(() => { if (F.today() !== day) { day = F.today(); if (!F.$('#session.on')) F.render(); } }, 60000);
})(window.F);
