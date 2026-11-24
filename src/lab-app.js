import { PRODUCT_NAME } from "./brand.ts";
import solar from "./content/solar.ts";
import optics from "./content/optics.ts";
import matter from "./content/matter.ts";
import plane from "./content/plane.ts";
import solid from "./content/solid.ts";
import { mark } from "./lab-ui/logo.js";
import { initialTheme, setTheme, labHues } from "./lab-ui/tokens.js";
import { t } from "./lab-ui/i18n.js";
import { setupOffline } from "./core/offline.js";
const labs = [solar, optics, matter, plane, solid];
const app = document.querySelector("#app");
let cleanup = null,
  selected = "solar",
  generation = 0;
initialTheme();
app.insertAdjacentHTML(
  "afterend",
  `<footer class="gateway-footer home-footer"><span>${PRODUCT_NAME} · ${t("brandTag")}</span><span>${t("privacy")}</span></footer>`,
);
const params = new URLSearchParams(location.search);
if (params.has("planet") || params.has("date") || params.has("view")) {
  location.replace(new URL("solar.html" + location.search, location.href));
}
function header() {
  return `<header class="lab-header"><a href="?" class="lab-brand" data-home>${mark}<span>${PRODUCT_NAME}</span></a><div class="header-actions"><button data-home>${t("allLabs")}</button><button class="theme-switch" data-theme title="${t("theme")}">${t(document.documentElement.dataset.theme)}</button><select id="lab-language" aria-label="Language"><option value="en" ${document.documentElement.lang === "en" ? "selected" : ""}>English</option><option value="ta" ${document.documentElement.lang === "ta" ? "selected" : ""}>தமிழ்</option></select></div></header>`;
}
async function route() {
  const version = ++generation;
  cleanup?.();
  cleanup = null;
  const query = new URLSearchParams(location.search),
    id = query.get("lab"),
    content = labs.find((l) => l.id === id),
    mode = query.get("mode") === "teach" ? "teach" : "experiment";
  if (content?.id === "solar") {
    location.href = new URL("solar.html?learning=" + mode, location.href);
    return;
  }
  app.innerHTML = header() + `<main id="main" tabindex="-1"></main>`;
  const root = document.querySelector("#main");
  if (content) {
    selected = id;
    root.innerHTML = `<div class="fallback" role="status">${t("loading")}</div>`;
    try {
      const { mountLab } = await import("./lab-ui/shell.js");
      if (version !== generation) return;
      const dispose = await mountLab(root, content, mode, (newMode) =>
        navigate(id, newMode),
      );
      if (version !== generation) dispose?.();
      else cleanup = dispose;
    } catch (error) {
      console.error(error);
      root.innerHTML = `<div class="fallback"><h1>${t("error")}</h1><button data-retry>${t("retry")}</button><button data-home>${t("allLabs")}</button></div>`;
    }
  } else {
    root.innerHTML = `<section class="intro"><h1>${t("gatewayTitle")}</h1><p>${t("gatewayIntro")}</p></section><div class="gateway-layout gateway-static"><section class="lab-cards" aria-label="${t("selectLab")}">${labs.map((l) => `<article class="lab-card ${selected === l.id ? "is-selected" : ""}" data-card="${l.id}" style="--hue:${labHues[l.id]}"><h2>${l.title}</h2><p>${l.hook}</p><div class="card-actions"><button data-enter="${l.id}" data-learning="teach">${t("teach")}</button><button class="primary" data-enter="${l.id}" data-learning="experiment">${t("experiment")}</button></div></article>`).join("")}</section></div>`;
    if (query.has("return")) {
      selected = query.get("return");
      select(selected);
      root
        .querySelector(`[data-enter="${selected}"]`)
        ?.focus({ preventScroll: true });
    }
  }
}
function select(id) {
  if (!labs.some((l) => l.id === id)) return;
  selected = id;
  document
    .querySelectorAll("[data-card]")
    .forEach((card) =>
      card.classList.toggle("is-selected", card.dataset.card === id),
    );
}
function navigate(id, mode) {
  const url = new URL(location.href);
  url.search = "";
  if (id) {
    url.searchParams.set("lab", id);
    url.searchParams.set("mode", mode);
  } else url.searchParams.set("return", selected);
  history.pushState({}, "", url);
  route();
}
app.addEventListener("click", async (e) => {
  const b = e.target.closest("button,a");
  if (!b) return;
  if (b.hasAttribute("data-home")) {
    e.preventDefault();
    navigate();
  } else if (b.hasAttribute("data-theme")) {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
    b.textContent = t(document.documentElement.dataset.theme);
  } else if (b.dataset.planet) select(b.dataset.planet);
  else if (b.dataset.enter) {
    b.disabled = true;
    try {
      navigate(b.dataset.enter, b.dataset.learning);
    } finally {
      b.disabled = false;
    }
  } else if (b.hasAttribute("data-retry")) route();
});
app.addEventListener("focusin", (e) => {
  if (e.target.dataset.planet) select(e.target.dataset.planet);
});
app.addEventListener("change", (e) => {
  if (e.target.id === "lab-language") {
    document.documentElement.lang = e.target.value;
    route();
  }
});
addEventListener("popstate", route);
addEventListener("pagehide", () => {
  cleanup?.();
});
route();
setTimeout(setupOffline, 4000);
