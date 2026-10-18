import { BODIES } from "../data/catalog.js";
import { illustration } from "../utils/assets.js";
import { positionAu } from "../utils/physics.ts";
// The same scene interface keeps classroom controls available without WebGL.
export class FlatScene {
  constructor({ mount, onSelect }) {
    this.mount = mount;
    this.days = 0;
    this.labelsVisible = true;
    this.proportional = false;
    mount.innerHTML =
      '<div class="flat-scene"><p class="flat-note">2D classroom view · Choose a planet to learn about it. Distances are compressed.</p><div class="flat-map" role="group" aria-label="Solar system diagram"></div></div>';
    this.map = mount.querySelector(".flat-map");
    this.buttons = new Map();
    for (const body of BODIES) {
      const button = document.createElement("button");
      button.className = "flat-planet";
      button.innerHTML = `<img src="${illustration(body.id)}" alt=""><span>${body.name}</span>`;
      button.setAttribute("aria-label", "Learn about " + body.name);
      button.onclick = () => onSelect(body.id);
      this.map.append(button);
      this.buttons.set(body.id, button);
    }
    this.ready = Promise.resolve(0);
    this.frame = this.frame.bind(this);
    this.tickSimulation(0);
  }
  tickSimulation(days) {
    this.days = days;
    for (const b of BODIES) {
      const p = positionAu(b, days),
        radius = Math.hypot(p.x, p.z);
      const r =
        b.id === "sun"
          ? 0
          : (this.proportional ? radius / 31 : Math.sqrt(radius / 31)) * 40;
      const button = this.buttons.get(b.id);
      button.style.left = 50 + (radius ? (p.x / radius) * r : 0) + "%";
      button.style.top = 50 + (radius ? (p.z / radius) * r : 0) + "%";
    }
  }
  focus(id) {
    for (const [key, button] of this.buttons)
      button.setAttribute("aria-pressed", String(key === id));
  }
  start(onFrame) {
    this.onFrame = onFrame;
    if (this.active) return;
    this.active = true;
    this.previous = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }
  frame(now) {
    if (!this.active) return;
    if (!document.hidden) this.onFrame((now - this.previous) / 1000);
    this.previous = now;
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
  }
  setMode(mode) {
    this.mode = mode;
  }
  setQuality() {}
  setLabels(value) {
    this.labelsVisible = value;
    for (const b of this.buttons.values())
      b.querySelector("span").hidden = !value;
  }
  setScale(value) {
    this.proportional = value;
    this.tickSimulation(this.days);
  }
  zoom() {}
  dispose() {
    this.stop();
    this.mount.replaceChildren();
  }
}
