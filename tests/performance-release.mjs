import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
// One shared bandwidth limit includes service-worker requests, unlike a page-only CDP throttle.
const root = resolve("dist"),
  queue = [],
  results = [];
let bytes = 0;
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + "/") && !file.startsWith(root + "\\")) {
      res.writeHead(403).end();
      return;
    }
    let body = await readFile(file);
    const extension = extname(file);
    const mime =
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".webmanifest": "application/manifest+json",
        ".webp": "image/webp",
        ".png": "image/png",
      }[extension] || "application/octet-stream";
    const headers = {
      "Content-Type": mime,
      "Cache-Control":
        extension === ".html" || file.endsWith("sw.js")
          ? "no-cache"
          : "public, max-age=31536000",
    };
    if (/html|javascript|css|json/.test(mime)) {
      body = gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    headers["Content-Length"] = body.length;
    setTimeout(() => {
      if (!res.destroyed) {
        res.writeHead(200, headers);
        queue.push({ res, body, offset: 0 });
      }
    }, 150);
  } catch {
    res.writeHead(404).end();
  }
});
const timer = setInterval(() => {
  let budget = 8000; // 500,000 bytes/s = 4 Mbps, shared across requests.
  while (budget > 0 && queue.length) {
    const item = queue.shift();
    if (item.res.destroyed) continue;
    const length = Math.min(budget, item.body.length - item.offset);
    item.res.write(item.body.subarray(item.offset, item.offset + length));
    bytes += length;
    item.offset += length;
    budget -= length;
    if (item.offset === item.body.length) item.res.end();
    else queue.push(item);
  }
}, 16);
await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
  headless: true,
});
try {
  for (const lite of [false, true]) {
    bytes = 0;
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    if (lite)
      await context.addInitScript(() =>
        localStorage.setItem("orbit:quality", '"low"'),
      );
    const page = await context.newPage();
    const start = Date.now();
    await page.goto("http://127.0.0.1:4174/");
    const landingMs = Date.now() - start;
    await page.locator('.hero [data-open="normal"]').click();
    await page.locator("#loading").waitFor({ state: "hidden" });
    const readyMs = Date.now() - start,
      first3DBodyBytes = bytes;
    await page.waitForFunction(
      () =>
        document.querySelector(".offline-status")?.textContent ===
        "Ready to use offline",
    );
    const offlineReadyMs = Date.now() - start,
      offlineBodyBytes = bytes;
    await page.waitForTimeout(2500);
    const cadence = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const intervals = [];
          let start = performance.now(),
            last = start;
          function tick(now) {
            intervals.push(now - last);
            last = now;
            if (now - start < 5000) requestAnimationFrame(tick);
            else {
              intervals.sort((a, b) => a - b);
              resolve({
                fps: (intervals.length * 1000) / (now - start),
                p95Ms: intervals[Math.floor(intervals.length * 0.95)],
              });
            }
          }
          requestAnimationFrame(tick);
        }),
    );
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector("canvas").getContext("webgl2"),
        ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable";
    });
    results.push({
      mode: lite ? "lite" : "standard",
      landingMs,
      readyMs,
      first3DBodyBytes,
      offlineReadyMs,
      offlineBodyBytes,
      cadence,
      gpu,
    });
    await context.close();
  }
  await writeFile(
    ".qa/performance-release.json",
    JSON.stringify(
      {
        profile:
          "Shared 4 Mbps response-body budget, 150 ms server delay per request, gzip text; cold context with service worker enabled. Desktop GPU, no CPU throttling. Not physical-phone certification. Bytes exclude HTTP headers.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
  clearInterval(timer);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
