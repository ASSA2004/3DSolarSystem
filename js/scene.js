import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { PLANETS, getPlanet } from "./data/planets.js";
import { createControls } from "./controls.js";

const texturePath = id => {
  if (id === "moon" || !getPlanet(id)) return "textures/2k_moon.jpg";
  return `textures/${getPlanet(id).texture}`;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class SolarScene {
  constructor({ mount, onLoad, onSelect }) {
    this.mount = mount; this.onLoad = onLoad; this.onSelect = onSelect; this.active = false; this.labelsVisible = true; this.trueDistance = false; this.cameraTween = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 6000);
    this.camera.position.set(-18, 14, 82);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.2;
    mount.appendChild(this.renderer.domElement);
    this.labelRenderer = new CSS2DRenderer(); this.labelRenderer.setSize(innerWidth, innerHeight); this.labelRenderer.domElement.style.position = "absolute"; this.labelRenderer.domElement.style.inset = "0"; this.labelRenderer.domElement.style.pointerEvents = "none"; mount.appendChild(this.labelRenderer.domElement);
    this.controls = createControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.planets = new Map(); this.moons = [];
    this.clock = new THREE.Clock();
    this.setup();
    this.pointerDown = null;
    this.renderer.domElement.addEventListener("pointerdown", event => {
      this.pointerDown = { x: event.clientX, y: event.clientY };
    });
    this.renderer.domElement.addEventListener("pointerup", event => this.handlePointer(event));
    addEventListener("resize", () => this.resize());
  }
  setup() {
    this.scene.background = new THREE.Color(0x02030b);
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => this.onLoad(Math.round(loaded / total * 100));
    manager.onLoad = () => this.onLoad(100);
    const loader = new THREE.TextureLoader(manager); loader.setCrossOrigin("anonymous");
    const loadTexture = (id, color = true) => { const texture = loader.load(texturePath(id)); if (color) { texture.encoding = THREE.sRGBEncoding; texture.colorSpace = THREE.SRGBColorSpace; } texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); return texture; };
    const starsGeometry = new THREE.BufferGeometry(); const stars = new Float32Array(6500 * 3);
    for (let i = 0; i < stars.length; i += 3) { stars[i] = (Math.random() - .5) * 2200; stars[i + 1] = (Math.random() - .5) * 2200; stars[i + 2] = (Math.random() - .5) * 2200; }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3)); this.scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: .8, sizeAttenuation: true })));
    this.scene.add(new THREE.AmbientLight(0x8fa8ff, .16)); this.scene.add(new THREE.PointLight(0xfff4cf, 3.8, 700));
    this.sun = new THREE.Mesh(new THREE.SphereGeometry(getPlanet("sun").size, 64, 64), new THREE.MeshBasicMaterial({ map: loadTexture("sun") })); this.scene.add(this.sun);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.makeGlowTexture(), color: 0xffb347, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(25, 25, 1); this.sun.add(glow);
    PLANETS.filter(p => p.id !== "sun").forEach(planet => this.createPlanet(planet, loadTexture(planet.id)));
    this.createMoon("moon", "earth", .42, 3.3, loadTexture("moon"), 27);
    [["io", 0.58, 4.4, 12], ["europa", .5, 5.3, 9], ["ganymede", .7, 6.4, 6], ["callisto", .64, 7.8, 3.5]].forEach(([id, size, distance, speed], index) => this.createMoon(id, "jupiter", size, distance, loadTexture("moon"), speed, index));
    this.createAsteroidBelt();
  }
  createPlanet(data, texture) {
    const pivot = new THREE.Object3D(); this.scene.add(pivot); const tilt = new THREE.Object3D(); tilt.rotation.z = THREE.MathUtils.degToRad(data.tilt); pivot.add(tilt);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 40, 40), new THREE.MeshStandardMaterial({ map: texture, roughness: .84, metalness: .02 })); mesh.position.x = data.orbit; mesh.userData.planetId = data.id; tilt.add(mesh);
    const orbit = new THREE.Mesh(new THREE.RingGeometry(data.orbit - .018, data.orbit + .018, 128), new THREE.MeshBasicMaterial({ color: 0x415079, transparent: true, opacity: .48, side: THREE.DoubleSide })); orbit.rotation.x = -Math.PI / 2; this.scene.add(orbit);
    const label = new CSS2DObject(Object.assign(document.createElement("div"), { className: "label-sprite", textContent: data.name })); label.position.set(0, data.size + .5, 0); mesh.add(label);
    const object = { data, pivot, tilt, mesh, orbit, label, baseOrbit: data.orbit }; this.planets.set(data.id, object);
    if (data.id === "saturn") { const ring = this.createRing(); mesh.add(ring); }
    if (data.id === "earth") { const clouds = new THREE.Mesh(new THREE.SphereGeometry(data.size * 1.012, 40, 40), new THREE.MeshPhongMaterial({ map: texture, transparent: true, opacity: .08, depthWrite: false })); mesh.add(clouds); }
  }
  createRing() {
    const geometry = new THREE.RingGeometry(4.5, 7, 128); const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) { const x = geometry.attributes.position.getX(i), y = geometry.attributes.position.getY(i); uv.setXY(i, (Math.atan2(y, x) / (Math.PI * 2)) + .5, Math.hypot(x, y) / 7); }
    const texture = new THREE.TextureLoader().load("textures/2k_saturn_ring.png"); texture.encoding = THREE.sRGBEncoding; texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const ring = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; return ring;
  }
  createMoon(id, parentId, size, distance, texture, speed, index = 0) {
    const parent = this.planets.get(parentId)?.mesh || this.sun; const pivot = new THREE.Object3D(); parent.add(pivot); const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), new THREE.MeshStandardMaterial({ map: texture, roughness: .95 })); mesh.position.x = distance; mesh.userData.planetId = id; pivot.add(mesh); this.moons.push({ id, mesh, pivot, distance, speed, phase: index * 1.4 });
  }
  createAsteroidBelt() {
    const count = 2200, geometry = new THREE.IcosahedronGeometry(.06, 0), material = new THREE.MeshStandardMaterial({ color: 0x817d76, roughness: 1 }); const belt = new THREE.InstancedMesh(geometry, material, count); const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2, radius = 31 + Math.random() * 5, y = (Math.random() - .5) * .8; matrix.makeTranslation(Math.cos(angle) * radius, y, Math.sin(angle) * radius); matrix.multiply(new THREE.Matrix4().makeScale(.5 + Math.random() * 2.5, .5 + Math.random() * 2.5, .5 + Math.random() * 2.5)); belt.setMatrixAt(i, matrix); } this.scene.add(belt); this.belt = belt;
  }
  makeGlowTexture() { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128; const ctx = canvas.getContext("2d"), gradient = ctx.createRadialGradient(64,64,2,64,64,64); gradient.addColorStop(0, "rgba(255,255,220,1)"); gradient.addColorStop(.2, "rgba(255,196,84,.85)"); gradient.addColorStop(1, "rgba(255,99,0,0)"); ctx.fillStyle = gradient; ctx.fillRect(0,0,128,128); return new THREE.CanvasTexture(canvas); }
  setActive(active) { this.active = active; if (active) { this.clock.start(); this.animate(); } }
  animate() { if (!this.active) return; requestAnimationFrame(() => this.animate()); const delta = Math.min(this.clock.getDelta(), .1); this.controls.update(delta); this.belt.rotation.y += delta * .015; this.renderer.render(this.scene, this.camera); this.labelRenderer.render(this.scene, this.camera); if (this.onTick) this.onTick(delta); }
  tickSimulation(days) {
    const sun = getPlanet("sun");
    this.sun.rotation.y = (days / sun.dayDays) * Math.PI * 2;
    this.planets.forEach(({ data, pivot, mesh }) => {
      if (data.orbitalDays) {
        const completedOrbits = days / data.orbitalDays;
        pivot.rotation.y = (completedOrbits % 1) * Math.PI * 2;
      }
      const direction = data.id === "venus" ? -1 : 1;
      mesh.rotation.y = direction * (days / data.dayDays) * Math.PI * 2;
    });
    this.moons.forEach(moon => moon.pivot.rotation.y = moon.phase + days / (moon.speed * 1.5));
  }
  handlePointer(event) {
    if (!this.active || !this.pointerDown) return;
    const moved = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
    this.pointerDown = null;
    if (moved > 8) return;
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [...this.planets.values()].map(p => p.mesh).concat(this.moons.map(m => m.mesh));
    const hits = this.raycaster.intersectObjects(targets);
    if (!hits.length) return;
    const id = hits[0].object.userData.planetId;
    const planet = getPlanet(id) || {
      ...getPlanet(id === "moon" ? "earth" : "jupiter"),
      name: id[0].toUpperCase() + id.slice(1),
      description: "A natural satellite in the solar system."
    };
    this.onSelect(planet, hits[0].object);
    this.flyTo(id === "moon" ? "earth" : id);
  }
  getSceneObject(id) {
    return id === "sun" ? { mesh: this.sun, data: getPlanet("sun") } : this.planets.get(id);
  }
  flyTo(id) {
    const object = this.getSceneObject(id);
    if (!object) return;
    const target = new THREE.Vector3();
    object.mesh.getWorldPosition(target);
    const direction = this.camera.position.clone().sub(target).normalize();
    if (!direction.lengthSq()) direction.set(0, .2, 1).normalize();
    this.cameraTween = {
      id,
      object,
      from: this.camera.position.clone(),
      offset: direction.multiplyScalar(object.data.size * 5 + 12),
      startTarget: target.clone(),
      elapsed: 0,
      duration: .9
    };
  }
  updateTween(delta) {
    if (!this.cameraTween) return;
    const tween = this.cameraTween;
    tween.elapsed += delta;
    const t = clamp(tween.elapsed / tween.duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const target = new THREE.Vector3();
    tween.object.mesh.getWorldPosition(target);
    const end = target.clone().add(tween.offset);
    this.camera.position.lerpVectors(tween.from, end, eased);
    this.controls.orbit.target.lerp(target, Math.min(1, delta * 8));
    if (t === 1) this.cameraTween = null;
  }
  setLabels(visible) { this.labelsVisible = visible; this.planets.forEach(p => p.label.visible = visible); }
  setScale(trueDistance) { this.trueDistance = trueDistance; const factor = trueDistance ? 2.55 : 1; this.planets.forEach(p => { p.mesh.position.x = p.data.orbit * factor; p.orbit.scale.setScalar(factor); }); }
  resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); this.labelRenderer.setSize(innerWidth, innerHeight); }
}
