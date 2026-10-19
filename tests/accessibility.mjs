import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const scan = async (name) => {
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    results.push({
      name,
      violations: report.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  };
  await page.addLocatorHandler(page.locator("#lite-offer"), async () => {
    await page.locator('[data-action="dismiss-lite"]').click();
  });
  await page.goto("http://127.0.0.1:5173/");
  await scan("home");
  await page.locator('.hero [data-open="normal"]').click();
  await page.locator("#loading").waitFor({ state: "hidden" });
  await page.locator('[data-action="pause"]').click();
  await scan("explore");
  await page.locator('.planet-nav [data-planet="earth"]').click();
  await page.locator('.mode-switch [data-mode="details"]').click();
  await page.locator('[data-detail-tab="lab"]').click();
  await scan("details");
  await page.locator('.header-tools [data-action="classroom"]').click();
  await scan("classroom dialog");
  await page.locator('[data-lesson="meet"]').click();
  await scan("teacher");
  await page.setViewportSize({ width: 390, height: 844 });
  await scan("teacher mobile");
  await writeFile(".qa/accessibility.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => r.violations.length)) process.exitCode = 1;
} finally {
  await browser.close();
}
