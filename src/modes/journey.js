import { keplerPosition } from "../utils/orbits.js";
import { lightMinutes, AU_KM } from "../utils/physics.ts";
export class ScaleJourney {
  constructor(days) {
    this.target = keplerPosition("neptune", days);
    this.distance = Math.hypot(this.target.x, this.target.y, this.target.z);
    this.progress = 0;
    this.playing = false;
  }
  update(delta) {
    if (this.playing) {
      this.progress = Math.min(1, this.progress + delta / 60);
      if (this.progress === 1) this.playing = false;
    }
  }
  seek(value) {
    this.progress = Math.min(1, Math.max(0, Number(value) || 0));
  }
  get au() {
    return this.distance * this.progress;
  }
  get minutes() {
    return lightMinutes(this.au);
  }
  get km() {
    return this.au * AU_KM;
  }
}
export function journeyHTML() {
  return `<div class="lesson-top"><span class="eyebrow">SUN TO NEPTUNE</span><button class="text-button" data-action="end-journey">End journey</button></div><h2>How far does light travel?</h2><p>Real distances and planet sizes. Labels help you find planets that are too small to see.</p><div class="journey-readouts"><div><strong id="journey-au">0 AU</strong><span>Distance from the Sun</span></div><div><strong id="journey-time">0 min</strong><span>Time taken by light</span></div></div><label for="journey-seek">Move along the journey</label><input id="journey-seek" type="range" min="0" max="1" step="0.001" value="0"><button class="button primary" data-action="journey-play">Play journey</button><p id="journey-place" role="status">Start at the Sun.</p><p class="data-note">This demonstration takes 60 seconds. Light takes much longer. The date stays fixed. The route heads toward Neptune; other planets are not lined up along it.</p>`;
}
