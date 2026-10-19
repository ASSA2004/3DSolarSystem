import { setupLanguages } from "./i18n/index.js";
import { readSharedState, shareURL } from "./utils/share.js";
import { classroomHTML, lessonHTML, lessons } from "./modes/classroom.js";
import { ScaleJourney, journeyHTML } from "./modes/journey.js";
import { julianToDate } from "./utils/dates.js";
import { setupOffline } from "./core/offline.js";
import { readSetting, saveSetting } from "./utils/storage.js";
import { recommendLite } from "./core/quality.js";
import { textureURL } from "./utils/assets.js";
import { BODIES, bodyById } from "./data/catalog.js";
import { TimeController } from "./core/timeController.js";
import { Tour } from "./modes/tour.js";
import { Quiz } from "./modes/quiz.js";
import { icon } from "./ui/icons.js";
import {
  homeHTML,
  shellHTML,
  inspectorHTML,
  helpHTML,
  aboutHTML,
  fmt,
} from "./ui/templates.js";
import {
  separationAu,
  lightMinutes,
  orbitProgress,
  AU_KM,
} from "./utils/physics.ts";

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
  quality: ["auto", "low", "high"].includes(readSetting("quality"))
    ? readSetting("quality")
    : "auto",
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  labels: true,
  scale: false,
  captions: true,
  open: false,
};
app.insertAdjacentHTML(
  "beforeend",
  `<aside id="lite-offer" class="lite-offer" hidden aria-label="Graphics suggestion"><p><strong>Need smoother movement?</strong><br>Lite Mode uses simpler graphics. All planet facts remain available.</p><button class="button primary" data-action="lite">Use Lite Mode</button><button class="text-button" data-action="dismiss-lite">Keep current graphics</button></aside>`,
);
let liteDismissed = false;
function offerLite() {
  if (!liteDismissed && state.quality !== "low")
    $("#lite-offer").hidden = false;
}
if (recommendLite() && !readSetting("quality")) offerLite();
app.insertAdjacentHTML(
  "beforeend",
  `<aside id="lesson-panel" class="learning-panel" hidden aria-label="Guided lesson"></aside><aside id="journey-panel" class="learning-panel" hidden aria-label="Scale Journey"></aside>`,
);
let activeLesson = null,
  lessonIndex = 0,
  focusLocked = true,
  journey = null,
  learningSnapshot = null;
let releaseTimer;
let scene,
  scenePromise,
  lastOpener,
  dialogOpener,
  dialogPaused,
  uiElapsed = 0,
  loadingError = false,
  textureWarning = false;
const announce = (text) => {
  $("#announcer").textContent = text;
};
const chapterTitles = [
  "The Sun: our star",
  "Mercury: closest to the Sun",
  "Venus: the hottest planet",
  "Earth: our home",
  "Mars: the red planet",
  "Jupiter: the largest planet",
  "Saturn: a planet with rings",
  "Uranus: a tilted planet",
  "Neptune: farthest from the Sun",
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
    : "Our star and eight planets.";
  renderInspector();
}
function selectPlanet(id, shouldFocus = true) {
  if (
    activeLesson &&
    focusLocked &&
    id !== activeLesson.steps[lessonIndex].planet
  ) {
    announce(
      "Focus is locked for this lesson step. Uncheck Keep focus to explore another planet.",
    );
    return;
  }
  if (journey) return;
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
  // Begin textures alongside the lazy engine download, only after entering 3D.
  for (const body of BODIES) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = textureURL(body.texture, state.quality === "low");
  }
  scenePromise = (async () => {
    const { SolarScene } = await import("./core/scene.js");
    scene = new SolarScene({
      mount: $("#scene-mount"),
      quality: state.quality,
      onSlow: offerLite,
      reducedMotion: state.reduced,
      onProgress: (value) => {
        if (!loadingError && $("#load-progress")) {
          $("#load-progress").value = value;
          $("#load-message").textContent = "Loading planets · " + value + "%";
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
    textureWarning = Boolean(failed);
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
  $("#lite-offer").hidden = true;
  $("#loading").hidden = false;
  $("#loading").innerHTML =
    '<div class="loading-orbit">' +
    icon("orbit") +
    '</div><p class="eyebrow">YOU CAN STILL LEARN</p><h2>3D is unavailable on this device.</h2><p id="scene-error"></p><div class="error-actions"><button class="button primary" data-action="flat-view">Use 2D classroom view</button><button class="button primary" data-action="retry">Reload explorer</button><button class="button secondary" data-action="home">Return home</button></div>';
  $("#scene-error").textContent = message;
}
async function open(mode, planet = null) {
  clearTimeout(releaseTimer);
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
  updateScaleNote();
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
  endLearning();
  state.open = false;
  releaseTimer = setTimeout(() => {
    if (!state.open) {
      scene?.dispose();
      scene = null;
      scenePromise = null;
    }
  }, 60000);
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
  if ((activeLesson || journey) && mode !== "normal") endLearning();
  if (!["normal", "details", "video"].includes(mode)) return;
  if (state.mode === "video" && mode !== "video") tour.stop();
  state.mode = mode;
  if (mode === "normal") $("#inspector").classList.remove("expanded");
  if (mode === "details" && innerWidth <= 650)
    $("#inspector").classList.add("expanded");
  $("#observatory").dataset.mode = mode;
  document
    .querySelectorAll("button[data-mode]")
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
  document
    .querySelectorAll(
      '[data-action="pause"], [data-action="reset"], [data-action="scale"], #speed',
    )
    .forEach((control) => {
      control.disabled = Boolean(journey);
    });
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
    scene.tickSimulation(time.orbitalDays);
    return;
  }
  if (journey) {
    journey.update(delta);
    updateJourney();
  } else if (state.mode === "video") {
    tour.update(delta);
    if (tour.playing) time.advance(delta, 1);
  } else time.update(delta);
  scene.tickSimulation(time.orbitalDays);
  scene.cinematicPlaying = tour.playing;
  uiElapsed += delta;
  if (uiElapsed > 0.15) {
    updateReadouts();
    uiElapsed = 0;
  }
}
function updateScaleNote() {
  $("#scale-button-text").textContent = state.scale
    ? "Compressed distances"
    : "True scale";
  if (!loadingError)
    $("#scale-note").textContent = textureWarning
      ? "Some textures could not load. Reload to retry."
      : state.scale
        ? "True scale · labels mark tiny planets"
        : "Illustrative scale · sizes & distances compressed";
}
function updateReadouts() {
  if ($("#current-date"))
    $("#current-date").textContent =
      julianToDate(time.julianDate).toISOString().slice(0, 10) + " UTC";
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
    const au = separationAu(a, b, time.orbitalDays);
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
  if (d.lesson) {
    const lesson = lessons.find((l) => l.id === d.lesson);
    if (!lesson) return;
    endLearning();
    learningSnapshot = {
      running: dialogPaused?.running ?? time.running,
      scale: state.scale,
    };
    if (dialogPaused) dialogPaused.running = false;
    $("#dialog").close();
    if (!state.open) await open("normal");
    else setMode("normal");
    activeLesson = lesson;
    lessonIndex = 0;
    focusLocked = true;
    time.running = false;
    renderLesson();
    updatePlayback();
    return;
  }
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
    scene?.tickSimulation(time.orbitalDays);
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
    case "share": {
      const url = shareURL(location.href, {
        planet: state.selected,
        date: julianToDate(time.julianDate).toISOString().slice(0, 10),
        scale: state.scale,
        view: state.mode,
      });
      history.pushState(null, "", url);
      showDialog(
        `<h2 id="dialog-title">Share this view</h2><p>This link keeps the planet, date and viewing mode.</p><label for="share-link">Link</label><input id="share-link" type="url" readonly><button class="button primary" data-action="copy-link">Copy link</button><p id="copy-status" role="status"></p>`,
        "share",
      );
      $("#share-link").value = url;
      break;
    }
    case "copy-link":
      try {
        await navigator.clipboard.writeText($("#share-link").value);
        $("#copy-status").textContent = "Link copied.";
      } catch {
        $("#share-link").select();
        $("#copy-status").textContent = "Select and copy the link above.";
      }
      break;
    case "classroom":
      showDialog(classroomHTML(), "classroom");
      break;
    case "reset-progress":
      showDialog(
        `<h2 id="dialog-title">Reset quiz progress?</h2><p>This removes scores saved on this device.</p><button class="button primary" data-action="confirm-reset">Reset progress</button><button class="button secondary" data-action="classroom">Keep my progress</button>`,
        "classroom",
      );
      break;
    case "confirm-reset":
      saveSetting("progress", { attempts: 0, best: 0 });
      showDialog(classroomHTML(), "classroom");
      break;
    case "lesson-back":
      lessonIndex = Math.max(0, lessonIndex - 1);
      renderLesson();
      break;
    case "lesson-next":
      if (lessonIndex + 1 >= activeLesson.steps.length) {
        endLearning();
        announce("Lesson finished. Try the quiz or explore another planet.");
      } else {
        lessonIndex++;
        renderLesson();
      }
      break;
    case "end-lesson":
      endLearning();
      break;
    case "journey": {
      endLearning();
      learningSnapshot = {
        running: dialogPaused?.running ?? time.running,
        scale: state.scale,
      };
      if (dialogPaused) dialogPaused.running = false;
      $("#dialog").close();
      if (!state.open) await open("normal");
      else setMode("normal");
      time.running = false;
      state.scale = true;
      updateScaleNote();
      scene?.setScale(true);
      state.selected = null;
      scene?.focus(null, true);
      document.body.classList.add("learning-active");
      journey = new ScaleJourney(time.orbitalDays);
      $("#journey-panel").innerHTML = journeyHTML();
      $("#journey-panel").hidden = false;
      $("#journey-seek").focus();
      updateJourney();
      updatePlayback();
      break;
    }
    case "journey-play":
      if (journey.progress === 1) journey.seek(0);
      journey.playing = !journey.playing;
      updateJourney();
      break;
    case "end-journey":
      endLearning();
      break;
    case "flat-view": {
      const { FlatScene } = await import("./core/flatScene.js");
      scene?.dispose();
      scene = new FlatScene({
        mount: $("#scene-mount"),
        onSelect: selectPlanet,
      });
      scenePromise = Promise.resolve(scene);
      loadingError = false;
      $("#loading").hidden = true;
      scene.setScale(state.scale);
      scene.setMode(state.mode);
      scene.start(frame);
      selectPlanet(state.selected || "earth");
      announce("2D classroom view is ready.");
      break;
    }
    case "lite":
      state.quality = "low";
      saveSetting("quality", "low");
      scene?.setQuality("low");
      $("#lite-offer").hidden = true;
      announce("Lite Mode is on.");
      break;
    case "dismiss-lite":
      liteDismissed = true;
      $("#lite-offer").hidden = true;
      break;
    case "home":
      home();
      break;
    case "pause":
      time.toggle();
      updatePlayback();
      break;
    case "reset":
      time.reset();
      scene?.tickSimulation(time.orbitalDays);
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
        : "True scale";
      $("#scale-note").textContent = textureWarning
        ? "Some textures could not load. Reload to retry."
        : state.scale
          ? "True scale · labels mark tiny planets"
          : "Illustrative scale · sizes & distances compressed";
      announce(
        state.scale
          ? "True distances and sizes. Labels help you find tiny planets."
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
  if (target.id === "focus-lock") focusLocked = target.checked;
  if (target.id === "quality") {
    state.quality = target.value;
    saveSetting("quality", state.quality);
    scene?.setQuality(state.quality);
  }
  if (target.id === "reduce-motion") {
    state.reduced = target.checked;
    if (scene) scene.reducedMotion = state.reduced;
  }
  if (target.id.startsWith("distance-")) updateReadouts();
});
app.addEventListener("input", (event) => {
  if (event.target.id === "journey-seek" && journey) {
    journey.seek(event.target.value);
    updateJourney();
  }
  if (event.target.id === "film-seek") {
    tour.seek(event.target.value);
    updatePlayback();
    updateReadouts();
  }
});
app.addEventListener("submit", (event) => {
  if (event.target.id === "date-form") {
    event.preventDefault();
    if (time.setDate($("#date-input").value)) {
      scene?.tickSimulation(time.orbitalDays);
      updateReadouts();
      $("#date-error").textContent = "";
      announce("Date changed.");
    } else $("#date-error").textContent = "Choose a date from 1800 to 2050.";
    return;
  }
  if (event.target.id !== "day-form") return;
  event.preventDefault();
  if (time.setDays($("#day-input").value)) {
    $("#day-error").textContent = "";
    scene?.tickSimulation(time.orbitalDays);
    updateReadouts();
    announce("Simulation moved to day " + fmt(time.elapsedDays, 2));
  } else
    $("#day-error").textContent =
      "Enter a positive number of days that keeps the date within 1800–2050.";
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
    else if (!journey) time.toggle();
    updatePlayback();
  }
  if (event.key.toLowerCase() === "l" && state.mode !== "video")
    $('[data-action="labels"]').click();
  if (event.key.toLowerCase() === "o" && state.mode !== "video")
    selectPlanet("overview");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && journey) {
    journey.playing = false;
    updateJourney();
  }
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
addEventListener("pagehide", (event) => {
  tour.stop();
  scene?.stop();
  if (!event.persisted) {
    scene?.dispose();
    scene = null;
    scenePromise = null;
  }
});
addEventListener("pageshow", (event) => {
  if (event.persisted && state.open) scene?.start(frame);
});

// Let the first scene download finish before offline precaching competes for bandwidth.
const scheduleOffline = () => setTimeout(setupOffline, 4000);
if (document.readyState === "complete") scheduleOffline();
else addEventListener("load", scheduleOffline, { once: true });

function renderLesson() {
  document.body.classList.add("learning-active");
  const panel = $("#lesson-panel");
  panel.hidden = false;
  panel.innerHTML = lessonHTML(activeLesson, lessonIndex, focusLocked);
  selectPlanet(activeLesson.steps[lessonIndex].planet);
  $("#lesson-title").focus();
}
function updateJourney() {
  scene?.setJourney?.(journey.progress, journey.target);
  $("#journey-au").textContent = fmt(journey.au, 2) + " AU";
  const minutes = journey.minutes;
  $("#journey-time").textContent =
    Math.floor(minutes / 60) + " h " + fmt(minutes % 60, 1) + " min";
  if (document.activeElement !== $("#journey-seek"))
    $("#journey-seek").value = journey.progress;
  $('[data-action="journey-play"]').textContent = journey.playing
    ? "Pause journey"
    : journey.progress === 1
      ? "Replay journey"
      : "Play journey";
  const place =
    journey.au < 1
      ? "Earth is about 1 AU from the Sun."
      : journey.au < 5.2
        ? "Jupiter is about 5.2 AU from the Sun."
        : journey.au < 9.6
          ? "Saturn is about 9.6 AU from the Sun."
          : journey.au < 19.2
            ? "Uranus is about 19.2 AU from the Sun."
            : "Neptune is about 30 AU from the Sun.";
  if ($("#journey-place").textContent !== place)
    $("#journey-place").textContent = place;
}
function endLearning() {
  if (!activeLesson && !journey) return;
  document.body.classList.remove("learning-active");
  activeLesson = null;
  journey = null;
  $("#lesson-panel").hidden = true;
  $("#journey-panel").hidden = true;
  if (learningSnapshot) {
    time.running = learningSnapshot.running;
    state.scale = learningSnapshot.scale;
    scene?.setScale(state.scale);
  }
  scene?.setMode(state.mode);
  scene?.focus(state.selected, true);
  learningSnapshot = null;
  updateScaleNote();
  updatePlayback();
}

async function restoreSharedState() {
  const shared = readSharedState(location.search);
  if (!shared.hasState) {
    if (state.open) home();
    return;
  }
  endLearning();
  if (shared.date) time.setDate(shared.date);
  state.scale = shared.scale;
  await open(shared.view, shared.planet);
  scene?.setScale(shared.scale);
  updateScaleNote();
  updateReadouts();
}
addEventListener("popstate", restoreSharedState);
restoreSharedState();

setupLanguages();
document.addEventListener("languagechange", () => {
  tour.cancelSpeech();
  if (tour.playing && tour.narrating) tour.speak();
});
