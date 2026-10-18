import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
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
  const failed = await page.evaluate(
    () =>
      performance
        .getEntriesByType("resource")
        .filter((r) => r.responseStatus >= 400).length,
  );
  assert.equal(failed, 0);
  console.log(
    "PASS: first visit saves classroom assets; offline reload opens 3D and Earth without failed resources.",
  );
} finally {
  await browser.close();
}
