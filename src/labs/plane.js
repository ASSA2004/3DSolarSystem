import { THREE, mesh, label } from "./stage.js";
import { shape2D } from "../engine/measurement.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  shape: "rectangle",
  width: 4,
  height: 3,
  slant: 2,
  count: false,
  derive: false,
  slantChanged: false,
};
export const controls = [
  {
    key: "shape",
    label: "shape",
    options: [
      "square",
      "rectangle",
      "triangle",
      "parallelogram",
      "trapezium",
      "circle",
    ],
  },
  { key: "width", label: "width", min: 1, max: 8, step: 1, unit: "units" },
  { key: "height", label: "height", min: 1, max: 8, step: 1, unit: "units" },
  { key: "slant", label: "slant", min: 0, max: 4, step: 1, unit: "units" },
];
export const tools = [
  { key: "count", label: "count" },
  { key: "derive", label: "show" },
  { key: "flat", label: "flat" },
];
export function change(s, key, value) {
  if (key === "count" || key === "derive") s[key] = !s[key];
  else {
    s[key] = value;
    if (key === "slant") s.slantChanged = true;
  }
}
export function result(s) {
  const r = shape2D(s.shape, s.width, s.height, s.slant);
  return {
    rows: [
      [t("area"), r.area.toFixed(2) + " units²"],
      [t("perimeter"), r.perimeter.toFixed(2) + " units"],
    ],
    answer: 0,
    explanation: `${r.area.toFixed(2)} units² → ${(4 * r.area).toFixed(2)} units². ${t("doubleArea")}`,
    detail:
      s.shape === "trapezium"
        ? "The parallel sides are width and half-width. Area = ½ × (a + b) × height."
        : "Count full squares and combine partial squares. The live number uses exact geometry, not a rounded square count.",
  };
}
export function achieved(s, target) {
  return target === "count"
    ? s.shape === "rectangle" && s.count
    : target === "slant"
      ? s.shape === "parallelogram" && s.slantChanged
      : s.shape === "circle" && s.derive;
}
function contains(x, y, points) {
  let yes = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      yes = !yes;
  }
  return yes;
}
export function create(stage, s, onChange) {
  if (!stage) return { update() {} };
  let progress = 0,
    shapeMesh,
    derived,
    pieces = [];
  const update = () => {
    stage.clear();
    progress = 0;
    pieces = [];
    const root = stage.content;
    const grid = new THREE.GridHelper(24, 24, 0x729e90, 0xa8c5b8);
    root.add(grid);
    const r = shape2D(s.shape, s.width, s.height, s.slant);
    const points = r.points;
    let geometry;
    if (s.shape === "circle") geometry = new THREE.CircleGeometry(s.width, 64);
    else {
      const shape = new THREE.Shape(
        points.map((p) => new THREE.Vector2(p.x, p.y)),
      );
      geometry = new THREE.ShapeGeometry(shape);
    }
    geometry.rotateX(-Math.PI / 2);
    shapeMesh = mesh(root, geometry, 0x00b5a0, [0, 0.06, 0], {
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const offset = s.shape === "circle" ? 0 : -s.width / 2;
    shapeMesh.position.x = offset;
    if (s.count) {
      for (let x = -8; x < 12; x++)
        for (let y = -8; y < 9; y++) {
          const corners = [
            [x + 0.01, y + 0.01],
            [x + 0.99, y + 0.01],
            [x + 0.01, y + 0.99],
            [x + 0.99, y + 0.99],
          ];
          const inside = corners.every(([a, b]) =>
            s.shape === "circle"
              ? a * a + b * b < s.width * s.width
              : contains(a, b, points),
          );
          if (inside)
            mesh(
              root,
              new THREE.PlaneGeometry(0.88, 0.88),
              0xa0ebd0,
              [x + 0.5 + offset, 0.09, -y - 0.5],
              { side: THREE.DoubleSide },
            ).rotation.x = -Math.PI / 2;
        }
    }
    const handle = mesh(
      root,
      new THREE.SphereGeometry(0.22, 16, 12),
      0xffd43b,
      [
        s.width + offset,
        0.2,
        s.shape === "circle"
          ? 0
          : -Math.max(s.height, s.shape === "square" ? s.width : 0),
      ],
      { emissive: 0x554400 },
    );
    handle.userData.drag = {
      flat: true,
      move: (p) => {
        onChange("width", Math.max(1, Math.min(8, Math.round(p.x - offset))));
        if (!["circle", "square"].includes(s.shape))
          onChange("height", Math.max(1, Math.min(8, Math.round(-p.z))));
      },
    };
    label(root, s.shape === "circle" ? "r = " + s.width : s.width + " units", [
      offset + s.width / 2,
      0.3,
      1,
    ]);
    if (s.derive) {
      const g = new THREE.Group();
      root.add(g);
      derived = g;
      if (s.shape === "circle") {
        const count = 16,
          angle = (2 * Math.PI) / count;
        const chord = 2 * s.width * Math.sin(angle / 2);
        for (let i = 0; i < count; i++) {
          const sector = new THREE.Shape();
          sector.moveTo(0, 0);
          sector.absarc(0, 0, s.width, -angle / 2, angle / 2, false);
          sector.lineTo(0, 0);
          const geo = new THREE.ShapeGeometry(sector, 12);
          geo.rotateX(-Math.PI / 2);
          const part = mesh(g, geo, i % 2 ? 0xffd43b : 0x00b5a0, [0, 0.15, 0], {
            side: THREE.DoubleSide,
          });
          const start = -i * angle;
          const end = i % 2 ? -Math.PI / 2 : Math.PI / 2;
          const turn = Math.atan2(Math.sin(end - start), Math.cos(end - start));
          pieces.push({
            part,
            x: (i / 2 - count / 4) * chord,
            z: i % 2 ? -s.width * Math.cos(angle / 2) : 0,
            start,
            turn,
          });
        }
        label(g, "base ≈ πr; height ≈ r", [0, 0.8, 2]);
      } else if (s.shape === "parallelogram") {
        // Cut into vertical strips and translate each whole strip by base multiples.
        // This also works when the slant is greater than the base.
        const clip = (poly, edge, greater) => {
          const output = [];
          for (let i = 0; i < poly.length; i++) {
            const a = poly[i],
              b = poly[(i + 1) % poly.length];
            const ain = greater ? a.x >= edge : a.x <= edge;
            const bin = greater ? b.x >= edge : b.x <= edge;
            if (ain) output.push(a);
            if (ain !== bin)
              output.push({
                x: edge,
                y: a.y + ((b.y - a.y) * (edge - a.x)) / (b.x - a.x),
              });
          }
          return output;
        };
        for (let k = 0; k <= Math.ceil(s.slant / s.width); k++) {
          const poly = clip(
            clip(points, k * s.width, true),
            (k + 1) * s.width,
            false,
          );
          if (poly.length < 3) continue;
          const geo = new THREE.ShapeGeometry(
            new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, p.y))),
          );
          geo.rotateX(-Math.PI / 2);
          const part = mesh(
            g,
            geo,
            k % 2 ? 0xffd43b : 0x00b5a0,
            [offset, 0.15, 0],
            { side: THREE.DoubleSide },
          );
          pieces.push({
            part,
            origin: offset,
            x: offset - k * s.width,
            z: 0,
            start: 0,
            turn: 0,
          });
        }
        label(g, "base × height", [0, 0.8, 2]);
      }
      shapeMesh.visible = pieces.length === 0;
    } else derived = null;
    stage.controls.target.set(0, 0, -s.height / 2);
  };
  update();
  stage.tick = (dt) => {
    if (derived) {
      progress = Math.min(1, progress + dt);
      const p = stage.reduced ? 1 : progress * progress * (3 - 2 * progress);
      for (const item of pieces) {
        item.part.position.x =
          (item.origin || 0) + (item.x - (item.origin || 0)) * p;
        item.part.position.z = item.z * p;
        item.part.rotation.y = item.start + item.turn * p;
      }
    }
  };
  return { update };
}
