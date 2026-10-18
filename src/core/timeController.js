import { dateToJulian, parseDate, J2000, MAX_JD } from "../utils/dates.js";
import { validDays } from "../utils/physics.ts";
export class TimeController {
  constructor() {
    this.running = true;
    this.speed = 24;
    this.elapsedDays = 0;
    this.startJD = dateToJulian(new Date());
  }
  get orbitalDays() {
    return this.startJD + this.elapsedDays - J2000;
  }
  get julianDate() {
    return this.startJD + this.elapsedDays;
  }
  setDate(value) {
    const jd = parseDate(value);
    if (jd === null) return false;
    this.startJD = jd;
    this.elapsedDays = 0;
    return true;
  }
  advance(delta, speed = this.speed) {
    if (!Number.isFinite(delta) || delta < 0) return;
    this.elapsedDays = Math.min(
      MAX_JD - this.startJD,
      this.elapsedDays + (delta * speed) / 24,
    );
    if (this.julianDate >= MAX_JD) this.running = false;
  }
  setSpeed(value) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= 8760) this.speed = n;
  }
  setDays(value) {
    const n = validDays(value);
    if (n === null || this.startJD + n > MAX_JD) return false;
    this.elapsedDays = n;
    return true;
  }
  toggle() {
    this.running = !this.running;
    return this.running;
  }
  update(delta) {
    if (this.running) this.advance(delta);
  }
  reset() {
    this.elapsedDays = 0;
  }
}
