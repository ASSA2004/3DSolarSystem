export function recommendLite(device = globalThis.navigator ?? {}) {
  return (
    (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4) ||
    (device.deviceMemory > 0 && device.deviceMemory <= 4)
  );
}
// A sustained sample avoids a recommendation caused by initial shader compilation.
export class FrameSampler {
  constructor() {
    this.reset();
  }
  reset() {
    this.frames = 0;
    this.seconds = 0;
    this.warmup = 3;
  }
  sample(delta) {
    if (delta <= 0 || delta > 1) return false;
    if (this.warmup > 0) {
      this.warmup -= delta;
      return false;
    }
    this.frames++;
    this.seconds += delta;
    if (this.seconds < 5) return false;
    const slow = this.frames / this.seconds < 40;
    this.frames = 0;
    this.seconds = 0;
    return slow;
  }
}
