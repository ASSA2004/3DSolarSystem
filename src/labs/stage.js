import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { currentTokens } from "../lab-ui/tokens.js";
export { THREE };
export function release(object) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    for (const m of Array.isArray(child.material)
      ? child.material
      : [child.material])
      if (m) {
        materials.add(m);
        for (const value of Object.values(m))
          if (value?.isTexture) textures.add(value);
      }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
  object.clear();
}
export class Stage {
  static active = 0;
  constructor(mount, { background = true } = {}) {
    this.mount = mount;
    this.abort = new AbortController();
    this.scene = new THREE.Scene();
    this.content = new THREE.Group();
    this.scene.add(this.content);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 1000);
    this.camera.position.set(15, 13, 22);
    this.low =
      (navigator.hardwareConcurrency || 4) <= 4 ||
      (navigator.deviceMemory || 8) <= 4;
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.low,
      alpha: !background,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.low ? 1 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.append(this.renderer.domElement);
    Stage.active++;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 90;
    this.controls.target.set(0, 2, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x344155, 2.5));
    this.light = new THREE.DirectionalLight(0xffffff, 3);
    this.light.position.set(8, 15, 10);
    this.scene.add(this.light);
    this.theme = () => {
      const t = currentTokens();
      this.scene.background = background ? new THREE.Color(t.scene) : null;
    };
    this.theme();
    document.addEventListener("lab-theme", this.theme, {
      signal: this.abort.signal,
    });
    this.resize = new ResizeObserver(() => {
      const { width, height } = mount.getBoundingClientRect();
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    this.resize.observe(mount);
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.previous = performance.now();
    this.running = true;
    this.frames = 0;
    this.elapsed = 0;
    this.loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.04, (now - this.previous) / 1000);
      this.previous = now;
      this.tick?.(dt);
      this.controls.update();
      const labelHeight =
        (24 * 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) /
        Math.max(1, this.mount.clientHeight);
      this.content.traverse((object) => {
        if (object.userData.screenLabel)
          object.scale.set(
            labelHeight * object.userData.labelAspect,
            labelHeight,
            1,
          );
      });
      this.renderer.render(this.scene, this.camera);
      this.frames++;
      this.elapsed += dt;
      if (this.elapsed > 5) {
        if (this.frames / this.elapsed < 35) {
          this.renderer.setPixelRatio(1);
          this.onLow?.();
        }
        this.frames = 0;
        this.elapsed = 0;
      }
      this.raf = requestAnimationFrame(this.loop);
    };
    this.visibility = () => {
      cancelAnimationFrame(this.raf);
      if (!document.hidden) {
        this.previous = performance.now();
        this.raf = requestAnimationFrame(this.loop);
      }
    };
    document.addEventListener("visibilitychange", this.visibility, {
      signal: this.abort.signal,
    });
    this.visibility();
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.drag = null;
    const point = (e) => {
      const r = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      this.ray.setFromCamera(this.pointer, this.camera);
    };
    this.renderer.domElement.addEventListener(
      "pointerdown",
      (e) => {
        point(e);
        const hit = this.ray
          .intersectObjects(this.content.children, true)
          .find((h) => h.object.userData.drag);
        if (hit) {
          this.drag = hit.object.userData.drag;
          this.controls.enabled = false;
          this.renderer.domElement.setPointerCapture(e.pointerId);
        }
      },
      { signal: this.abort.signal },
    );
    this.renderer.domElement.addEventListener(
      "pointermove",
      (e) => {
        point(e);
        if (this.drag) {
          const p = new THREE.Vector3();
          const plane = new THREE.Plane(
            this.drag.flat
              ? new THREE.Vector3(0, 1, 0)
              : new THREE.Vector3(0, 0, 1),
            0,
          );
          if (this.ray.ray.intersectPlane(plane, p)) this.drag.move(p);
        } else
          this.hover?.(this.ray.intersectObjects(this.content.children, true));
      },
      { signal: this.abort.signal },
    );
    const end = () => {
      this.drag = null;
      this.controls.enabled = true;
    };
    this.renderer.domElement.addEventListener("pointerup", end, {
      signal: this.abort.signal,
    });
    this.renderer.domElement.addEventListener("pointercancel", end, {
      signal: this.abort.signal,
    });
  }
  clear() {
    release(this.content);
  }
  reset(flat = false) {
    this.camera.position.set(flat ? 0 : 15, flat ? 30 : 13, flat ? 0.01 : 22);
    this.controls.target.set(0, 2, 0);
    this.controls.update();
  }
  dispose() {
    if (!this.running) return;
    Stage.active--;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.resize.disconnect();
    this.controls.dispose();
    release(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
export function mesh(
  parent,
  geometry,
  color,
  position = [0, 0, 0],
  options = {},
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.36,
    metalness: 0.12,
    ...options,
  });
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  parent.add(m);
  return m;
}
export function line(parent, points, color = 0xe6a935, dashed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const l = new THREE.Line(
    geometry,
    dashed
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.35, gapSize: 0.2 })
      : new THREE.LineBasicMaterial({ color }),
  );
  if (dashed) l.computeLineDistances();
  parent.add(l);
  return l;
}
export function label(parent, text, position, color = currentTokens().ink) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = "500 36px sans-serif";
  c.width = Math.ceil(ctx.measureText(text).width) + 24;
  c.height = 64;
  ctx.fillStyle = currentTokens().surface;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = "500 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, c.width / 2, 32);
  const texture = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      sizeAttenuation: false,
    }),
  );
  sprite.userData.screenLabel = true;
  sprite.userData.labelAspect = c.width / c.height;
  sprite.position.set(...position);
  sprite.scale.set(0.3, 0.056, 1);
  parent.add(sprite);
  return sprite;
}
