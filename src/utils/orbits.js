import data from "../data/orbits.json";
const rad = Math.PI / 180;
export function solveKepler(mean, e) {
  if (!Number.isFinite(mean) || e < 0 || e >= 1)
    throw new RangeError("Expected an elliptical orbit");
  const m =
    ((((mean + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
    Math.PI;
  let E = m;
  for (let i = 0; i < 30; i++) {
    const change = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= change;
    if (Math.abs(change) < 1e-12) return E;
  }
  throw new Error("Kepler solver did not converge");
}
export function orbitalElements(id, days) {
  const row = data.planets[id];
  if (!row) throw new RangeError("Unknown planet");
  return row.elements.map((value, i) => value + (row.rates[i] * days) / 36525);
}
function coordinates(elements, E) {
  const [a, e, I, , peri, node] = elements;
  const w = (peri - node) * rad,
    n = node * rad,
    i = I * rad;
  const x = a * (Math.cos(E) - e),
    y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  // Map ecliptic (X,Y,Z) to Three.js (X,Z,-Y).
  return {
    x:
      (Math.cos(w) * Math.cos(n) - Math.sin(w) * Math.sin(n) * Math.cos(i)) *
        x +
      (-Math.sin(w) * Math.cos(n) - Math.cos(w) * Math.sin(n) * Math.cos(i)) *
        y,
    y: Math.sin(w) * Math.sin(i) * x + Math.cos(w) * Math.sin(i) * y,
    z: -(
      (Math.cos(w) * Math.sin(n) + Math.sin(w) * Math.cos(n) * Math.cos(i)) *
        x +
      (-Math.sin(w) * Math.sin(n) + Math.cos(w) * Math.cos(n) * Math.cos(i)) * y
    ),
  };
}
export function keplerPosition(id, days) {
  if (id === "sun") return { x: 0, y: 0, z: 0 };
  const elements = orbitalElements(id, days);
  return coordinates(
    elements,
    solveKepler((elements[3] - elements[4]) * rad, elements[1]),
  );
}
export function orbitPath(id, days, segments = 128) {
  const elements = orbitalElements(id, days);
  return Array.from({ length: segments }, (_, i) =>
    coordinates(elements, (2 * Math.PI * i) / segments),
  );
}
