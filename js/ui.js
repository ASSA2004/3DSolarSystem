import { PLANETS } from "./data/planets.js";
import { getDifficulty } from "./data/learning.js";

const $ = selector => document.querySelector(selector);
export function renderSections() {
  $("#planet-sections").innerHTML = PLANETS.map((planet, index) => `
    <section id="${planet.id}" class="planet-section">
      <div class="planet-visual"><img src="images/${planet.id === "sun" ? "Sun" : planet.name}.png" alt="Illustration of ${planet.name}"></div>
      <div class="planet-copy">
        <p class="eyebrow">${String(index + 1).padStart(2, "0")} · ${planet.type === "star" ? "Our star" : "Planet"}</p>
        <div class="planet-header"><h2>${planet.name}</h2><p class="facts">Diameter: ${planet.diameter} · Distance: ${planet.distance} · Day: ${planet.day}</p></div>
        <div class="planet-description"><p>${planet.description}</p></div>
      </div>
    </section>`).join("");
}

const formatSpeed = hours => hours >= 8760 ? "1 year/sec" : hours >= 24 ? `${Math.round(hours / 24)} day${hours >= 48 ? "s" : ""}/sec` : `${hours} hour${hours === 1 ? "" : "s"}/sec`;
const formatYears = days => days >= 365 ? `${(days / 365.25).toFixed(days >= 3650 ? 0 : 1)} years` : `${Math.floor(days)} days`;

export function createUI({ onSelect, onLabels, onScale, onHelp, onExit, onTour, onQuiz, onCompare, onToggleControl, onTimeToggle, onTimeSpeed, onTimeReset, onTimeDay, onDifficulty }) {
  const card = $("#planet-card");
  const timePlay = $("#time-play");
  const timeReset = $("#time-reset");
  const timeDay = $("#time-day");
  const timeApply = $("#time-apply");
  const timeDock = $("#time-dock");
  const timeToggle = $("#time-toggle");
  PLANETS.forEach(planet => {
    // Planet meshes dispatch their id through the scene callback.
  });
  $("#labels-button").addEventListener("click", onLabels);
  $("#scale-button").addEventListener("click", onScale);
  $("#help-button").addEventListener("click", onHelp);
  $("#compare-button").addEventListener("click", onCompare);
  $("#exit-button").addEventListener("click", onExit);
  $("#toggle-control").addEventListener("click", () => {
    const orbitMode = onToggleControl();
    $("#toggle-control").textContent = orbitMode ? "Switch to WASD" : "Switch to Orbit";
  });
  $("#tour-button").addEventListener("click", onTour);
  $("#quiz-button").addEventListener("click", onQuiz);
  timePlay.addEventListener("click", () => {
    const running = onTimeToggle();
    timePlay.textContent = running ? "Pause" : "Play";
    timePlay.setAttribute("aria-label", running ? "Pause simulation" : "Play simulation");
  });
  timeReset.addEventListener("click", onTimeReset);
  timeToggle.addEventListener("click", () => {
    const expanded = !timeDock.classList.contains("is-expanded");
    timeDock.classList.toggle("is-expanded", expanded);
    timeToggle.setAttribute("aria-expanded", String(expanded));
    timeToggle.querySelector(".time-toggle__action").innerHTML = expanded ? "Hide controls <span aria-hidden=\"true\">⌃</span>" : "Time controls <span aria-hidden=\"true\">⌄</span>";
    $("#time-panel").hidden = !expanded;
  });
  const applyDay = () => onTimeDay(timeDay.value);
  timeApply.addEventListener("click", applyDay);
  timeDay.addEventListener("keydown", event => { if (event.key === "Enter") applyDay(); });
  $("#difficulty-level").addEventListener("change", event => onDifficulty(event.target.value));
  $("#time-speed").addEventListener("input", event => {
    onTimeSpeed(event.target.value);
    $("#time-speed-value").textContent = formatSpeed(Number(event.target.value));
  });
  document.querySelector("[data-close-help]").addEventListener("click", () => $("#help-panel").hidden = true);
  document.querySelector("[data-close-welcome]").addEventListener("click", () => $("#welcome-panel").hidden = true);
  document.querySelector("[data-start-exploring]").addEventListener("click", () => $("#welcome-panel").hidden = true);
  const hidePanels = (...panels) => panels.forEach(panel => { if (panel) panel.hidden = true; });
  const collapseTimeControls = () => {
    timeDock.classList.remove("is-expanded");
    timeToggle.setAttribute("aria-expanded", "false");
    timeToggle.querySelector(".time-toggle__action").innerHTML = "Time controls <span aria-hidden=\"true\">⌄</span>";
    $("#time-panel").hidden = true;
  };
  return {
    showPlanet(planet) {
      hidePanels($("#tour-panel"), $("#quiz-panel"), $("#compare-panel"), $("#help-panel"), $("#welcome-panel"));
      collapseTimeControls();
      card.hidden = false;
      card.innerHTML = `<button class="close-button" data-close-card aria-label="Close planet information">×</button>
        <p class="eyebrow">Planet profile · <span data-card-day>Day 0</span></p><h2>${planet.name}</h2><p>${planet.description}</p>
        <div class="planet-card__facts"><div><small>Diameter</small><strong>${planet.diameter}</strong></div><div><small>Distance</small><strong>${planet.distance}</strong></div><div><small>Day length</small><strong>${planet.day}</strong></div><div><small>Orbital period</small><strong>${planet.orbital}</strong></div><div><small>Moons</small><strong>${planet.moons}</strong></div><div><small>Axial tilt</small><strong>${planet.tilt}°</strong></div></div>
        <div class="planet-card__guide"><p class="eyebrow">Why this world matters</p><p>${planet.tour}</p></div>
        <p class="planet-card__wow">✦ ${planet.wow}</p><button class="button button--small button--ghost" data-back-view>Back to full view</button>`;
      card.querySelector("[data-close-card]").addEventListener("click", () => { card.hidden = true; onSelect(null); });
      card.querySelector("[data-back-view]").addEventListener("click", () => { card.hidden = true; onSelect(null); });
    },
    closePanels() { card.hidden = true; $("#tour-panel").hidden = true; $("#quiz-panel").hidden = true; $("#compare-panel").hidden = true; },
    setElapsed(days) {
      const wholeDay = Math.floor(days);
      $("#elapsed-time").textContent = `Day ${wholeDay.toLocaleString()} · ${formatYears(days)}`;
      $("#time-toggle-label").textContent = `Day ${wholeDay.toLocaleString()}`;
      if (document.activeElement !== timeDay) timeDay.value = wholeDay;
      const cardDay = card.querySelector("[data-card-day]");
      if (cardDay) cardDay.textContent = `Day ${wholeDay.toLocaleString()}`;
    },
    setScaleLabel(trueDistance) { $("#scale-label").textContent = trueDistance ? "True-distance view" : "Compressed view"; $("#scale-button").textContent = trueDistance ? "Compressed view" : "True distances"; },
    showHelp() {
      hidePanels(card, $("#tour-panel"), $("#quiz-panel"), $("#compare-panel"), $("#welcome-panel"));
      collapseTimeControls();
      $("#help-panel").hidden = false;
    },
    setDifficulty(id) {
      const level = getDifficulty(id);
      $("#difficulty-level").value = level.id;
      $("#welcome-panel h2").textContent = level.copy.guideTitle;
      $("#welcome-panel > p:not(.eyebrow)").textContent = level.copy.guideBody;
    },
    showTour(html) {
      hidePanels(card, $("#quiz-panel"), $("#compare-panel"), $("#help-panel"), $("#welcome-panel"));
      collapseTimeControls();
      const panel = $("#tour-panel");
      panel.innerHTML = html;
      panel.hidden = false;
      return panel;
    },
    showQuiz(html) {
      hidePanels(card, $("#tour-panel"), $("#compare-panel"), $("#help-panel"), $("#welcome-panel"));
      collapseTimeControls();
      const panel = $("#quiz-panel");
      panel.innerHTML = html;
      panel.hidden = false;
      return panel;
    },
    showCompare() {
      hidePanels(card, $("#tour-panel"), $("#quiz-panel"), $("#help-panel"), $("#welcome-panel"));
      collapseTimeControls();
      const panel = $("#compare-panel");
      const options = PLANETS.filter(planet => planet.id !== "sun").map(planet => `<option value="${planet.id}">${planet.name}</option>`).join("");
      panel.innerHTML = `<button class="close-button" data-close-compare aria-label="Close comparison">×</button><p class="eyebrow">Compare worlds</p><h2>Two worlds, side by side</h2><div class="compare-selects"><label>World A<select data-compare-a>${options}</select></label><label>World B<select data-compare-b>${options}</select></label></div><div data-compare-result></div>`;
      panel.hidden = false;
      const update = () => {
        const first = PLANETS.find(planet => planet.id === panel.querySelector("[data-compare-a]").value);
        const second = PLANETS.find(planet => planet.id === panel.querySelector("[data-compare-b]").value);
        panel.querySelector("[data-compare-result]").innerHTML = `<div class="compare-grid"><div class="compare-cell"><small>Diameter</small><strong>${first.diameter}<br>${second.diameter}</strong></div><div class="compare-cell"><small>Day length</small><strong>${first.day}<br>${second.day}</strong></div><div class="compare-cell"><small>Distance</small><strong>${first.distance}<br>${second.distance}</strong></div><div class="compare-cell"><small>Orbital period</small><strong>${first.orbital}<br>${second.orbital}</strong></div></div>`;
      };
      panel.querySelectorAll("select").forEach(select => select.addEventListener("change", update));
      panel.querySelector("[data-close-compare]").addEventListener("click", () => panel.hidden = true);
      panel.querySelector("[data-compare-b]").value = "earth";
      if (panel.querySelector("[data-compare-a]").value === "earth") panel.querySelector("[data-compare-a]").value = "mercury";
      update();
      return panel;
    }
  };
}
