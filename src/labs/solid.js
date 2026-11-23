import { THREE, mesh, label } from "./stage.js";
import { solid3D, coneNet } from "../engine/measurement.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  shape: "cube",
  width: 3,
  height: 4,
  depth: 3,
  net: false,
  fill: false,
  heightChanged: false,
};
export const controls = [
  {
    key: "shape",
    label: "shape",
    options: ["cube", "cuboid", "cylinder", "cone", "sphere"],
  },
  { key: "width", label: "width", min: 1, max: 6, step: 0.5, unit: "units" },
  { key: "height", label: "height", min: 1, max: 8, step: 0.5, unit: "units" },
  { key: "depth", label: "depth", min: 1, max: 6, step: 0.5, unit: "units" },
];
export const tools = [
  { key: "net", label: "net" },
  { key: "fill", label: "fill" },
];
export function change(s, key, value) {
  if (key === "net" || key === "fill") {
    s[key] = !s[key];
    if (s[key]) s[key === "net" ? "fill" : "net"] = false;
  } else {
    s[key] = value;
    if (key === "height") s.heightChanged = true;
  }
}
export function result(s) {
  const r = solid3D(s.shape, s.width, s.height, s.depth);
  return {
    rows: [
      [t("volume"), r.volume.toFixed(2) + " units³"],
      [t("total"), r.total.toFixed(2) + " units²"],
      [t("curved"), r.curved.toFixed(2) + " units²"],
    ],
    answer: 0,
    explanation:
      s.shape === "sphere"
        ? t("sphereNet")
        : "For the same radius and height, cone volume = cylinder volume ÷ 3. Surface area measures the covering; volume measures the space inside.",
    detail:
      s.shape === "sphere"
        ? t("sphereNet")
        : s.shape === "cone"
          ? "Cone net: a sector of radius √(r²+h²), with angle 2πr/√(r²+h²), plus a circular base."
          : s.shape === "cylinder"
            ? "Cylinder net: a rectangle 2πr × h and two circles of radius r."
            : "Box net: six rectangles, in three equal pairs.",
  };
}
export function achieved(s, target) {
  return target === "fill"
    ? s.shape === "cube" && s.fill
    : target === "net"
      ? s.shape === "cuboid" && s.net
      : s.shape === "cone" && s.heightChanged;
}
export function create(stage, s, onChange) {
  if (!stage) return { update() {} };
  let transition = 0,
    solid,
    netGroup,
    water,
    hinges = [];
  const update = () => {
    stage.clear();
    transition = stage.reduced ? 1 : 0;
    hinges = [];
    const root = stage.content;
    const w = s.width,
      h = s.shape === "cube" ? w : s.height,
      d = s.shape === "cube" ? w : s.depth;
    root.add(new THREE.GridHelper(30, 30, 0x857ba9, 0xadb5c8));
    let geo;
    if (s.shape === "sphere") geo = new THREE.SphereGeometry(w, 32, 24);
    else if (s.shape === "cylinder")
      geo = new THREE.CylinderGeometry(w, w, h, 32);
    else if (s.shape === "cone") geo = new THREE.ConeGeometry(w, h, 32);
    else geo = new THREE.BoxGeometry(w, h, d);
    const centre = s.shape === "sphere" ? w : h / 2;
    solid = mesh(root, geo, 0xa78bfa, [0, centre, 0], {
      transparent: true,
      opacity: s.fill ? 0.22 : 0.8,
      side: THREE.DoubleSide,
    });
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x7c65bd }),
    );
    solid.add(edges);
    netGroup = new THREE.Group();
    root.add(netGroup);
    if (s.net) {
      if (s.shape === "cube" || s.shape === "cuboid") {
        solid.visible = false;
        mesh(netGroup, new THREE.PlaneGeometry(w, d), 0xb79bea).rotation.x =
          -Math.PI / 2;
        const face = (width, height, pos, axis, sign) => {
          const pivot = new THREE.Group();
          pivot.position.set(...pos);
          netGroup.add(pivot);
          mesh(
            pivot,
            new THREE.PlaneGeometry(width, height),
            0xb79bea,
            [0, height / 2, 0],
            { side: THREE.DoubleSide },
          );
          hinges.push({ pivot, axis, sign });
          return pivot;
        };
        face(w, h, [0, 0, d / 2], "x", 1);
        const back = face(w, h, [0, 0, -d / 2], "x", -1);
        const lid = new THREE.Group();
        lid.position.y = h;
        back.add(lid);
        mesh(lid, new THREE.PlaneGeometry(w, d), 0xc9b1f1, [0, d / 2, 0], {
          side: THREE.DoubleSide,
        });
        hinges.push({ pivot: lid, axis: "x", sign: -1, lid: true });
        const left = face(d, h, [-w / 2, 0, 0], "z", 1);
        left.children[0].rotation.y = Math.PI / 2;
        const right = face(d, h, [w / 2, 0, 0], "z", -1);
        right.children[0].rotation.y = Math.PI / 2;
      } else if (s.shape === "cylinder") {
        mesh(
          netGroup,
          new THREE.PlaneGeometry(2 * Math.PI * w, h),
          0xb79bea,
          [0, 0.1, 0],
          { side: THREE.DoubleSide },
        ).rotation.x = -Math.PI / 2;
        for (const z of [-h / 2 - w, h / 2 + w])
          mesh(
            netGroup,
            new THREE.CircleGeometry(w, 48),
            0xd5bcf3,
            [0, 0.1, z],
            { side: THREE.DoubleSide },
          ).rotation.x = -Math.PI / 2;
      } else if (s.shape === "cone") {
        const n = coneNet(w, h);
        mesh(
          netGroup,
          new THREE.CircleGeometry(n.slant, 64, 0, n.angle),
          0xb79bea,
          [0, 0.1, 0],
          { side: THREE.DoubleSide },
        ).rotation.x = -Math.PI / 2;
        mesh(
          netGroup,
          new THREE.CircleGeometry(w, 48),
          0xd5bcf3,
          [-w - 1, 0.1, 0],
          { side: THREE.DoubleSide },
        ).rotation.x = -Math.PI / 2;
      } else {
        for (let i = 0; i < 12; i++) {
          const points = [];
          for (let j = 0; j <= 24; j++) {
            const latitude = -Math.PI / 2 + (j / 24) * Math.PI;
            points.push(
              new THREE.Vector2(
                (Math.cos(latitude) * Math.PI * w) / 12,
                latitude * w,
              ),
            );
          }
          for (let j = 24; j >= 0; j--) {
            const latitude = -Math.PI / 2 + (j / 24) * Math.PI;
            points.push(
              new THREE.Vector2(
                (-Math.cos(latitude) * Math.PI * w) / 12,
                latitude * w,
              ),
            );
          }
          const geo = new THREE.ShapeGeometry(new THREE.Shape(points));
          geo.rotateX(-Math.PI / 2);
          mesh(
            netGroup,
            geo,
            0xb79bea,
            [((i - 5.5) * Math.PI * w) / 6, 0.1, 0],
            { side: THREE.DoubleSide },
          );
        }
        label(netGroup, "Approximate gores — not an exact net", [0, 1, 7]);
      }
    }
    water = null;
    if (s.fill) {
      const fillMat = new THREE.MeshStandardMaterial({
        color: 0x2daed1,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)],
      });
      water = new THREE.Mesh(geo.clone(), fillMat);
      water.position.copy(solid.position);
      water.scale.setScalar(0.99);
      root.add(water);
      stage.renderer.localClippingEnabled = true;
    }
    const handle = mesh(
      root,
      new THREE.SphereGeometry(0.25, 16, 12),
      0xffd43b,
      [w, centre, 0],
    );
    handle.userData.drag = {
      move: (p) =>
        onChange(
          "width",
          Math.max(1, Math.min(6, Math.round(Math.abs(p.x) * 2) / 2)),
        ),
    };
    stage.controls.target.set(0, Math.min(3, centre), 0);
  };
  update();
  stage.tick = (dt) => {
    transition = Math.min(1, transition + dt * 0.65);
    if (s.net) {
      for (const { pivot, axis, sign, lid } of hinges)
        pivot.rotation[axis] = lid
          ? Math.PI / 2 - (transition * Math.PI) / 2
          : ((transition * Math.PI) / 2) * sign;
      if (!hinges.length) {
        solid.material.opacity = 0.8 * (1 - transition);
        netGroup.scale.setScalar(Math.max(0.01, transition));
      }
    }
    if (water)
      water.material.clippingPlanes[0].constant =
        (s.shape === "sphere"
          ? 2 * s.width
          : s.shape === "cube"
            ? s.width
            : s.height) * transition;
  };
  return { update };
}
