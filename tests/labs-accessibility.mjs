import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  }),
  context = await b.newContext({ reducedMotion: "reduce" }),
  p = await context.newPage();
const reports = [];
try {
  for (const theme of ["light", "dark"])
    for (const lab of ["", "optics", "matter", "plane", "solid"]) {
      await p.goto(
        (process.env.LAB_URL || "http://127.0.0.1:5173/") +
          (lab ? "?lab=" + lab : ""),
      );
      await p.evaluate((v) => localStorage.setItem("prayog:theme", v), theme);
      await p.reload();
      if (lab) await p.locator("#controls").waitFor();
      else await p.locator(".lab-card").first().waitFor();
      const r = await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      reports.push({
        theme,
        lab,
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      });
    }
  await writeFile(
    ".qa/labs-accessibility.json",
    JSON.stringify(reports, null, 2),
  );
  console.log(
    JSON.stringify(
      reports.filter((r) => r.violations.length),
      null,
      2,
    ),
  );
  if (reports.some((r) => r.violations.length)) process.exitCode = 1;
} finally {
  await b.close();
}
