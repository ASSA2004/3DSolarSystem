import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { BODIES, bodyById } from "./data/catalog.js";
import { textureURL } from "./assets.js";
import { orbitalAngle, TAU } from "./physics.ts";
import { createControls } from "./controls.js";

export class SolarScene {
  constructor({ mount, onProgress, onSelect, onFailure, reducedMotion }) {
    this.mount = mount;
    this.onSelect = onSelect;
    this.onFailure = onFailure;
    this.reducedMotion = reducedMotion;
    this.bodies = new Map();
    this.moons = [];
    this.days = 0;
    this.active = false;
    this.selected = null;
    this.proportional = false;
    this.labelsVisible = true;
    this.mode = "normal";
    this.cinematicPlaying = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.03, 5000);
    this.camera.position.set(100, 130, 165);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.setQuality("auto");
    mount.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive solar system. Use the planet list to select a world. Drag to orbit and pinch or scroll to zoom.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.labels = new CSS2DRenderer();
    Object.assign(this.labels.domElement.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
    });
    mount.append(this.labels.domElement);
    this.controls = createControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.lastTarget = new THREE.Vector3();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(mount);
    this.renderer.domElement.addEventListener("pointerdown", (e) => {
      this.pointerStart = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
      };
    });
    this.renderer.domElement.addEventListener("pointerup", (e) => this.pick(e));
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.stop();
      onFailure(
        "The graphics connection was interrupted. Reload the explorer to reconnect.",
      );
    });
    const manager = new THREE.LoadingManager();
    this.failedTextures = [];
    manager.onProgress = (url, loaded, total) =>
      onProgress(Math.round((loaded / total) * 100));
    manager.onError = (url) => this.failedTextures.push(url);
    this.ready = new Promise((resolve) => {
      manager.onLoad = () => {
        onProgress(100);
        resolve(this.failedTextures.length);
      };
    });
    this.loader = new THREE.TextureLoader(manager);
    this.textureCache = new Map();
    this.setup();
    this.resize();
    this.tickSimulation(0);
    this.frame = this.frame.bind(this);
  }
  texture(file) {
    if (!this.textureCache.has(file)) {
      const texture = this.loader.load(textureURL(file));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      this.textureCache.set(file, texture);
    }
    return this.textureCache.get(file);
  }
  setup() {
    this.scene.add(new THREE.AmbientLight(0xc6d8ef, 0.9));
    const sunlight = new THREE.PointLight(0xffecd0, 4.2, 0, 0);
    this.scene.add(sunlight);
    const fill = new THREE.PointLight(0xd9e7f5, 0.7, 0, 0);
    this.camera.add(fill);
    this.scene.add(this.camera);
    const starVertices = [];
    for (let i = 0; i < 2200; i++) {
      const angle = Math.random() * TAU,
        z = Math.random() * 2 - 1,
        r = 850 + Math.random() * 250;
      starVertices.push(
        Math.cos(angle) * Math.sqrt(1 - z * z) * r,
        z * r,
        Math.sin(angle) * Math.sqrt(1 - z * z) * r,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3),
    );
    this.scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0xc8d5e7,
          size: 1.1,
          transparent: true,
          opacity: 0.6,
          sizeAttenuation: true,
        }),
      ),
    );
    for (const data of BODIES) {
      const anchor = new THREE.Group(),
        tilt = new THREE.Group();
      tilt.rotation.z = THREE.MathUtils.degToRad(data.tilt);
      anchor.add(tilt);
      const material =
        data.id === "sun"
          ? new THREE.MeshBasicMaterial({
              map: this.texture(data.texture),
              color: 0xffdaaa,
            })
          : new THREE.MeshStandardMaterial({
              map: this.texture(data.texture),
              roughness: 1,
            });
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(data.size, 48, 32),
        material,
      );
      mesh.userData.bodyId = data.id;
      tilt.add(mesh);
      const button = document.createElement("button");
      button.className = "planet-label";
      button.textContent = data.name;
      button.setAttribute("aria-label", "Focus on " + data.name);
      button.addEventListener("pointerdown", (e) => e.stopPropagation());
      button.addEventListener("click", () => this.onSelect(data.id));
      const label = new CSS2DObject(button);
      label.position.y = data.size * 1.12;
      anchor.add(label);
      this.scene.add(anchor);
      let orbit = null;
      if (data.orbit) {
        const points = [];
        for (let i = 0; i <= 256; i++)
          points.push(
            new THREE.Vector3(
              Math.cos((i / 256) * TAU),
              0,
              Math.sin((i / 256) * TAU),
            ),
          );
        orbit = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: 0x8897aa,
            transparent: true,
            opacity: 0.18,
          }),
        );
        orbit.scale.setScalar(data.orbit);
        this.scene.add(orbit);
      }
      this.bodies.set(data.id, { data, anchor, tilt, mesh, label, orbit });
      if (data.id === "sun") this.addGlow(mesh);
      if (["earth", "venus", "uranus", "neptune"].includes(data.id))
        this.addAtmosphere(mesh, data);
      if (data.id === "saturn") {
        const g = new THREE.RingGeometry(
          data.size * 1.35,
          data.size * 2.25,
          128,
        );
        const position = g.attributes.position,
          uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) {
          const radius = Math.hypot(position.getX(i), position.getY(i));
          uv.setXY(i, (radius - data.size * 1.35) / (data.size * 0.9), 0.5);
        }
        const ring = new THREE.Mesh(
          g,
          new THREE.MeshBasicMaterial({
            map: this.texture("2k_saturn_ring.png"),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        tilt.add(ring);
      }
    }
    this.addMoon("Moon", "earth", 0.27, 3.3, 27.3217, 0);
    [
      ["Io", 0.18, 5.3, 1.769],
      ["Europa", 0.16, 6.3, 3.551],
      ["Ganymede", 0.26, 7.5, 7.155],
      ["Callisto", 0.24, 9, 16.689],
    ].forEach((m, i) =>
      this.addMoon(m[0], "jupiter", m[1], m[2], m[3], i * 1.5),
    );
    const belt = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.085, 0),
      new THREE.MeshStandardMaterial({
        color: 0x958a79,
        roughness: 1,
        transparent: true,
        opacity: 1,
      }),
      1100,
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 1100; i++) {
      const a = Math.random() * TAU,
        r = 38 + Math.random() * 5;
      dummy.position.set(
        Math.cos(a) * r,
        (Math.random() - 0.5) * 0.7,
        Math.sin(a) * r,
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.5);
      dummy.updateMatrix();
      belt.setMatrixAt(i, dummy.matrix);
    }
    this.belt = belt;
    this.scene.add(belt);
  }
  addAtmosphere(mesh, data) {
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(data.size * 1.018, 48, 32),
      new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(data.color) } },
        vertexShader:
          "varying vec3 vNormal; varying vec3 vView; void main() { vec4 p = modelViewMatrix * vec4(position, 1.0); vNormal = normalize(normalMatrix * normal); vView = normalize(-p.xyz); gl_Position = projectionMatrix * p; }",
        fragmentShader:
          "uniform vec3 color; varying vec3 vNormal; varying vec3 vView; void main() { float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 4.0); gl_FragColor = vec4(color, rim * 0.45); }",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    mesh.add(atmosphere);
  }
  addGlow(mesh) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d"),
      gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,214,153,.5)");
    gradient.addColorStop(0.4, "rgba(255,169,78,.15)");
    gradient.addColorStop(1, "rgba(255,151,53,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(30, 30, 1);
    mesh.add(glow);
  }
  addMoon(name, parent, size, distance, period, phase) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 20, 16),
      new THREE.MeshStandardMaterial({
        map: this.texture("2k_moon.jpg"),
        roughness: 1,
      }),
    );
    mesh.userData.bodyId = parent;
    this.bodies.get(parent).anchor.add(mesh);
    this.moons.push({ mesh, distance, period, phase });
  }
  tickSimulation(days) {
    this.days = days;
    for (const { data, anchor, mesh } of this.bodies.values()) {
      const angle = orbitalAngle(data, days),
        radius = this.proportional ? data.distanceAu * 11 : data.orbit;
      anchor.position.set(
        Math.cos(angle) * radius,
        0,
        -Math.sin(angle) * radius,
      );
      // Tilt > 90 degrees already produces retrograde rotation; do not reverse twice.
      mesh.rotation.y = ((days / data.dayDays) % 1) * TAU;
    }
    for (const moon of this.moons) {
      const a = moon.phase + ((days / moon.period) % 1) * TAU;
      moon.mesh.position.set(
        Math.cos(a) * moon.distance,
        0,
        -Math.sin(a) * moon.distance,
      );
      moon.mesh.rotation.y = a;
    }
    this.belt.rotation.y = ((days / 1600) % 1) * TAU;
  }
  start(onFrame) {
    this.onFrame = onFrame;
    if (this.active) return;
    this.active = true;
    this.previous = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
  }
  frame(now) {
    if (!this.active) return;
    const delta = Math.min((now - this.previous) / 1000, 0.1);
    this.previous = now;
    if (!document.hidden) {
      this.onFrame?.(delta);
      this.updateCamera(delta);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    }
    this.raf = requestAnimationFrame(this.frame);
  }
  focus(id, immediate = false) {
    this.selected = id;
    const object = this.bodies.get(id);
    const target = object
      ? object.anchor.position.clone()
      : new THREE.Vector3();
    const scale = object ? object.anchor.scale.x : 1;
    const field = Math.atan(
      Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) *
        Math.min(1, this.camera.aspect),
    );
    const overviewRadius =
      ((this.proportional ? 331.1 : 102) / Math.sin(field)) * 1.1;
    const radius = object
      ? Math.max(
          object.data.size * scale * (id === "saturn" ? 7 : 5.5),
          ((object.data.size * scale * (id === "saturn" ? 2.25 : 1.1)) /
            Math.sin(field)) *
            1.12,
          0.5,
        )
      : overviewRadius;
    this.controls.maxDistance = Math.max(1200, overviewRadius * 1.4);
    const offset = object
      ? new THREE.Vector3(0.7, id === "saturn" ? 1.2 : 0.36, 1)
          .normalize()
          .multiplyScalar(radius)
      : new THREE.Vector3(0.4, 0.65, 1).normalize().multiplyScalar(radius);
    this.tween = {
      from: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      offset,
      elapsed: 0,
      duration: immediate || this.reducedMotion ? 0 : 1.35,
    };
    this.lastTarget.copy(target);
    this.controls.minDistance = object
      ? Math.max(object.data.size * scale * 1.35, 0.3)
      : 3;
    for (const b of this.bodies.values()) {
      b.anchor.visible = this.mode !== "video" || b.data.id === id;
      b.label.element.classList.toggle("selected", b.data.id === id);
      if (b.orbit)
        b.orbit.material.opacity = id ? (b.data.id === id ? 0.25 : 0.06) : 0.18;
    }
    this.belt.material.opacity = id ? 0.32 : 1;
    this.updateCamera(0);
  }
  updateCamera(delta) {
    const target = this.selected
      ? this.bodies.get(this.selected).anchor.position.clone()
      : new THREE.Vector3();
    if (this.tween) {
      const t = this.tween;
      t.elapsed += delta;
      const progress = t.duration ? Math.min(1, t.elapsed / t.duration) : 1,
        eased = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(
        t.from,
        target.clone().add(t.offset),
        eased,
      );
      this.controls.target.lerpVectors(t.fromTarget, target, eased);
      if (progress === 1) this.tween = null;
    } else if (this.selected) {
      const change = target.clone().sub(this.lastTarget);
      this.camera.position.add(change);
      this.controls.target.add(change);
      if (
        this.mode === "video" &&
        this.cinematicPlaying &&
        !this.reducedMotion
      ) {
        const offset = this.camera.position.clone().sub(target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.035);
        this.camera.position.copy(target).add(offset);
      }
    }
    this.lastTarget.copy(target);
  }
  pick(event) {
    const start = this.pointerStart;
    if (
      !start ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7 ||
      performance.now() - start.time > 600 ||
      this.mode === "video"
    )
      return;
    const rect = this.mount.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      this.camera,
    );
    const hits = this.raycaster.intersectObjects(
      [...this.bodies.values()]
        .map((b) => b.mesh)
        .concat(this.moons.map((m) => m.mesh)),
      false,
    );
    if (hits.length) this.onSelect(hits[0].object.userData.bodyId);
  }
  setLabels(value) {
    this.labelsVisible = value;
    this.labels.domElement.hidden = !value || this.mode === "video";
  }
  setMode(mode) {
    this.mode = mode;
    this.controls.enabled = mode !== "video";
    this.setLabels(this.labelsVisible);
    for (const b of this.bodies.values()) {
      b.anchor.visible = mode !== "video" || b.data.id === this.selected;
      if (b.orbit) b.orbit.visible = mode !== "video";
    }
    this.belt.visible = mode !== "video" && !this.proportional;
    this.resize();
  }
  setScale(value) {
    this.proportional = value;
    for (const b of this.bodies.values()) {
      b.anchor.scale.setScalar(value ? (b.data.id === "sun" ? 0.08 : 0.12) : 1);
      if (b.orbit)
        b.orbit.scale.setScalar(value ? b.data.distanceAu * 11 : b.data.orbit);
    }
    this.belt.visible = !value && this.mode !== "video";
    this.tickSimulation(this.days);
    this.focus(this.selected);
  }
  setQuality(quality) {
    this.quality = quality;
    this.renderer.setPixelRatio(
      quality === "low"
        ? 1
        : quality === "high"
          ? Math.min(devicePixelRatio, 2)
          : Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6),
    );
    if (this.mount) this.resize();
  }
  zoom(factor) {
    this.tween = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length() * factor,
        this.controls.minDistance,
        this.controls.maxDistance,
      ),
    );
    this.camera.position.copy(this.controls.target).add(offset);
  }
  resize() {
    if (!this.labels) return;
    const { width, height } = this.mount.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    if (this.mode === "video")
      this.camera.setViewOffset(
        width,
        height,
        innerWidth > 650 ? -width * 0.16 : 0,
        height * 0.1,
        width,
        height,
      );
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.labels.setSize(width, height);
    if (this.bodies.size && this.controls) this.focus(this.selected, true);
  }
  dispose() {
    this.stop();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      if (object.material) {
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          if (object.type === "Sprite") material.map?.dispose();
          material.dispose();
        }
      }
    });
    this.textureCache.forEach((texture) => texture.dispose());
    this.renderer.dispose();
    this.mount.replaceChildren();
  }
}
