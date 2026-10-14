# 3D Solar System

An education-first, scroll-to-explore solar system built with vanilla JavaScript and Three.js. Read the field guide, reach the signature moment, and step into a textured 3D model where planets orbit, rotate, label themselves and teach you how scale and time change the story.

> **Demo:** `[Add demo GIF here]` · **Live link:** `[Add GitHub Pages or Vercel URL here]`

## Features

- Scroll-generated planet sections from one source of truth
- Textured Sun, planets and Moon with a loading manager and progress screen
- Click-to-learn cards with accurate astronomical facts
- Axial tilt, retrograde Venus, self-rotation and real orbital periods
- CSS labels, touch-friendly controls, OrbitControls and FlyControls
- Simulation clock with pause, 1 day/sec to 1 year/sec speed and elapsed counter
- Guided Sun-to-Neptune tour with optional Web Speech narration
- Compressed/true-distance scale toggle
- Earth’s Moon plus Jupiter’s Galilean moons
- 2,200-object instanced asteroid belt
- Quiz mode, hints, score screen and keyboard shortcuts
- Planet comparison panel for diameter, day length, distance and orbital period
- Responsive UI, reduced-motion support and ARIA labels
- Explorer, Student and Advanced learning levels with safe local progress storage

## Tech stack

HTML, CSS, ES modules, Three.js r150.1 via import map, CSS2DRenderer, Web Speech API and static image assets. No build step or framework is required.

## Controls

| Action | Control |
| --- | --- |
| Orbit | Drag / touch |
| Zoom | Mouse wheel / pinch |
| Select a world | Click or tap a planet |
| Fly mode | Switch to WASD |
| Fly movement | W/A/S/D, R/F |
| Pause time | Pause button or Space |
| Reset simulation | Reset button |
| Jump to a date | Enter a day number and press Enter or Set day |
| Open time controls | Time controls bar |
| Toggle labels | Labels button or L |
| Start tour | Start tour button or T |
| Exit explorer | Exit button or Escape |

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in a modern browser. Because ES modules and textures are loaded from relative URLs, use a local static server rather than opening `index.html` directly.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main` and `/ (root)`.
4. Save and use the generated Pages URL.

Vercel works the same way: import the repository and use the project root with no build command.

## How it works

Each planet is attached to an `Object3D` pivot. The pivot rotates around the Sun for the orbit while a tilted child object carries the textured sphere and its own rotation. This keeps orbital and axial motion independent and makes the model easy to extend with moons and rings.

The `TimeController` owns one simulation clock measured in Earth days. The user selects a precise simulation speed in hours per real second, so the default advances evenly by one simulated hour every second. A day field can jump directly to any valid simulation day. Every orbit derives its angle from `days / orbitalPeriodDays × 2π` (wrapped to one revolution), while each spin derives from its own rotation period. Therefore Earth reaches a half orbit at 182.625 days, and completes one orbit at 365.25 days; the same rule applies to every planet’s real period. Pausing, jumping and resetting affect the complete system consistently.

The scale toggle changes the distance multiplier on the orbit pivots and rings while preserving readable planet sizes. The compressed view is designed for overview; the true-distance view makes the vast gaps between worlds perceptible.

## Folder structure

```text
.
├── index.html
├── css/styles.css
├── js/
│   ├── main.js
│   ├── scene.js
│   ├── controls.js
│   ├── timeController.js
│   ├── ui.js
│   ├── tour.js
│   ├── quiz.js
│   └── data/planets.js
├── docs/LEARNING_DESIGN.md
├── ATTRIBUTION.md
├── CHANGELOG.md
├── images/
└── textures/
```

## Changelog

### 2026-10-13

- Replaced the monolithic inline scene with focused ES modules.
- Added real textures, loading progress, CSS labels, click-to-learn cards and a transparent flat Saturn ring.
- Added axial tilt, self-rotation, moons, asteroid belt, time controls, tour, quiz and scale modes.
- Added responsive design tokens, accessibility affordances, reduced-motion handling and deployment documentation.

## Roadmap

- Add a dedicated Earth night-light/cloud texture pair.
- Add a richer compare view for two selected worlds.
- Add optional post-processing bloom when the experience grows beyond static hosting constraints.
