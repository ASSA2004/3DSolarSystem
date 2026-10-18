import { PLANETS } from "./planets.js";
const extra = {
  sun: {
    category: "Our star",
    color: "#efbd7d",
    tagline: "Where every journey begins.",
    gravity: 274,
    temperature: "5,500°C · photosphere",
    atmosphere: "Hydrogen and helium plasma",
    solarDay: "About 27 Earth days",
    lesson:
      "The Sun is a star, not a planet. Fusion in its core releases energy that eventually reaches the surface and travels into space as light. Different solar latitudes rotate at different speeds.",
    observation:
      "Compare the Sun with Earth. Even with enlarged planets, this display compresses the enormous difference in their sizes.",
  },
  mercury: {
    category: "Terrestrial planet",
    color: "#bcb7ad",
    tagline: "Small world. Extraordinary extremes.",
    gravity: 3.7,
    temperature: "167°C · mean",
    atmosphere: "An extremely thin exosphere",
    solarDay: "176 Earth days",
    lesson:
      "Rotation and a solar day are different measurements. Mercury turns once relative to the stars in about 59 Earth days, but the Sun takes about 176 Earth days to return to the same place in its sky.",
    observation:
      "Set the clock to 88 days. Mercury completes approximately one orbit while Earth has travelled only part of the way around.",
  },
  venus: {
    category: "Terrestrial planet",
    color: "#e6c18d",
    tagline: "A beautiful, unforgiving neighbour.",
    gravity: 8.9,
    temperature: "464°C · mean",
    atmosphere: "Thick carbon dioxide; sulfuric acid clouds",
    solarDay: "About 117 Earth days",
    lesson:
      "Venus rotates in the opposite direction to Earth. Its dense atmosphere traps heat, making it hotter at the surface than Mercury despite being farther from the Sun. This model uses a surface texture, with the clouds removed.",
    observation:
      "Compare its rotation period with its year: a full turn relative to the stars takes longer than one orbit.",
  },
  earth: {
    category: "Terrestrial planet",
    color: "#8abfc7",
    tagline: "The only home we have ever known.",
    gravity: 9.8,
    temperature: "15°C · mean",
    atmosphere: "Mostly nitrogen and oxygen",
    solarDay: "24 hours",
    lesson:
      "Earth’s tilted axis produces the seasons as it travels around the Sun. A rotation relative to distant stars takes about 23 hours 56 minutes; a solar day is slightly longer because Earth also moves along its orbit.",
    observation:
      "Jump forward 182.625 days to move about halfway around the orbit. Notice that the tilted spin axis keeps the same orientation in space.",
  },
  mars: {
    category: "Terrestrial planet",
    color: "#d89477",
    tagline: "A world with stories written in dust.",
    gravity: 3.7,
    temperature: "−65°C · mean",
    atmosphere: "Thin, mostly carbon dioxide",
    solarDay: "24 hours 39 minutes",
    lesson:
      "A Martian solar day, called a sol, is a little longer than an Earth day. Mars also has seasons because its axis is tilted. Surface channels and minerals preserve clues to an ancient, wetter environment.",
    observation:
      "Compare Earth and Mars. Their days and axial tilts are similar, but a Martian year is almost twice as long.",
  },
  jupiter: {
    category: "Gas giant",
    color: "#d8b695",
    tagline: "A giant with a world of its own.",
    gravity: 23.1,
    temperature: "−110°C · reference atmospheric level",
    atmosphere: "Mostly hydrogen and helium",
    solarDay: "About 10 hours",
    lesson:
      "Jupiter has no solid surface like Earth’s. Its visible bands are clouds in a deep atmosphere. Io, Europa, Ganymede and Callisto orbit independently of the planet’s fast rotation.",
    observation:
      "Slow time to one hour per second and focus on Jupiter to watch four illustrative moon orbits. Their sizes and orbital spacing are enlarged for readability.",
  },
  saturn: {
    category: "Gas giant",
    color: "#d5c29e",
    tagline: "An improbable sculpture of ice.",
    gravity: 9.0,
    temperature: "−140°C · reference atmospheric level",
    atmosphere: "Mostly hydrogen and helium",
    solarDay: "About 10.7 hours",
    lesson:
      "Saturn’s rings consist of many separate pieces of ice and rock. The rings lie close to its equatorial plane, so their apparent angle changes as your viewpoint changes.",
    observation:
      "Drag above and below the planet. From the side, the broad ring system becomes a remarkably thin line.",
  },
  uranus: {
    category: "Ice giant",
    color: "#9ed0d4",
    tagline: "A different way to turn.",
    gravity: 8.7,
    temperature: "−195°C · reference atmospheric level",
    atmosphere: "Hydrogen, helium and methane",
    solarDay: "About 17.2 hours",
    lesson:
      "Uranus is tilted by about 98 degrees, so its rotation looks almost sideways. Methane in the upper atmosphere absorbs red light, helping give the planet its blue-green appearance.",
    observation:
      "Watch the rotation axis rather than just the orbit. Axial tilt describes a planet’s orientation; it does not push the planet above its orbital path.",
  },
  neptune: {
    category: "Ice giant",
    color: "#779ddb",
    tagline: "At the edge of the familiar.",
    gravity: 11.0,
    temperature: "−200°C · reference atmospheric level",
    atmosphere: "Hydrogen, helium and methane",
    solarDay: "About 16.1 hours",
    lesson:
      "Neptune travels around the Sun much more slowly than Earth. Its distant atmosphere is cold but dynamic. The illustration uses enhanced blue coloring to make the planet easy to identify.",
    observation:
      "Switch to proportional distances to understand how much space separates the outer planets. Planet sizes remain enlarged so they can still be found.",
  },
};
export const BODIES = PLANETS.map((p, i) => ({
  ...p,
  ...extra[p.id],
  name: p.id === "sun" ? "Sun" : p.name,
  index: i,
  phase: [0, 0.5, 2.4, 0.15, 3.5, 1.2, 5.4, 2.7, 4.3][i],
  orbit: [0, 12, 18, 25, 33, 47, 64, 82, 102][i],
  dayDays: p.id === "earth" ? 23.9345 / 24 : p.dayDays,
  source: "https://science.nasa.gov/" + p.id + "/facts/",
}));
export const bodyById = (id) => BODIES.find((p) => p.id === id);
export const SCIENCE_SOURCE =
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/";
