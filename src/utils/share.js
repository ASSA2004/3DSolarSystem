import { BODIES } from "../data/catalog.js";
import { parseDate } from "./dates.js";
export function readSharedState(search) {
  const params = new URLSearchParams(search);
  const planet = params.get("planet");
  const date = params.get("date");
  return {
    planet: BODIES.some((b) => b.id === planet) ? planet : null,
    date: date && parseDate(date) !== null ? date : null,
    scale: params.get("mode") === "true-scale",
    view: ["normal", "details", "video"].includes(params.get("view"))
      ? params.get("view")
      : "normal",
    hasState: ["planet", "date", "mode", "view"].some((key) => params.has(key)),
  };
}
export function shareURL(base, state) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  if (state.planet) url.searchParams.set("planet", state.planet);
  url.searchParams.set("date", state.date);
  url.searchParams.set("mode", state.scale ? "true-scale" : "compressed");
  url.searchParams.set("view", state.view);
  return url.href;
}
