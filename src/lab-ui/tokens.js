export const themes = {
  light: {
    background: "#F6FBEF",
    surface: "#FFFFFF",
    ink: "#0E2A22",
    muted: "#4A665E",
    primary: "#007F72",
    accent: "#FF6A4D",
    line: "#CBD9CD",
    scene: "#EDF5E7",
    grid: "#ACC8BB",
  },
  dark: {
    background: "#0A1022",
    surface: "#131A33",
    ink: "#E8EEFF",
    muted: "#AAB9D5",
    primary: "#4CE1C9",
    accent: "#FF8B72",
    line: "#354361",
    scene: "#0A1022",
    grid: "#34445D",
  },
};
export const labHues = {
  solar: "#E9BD85",
  optics: "#ECAF35",
  matter: "#FF6A4D",
  plane: "#00B5A0",
  solid: "#A78BFA",
};
export function setTheme(theme) {
  const mode = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = mode;
  for (const [key, value] of Object.entries(themes[mode]))
    document.documentElement.style.setProperty("--lab-" + key, value);
  try {
    localStorage.setItem("prayog:theme", mode);
  } catch {
    /* Theme still works without storage. */
  }
  document.dispatchEvent(
    new CustomEvent("lab-theme", { detail: themes[mode] }),
  );
  return mode;
}
export function initialTheme() {
  let saved;
  try {
    saved = localStorage.getItem("prayog:theme");
  } catch {
    /* System default. */
  }
  return setTheme(
    saved ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
}
export function currentTokens() {
  return themes[document.documentElement.dataset.theme || "light"];
}
