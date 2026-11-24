import { Reflector } from "three/addons/objects/Reflector.js";
import { THREE, mesh, line, label } from "./stage.js";
import {
  tracePrism,
  reflect,
  intersection,
  waveInMedium,
} from "../engine/rays.ts";
import { optics } from "../engine/optics.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  element: "convex-lens",
  view: "human",
  angle: 0,
  index: 1.5,
  wavelength: 550,
  distance: 30,
  focal: 10,
  position: 0,
};
export const views = [
  {
    id: "human",
    label: "Human view",
    description:
      "Observe the object and its image. Rays are hidden: their paths are not normally visible in clean air. The screen shows the calculated real image; virtual images are marked as schematic apparent views. Glass shading is illustrative, not a full optical ray-traced camera.",
  },
  {
    id: "rays",
    label: "Ray view",
    description:
      "Lines show propagation. Dashed extensions locate virtual images. Lenses use the paraxial thin-lens model; the prism uses Snell’s law at each surface.",
  },
  {
    id: "waves",
    label: "Wave view",
    description:
      "Moving marks show equal-phase wavefronts, not particles. In glass, speed and wavelength decrease by n while frequency stays unchanged. Optical time is greatly slowed.",
  },
];
export const controls = [
  {
    key: "angle",
    label: "Surface rotation",
    min: -45,
    max: 45,
    step: 1,
    unit: "°",
  },
  {
    key: "index",
    label: "Prism refractive index",
    min: 1.1,
    max: 1.8,
    step: 0.05,
    unit: "",
  },
  {
    key: "wavelength",
    label: "Light wavelength",
    min: 400,
    max: 700,
    step: 10,
    unit: "nm",
  },
  {
    key: "element",
    label: "element",
    options: [
      "convex-lens",
      "concave-lens",
      "prism",
      "plane-mirror",
      "concave-mirror",
      "convex-mirror",
    ],
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
export function change(s, key, value) {
  const minimum = s.element === "prism" ? 16 : 2;
  if (key === "position") {
    // Move the optical element while the source stays fixed on the bench.
    const next = Math.max(
      s.position + minimum - s.distance,
      Math.min(s.position + 50 - s.distance, value),
    );
    s.distance += next - s.position;
    s.position = next;
  } else s[key] = value;
  // Keep the source outside every orientation of the finite prism.
  if (s.element === "prism") s.distance = Math.max(16, s.distance);
}
export function question(s) {
  if (s.element === "prism")
    return {
      prediction:
        "Light enters glass from air at an angle. Which way does it bend?",
      predictions: [
        "Toward the surface normal",
        "Away from the surface normal",
        "It never changes direction",
      ],
    };
  if (s.element === "plane-mirror")
    return {
      prediction: "How do the incident and reflected angles compare?",
      predictions: [
        "They are equal, measured from the normal",
        "The reflected angle is always twice as large",
        "Reflection has no relation to the surface",
      ],
    };
  return null;
}
export function result(s) {
  if (["prism", "plane-mirror"].includes(s.element)) {
    const w = waveInMedium(s.wavelength, s.element === "prism" ? s.index : 1);
    return {
      rows: [
        ["Rotation", s.angle + "°"],
        ["Wavelength in material", w.wavelengthNm.toFixed(1) + " nm"],
        ["Light speed", (w.speed / 1e6).toFixed(1) + " × 10⁶ m/s"],
      ],
      answer: 0,
      explanation:
        s.element === "prism"
          ? "Each prism face bends the ray according to n₁ sin θ₁ = n₂ sin θ₂. At a steep internal angle it reflects instead of exiting."
          : "The reflected angle equals the incident angle, measured from the surface normal. The apparent image lies the same perpendicular distance behind the mirror.",
      detail:
        "Ideal homogeneous prism; no absorption, dispersion or partial Fresnel reflection. Wavefront spacing is illustrative and scaled; frequency is conserved. Plane mirror uses exact specular geometry.",
    };
  }
  const r = optics(s.element, s.distance, s.focal);
  return {
    rows: [
      ["Object distance", Math.abs(r.u) + " cm"],
      ["Image distance", r.v === null ? "∞" : Math.abs(r.v).toFixed(2) + " cm"],
      ["Image size", r.m === null ? "—" : Math.abs(r.m).toFixed(2) + "×"],
      [
        "Image type",
        r.infinity
          ? "At infinity"
          : `${t(r.real ? "real" : "virtual")} · ${t(r.upright ? "upright" : "inverted")}`,
      ],
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
    clock = 0,
    rayPaths = [],
    waveMarks = [],
    lastView = "";
  stage.camera.position.set(0, 7, 29);
  stage.controls.target.set(0, 2, 0);
  const update = () => {
    stage.clear();
    const root = stage.content;
    beam = null;
    rayPaths = [];
    waveMarks = [];
    if (["prism", "plane-mirror"].includes(s.element)) {
      buildSurface();
      return;
    }
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
    mesh(root, new THREE.CylinderGeometry(0.12, 0.12, 2.3, 12), 0x809798, [
      u,
      -1.15,
      0,
    ]);
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
      if (s.view === "human") {
        element.material.dispose();
        element.material = new THREE.MeshPhysicalMaterial({
          color: 0xe6f6ff,
          transmission: 0.94,
          thickness: 0.5,
          roughness: 0.06,
          ior: 1.5,
          side: THREE.DoubleSide,
        });
      }
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
    mesh(root, new THREE.BoxGeometry(0.18, 2.3, 0.18), 0x809798, [x, -1.15, 0]);
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
        if (s.view === "human") {
          // The image is light on a screen (real), or an apparent view (virtual),
          // never a second physical candle placed at the image position.
          const height = Math.max(4, Math.abs(iy) * 2 + 0.5);
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          if (r.real) {
            ctx.fillStyle = "#edf0e7";
            ctx.fillRect(0, 0, 256, 512);
          }
          const tip = 256 - (iy / height) * 512;
          ctx.fillStyle = "#d5ac48";
          ctx.fillRect(119, Math.min(256, tip), 18, Math.abs(tip - 256));
          ctx.fillStyle = "#ee8d12";
          ctx.beginPath();
          ctx.ellipse(128, tip, 12, 17, 0, 0, Math.PI * 2);
          ctx.fill();
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          const imagePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3, height),
            new THREE.MeshBasicMaterial({
              map: texture,
              transparent: !r.real,
              side: THREE.DoubleSide,
            }),
          );
          imagePlane.position.set(v, 0, 0);
          if (r.real) imagePlane.rotation.y = Math.PI / 2;
          root.add(imagePlane);
          label(
            root,
            r.real ? "Image on screen" : "Apparent image · schematic",
            [v, -height / 2 - 0.7, 0],
          );
        } else {
          mesh(
            root,
            new THREE.CylinderGeometry(0.12, 0.12, Math.abs(iy), 12),
            r.real ? 0xeebd58 : 0x83b6c2,
            [v, iy / 2, 0],
            { transparent: !r.real, opacity: r.real ? 1 : 0.45 },
          );
          mesh(root, new THREE.SphereGeometry(0.18, 12, 8), 0xffab32, [
            v,
            iy,
            0,
          ]);
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
    }
    beam = mesh(
      root,
      new THREE.SphereGeometry(0.07, 8, 6),
      0xffe789,
      [u, top, 0],
      { emissive: 0xffca30, emissiveIntensity: 2 },
    );
  };
  function buildSurface() {
    const root = stage.content,
      x = s.position * 0.25,
      angle = (s.angle * Math.PI) / 180;
    const rotate = (p) => ({
      x: x + p.x * Math.cos(angle) - p.y * Math.sin(angle),
      y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
    });
    mesh(root, new THREE.BoxGeometry(30, 0.2, 8), 0x415968, [0, -4.2, 0]);
    const origin = { x: x - s.distance * 0.25, y: 0 },
      direction = { x: 1, y: 0 };
    if (s.element === "plane-mirror") {
      mesh(root, new THREE.CylinderGeometry(0.28, 0.28, 2.2, 16), 0xf2dba0, [
        origin.x,
        -1.25,
        0,
      ]);
      mesh(
        root,
        new THREE.SphereGeometry(0.22, 16, 12),
        0xffb338,
        [origin.x, 0, 0],
        { emissive: 0xff9e20, emissiveIntensity: 1 },
      );
      mesh(root, new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12), 0x566773, [
        origin.x,
        -3.2,
        0,
      ]);
    } else {
      mesh(root, new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16), 0x38474d, [
        origin.x,
        0,
        0,
      ]).rotation.z = Math.PI / 2;
      mesh(root, new THREE.CylinderGeometry(0.1, 0.1, 4, 12), 0x566773, [
        origin.x,
        -2,
        0,
      ]);
    }
    let segments = [];
    if (s.element === "prism") {
      const vertices = [
        { x: -2, y: -3 },
        { x: 2, y: -3 },
        { x: 0, y: 3 },
      ].map(rotate);
      const shape = new THREE.Shape(
        vertices.map((p) => new THREE.Vector2(p.x, p.y)),
      );
      mesh(
        root,
        new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false }),
        0x8ed2e7,
        [0, 0, -1],
        { transparent: true, opacity: 0.35, side: THREE.DoubleSide },
      );
      segments = tracePrism(origin, direction, vertices, s.index);
    } else {
      const a = rotate({ x: 0, y: -3 }),
        b = rotate({ x: 0, y: 3 }),
        hit = intersection(origin, direction, a, b);
      if (s.view === "human") {
        const mirror = new Reflector(new THREE.PlaneGeometry(8, 6), {
          textureWidth: stage.low ? 256 : 512,
          textureHeight: stage.low ? 256 : 512,
          multisample: 0,
          color: 0xd7e4eb,
        });
        mirror.position.set(x, 0, 0);
        mirror.quaternion
          .setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle)
          .multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              -Math.PI / 2,
            ),
          );
        root.add(mirror);
        const frame = mesh(
          root,
          new THREE.BoxGeometry(0.2, 6.4, 8.4),
          0x516b78,
          [x + Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0],
        );
        frame.rotation.z = angle;
      } else {
        const mirror = mesh(
          root,
          new THREE.BoxGeometry(0.12, 6, 3),
          0xc8e1ed,
          [x, 0, 0],
          { metalness: 1, roughness: 0.05 },
        );
        mirror.rotation.z = angle;
      }
      if (hit) {
        const d = reflect(direction, hit.normal);
        segments = [
          { a: origin, b: hit.point, n: 1 },
          {
            a: hit.point,
            b: { x: hit.point.x + 18 * d.x, y: hit.point.y + 18 * d.y },
            n: 1,
          },
        ];
        const normal = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0),
          obj = new THREE.Vector3(origin.x - x, origin.y, 0),
          image = obj.clone().addScaledVector(normal, -2 * obj.dot(normal));
        if (s.view !== "human") {
          mesh(
            root,
            new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16),
            0x7794a1,
            [image.x + x, image.y, 0],
            { transparent: true, opacity: 0.35 },
          ).rotation.z = Math.PI / 2;
          label(root, "Apparent image", [image.x + x, image.y + 1, 0]);
        }
      }
    }
    for (const segment of segments) {
      const a = new THREE.Vector3(segment.a.x, segment.a.y, 0),
        b = new THREE.Vector3(segment.b.x, segment.b.y, 0);
      line(root, [a.toArray(), b.toArray()], 0xd78e14);
      rayPaths.push({
        a,
        b,
        n: segment.n,
        opticalOffset: rayPaths.reduce(
          (sum, p) => sum + p.a.distanceTo(p.b) * p.n,
          0,
        ),
      });
    }
    // A movable receiver is represented at the endpoint of the final outgoing ray.
    const last = segments.at(-1);
    if (last && s.element === "prism") {
      const dx = last.b.x - last.a.x,
        dy = last.b.y - last.a.y,
        len = Math.hypot(dx, dy),
        point = { x: last.a.x + (dx / len) * 7, y: last.a.y + (dy / len) * 7 };
      const screen = mesh(
        root,
        new THREE.PlaneGeometry(3, 3),
        0xe6edf0,
        [point.x, point.y, -0.15],
        { side: THREE.DoubleSide },
      );
      const normal = new THREE.Vector3(dx / len, dy / len, 0);
      screen.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      screen.position.set(point.x, point.y, 0);
      const spot = mesh(
        root,
        new THREE.CircleGeometry(0.16, 20),
        0xffd64a,
        [point.x, point.y, 0.01],
        { emissive: 0xffd64a, emissiveIntensity: 1 },
      );
      spot.quaternion.copy(screen.quaternion);
      spot.position.copy(screen.position).addScaledVector(normal, -0.02);
      label(root, "Light received", [point.x, point.y + 2, 0]);
    }
    const handle = mesh(root, new THREE.SphereGeometry(0.3, 12, 8), 0xe8aa35, [
      x,
      -3.5,
      0,
    ]);
    handle.userData.drag = {
      move: (p) =>
        change("position", Math.max(-12, Math.min(12, Math.round(p.x * 4)))),
    };
  }
  function displayView() {
    stage.content.traverse((o) => {
      if (o.isLine && !o.isLineSegments) {
        const attr = o.geometry.getAttribute("position");
        if (
          attr?.count === 2 &&
          !o.material.isLineDashedMaterial &&
          o.material.color?.getHex() !== 0x819895 &&
          o.material.color?.getHex() !== 0xb2c6c2 &&
          o.material.color?.getHex() !== 0xd99d2b
        ) {
          if (!["prism", "plane-mirror"].includes(s.element))
            rayPaths.push({
              a: new THREE.Vector3().fromBufferAttribute(attr, 0),
              b: new THREE.Vector3().fromBufferAttribute(attr, 1),
              n: 1,
            });
          o.visible = s.view !== "human";
        }
        if (o.material.isLineDashedMaterial) o.visible = s.view !== "human";
      }
    });
    if (s.view === "rays")
      for (const path of rayPaths) {
        const delta = path.b.clone().sub(path.a);
        if (delta.length() < 0.1) continue;
        const arrow = new THREE.ArrowHelper(
          delta.clone().normalize(),
          path.a.clone().lerp(path.b, 0.45),
          Math.min(0.8, delta.length() * 0.3),
          0xb97408,
          0.3,
          0.18,
        );
        stage.content.add(arrow);
      }
    if (s.view === "waves")
      for (const path of rayPaths)
        for (let i = 0; i < 18; i++) {
          const mark = line(
            stage.content,
            [
              [0, -0.22, 0],
              [0, 0.22, 0],
            ],
            0xb97408,
          );
          waveMarks.push({ mark, path, phase: i / 18 });
        }
    if (beam) beam.visible = s.view === "rays";
    if (lastView !== s.view + s.element) {
      lastView = s.view + s.element;
      resetCamera();
    }
  }
  function resetCamera() {
    stage.camera.position.set(
      s.view === "human" ? (s.element === "plane-mirror" ? -24 : 12) : 0,
      s.view === "human" ? 8 : 0,
      s.view === "human" && s.element === "plane-mirror" ? 14 : 32,
    );
    stage.controls.target.set(0, 0, 0);
    stage.controls.update();
  }
  const rebuild = () => {
    update();
    displayView();
  };
  rebuild();
  stage.tick = (dt) => {
    clock = (clock + dt * 0.6) % 1;
    for (const { mark, path, phase } of waveMarks) {
      const delta = path.b.clone().sub(path.a),
        length = delta.length(),
        spacing = ((s.wavelength / 550) * 1.1) / path.n,
        travel = stage.reduced ? 0 : clock * spacing;
      const offset =
        phase * 18 * spacing +
        travel -
        ((path.opticalOffset || 0) % (spacing * path.n)) / path.n;
      mark.visible = offset >= 0 && offset <= length;
      mark.position
        .copy(path.a)
        .addScaledVector(delta, offset / Math.max(length, 0.01));
      mark.rotation.z = Math.atan2(delta.y, delta.x);
    }
    if (beam && !stage.reduced) {
      beam.position.x = (s.position - s.distance + s.distance * clock) * 0.25;
    }
  };
  return { update: rebuild, resetCamera };
}
