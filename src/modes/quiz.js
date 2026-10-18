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
    if (this.index >= QUIZ_QUESTIONS.length) this.active = false;
  }
  html() {
    if (!this.active)
      return (
        '<p class="eyebrow">CURIOSITY LOOKS GOOD ON YOU</p><h2 id="dialog-title">Journey complete.</h2><div class="quiz-score">' +
        this.score +
        "<span> / " +
        QUIZ_QUESTIONS.length +
        "</span></div><p>" +
        (this.score >= 6
          ? "You know your way around the neighbourhood."
          : "Every answer is a starting point for another discovery.") +
        '</p><button class="button primary" data-action="quiz-restart">Explore the questions again ' +
        icon("reset") +
        "</button>"
      );
    const q = QUIZ_QUESTIONS[this.index];
    return (
      '<p class="eyebrow">KNOW YOUR NEIGHBOURHOOD · ' +
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
            ? "Exactly right."
            : "A new thing to know: " + this.feedback.answer + ".") +
          "</strong><p>" +
          q.hint +
          '</p></div><button class="button primary" data-action="quiz-next">' +
          (this.index === QUIZ_QUESTIONS.length - 1
            ? "See your result"
            : "Next question") +
          icon("arrow") +
          "</button>"
        : "<details><summary>A little hint</summary><p>" +
          q.hint +
          "</p></details>")
    );
  }
}
