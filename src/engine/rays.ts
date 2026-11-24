/** Geometric optics: unit directions, outward surface normal; Snell and specular reflection.
 * Source: OpenStax University Physics 3, sections 1.2–1.4. */
export type V = { x: number; y: number };
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
export const unit = (a: V): V => {
  const n = Math.hypot(a.x, a.y);
  if (!n) throw new RangeError("Direction must be nonzero");
  return { x: a.x / n, y: a.y / n };
};
export function reflect(direction: V, normal: V): V {
  const d = unit(direction),
    n = unit(normal),
    k = 2 * dot(d, n);
  return { x: d.x - k * n.x, y: d.y - k * n.y };
}
export function refract(
  direction: V,
  normal: V,
  n1: number,
  n2: number,
): V | null {
  if (!(n1 > 0 && n2 > 0))
    throw new RangeError("Positive refractive indices required");
  const d = unit(direction);
  let n = unit(normal);
  if (dot(d, n) > 0) n = { x: -n.x, y: -n.y };
  const cos = -dot(d, n),
    eta = n1 / n2,
    k = 1 - eta * eta * (1 - cos * cos);
  return k < 0
    ? null
    : unit({
        x: eta * d.x + (eta * cos - Math.sqrt(k)) * n.x,
        y: eta * d.y + (eta * cos - Math.sqrt(k)) * n.y,
      });
}
export function intersection(o: V, d: V, a: V, b: V) {
  const e = { x: b.x - a.x, y: b.y - a.y },
    q = { x: a.x - o.x, y: a.y - o.y },
    cross = (u: V, v: V) => u.x * v.y - u.y * v.x,
    den = cross(d, e);
  if (Math.abs(den) < 1e-9) return null;
  const distance = cross(q, e) / den,
    t = cross(q, d) / den;
  return distance > 1e-5 && t >= 0 && t <= 1
    ? {
        distance,
        point: { x: o.x + distance * d.x, y: o.y + distance * d.y },
        normal: unit({ x: e.y, y: -e.x }),
      }
    : null;
}
export function tracePrism(
  origin: V,
  direction: V,
  vertices: V[],
  index: number,
) {
  let o = origin,
    d = unit(direction),
    inside = false;
  const segments: { a: V; b: V; n: number; event: string }[] = [];
  for (let bounce = 0; bounce < 8; bounce++) {
    const hits = vertices
        .map((a, i) =>
          intersection(o, d, a, vertices[(i + 1) % vertices.length]),
        )
        .filter((h) => h !== null)
        .sort((a, b) => a.distance - b.distance),
      hit = hits[0];
    if (!hit) {
      segments.push({
        a: o,
        b: { x: o.x + d.x * 18, y: o.y + d.y * 18 },
        n: inside ? index : 1,
        event: "exit",
      });
      break;
    }
    const next = refract(d, hit.normal, inside ? index : 1, inside ? 1 : index);
    segments.push({
      a: o,
      b: hit.point,
      n: inside ? index : 1,
      event: next ? "refraction" : "total internal reflection",
    });
    d = next || reflect(d, hit.normal);
    if (next) inside = !inside;
    o = { x: hit.point.x + d.x * 1e-4, y: hit.point.y + d.y * 1e-4 };
  }
  return segments;
}
export function waveInMedium(wavelengthNm: number, index: number) {
  return {
    wavelengthNm: wavelengthNm / index,
    speed: 299792458 / index,
    frequency: 299792458 / (wavelengthNm * 1e-9),
  };
}
