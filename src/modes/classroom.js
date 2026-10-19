import lessonData from "../data/lessons.json";
import copy from "../i18n/en.json";
const lessons = lessonData.map((lesson) => ({
  ...lesson,
  title: copy[lesson.title],
  curriculum: copy[lesson.curriculum],
  steps: lesson.steps.map((step) => ({
    ...step,
    title: copy[step.title],
    question: copy[step.question],
    explanation: copy[step.explanation],
  })),
}));
import { readSetting } from "../utils/storage.js";
export { lessons };
export function classroomHTML() {
  const progress = readSetting("progress", { attempts: 0, best: 0 });
  return `<p class="eyebrow">LEARN TOGETHER</p><h2 id="dialog-title">Choose an activity</h2><p>Teachers can lead a short lesson. Students can explore and check what they have learned.</p><h3>Teacher · Guided lessons</h3><div class="lesson-list">${lessons.map((l) => `<button class="lesson-choice" data-lesson="${l.id}"><strong>${l.title}</strong><span>About ${l.minutes} minutes · ${l.steps.length} steps</span></button>`).join("")}</div><h3>Student · Check your understanding</h3><p>${progress.attempts ? `Completed quizzes: ${Number(progress.attempts)}. Best score: ${Number(progress.best)} / 8.` : "Try eight questions. Each answer includes an explanation."}</p><button class="button primary" data-action="quiz">Start quiz</button> <button class="text-button" data-action="reset-progress">Reset saved progress</button><p class="data-note">Progress stays on this device. No name or account is needed.</p><h3>See the distances</h3><button class="button secondary" data-action="journey">Start Scale Journey</button><p>A short flight with real distances and a sunlight travel-time counter.</p>`;
}
export function lessonHTML(lesson, index, locked) {
  const step = lesson.steps[index];
  return `<div class="lesson-top"><span class="eyebrow">TEACHER · STEP ${index + 1} OF ${lesson.steps.length}</span><button class="text-button" data-action="end-lesson">End lesson</button></div><h2 tabindex="-1" id="lesson-title">${step.title}</h2><p>${step.question}</p><details><summary>Show explanation</summary><p>${step.explanation}</p></details><div class="lesson-actions"><button class="button secondary" data-action="lesson-back" ${index === 0 ? "disabled" : ""}>Previous</button><button class="button primary" data-action="lesson-next">${index === lesson.steps.length - 1 ? "Finish lesson" : "Next step"}</button></div><label class="settings-row">Keep focus on this planet<input type="checkbox" id="focus-lock" ${locked ? "checked" : ""}></label><details><summary>Teacher notes and source</summary><p>${lesson.curriculum}</p><a class="source-link" href="${lesson.source}" target="_blank" rel="noopener">Read the source</a><p>Read the question aloud. Give students time to discuss before showing the explanation.</p></details>`;
}
