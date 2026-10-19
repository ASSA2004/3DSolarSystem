import reference from "./planet-reference.json";
import copy from "../i18n/en.json";
export const BODIES = reference.bodies.map((body) => ({
  ...body,
  ...Object.fromEntries(
    reference.fields
      .filter((field) => copy[`planet.${body.id}.${field}`] !== undefined)
      .map((field) => [field, copy[`planet.${body.id}.${field}`]]),
  ),
}));
export const bodyById = (id) => BODIES.find((body) => body.id === id);
export const SCIENCE_SOURCE =
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/";
