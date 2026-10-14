export const DIFFICULTIES = {
  explorer: {
    id: "explorer",
    label: "Explorer",
    audience: "Around 10 years",
    description: "Short, friendly explanations and memorable comparisons.",
    copy: {
      guideTitle: "Explore at a glance",
      guideBody: "Drag to orbit, scroll to zoom, and click a world to hear its story. The guide stays available while planets move.",
      cardLabel: "Why this world matters"
    }
  },
  student: {
    id: "student",
    label: "Student",
    audience: "Around 15 years",
    description: "More precise vocabulary, relationships and numerical context.",
    copy: {
      guideTitle: "Build your mental model",
      guideBody: "Change time, compare periods and inspect each world while the model continues to calculate its motion.",
      cardLabel: "Key idea"
    }
  },
  advanced: {
    id: "advanced",
    label: "Advanced",
    audience: "Deep dive",
    description: "More data detail, assumptions and orbital reasoning.",
    copy: {
      guideTitle: "Interrogate the model",
      guideBody: "Use the simulation clock and real periods to test orbital phase, rotation and scale relationships.",
      cardLabel: "Model note"
    }
  }
};

export const LEARNING_OBJECTIVES = [
  { id: "seasons", title: "Explain why seasons happen", success: "Connect seasonal change to axial tilt rather than distance from the Sun." },
  { id: "scale", title: "Compare planetary scale and distance", success: "Recognise that planets are tiny compared with the gaps between them." },
  { id: "periods", title: "Compare days and years", success: "Use rotation and orbital periods to explain why worlds experience different calendars." },
  { id: "kepler", title: "Describe orbital speed in plain words", success: "Notice that distant planets take longer to orbit and move more slowly." },
  { id: "gravity", title: "Relate mass, gravity and weight", success: "Predict how the same person would weigh differently on another world." },
  { id: "moons", title: "Reason about moons and eclipses", success: "Use alignment and shadow geometry to explain an eclipse." },
  { id: "evidence", title: "Read a model critically", success: "Distinguish compressed visual scale from astronomical measurements." }
];

export const MISSIONS = [
  { id: "seasons", title: "Why do we have seasons?", duration: "2–4 min", objective: "seasons", interaction: "Change Earth’s tilt from 0° to 45°, predict the sunlight angle, then reveal the result." },
  { id: "scale", title: "How big is space?", duration: "2–4 min", objective: "scale", interaction: "Travel through the scale model and compare a basketball Sun with a peppercorn Earth." },
  { id: "days-years", title: "Days vs years", duration: "2–4 min", objective: "periods", interaction: "Compare rotation and orbital periods, including Venus’s retrograde day." },
  { id: "kepler", title: "Why do outer planets move slowly?", duration: "2–4 min", objective: "kepler", interaction: "Plot orbital period against distance and discover the pattern behind Kepler’s third law." },
  { id: "weight", title: "Your weight on other worlds", duration: "2–4 min", objective: "gravity", interaction: "Enter a mass and compare the force you would feel on each world." },
  { id: "eclipses", title: "Moons and eclipses", duration: "2–4 min", objective: "moons", interaction: "Align the Sun, Earth and Moon to explore shadow geometry and phases." }
];

export const MISCONCEPTIONS = [
  { misconception: "Seasons are caused by Earth being closer to the Sun.", correction: "Earth’s axial tilt changes the angle and length of sunlight through the year." },
  { misconception: "The planets are close together like a diagram.", correction: "Educational diagrams compress distance so the system can fit on screen." },
  { misconception: "The Sun is simply a yellow or orange ball.", correction: "The Sun is a hot plasma star; its apparent colour depends on light and atmosphere." },
  { misconception: "A planet’s day is always shorter than its year.", correction: "Venus rotates so slowly and retrograde that its sidereal day exceeds its year." },
  { misconception: "All planetary orbits have the same speed.", correction: "Outer planets travel more slowly and take longer to complete an orbit." }
];

export const DATA_SOURCES = [
  { name: "NASA Solar System Exploration", url: "https://solarsystem.nasa.gov/", use: "Planet overviews, missions and educational context." },
  { name: "NASA Planetary Fact Sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/", use: "Diameters, distances, periods, tilt and physical data." },
  { name: "JPL Solar System Dynamics", url: "https://ssd.jpl.nasa.gov/", use: "Orbital periods, reference systems and dynamical context." }
];

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.explorer;
}
