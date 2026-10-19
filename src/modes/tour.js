import { translate, currentLanguage } from "../i18n/index.js";
import { BODIES } from "../data/catalog.js";
export const CHAPTER_DURATION = 22;
export class Tour {
  constructor(onChapter, onFinish) {
    this.onChapter = onChapter;
    this.onFinish = onFinish;
    this.elapsed = 0;
    this.playing = false;
    this.narrating = false;
    this.lastIndex = -1;
  }
  get duration() {
    return BODIES.length * CHAPTER_DURATION;
  }
  get index() {
    return Math.min(
      BODIES.length - 1,
      Math.floor(this.elapsed / CHAPTER_DURATION),
    );
  }
  start() {
    if (this.elapsed >= this.duration) this.elapsed = 0;
    this.playing = true;
    const unchanged = this.lastIndex === this.index;
    this.syncChapter();
    if (unchanged && this.narrating) this.speak();
  }
  update(delta) {
    if (!this.playing) return;
    this.elapsed = Math.min(this.duration, this.elapsed + delta);
    this.syncChapter();
    if (this.elapsed >= this.duration) {
      this.playing = false;
      this.cancelSpeech();
      this.onFinish();
    }
  }
  syncChapter(force = false) {
    if (force || this.index !== this.lastIndex) {
      this.lastIndex = this.index;
      this.onChapter(BODIES[this.index], this.index);
      if (this.narrating && this.playing) this.speak();
    }
  }
  toggle() {
    if (this.playing) {
      this.playing = false;
      this.cancelSpeech();
    } else this.start();
    return this.playing;
  }
  seek(seconds) {
    this.elapsed = Math.max(0, Math.min(this.duration, Number(seconds) || 0));
    this.cancelSpeech();
    this.syncChapter(true);
    if (this.elapsed === this.duration) {
      this.playing = false;
      this.onFinish();
    }
  }
  chapter(index) {
    this.seek(
      Math.max(0, Math.min(BODIES.length - 1, index)) * CHAPTER_DURATION,
    );
  }
  setNarration(value) {
    this.narrating = value;
    if (value && this.playing) this.speak();
    else this.cancelSpeech();
  }
  speak() {
    if (!("speechSynthesis" in window)) return;
    this.cancelSpeech();
    const body = BODIES[this.index];
    const utterance = new SpeechSynthesisUtterance(
      translate(body.name) + ". " + translate(body.tour),
    );
    utterance.lang = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" }[
      currentLanguage()
    ];
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
  }
  cancelSpeech() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  stop() {
    this.playing = false;
    this.cancelSpeech();
  }
}
