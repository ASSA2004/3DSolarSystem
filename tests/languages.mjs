import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const english = JSON.parse(await readFile("src/i18n/en.json", "utf8"));
const known = new Set(
  [...Object.keys(english), ...Object.values(english)].map((s) =>
    s.toLowerCase(),
  ),
);
const missing = new Set();
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const collect = async () => {
    for (const text of await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement.closest('script,style,code,[translate="no"]'))
          texts.push(node.textContent.trim());
      }
      return texts;
    }))
      if (/[A-Za-z]{3}/.test(text) && !known.has(text.toLowerCase()))
        missing.add(text);
  };
  await page.addLocatorHandler(page.locator("#lite-offer"), async () => {
    await page.locator('[data-action="dismiss-lite"]').click();
  });
  await page.goto("http://127.0.0.1:5173/");
  await collect();
  for (const lang of ["ta", "hi"]) {
    await page.locator(".home-header [data-language]").selectOption(lang);
    await page.waitForFunction(
      (lang) => document.documentElement.lang === lang,
      lang,
    );
    assert.ok(await page.locator(".hero h1").textContent());
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.screenshot({ path: `.qa/home-${lang}.png`, fullPage: true });
  }
  await page.locator(".home-header [data-language]").selectOption("en");
  await page.locator('.experience-card[data-open="details"]').click();
  await page.locator("#loading").waitFor({ state: "hidden" });
  await page.locator('[data-action="pause"]').click();
  for (const id of [
    "sun",
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
  ]) {
    await page.locator(`.planet-nav [data-planet="${id}"]`).click();
    await collect();
  }
  for (const tab of ["lab", "compare"]) {
    await page.locator(`[data-detail-tab="${tab}"]`).click();
    await collect();
  }
  await page.locator('[data-action="help"]').click();
  await collect();
  await page.locator('[data-action="close-dialog"]').click();
  await page.locator('.header-tools [data-action="classroom"]').click();
  await collect();
  await page.locator('[data-lesson="meet"]').click();
  await page.locator(".header-tools [data-language]").selectOption("ta");
  await page.waitForFunction(() => document.documentElement.lang === "ta");
  assert.match(await page.locator("#lesson-title").textContent(), /சூரிய/);
  await page.screenshot({ path: ".qa/teacher-ta-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.reload();
  await page.waitForFunction(() => document.documentElement.lang === "ta");
  console.log(
    "PASS: Tamil/Hindi selection, mobile layout, translated lesson and remembered language.",
  );
  await writeFile(
    ".qa/untranslated.json",
    JSON.stringify([...missing].sort(), null, 2),
  );
  console.log("English strings for coverage review:", missing.size);
} finally {
  await browser.close();
}
