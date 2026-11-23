import { describe, it, expect } from "vitest";
import { optics } from "../src/engine/optics";
import { phaseFromEnergy, energyAtTemperature } from "../src/engine/matter";
import { shape2D, solid3D, coneNet, boxNet } from "../src/engine/measurement";
describe("Cartesian optics", () => {
  for (const type of ["convex-lens", "concave-mirror"] as const)
    for (const [d, v, m] of [
      [30, 15, -0.5],
      [20, 20, -1],
      [15, 30, -2],
      [5, -10, 2],
    ])
      it(`${type}, object ${d} cm`, () => {
        const result = optics(type, d, 10);
        expect(result.v).toBeCloseTo(type.endsWith("mirror") ? -v : v);
        expect(result.m).toBeCloseTo(m);
      });
  for (const type of ["convex-lens", "concave-mirror"] as const)
    it(`${type} at focus`, () =>
      expect(optics(type, 10, 10).infinity).toBe(true));
  for (const type of ["concave-lens", "convex-mirror"] as const)
    for (const d of [30, 20, 15, 10, 5])
      it(`${type} diverges at ${d}`, () => {
        const r = optics(type, d, 10);
        expect(r.real).toBe(false);
        expect(r.m).toBeGreaterThan(0);
        expect(r.m).toBeLessThan(1);
      });
});
describe("Water enthalpy", () => {
  it("conserves temperature during both phase changes", () => {
    expect(phaseFromEnergy(167).temperature).toBe(0);
    expect(phaseFromEnergy(167).liquid).toBe(0.5);
    expect(phaseFromEnergy(752 + 1128).temperature).toBe(100);
    expect(phaseFromEnergy(752 + 1128).gas).toBe(0.5);
  });
  it("maps temperatures consistently", () => {
    for (const t of [-20, -5, 20, 80, 110])
      expect(phaseFromEnergy(energyAtTemperature(t)).temperature).toBeCloseTo(
        t,
      );
  });
});
describe("Measurement and nets", () => {
  it("computes all flat shapes", () => {
    for (const [s, a] of [
      ["square", 16],
      ["rectangle", 12],
      ["triangle", 6],
      ["parallelogram", 12],
      ["trapezium", 9],
    ] as const)
      expect(shape2D(s, 4, 3).area).toBeCloseTo(a);
    expect(shape2D("circle", 2, 1).perimeter).toBeCloseTo(4 * Math.PI);
  });
  it("computes all solids", () => {
    expect(solid3D("cube", 2, 2, 2).volume).toBe(8);
    expect(solid3D("cuboid", 2, 3, 4).total).toBe(52);
    expect(solid3D("cylinder", 2, 3, 1).volume).toBeCloseTo(12 * Math.PI);
    expect(solid3D("cone", 2, 3, 1).volume).toBeCloseTo(4 * Math.PI);
    expect(solid3D("sphere", 3, 1, 1).volume).toBeCloseTo(36 * Math.PI);
  });
  it("nets preserve exact surface area", () => {
    const n = coneNet(3, 4);
    expect(n.slant).toBe(5);
    expect(n.slant * n.angle).toBeCloseTo(6 * Math.PI);
    expect(n.sectorArea + n.baseArea).toBeCloseTo(
      solid3D("cone", 3, 4, 1).total,
    );
    expect(boxNet(2, 3, 4).reduce((a, f) => a + f.w * f.h, 0)).toBe(52);
  });
});
