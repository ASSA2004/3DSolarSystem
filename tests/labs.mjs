import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const base = process.env.LAB_URL || "http://127.0.0.1:5173/";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const checks = [],
  errors = [];
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  for (const theme of ["light", "dark"])
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 360, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(base);
      await page.evaluate(
        (theme) => localStorage.setItem("prayog:theme", theme),
        theme,
      );
      await page.reload();
      assert.equal(await page.locator(".lab-card").count(), 5);
      assert.ok(await page.locator(".gateway-static").count());
      for (const lab of ["optics", "matter", "plane", "solid"])
        for (const mode of ["teach", "experiment"]) {
          await page.goto(base + "?lab=" + lab + "&mode=" + mode);
          await page.locator("#controls").waitFor();
          await page.locator("#lab-scene canvas").waitFor();
          assert.equal(await page.locator("#lab-scene canvas").count(), 1);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            "No horizontal overflow",
          );
          if (mode === "teach") {
            assert.equal(
              await page.locator('[data-command="why"]').isDisabled(),
              true,
            );
            if (lab === "optics")
              await page.locator("#control-distance").fill("31");
            if (lab === "matter")
              await page.locator("#control-temperature").fill("-10");
            if (lab === "plane")
              await page.locator('[data-tool="count"]').click();
            if (lab === "solid")
              await page.locator('[data-tool="fill"]').click();
            await page.locator('[data-command="why"]').click();
            await page.locator('[data-answer="0"]').click();
            await page.locator('[data-command="next"]').click();
            assert.equal(
              await page.locator('[data-command="why"]').isDisabled(),
              true,
            );
          } else {
            await page
              .locator(".learning-disclosure summary")
              .filter({ hasText: "Explain and predict" })
              .click();
            await page
              .locator(".learning-disclosure summary")
              .filter({ hasText: "Notebook" })
              .click();
            await page.locator("#prediction").selectOption("0");
            await page.locator('[data-command="test"]').click();
            await page.locator('[data-command="record"]').click();
            assert.ok((await page.locator("#notebook tbody tr").count()) > 0);
            await page.locator('[data-command="clear"]').click();
            assert.equal(await page.locator("#notebook tbody tr").count(), 0);
            await page.locator('[data-command="undo"]').click();
            assert.ok((await page.locator("#notebook tbody tr").count()) > 0);
          }
          const slider = page
            .locator('input[type="range"]:visible:enabled')
            .first();
          const before = await slider.inputValue();
          await slider.focus();
          await slider.press("ArrowRight");
          assert.notEqual(await slider.inputValue(), before);
          await page.screenshot({
            path: `.qa/${lab}-${mode}-${theme}-${viewport.width}.png`,
            fullPage: true,
          });
          checks.push(`${lab} ${mode} ${theme} ${viewport.width}`);
        }
    }
  // Verify every tool and every shape can be selected without remount errors.
  for (const lab of ["optics", "matter", "plane", "solid"]) {
    await page.goto(base + "?lab=" + lab);
    await page.locator("#controls").waitFor();
    const select = page.locator("#controls select:visible:enabled");
    if (await select.count())
      for (const value of await select
        .locator("option")
        .evaluateAll((nodes) => nodes.map((n) => n.value))) {
        await select.selectOption(value);
        for (const tool of await page.locator(".scene-tools [data-tool]").all())
          await tool.click();
      }
    checks.push(lab + " variants and tools");
  }
  // No-WebGL remains a complete gateway with usable numeric experiment controls.
  const fallback = await browser.newContext();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  const flat = await fallback.newPage();
  await flat.goto(base);
  await flat.locator(".gateway-static").waitFor();
  assert.equal(await flat.locator(".lab-card").count(), 5);
  await flat.goto(base + "?lab=optics");
  await flat.locator(".fallback").waitFor();
  await flat.locator("#control-distance").fill("20");
  assert.match(await flat.locator("#readouts").textContent(), /20.00 cm/);
  checks.push("WebGL fallback");
  await fallback.close();
  assert.deepEqual(errors, []);
  await writeFile(
    ".qa/labs-results.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(
    "PASS: " + checks.length + " lab mode/theme/mobile/tool/fallback checks.",
  );
} finally {
  await browser.close();
}
