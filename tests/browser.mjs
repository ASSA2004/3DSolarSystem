import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  checks = [];
page.on("pageerror", (error) => errors.push(error.message));
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};
const screenshot = (name) =>
  page.screenshot({ path: ".qa/" + name + ".png", fullPage: true });
try {
  await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173/");
  check(
    "Landing page has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  check(
    "Three.js is not requested before entering the explorer",
    !(
      await page.evaluate(() =>
        performance.getEntriesByType("resource").map((r) => r.name),
      )
    ).some((url) => /three\.js|three_module|scene\.js/.test(url)),
  );
  await screenshot("home-desktop");
  await page.locator('.hero [data-open="normal"]').click();
  await page.locator("#loading").waitFor({ state: "hidden", timeout: 45000 });
  await page.waitForTimeout(600);
  await page.locator('[data-action="pause"]').click();
  const pausedDay = await page.locator("[data-day]").textContent();
  await page.waitForTimeout(350);
  check(
    "Pause freezes simulation time",
    pausedDay === (await page.locator("[data-day]").textContent()),
  );
  await screenshot("overview-desktop");
  await page.locator('.planet-nav [data-planet="earth"]').click();
  await page.waitForTimeout(250);
  check(
    "Earth selection updates its profile",
    (await page.locator("#inspector h2").textContent()).includes("Earth"),
  );
  await screenshot("earth-desktop");
  await page.locator('#inspector [data-action="overview"]').last().click();
  check(
    "Back to full view restores overview selection",
    (await page.locator(".overview-button").getAttribute("aria-pressed")) ===
      "true",
  );
  await page.locator('.mode-switch [data-mode="details"]').click();
  await page.locator('[data-detail-tab="lab"]').click();
  await page.locator("#day-input").fill("182.625");
  await page.locator("#day-form button").click();
  check(
    "Exact day jumps drive half-year orbital progress",
    (await page.locator("#orbit-progress").textContent()) === "50%",
  );
  await page.locator("#distance-from").selectOption("sun");
  await page.locator("#distance-to").selectOption("earth");
  check(
    "Sun-Earth distance reads one AU",
    (await page.locator("#distance-au").textContent()) === "1 AU",
  );
  check(
    "One-AU light time is approximately 8.32 minutes",
    (await page.locator("#light-time").textContent()).includes("8.32"),
  );
  await screenshot("details-desktop");
  await page.locator('[data-detail-tab="compare"]').click();
  await page.locator("#compare-with").selectOption("jupiter");
  check(
    "Comparison has clearly named columns",
    (await page.locator(".comparison-table thead").innerText()).includes(
      "Jupiter",
    ),
  );
  await screenshot("compare-desktop");
  await page.locator('[data-action="scale"]').click();
  check(
    "Proportional scale states its body-size limitation",
    (await page.locator("#scale-note").textContent()).includes(
      "sizes enlarged",
    ),
  );
  await page.locator('[data-action="scale"]').click();
  await page.locator('[data-action="quiz"]').click();
  const answers = [
    "Uranus",
    "Mercury",
    "Saturn",
    "Jupiter",
    "Venus",
    "Earth",
    "Neptune",
    "Mars",
  ];
  for (const answer of answers) {
    await page.locator('[data-answer="' + answer + '"]').click();
    check(
      "Quiz provides feedback for " + answer,
      await page.locator(".quiz-feedback").isVisible(),
    );
    await page.locator('[data-action="quiz-next"]').click();
  }
  check(
    "Quiz completes without stale-question access",
    (await page.locator(".quiz-score").textContent()).includes("8"),
  );
  await screenshot("quiz-desktop");
  await page.locator('[data-action="close-dialog"]').click();
  await page.locator('.mode-switch [data-mode="video"]').click();
  await page.waitForTimeout(350);
  await page.locator('[data-action="tour-play"]').click();
  await page.locator('[data-chapter="3"]').click();
  await page.waitForTimeout(300);
  check(
    "Video chapters update caption and heading",
    (await page.locator("#chapter-title").textContent()).includes("blue home"),
  );
  const videoAt = await page.locator("#film-time").textContent();
  await page.waitForTimeout(350);
  check(
    "Video pause freezes playback",
    videoAt === (await page.locator("#film-time").textContent()),
  );
  await screenshot("video-desktop");
  await page.locator('[data-action="captions"]').click();
  check(
    "Captions toggle off",
    !(await page.locator("#chapter-caption").isVisible()),
  );
  await page.locator('[data-action="captions"]').click();
  await page.locator("#film-seek").fill("198");
  await page.locator("#film-seek").dispatchEvent("input");
  check(
    "Video end offers replay",
    (await page
      .locator('[data-action="tour-play"]')
      .getAttribute("aria-label")) === "Replay video",
  );
  await page.locator('[data-action="tour-play"]').click();
  check(
    "Video replays from chapter one",
    (await page.locator("#chapter-number").textContent()).includes("01"),
  );
  await page.locator('[data-action="home"]').click();
  check(
    "Exit returns to the landing page",
    await page.locator("#home").isVisible(),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot("home-mobile");
  check(
    "Mobile landing fits the viewport",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator('.hero [data-open="normal"]').click();
  await page.locator('.planet-nav [data-planet="earth"]').click();
  await page.waitForTimeout(350);
  await screenshot("normal-mobile");
  await page.locator('[data-action="sheet"]').click();
  check(
    "Mobile planet sheet expands",
    await page
      .locator("#inspector")
      .evaluate((el) => el.classList.contains("expanded")),
  );
  await page.locator('.mode-switch [data-mode="details"]').click();
  await page.locator('[data-detail-tab="lab"]').click();
  check(
    "Switching educational tools preserves the expanded sheet",
    await page
      .locator("#inspector")
      .evaluate((el) => el.classList.contains("expanded")),
  );
  await page.locator("#day-input").fill("365.25");
  await page.locator("#day-form button").click();
  await screenshot("details-mobile");
  await page.locator('[data-action="help"]').click();
  check(
    "Mobile settings expose scale and quiz controls",
    (await page.locator('#dialog [data-action="scale"]').isVisible()) &&
      (await page.locator('#dialog [data-action="quiz"]').isVisible()),
  );
  await page.locator('#dialog [data-action="scale"]').click();
  await page.locator('[data-action="close-dialog"]').click();
  await page.locator('.mode-switch [data-mode="video"]').click();
  await page.locator('[data-chapter="6"]').click();
  await page.locator('[data-action="tour-play"]').click();
  await page.waitForTimeout(350);
  await screenshot("video-mobile");
  check(
    "Mobile app has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('.mode-switch [data-mode="normal"]').click();
  await page.waitForTimeout(250);
  await screenshot("small-mobile");
  check(
    "Small mobile has no horizontal overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(250);
  await screenshot("landscape");
  check(
    "Landscape mode keeps header and playback controls visible",
    await page.locator('[data-action="pause"]').isVisible(),
  );
  check("No uncaught browser errors", errors.length === 0);
  await writeFile(
    ".qa/browser-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(
    JSON.stringify({ passed: checks.length, checks, errors }, null, 2),
  );
} finally {
  await browser.close();
}
