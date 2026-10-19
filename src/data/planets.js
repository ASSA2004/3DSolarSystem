import { BODIES } from "./catalog.js";
import questions from "./questions.json";
import copy from "../i18n/en.json";
export const PLANETS = BODIES;
export const getPlanet = (id) => PLANETS.find((body) => body.id === id);
export const QUIZ_QUESTIONS = questions.map((question) => ({
  ...question,
  question: copy[question.question],
  hint: copy[question.hint],
}));
