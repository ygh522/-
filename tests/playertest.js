// Home-workout library + in-app player (standalone) and link-out (inside claude.ai mock).
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mockclaude.js', 'utf8');
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
  for (const [tag, vp, mock] of [['mo', { width: 390, height: 844 }, false], ['pc', { width: 1920, height: 1080 }, false], ['claude', { width: 390, height: 844 }, true]]) {
    const ctx = await browser.newContext({ viewport: vp, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
    if (mock) await ctx.addInitScript(MOCK);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await onboard(page);
    await page.evaluate(() => { location.hash = '#homefit'; });
    await page.waitForTimeout(500);
    const n = await page.$$eval('.vcard', (e) => e.length);
    ok(n >= 40, `${tag}: ${n} videos listed in 4 groups`);
    const groups = await page.$$eval('.sec .sec-h h2', (e) => e.map((x) => x.textContent.trim()));
    ok(groups.length >= 4, `${tag}: groups ${groups.join(' / ')}`);
    await page.screenshot({ path: `${SHOTS}/hf-${tag}.png`, fullPage: tag !== 'pc' });
    await page.click('[data-act="hf-toggle"][data-k="quiet"]');
    await page.waitForTimeout(200);
    const nq = await page.$$eval('.vcard', (e) => e.length);
    ok(nq < n && nq > 10, `${tag}: quiet filter ${n} → ${nq}`);
    if (!mock) {
      await page.click('.vcard[data-act="hf-play"]');
      await page.waitForTimeout(600);
      const st = await page.evaluate(() => { const p = document.querySelector('.vplayer'); const f = p && p.querySelector('iframe'); return p ? { rotate: p.classList.contains('rotate'), src: f && f.src, w: f && f.getBoundingClientRect().width, h: f && f.getBoundingClientRect().height } : null; });
      ok(!!st && /youtube-nocookie\.com\/embed\/[\w-]{11}\?autoplay=1/.test(st.src), `${tag}: player opens in the app (${st && st.src.slice(0, 60)})`);
      if (tag === 'mo') ok(st.rotate, 'mo: portrait phone → player rotates to landscape');
      if (tag === 'pc') ok(!st.rotate, 'pc: landscape screen → no rotation');
      await page.screenshot({ path: `${SHOTS}/hf-${tag}-player.png` });
      await page.click('[data-act="hf-close"]');
      await page.waitForTimeout(400);
      ok(!(await page.$('.vplayer')) && (await page.evaluate(() => location.hash)) === '#homefit', `${tag}: "목록으로" returns to the list`);
      // phone back gesture closes the player too
      await page.click('.vcard[data-act="hf-play"]');
      await page.waitForTimeout(400);
      await page.goBack();
      await page.waitForTimeout(400);
      ok(!(await page.$('.vplayer')) && (await page.evaluate(() => location.hash)) === '#homefit', `${tag}: back gesture closes the player and stays on the list`);
    } else {
      const href = await page.$eval('a.vcard', (a) => a.href + ' ' + a.target);
      ok(/youtube\.com\/watch\?v=[\w-]{11} _blank/.test(href), `claude: opens YouTube in a new tab (${href.slice(0, 50)})`);
    }
    ok(!errors.length, `${tag}: no page errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
  await browser.close();
})();
