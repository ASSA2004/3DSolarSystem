import content from "../content/solar.ts";
import { t } from "./i18n.js";
export function solarLearning({ read, show, run }) {
  let mode = new URLSearchParams(location.search).get("learning"),
    step = 0,
    done = false,
    reveal = false,
    correct = false,
    prediction = null,
    tested = false,
    records = [];
  if (!mode) return;
  try {
    const saved = JSON.parse(
      localStorage.getItem("prayog:solar:notebook") || "[]",
    );
    records = Array.isArray(saved)
      ? saved.filter((r) => typeof r === "string").slice(-20)
      : [];
  } catch {
    /* Storage is optional on shared school computers. */
  }
  const escape = (value) =>
    value.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const save = () => {
    try {
      localStorage.setItem("prayog:solar:notebook", JSON.stringify(records));
    } catch {
      /* Keep the current notebook available in memory. */
    }
  };
  const panel = document.createElement("aside");
  panel.className = "solar-learning instrument-panel";
  panel.setAttribute("aria-label", "Learning activity");
  document.querySelector("#observatory").append(panel);
  const toolbar = document.createElement("div");
  toolbar.className = "solar-learning-switch";
  toolbar.innerHTML = `<button data-solar-mode="teach">${t("teach")}</button><button data-solar-mode="experiment">${t("experiment")}</button><button data-solar-hide>${t("close")}</button>`;
  panel.before(toolbar);
  let hidden = false;
  const render = () => {
    toolbar
      .querySelectorAll("[data-solar-mode]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.solarMode === mode)),
      );
    if (mode === "teach") {
      const s = content.steps[step];
      panel.innerHTML = `<p class="eyebrow">${t("step")} ${step + 1} / 3</p><h2>${s.title}</h2><p>${s.concept}</p><p class="guided-action">${s.action}</p><button data-solar-why ${done ? "" : "disabled"}>${t("why")}</button>${reveal ? `<p>${s.why}</p><h3>${s.check}</h3>${s.choices.map((c, i) => `<button data-solar-answer="${i}">${c}</button>`).join("")}<p role="status">${correct ? t("correct") : ""}</p><button data-solar-next ${correct ? "" : "disabled"}>${step === 2 ? t("restart") : t("next")}</button>` : ""}`;
    } else
      panel.innerHTML = `<h2>${t("predict")}</h2><p>${content.prediction}</p><label for="solar-prediction">${t("choose")}</label><select id="solar-prediction"><option value="">${t("choose")}</option>${content.predictions.map((c, i) => `<option value="${i}" ${prediction === i ? "selected" : ""}>${c}</option>`).join("")}</select><button data-solar-test ${prediction === null ? "disabled" : ""}>${t("test")}</button>${tested ? `<h3>${t("explain")}</h3><p>${read()}</p><p>${prediction === 1 ? t("match") : t("different")}</p><button data-solar-record>${t("record")}</button>` : ""}<h3>${t("notebook")}</h3><table><tbody>${records.map((r, i) => `<tr><th>${i + 1}</th><td>${escape(r)}</td></tr>`).join("")}</tbody></table><button data-solar-clear>${t("clear")}</button>`;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.solarMode) {
      mode = b.dataset.solarMode;
      panel.hidden = false;
      hidden = false;
      render();
      return;
    }
    if (b.hasAttribute("data-solar-hide")) {
      hidden = !hidden;
      panel.hidden = hidden;
      b.textContent = hidden ? t("learn") : t("close");
      return;
    }
    if (
      mode === "teach" &&
      !done &&
      ((step === 0 && b.dataset.action === "pause") ||
        (step === 1 && b.dataset.planet === "earth") ||
        (step === 2 && b.dataset.action === "scale"))
    ) {
      done = true;
      render();
    }
    if (b.hasAttribute("data-solar-why") && done) {
      reveal = true;
      render();
    }
    if (b.dataset.solarAnswer !== undefined) {
      correct = Number(b.dataset.solarAnswer) === 0;
      render();
    }
    if (b.hasAttribute("data-solar-next") && correct) {
      step = (step + 1) % 3;
      done = false;
      reveal = false;
      correct = false;
      if (step === 1) show("normal");
      render();
    }
    if (b.hasAttribute("data-solar-test") && prediction !== null) {
      tested = true;
      render();
    }
    if (b.hasAttribute("data-solar-record")) {
      records.push(read());
      records = records.slice(-20);
      save();
      render();
    }
    if (b.hasAttribute("data-solar-clear")) {
      records = [];
      save();
      render();
    }
  });
  panel.addEventListener("change", (e) => {
    if (e.target.id === "solar-prediction") {
      prediction = e.target.value === "" ? null : Number(e.target.value);
      tested = false;
      render();
    }
  });
  run();
  render();
}
