import test from "node:test";
import assert from "node:assert/strict";
import {
  AU_KM,
  lightMinutes,
  orbitalAngle,
  orbitProgress,
  orbitalSpeed,
  positionAu,
  separationAu,
  validDays,
} from "../js/physics.ts";
import { TimeController } from "../js/timeController.js";
import { Quiz } from "../js/quiz.js";
import { Tour } from "../js/tour.js";
import { BODIES, bodyById } from "../js/data/catalog.js";
import { QUIZ_QUESTIONS } from "../js/data/planets.js";

const close = (a, b, tolerance = 1e-8) =>
  assert.ok(Math.abs(a - b) < tolerance, a + " ≈ " + b);
test("Earth returns to its starting point after a year and is opposite after half a year", () => {
  const earth = bodyById("earth"),
    start = positionAu(earth, 0),
    full = positionAu(earth, earth.orbitalDays),
    half = positionAu(earth, earth.orbitalDays / 2);
  close(start.x, full.x);
  close(start.z, full.z);
  close(start.x, -half.x);
  close(start.z, -half.z);
  close(orbitProgress(earth, earth.orbitalDays / 2), 0.5);
});
test("all circular orbits preserve their mean radius across time jumps", () => {
  for (const body of BODIES)
    for (const day of [0, 0.5, 500, 1000000]) {
      const p = positionAu(body, day);
      close(Math.hypot(p.x, p.z), body.distanceAu);
      assert.ok(Number.isFinite(orbitalAngle(body, day)));
    }
});
test("distance is symmetric, zero for the same body, and bounded by orbital radii", () => {
  for (const a of BODIES)
    for (const b of BODIES) {
      const d = separationAu(a, b, 1234);
      close(d, separationAu(b, a, 1234));
      assert.ok(d <= a.distanceAu + b.distanceAu + 1e-8);
      assert.ok(d >= Math.abs(a.distanceAu - b.distanceAu) - 1e-8);
    }
  close(separationAu(bodyById("earth"), bodyById("earth"), 500), 0);
});
test("units yield the expected Earth-Sun light time and approximate circular speed", () => {
  assert.equal(AU_KM, 149597870.7);
  close(lightMinutes(1), 8.316746, 0.00001);
  close(orbitalSpeed(1, 365.25), 29.785, 0.001);
  assert.equal(orbitalSpeed(0, 0), 0);
});
test("clock obeys pause, precise day jumps, reset, and bounded input", () => {
  const time = new TimeController();
  time.update(1);
  assert.equal(time.elapsedDays, 1);
  time.toggle();
  time.update(999);
  assert.equal(time.elapsedDays, 1);
  assert.equal(time.setDays(182.625), true);
  assert.equal(time.elapsedDays, 182.625);
  for (const value of ["", null, "abc", -1, Infinity, 1000001]) {
    assert.equal(validDays(value), null);
    assert.equal(time.setDays(value), false);
  }
  assert.equal(time.elapsedDays, 182.625);
  time.reset();
  assert.equal(time.elapsedDays, 0);
  assert.equal(time.running, false);
  time.toggle();
  time.setSpeed(1);
  time.update(24);
  close(time.elapsedDays, 1);
  time.setSpeed(-5);
  assert.equal(time.speed, 1);
});
test("quiz locks each answer and safely handles input after completion", () => {
  const quiz = new Quiz();
  for (const question of QUIZ_QUESTIONS) {
    quiz.answer(question.answer);
    const score = quiz.score;
    quiz.answer(question.answer);
    assert.equal(quiz.score, score);
    quiz.next();
  }
  assert.equal(quiz.active, false);
  assert.equal(quiz.score, QUIZ_QUESTIONS.length);
  assert.doesNotThrow(() => quiz.answer("Earth"));
  assert.match(quiz.html(), /Journey complete/);
  quiz.reset();
  assert.equal(quiz.score, 0);
  assert.equal(quiz.index, 0);
});
test("video pause, seeking, finish, and replay preserve valid chapter indices", () => {
  globalThis.window = {};
  const seen = [];
  let finished = 0;
  const tour = new Tour(
    (body, index) => seen.push(index),
    () => finished++,
  );
  tour.start();
  assert.equal(tour.index, 0);
  tour.update(23);
  assert.equal(tour.index, 1);
  tour.toggle();
  const at = tour.elapsed;
  tour.update(10);
  assert.equal(tour.elapsed, at);
  tour.seek(88);
  assert.equal(tour.index, 4);
  tour.start();
  tour.update(1000);
  assert.equal(finished, 1);
  assert.equal(tour.playing, false);
  assert.equal(tour.index, 8);
  tour.start();
  assert.equal(tour.elapsed, 0);
  assert.equal(tour.index, 0);
  assert.ok(seen.every((i) => i >= 0 && i < BODIES.length));
  delete globalThis.window;
});
