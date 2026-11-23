import earthTexture from "../../textures/standard/2k_earth.webp";
import { Stage, THREE, mesh, line, label } from "../labs/stage.js";
import { labHues } from "../lab-ui/tokens.js";
export function createUniverse(mount, labs, onSelect, selected) {
  const stage = new Stage(mount);
  stage.camera.position.set(0, 18, 26);
  stage.controls.target.set(0, 0, 0);
  stage.controls.enablePan = false;
  stage.controls.minDistance = 14;
  stage.controls.maxDistance = 48;
  let paused = false,
    focus = selected,
    hover = null,
    tween = null,
    time = 0;
  const bodies = [];
  const root = stage.content;
  const emblemTexture = new THREE.TextureLoader().load(
    import.meta.env.BASE_URL + "logo.svg",
  );
  const emblem = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: emblemTexture, depthTest: false }),
  );
  emblem.scale.set(2.8, 2.8, 1);
  emblem.position.set(0, 0.3, 0);
  emblem.renderOrder = 3;
  root.add(emblem);
  const sun = mesh(
    root,
    new THREE.SphereGeometry(1.25, 32, 24),
    0xffd43b,
    [0, 0, 0],
    { emissive: 0xf9b42a, emissiveIntensity: 0.55, roughness: 0.45 },
  );
  const halo = mesh(root, new THREE.TorusGeometry(1.8, 0.025, 6, 80), 0x00b5a0);
  halo.rotation.x = Math.PI / 3;
  halo.rotation.z = -0.5;
  mesh(root, new THREE.SphereGeometry(0.18, 12, 8), 0x00b5a0, [0, 0, 1.28]);
  label(root, "Prayog", [0, 2, 0]);
  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i],
      radius = 4 + i * 1.4,
      angle = (i / 5) * Math.PI * 2 + 0.3;
    const group = new THREE.Group();
    root.add(group);
    const geometry =
      lab.id === "solid"
        ? new THREE.IcosahedronGeometry(0.9, 1)
        : new THREE.SphereGeometry(0.8, stage.low ? 20 : 32, 20);
    const planet = mesh(group, geometry, labHues[lab.id], [0, 0, 0], {
      roughness: lab.id === "optics" ? 0.08 : 0.45,
      metalness: lab.id === "optics" ? 0.5 : 0.12,
      transparent: lab.id === "optics",
      opacity: lab.id === "optics" ? 0.8 : 1,
    });
    planet.userData.lab = lab.id;
    if (lab.id === "solar") {
      const texture = new THREE.TextureLoader().load(earthTexture);
      texture.colorSpace = THREE.SRGBColorSpace;
      planet.material.map = texture;
      planet.material.color.set(0xffffff);
    }
    if (lab.id === "plane") {
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.SphereGeometry(0.81, 12, 8)),
        new THREE.LineBasicMaterial({
          color: 0xb8fff0,
          transparent: true,
          opacity: 0.6,
        }),
      );
      planet.add(wire);
    }
    if (lab.id === "matter")
      mesh(
        group,
        new THREE.SphereGeometry(0.38, 12, 8),
        0xc2e7f3,
        [0.45, 0.35, 0.4],
        { roughness: 0.2 },
      );
    const ring = mesh(
      group,
      new THREE.TorusGeometry(1.13, 0.018, 6, 60),
      labHues[lab.id],
    );
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    label(group, lab.title, [0, 1.5, 0]);
    const points = [];
    for (let j = 0; j <= 100; j++) {
      const a = (j / 100) * Math.PI * 2;
      points.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    line(root, points, 0x748f88);
    bodies.push({ lab, group, planet, ring, radius, angle });
  }
  const stars = new THREE.BufferGeometry();
  const coords = [];
  for (let i = 0; i < (stage.low ? 180 : 450); i++) {
    const a = i * 2.39996,
      r = 18 + Math.sqrt(i) * 0.8;
    coords.push(Math.cos(a) * r, ((i % 13) - 6) * 0.6, Math.sin(a) * r);
  }
  stars.setAttribute("position", new THREE.Float32BufferAttribute(coords, 3));
  const field = new THREE.Points(
    stars,
    new THREE.PointsMaterial({ color: 0x839aaf, size: 0.06 }),
  );
  root.add(field);
  stage.onLow = () => stars.setDrawRange(0, 100);
  stage.hover = (hits) => {
    hover =
      hits.find((h) => h.object.userData.lab)?.object.userData.lab || null;
    stage.renderer.domElement.style.cursor = hover ? "pointer" : "grab";
  };
  let start;
  stage.renderer.domElement.addEventListener(
    "pointerdown",
    (e) => {
      start = { x: e.clientX, y: e.clientY };
    },
    { signal: stage.abort.signal },
  );
  stage.renderer.domElement.addEventListener(
    "pointerup",
    (e) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) {
        const hit = stage.ray
          .intersectObjects(root.children, true)
          .find((h) => h.object.userData.lab);
        if (hit) onSelect(hit.object.userData.lab);
      }
      start = null;
    },
    { signal: stage.abort.signal },
  );
  stage.tick = (dt) => {
    time += dt;
    for (const b of bodies) {
      if (!paused && b.lab.id !== hover && b.lab.id !== focus)
        b.angle += (dt * 0.025) / (1 + b.radius * 0.05);
      b.group.position.set(
        Math.cos(b.angle) * b.radius,
        Math.sin(b.angle) * 0.25,
        Math.sin(b.angle) * b.radius * 0.7,
      );
      const active = b.lab.id === (hover || focus);
      b.planet.scale.lerp(
        new THREE.Vector3().setScalar(active ? 1.17 : 1),
        0.1,
      );
      b.ring.visible = active;
      if (!paused) b.planet.rotation.y += dt * 0.12;
    }
    sun.rotation.y += paused ? 0 : dt * 0.08;
    field.rotation.y = Math.sin(time * 0.05) * 0.01;
    if (tween) {
      tween.elapsed += dt;
      const p = Math.min(1, tween.elapsed / tween.duration),
        ease = p * p * (3 - 2 * p);
      stage.camera.position.lerpVectors(tween.from, tween.to, ease);
      stage.controls.target.lerpVectors(tween.targetFrom, tween.target, ease);
      if (p === 1) {
        tween.resolve?.();
        tween = null;
      }
    }
  };
  return {
    select(id) {
      focus = id;
      const b = bodies.find((b) => b.lab.id === id);
      if (b)
        tween = {
          elapsed: 0,
          duration: 0.7,
          from: stage.camera.position.clone(),
          to: b.group.position
            .clone()
            .multiplyScalar(0.25)
            .add(new THREE.Vector3(0, 14, 23)),
          targetFrom: stage.controls.target.clone(),
          target: b.group.position.clone().multiplyScalar(0.3),
        };
    },
    pause() {
      paused = !paused;
      return paused;
    },
    dive(id) {
      const b = bodies.find((b) => b.lab.id === id);
      if (!b) return Promise.resolve();
      focus = id;
      return new Promise((resolve) => {
        tween = {
          elapsed: 0,
          duration: 0.65,
          from: stage.camera.position.clone(),
          to: b.group.position.clone().add(new THREE.Vector3(0, 1, 3)),
          targetFrom: stage.controls.target.clone(),
          target: b.group.position.clone(),
          resolve,
        };
      });
    },
    dispose() {
      tween?.resolve?.();
      stage.dispose();
    },
  };
}
