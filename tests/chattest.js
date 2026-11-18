// Ask-the-trainer: streamed answer through the (mock) claude.ai sample capability, and the built-in
// answers when the app runs outside claude.ai.
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
  await page.waitForTimeout(1500);
};
(async () => {
  const browser = await chromium.launch();
  for (const mode of ['cloud', 'local']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
    if (mode === 'cloud') await ctx.addInitScript(MOCK);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.goto('' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html');
    await onboard(page);
    await page.evaluate(() => { location.hash = '#ask'; });
    await page.waitForTimeout(400);
    await page.fill('#chat-q', '무릎이 아픈데 스쿼트 해도 돼요?');
    await page.click('.chat-in button[type="submit"]');
    await page.waitForTimeout(900);
    const last = await page.evaluate(() => (F.S.chat || []).slice(-1)[0]);
    ok(last && last.role === 'coach' && last.text.length > 10 && !last.pending, `${mode}: coach answered (${last && last.text.slice(0, 40)})`);
    if (mode === 'cloud') {
      const inp = await page.evaluate(() => window.__lastSampleInput);
      ok(Array.isArray(inp) && inp[0].role === 'user' && inp[0].content.includes('[회원 정보]') && inp[inp.length - 1].content.includes('무릎'), 'cloud: prompt carries trainer rules, member context and the question');
      ok(!last.offline, 'cloud: answer is not the offline fallback');
    } else {
      ok(last.offline === true, 'local: built-in answer marked as offline');
    }
    await page.screenshot({ path: `${SHOTS}/chat-${mode}.png`, fullPage: true });
    // exercise context from the library
    await page.evaluate(() => { location.hash = '#ex-back-squat'; });
    await page.waitForTimeout(400);
    const askBtn = await page.$('[data-act="ask-ex"]');
    ok(!!askBtn, `${mode}: exercise page has "ask the coach" button`);
    ok(!errors.length, `${mode}: no page errors ${errors.join(' | ')}`);
    await ctx.close();
  }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
  await browser.close();
})();
