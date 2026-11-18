const { chromium } = require('playwright');
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots');
const run = async (browser, vp, tag) => {
  const ctx = await browser.newContext({ viewport: vp, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
  if (await page.$('[data-act="intro-next"]')) {
    for (let i = 0; i < 8 && await page.$('[data-act="intro-next"]'); i++) { await page.screenshot({ path: `${SHOTS}/${tag}-intro${i}.png` }); await page.click('[data-act="intro-next"]'); await page.waitForTimeout(80); }
  }
  await page.screenshot({ path: `${SHOTS}/${tag}-coachpick.png`, fullPage: tag === 'mo' });
  for (let i = 0; i < 4; i++) { await page.click('[data-act="onb-next"]'); await page.waitForTimeout(60); }
  await page.click('[data-act="onb-finish"]');
  await page.waitForTimeout(3000);
  for (const r of ['home', 'plan', 'lib', 'ex-deadlift', 'ex-back-squat', 'ex-assisted-pullup', 'food', 'body', 'log', 'rec', 'set', 'ask', 'learn', 'learn-progressive-overload', 'split']) {
    await page.evaluate((h) => { location.hash = '#' + h; }, r);
    await page.waitForTimeout(450);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 0) errors.push(`overflow ${r} ${ov}px`);
    await page.screenshot({ path: `${SHOTS}/${tag}-${r}.png`, fullPage: tag === 'mo' });
  }
  // session quick pass
  await page.evaluate(() => { location.hash = '#home'; });
  await page.waitForTimeout(300);
  const start = await page.$('[data-act="start-session"]');
  if (start) { await start.click(); } else { await page.click('[data-act="start-free"]'); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${tag}-session-check.png` });
  await page.click('[data-act="s-cond"][data-v="tired"]'); await page.waitForTimeout(150);
  await page.click('[data-act="s-sore"][data-v="knee"]'); await page.waitForTimeout(150);
  await page.screenshot({ path: `${SHOTS}/${tag}-session-check2.png` });
  await page.click('[data-act="s-check-go"]'); await page.waitForTimeout(300);
  await page.click('[data-act="s-next"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${tag}-session-form.png` });
  const fcs = await page.$$('[data-act="s-fc"]');
  for (let i = 0; i < fcs.length; i++) { await page.click(`[data-act="s-fc"][data-i="${i}"]`); await page.waitForTimeout(80); }
  await page.click('[data-act="s-form-go"]:not([data-skip])'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${tag}-session-set.png` });
  await page.click('[data-act="s-menu"]'); await page.click('[data-act="s-abandon"]');
  console.log(tag, 'ERRORS:', errors.length ? errors.join('\n') : 'none');
  await ctx.close();
};
(async () => {
  const browser = await chromium.launch();
  await run(browser, { width: 390, height: 844 }, 'mo');
  await run(browser, { width: 1920, height: 1080 }, 'pc');
  await browser.close();
})();
