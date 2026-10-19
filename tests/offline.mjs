import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => {
    if (request.url().includes("/assets/")) errors.push(request.url());
  });
  await page.addLocatorHandler(page.locator("#lite-offer"), async () => {
    await page.locator('[data-action="dismiss-lite"]').click();
  });
  await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:4173/");
  await page.waitForFunction(() =>
    document
      .querySelector(".offline-status")
      ?.textContent.includes("Ready to use offline"),
  );
  await context.setOffline(true);
  await page.reload();
  await page.locator('.hero [data-open="normal"]').click();
  await page.locator("#loading").waitFor({ state: "hidden" });
  await page.locator('.planet-nav [data-planet="earth"]').click();
  assert.match(await page.locator("#inspector h2").textContent(), /Earth/);
  await page.locator('[data-action="pause"]').click();
  await page.locator('.mode-switch [data-mode="details"]').click();
  await page.locator('[data-detail-tab="lab"]').click();
  await page.locator("#date-input").fill("2030-01-01");
  await page.locator("#date-form button").click();
  assert.match(await page.locator("#current-date").textContent(), /2030-01-01/);
  await page.locator("#distance-from").selectOption("sun");
  await page.locator("#distance-to").selectOption("earth");
  assert.ok(
    Math.abs(parseFloat(await page.locator("#distance-au").textContent()) - 1) <
      0.03,
  );
  await page.locator('.mode-switch [data-mode="video"]').click();
  await page.locator('[data-action="tour-play"]').click();
  await page.locator('[data-chapter="3"]').click();
  assert.match(await page.locator("#chapter-title").textContent(), /Earth/);
  const paused = await page.locator("#film-time").textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator("#film-time").textContent(), paused);
  await page.locator('[data-action="tour-play"]').click();
  await page.waitForTimeout(1100);
  assert.notEqual(await page.locator("#film-time").textContent(), paused);
  await page.locator('[data-action="home"]').click();
  await page.reload();
  assert.ok(await page.locator("#home").isVisible());
  assert.deepEqual(errors, []);
  const failed = await page.evaluate(
    () =>
      performance
        .getEntriesByType("resource")
        .filter((r) => r.responseStatus >= 400).length,
  );
  assert.equal(failed, 0);
  console.log(
    "PASS: offline reload, Normal planet selection, Details date and distance, Video chapter/pause/resume, and a second offline reload; no failed assets or browser errors.",
  );
} finally {
  await browser.close();
}
