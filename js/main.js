import { BODIES, bodyById } from "./data/catalog.js";
import { TimeController } from "./timeController.js";
import { Tour } from "./tour.js";
import { Quiz } from "./quiz.js";
import { icon } from "./icons.js";
import {
  homeHTML,
  shellHTML,
  inspectorHTML,
  helpHTML,
  aboutHTML,
  fmt,
} from "./ui.js";
import { separationAu, lightMinutes, orbitProgress, AU_KM } from "./physics.ts";

const $ = (selector) => document.querySelector(selector);
const app = $("#app");
app.innerHTML = homeHTML() + shellHTML();
const time = new TimeController();
const quiz = new Quiz();
const state = {
  mode: "normal",
  selected: null,
  tab: "profile",
  compare: "mars",
  quality: "auto",
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  labels: true,
  scale: false,
  captions: true,
  open: false,
};
let scene,
  scenePromise,
  lastOpener,
  dialogOpener,
  dialogPaused,
  uiElapsed = 0,
  loadingError = false;
const announce = (text) => {
  $("#announcer").textContent = text;
};
const chapterTitles = [
  "The light at the center.",
  "Close to the fire.",
  "Beauty under pressure.",
  "A small, blue home.",
  "Stories in the dust.",
  "A world of its own.",
  "The art of a ring.",
  "A different kind of world.",
  "Beyond the familiar.",
];
const tour = new Tour(
  (body, index) => {
    state.selected = body.id;
    scene?.focus(body.id);
    $("#chapter-number").textContent =
      "CHAPTER " + String(index + 1).padStart(2, "0") + " / 09";
    $("#chapter-title").textContent = chapterTitles[index];
    $("#chapter-caption").textContent = body.tour;
    document
      .querySelectorAll("[data-chapter]")
      .forEach((button) =>
        button.setAttribute(
          "aria-current",
          String(Number(button.dataset.chapter) === index),
        ),
      );
    const activeChapter = document.querySelector(
      '[data-chapter="' + index + '"]',
    );
    if (activeChapter && state.mode === "video")
      activeChapter.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    announce("Chapter " + (index + 1) + ": " + body.name);
  },
  () => {
    updatePlayback();
    announce("Journey complete. Play to watch again, or choose a chapter.");
  },
);

function renderInspector() {
  const expanded = $("#inspector").classList.contains("expanded");
  $("#inspector").innerHTML = inspectorHTML(
    state.selected,
    state.mode,
    state.tab,
    state.compare,
  );
  $("#inspector").classList.toggle("expanded", expanded && !!state.selected);
  const handle = $('[data-action="sheet"]');
  if (handle) {
    handle.setAttribute("aria-expanded", String(expanded));
    handle.setAttribute(
      "aria-label",
      expanded ? "Collapse planet information" : "Expand planet information",
    );
  }
  if ($("#day-input")) $("#day-input").value = time.elapsedDays.toFixed(2);
  updateReadouts();
}
function updateSelection() {
  const body = bodyById(state.selected);
  document
    .querySelectorAll("[data-planet]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.planet === (state.selected || "overview")),
      ),
    );
  $("#view-eyebrow").textContent = body
    ? String(body.index).padStart(2, "0") + " / " + body.category.toUpperCase()
    : "THE BIG PICTURE";
  $("#view-title").textContent = body ? body.name : "Our solar system";
  $("#view-description").textContent = body
    ? body.tagline
    : "A familiar star. Eight extraordinary worlds.";
  renderInspector();
}
function selectPlanet(id, shouldFocus = true) {
  state.selected = id === "overview" ? null : id;
  if (state.selected && !bodyById(state.selected)) return;
  if (shouldFocus) scene?.focus(state.selected);
  updateSelection();
  announce(
    state.selected
      ? bodyById(state.selected).name + " selected."
      : "Full solar system view.",
  );
}
async function ensureScene() {
  if (scenePromise) return scenePromise;
  $("#loading").hidden = false;
  loadingError = false;
  scenePromise = (async () => {
    const { SolarScene } = await import("./scene.js");
    scene = new SolarScene({
      mount: $("#scene-mount"),
      reducedMotion: state.reduced,
      onProgress: (value) => {
        if (!loadingError) {
          $("#load-progress").value = value;
          $("#load-message").textContent =
            "Gathering the worlds · " + value + "%";
        }
      },
      onSelect: (id) => selectPlanet(id),
      onFailure: (message) => showSceneError(message),
    });
    let timeout;
    const failed = await Promise.race([
      scene.ready,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                "Textures are taking longer than expected. Check your connection and try again.",
              ),
            ),
          30000,
        );
      }),
    ]).finally(() => clearTimeout(timeout));
    $("#loading").hidden = true;
    if (failed) {
      $("#scale-note").textContent =
        "Some textures could not load. Reload to retry.";
      announce(
        "Some textures could not load; the simulation is still available.",
      );
    }
    scene.setQuality(state.quality);
    scene.setLabels(state.labels);
    scene.setScale(state.scale);
    return scene;
  })().catch((error) => {
    console.error("Explorer initialization failed:", error);
    showSceneError(
      error.message || "The 3D scene could not start on this device.",
    );
    return null;
  });
  return scenePromise;
}
function showSceneError(message) {
  loadingError = true;
  $("#loading").hidden = false;
  $("#loading").innerHTML =
    '<div class="loading-orbit">' +
    icon("orbit") +
    '</div><p class="eyebrow">LET’S TRY THAT AGAIN</p><h2>Your observatory<br>needs a moment.</h2><p id="scene-error"></p><div class="error-actions"><button class="button primary" data-action="retry">Reload explorer</button><button class="button secondary" data-action="home">Return home</button></div>';
  $("#scene-error").textContent = message;
}
async function open(mode, planet = null) {
  lastOpener = document.activeElement;
  state.open = true;
  $(".skip-link").setAttribute("href", "#observatory");
  $("#home").hidden = true;
  $("#observatory").hidden = false;
  document.body.classList.add("explorer-open");
  if (planet) state.selected = planet;
  setMode(mode, false);
  $("#view-title").focus({ preventScroll: true });
  const instance = await ensureScene();
  if (!instance || !state.open) return;
  instance.setMode(state.mode);
  instance.start(frame);
  if (state.mode === "video") {
    tour.lastIndex = -1;
    tour.start();
  } else {
    if (state.mode === "details" && !state.selected) state.selected = "earth";
    selectPlanet(state.selected || "overview");
  }
  updatePlayback();
}
function home() {
  state.open = false;
  $(".skip-link").setAttribute("href", "#main");
  tour.stop();
  scene?.stop();
  if ($("#dialog").open) $("#dialog").close();
  $("#observatory").hidden = true;
  $("#home").hidden = false;
  document.body.classList.remove("explorer-open");
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  lastOpener?.focus({ preventScroll: true });
}
function setMode(mode, run = true) {
  if (!["normal", "details", "video"].includes(mode)) return;
  if (state.mode === "video" && mode !== "video") tour.stop();
  state.mode = mode;
  if (mode === "normal") $("#inspector").classList.remove("expanded");
  if (mode === "details" && innerWidth <= 650)
    $("#inspector").classList.add("expanded");
  $("#observatory").dataset.mode = mode;
  document
    .querySelectorAll("[data-mode]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)),
    );
  $("#cinema").hidden = mode !== "video";
  scene?.setMode(mode);
  if (mode === "details" && !state.selected) state.selected = "earth";
  if (mode === "video") {
    if (run && scene && !loadingError) {
      tour.lastIndex = -1;
      tour.start();
    }
  } else {
    if (run) scene?.focus(state.selected);
    updateSelection();
  }
  updatePlayback();
  announce(
    mode === "normal"
      ? "Normal view. Explore freely."
      : mode === "details"
        ? "Details view. Explore the field notes, time and distance, and comparisons."
        : "Video view. A cinematic journey through nine chapters.",
  );
}
function updatePlayback() {
  const running = time.running;
  const play = $('[data-action="pause"]');
  play.innerHTML = icon(running ? "pause" : "play");
  play.setAttribute(
    "aria-label",
    (running ? "Pause" : "Resume") + " simulation",
  );
  $(".simulation-status .status-dot").classList.toggle("paused", !running);
  const filmPlay = $('[data-action="tour-play"]');
  filmPlay.innerHTML = icon(tour.playing ? "pause" : "play");
  filmPlay.setAttribute(
    "aria-label",
    tour.playing
      ? "Pause video"
      : tour.elapsed >= tour.duration
        ? "Replay video"
        : "Play video",
  );
  if (scene) scene.cinematicPlaying = tour.playing;
  updateReadouts();
}
function frame(delta) {
  if ($("#dialog").open) {
    scene.tickSimulation(time.elapsedDays);
    return;
  }
  if (state.mode === "video") {
    tour.update(delta);
    if (tour.playing)
      time.elapsedDays = Math.min(1000000, time.elapsedDays + delta / 24);
  } else time.update(delta);
  scene.tickSimulation(time.elapsedDays);
  scene.cinematicPlaying = tour.playing;
  uiElapsed += delta;
  if (uiElapsed > 0.15) {
    updateReadouts();
    uiElapsed = 0;
  }
}
function updateReadouts() {
  document.querySelectorAll("[data-day]").forEach((el) => {
    el.textContent = fmt(time.elapsedDays, 2);
  });
  if ($("#elapsed-years")) {
    $("#elapsed-years").textContent = fmt(time.elapsedDays / 365.25, 3);
    const progress =
      orbitProgress(bodyById(state.selected), time.elapsedDays) * 100;
    $("#orbit-progress").textContent = fmt(progress, 1) + "%";
    $("#orbit-progress-bar").style.width = progress + "%";
    const a = bodyById($("#distance-from").value),
      b = bodyById($("#distance-to").value);
    const au = separationAu(a, b, time.elapsedDays);
    $("#distance-km").textContent = fmt((au * AU_KM) / 1e6, 3);
    $("#distance-au").textContent = fmt(au, 4) + " AU";
    $("#light-time").textContent = fmt(lightMinutes(au), 2) + " light-minutes";
  }
  if (state.mode === "video") {
    const clock = (seconds) =>
      Math.floor(seconds / 60) +
      ":" +
      String(Math.floor(seconds % 60)).padStart(2, "0");
    $("#film-time").textContent =
      clock(tour.elapsed) + " / " + clock(tour.duration);
    if (document.activeElement !== $("#film-seek"))
      $("#film-seek").value = tour.elapsed;
  }
}
function showDialog(html, kind) {
  const dialog = $("#dialog");
  if (!dialog.open) {
    dialogOpener = document.activeElement;
    dialogPaused = { running: time.running, video: tour.playing };
    time.running = false;
    tour.stop();
    updatePlayback();
  }
  dialog.dataset.kind = kind;
  $("#dialog-content").innerHTML = html;
  if (!dialog.open) dialog.showModal();
  $("#dialog-title").tabIndex = -1;
  $("#dialog-title").focus();
}
$("#dialog").addEventListener("close", () => {
  if (dialogPaused) {
    time.running = dialogPaused.running;
    if (state.open && dialogPaused.video && state.mode === "video")
      tour.start();
    updatePlayback();
  }
  dialogPaused = null;
  if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
});
app.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const d = button.dataset;
  if (d.open) return open(d.open);
  if (d.homePlanet) return open("normal", d.homePlanet);
  if (d.mode) return setMode(d.mode);
  if (d.planet) return selectPlanet(d.planet);
  if (d.detailTab) {
    state.tab = d.detailTab;
    renderInspector();
    $('[data-detail-tab="' + d.detailTab + '"]').focus();
    return;
  }
  if (d.chapter !== undefined) {
    tour.chapter(Number(d.chapter));
    updatePlayback();
    updateReadouts();
    return;
  }
  if (d.jump) {
    time.setDays(time.elapsedDays + Number(d.jump));
    scene?.tickSimulation(time.elapsedDays);
    updateReadouts();
    if ($("#day-input")) $("#day-input").value = time.elapsedDays.toFixed(2);
    return;
  }
  if (d.answer) {
    quiz.answer(d.answer);
    $("#dialog-content").innerHTML = quiz.html();
    $('[data-action="quiz-next"]')?.focus();
    return;
  }
  switch (d.action) {
    case "home":
      home();
      break;
    case "pause":
      time.toggle();
      updatePlayback();
      break;
    case "reset":
      time.reset();
      scene?.tickSimulation(0);
      updateReadouts();
      announce("Simulation reset to day zero.");
      break;
    case "overview":
      selectPlanet("overview");
      break;
    case "zoom-in":
      scene?.zoom(0.8);
      break;
    case "zoom-out":
      scene?.zoom(1.25);
      break;
    case "labels":
      state.labels = !state.labels;
      scene?.setLabels(state.labels);
      button.setAttribute("aria-pressed", String(state.labels));
      break;
    case "scale":
      state.scale = !state.scale;
      scene?.setScale(state.scale);
      document
        .querySelectorAll('[data-action="scale"]')
        .forEach((control) =>
          control.setAttribute("aria-pressed", String(state.scale)),
        );
      $("#scale-button-text").textContent = state.scale
        ? "Compressed distances"
        : "Proportional distances";
      $("#scale-note").textContent = state.scale
        ? "Distances proportional to AU · body sizes enlarged"
        : "Illustrative scale · sizes & distances compressed";
      announce(
        state.scale
          ? "Proportional orbital distances. Planet sizes remain enlarged."
          : "Compressed overview distances.",
      );
      break;
    case "help":
      showDialog(helpHTML(state.quality, state.reduced, state.scale), "help");
      break;
    case "about":
      showDialog(aboutHTML(), "about");
      break;
    case "close-dialog":
      $("#dialog").close();
      break;
    case "fullscreen":
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $("#observatory").requestFullscreen();
      } catch {
        announce("Fullscreen is not available in this browser.");
      }
      break;
    case "sheet": {
      const expanded = $("#inspector").classList.toggle("expanded");
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute(
        "aria-label",
        expanded ? "Collapse planet information" : "Expand planet information",
      );
      break;
    }
    case "tour-play":
      tour.toggle();
      updatePlayback();
      break;
    case "tour-prev":
      tour.chapter(tour.index - 1);
      updatePlayback();
      break;
    case "tour-next":
      tour.chapter(tour.index + 1);
      updatePlayback();
      break;
    case "narration":
      if (!("speechSynthesis" in window)) {
        announce(
          "Narration is not available in this browser. Captions are available.",
        );
        break;
      }
      tour.setNarration(!tour.narrating);
      button.innerHTML = icon(tour.narrating ? "volume" : "muted");
      button.setAttribute("aria-pressed", String(tour.narrating));
      button.setAttribute(
        "aria-label",
        tour.narrating ? "Disable narration" : "Enable narration",
      );
      break;
    case "captions":
      state.captions = !state.captions;
      $("#chapter-caption").hidden = !state.captions;
      button.setAttribute("aria-pressed", String(state.captions));
      break;
    case "quiz":
      quiz.reset();
      showDialog(quiz.html(), "quiz");
      break;
    case "quiz-next":
      quiz.next();
      $("#dialog-content").innerHTML = quiz.html();
      $("#dialog-title").tabIndex = -1;
      $("#dialog-title").focus();
      break;
    case "quiz-restart":
      quiz.reset();
      $("#dialog-content").innerHTML = quiz.html();
      $("#dialog-title").tabIndex = -1;
      $("#dialog-title").focus();
      break;
    case "retry":
      location.reload();
      break;
  }
});
app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.id === "speed") time.setSpeed(target.value);
  if (target.id === "compare-with") {
    state.compare = target.value;
    renderInspector();
    $("#compare-with").focus();
  }
  if (target.id === "quality") {
    state.quality = target.value;
    scene?.setQuality(state.quality);
  }
  if (target.id === "reduce-motion") {
    state.reduced = target.checked;
    if (scene) scene.reducedMotion = state.reduced;
  }
  if (target.id.startsWith("distance-")) updateReadouts();
});
app.addEventListener("input", (event) => {
  if (event.target.id === "film-seek") {
    tour.seek(event.target.value);
    updatePlayback();
    updateReadouts();
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id !== "day-form") return;
  event.preventDefault();
  if (time.setDays($("#day-input").value)) {
    $("#day-error").textContent = "";
    scene?.tickSimulation(time.elapsedDays);
    updateReadouts();
    announce("Simulation moved to day " + fmt(time.elapsedDays, 2));
  } else $("#day-error").textContent = "Enter a day between 0 and 1,000,000.";
});
addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if ($("#dialog").open) return;
    if ($("#inspector").classList.contains("expanded")) {
      $('[data-action="sheet"]')?.click();
      return;
    }
    if (state.open) home();
    return;
  }
  if (
    !state.open ||
    $("#dialog").open ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) ||
    event.target.isContentEditable
  )
    return;
  if (event.code === "Space" && !/BUTTON|A/.test(event.target.tagName)) {
    event.preventDefault();
    if (state.mode === "video") tour.toggle();
    else time.toggle();
    updatePlayback();
  }
  if (event.key.toLowerCase() === "l" && state.mode !== "video")
    $('[data-action="labels"]').click();
  if (event.key.toLowerCase() === "o" && state.mode !== "video")
    selectPlanet("overview");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && tour.playing) {
    tour.stop();
    updatePlayback();
  }
});
document.addEventListener("fullscreenchange", () => {
  $('[data-action="fullscreen"]').setAttribute(
    "aria-label",
    document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen",
  );
});
addEventListener("pagehide", () => {
  tour.stop();
  scene?.stop();
});
