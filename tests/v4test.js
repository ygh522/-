// V4: day timeline, supplements (add, schedule, banner, intake), diet styles, pages render at phone and PC sizes.
const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };
const onboard = async (page) => {
  await page.waitForSelector('[data-act="onb-next"], [data-act="intro-skip"]', { timeout: 10000 });
  if (await page.$('[data-act="intro-skip"]')) { await page.click('[data-act="intro-skip"]'); await page.waitForTimeout(100); }
  for (let i = 0; i < 4; i++) { await page.click('[data-act="onb-next"]'); await page.waitForTimeout(60); }
  await page.click('[data-act="onb-finish"]');
  await page.waitForTimeout(1200);
};
(async () => {
  const browser = await chromium.launch();
  for (const [tag, vp] of [['mo', { width: 390, height: 844 }], ['pc', { width: 1920, height: 1080 }]]) {
    const ctx = await browser.newContext({ viewport: vp, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await onboard(page);
    // make today a gym day at 19:30 and freeze the clock at 07:50
    await page.evaluate(() => { const d = new Date().getDay(); F.S.settings.days = [d, (d + 2) % 7, (d + 4) % 7]; F.S.settings.gymTime = '19:30'; F.nowMin = () => 7 * 60 + 50; F.save(true); location.hash = '#home'; F.render(); });
    await page.waitForTimeout(300);
    ok(!!(await page.$('.coachcard')) && !!(await page.$('.tl')), `${tag}: home shows trainer card and today's timeline`);
    const kinds = await page.$$eval('.tl-i', (els) => els.map((e) => [...e.classList].find((c) => c.startsWith('k-'))));
    ok(kinds.includes('k-meal') && kinds.includes('k-workout') && kinds[0] === 'k-wake' && kinds[kinds.length - 1] === 'k-bed', `${tag}: timeline has wake → meals → workout → bed (${kinds.join(',')})`);
    // add supplements
    await page.evaluate(() => { location.hash = '#supp'; });
    await page.waitForTimeout(300);
    const quick = await page.$$('[data-act="supp-add"]');
    ok(quick.length >= 3, `${tag}: quick-add chips shown (${quick.length})`);
    await page.evaluate(() => { for (const id of ['multi', 'omega3', 'magnesium']) F.act['supp-add']({ dataset: { id } }); });
    await page.waitForTimeout(300);
    const sched = await page.evaluate(() => F.E.suppSchedule(F.today()).map((p) => [p.id, F.minToTime(p.at), p.slot]));
    ok(sched.some(([id]) => id === 'magnesium') && sched.find(([id]) => id === 'magnesium')[2] === 'bed', `${tag}: magnesium scheduled at bedtime (${JSON.stringify(sched)})`);
    await page.screenshot({ path: `${SHOTS}/v4-${tag}-supp.png`, fullPage: tag === 'mo' });
    // banner at 07:50 for breakfast supplements
    await page.evaluate(() => { location.hash = '#home'; });
    await page.waitForTimeout(300);
    const banner = await page.$eval('.sbanner', (e) => e.textContent).catch(() => '');
    ok(/섭취 시간|드실 시간/.test(banner), `${tag}: banner "${banner.trim().slice(0, 40)}"`);
    await page.screenshot({ path: `${SHOTS}/v4-${tag}-home.png`, fullPage: tag === 'mo' });
    await page.click('.sbanner [data-act="supp-take"]');
    await page.waitForTimeout(300);
    const takenNow = await page.evaluate(() => Object.keys(F.S.supp[F.today()] || {}));
    ok(takenNow.length >= 1 && !(await page.$('.sbanner')), `${tag}: intake recorded (${takenNow.join(',')}) and banner cleared`);
    // diet style → picks follow tags
    await page.evaluate(() => { F.act['set-dietstyle']({ dataset: { v: 'cvs' } }); });
    const picks = await page.evaluate(() => F.E.dietDay(F.today()).slots.filter((x) => x.slot !== 'snack').map((x) => x.m.tag));
    ok(picks.filter((t) => t.includes('편의점')).length >= 2, `${tag}: 편의점 style picks convenience-store meals (${picks.join(',')})`);
    for (const r of ['food', 'homefit', 'supp', 'plan']) {
      await page.evaluate((h) => { location.hash = '#' + h; }, r);
      await page.waitForTimeout(300);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(ov <= 0, `${tag}: no sideways scroll on ${r}`);
      await page.screenshot({ path: `${SHOTS}/v4-${tag}-${r}.png`, fullPage: tag === 'mo' });
    }
    ok(!errors.length, `${tag}: no page errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
  await browser.close();
})();
