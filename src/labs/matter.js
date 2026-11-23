import { THREE, mesh } from "./stage.js";
import { phaseFromEnergy, energyAtTemperature } from "../engine/matter.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  temperature: 20,
  energy: energyAtTemperature(20),
  heat: 0,
  heated: false,
};
export const controls = [
  {
    key: "temperature",
    label: "temperature",
    min: -20,
    max: 140,
    step: 1,
    unit: "°C",
  },
];
export const tools = [
  { key: "heat", label: "heat" },
  { key: "cool", label: "cool" },
  { key: "pause", label: "pause" },
  { key: "melting", label: "melting" },
  { key: "boiling", label: "boiling" },
];
export function change(s, key, value) {
  if (key === "temperature") {
    s.temperature = value;
    s.energy = energyAtTemperature(value);
    s.heat = 0;
  } else if (key === "heat") {
    s.heat = 70;
    s.heated = true;
  } else if (key === "cool") s.heat = -70;
  else if (key === "pause") s.heat = 0;
  else if (key === "melting") {
    s.energy = 30;
    s.temperature = 0;
    s.heat = 0;
  } else if (key === "boiling") {
    s.energy = 800;
    s.temperature = 100;
    s.heat = 0;
  }
}
export function result(s) {
  const p = phaseFromEnergy(s.energy);
  return {
    rows: [
      [t("temperature"), p.temperature.toFixed(1) + " °C"],
      [t("energy"), s.energy.toFixed(0) + " kJ/kg"],
      ["State", p.phase],
    ],
    answer: 0,
    explanation: p.plateau ? t("plateau") : t("warming"),
    detail:
      "Water at 1 atmosphere. Heat changes energy at an accelerated rate. Solid/liquid/gas proportions follow the enthalpy model.",
  };
}
export function achieved(s, target) {
  const p = phaseFromEnergy(s.energy);
  return target === "solid"
    ? p.solid === 1
    : target === "melting"
      ? p.phase === "melting" && s.heated
      : p.gas === 1;
}
export function extra(s) {
  const p = phaseFromEnergy(s.energy);
  const x = 25 + ((s.energy + 42) / 3130) * 270,
    y = 115 - ((p.temperature + 20) / 160) * 100;
  return `<svg class="curve" viewBox="0 0 320 145" role="img" aria-label="Heating curve: temperature stays flat during melting and boiling"><path d="M25 15V115H300" style="stroke:var(--lab-line)"/><path d="M25 115L29 102.5H57L93 40H288L300 15"/><circle cx="${x}" cy="${y}" r="4" fill="var(--lab-accent)"/><text x="2" y="18">°C</text><text x="25" y="134">Energy →</text><text x="32" y="96">0°C</text><text x="160" y="34">100°C</text></svg>`;
}
export function create(stage, s, _change, notify) {
  if (!stage) {
    const timer = setInterval(() => {
      if (!document.hidden && s.heat) {
        s.energy = Math.max(-42, Math.min(3088, s.energy + s.heat * 0.1));
        s.temperature = phaseFromEnergy(s.energy).temperature;
        notify();
      }
    }, 100);
    return {
      update() {},
      dispose() {
        clearInterval(timer);
      },
    };
  }
  const root = stage.content;
  stage.camera.position.set(13, 10, 15);
  stage.controls.target.set(0, 4, 0);
  const jar = mesh(
    root,
    new THREE.CylinderGeometry(4.2, 4.2, 8.5, 40, 1, true),
    0xa9d6e3,
    [0, 4.25, 0],
    {
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    },
  );
  jar.renderOrder = 2;
  mesh(
    root,
    new THREE.CylinderGeometry(4.3, 4.3, 0.15, 40),
    0x8dabae,
    [0, 0, 0],
  );
  const count = stage.low ? 96 : 180,
    g = new THREE.SphereGeometry(0.17, 12, 8),
    mat = new THREE.MeshStandardMaterial({ color: 0xff795e, roughness: 0.3 });
  const particles = new THREE.InstancedMesh(g, mat, count);
  root.add(particles);
  const a = [],
    v = [],
    anchors = [];
  let seed = 19;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    const x = ((i % 6) - 2.5) * 0.85,
      z = ((Math.floor(i / 6) % 5) - 2) * 0.85,
      y = 0.6 + Math.floor(i / 30) * 0.55;
    anchors.push(new THREE.Vector3(x, y, z));
    a.push(new THREE.Vector3(x, y, z));
    v.push(new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5));
  }
  const matrix = new THREE.Matrix4();
  let elapsed = 0;
  stage.hover = (hits) => {
    const hit = hits.find((h) => h.object === particles);
    const el = document.querySelector("#particle-speed");
    if (el)
      el.textContent = hit
        ? `${t("speed")}: ${v[hit.instanceId].length().toFixed(2)} model units/s`
        : "";
  };
  stage.tick = (dt) => {
    if (s.heat) {
      s.energy = Math.max(-42, Math.min(3088, s.energy + s.heat * dt));
      s.temperature = phaseFromEnergy(s.energy).temperature;
    }
    const p = phaseFromEnergy(s.energy),
      mobility = Math.sqrt((p.temperature + 273.15) / 293),
      bond = p.solid * 24,
      maxY = 3.8 + 4 * p.gas;
    for (let i = 0; i < count; i++) {
      const pos = a[i],
        vel = v[i];
      vel.x += (random() - 0.5) * mobility * dt * 8;
      vel.y += (random() - 0.5) * mobility * dt * 8;
      vel.z += (random() - 0.5) * mobility * dt * 8;
      vel.addScaledVector(anchors[i].clone().sub(pos), bond * dt);
      vel.multiplyScalar(Math.exp(-dt * (0.4 + 4 * p.solid)));
      if (!p.gas && !p.solid) vel.y -= 0.5 * dt;
      pos.addScaledVector(vel, dt);
      const radius = Math.hypot(pos.x, pos.z);
      if (radius > 3.9) {
        pos.x *= 3.9 / radius;
        pos.z *= 3.9 / radius;
        const dot = (vel.x * pos.x + vel.z * pos.z) / 3.9 ** 2;
        vel.x -= 2 * dot * pos.x;
        vel.z -= 2 * dot * pos.z;
      }
      if (pos.y < 0.3 || pos.y > maxY) {
        pos.y = THREE.MathUtils.clamp(pos.y, 0.3, maxY);
        vel.y *= -0.85;
      }
      matrix.makeTranslation(pos.x, pos.y, pos.z);
      particles.setMatrixAt(i, matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
    elapsed += dt;
    if (elapsed > 0.2) {
      notify();
      elapsed = 0;
    }
  };
  return { update() {} };
}
