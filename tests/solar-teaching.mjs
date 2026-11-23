import { chromium } from "playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
const p = await b.newPage({
  viewport: { width: 360, height: 800 },
  reducedMotion: "reduce",
});
try {
  await p.goto(
    (process.env.PREVIEW_URL || "http://127.0.0.1:5173/solar.html") +
      "?learning=teach",
  );
  await p.locator(".solar-learning").waitFor();
  await p.locator('[data-action="pause"]').click();
  for (let step = 0; step < 3; step++) {
    if (step === 1)
      await p.locator('.planet-nav [data-planet="earth"]').click();
    if (step === 2) {
      await p.locator('[data-action="help"]').click();
      await p.locator('dialog [data-action="scale"]').click();
      await p.keyboard.press("Escape");
    }
    await p.locator("[data-solar-why]").click();
    await p.locator('[data-solar-answer="0"]').click();
    await p.locator("[data-solar-next]").click();
  }
  for (const mode of ["details", "video"]) {
    await p.locator(`.mode-switch [data-mode="${mode}"]`).click();
    assert.equal(await p.locator(".solar-learning").isVisible(), false);
  }
  console.log(
    "PASS: Solar three teaching steps; Details and Video remain unobstructed.",
  );
} finally {
  await b.close();
}
