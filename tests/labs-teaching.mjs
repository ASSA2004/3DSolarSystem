import { chromium } from "playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
const base = process.env.LAB_URL || "http://127.0.0.1:5173/";
try {
  const p = await b.newPage({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
  });
  await p.addInitScript(() => {
    window.labContexts = new Set();
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const context = original.call(this, type, ...args);
      if (context && type.startsWith("webgl")) window.labContexts.add(context);
      return context;
    };
  });
  const actions = {
    optics: [
      async () => p.locator("#control-distance").fill("31"),
      async () => p.locator("#control-distance").fill("15"),
      async () => p.locator("#control-distance").fill("5"),
    ],
    matter: [
      async () => p.locator("#control-temperature").fill("-10"),
      async () => {
        await p.locator('[data-tool="melting"]').click();
        await p.locator('[data-tool="heat"]').click();
      },
      async () => p.locator("#control-temperature").fill("110"),
    ],
    plane: [
      async () => p.locator('[data-tool="count"]').click(),
      async () => {
        await p.locator("#control-shape").selectOption("parallelogram");
        await p.locator("#control-slant").fill("3");
      },
      async () => {
        await p.locator("#control-shape").selectOption("circle");
        await p.locator('[data-tool="derive"]').click();
      },
    ],
    solid: [
      async () => p.locator('[data-tool="fill"]').click(),
      async () => {
        await p.locator("#control-shape").selectOption("cuboid");
        await p.locator('[data-tool="net"]').click();
      },
      async () => {
        await p.locator("#control-shape").selectOption("cone");
        await p.locator("#control-height").fill("5");
      },
    ],
  };
  for (const [lab, steps] of Object.entries(actions)) {
    await p.goto(base + "?lab=" + lab + "&mode=teach");
    await p.locator("#controls").waitFor();
    for (const action of steps) {
      await action();
      await p.locator('[data-command="why"]').click();
      await p.locator('[data-answer="0"]').click();
      await p.locator('[data-command="next"]').click();
    }
  }
  if (!process.env.LAB_URL) {
    for (let i = 0; i < 12; i++) {
      await p.locator("[data-home]").last().click();
      await p
        .locator(
          `[data-enter="${["optics", "matter", "plane", "solid"][i % 4]}"][data-learning="experiment"]`,
        )
        .click();
      await p.locator("#controls").waitFor();
      await p.locator("#lab-scene canvas").waitFor();
      await p.waitForFunction(
        () =>
          [...window.labContexts].filter((context) => !context.isContextLost())
            .length === 1,
      );
      assert.equal(await p.locator("canvas").count(), 1);
    }
  }
  console.log(
    "PASS: all 12 new-lab teaching steps and repeated scene disposal.",
  );
} finally {
  await b.close();
}
