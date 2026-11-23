import en from "./en.js";
import ta from "./ta.js";
export function locale() {
  return document.documentElement.lang === "ta" ? "ta" : "en";
}
export function t(key) {
  return (locale() === "ta" ? ta[key] : null) || en[key] || key;
}
