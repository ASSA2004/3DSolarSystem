import { THREE, mesh, line, label } from "./stage.js";
import { phaseFromEnergy, energyAtTemperature } from "../engine/matter.ts";
import { t } from "../lab-ui/i18n.js";
export const defaults = {
  temperature: 20,
  energy: energyAtTemperature(20),
  heat: 0,
  heated: false,
  view: "experiment",
  escaped: 0,
  atom: "oxygen",
  elapsed: 0,
};
export const views = [
  {
    id: "experiment",
    label: "Experiment",
    description:
      "An open vessel at 1 atmosphere. Heat adds energy; cooling removes it. Escaped vapor does not return when the vessel cools. White mist depicts condensed droplets; water vapor itself is invisible.",
  },
  {
    id: "molecular",
    label: "Molecules",
    description:
      "Magnified H₂O: red oxygen, pale hydrogen. Positions and time are enlarged. Solid molecules vibrate, liquid molecules exchange neighbours, and gas leaves the open vessel.",
  },
  {
    id: "atomic",
    label: "Atoms",
    description:
      "Structure of an atom in the same water sample. Electron clouds show probability, not paths. The nucleus is enlarged enormously. Heating water does not split its atoms.",
  },
];
export const controls = [
  {
    key: "atom",
    label: "Atom to inspect",
    options: ["oxygen", "hydrogen", "nucleus"],
  },
  {
    key: "temperature",
    label: "Prepare sample temperature",
    min: -20,
    max: 140,
    step: 1,
    unit: "°C",
  },
];
export const tools = [
  { key: "heat", label: "heat" },
  { key: "cool", label: "cool" },
  { key: "pause", label: "Stop heating / cooling" },
  { key: "melting", label: "melting" },
  { key: "boiling", label: "boiling" },
];
export function change(s, key, value) {
  if (key === "temperature") {
    s.escaped = 0;
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
  } else s[key] = value;
}
export function result(s) {
  const p = phaseFromEnergy(s.energy);
  return {
    rows: [
      [t("temperature"), p.temperature.toFixed(1) + " °C"],
      ["Specific enthalpy", s.energy.toFixed(0) + " kJ/kg"],
      ["State", p.phase],
      ["Water remaining", ((1 - s.escaped) * 100).toFixed(1) + "%"],
    ],
    answer: 0,
    explanation: p.plateau ? t("plateau") : t("warming"),
    detail:
      "Water at 1 atmosphere. Heat changes energy at an accelerated rate. Enthalpy zero is ice at 0°C. The temperature control prepares a fresh sample; Heat/Cool evolves it. Phase proportions use specific enthalpy; the open-vessel escape rate and particle trajectories are illustrative, not a fluid or molecular-dynamics prediction.",
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

export function advanceWater(s, dt) {
  if (s.heat) s.energy = Math.max(-42, Math.min(3088, s.energy + s.heat * dt));
  const p = phaseFromEnergy(s.energy);
  s.temperature = p.temperature;
  // A conceptual open-system mass balance: escaped material stays outside.
  s.escaped = Math.min(1, s.escaped + (1 - s.escaped) * p.gas * 0.08 * dt);
  s.elapsed += dt;
  return p;
}
export function create(stage, s, _change, notify) {
  if (!stage) {
    const timer = setInterval(() => {
      if (!document.hidden) {
        advanceWater(s, 0.1);
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
  const root = stage.content,
    macro = new THREE.Group(),
    micro = new THREE.Group(),
    atom = new THREE.Group();
  root.add(macro, micro, atom);
  const makeJar = (parent) => {
    mesh(
      parent,
      new THREE.CylinderGeometry(3.3, 3.3, 6, 40, 1, true),
      0x91d1e0,
      [0, 3, 0],
      {
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      },
    );
    mesh(
      parent,
      new THREE.CylinderGeometry(3.3, 3.3, 0.16, 40),
      0xb6cbd1,
      [0, 0, 0],
    );
    for (let i = 1; i <= 5; i++)
      line(
        parent,
        [
          [2.7, i, 1.9],
          [3.2, i, 1.9],
        ],
        0x53767d,
      );
  };
  makeJar(macro);
  makeJar(micro);
  mesh(
    macro,
    new THREE.CylinderGeometry(3.7, 3.7, 0.5, 32),
    0x314d56,
    [0, -0.4, 0],
  );
  const heater = mesh(
    macro,
    new THREE.TorusGeometry(2.3, 0.13, 8, 48),
    0x596a72,
    [0, -0.08, 0],
    { emissive: 0xff592d },
  );
  heater.rotation.x = Math.PI / 2;
  const water = mesh(
    macro,
    new THREE.CylinderGeometry(3.12, 3.12, 1, 40),
    0x21a9d1,
    [0, 2, 0],
    { transparent: true, opacity: 0.72, roughness: 0.12 },
  );
  const ice = mesh(macro, new THREE.BoxGeometry(4, 4, 4), 0xb9e4ef, [0, 2, 0], {
    transparent: true,
    opacity: 0.72,
  });
  const vapor = new THREE.Group();
  macro.add(vapor);
  const droplets = [];
  for (let i = 0; i < 24; i++)
    droplets.push(
      mesh(vapor, new THREE.SphereGeometry(0.1, 8, 6), 0xd4e7ed, [0, 0, 0], {
        transparent: true,
        opacity: 0.4,
      }),
    );
  const bubbles = [];
  for (let i = 0; i < 14; i++)
    bubbles.push(
      mesh(macro, new THREE.SphereGeometry(0.1, 8, 6), 0xd6edf4, [0, 0, 0], {
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
      }),
    );
  const thermometer = mesh(
    macro,
    new THREE.CylinderGeometry(0.08, 0.08, 1, 10),
    0xd85843,
    [3.7, 1, 0],
  );
  mesh(
    macro,
    new THREE.CylinderGeometry(0.14, 0.14, 5, 12),
    0xe8edf0,
    [3.7, 2.5, 0],
    { transparent: true, opacity: 0.25, depthWrite: false },
  );
  const N = stage.low ? 48 : 72,
    molecules = [],
    positions = [],
    velocities = [],
    anchors = [];
  for (let i = 0; i < N; i++) {
    const group = new THREE.Group();
    micro.add(group);
    mesh(group, new THREE.SphereGeometry(0.17, 10, 8), 0xe65f4b);
    for (const sign of [-1, 1])
      mesh(group, new THREE.SphereGeometry(0.105, 8, 6), 0xd7e9f5, [
        sign * 0.19,
        0.15,
        0,
      ]);
    const pos = new THREE.Vector3(
      ((i % 4) - 1.5) * 1.1,
      0.5 + Math.floor(i / 16) * 0.8,
      ((Math.floor(i / 4) % 4) - 1.5) * 1.1,
    );
    anchors.push(pos.clone());
    positions.push(pos);
    molecules.push(group);
    // Deterministic, isotropic initial velocities; collisions change trajectories.
    velocities.push(
      new THREE.Vector3(
        Math.sin(i * 2.4),
        Math.cos(i * 1.7),
        Math.sin(i * 3.1),
      ).normalize(),
    );
  }
  let atomKey = "",
    oldView = "",
    tick = 0;
  function buildAtom() {
    // Atom inspection is schematic structure, not a chemical or quantum trajectory solver.
    const oxygen = s.atom !== "hydrogen",
      nucleons = oxygen ? 16 : 1;
    while (atom.children.length) {
      const child = atom.children[0];
      child.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
      atom.remove(child);
    }
    for (let i = 0; i < nucleons; i++) {
      const z = 1 - (2 * (i + 0.5)) / nucleons,
        phi = i * 2.39996,
        r = Math.sqrt(1 - z * z) * 0.8;
      mesh(
        atom,
        new THREE.SphereGeometry(0.3, 12, 10),
        i < (oxygen ? 8 : 1) ? 0xe56748 : 0x598dd1,
        [r * Math.cos(phi), 3 + z * 0.8, r * Math.sin(phi)],
      );
    }
    if (s.atom !== "nucleus") {
      // Probability-density envelope, intentionally no orbiting electron beads.
      const positions = new Float32Array(1500 * 3);
      let seed = 91;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < 1500; i++) {
        const r = -Math.log(Math.max(1e-5, rand() * rand() * rand())) * 0.65,
          z = 2 * rand() - 1,
          a = rand() * Math.PI * 2;
        positions.set(
          [
            r * Math.sqrt(1 - z * z) * Math.cos(a),
            3 + r * z,
            r * Math.sqrt(1 - z * z) * Math.sin(a),
          ],
          i * 3,
        );
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      atom.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color: 0x338dba,
            size: 0.06,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
          }),
        ),
      );
    }
    label(
      atom,
      oxygen
        ? "Oxygen-16: 8 protons · 8 neutrons"
        : "Hydrogen-1: 1 proton · 0 neutrons",
      [0, 6, 0],
    );
    label(
      atom,
      s.atom === "nucleus"
        ? "Nucleus enlarged; not to scale"
        : oxygen
          ? "8 electrons · schematic probability cloud"
          : "1 electron · spherical probability cloud",
      [0, 0, 0],
    );
    atomKey = s.atom;
  }
  const resetCamera = () => {
    stage.camera.position.set(
      s.view === "atomic" ? 0 : 10,
      8,
      s.view === "atomic" ? 19 : 15,
    );
    stage.controls.target.set(0, 3, 0);
    stage.controls.update();
  };
  const update = () => {
    macro.visible = s.view === "experiment";
    micro.visible = s.view === "molecular";
    atom.visible = s.view === "atomic";
    if (s.atom !== atomKey) buildAtom();
    if (oldView !== s.view) {
      oldView = s.view;
      resetCamera();
    }
  };
  stage.tick = (dt) => {
    const p = advanceWater(s, dt),
      time = s.elapsed,
      mobility = Math.sqrt((p.temperature + 273.15) / 293.15);
    const liquidHeight = 4 * (1 - s.escaped) * p.liquid;
    water.visible = liquidHeight > 0.02;
    water.scale.y = Math.max(0.02, liquidHeight);
    water.position.y = liquidHeight / 2;
    ice.visible = p.solid > 0;
    ice.scale.setScalar(Math.cbrt(Math.max(0.001, p.solid * (1 - s.escaped))));
    ice.position.y = 2 * ice.scale.y;
    heater.material.emissiveIntensity = s.heat > 0 ? 1.6 : 0;
    thermometer.scale.y = Math.max(0.1, ((p.temperature + 20) / 160) * 5);
    thermometer.position.y = thermometer.scale.y / 2;
    bubbles.forEach((bubble, i) => {
      bubble.visible =
        p.phase === "boiling" && s.heat > 0 && liquidHeight > 0.1;
      const rise = (time * (0.5 + i * 0.015) + i / 14) % 1;
      bubble.position.set(
        Math.sin(i * 2.3) * 2.2,
        0.1 + rise * Math.max(0, liquidHeight - 0.2),
        Math.cos(i * 2.3) * 2.2,
      );
      bubble.scale.setScalar(0.5 + rise);
    });
    droplets.forEach((d, i) => {
      const rise = (time * 0.6 + i / 24) % 1;
      d.visible = p.gas > 0.01 && s.escaped < 0.99;
      d.position.set(
        Math.sin(i * 2.4) * (1 + rise * 3),
        liquidHeight + rise * 8,
        Math.cos(i * 2.4) * (1 + rise * 3),
      );
      d.material.opacity = (1 - rise) * 0.35 * p.gas;
    });
    for (let i = 0; i < N; i++) {
      const pos = positions[i],
        vel = velocities[i],
        gas = i / N < p.gas,
        solid = i / N > 1 - p.solid;
      if (solid) {
        pos.copy(anchors[i]);
        pos.x += Math.sin(time * 8 * mobility + i) * 0.08 * mobility;
        pos.y += Math.cos(time * 7 * mobility + i) * 0.08 * mobility;
      } else {
        // Excluded-volume encounters preserve direction geometry; cohesion keeps liquid close.
        if (!gas)
          for (let j = 0; j < i; j++) {
            const other = positions[j],
              delta = pos.clone().sub(other),
              d = delta.length();
            if (d > 0 && d < 0.55)
              vel.addScaledVector(delta, ((0.55 - d) * dt * 18) / d);
          }
        vel.normalize().multiplyScalar(mobility * (gas ? 2.4 : 0.9));
        pos.addScaledVector(vel, dt);
        if (gas) {
          pos.y += dt * 0.8;
          if (pos.y > 10) pos.set(Math.sin(i) * 2, 0.5, Math.cos(i) * 2);
        } else {
          if (pos.y < 0.3 || pos.y > 3.8) {
            vel.y *= -1;
            pos.y = THREE.MathUtils.clamp(pos.y, 0.3, 3.8);
          }
        }
        const radius = Math.hypot(pos.x, pos.z),
          limit = gas ? 7 : 2.9;
        if (radius > limit) {
          const dot = (vel.x * pos.x + vel.z * pos.z) / (radius * radius);
          vel.x -= 2 * dot * pos.x;
          vel.z -= 2 * dot * pos.z;
          pos.x *= limit / radius;
          pos.z *= limit / radius;
        }
      }
      molecules[i].visible = i / N >= s.escaped;
      molecules[i].position.copy(pos);
      if (!solid) molecules[i].rotation.y += dt * mobility;
    }
    tick += dt;
    if (tick > 0.2) {
      tick = 0;
      notify();
    }
  };
  update();
  return { update, resetCamera };
}
