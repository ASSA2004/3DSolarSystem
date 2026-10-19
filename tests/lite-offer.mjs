import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }),
    );
    const page = await context.newPage();
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173/");
    assert.ok(await page.locator("#lite-offer").isVisible());
    await page.locator('.hero [data-open="normal"]').click();
    await page.locator("#loading").waitFor({ state: "hidden" });
    const offer = await page.locator("#lite-offer").boundingBox();
    const playback = await page.locator(".simulation-bar").boundingBox();
    assert.ok(
      offer.y + offer.height <= playback.y,
      "Lite suggestion must not cover playback controls",
    );
    await page.locator('[data-action="pause"]').click();
    assert.equal(
      await page.locator('[data-action="pause"]').getAttribute("aria-label"),
      "Resume simulation",
    );
    await page.locator('[data-action="lite"]').click();
    assert.equal(await page.locator("#lite-offer").isVisible(), false);
    assert.equal(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("orbit:quality")),
      ),
      "low",
    );
    await context.close();
  }
  console.log(
    "PASS: low-end suggestion leaves playback accessible on desktop and mobile; Lite choice persists.",
  );
} finally {
  await browser.close();
}
