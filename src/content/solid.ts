import type { LabContent } from "./schema";
export default {
  id: "solid",
  title: "Mensuration 3D",
  hook: "Unfold a solid. Measure what fits.",
  subject: "SURFACE & VOLUME",
  prediction:
    "A cone and cylinder have the same radius and height. How do their volumes compare?",
  predictions: [
    "Cone is one third of cylinder",
    "They are equal",
    "Cone is twice as large",
  ],
  note: "Lengths use units, surface areas square units and volumes cubic units.",
  steps: [
    {
      title: "Fill the space",
      concept: "Volume measures the space inside a solid.",
      action: "Choose Cube and press Fill with water.",
      why: "A cube with side 3 holds 3 × 3 × 3 = 27 unit cubes.",
      check: "Which unit measures volume?",
      choices: ["Cubic units", "Square units"],
      answer: 0,
      target: "fill",
    },
    {
      title: "Open the faces",
      concept: "Surface area counts every face that covers a solid.",
      action: "Choose Cuboid and unfold its net.",
      why: "There are three pairs of equal rectangles. Total area = 2(lw + lh + wh).",
      check: "How many faces does a cuboid have?",
      choices: ["Six", "Four"],
      answer: 0,
      target: "net",
    },
    {
      title: "Compare curved solids",
      concept: "The same base and height can enclose different volumes.",
      action: "Choose Cone and change its height.",
      why: "Three cones fill one cylinder with the same base and height: V = πr²h ÷ 3.",
      check: "The cone holds what fraction of the cylinder?",
      choices: ["One third", "One half"],
      answer: 0,
      target: "cone",
    },
  ],
} satisfies LabContent;
