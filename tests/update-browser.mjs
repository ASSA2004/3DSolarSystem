import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
const root = resolve("dist");
const release = JSON.parse(
  await readFile(resolve(root, "release.json"), "utf8"),
);
const nextVersion = release.version + ".test";
let revision = "legacy";
const legacyHtml =
  '<!doctype html><html><body><main>Previous classroom release</main><script>navigator.serviceWorker.register("sw.js").then(()=>navigator.serviceWorker.ready).then(()=>document.body.dataset.ready="true")</script></body></html>';
const legacyWorker = `const CACHE='orbit-legacy-test';self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','legacy-lazy.js']))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request))));`;
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost").pathname.replace(
      /^\/3DSolarSystem\//,
      "",
    );
    let body;
    if (revision === "legacy") {
      body =
        path === "sw.js"
          ? legacyWorker
          : path === "legacy-lazy.js"
            ? "/* old lesson asset */"
            : legacyHtml;
    } else {
      const file = resolve(root, path || "index.html");
      if (!file.startsWith(root + "/") && !file.startsWith(root + "\\"))
        throw Error("outside build");
      body = await readFile(file);
      if (revision === "future" && /\.(js|json)$/.test(path)) {
        body = body.toString().replaceAll(release.version, nextVersion);
        if (path === "sw.js")
          body = body.replace(/orbit-[a-f0-9]+/, "orbit-future-test");
      }
    }
    const mime =
      {
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".webp": "image/webp",
        ".woff2": "font/woff2",
      }[extname(path)] || "text/html";
    res
      .writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(4182, "127.0.0.1", r));
const browser = await chromium.launch({
  channel: process.env.CI ? undefined : "chrome",
});
const base = "http://127.0.0.1:4182/3DSolarSystem/";
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base);
  await p.waitForFunction(
    () =>
      document.body.dataset.ready === "true" &&
      navigator.serviceWorker.controller,
  );
  await p.evaluate(() =>
    localStorage.setItem(
      "prayog:notebook:matter",
      JSON.stringify([[["Temperature", "42 °C"]]]),
    ),
  );
  revision = "current";
  await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg.update();
  });
  await p.waitForFunction(async (version) => {
    const channel = new MessageChannel();
    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        channel.port1.close();
        resolve(false);
      }, 500);
      channel.port1.onmessage = ({ data }) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(data.version === version);
      };
      navigator.serviceWorker.controller?.postMessage({ type: "VERSION" }, [
        channel.port2,
      ]);
    });
  }, release.version);
  assert.match(
    await p.locator("main").innerText(),
    /Previous classroom/,
    "Installing an update does not interrupt a lesson",
  );
  await context.setOffline(true);
  assert.match(
    await p.evaluate(async () => await (await fetch("legacy-lazy.js")).text()),
    /old lesson asset/,
  );
  await p.reload();
  await p.locator(".release-status").waitFor();
  assert.match(
    await p.locator(".release-status").innerText(),
    new RegExp(release.version),
  );
  await context.setOffline(false);
  await p.goto(base + "?lab=matter");
  await p.locator("#lab-scene canvas").waitFor();
  await p.locator("#control-temperature").fill("42");
  await p.locator(".release-check").first().waitFor();
  revision = "future";
  await p.locator(".release-check").first().click();
  await p.locator(".update-notice").waitFor();
  const accessibility = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    accessibility.violations.map((v) => v.id),
    [],
    "Update notice is accessible",
  );
  assert.equal(await p.locator("#control-temperature").inputValue(), "42");
  assert.match(await p.locator(".offline-status").innerText(), /New version/);
  await p.locator("[data-later]").click();
  assert.equal(await p.locator(".update-notice").isVisible(), false);
  await p.locator(".release-check").first().click();
  await p.locator("[data-reload]").click();
  await p.waitForFunction(
    (version) =>
      document.querySelector(".release-status")?.textContent.includes(version),
    nextVersion,
  );
  assert.match(
    await p.evaluate(() => localStorage.getItem("prayog:notebook:matter")),
    /42/,
  );
  await context.setOffline(true);
  await p.reload();
  await p.locator("#lab-scene canvas").waitFor();
  for (const view of ["molecular", "atomic", "experiment"])
    await p.locator(`[data-science-view="${view}"]`).click();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: legacy cache upgrades automatically; open lesson and old chunks survive; visible update/reload works; notebook and all matter views survive offline reload.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
