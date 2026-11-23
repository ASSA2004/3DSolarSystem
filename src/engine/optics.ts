export type OpticalElement =
  "convex-lens" | "concave-lens" | "concave-mirror" | "convex-mirror";
/** Cartesian convention: incident light travels +x; real object u<0. Distances in cm. */
export function optics(
  element: OpticalElement,
  distance: number,
  focal: number,
) {
  if (!(distance > 0 && focal > 0))
    throw new RangeError("Distances must be positive");
  const mirror = element.endsWith("mirror");
  const f =
    (element === "concave-lens" || element === "concave-mirror" ? -1 : 1) *
    focal;
  const u = -distance;
  const denominator = mirror ? 1 / f - 1 / u : 1 / f + 1 / u;
  if (Math.abs(denominator) < 1e-10)
    return {
      u,
      f,
      v: null,
      m: null,
      real: false,
      infinity: true,
      upright: false,
    };
  const v = 1 / denominator;
  const m = mirror ? -v / u : v / u;
  return {
    u,
    f,
    v,
    m,
    real: mirror ? v < 0 : v > 0,
    infinity: false,
    upright: m > 0,
  };
}
