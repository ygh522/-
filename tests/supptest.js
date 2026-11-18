// Supplement scheduler with the real catalog: best slots, two doses, conflicts, workout-only items.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  const out = await page.evaluate(() => {
    const res = [];
    const ok = (c, m) => res.push((c ? 'PASS ' : 'FAIL ') + m);
    const s = F.S;
    s.profile = { name: '테스트', sex: 'm', age: 32, height: 171, weight: 90, goalWeight: 80, pace: 'normal', startDate: F.addDays(F.today(), -7) };
    const d = new Date().getDay();
    s.settings.days = [(d + 1) % 7, (d + 3) % 7, (d + 5) % 7]; // today is a rest day
    s.mySupps = ['multi', 'omega3', 'vitd', 'magnesium', 'calcium', 'vitc', 'iron', 'creatine', 'bcaa', 'preworkout', 'probiotics'].map((id) => ({ id, on: true }));
    const k = F.today();
    const sch = () => F.E.suppSchedule(k).map((p) => `${p.key}@${F.minToTime(p.at)}:${p.slot}`);
    const rest = sch();
    ok(!rest.some((x) => x.startsWith('bcaa') || x.startsWith('preworkout')), 'rest day: workout-only items skipped');
    ok(rest.filter((x) => x.startsWith('calcium')).length === 2 && rest.filter((x) => x.startsWith('vitc')).length === 2, 'split items get two reminders');
    ok(rest.some((x) => x.startsWith('magnesium') && x.endsWith(':bed')), 'magnesium at bedtime');
    const T = F.E.slotTimes(k);
    const at = (key) => (F.E.suppSchedule(k).find((p) => p.key === key) || {}).at;
    ok(Math.abs(at('iron') - at('calcium')) >= 120 && (at('calcium#2') == null || Math.abs(at('iron') - at('calcium#2')) >= 120), 'iron kept 2 h away from calcium');
    ok(at('vitd') === T.dinner || at('vitd') === T.lunch, 'vitamin D with a meal (fat-soluble)');
    // evening workout at 19:30: booster skipped (too close to bedtime), bcaa before workout, creatine after
    s.settings.days = [d, (d + 2) % 7, (d + 4) % 7]; s.settings.gymTime = '19:30';
    const gym = sch();
    ok(!gym.some((x) => x.startsWith('preworkout')) && gym.some((x) => x.startsWith('bcaa') && x.endsWith(':preWorkout')), 'late workout: no caffeine booster, BCAA before the workout');
    ok(gym.some((x) => x.startsWith('creatine') && x.endsWith(':postWorkout')), 'workout day: creatine after the workout');
    s.settings.gymTime = '07:00';
    const morning = sch();
    ok(morning.some((x) => x.startsWith('preworkout') && x.endsWith(':preWorkout')), 'morning workout: booster 30 min before');
    // intake of the second dose is tracked separately
    F.act['supp-take']({ dataset: { ids: 'calcium#2' } });
    const taken = Object.keys(F.S.supp[k] || {});
    ok(taken.includes('calcium#2') && !taken.includes('calcium'), 'second dose checked separately');
    ok(rest.length > 0, 'schedule: ' + rest.join(' '));
    return res;
  });
  console.log(out.join('\n'));
  console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no page errors');
  console.log(out.some((x) => x.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASSED');
  await browser.close();
})();
