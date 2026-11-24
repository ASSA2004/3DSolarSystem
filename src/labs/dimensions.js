import { THREE, mesh, line, label } from "./stage.js";
import { shape2D } from "../engine/measurement.ts";
import { dimensionPosition } from "../engine/dimensions.ts";
export const dimensionViews = [
  {
    id: "flat",
    label: "2D · XY",
    description:
      "Move the shape in X and Y. Depth is zero and the camera stays perpendicular to the XY plane. A square is a face, not a solid cube.",
  },
  {
    id: "spatial",
    label: "3D · XYZ",
    description:
      "The same shape gains depth. Drag in X/Y, change Z to move toward or away from you, and orbit to inspect its sides. This screen shows a projection of the solid.",
  },
  {
    id: "measure",
    label: "Measurements",
    description:
      "Explore area, surface area and volume with the existing measurement tools.",
  },
];
export const dimensionControls = [
  { key: "x", label: "Move X", min: -5, max: 5, step: 0.25, unit: "units" },
  { key: "y", label: "Move Y", min: -5, max: 5, step: 0.25, unit: "units" },
  {
    key: "z",
    label: "Move Z · depth",
    min: -5,
    max: 5,
    step: 0.25,
    unit: "units",
  },
  {
    key: "angle",
    label: "Rotate in XY",
    min: -180,
    max: 180,
    step: 5,
    unit: "°",
  },
];
export function dimensionScene(stage, s, change, solidRoute = false) {
  const resetCamera = () => {
    const flat = s.view === "flat";
    stage.camera.position.set(flat ? 0 : 13, flat ? 0 : 9, flat ? 24 : 18);
    stage.controls.target.set(0, 0, 0);
    stage.controls.enableRotate = !flat;
    stage.controls.update();
  };
  const update = () => {
    stage.clear();
    const root = stage.content,
      spatial = s.view === "spatial",
      p = dimensionPosition(s.x, s.y, s.z, spatial);
    const grid = new THREE.GridHelper(20, 20, 0x78958c, 0xb3c4b8);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    root.add(grid);
    line(
      root,
      [
        [-9, 0, 0],
        [9, 0, 0],
      ],
      0xc2573d,
    );
    line(
      root,
      [
        [0, -9, 0],
        [0, 9, 0],
      ],
      0x008578,
    );
    label(root, "X", [9, 0, 0]);
    label(root, "Y", [0, 8, 0]);
    if (spatial) {
      line(
        root,
        [
          [0, 0, -7],
          [0, 0, 7],
        ],
        0x4d7bbe,
      );
      label(root, "Z", [0, 0, 7]);
    }
    let shape = s.shape;
    if (solidRoute)
      shape =
        shape === "sphere" || shape === "cylinder"
          ? "circle"
          : shape === "cone"
            ? "triangle"
            : shape === "cube"
              ? "square"
              : "rectangle";
    const r = shape2D(shape, s.width, s.height, s.slant || 0);
    let face;
    if (shape === "circle") {
      face = new THREE.Shape();
      face.absarc(0, 0, s.width, 0, Math.PI * 2, false);
    } else
      face = new THREE.Shape(
        r.points.map(
          (v) =>
            new THREE.Vector2(
              v.x - s.width / 2,
              v.y - (shape === "square" ? s.width : s.height) / 2,
            ),
        ),
      );
    const depth =
      s.shape === "cube" || shape === "square" ? s.width : s.depth || 3;
    let geo = spatial
      ? new THREE.ExtrudeGeometry(face, { depth, bevelEnabled: false })
      : new THREE.ShapeGeometry(face);
    if (spatial) geo.translate(0, 0, -depth / 2);
    if (
      spatial &&
      solidRoute &&
      ["sphere", "cone", "cylinder"].includes(s.shape)
    ) {
      geo.dispose();
      geo =
        s.shape === "sphere"
          ? new THREE.SphereGeometry(s.width, 32, 24)
          : s.shape === "cone"
            ? new THREE.ConeGeometry(s.width, s.height, 32)
            : new THREE.CylinderGeometry(s.width, s.width, s.height, 32);
    }
    const object = mesh(
      root,
      geo,
      spatial ? 0x8b78c7 : 0x009d89,
      [p.x, p.y, p.z],
      { side: THREE.DoubleSide, roughness: 0.4 },
    );
    object.rotation.z = (s.angle * Math.PI) / 180;
    object.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x254c55 }),
      ),
    );
    object.userData.drag = {
      planeOffset: p.z,
      origin: new THREE.Vector3(p.x, p.y, p.z),
      move: (point) => {
        change("x", Math.max(-5, Math.min(5, Math.round(point.x * 4) / 4)));
        change("y", Math.max(-5, Math.min(5, Math.round(point.y * 4) / 4)));
      },
    };
    label(
      root,
      spatial ? "Drag X/Y · move Z with the slider" : "Drag X/Y · Z = 0",
      [0, -7, 0],
    );
  };
  update();
  resetCamera();
  stage.tick = () => {};
  return { update, resetCamera };
}
export function mountDimensionAdapter(
  stage,
  s,
  change,
  notify,
  measurement,
  solidRoute = false,
) {
  if (!stage) return measurement(stage, s, change, notify);
  let child, previous;
  const update = () => {
    if (previous !== s.view) {
      child?.dispose?.();
      stage.clear();
      stage.controls.enableRotate = true;
      child =
        s.view === "measure"
          ? measurement(stage, s, change, notify)
          : dimensionScene(stage, s, change, solidRoute);
      previous = s.view;
    } else child.update();
  };
  update();
  return {
    update,
    resetCamera() {
      child.resetCamera?.();
    },
    dispose() {
      child.dispose?.();
    },
  };
}
