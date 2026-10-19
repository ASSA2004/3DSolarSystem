import { test, expect } from "vitest";
import { ScaleJourney } from "../src/modes/journey.js";
import { readSharedState, shareURL } from "../src/utils/share.js";
test("journey pauses, seeks and stops at Neptune with calculated light time", () => {
  const j = new ScaleJourney(0);
  j.update(20);
  expect(j.progress).toBe(0);
  j.playing = true;
  j.update(30);
  expect(j.progress).toBe(0.5);
  j.update(100);
  expect(j.progress).toBe(1);
  expect(j.playing).toBe(false);
  expect(j.minutes).toBeGreaterThan(240);
  expect(j.minutes).toBeLessThan(260);
  j.seek(-2);
  expect(j.progress).toBe(0);
  j.seek(2);
  expect(j.progress).toBe(1);
});
test("shared state rejects arbitrary planets and invalid dates", () => {
  expect(
    readSharedState("?planet=mars&date=2030-01-01&mode=true-scale"),
  ).toMatchObject({ planet: "mars", date: "2030-01-01", scale: true });
  expect(
    readSharedState("?planet=<script>&date=2030-02-30&view=other"),
  ).toMatchObject({ planet: null, date: null, view: "normal" });
  const url = shareURL("https://example.org/3DSolarSystem/", {
    planet: "earth",
    date: "2030-01-01",
    scale: false,
    view: "details",
  });
  expect(readSharedState(new URL(url).search).planet).toBe("earth");
});
