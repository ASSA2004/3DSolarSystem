import type { LabContent } from "./schema";
export default {
  id: "solar",
  title: "Solar System",
  hook: "Explore our star and eight planets.",
  subject: "EARTH & SPACE",
  prediction: "Which is farther from the Sun?",
  predictions: ["Earth", "Mars"],
  note: "Calculated approximate planetary positions; sizes are illustrative in compressed view.",
  steps: [
    {
      title: "Stop and look",
      concept:
        "Planets travel around the Sun. Pause the model to study one moment.",
      action: "Press Pause simulation.",
      why: "Pause stops the simulation clock. Real planets keep moving; we freeze only the model.",
      check: "Does pausing this model stop real planets?",
      choices: ["No", "Yes"],
      answer: 0,
      target: "pause",
    },
    {
      title: "Find our home",
      concept: "Earth is one of eight planets orbiting the Sun.",
      action: "Select Earth from the planet list.",
      why: "Earth travels around the Sun in about one year. Its rotation is a separate motion.",
      check: "One trip around the Sun is called an…",
      choices: ["Orbit", "Axis"],
      answer: 0,
      target: "earth",
    },
    {
      title: "Measure the space",
      concept:
        "Large gaps separate the planets. A diagram often compresses these gaps.",
      action: "Open settings and switch to True scale.",
      why: "True scale uses real size and distance ratios. Planet labels help us find bodies that are tiny at this scale.",
      check: "Why do planets look so small at true scale?",
      choices: ["Space between them is enormous", "The planets changed size"],
      answer: 0,
      target: "scale",
    },
  ],
} satisfies LabContent;
