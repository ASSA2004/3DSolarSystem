import { t, locale } from "./i18n.js";
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const modules = {
  optics: () => import("../labs/optics.js"),
  matter: () => import("../labs/matter.js"),
  plane: () => import("../labs/plane.js"),
  solid: () => import("../labs/solid.js"),
};
export async function mountLab(root, content, mode, onMode) {
  const mod = await modules[content.id]();
  const s = { ...mod.defaults };
  let stage,
    view,
    step = 0,
    acted = false,
    unlocked = false,
    why = false,
    checked = false,
    prediction = null,
    tested = false,
    previousRows = null,
    disposed = false;
  const abort = new AbortController();
  let rows = [];
  try {
    const saved = JSON.parse(
      localStorage.getItem("prayog:notebook:" + content.id) || "[]",
    );
    if (Array.isArray(saved))
      rows = saved
        .filter(
          (r) =>
            Array.isArray(r) &&
            r.every(
              (pair) =>
                Array.isArray(pair) &&
                pair.length === 2 &&
                pair.every((v) => typeof v === "string"),
            ),
        )
        .slice(-20);
  } catch {
    /* Private browsing or malformed data. */
  }
  root.innerHTML = `<section class="lab-heading"><div><p class="eyebrow">${escape(content.subject)}</p><h1 id="lab-title" tabindex="-1">${escape(content.title)}</h1></div><nav class="mode-tabs" aria-label="Learning mode"><button data-mode="teach" aria-pressed="${mode === "teach"}">${t("teach")}</button><button data-mode="experiment" aria-pressed="${mode === "experiment"}">${t("experiment")}</button></nav></section>${locale() === "ta" ? `<p class="language-note">${t("languageNote")}</p>` : ""}<div class="lab-workspace"><section class="experiment-viewport" aria-label="Experiment">${mod.views ? `<nav class="science-views" aria-label="Scientific view">${mod.views.map((v) => `<button data-science-view="${v.id}" aria-pressed="${s.view === v.id}">${v.label}</button>`).join("")}</nav><p id="view-caption" class="view-caption"></p>` : ""}<div class="scene-frame" id="lab-scene"><span class="mini-label" id="particle-speed"></span></div><div class="scene-tools"><button data-tool="notes" aria-expanded="true">Hide explanations</button><button data-tool="view">${t("resetView")}</button>${mod.tools.map((tool) => `<button data-tool="${tool.key}">${t(tool.label)}</button>`).join("")}</div><p class="scene-note">${t("controlHint")}</p><dl class="measurements" id="readouts" aria-label="Measurements"></dl><p class="scene-note">${escape(content.note)}</p><div id="extra-evidence"></div></section><aside class="lesson-side"><section class="instrument-panel" id="learning"></section><section class="instrument-panel"><h2>${t("experiment")}</h2><div id="controls">${mod.controls.map((c) => (c.options ? `<div class="field"><label for="control-${c.key}">${t(c.label)}</label><select id="control-${c.key}" data-control="${c.key}">${c.options.map((v) => `<option value="${v}" ${s[c.key] === v ? "selected" : ""}>${t(v)}</option>`).join("")}</select></div>` : `<div class="field"><label for="control-${c.key}">${t(c.label)} <output id="value-${c.key}">${s[c.key]} ${c.unit}</output></label><input id="control-${c.key}" data-control="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.key]}"></div>`)).join("")}</div><button data-tool="reset">${t("reset")}</button><details><summary>${t("source")}</summary><p id="model-note" class="hint"></p><a href="${content.id === "optics" ? "https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses" : content.id === "matter" ? "https://openstax.org/books/physics/pages/11-3-phase-change-and-latent-heat" : "https://openstax.org/books/prealgebra-2e/pages/9-6-solve-geometry-applications-volume-and-surface-area"}" target="_blank" rel="noopener">OpenStax</a></details></section><section class="instrument-panel" id="notebook-panel"><h2>${t("notebook")}</h2><p class="hint">${t("limit")}</p><div id="notebook"></div><div class="button-row"><button data-command="record" id="record" disabled>${t("record")}</button><button data-command="clear">${t("clear")}</button></div><button data-command="undo" id="undo-clear" hidden>${t("undo")}</button></section></aside></div>`;
  const $ = (sel) => root.querySelector(sel);
  const sources = $("#model-note").parentElement;
  const extraSources =
    content.id === "optics"
      ? [
          [
            "Reflection and refraction",
            "https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction",
          ],
        ]
      : content.id === "matter"
        ? [
            [
              "Atomic probability models",
              "https://openstax.org/books/chemistry-2e/pages/6-3-development-of-quantum-theory",
            ],
          ]
        : [];
  for (const [name, url] of extraSources) {
    const link = document.createElement("a");
    link.textContent = name;
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    sources.append(document.createElement("br"), link);
  }
  // Keep equipment controls next to the experiment; optional text starts collapsed.
  const aside = root.querySelector(".lesson-side");
  const disclosures = [];
  for (const [id, title, open] of [
    [
      "learning",
      mode === "teach" ? "Guided steps" : "Explain and predict",
      mode === "teach",
    ],
    ["notebook-panel", "Notebook", false],
  ]) {
    const panel = $("#" + id),
      details = document.createElement("details"),
      summary = document.createElement("summary");
    details.className = "learning-disclosure";
    details.open = open;
    summary.textContent = title;
    panel.before(details);
    details.append(summary, panel);
    disclosures.push(details);
  }
  if (mode !== "teach") aside.prepend($("#controls").closest("section"));
  const sceneTools = root.querySelector(".scene-tools");
  sceneTools.append(
    sceneTools.querySelector('[data-tool="view"]'),
    sceneTools.querySelector('[data-tool="notes"]'),
  );

  const announce = (text) => {
    document.querySelector("#announcer").textContent = text;
  };
  const notebook = () => {
    $("#notebook").innerHTML = rows.length
      ? `<div class="notebook-wrap"><table><thead><tr><th scope="col">#</th><th scope="col">${t("reading")}</th></tr></thead><tbody>${rows.map((r, i) => `<tr><th scope="row">${i + 1}</th><td>${escape(r.map((pair) => pair.join(": ")).join(" · "))}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="hint">${t("empty")}</p>`;
  };
  const save = () => {
    try {
      localStorage.setItem(
        "prayog:notebook:" + content.id,
        JSON.stringify(rows),
      );
      return true;
    } catch {
      return false;
    }
  };
  const learning = () => {
    const prompt = mod.question?.(s) || content;
    if (mode === "teach") {
      const item = content.steps[step];
      $("#learning").innerHTML =
        `<div class="step-meta"><span>${t("step")} ${step + 1} ${t("of")} ${content.steps.length}</span><span>${unlocked ? t("actionDone") : t("learn")}</span></div><div class="step-progress"><span style="width:${((step + 1) / content.steps.length) * 100}%"></span></div><h2>${escape(item.title)}</h2><p>${escape(item.concept)}</p><p class="guided-action">${escape(item.action)}</p><button data-command="why" ${unlocked ? "" : "disabled"}>${t("why")}</button>${!unlocked ? `<p class="hint">${t("tryAction")}</p>` : ""}${why ? `<p class="why-copy">${escape(item.why)}</p><h3>${escape(item.check)}</h3><div class="check-options">${item.choices.map((c, i) => `<button data-answer="${i}">${escape(c)}</button>`).join("")}</div><p class="feedback" id="check-feedback" role="status">${checked ? t("correct") : ""}</p><button class="primary" data-command="next" ${checked ? "" : "disabled"}>${step === content.steps.length - 1 ? t("restart") : t("next")}</button>` : ""}`;
    } else {
      $("#learning").innerHTML =
        `<h2>${t("predict")}</h2><p>${escape(prompt.prediction)}</p><div class="field"><label for="prediction">${t("choose")}</label><select id="prediction"><option value="">${t("choose")}</option>${prompt.predictions.map((p, i) => `<option value="${i}" ${prediction === i ? "selected" : ""}>${escape(p)}</option>`).join("")}</select></div><button class="primary" data-command="test" ${prediction === null ? "disabled" : ""}>${t("test")}</button>${tested ? `<h3 style="margin-top:20px">${t("explain")}</h3><p class="result-text">${escape(mod.result(s).explanation)}</p><p class="feedback">${prediction === mod.result(s).answer ? t("match") : t("different")}</p>` : ""}`;
    }
    $("#record").disabled = mode === "experiment" ? !tested : !unlocked;
  };
  const readouts = () => {
    if (disposed) return;
    for (const control of mod.controls) {
      const field = $("#control-" + control.key);
      const irrelevant =
        content.id === "plane"
          ? (control.key === "slant" && s.shape !== "parallelogram") ||
            (control.key === "height" && ["square", "circle"].includes(s.shape))
          : content.id === "solid"
            ? (control.key === "depth" && s.shape !== "cuboid") ||
              (control.key === "height" && ["cube", "sphere"].includes(s.shape))
            : false;
      field.disabled =
        irrelevant ||
        (control.key === "z" && s.view === "flat") ||
        (content.id === "optics" &&
          ((control.key === "angle" &&
            !["prism", "plane-mirror"].includes(s.element)) ||
            (control.key === "index" && s.element !== "prism"))) ||
        (content.id === "matter" &&
          control.key === "atom" &&
          s.view !== "atomic");
    }
    if (mod.views) {
      root
        .querySelectorAll("[data-science-view]")
        .forEach((b) =>
          b.setAttribute(
            "aria-pressed",
            String(b.dataset.scienceView === s.view),
          ),
        );
      $("#view-caption").textContent =
        mod.views.find((v) => v.id === s.view)?.description || "";
    }
    for (const c of mod.controls) {
      const input = $("#control-" + c.key);
      if (
        content.id === "optics" &&
        c.key === "focal" &&
        ["prism", "plane-mirror"].includes(s.element)
      )
        input.disabled = true;
      input.closest(".field").hidden = input.disabled;
    }
    if (content.id === "optics") {
      $("#control-distance").min = s.element === "prism" ? "16" : "2";
      $("#control-distance").value = s.distance;
      $("#value-distance").textContent = s.distance + " cm";
    }
    if (content.id === "matter") {
      $("#value-temperature").textContent = s.temperature.toFixed(1) + " °C";
      $("#control-temperature").value = s.temperature;
    }
    const r = mod.result(s);
    $("#readouts").innerHTML = r.rows
      .map(
        ([name, value]) =>
          `<div class="measurement"><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`,
      )
      .join("");
    $("#model-note").textContent = r.detail;
    $("#extra-evidence").innerHTML = mod.extra?.(s) || "";
    if (
      mode === "teach" &&
      acted &&
      !unlocked &&
      mod.achieved(s, content.steps[step].target)
    ) {
      unlocked = true;
      learning();
      announce(t("actionDone"));
    }
  };
  const change = (key, value) => {
    if (disposed) return;
    if (mod.change) mod.change(s, key, value);
    else s[key] = value;
    acted = true;
    if (tested) {
      tested = false;
      learning();
    }
    const control = $(`[data-control="${key}"]`);
    if (control) control.value = String(s[key]);
    const output = $("#value-" + key);
    if (output) {
      const def = mod.controls.find((c) => c.key === key);
      output.textContent =
        Number(s[key]).toFixed(Number.isInteger(s[key]) ? 0 : 1) +
        " " +
        def.unit;
    }
    view?.update();
    if (key === "element") {
      prediction = null;
      learning();
    }
    readouts();
  };
  root.addEventListener(
    "input",
    (e) => {
      if (e.target.dataset.control)
        change(
          e.target.dataset.control,
          e.target.type === "range" ? Number(e.target.value) : e.target.value,
        );
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "change",
    (e) => {
      if (e.target.id === "prediction") {
        prediction = e.target.value === "" ? null : Number(e.target.value);
        tested = false;
        $("#learning [data-command=test]").disabled = prediction === null;
        $("#record").disabled = true;
      }
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.scienceView) {
        change("view", b.dataset.scienceView);
        return;
      }
      if (b.dataset.mode) {
        onMode(b.dataset.mode);
        return;
      }
      if (b.dataset.tool) {
        const key = b.dataset.tool;
        if (key === "notes") {
          const visible = b.getAttribute("aria-expanded") !== "true";
          b.setAttribute("aria-expanded", String(visible));
          b.textContent = visible ? "Hide explanations" : "Show explanations";
          disclosures.forEach((panel) => (panel.hidden = !visible));
          return;
        }
        if (["view", "flat", "top"].includes(key)) {
          if (key === "top" && stage) {
            change("view", "rays");
            stage.camera.position.set(0, 0, 32);
            stage.controls.target.set(0, 0, 0);
            stage.controls.update();
          } else if (key === "flat" && mod.views) {
            change("view", "flat");
            view?.resetCamera?.();
          } else if (view?.resetCamera) view.resetCamera();
          else stage?.reset(key !== "view");
          return;
        }
        if (key === "reset") {
          Object.assign(s, mod.defaults);
          acted = false;
          unlocked = false;
          why = false;
          checked = false;
          tested = false;
          for (const c of mod.controls) {
            $("#control-" + c.key).value = s[c.key];
            if ($("#value-" + c.key))
              $("#value-" + c.key).textContent = s[c.key] + " " + c.unit;
          }
          view?.update();
          if (view?.resetCamera) view.resetCamera();
          else stage?.reset();
          readouts();
          learning();
          return;
        }
        change(key, true);
        return;
      }
      if (b.dataset.answer !== undefined) {
        checked = Number(b.dataset.answer) === content.steps[step].answer;
        $("#check-feedback").textContent = t(checked ? "correct" : "incorrect");
        $("[data-command=next]").disabled = !checked;
        return;
      }
      switch (b.dataset.command) {
        case "why":
          if (unlocked) {
            why = true;
            learning();
            $("#learning h3").setAttribute("tabindex", "-1");
            $("#learning h3").focus();
          }
          break;
        case "next":
          if (checked) {
            step = (step + 1) % content.steps.length;
            acted = false;
            unlocked = false;
            why = false;
            checked = false;
            learning();
            $("#learning h2").setAttribute("tabindex", "-1");
            $("#learning h2").focus();
          }
          break;
        case "test":
          if (prediction !== null) {
            if (content.id === "matter") mod.change(s, "pause", true);
            tested = true;
            learning();
            announce(mod.result(s).explanation);
          }
          break;
        case "record":
          if (!$("#record").disabled) {
            rows.push(mod.result(s).rows);
            rows = rows.slice(-20);
            notebook();
            announce(t(save() ? "saved" : "storage"));
          }
          break;
        case "clear":
          previousRows = rows;
          rows = [];
          save();
          notebook();
          $("#undo-clear").hidden = false;
          break;
        case "undo":
          rows = previousRows || [];
          save();
          notebook();
          $("#undo-clear").hidden = true;
          break;
      }
    },
    { signal: abort.signal },
  );
  learning();
  notebook();
  readouts();
  $("#lab-title").focus({ preventScroll: true });
  try {
    const { Stage } = await import("../labs/stage.js");
    if (disposed) return () => {};
    stage = new Stage($("#lab-scene"));
    view = mod.create(stage, s, change, readouts);
  } catch (error) {
    console.info("Using accessible lab fallback:", error.message);
    stage?.dispose();
    view = mod.create(null, s, change, readouts);
    $("#lab-scene").innerHTML =
      `<div class="fallback"><h2>${t("fallback")}</h2><p class="hint">${escape(content.hook)}</p></div>`;
  }
  return () => {
    disposed = true;
    abort.abort();
    view?.dispose?.();
    stage?.dispose();
  };
}
