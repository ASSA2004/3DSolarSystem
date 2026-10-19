import { test, expect } from "vitest";
import en from "../src/i18n/en.json";
import ta from "../src/i18n/ta.json";
import hi from "../src/i18n/hi.json";
import lessons from "../src/data/lessons.json";
import questions from "../src/data/questions.json";
test("language dictionaries have matching keys and complete guided learning text", () => {
  for (const dictionary of [ta, hi]) {
    expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
    for (const lesson of lessons)
      for (const step of lesson.steps)
        for (const field of ["title", "question", "explanation"]) {
          expect(dictionary[step[field]]).toBeTruthy();
          expect(dictionary[step[field]]).not.toBe(en[step[field]]);
        }
    for (const question of questions)
      for (const field of ["question", "hint"]) {
        expect(dictionary[question[field]]).not.toBe(en[question[field]]);
      }
  }
});
