import { test, expect } from "vitest";
import { solveKepler, keplerPosition } from "../src/utils/orbits.js";
import {
  dateToJulian,
  julianToDate,
  parseDate,
  MIN_JD,
  MAX_JD,
} from "../src/utils/dates.js";
import references from "./fixtures/horizons.json";
test("Kepler solver residual stays small for eccentric orbits and negative angles", () => {
  for (const e of [0, 0.0167, 0.2056, 0.8])
    for (const m of [-3, -0.1, 0, 1, 3]) {
      const E = solveKepler(m, e);
      expect(Math.abs(E - e * Math.sin(E) - m)).toBeLessThan(1e-10);
    }
});
test("Gregorian dates convert to Julian dates without local timezone shifts", () => {
  expect(dateToJulian("2000-01-01T12:00:00Z")).toBe(2451545);
  expect(julianToDate(2451545).toISOString()).toBe("2000-01-01T12:00:00.000Z");
  expect(parseDate("1800-01-01")).toBe(MIN_JD);
  expect(parseDate("2050-12-31")).toBe(MAX_JD);
  expect(parseDate("2000-02-29")).not.toBeNull();
  for (const invalid of [
    "1900-02-29",
    "2030-02-30",
    "2051-01-01",
    "1799-12-31",
    "bad",
  ])
    expect(parseDate(invalid)).toBeNull();
});
for (const ref of references.fixtures)
  test(`${ref.id} at JD ${ref.jd} agrees with independent JPL Horizons within model tolerance`, () => {
    const p = keplerPosition(ref.id, ref.jd - 2451545),
      [x, y, z] = ref.eclipticAu;
    expect(Math.hypot(p.x - x, p.y - z, p.z + y)).toBeLessThan(ref.toleranceAu);
  });
