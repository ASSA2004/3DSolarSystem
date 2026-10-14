export class TimeController {
  constructor(onTick) {
    this.onTick = onTick;
    this.running = true;
    this.speed = 1;
    this.elapsedDays = 0;
  }
  setSpeed(value) { this.speed = Number(value); }
  setDays(value) {
    const days = Number(value);
    if (!Number.isFinite(days) || days < 0) return this.elapsedDays;
    this.elapsedDays = Math.min(days, 1000000);
    this.onTick(this.elapsedDays, this.speed);
    return this.elapsedDays;
  }
  toggle() { this.running = !this.running; return this.running; }
  update(deltaSeconds) {
    if (!this.running) return;
    this.elapsedDays += (deltaSeconds * this.speed) / 24;
    this.onTick(this.elapsedDays, this.speed);
  }
  reset() { this.setDays(0); }
}
