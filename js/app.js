/* Boot: render from the local cache at once, then light up cloud sync when claude.ai provides it. */
(function (F) {
  'use strict';
  const cleanStale = () => {
    const a = F.S.active;
    if (a && a.result) F.S.active = null;
    else if (a && a.date < F.today()) {
      if (a.log && Object.keys(a.log).length) F.UI.sess.finishSilently(a);
      F.S.active = null;
    }
  };
  const inClaude = !!(window.claude && typeof window.claude.use === 'function');
  let painted = false;
  const paint = () => { painted = true; cleanStale(); F.$('#app').dataset.shell = ''; F.UI._resumeAsked = false; F.render(); };
  F.UI.applyTheme();
  F.UI.applyMode();
  if (inClaude) {
    F.UI.boot();
    F.Sync.onEarly = paint;
    // never leave the person on the loading screen
    setTimeout(() => { if (!painted) paint(); }, 20000);
  } else {
    cleanStale();
    F.render();
  }
  F.Alarm.start();

  // remote changes (the other device / the partner): re-render when nothing modal is open
  let pending = false;
  const rerender = () => {
    if (F.$('#session.on') || F.$('.sheet-wrap') || (document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { pending = true; F.UI.updateTop(); return; }
    pending = false;
    F.UI.refresh();
  };
  const close = F.closeSheet;
  F.closeSheet = (instant) => { close(instant); if (pending) setTimeout(rerender, 220); };
  document.addEventListener('focusout', () => { if (pending) setTimeout(rerender, 50); });

  F.Sync.init(() => rerender()).then((cloud) => {
    if (!cloud) { if (!painted) paint(); return; }
    if (!painted) { paint(); return; }
    rerender(); // cloud copy replaced the early cache: refresh when nothing is open
  }).catch((e) => { console.warn('sync init', e); if (!painted) paint(); });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.top === window.self && !window.claude) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  let day = F.today();
  setInterval(() => { if (F.today() !== day) { day = F.today(); if (!F.$('#session.on')) F.render(); } }, 60000);
})(window.F);
