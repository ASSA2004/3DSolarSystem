import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addLocatorHandler(page.locator("#lite-offer"), async () => {
    await page.locator('[data-action="dismiss-lite"]').click();
  });
  await page.goto("http://127.0.0.1:5173/");
  await page.locator('.home-header [data-action="classroom"]').click();
  await page.locator('[data-lesson="meet"]').click();
  await page.locator("#lesson-title").waitFor();
  await page.locator('.planet-nav [data-planet="mars"]').click();
  assert.match(await page.locator("#view-title").textContent(), /Sun/);
  await page.locator('[data-action="lesson-next"]').click();
  assert.equal(await page.locator("#view-title").textContent(), "Earth");
  await page.screenshot({ path: ".qa/teacher-desktop.png" });
  await page.locator("#focus-lock").uncheck();
  await page.locator('.planet-nav [data-planet="mars"]').click();
  assert.equal(await page.locator("#view-title").textContent(), "Mars");
  await page.locator('[data-action="end-lesson"]').click();
  await page.locator('.header-tools [data-action="classroom"]').click();
  await page.locator('[data-action="journey"]').click();
  await page.locator("#journey-seek").fill("1");
  assert.match(await page.locator("#journey-time").textContent(), /4 h/);
  await page.screenshot({ path: ".qa/journey-desktop.png" });
  await page.locator('[data-action="end-journey"]').click();
  await page.goto(
    "http://127.0.0.1:5173/?planet=mars&date=2030-01-01&mode=true-scale&view=details",
  );
  await page.locator("#loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator("#view-title").textContent(), "Mars");
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-detail-tab="lab"]').click();
  assert.match(await page.locator("#current-date").textContent(), /2030-01-01/);
  await page.locator("#date-input").fill("2000-01-01");
  await page.locator("#date-form button").click();
  assert.match(await page.locator("#current-date").textContent(), /2000-01-01/);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: teacher steps, focus lock/unlock, journey counter, deep link and date controls.",
  );
} finally {
  await browser.close();
}
