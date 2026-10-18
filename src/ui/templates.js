import { BODIES, bodyById, SCIENCE_SOURCE } from "../data/catalog.js";
import { illustration } from "../utils/assets.js";
import { icon } from "./icons.js";
import { orbitalSpeed } from "../utils/physics.ts";
export const modes = [
  {
    id: "normal",
    title: "Normal view",
    short: "Explore",
    icon: "globe",
    text: "Your own little corner of the cosmos. Orbit, zoom, and find a new perspective.",
    action: "Start exploring",
  },
  {
    id: "details",
    title: "Details view",
    short: "Discover",
    icon: "book",
    text: "Go beyond the beautiful. Make sense of the distances, the days, and everything in between.",
    action: "Open the field guide",
  },
  {
    id: "video",
    title: "Video view",
    short: "Watch",
    icon: "film",
    text: "Take the scenic route. A cinematic, chapter-by-chapter journey from our star to Neptune.",
    action: "Watch the journey",
  },
];
export const fmt = (value, digits = 0) =>
  Number(value).toLocaleString("en-US", { maximumFractionDigits: digits });
export const logo =
  '<span class="logo-mark">' +
  icon("orbit") +
  '</span><span>orbit<span class="logo-period">.</span></span>';
const sourceLink = (body) =>
  '<a class="source-link" href="' +
  body.source +
  '" target="_blank" rel="noopener">Read more at NASA ' +
  icon("arrow") +
  "</a>";
export function homeHTML() {
  return (
    '<div id="home"><header class="home-header"><a href="#home" class="brand" aria-label="Orbit home">' +
    logo +
    '</a><span class="header-note">A SOLAR OBSERVATORY</span><button class="text-button" data-open="normal">Enter the observatory ' +
    icon("arrow") +
    "</button></header>" +
    '<main id="main"><section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> A LITTLE PERSPECTIVE CHANGES EVERYTHING</p><h1>There’s a whole<br>universe <em>out there.</em></h1><p class="hero-description">Start with our extraordinary neighbourhood.<br>Eight worlds. One star. Endless ways to explore.</p><div class="hero-actions"><button class="button primary" data-open="normal">Explore the solar system ' +
    icon("arrow") +
    '</button><button class="text-button" data-open="video">' +
    icon("play") +
    ' Watch the journey</button></div><div class="hero-footnote"><span class="tiny-orbit"></span> Made for the curious. No spacesuit required.</div></div>' +
    '<div class="hero-art" aria-label="An illustration of Earth surrounded by orbital paths" role="img"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-orbit orbit-three"></div><div class="earth-glow"></div><img class="hero-earth" src="' +
    illustration("earth") +
    '" alt="" fetchpriority="high"><span class="art-cross cross-one">+</span><span class="art-cross cross-two">+</span><div class="earth-caption"><span class="caption-line"></span><span><b>EARTH</b><small>Our place in the universe</small></span></div><div class="coordinates"><span>01 AU FROM THE SUN</span><span>23.44° AXIAL TILT</span></div><div class="moon-dot"></div><span class="moon-caption">THE MOON</span></div></section>' +
    '<section class="experience-section" aria-labelledby="experience-heading"><div class="section-heading"><p class="eyebrow">CHOOSE YOUR PERSPECTIVE</p><h2 id="experience-heading">One solar system. <span>Three ways in.</span></h2><span class="section-index">01 — 03</span></div><div class="experience-grid">' +
    modes
      .map(
        (mode, i) =>
          '<button class="experience-card" data-open="' +
          mode.id +
          '"><span class="card-top"><span class="card-number">0' +
          (i + 1) +
          " / " +
          mode.title.toUpperCase() +
          "</span>" +
          icon(mode.icon) +
          "</span><h3>" +
          mode.short +
          "<span>.</span></h3><p>" +
          mode.text +
          '</p><span class="card-action">' +
          mode.action +
          icon("arrow") +
          "</span></button>",
      )
      .join("") +
    '</div></section><section class="worlds-strip"><span class="eyebrow">MEET THE NEIGHBOURS</span><div>' +
    BODIES.slice(1)
      .map(
        (p) =>
          '<button data-home-planet="' +
          p.id +
          '"><img src="' +
          illustration(p.id) +
          '" alt="" loading="lazy"><span>' +
          p.name +
          "</span></button>",
      )
      .join("") +
    "</div></section></main>" +
    '<footer class="home-footer"><span>Built for a sense of wonder.</span><span>An illustrative model · <button class="text-button" data-action="about">About the science ' +
    icon("info") +
    "</button></span></footer></div>"
  );
}
export function shellHTML() {
  return (
    '<section id="observatory" hidden tabindex="-1" aria-label="Solar observatory"><header class="app-header"><button class="brand" data-action="home" aria-label="Return to Orbit home">' +
    logo +
    '</button><nav class="mode-switch" aria-label="Viewing mode">' +
    modes
      .map(
        (m) =>
          '<button data-mode="' +
          m.id +
          '" aria-pressed="false">' +
          icon(m.icon) +
          "<span>" +
          m.title +
          "</span></button>",
      )
      .join("") +
    '</nav><div class="header-tools"><span class="live-indicator"><i></i> OBSERVATORY</span><button class="icon-button" data-action="help" aria-label="Open controls and settings" title="Controls and settings">' +
    icon("settings") +
    '</button><button class="icon-button fullscreen-button" data-action="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">' +
    icon("expand") +
    "</button></div></header>" +
    '<div class="stage"><div id="scene-mount"></div><div class="scene-vignette"></div><nav class="planet-nav" aria-label="Select a planet"><p class="eyebrow">OUR SOLAR SYSTEM</p><button class="planet-nav-item overview-button" data-planet="overview" aria-pressed="true"><span class="nav-orbit">' +
    icon("orbit") +
    '</span><span>Overview</span></button><div class="planet-nav-divider"></div>' +
    BODIES.map(
      (p) =>
        '<button class="planet-nav-item" data-planet="' +
        p.id +
        '" aria-pressed="false"><img src="' +
        illustration(p.id) +
        '" alt=""><span>' +
        p.name +
        '</span><span class="planet-index">' +
        String(p.index).padStart(2, "0") +
        "</span></button>",
    ).join("") +
    '</nav><div class="scene-heading"><p class="eyebrow" id="view-eyebrow">THE BIG PICTURE</p><h1 id="view-title" tabindex="-1">Our solar system</h1><p id="view-description">A familiar star. Eight extraordinary worlds.</p></div><div class="scene-tools"><button class="icon-button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in">' +
    icon("plus") +
    '</button><button class="icon-button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out">' +
    icon("minus") +
    '</button><span></span><button class="icon-button" data-action="overview" aria-label="Return to full solar system" title="Full solar system">' +
    icon("orbit") +
    '</button><button class="icon-button" data-action="labels" aria-pressed="true" aria-label="Show planet labels" title="Toggle labels">' +
    icon("label") +
    "</button></div>" +
    '<aside id="inspector" class="inspector" aria-label="Planet information"></aside><div class="scene-hint">' +
    icon("orbit") +
    '<span>Drag to orbit <i>·</i> Scroll to zoom <i>·</i> Select a world</span></div><div class="scale-note" id="scale-note">Illustrative scale · sizes & distances compressed</div>' +
    '<section id="cinema" hidden aria-label="Cinematic journey"><div class="film-label"><span class="status-dot"></span> ORBIT ORIGINAL <span> / </span> A JOURNEY OUTWARD</div><div class="film-caption"><p class="eyebrow" id="chapter-number">CHAPTER 01 / 09</p><h2 id="chapter-title">The light at the center.</h2><p id="chapter-caption"></p></div><div class="film-bottom"><nav class="chapter-list" aria-label="Video chapters">' +
    BODIES.map(
      (p, i) =>
        '<button data-chapter="' +
        i +
        '" aria-current="false"><span>' +
        String(i + 1).padStart(2, "0") +
        "</span>" +
        p.name +
        "</button>",
    ).join("") +
    '</nav><div class="film-controls"><button class="icon-button" data-action="tour-prev" aria-label="Previous chapter">' +
    icon("back") +
    '</button><button class="play-button" data-action="tour-play" aria-label="Pause video">' +
    icon("pause") +
    '</button><button class="icon-button" data-action="tour-next" aria-label="Next chapter">' +
    icon("arrow") +
    '</button><span id="film-time">0:00 / 3:18</span><label class="sr-only" for="film-seek">Video position in seconds</label><input id="film-seek" type="range" min="0" max="198" step=".1" value="0"><button class="icon-button" data-action="narration" aria-pressed="false" aria-label="Enable narration" title="Optional voice narration">' +
    icon("muted") +
    '</button><button class="caption-button" data-action="captions" aria-pressed="true" aria-label="Show captions">CC</button></div><p class="film-footnote">A live 3D film · illustrative motion · optional device narration</p></div></section>' +
    '<div id="loading" class="loading-overlay" hidden><div class="loading-orbit">' +
    icon("orbit") +
    '</div><p class="eyebrow">OPENING A WINDOW TO SPACE</p><h2>Some things are worth<br>a little perspective.</h2><progress id="load-progress" max="100" value="0" aria-label="Loading solar system"></progress><span id="load-message">Preparing your observatory…</span></div></div>' +
    '<footer class="simulation-bar"><div class="simulation-status"><span class="status-dot"></span><div><span class="eyebrow">SIMULATION TIME</span><strong>Day <span data-day>0.00</span></strong></div></div><div class="playback"><button class="icon-button" data-action="reset" aria-label="Reset simulation to day zero" title="Reset time">' +
    icon("reset") +
    '</button><button class="play-button" data-action="pause" aria-label="Pause simulation">' +
    icon("pause") +
    '</button><div class="speed-field"><label for="speed">TIME SPEED</label><select id="speed"><option value="1">1 hour / sec</option><option value="24" selected>1 day / sec</option><option value="168">1 week / sec</option><option value="720">30 days / sec</option><option value="8760">1 year / sec</option></select></div></div><div class="footer-actions"><button class="text-button" data-action="scale" aria-pressed="false">' +
    icon("orbit") +
    '<span id="scale-button-text">Proportional distances</span></button><button class="text-button" data-action="quiz">' +
    icon("book") +
    "<span>Test your knowledge</span></button></div></footer></section>" +
    '<dialog id="dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="Close dialog">' +
    icon("close") +
    '</button><div id="dialog-content"></div></dialog>'
  );
}
const fact = (label, value) =>
  '<div class="fact"><dt>' + label + "</dt><dd>" + value + "</dd></div>";
export function inspectorHTML(id, mode, tab, compareId) {
  const p = bodyById(id);
  if (!p)
    return (
      '<div class="inspector-inner overview-card"><span class="eyebrow">YOUR FRONT-ROW SEAT</span><h2>A little space<br>to be curious.</h2><p>Select a planet to get closer. Every world has a story worth discovering.</p><div class="overview-facts"><span><b>8</b>planets</span><span><b>1</b>star</span><span><b>∞</b>perspectives</span></div><button class="button secondary" data-planet="earth">Start with home ' +
      icon("arrow") +
      '</button><div class="small-note">' +
      icon("info") +
      " Planet sizes and orbital spacing are adjusted for a readable overview.</div></div>"
    );
  let html =
    '<button class="sheet-handle" data-action="sheet" aria-expanded="false" aria-label="Expand planet information"><span></span></button><div class="inspector-inner"><div class="profile-heading"><div><p class="eyebrow">' +
    p.category +
    "</p><h2>" +
    p.name +
    '<span class="profile-dot" style="background:' +
    p.color +
    '"></span></h2></div><button class="icon-button" data-action="overview" aria-label="Back to full view">' +
    icon("close") +
    '</button></div><p class="profile-tagline">' +
    p.tagline +
    "</p>";
  if (mode === "normal")
    return (
      html +
      '<p class="profile-description">' +
      p.description +
      '</p><dl class="quick-facts">' +
      fact("Mean diameter", fmt(p.diameterKm) + " km") +
      fact(
        "From the Sun",
        p.distanceAu ? p.distanceAu + " AU" : "At the center",
      ) +
      fact("One orbit", p.orbital) +
      '</dl><div class="discovery-note"><span class="eyebrow">A MOMENT OF WONDER</span><p>' +
      p.wow +
      '</p></div><button class="button secondary full" data-mode="details">Look a little closer ' +
      icon("arrow") +
      '</button><button class="text-button full back-view" data-action="overview">Back to full view</button></div>'
    );
  html +=
    '<nav class="detail-tabs" aria-label="Educational tools">' +
    [
      ["profile", "Field notes"],
      ["lab", "Time & distance"],
      ["compare", "Compare"],
    ]
      .map(
        ([key, label]) =>
          '<button data-detail-tab="' +
          key +
          '" aria-pressed="' +
          (tab === key) +
          '">' +
          label +
          "</button>",
      )
      .join("") +
    "</nav>";
  if (tab === "lab") return html + labHTML(p) + "</div>";
  if (tab === "compare")
    return (
      html + compareHTML(p, bodyById(compareId) || bodyById("mars")) + "</div>"
    );
  return (
    html +
    '<p class="profile-description">' +
    p.description +
    '</p><dl class="science-facts">' +
    fact("Mean diameter", fmt(p.diameterKm) + " km") +
    fact("Mean Sun distance", p.distanceAu + " AU") +
    fact("Rotation · sidereal", p.day) +
    fact("Day · sunrise to sunrise", p.solarDay) +
    fact("Orbital period", p.orbital) +
    fact("Axial tilt", p.tilt + "°") +
    fact("Gravity¹", p.gravity + " m/s²") +
    fact("Temperature¹", p.temperature) +
    '</dl><section class="lesson"><h3>What makes this world different?</h3><p>' +
    p.lesson +
    "</p><h3>Atmosphere & composition</h3><p>" +
    p.atmosphere +
    '.</p></section><div class="discovery-note"><span class="eyebrow">TRY THIS</span><p>' +
    p.observation +
    '</p></div><p class="data-note">¹ Rounded reference values. Giant-planet measurements refer to atmospheric levels, not solid ground.</p>' +
    sourceLink(p) +
    "</div>"
  );
}
function labHTML(p) {
  return (
    '<section class="lab-section"><p class="eyebrow">MOVE THROUGH TIME</p><h3>A day can change your perspective.</h3><form id="day-form"><label for="day-input">Jump to simulation day</label><div class="input-row"><input id="day-input" type="number" min="0" max="1000000" step="any" value="0" required><button class="button secondary" type="submit">Go ' +
    icon("arrow") +
    '</button></div><p id="day-error" class="field-error" role="alert"></p></form><div class="time-jumps"><button data-jump="1">+1 day</button><button data-jump="30">+30 days</button><button data-jump="365.25">+1 year</button></div><div class="lab-readout"><span>Elapsed Earth years</span><strong id="elapsed-years">0.000</strong></div><div class="lab-readout"><span>' +
    p.name +
    ' orbit completed</span><strong id="orbit-progress">0%</strong></div><div class="mini-progress"><span id="orbit-progress-bar"></span></div><p class="data-note">' +
    (p.id === "sun"
      ? "The Sun is the reference origin in this model."
      : "One circuit: " +
        fmt(p.orbitalDays, 2) +
        " Earth days. Circular-model speed: " +
        fmt(orbitalSpeed(p.distanceAu, p.orbitalDays), 2) +
        " km/s.") +
    "</p></section>" +
    '<section class="lab-section"><p class="eyebrow">THE SPACE BETWEEN</p><h3>How far is far?</h3><div class="distance-selects"><label>From<select id="distance-from">' +
    options(p.id) +
    "</select></label><span>" +
    icon("arrow") +
    '</span><label>To<select id="distance-to">' +
    options(p.id === "earth" ? "mars" : "earth") +
    '</select></label></div><div class="distance-result"><strong id="distance-km">—</strong><span>million kilometres</span><div><span id="distance-au">— AU</span><span id="light-time">— light-minutes</span></div></div><details><summary>How this is calculated</summary><p>Each body moves around a circle at its mean Sun distance. Its angle advances by 360° × elapsed days ÷ orbital period, from an illustrative starting position.</p><code>d = √((x₂ − x₁)² + (z₂ − z₁)²)</code><p>1 AU = 149,597,870.7 km.<br>Light time = distance ÷ 299,792.458 km/s.</p></details><p class="data-note">This is an educational estimate, not today’s sky or a spacecraft navigation calculation. Real orbits are elliptical and tilted.</p></section><a class="source-link" href="' +
    SCIENCE_SOURCE +
    '" target="_blank" rel="noopener">NASA planetary reference ' +
    icon("arrow") +
    "</a>"
  );
}
function options(selected) {
  return BODIES.map(
    (p) =>
      '<option value="' +
      p.id +
      '"' +
      (p.id === selected ? " selected" : "") +
      ">" +
      p.name +
      "</option>",
  ).join("");
}
function compareHTML(a, b) {
  const max = Math.max(a.diameterKm, b.diameterKm);
  const row = (label, av, bv) =>
    '<tr><th scope="row">' +
    label +
    "</th><td>" +
    av +
    "</td><td>" +
    bv +
    "</td></tr>";
  return (
    '<label class="compare-label" for="compare-with">Compare ' +
    a.name +
    ' with<select id="compare-with">' +
    options(b.id) +
    '</select></label><div class="size-comparison">' +
    [a, b]
      .map(
        (p) =>
          '<div><div class="size-disc-space"><span class="size-disc" style="width:' +
          (p.diameterKm / max) * 112 +
          "px;height:" +
          (p.diameterKm / max) * 112 +
          "px;background:" +
          p.color +
          '"></span></div><b>' +
          p.name +
          "</b></div>",
      )
      .join("") +
    '</div><p class="data-note centered">Discs show relative mean diameters.</p><table class="comparison-table"><caption class="sr-only">' +
    a.name +
    " compared with " +
    b.name +
    '</caption><thead><tr><th>Measure</th><th scope="col">' +
    a.name +
    '</th><th scope="col">' +
    b.name +
    "</th></tr></thead><tbody>" +
    row("Diameter", fmt(a.diameterKm) + " km", fmt(b.diameterKm) + " km") +
    row("Sun distance", a.distanceAu + " AU", b.distanceAu + " AU") +
    row(
      "Rotation",
      fmt(a.dayDays * 24, 1) + " h",
      fmt(b.dayDays * 24, 1) + " h",
    ) +
    row(
      "Orbit",
      a.orbitalDays ? fmt(a.orbitalDays, 1) + " d" : "—",
      b.orbitalDays ? fmt(b.orbitalDays, 1) + " d" : "—",
    ) +
    row("Tilt", a.tilt + "°", b.tilt + "°") +
    row("Gravity", a.gravity + " m/s²", b.gravity + " m/s²") +
    '</tbody></table><div class="discovery-note"><span class="eyebrow">PUT IT IN PERSPECTIVE</span><p>' +
    a.name +
    " has " +
    fmt(a.diameterKm / b.diameterKm, 3) +
    " times the diameter of " +
    b.name +
    '.</p></div><p class="data-note">Rotation is measured relative to the stars. The discs do not show distance or atmospheric detail.</p>'
  );
}
export function helpHTML(quality, motion, scale) {
  return (
    '<p class="eyebrow">MAKE YOURSELF AT HOME</p><h2 id="dialog-title">Your observatory.</h2><p>Explore at your own pace. The same solar system carries through all three views.</p><div class="help-grid"><span>Orbit the camera</span><b>Drag / one finger</b><span>Zoom in or out</span><b>Scroll / pinch / + −</b><span>Pan the camera</span><b>Right-drag / two fingers</b><span>Pause or resume</span><kbd>Space</kbd><span>Show planet labels</span><kbd>L</kbd><span>Return to overview</span><kbd>O</kbd><span>Close panel / return home</span><kbd>Escape</kbd></div><div class="settings-row"><label for="quality">Rendering quality</label><select id="quality"><option value="auto"' +
    (quality === "auto" ? " selected" : "") +
    '>Adaptive</option><option value="high"' +
    (quality === "high" ? " selected" : "") +
    '>High</option><option value="low"' +
    (quality === "low" ? " selected" : "") +
    '>Battery saver</option></select></div><label class="settings-row">Reduce camera motion<input id="reduce-motion" type="checkbox"' +
    (motion ? " checked" : "") +
    '></label><div class="settings-actions"><button class="button secondary" data-action="scale" aria-pressed="' +
    String(scale) +
    '">Toggle proportional distances</button><button class="button secondary" data-action="quiz">Test your knowledge</button></div><button class="text-button" data-action="about">About the model & sources ' +
    icon("arrow") +
    "</button>"
  );
}
export function aboutHTML() {
  return (
    '<p class="eyebrow">A NOTE ON PERSPECTIVE</p><h2 id="dialog-title">Beautiful. And transparent.</h2><p>Orbit is an educational model of the Sun and eight planets, with Earth’s Moon and four illustrative Jovian moons.</p><h3>What the simulation shows</h3><p>Shared elapsed time drives planet rotation and circular orbits. Planetary tilt is independent of orbital position. Moon orbits are independent of the parent’s spin.</p><h3>What is simplified</h3><p>Day zero uses illustrative starting angles, not a real date. Orbits are circular and coplanar. Overview distances are compressed. Proportional mode uses mean Sun distances in AU, but body sizes remain enlarged. Surface colors and lighting favor legibility; the Jovian moons share a lunar texture.</p><h3>Learning from the numbers</h3><p>Distances and light times are calculated from this model. Temperature and gravity are rounded reference values; giant planets have no solid surface. A sidereal rotation and a solar day are different measures.</p><a class="source-link" href="' +
    SCIENCE_SOURCE +
    '" target="_blank" rel="noopener">NASA planetary fact sheets ' +
    icon("arrow") +
    '</a><a class="source-link" href="https://science.nasa.gov/solar-system/" target="_blank" rel="noopener">Explore the science at NASA ' +
    icon("arrow") +
    '</a><p class="data-note">Educational reference reviewed October 2026. Existing project imagery is retained; this project is not affiliated with NASA.</p>'
  );
}
