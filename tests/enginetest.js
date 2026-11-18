// Engine checks for V3: splits, per-day routine choice, swaps, level-ups, assisted machine, condition plans.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  const res = await page.evaluate(() => {
    const out = [];
    const ok = (c, m) => out.push((c ? 'PASS ' : 'FAIL ') + m);
    // a profile without the UI
    const s = F.S;
    s.profile = { name: '테스트', sex: 'm', age: 32, height: 171, weight: 90, goalWeight: 80, pace: 'normal', startDate: F.addDays(F.today(), -14) };
    s.settings.freq = 3; s.settings.days = [1, 3, 5];
    // splits
    ok(F.E.splitId() === 'full' && F.E.rotation().join() === 'FA,FB,FC', 'auto split = full body at 3x/week');
    s.settings.freq = 4; s.settings.days = [1, 2, 4, 5];
    ok(F.E.splitId() === 'ul' && F.E.rotation().join() === 'UA,LA,UB,LB', 'auto split = upper/lower at 4x/week');
    s.settings.split = 'ppl';
    ok(F.E.rotation().join() === 'PU,PL,LG', 'chosen 3-day split cycles push/pull/legs');
    ok(F.E.templateEx('PU').includes('pushup') && F.E.templateEx('LG').includes('reverse_lunge'), 'push/legs templates include the new basics');
    s.settings.split = 'full'; s.settings.freq = 3; s.settings.days = [1, 3, 5];
    // per-day routine: choosing FC on the next planned day makes the following one FA
    const d1 = F.E.nextPlanned(F.addDays(F.today(), 1));
    const d2 = F.E.nextPlanned(F.addDays(d1, 1));
    const before = [F.E.templateFor(d1), F.E.templateFor(d2)];
    F.E.setDayTemplate(d1, 'FC');
    ok(F.E.templateFor(d1) === 'FC' && F.E.templateFor(d2) === 'FA', `per-day routine continues the cycle after it (${before.join('→')} became FC→${F.E.templateFor(d2)})`);
    F.E.setDayTemplate(d1, null);
    ok(F.E.templateFor(d1) === before[0], 'per-day routine can go back to automatic');
    // swaps
    F.E.swapEx('FA', 'leg_press', 'goblet_squat');
    ok(F.E.templateEx('FA')[0] === 'goblet_squat' && F.E.templateEx('LA')[0] === 'leg_press', 'swap in one routine only');
    F.E.swapEx(null, 'lat_pulldown', 'assisted_pullup', true);
    ok(['FA', 'FC', 'UA', 'PL'].every((t) => F.E.templateEx(t).includes('assisted_pullup') && !F.E.templateEx(t).includes('lat_pulldown')), 'level-up swap applies to every routine');
    F.E.resetSwaps('FA');
    ok(F.E.templateEx('FA')[0] === 'leg_press', 'reset one routine to default');
    // level-up suggestion after two solid sessions
    const st = F.E.exState('goblet_squat');
    st.hist.push({ d: F.today(), w: 16, r: 12, rating: 'good', src: 'session' }, { d: F.today(), w: 16, r: 13, rating: 'easy', src: 'session' });
    const ups = F.E.levelUps();
    ok(ups.some((u) => u.from === 'goblet_squat' && u.to === 'back_squat') === false, 'barbell squat not offered in phase 1 (level gate)');
    const bw = F.E.exState('db_row'); bw.hist.push({ d: F.today(), w: 12, r: 12, rating: 'good', src: 'session' }, { d: F.today(), w: 12, r: 12, rating: 'easy', src: 'session' });
    ok(F.E.levelUps().every((u) => (F.EXERCISES[u.to].level || 1) <= F.E.phase().id + 1), 'level-ups respect the current phase');
    // assisted pull-up: easy → less help
    const a0 = F.E.exState('assisted_pullup').w;
    const r1 = F.E.applyRating('assisted_pullup', { w: a0, reps: [12, 12] }, 'easy');
    ok(r1.next.w < a0 && F.E.loadLabel(F.EXERCISES.assisted_pullup, r1.next.w).startsWith('보조'), `assisted pull-up: easy lowers the help (${a0} → ${r1.next.w})`);
    const r2 = F.E.applyRating('assisted_pullup', { w: r1.next.w, reps: [6, 5] }, 'hard');
    ok(r2.next.w > r1.next.w, 'assisted pull-up: hard adds help');
    // condition plans
    const base = F.E.sessionPlan(F.today(), 'FA', {});
    const tired = F.E.sessionPlan(F.today(), 'FA', { cond: 'tired' });
    const bad = F.E.sessionPlan(F.today(), 'FA', { cond: 'bad' });
    const great = F.E.sessionPlan(F.today(), 'FA', { cond: 'great' });
    const shortP = F.E.sessionPlan(F.today(), 'FA', { time: 'short' });
    ok(tired.items[0].w < base.items[0].w && tired.cardio.min < base.cardio.min, 'tired: lighter load and shorter cardio');
    ok(bad.items.length === 3 && bad.items.every((x) => x.sets <= 2) && bad.cardio.min === 15, 'bad: 3 exercises, max 2 sets, 15 min cardio');
    ok(great.items[0].sets === base.items[0].sets + 1 && great.items[2].sets === base.items[2].sets, 'great: +1 set on the two main lifts only');
    ok(shortP.items.length <= 4 && shortP.items.every((x) => x.sets <= 2) && shortP.cardio.min <= 10, 'short: 4 exercises, 2 sets, 10 min cardio');
    const knee = F.E.sessionPlan(F.today(), 'FA', { sore: ['knee'] });
    ok(!knee.items.some((x) => ['leg_press', 'goblet_squat', 'split_squat'].includes(x.exId)) && knee.swaps.length >= 1, 'knee: knee-heavy moves swapped out');
    const steps = F.E.buildSession(F.today(), 'FA', {}).steps.map((x) => x.type);
    ok(steps[0] === 'check' && steps[1] === 'warmup' && steps[2] === 'form' && steps[3] === 'set', 'session: check → warm-up → form check → sets');
    ok(F.E.estimateMinutes('FA', { time: 'short' }) < F.E.estimateMinutes('FA'), 'short version estimates fewer minutes');
    return out;
  });
  console.log(res.join('\n'));
  console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no page errors');
  console.log(res.some((x) => x.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASSED');
  await browser.close();
})();
