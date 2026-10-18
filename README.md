# Orbit — A solar observatory

A redesigned, responsive solar-system experience with three connected views. Built with vanilla ES modules, Three.js, Vite, and a typed simulation-math module.

## Start locally

Requires Node.js 22.14 or later.

```sh
npm install
npm run dev
```

Open the local address printed by Vite (normally http://127.0.0.1:5173). Run commands from this directory, which contains package.json.

## Three views

- **Normal view:** select any world from the planet navigator or its scene label, orbit and pan the camera, zoom, pause/resume time, adjust speed, and return to the full system.
- **Details view:** educational field notes, mean diameter, axial tilt, gravity, temperature, atmosphere, sidereal rotation versus solar day, exact day jumps, orbital progress, live model-distance and light-time calculations, and two-body comparisons.
- **Video view:** a live 3D cinematic journey with nine chapters, automatic progression, play/pause, chapter selection, timeline seeking, captions, optional device speech narration, and replay. This is rendered in the app; it does not generate or export a video file.

The same elapsed simulation time carries between views. Normal and Details views share the chosen simulation speed. The film advances the model at one simulated hour per real second for readable motion, independently of the speed preset. Opening a dialog pauses playback; closing it restores the previous running state.

On mobile, tap the handle above a planet profile to expand its bottom sheet. Proportional-distance and quiz controls are also available in the settings dialog.

## Controls

| Action         | Control                                            |
| -------------- | -------------------------------------------------- |
| Orbit camera   | Drag / one finger                                  |
| Zoom           | Wheel / pinch / + and − buttons                    |
| Pan            | Right-drag / two fingers                           |
| Choose a world | Planet navigator, scene label, or click a planet   |
| Pause/resume   | Playback button or Space outside editable controls |
| Toggle labels  | Label button or L                                  |
| Full system    | Overview button or O                               |
| Exit / close   | Escape (closes a dialog or expanded sheet first)   |
| Preferences    | Settings button: quality and reduced camera motion |

Free-flight WASD has been replaced by consistent orbit, pan, zoom, and planet focusing.

## Scientific model

This is an **illustrative educational model, not an ephemeris**.

- Planet positions use circular, coplanar orbits at their mean Sun distances. Day zero has illustrative starting phases and does not represent a calendar date.
- Overview spacing and planet sizes are compressed. Proportional-distance mode uses AU ratios; body sizes remain enlarged.
- Axial tilt is applied independently from orbital position. A tilt greater than 90 degrees already yields retrograde rotation, so the spin is not reversed twice.
- Moon motion is independent of the parent planet's spin. The Moon and four Galilean moons use approximate orbital periods; visual sizes and spacing are illustrative. The Jovian moons share the project's Moon texture.
- Asteroid motion follows the same simulation clock, including pause, reset, and day jumps.
- Distance is the Euclidean separation between the model's AU coordinates. One AU is 149,597,870.7 km; light time uses 299,792.458 km/s.
- Gravity and temperature are rounded reference values. Giant-planet measurements refer to atmospheric reference levels, not solid ground.
- Enhanced color, atmospheric rims, and fill lighting improve legibility. The Venus texture depicts its surface without clouds.
- Scientific reference links are available inside the field notes and model explanation. Existing project images and textures are retained; their original licensing should be checked before redistributing the assets.

References: [NASA planetary fact sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [NASA Solar System](https://science.nasa.gov/solar-system/), and linked NASA pages for individual worlds.

## Build and verification

```sh
npm test
npm run build
npm run test:browser
```

- Unit tests cover orbital periodicity, radius and distance invariants, units, time input, quiz completion, and video playback boundaries.
- Browser tests require the local dev server and an installed Chrome browser. They check desktop and mobile flows, calculations, quiz feedback, video seeking/replay, and viewport overflow. Screenshots and results are saved in the ignored .qa directory.
- Set PREVIEW_URL to test another server; set BROWSER_CHANNEL to msedge to use installed Microsoft Edge.
- npm run build checks the TypeScript math module and creates a deployable dist directory. Use npm run preview to inspect that production build.
- The 3D engine is lazy-loaded when entering the observatory. Texture errors are surfaced; WebGL initialization/context failures show a recovery screen. Rendering pauses in a background tab; cinematic playback stays paused when returning.

## Deploy

Deploy **dist/** to any static host. The relative Vite base supports a GitHub Pages project subdirectory. No backend, accounts, or API keys are required.

## Source layout

- index.html — document metadata and app mount
- css/styles.css — visual system, responsive layouts, and motion preferences
- js/main.js — mode state, input, loading, dialogs, and playback integration
- js/ui.js — landing page, explorer shell, education, comparison, and help views
- js/scene.js — rendering, scene hierarchy, camera tracking, labels, quality, and picking
- js/physics.ts — typed orbital and distance calculations
- js/timeController.js — shared simulation clock
- js/tour.js — cinematic chapters, seeking, and optional narration
- js/quiz.js — question flow, feedback, and score
- js/data/ — original planet facts plus educational metadata
- tests/ — mathematical/state regression tests and browser checks
