import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.LAB_URL || "http://127.0.0.1:4173/";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() =>
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }),
  );
  const page = await context.newPage();
  await page.addLocatorHandler(page.locator("#lite-offer"), async () => {
    await page.locator('[data-action="dismiss-lite"]').click();
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(
    () =>
      document
        .querySelector(".offline-status")
        ?.textContent.includes("Ready to use offline"),
    {},
    { timeout: 60000 },
  );
  await context.setOffline(true);
  for (const lab of ["optics", "matter", "plane", "solid"]) {
    for (const mode of ["teach", "experiment"]) {
      await page.goto(base + "?lab=" + lab + "&mode=" + mode);
      await page.locator("#controls").waitFor();
      assert.equal(await page.locator("canvas").count(), 1);
      if (mode === "experiment") {
        await page.locator("#prediction").selectOption("0");
        await page.locator('[data-command="test"]').click();
        await page.locator('[data-command="record"]').click();
        assert.ok(await page.locator("#notebook tbody tr").count());
      }
    }
  }
  await page.goto(base + "solar.html?learning=experiment");
  await page.locator("#solar-prediction").waitFor();
  await page.locator("#solar-prediction").selectOption("1");
  await page.locator("[data-solar-test]").click();
  await page.locator("[data-solar-record]").click();
  await page.reload();
  await page.locator(".solar-learning table td").waitFor();
  await page.goto(base);
  assert.equal(await page.locator(".lab-card").count(), 5);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all five labs load offline without prior visits; new lab Teach/Experiment and persistent Solar notebook.",
  );
} finally {
  await browser.close();
}
