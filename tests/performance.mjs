import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
const results = [];
try {
  for (const lite of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    if (lite)
      await context.addInitScript(() =>
        localStorage.setItem("orbit:quality", '"low"'),
      );
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 4_000_000 / 8,
      uploadThroughput: 1_000_000 / 8,
    });
    let transferred = 0;
    cdp.on("Network.loadingFinished", (e) => {
      transferred += e.encodedDataLength;
    });
    const start = Date.now();
    await page.goto("http://127.0.0.1:4173/");
    const landingMs = Date.now() - start;
    await page.locator('.hero [data-open="normal"]').click();
    await page.locator("#loading").waitFor({ state: "hidden" });
    const readyMs = Date.now() - start;
    const first3DBytes = transferred;
    await page.waitForTimeout(3000);
    const cadence = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let previous = performance.now(),
            start = previous;
          const intervals = [];
          function frame(now) {
            intervals.push(now - previous);
            previous = now;
            if (now - start < 5000) requestAnimationFrame(frame);
            else {
              intervals.sort((a, b) => a - b);
              resolve({
                framesPerSecond: intervals.length / ((now - start) / 1000),
                p95Ms: intervals[Math.floor(intervals.length * 0.95)],
              });
            }
          }
          requestAnimationFrame(frame);
        }),
    );
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "Unavailable";
    });
    results.push({
      mode: lite ? "lite" : "standard",
      landingMs,
      readyMs,
      first3DBytes,
      cadence,
      gpu,
    });
    await context.close();
  }
  await mkdir(".qa", { recursive: true });
  await writeFile(
    ".qa/performance.json",
    JSON.stringify(
      {
        note: "Cold local production preview; emulated 4 Mbps down, 150 ms latency. Desktop headless Chrome frame cadence, not a physical phone FPS result.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
