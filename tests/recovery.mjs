import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:5173/");
  await page.locator('[data-action="about"]').click();
  await page.locator('[data-action="close-dialog"]').click();
  await page.locator('.hero [data-open="normal"]').click();
  assert.equal(
    await page.locator('[data-action="pause"]').getAttribute("aria-label"),
    "Pause simulation",
  );
  results.push(
    "Reading the home-page explanation preserves the initial playback state",
  );
  assert.equal(
    await page.locator(".skip-link").getAttribute("href"),
    "#observatory",
  );
  results.push("Skip navigation targets the currently visible experience");
  await page.locator("#loading").waitFor({ state: "hidden" });
  await page.locator('.planet-nav [data-planet="earth"]').click();
  await page.keyboard.press("l");
  assert.equal(
    await page.locator('[data-action="labels"]').getAttribute("aria-pressed"),
    "false",
  );
  results.push("Label keyboard shortcut works after selecting a planet");
  await page.locator('[data-action="help"]').click();
  await page.locator("#reduce-motion").check();
  await page.locator("#quality").selectOption("low");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#dialog").isVisible(), false);
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.action),
    "help",
  );
  results.push("Dialog closes with Escape and restores keyboard focus");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mode-switch [data-mode="normal"]').click();
  assert.equal(await page.locator(".profile-description").isVisible(), false);
  await page.locator('[data-action="sheet"]').click();
  assert.equal(await page.locator(".profile-description").isVisible(), true);
  results.push(
    "Collapsed mobile sheets hide offscreen controls and expand accessibly",
  );
  await page.close();

  const failed = await browser.newPage();
  await failed.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  await failed.goto("http://127.0.0.1:5173/");
  await failed.locator('.hero [data-open="normal"]').click();
  await failed.locator("#scene-error").waitFor();
  assert.ok(await failed.locator('[data-action="retry"]').isVisible());
  await failed.locator('.error-actions [data-action="home"]').click();
  assert.ok(await failed.locator("#home").isVisible());
  results.push("WebGL failure provides recovery and a working return home");
  await failed.close();

  const missing = await browser.newPage();
  await missing.route("**/textures/standard/2k_mars.webp", (route) =>
    route.abort(),
  );
  await missing.goto("http://127.0.0.1:5173/");
  await missing.locator('.hero [data-open="normal"]').click();
  await missing.locator("#loading").waitFor({ state: "hidden" });
  assert.match(
    await missing.locator("#scale-note").textContent(),
    /could not load/,
  );
  await missing.locator('.planet-nav [data-planet="mars"]').click();
  assert.match(await missing.locator("#inspector h2").textContent(), /Mars/);
  results.push(
    "A failed texture does not block the explorer or its educational content",
  );
  await missing.close();
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
