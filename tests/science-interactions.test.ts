import { describe, it, expect } from "vitest";
import { reflect, refract, tracePrism, waveInMedium } from "../src/engine/rays";
import { dimensionPosition, extrusionVolume } from "../src/engine/dimensions";
import { advanceWater, defaults } from "../src/labs/matter.js";
import {
  change as changeOptics,
  defaults as opticalDefaults,
} from "../src/labs/optics.js";
describe("physical interactions", () => {
  it("moving the lens changes object distance while keeping the source fixed", () => {
    const s = { ...opticalDefaults };
    const source = s.position - s.distance;
    changeOptics(s, "position", 4);
    expect(s.distance).toBe(34);
    expect(s.position - s.distance).toBe(source);
    changeOptics(s, "element", "prism");
    changeOptics(s, "distance", 2);
    expect(s.distance).toBe(16);
  });
  it("reflection preserves speed and reverses the normal component", () => {
    const d = { x: 0.6, y: 0.8 };
    const r = reflect(d, { x: 1, y: 0 });
    expect(r.x).toBeCloseTo(-0.6);
    expect(r.y).toBeCloseTo(0.8);
    expect(Math.hypot(r.x, r.y)).toBeCloseTo(1);
  });
  it("refraction obeys Snell and reverses along the same path", () => {
    const d = { x: Math.cos(Math.PI / 6), y: 0.5 };
    const r = refract(d, { x: -1, y: 0 }, 1, 1.5)!;
    expect(r.y * 1.5).toBeCloseTo(0.5);
    const back = refract({ x: -r.x, y: -r.y }, { x: 1, y: 0 }, 1.5, 1)!;
    expect(back.x).toBeCloseTo(-d.x);
    expect(back.y).toBeCloseTo(-d.y);
  });
  it("total internal reflection happens beyond the critical angle", () =>
    expect(
      refract({ x: 0.5, y: Math.sqrt(3) / 2 }, { x: -1, y: 0 }, 1.5, 1),
    ).toBeNull());
  it("a prism refracts at two faces and exits in air", () => {
    const path = tracePrism(
      { x: -8, y: 0 },
      { x: 1, y: 0 },
      [
        { x: -2, y: -3 },
        { x: 2, y: -3 },
        { x: 0, y: 3 },
      ],
      1.5,
    );
    expect(path.filter((p) => p.event === "refraction").length).toBe(2);
    expect(path.at(-1)?.n).toBe(1);
  });
  it("wave frequency is conserved while wavelength and speed change", () => {
    const air = waveInMedium(600, 1),
      glass = waveInMedium(600, 1.5);
    expect(glass.wavelengthNm).toBe(400);
    expect(glass.speed / air.speed).toBeCloseTo(1 / 1.5);
    expect(glass.frequency).toBe(air.frequency);
  });
  it("XY mode removes depth; XYZ preserves it", () => {
    expect(dimensionPosition(2, 3, 4, false)).toEqual({ x: 2, y: 3, z: 0 });
    expect(dimensionPosition(2, 3, 4, true).z).toBe(4);
    expect(extrusionVolume(9, 3)).toBe(27);
  });
  it("water heating holds at boiling while vapor fraction rises", () => {
    const s = { ...defaults, energy: 752, heat: 70 };
    const a = advanceWater(s, 1);
    expect(a.temperature).toBe(100);
    expect(a.gas).toBeGreaterThan(0);
    const lost = s.escaped;
    s.heat = -70;
    advanceWater(s, 1);
    expect(s.escaped).toBeGreaterThanOrEqual(lost);
  });
  it("changing observational view does not change the thermal state", () => {
    const s = { ...defaults };
    const e = s.energy;
    s.view = "atomic";
    advanceWater(s, 1);
    expect(s.energy).toBe(e);
    expect(s.escaped).toBe(0);
  });
});
