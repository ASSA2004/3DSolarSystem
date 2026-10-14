import { PLANETS } from "./data/planets.js";
export class Tour {
  constructor({ flyTo, ui }) { this.flyTo = flyTo; this.ui = ui; this.index = 0; this.active = false; }
  start() { this.active = true; this.index = 0; this.render(); }
  render() {
    const planet = PLANETS[this.index];
    this.flyTo(planet.id);
    const panel = this.ui.showTour(`<button class="close-button" data-close-tour aria-label="Close tour">×</button><p class="eyebrow">Guided tour · ${this.index + 1}/${PLANETS.length}</p><h2>${planet.name}</h2><p>${planet.tour}</p><div class="tour-panel__actions"><button class="button button--small button--ghost" data-tour-prev>Previous</button><button class="button button--small" data-tour-next>${this.index === PLANETS.length - 1 ? "Finish" : "Next"}</button><button class="button button--small button--ghost" data-tour-skip>Skip tour</button><button class="button button--small button--ghost" data-tour-speak>🔊 Narrate</button></div>`);
    panel.querySelector("[data-tour-prev]").disabled = this.index === 0;
    panel.querySelector("[data-tour-prev]").addEventListener("click", () => { if (this.index) { this.index--; this.render(); }});
    panel.querySelector("[data-tour-next]").addEventListener("click", () => { if (this.index === PLANETS.length - 1) this.stop(); else { this.index++; this.render(); }});
    panel.querySelector("[data-tour-skip]").addEventListener("click", () => this.stop());
    panel.querySelector("[data-close-tour]").addEventListener("click", () => this.stop());
    panel.querySelector("[data-tour-speak]").addEventListener("click", () => {
      if ("speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(`${planet.name}. ${planet.tour}`)); }
    });
  }
  stop() { this.active = false; document.querySelector("#tour-panel").hidden = true; if ("speechSynthesis" in window) speechSynthesis.cancel(); }
}
