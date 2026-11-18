// Exercises the cloud-sync paths against the mock runtime: first visit, return visit (early paint),
// offline first read with retry, a second person, and the in-page confirm dialog.
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mockclaude.js', 'utf8');
const URL0 = '' + (process.env.BASE || 'http://127.0.0.1:8765') + '/index.html';
const SHOTS = process.env.SHOTS || require('path').join(__dirname, 'shots');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? 'PASS ' : 'FAIL ') + m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(URL0);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL0);

  // 1) first visit: boot screen, then onboarding with the account name filled in
  const sawBoot = await page.$('.boot');
  ok(!!sawBoot, 'boot screen shows first inside claude.ai');
  await page.waitForSelector('[data-act="onb-next"], [data-act="intro-skip"]', { timeout: 8000 });
  if (await page.$('[data-act="intro-skip"]')) { await page.click('[data-act="intro-skip"]'); await page.waitForTimeout(100); }
  await page.click('[data-act="onb-next"]');
  const nm = await page.$eval('#o-name', (e) => e.value);
  ok(nm === '테스터', 'onboarding name comes from the claude.ai account (' + nm + ')');
  for (let i = 0; i < 3; i++) { await page.click('[data-act="onb-next"]'); await page.waitForTimeout(60); }
  await page.click('[data-act="onb-finish"]');
  await page.waitForTimeout(1800);
  let db = await page.evaluate(() => JSON.parse(localStorage.getItem('mock.db') || '{}'));
  ok(!!db['data/users/u1/app'] && db['data/users/u1/app'].profile, 'state doc written to data/users/u1/app');
  ok(!!db['members/u1'] && db['members/u1'].name === '테스터', 'member summary written to members/u1');
  ok(await page.evaluate(() => F.Sync.mode === 'cloud' && F.Sync.status === 'ok'), 'sync mode cloud/ok');

  // 2) a change, then reload: early paint from cache, cloud read, no data loss
  await page.evaluate(() => { F.S.settings.gymTime = '20:10'; F.save(true); });
  await page.waitForTimeout(1200);
  db = await page.evaluate(() => JSON.parse(localStorage.getItem('mock.db')));
  ok(db['data/users/u1/app'].settings.gymTime === '20:10', 'setting change pushed to cloud');
  await page.reload();
  await page.waitForTimeout(150);
  ok(!(await page.$('.boot')) && !!(await page.$('#view')), 'return visit paints from cache immediately');
  await page.waitForTimeout(1200);
  ok(await page.evaluate(() => F.S.settings.gymTime === '20:10'), 'change kept after reload');

  // 3) offline first read: work locally, retry, then upload what was done offline
  await page.evaluate(() => localStorage.setItem('mock.failGets', '1'));
  await page.reload();
  await page.waitForTimeout(600);
  ok(await page.evaluate(() => F.Sync.status === 'error' && !F.Sync.ready), 'offline: status error, pushes held');
  await page.evaluate(() => { F.S.settings.gymTime = '20:40'; F.save(true); });
  await page.waitForTimeout(400);
  db = await page.evaluate(() => JSON.parse(localStorage.getItem('mock.db')));
  ok(db['data/users/u1/app'].settings.gymTime === '20:10', 'offline change not pushed before first read');
  await page.waitForTimeout(9500);
  ok(await page.evaluate(() => F.Sync.ready && F.Sync.status === 'ok'), 'retry succeeded');
  await page.waitForTimeout(1200);
  db = await page.evaluate(() => JSON.parse(localStorage.getItem('mock.db')));
  ok(db['data/users/u1/app'].settings.gymTime === '20:40' && (await page.evaluate(() => F.S.settings.gymTime)) === '20:40', 'offline change uploaded after reconnect (newer local wins)');

  // 4) in-page confirm (claude.ai ignores confirm()): reset asks first, cancel keeps data
  await page.evaluate(() => { location.hash = '#set'; });
  await page.waitForTimeout(400);
  await page.evaluate(() => { F.act.reset(); });
  await page.waitForTimeout(300);
  ok(!!(await page.$('.ask')), 'reset shows in-page confirm');
  await page.screenshot({ path: SHOTS + '/sync-ask.png' });
  await page.click('[data-ask="0"]');
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => !!F.S.profile), 'cancel keeps data');

  // 5) second person on the cloud: own onboarding, sees partner in members
  await page.evaluate(() => localStorage.setItem('mock.uid', 'u2'));
  await page.reload();
  await page.waitForSelector('[data-act="onb-next"], [data-act="intro-skip"]', { timeout: 8000 });
  if (await page.$('[data-act="intro-skip"]')) { await page.click('[data-act="intro-skip"]'); await page.waitForTimeout(100); }
  await page.click('[data-act="onb-next"]');
  ok((await page.$eval('#o-name', (e) => e.value)) === '여자친구', 'second person gets own onboarding');
  await page.click('[data-act="onb-set"][data-k="sex"][data-v="f"]');
  for (let i = 0; i < 3; i++) { await page.click('[data-act="onb-next"]'); await page.waitForTimeout(60); }
  await page.click('[data-act="onb-finish"]');
  await page.waitForTimeout(1800);
  db = await page.evaluate(() => JSON.parse(localStorage.getItem('mock.db')));
  ok(!!db['data/users/u2/app'] && db['data/users/u1/app'].profile.name === '테스터', 'two separate state docs');
  ok(await page.evaluate(() => F.Sync.members.length === 2), 'members list has both people');
  ok(await page.evaluate(() => F.figure() === 'f'), 'female figure by default for her');
  await page.evaluate(() => { location.hash = '#home'; });
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + '/sync-u2-home.png', fullPage: true });

  ok(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
  await browser.close();
})();
