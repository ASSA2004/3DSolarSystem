import { PLANETS } from "./data/planets.js";
import { SolarScene } from "./scene.js?v=5";
import { TimeController } from "./timeController.js";
import { renderSections, createUI } from "./ui.js";
import { Tour } from "./tour.js";
import { Quiz } from "./quiz.js";

renderSections();
const container = document.querySelector("#threejs-container");
const progress = document.querySelector("#loading-progress");
const loadingLabel = document.querySelector("#loading-label");
let scene;
const time = new TimeController((days, speed) => { scene?.tickSimulation(days); ui?.setElapsed(days); });
const ui = createUI({
  onSelect: (planet, mesh) => { if (planet) ui.showPlanet(planet); },
  onLabels: () => { scene.setLabels(!scene.labelsVisible); },
  onScale: () => { scene.setScale(!scene.trueDistance); ui.setScaleLabel(scene.trueDistance); },
  onHelp: () => ui.showHelp(),
  onExit: () => deactivate3D(),
  onTour: () => tour.start(),
  onQuiz: () => quiz.start(),
  onCompare: () => ui.showCompare(),
  onToggleControl: () => scene.controls.toggle(),
  onTimeToggle: () => time.toggle(),
  onTimeSpeed: value => time.setSpeed(value),
  onTimeReset: () => time.reset(),
  onTimeDay: value => time.setDays(value)
});
const tour = new Tour({ flyTo: id => scene.flyTo(id), ui });
const quiz = new Quiz(ui, () => {});
scene = new SolarScene({ mount: document.querySelector("#scene-mount"), onLoad: value => { progress.style.width = `${value}%`; loadingLabel.textContent = `${value}%`; if (value >= 100) document.querySelector("#loading-screen").classList.add("is-ready"); }, onSelect: planet => { ui.showPlanet(planet); quiz.handlePlanet(planet); } });
scene.onTick = delta => { time.update(delta); scene.updateTween(delta); };

let active = false;
function activate3D() { if (active) return; active = true; container.classList.add("active"); container.setAttribute("aria-hidden", "false"); document.body.classList.add("explorer-open"); scene.setActive(true); }
function deactivate3D() { if (!active) return; active = false; container.classList.remove("active"); container.setAttribute("aria-hidden", "true"); document.body.classList.remove("explorer-open"); scene.setActive(false); ui.closePanels(); }
const trigger = document.querySelector("#activation-trigger");
const isTriggerVisible = () => {
  const bounds = trigger.getBoundingClientRect();
  return bounds.top < innerHeight && bounds.bottom > 0;
};
const updateExplorerVisibility = () => {
  if (isTriggerVisible()) activate3D();
  else if (trigger.getBoundingClientRect().top > 0) deactivate3D();
};
new IntersectionObserver(updateExplorerVisibility, { threshold: 0, rootMargin: "0px 0px -5% 0px" }).observe(trigger);
addEventListener("scroll", updateExplorerVisibility, { passive: true });
document.querySelector("#enter-3d-button").addEventListener("click", activate3D);
addEventListener("keydown", event => {
  if (event.key === "Escape") deactivate3D();
  if (!active) return;
  if (event.key.toLowerCase() === "l") scene.setLabels(!scene.labelsVisible);
  if (event.key.toLowerCase() === "t") tour.start();
  if (event.code === "Space") { event.preventDefault(); document.querySelector("#time-play").click(); }
});
