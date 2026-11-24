import type { LabContent } from "./schema";
export default {
  id: "matter",
  title: "States of Matter",
  hook: "Add energy. Watch water change.",
  subject: "PARTICLES & ENERGY",
  prediction: "During a phase change, what happens to temperature?",
  predictions: [
    "It stays steady",
    "It rises continuously",
    "It instantly falls",
  ],
  note: "Water at normal atmospheric pressure. Particle sizes and speeds are illustrative.",
  steps: [
    {
      title: "Look inside ice",
      concept:
        "In a solid, particles vibrate around fixed positions. They are not motionless.",
      action: "Set the temperature below 0°C.",
      why: "At lower energy, attractions keep particles near their neighbours.",
      check: "Do particles stop moving in ordinary ice?",
      choices: ["No, they vibrate", "Yes"],
      answer: 0,
      target: "solid",
    },
    {
      title: "Spend energy on melting",
      concept:
        "Energy can change the arrangement of particles without warming them.",
      action: "Choose Melting point, then press Heat.",
      why: "At 0°C, added energy weakens attractions between water molecules. It does not break the water molecules apart.",
      check: "What stays steady while ice melts?",
      choices: ["Temperature", "Amount of liquid"],
      answer: 0,
      target: "melting",
    },
    {
      title: "Let particles spread",
      concept:
        "Gas particles move freely, spread apart and escape an open vessel.",
      action: "Set the temperature above 100°C.",
      why: "After boiling finishes, further energy raises the temperature of the gas.",
      check: "Which state fills all the available space?",
      choices: ["Gas", "Solid"],
      answer: 0,
      target: "gas",
    },
  ],
} satisfies LabContent;
