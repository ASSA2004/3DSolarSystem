/** XY has no depth. Projection and spatial position share x/y, never a fictitious 2D z. */
export function dimensionPosition(
  x: number,
  y: number,
  z: number,
  spatial: boolean,
) {
  return { x, y, z: spatial ? z : 0 };
}
export function extrusionVolume(area: number, depth: number) {
  if (area < 0 || depth < 0)
    throw new RangeError("Nonnegative measures required");
  return area * depth;
}
