import { THREE, mesh, line, label } from "./stage.js";
import { optics } from "../engine/optics.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  element: "convex-lens",
  distance: 30,
  focal: 10,
  position: 0,
};
export const controls = [
  {
    key: "element",
    label: "element",
    options: ["convex-lens", "concave-lens", "concave-mirror", "convex-mirror"],
  },
  { key: "distance", label: "object", min: 2, max: 50, step: 1, unit: "cm" },
  { key: "focal", label: "focal", min: 5, max: 15, step: 1, unit: "cm" },
  {
    key: "position",
    label: "position",
    min: -12,
    max: 12,
    step: 1,
    unit: "cm",
  },
];
export const tools = [{ key: "top", label: "top" }];
export function result(s) {
  const r = optics(s.element, s.distance, s.focal);
  return {
    rows: [
      ["u", r.u + " cm"],
      ["v", r.v === null ? "∞" : r.v.toFixed(2) + " cm"],
      ["m", r.m === null ? "—" : r.m.toFixed(2) + "×"],
    ],
    answer: r.infinity ? 2 : r.real ? 0 : 1,
    explanation: r.infinity
      ? t("infinity")
      : `${t(r.real ? "real" : "virtual")}, ${t(r.upright ? "upright" : "inverted")}; ${Math.abs(r.m).toFixed(2)}×.`,
    detail:
      t("signed") +
      " " +
      t(s.element.endsWith("mirror") ? "mirrorFormula" : "lensFormula"),
  };
}
export function achieved(s, target) {
  return (
    s.element === "convex-lens" &&
    (target === "beyond"
      ? s.distance > 2 * s.focal
      : target === "between"
        ? s.distance > s.focal && s.distance < 2 * s.focal
        : s.distance < s.focal)
  );
}
export function create(stage, s, change) {
  if (!stage) return { update() {} };
  let beam,
    clock = 0;
  stage.camera.position.set(0, 7, 29);
  stage.controls.target.set(0, 2, 0);
  const update = () => {
    stage.clear();
    const root = stage.content;
    const r = optics(s.element, s.distance, s.focal);
    const x = s.position * 0.25,
      u = x + r.u * 0.25;
    const mirror = s.element.endsWith("mirror");
    mesh(root, new THREE.BoxGeometry(28, 0.24, 3), 0x415968, [0, -2.4, 0]);
    line(
      root,
      [
        [-14, 0, 0],
        [14, 0, 0],
      ],
      0x819895,
    );
    for (let n = -50; n <= 50; n += 5)
      line(
        root,
        [
          [n * 0.25, -0.16, 1.4],
          [n * 0.25, -0.16, 1.1],
        ],
        0xb2c6c2,
      );
    const candle = mesh(
      root,
      new THREE.CylinderGeometry(0.18, 0.2, 1.5, 16),
      0xf8e8b4,
      [u, 0.75, 0],
    );
    mesh(root, new THREE.SphereGeometry(0.23, 12, 8), 0xffac35, [u, 1.65, 0], {
      emissive: 0xff8f20,
      emissiveIntensity: 2,
    });
    candle.userData.drag = {
      move: (p) =>
        change(
          "distance",
          Math.max(2, Math.min(50, Math.round((x - p.x) * 4))),
        ),
    };
    label(root, t("objectLabel"), [u, 2.5, 0]);
    const profile = [];
    for (let i = 0; i <= 24; i++) {
      const radius = (2 * i) / 24;
      const thickness =
        s.element === "convex-lens"
          ? 0.12 + 0.4 * Math.sqrt(1 - (radius / 2) ** 2)
          : 0.12 + 0.12 * radius * radius;
      profile.push(new THREE.Vector2(radius, thickness));
    }
    for (let i = 24; i >= 0; i--) {
      const radius = (2 * i) / 24;
      const thickness =
        s.element === "convex-lens"
          ? 0.12 + 0.4 * Math.sqrt(1 - (radius / 2) ** 2)
          : 0.12 + 0.12 * radius * radius;
      profile.push(new THREE.Vector2(radius, -thickness));
    }
    let element;
    if (mirror) {
      const g = new THREE.SphereGeometry(4, 32, 20, 0, Math.PI * 2, 0, 0.52);
      element = mesh(root, g, 0xc5d8e4, [x, 0, 0], {
        metalness: 0.95,
        roughness: 0.1,
        side: THREE.DoubleSide,
      });
      element.rotation.z =
        s.element === "concave-mirror" ? Math.PI / 2 : -Math.PI / 2;
      element.position.x += s.element === "concave-mirror" ? 4 : -4;
    } else {
      element = mesh(
        root,
        new THREE.LatheGeometry(profile, 32),
        0x88d8e1,
        [x, 0, 0],
        { transparent: true, opacity: 0.46, side: THREE.DoubleSide },
      );
      element.rotation.z = Math.PI / 2;
    }
    const handle = mesh(
      root,
      new THREE.SphereGeometry(0.38, 16, 12),
      0xecaf35,
      [x, 0.05, 1.6],
    );
    handle.userData.drag = {
      move: (p) =>
        change("position", Math.max(-12, Math.min(12, Math.round(p.x * 4)))),
    };
    mesh(root, new THREE.BoxGeometry(0.18, 2, 0.18), 0x809798, [x, 0.8, 0]);
    for (const sign of [-1, 1])
      for (const factor of [1, 2]) {
        const fx = x + sign * factor * s.focal * 0.25;
        line(
          root,
          [
            [fx, -0.1, 0],
            [fx, 0.25, 0],
          ],
          0xd99d2b,
        );
        label(root, (factor === 2 ? "2" : "") + "F", [fx, -0.8, 0]);
      }
    const top = 1.65;
    const out = mirror ? -1 : 1;
    const end = x + out * 12;
    const v = r.v === null ? null : x + r.v * 0.25;
    const iy = r.m === null ? 0 : r.m * top;
    line(
      root,
      [
        [u, top, 0],
        [x, top, 0],
      ],
      0xf2a326,
    );
    line(
      root,
      [
        [u, top, 0],
        [x, 0, 0],
      ],
      0x00b5a0,
    );
    if (r.infinity) {
      line(
        root,
        [
          [x, top, 0],
          [end, top - (12 * top) / (s.focal * 0.25), 0],
        ],
        0xf2a326,
      );
      line(
        root,
        [
          [x, 0, 0],
          [end, (-12 * top) / (s.focal * 0.25), 0],
        ],
        0x00b5a0,
      );
    } else {
      const safeV = Math.max(-35, Math.min(35, v));
      const slope1 = (iy - top) / (v - x),
        slope2 = iy / (v - x);
      line(
        root,
        [
          [x, top, 0],
          [end, top + slope1 * (end - x), 0],
        ],
        0xf2a326,
      );
      line(
        root,
        [
          [x, 0, 0],
          [end, slope2 * (end - x), 0],
        ],
        0x00b5a0,
      );
      if (!r.real) {
        line(
          root,
          [
            [x, top, 0],
            [safeV, iy, 0],
          ],
          0xf2a326,
          true,
        );
        line(
          root,
          [
            [x, 0, 0],
            [safeV, iy, 0],
          ],
          0x00b5a0,
          true,
        );
      }
      if (Math.abs(v) < 14 && Math.abs(iy) < 10) {
        mesh(
          root,
          new THREE.CylinderGeometry(0.12, 0.12, Math.abs(iy), 12),
          r.real ? 0xeebd58 : 0x83b6c2,
          [v, iy / 2, 0],
          { transparent: !r.real, opacity: r.real ? 1 : 0.45 },
        );
        mesh(root, new THREE.SphereGeometry(0.18, 12, 8), 0xffab32, [v, iy, 0]);
        label(root, t("image"), [v, iy + (iy < 0 ? -0.6 : 0.6), 0]);
        if (r.real) {
          mesh(
            root,
            new THREE.PlaneGeometry(2, Math.max(4, Math.abs(iy) * 2 + 0.5)),
            0xe9eff0,
            [v, 0, -0.2],
            { transparent: true, opacity: 0.18, side: THREE.DoubleSide },
          ).rotation.y = Math.PI / 2;
        }
      }
    }
    beam = mesh(
      root,
      new THREE.SphereGeometry(0.07, 8, 6),
      0xffe789,
      [u, top, 0],
      { emissive: 0xffca30, emissiveIntensity: 2 },
    );
  };
  update();
  stage.tick = (dt) => {
    clock = (clock + dt * 0.6) % 1;
    if (beam && !stage.reduced) {
      beam.position.x = (s.position - s.distance + s.distance * clock) * 0.25;
    }
  };
  return { update };
}
