import en from "./en.json";
import { readSetting, saveSetting } from "../utils/storage.js";
let language = "en",
  dictionary = en;
const records = new WeakMap();
const sourceKeys = new Map(
  Object.entries(en).map(([key, value]) => [value, key]),
);
const upperKeys = new Map(
  Object.entries(en).map(([key, value]) => [value.toUpperCase(), key]),
);
const attributes = new WeakMap();
export function currentLanguage() {
  return language;
}
const patterns = Object.entries(en)
  .filter(([key]) => key.startsWith("count."))
  .map(([key, value]) => {
    const pieces = value.split(/(\{\d+\})/);
    const expression = pieces
      .map((piece) =>
        /^\{\d+\}$/.test(piece)
          ? "(.+?)"
          : piece.replace(
              /[.*+?^${}()|[\]\\]/g,
              (character) => "\\" + character,
            ),
      )
      .join("");
    return { key, expression: new RegExp("^" + expression + "$") };
  });
export function translate(value, depth = 0) {
  const raw = String(value),
    trimmed = raw.trim();
  const exact = dictionary[trimmed] || dictionary[sourceKeys.get(trimmed)];
  if (exact && !(language !== "en" && exact === trimmed))
    return raw.replace(trimmed, exact);
  if (language === "en") return en[trimmed] || raw;
  const key = upperKeys.get(trimmed);
  if (key && dictionary[key] && dictionary[key] !== trimmed)
    return raw.replace(trimmed, dictionary[key]);
  if (depth < 3)
    for (const { key, expression } of patterns) {
      const match = trimmed.match(expression);
      if (match)
        return (dictionary[key] || en[key]).replace(/\{(\d+)\}/g, (_, index) =>
          translate(match[Number(index) + 1], depth + 1),
        );
    }
  // Dynamic readouts keep numbers and scientific units intact.
  for (const prefix of [
    "Focus on ",
    "Learn about ",
    "The correct answer is ",
  ]) {
    if (trimmed.startsWith(prefix)) {
      const body = trimmed.slice(prefix.length).replace(/\.$/, "");
      return (
        (dictionary[prefix.trim()] || prefix.trim()) +
        " " +
        (dictionary[body] || body)
      );
    }
  }
  return raw;
}
function translateNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentElement?.closest('script,style,code,[translate="no"]'))
      return;
    const previous = records.get(node);
    const original =
      previous && node.nodeValue === previous.output
        ? previous.original
        : node.nodeValue;
    const output = translate(original);
    records.set(node, { original, output });
    if (node.nodeValue !== output) node.nodeValue = output;
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE || node.closest('[translate="no"]'))
    return;
  const saved = attributes.get(node) || {};
  for (const name of ["aria-label", "title", "alt"])
    if (node.hasAttribute(name)) {
      const value = node.getAttribute(name),
        old = saved[name];
      const original = old && value === old.output ? old.original : value;
      const output = translate(original);
      saved[name] = { original, output };
      if (output !== value) node.setAttribute(name, output);
    }
  attributes.set(node, saved);
  for (const child of node.childNodes) translateNode(child);
}
export async function setLanguage(value) {
  if (!["en", "ta", "hi"].includes(value)) return;
  const next =
    value === "en"
      ? en
      : (await (value === "ta" ? import("./ta.json") : import("./hi.json")))
          .default;
  dictionary = next;
  language = value;
  saveSetting("language", value);
  document.documentElement.lang = value;
  document
    .querySelectorAll("[data-language]")
    .forEach((select) => (select.value = value));
  translateNode(document.body);
  document.dispatchEvent(new CustomEvent("languagechange", { detail: value }));
}
export function setupLanguages() {
  const select = `<label class="language-picker" translate="no"><span class="sr-only">Language / மொழி / भाषा</span><select data-language aria-label="Language / மொழி / भाषा"><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select></label>`;
  document
    .querySelector(".home-header")
    .insertAdjacentHTML("beforeend", select);
  document
    .querySelector(".header-tools")
    .insertAdjacentHTML("afterbegin", select);
  const observer = new MutationObserver((changes) => {
    for (const change of changes) {
      if (change.type === "childList")
        for (const node of change.addedNodes) translateNode(node);
      else translateNode(change.target);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-label", "title", "alt"],
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-language]"))
      setLanguage(event.target.value).catch(() => {
        document.querySelector("#announcer").textContent =
          "Language could not load. Please try again.";
      });
  });
  setLanguage(readSetting("language", "en")).catch(() => setLanguage("en"));
}
