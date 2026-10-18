import { test, expect } from "vitest";
import { recommendLite, FrameSampler } from "../src/core/quality.js";
test("missing device hints do not force Lite Mode", () => {
  expect(recommendLite({})).toBe(false);
  expect(recommendLite({ hardwareConcurrency: 4 })).toBe(true);
  expect(recommendLite({ hardwareConcurrency: 8, deviceMemory: 2 })).toBe(true);
});
test("FPS sampling ignores startup, detects sustained slowness and resets", () => {
  const sample = new FrameSampler();
  for (let i = 0; i < 60; i++) expect(sample.sample(1 / 20)).toBe(false);
  let slow = false;
  for (let i = 0; i < 110; i++) slow = sample.sample(1 / 20) || slow;
  expect(slow).toBe(true);
  sample.reset();
  for (let i = 0; i < 600; i++) expect(sample.sample(1 / 60)).toBe(false);
});
