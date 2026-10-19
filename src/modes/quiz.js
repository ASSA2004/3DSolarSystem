import { readSetting, saveSetting } from "../utils/storage.js";
import { QUIZ_QUESTIONS } from "../data/planets.js";
import { icon } from "../ui/icons.js";
export class Quiz {
  constructor() {
    this.reset();
  }
  reset() {
    this.index = 0;
    this.score = 0;
    this.feedback = null;
    this.active = true;
  }
  answer(value) {
    if (!this.active || this.feedback || this.index >= QUIZ_QUESTIONS.length)
      return;
    const question = QUIZ_QUESTIONS[this.index];
    const correct = value === question.answer;
    if (correct) this.score++;
    this.feedback = { correct, answer: question.answer, hint: question.hint };
  }
  next() {
    if (!this.feedback) return;
    this.index++;
    this.feedback = null;
    if (this.index >= QUIZ_QUESTIONS.length) {
      this.active = false;
      const progress = readSetting("progress", { attempts: 0, best: 0 });
      this.saved = saveSetting("progress", {
        attempts: Number(progress.attempts || 0) + 1,
        best: Math.max(Number(progress.best || 0), this.score),
        last: this.score,
      });
    }
  }
  html() {
    if (!this.active)
      return (
        '<p class="eyebrow">QUIZ RESULTS</p><h2 id="dialog-title">You finished the quiz.</h2><div class="quiz-score">' +
        this.score +
        "<span> / " +
        QUIZ_QUESTIONS.length +
        "</span></div><p>" +
        (this.score >= 6
          ? "You answered most questions correctly. Read the explanations to review what you learned."
          : "Try exploring the planets, then take the quiz again. You can learn from each explanation.") +
        '</p><button class="button primary" data-action="quiz-restart">Explore the questions again ' +
        icon("reset") +
        "</button>"
      );
    const q = QUIZ_QUESTIONS[this.index];
    return (
      '<p class="eyebrow">CHECK WHAT YOU LEARNED · ' +
      (this.index + 1) +
      " / " +
      QUIZ_QUESTIONS.length +
      '</p><h2 id="dialog-title">' +
      q.question +
      '</h2><div class="quiz-answers">' +
      q.options
        .map(
          (option, i) =>
            '<button class="quiz-answer' +
            (this.feedback && option === q.answer ? " correct" : "") +
            '" data-answer="' +
            option +
            '"' +
            (this.feedback ? " disabled" : "") +
            "><span>0" +
            (i + 1) +
            "</span>" +
            option +
            "</button>",
        )
        .join("") +
      "</div>" +
      (this.feedback
        ? '<div class="quiz-feedback" role="status"><strong>' +
          (this.feedback.correct
            ? "Correct."
            : "The correct answer is " + this.feedback.answer + ".") +
          "</strong><p>" +
          q.hint +
          '</p></div><button class="button primary" data-action="quiz-next">' +
          (this.index === QUIZ_QUESTIONS.length - 1
            ? "See your result"
            : "Next question") +
          icon("arrow") +
          "</button>"
        : "<details><summary>Show a hint</summary><p>" +
          q.hint +
          "</p></details>")
    );
  }
}
