export type Point = { x: number; y: number };
export function polygon(points: Point[]) {
  let twice = 0,
    perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    twice += a.x * b.y - b.x * a.y;
    perimeter += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return { area: Math.abs(twice) / 2, perimeter };
}
export function shape2D(
  shape: string,
  width: number,
  height: number,
  skew = 2,
) {
  if (!(width > 0 && height > 0))
    throw new RangeError("Dimensions must be positive");
  if (shape === "circle")
    return {
      area: Math.PI * width * width,
      perimeter: 2 * Math.PI * width,
      points: [] as Point[],
    };
  const w = width,
    h = shape === "square" ? width : height;
  const points =
    shape === "triangle"
      ? [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w / 2, y: h },
        ]
      : shape === "parallelogram"
        ? [
            { x: 0, y: 0 },
            { x: w, y: 0 },
            { x: w + skew, y: h },
            { x: skew, y: h },
          ]
        : shape === "trapezium"
          ? [
              { x: 0, y: 0 },
              { x: w, y: 0 },
              { x: w * 0.75, y: h },
              { x: w * 0.25, y: h },
            ]
          : [
              { x: 0, y: 0 },
              { x: w, y: 0 },
              { x: w, y: h },
              { x: 0, y: h },
            ];
  return { ...polygon(points), points };
}
export function solid3D(
  shape: string,
  width: number,
  height: number,
  depth: number,
) {
  if (![width, height, depth].every((n) => n > 0 && Number.isFinite(n)))
    throw new RangeError("Dimensions must be positive");
  const r = width,
    h = height;
  if (shape === "sphere")
    return {
      volume: (4 * Math.PI * r ** 3) / 3,
      curved: 4 * Math.PI * r * r,
      total: 4 * Math.PI * r * r,
    };
  if (shape === "cylinder")
    return {
      volume: Math.PI * r * r * h,
      curved: 2 * Math.PI * r * h,
      total: 2 * Math.PI * r * (h + r),
    };
  if (shape === "cone") {
    const l = Math.hypot(r, h);
    return {
      volume: (Math.PI * r * r * h) / 3,
      curved: Math.PI * r * l,
      total: Math.PI * r * (l + r),
    };
  }
  const a = width,
    b = shape === "cube" ? width : height,
    c = shape === "cube" ? width : depth;
  return { volume: a * b * c, curved: 0, total: 2 * (a * b + a * c + b * c) };
}
export function coneNet(radius: number, height: number) {
  const slant = Math.hypot(radius, height);
  return {
    slant,
    angle: (2 * Math.PI * radius) / slant,
    sectorArea: Math.PI * radius * slant,
    baseArea: Math.PI * radius ** 2,
  };
}
export function boxNet(w: number, h: number, d: number) {
  return [
    { w, h },
    { w: d, h },
    { w, h },
    { w: d, h },
    { w, h: d },
    { w, h: d },
  ];
}
