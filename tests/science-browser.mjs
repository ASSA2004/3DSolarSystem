import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir(".qa", { recursive: true });
const b = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
const base = process.env.LAB_URL || "http://127.0.0.1:5173/";
try {
  const errors = [];
  for (const width of [1440, 360]) {
    const p = await b.newPage({
      reducedMotion: "reduce",
      viewport: { width, height: width === 360 ? 800 : 1000 },
      isMobile: width === 360,
      hasTouch: width === 360,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "?lab=matter");
    await p.locator("#lab-scene canvas").waitFor();
    await p.locator("#control-temperature").fill("90");
    await p.locator('[data-tool="heat"]').click();
    await p.waitForFunction(() =>
      document.querySelector("#readouts")?.textContent.includes("100.0 °C"),
    );
    const read = await p.locator("#readouts").innerText();
    assert.match(read, /boiling/);
    await p.locator('[data-tool="pause"]').click();
    for (const view of ["experiment", "molecular", "atomic"]) {
      await p.locator(`[data-science-view="${view}"]`).click();
      assert.match(await p.locator("#readouts").innerText(), /100.0 °C/);
      await p.screenshot({
        path: `.qa/science-water-${view}-${width}.png`,
        fullPage: true,
      });
    }
    await p.locator("#control-atom").selectOption("hydrogen");
    await p.locator("#control-atom").selectOption("nucleus");
    await p.locator('[data-tool="cool"]').click();
    await p.waitForFunction(() =>
      document.querySelector("#readouts")?.textContent.includes("liquid"),
    );
    await p.locator('[data-tool="pause"]').click();
    await p.goto(base + "?lab=optics");
    await p.locator("#lab-scene canvas").waitFor();
    for (const element of [
      "convex-lens",
      "concave-lens",
      "prism",
      "plane-mirror",
    ]) {
      await p.locator("#control-element").selectOption(element);
      for (const view of ["human", "rays", "waves"]) {
        await p.locator(`[data-science-view="${view}"]`).click();
        await p.screenshot({
          path: `.qa/science-optics-${element}-${view}-${width}.png`,
          fullPage: true,
        });
      }
      if (["prism", "plane-mirror"].includes(element)) {
        await p.locator("#control-angle").fill("20");
        assert.match(await p.locator("#readouts").innerText(), /20°/);
      }
    }
    await p.goto(base + "?lab=plane");
    await p.locator("#lab-scene canvas").waitFor();
    assert.equal(await p.locator("#control-z").isDisabled(), true);
    const canvas = p.locator("#lab-scene canvas");
    await canvas.scrollIntoViewIfNeeded();
    let box = await canvas.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(
      box.x + box.width / 2 + 25,
      box.y + box.height / 2 - 15,
      { steps: 6 },
    );
    await p.mouse.up();
    assert.notEqual(
      await p.locator("#control-x").inputValue(),
      "0",
      "Dragging moves the actual XY shape",
    );

    await p.locator("#control-x").fill("2");
    await p.locator("#control-y").fill("3");
    await p.locator('[data-science-view="spatial"]').click();
    assert.equal(await p.locator("#control-z").isDisabled(), false);
    await p.locator("#control-z").fill("4");
    await p.locator("#control-angle").fill("45");
    await canvas.scrollIntoViewIfNeeded();
    box = await canvas.boundingBox();
    const beforeOrbit = await canvas.screenshot();
    if (width === 360) {
      const cdp = await p.context().newCDPSession(p);
      const points = (spread) => [
        {
          x: box.x + box.width * 0.5 - spread,
          y: box.y + box.height * 0.2,
          id: 1,
        },
        {
          x: box.x + box.width * 0.5 + spread,
          y: box.y + box.height * 0.2,
          id: 2,
        },
      ];
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: points(30),
      });
      for (const spread of [40, 50, 60, 70])
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: points(spread),
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await cdp.detach();
    } else {
      await p.mouse.move(box.x + 35, box.y + 35);
      await p.mouse.down();
      await p.mouse.move(box.x + 130, box.y + 60, { steps: 8 });
      await p.mouse.up();
    }
    await p.waitForTimeout(300);
    assert.equal(
      beforeOrbit.equals(await canvas.screenshot()),
      false,
      "Orbit / touch pinch changes the 3D camera",
    );
    assert.equal(
      await p.locator("#control-z").inputValue(),
      "4",
      "Camera interaction preserves experiment depth",
    );

    await p.screenshot({
      path: `.qa/science-dimensions-3d-${width}.png`,
      fullPage: true,
    });
    await p.locator('[data-science-view="flat"]').click();
    assert.equal(await p.locator("#control-x").inputValue(), "2");
    assert.equal(await p.locator("#control-y").inputValue(), "3");
    await p.screenshot({
      path: `.qa/science-dimensions-2d-${width}.png`,
      fullPage: true,
    });
    await p.locator('[data-tool="notes"]').click();
    assert.equal(await p.locator("#learning").isVisible(), false);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await p.locator('[data-tool="reset"]').click();
    assert.equal(await p.locator("#control-x").inputValue(), "0");
    assert.equal(await p.locator("#control-z").inputValue(), "0");
    assert.equal(
      await p
        .locator('[data-science-view="flat"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    await p.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: coupled heating/cooling, retained views, four optical elements × three views, and XY/XYZ constraints at desktop/mobile widths.",
  );
} finally {
  await b.close();
}
