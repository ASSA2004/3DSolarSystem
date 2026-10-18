import { validDays } from "../utils/physics.ts";
export class TimeController {
  constructor() {
    this.running = true;
    this.speed = 24;
    this.elapsedDays = 0;
  }
  setSpeed(value) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= 8760) this.speed = n;
  }
  setDays(value) {
    const n = validDays(value);
    if (n === null) return false;
    this.elapsedDays = n;
    return true;
  }
  toggle() {
    this.running = !this.running;
    return this.running;
  }
  update(delta) {
    if (this.running)
      this.elapsedDays = Math.min(
        1000000,
        this.elapsedDays + (delta * this.speed) / 24,
      );
  }
  reset() {
    this.elapsedDays = 0;
  }
}
