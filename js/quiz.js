import { QUIZ_QUESTIONS } from "./data/planets.js";
export class Quiz {
  constructor(ui, onPlanetAnswer) { this.ui = ui; this.onPlanetAnswer = onPlanetAnswer; this.index = 0; this.score = 0; }
  start() { this.active = true; this.index = 0; this.score = 0; this.render(); }
  render() {
    if (this.index >= QUIZ_QUESTIONS.length) {
      const panel = this.ui.showQuiz(`<p class="eyebrow">Mission complete</p><h2>${this.score}/${QUIZ_QUESTIONS.length} correct</h2><p>${this.score >= 6 ? "Excellent orbital knowledge." : "Nice start — run the tour and try again."}</p><div class="tour-panel__actions"><button class="button button--small" data-quiz-restart>Try again</button><button class="button button--small button--ghost" data-quiz-close>Close</button></div>`);
      panel.querySelector("[data-quiz-restart]").addEventListener("click", () => this.start());
      panel.querySelector("[data-quiz-close]").addEventListener("click", () => { this.active = false; panel.hidden = true; });
      return;
    }
    const item = QUIZ_QUESTIONS[this.index];
    const panel = this.ui.showQuiz(`<button class="close-button" data-quiz-close aria-label="Close quiz">×</button><p class="eyebrow">Quiz · ${this.index + 1}/${QUIZ_QUESTIONS.length}</p><h2>${item.question}</h2><p>Choose an answer or click the matching planet in the scene.</p><div class="quiz-options">${item.options.map(option => `<button class="button button--ghost" data-answer="${option}">${option}</button>`).join("")}</div><p class="eyebrow" style="margin-top:1rem">Hint: ${item.hint}</p>`);
    panel.querySelectorAll("[data-answer]").forEach(button => button.addEventListener("click", () => this.answer(button.dataset.answer)));
    panel.querySelector("[data-quiz-close]").addEventListener("click", () => { this.active = false; panel.hidden = true; });
    this.onPlanetAnswer = planet => this.answer(planet.name.replace("The ", ""));
  }
  answer(value) { if (value === QUIZ_QUESTIONS[this.index].answer) this.score++; this.index++; this.render(); }
  handlePlanet(planet) { if (this.active && planet) this.answer(planet.name.replace("The ", "")); }
}
