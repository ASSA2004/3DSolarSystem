import type { LabContent } from "./schema";
export default {
  id: "optics",
  title: "Optics",
  hook: "Move the light. Find the image.",
  subject: "LIGHT & IMAGES",
  prediction: "What kind of image will you get?",
  predictions: [
    "Real and inverted",
    "Virtual and upright",
    "No image on a nearby screen",
  ],
  note: "Thin-element model. Distances are centimetres. Virtual images cannot be caught on a screen.",
  steps: [
    {
      title: "Start beyond 2F",
      concept:
        "Light bends as it passes through a lens. Where will the rays meet?",
      action: "Use the convex lens. Move the object farther than 2F.",
      why: "Beyond 2F, the rays meet between F and 2F. The image is real, inverted and smaller.",
      check: "Can you catch this image on a screen?",
      choices: ["Yes", "No"],
      answer: 0,
      target: "beyond",
    },
    {
      title: "Bring it closer",
      concept: "The object can stay outside F but move closer to the lens.",
      action: "Move the object between F and 2F.",
      why: "The rays now meet beyond 2F. The image is inverted and larger.",
      check: "What happened to the image size?",
      choices: ["It grew", "It shrank"],
      answer: 0,
      target: "between",
    },
    {
      title: "Look inside F",
      concept:
        "Sometimes the outgoing rays never meet. Your eye traces them backwards.",
      action: "Move the object inside F.",
      why: "A convex lens makes an upright, larger virtual image when the object is inside F.",
      check: "Where would you look for this image?",
      choices: ["Through the lens", "On the screen"],
      answer: 0,
      target: "inside",
    },
  ],
} satisfies LabContent;
