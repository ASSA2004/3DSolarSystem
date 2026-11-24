# Prayog Lab — five classroom experiments

A free, non-profit learning tool for Classes 6–8. Explore the solar system, explain what changes over time, and guide a class through a short lesson. No accounts or backend are needed.

![Prayog Lab gateway](docs/gateway.png)

[Open the live labs](https://assa2004.github.io/3DSolarSystem/).

The gateway brings together **Solar System, Optics, States of Matter, Mensuration 2D and Mensuration 3D**. Choose **Teach** for three guided actions and check questions, or **Experiment** to predict, test, explain and record readings. Notebooks stay on the current device. The four new labs include coupled vessel/molecule/atom views, lens/prism/mirror experiments with ray and wave views, XY/XYZ manipulation, movable area pieces and solid nets. Each has keyboard-operable controls and numeric evidence when WebGL is unavailable.

Morning Lab and Night Observatory themes, local variable fonts, mobile layouts and a simple five-project gateway are included. All five labs are cached after the first successful download. New-lab English is complete; Tamil is a clearly marked fallback awaiting translation. Solar retains its existing English, Tamil and Hindi content.

## Three ways to learn

- **Normal:** select labelled planets, drag to look around, pinch or use buttons to zoom, and pause or resume movement.
- **Details:** read planet facts, compare worlds, change the UTC date, follow days passed, and calculate distances and light-travel time.
- **Video:** watch nine guided 3D chapters with captions, optional device narration, pause, seeking and replay. This does not export a video file.

Teacher activities introduce planets, motion and distance with one question at a time and optional planet focus locking. Student quizzes explain answers and save scores on this device. Scale Journey travels from the Sun toward Neptune, with a live AU and light-time counter. Its 60-second presentation is accelerated; it is not a light-speed simulation.

Solar English, Tamil and Hindi dictionaries supply learning content. Lite Mode reduces graphics costs; a 2D classroom view is available when WebGL cannot start. The production app saves an offline copy and offers installation in supporting browsers. Wait for **Ready to use offline** before disconnecting. The first visit requires internet access.

## Run locally

Requires Node.js 22.14 or later (CI uses Node 24). From the folder containing package.json:

```sh
npm ci
npm run dev
```

For the production/offline version:

```sh
npm run build
npm run preview
```

## Controls

| Task | Control |
| --- | --- |
| Look around | Drag or one finger |
| Zoom | Wheel, pinch, or + / − |
| Pan | Right-drag or two fingers |
| Select | Planet navigator, label, or planet |
| Pause | Playback button; Space outside interactive controls |
| Labels / overview | L / O |
| Close dialog | Escape |

All principal actions have HTML controls for keyboard access. Mobile planet information expands from the bottom sheet. Settings include graphics quality and reduced camera motion.

## Science and curriculum

Planet positions use [NASA/JPL approximate Keplerian elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html), J2000 Table 1, for 1800–2050. Elements, rates, units, citations and limitations are in `src/data/orbits.json`. This is an educational approximation, not a navigation ephemeris. Earth represents the Earth–Moon barycenter; UTC is used without TDB corrections. Surface spin, moons and asteroid visuals remain illustrative.

Compressed view enlarges bodies and shortens spacing. True scale uses physical body radii and AU distances together; labels mark planets too small to see. Distances use the current 3D orbital coordinates, 149,597,870.7 km per AU and 299,792.458 km/s for light.

Lessons reference [NCERT Grade 6 Curiosity, Chapter 12: Beyond Earth](https://ncert.nic.in/textbook/pdf/fecu112.pdf). They can support revision in Classes 7–8. The distance activity is an extension, not a claim of prescribed curriculum coverage. Planet references link to NASA from the app. Tamil/Hindi classroom wording should receive native-speaking teacher review before broad rollout.

## Engineering

Vanilla JavaScript ES modules, Three.js, Vite, a typed physics module, Vitest and Playwright. No UI framework.

```mermaid
flowchart LR
  UI[Accessible controls] --> App[Application state]
  App --> Clock[Single simulation clock]
  Clock --> Math[Kepler orbital positions]
  Math --> View[3D scene or 2D fallback]
  App --> Lessons[Teacher lessons and student quiz]
  Language[Language JSON] --> UI
  Cache[Offline cache] --> App
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for scale mapping, clock, caching and Lite Mode decisions. `src/core` contains rendering and lifecycle; `src/data` contains references and lessons; `src/ui` contains templates; `src/modes` contains activities; `src/i18n` contains dictionaries; `src/utils` contains calculations and persistence.

## Verification and performance

```sh
npm run lint
npm run format:check
npm test
npm run build
```

With the development server running, run `npm run test:browser`, `npm run test:recovery`, `node tests/classroom.mjs`, `node tests/languages.mjs` and `node tests/accessibility.mjs`. These use installed Chrome locally and bundled Chromium in CI. Run `node tests/offline.mjs` with the production preview running. `PREVIEW_URL` selects its URL.

`node tests/performance-release.mjs` hosts the build itself and measures a shared 4 Mbps download budget with 150 ms request delay, including service-worker traffic. The final controlled run reached usable 3D in **2.61 s Standard / 2.50 s Lite**, transferred **473 KB / 331 KB** through that point, and recorded about **60 fps** browser cadence on an Intel Iris Xe desktop. Results and limitations are recorded in [docs/performance.md](docs/performance.md). Desktop GPU measurements are not evidence of 60 fps on physical phones or old PCs. Automated accessibility checks supplement, rather than replace, classroom and assistive-technology testing.

## Deployment and purpose

GitHub Actions checks lint, formatting, unit tests, browser flows and offline use before deploying `dist/` from main to GitHub Pages. Configure Pages to use GitHub Actions. The workflow builds with `/3DSolarSystem/`; set `PAGES_BASE` for a different repository name. Development branches do not publish.

The [About page](public/about.html) describes the free educational purpose and local-only progress storage. No analytics or account service is included. Source and external reference links require a connection.

Code is [MIT licensed](LICENSE). Existing images have separate provenance requirements; see [ASSETS.md](ASSETS.md) before redistributing those assets.


## Simulation revision — 24 November 2026

![Water experiment driven by the thermal model](docs/water-experiment.png)

The revised [acceptance record](docs/REVISED-SIMULATION-BRIEF.md) maps the supplied brief to behavior, tests and model limits. Explanations and notebooks start collapsed in Experiment mode; scientific view changes preserve experiment state. Mobile tools wrap instead of hiding reset and explanation controls off screen. Solar retains Normal, Details and Video, with optional panels and separated planet labels.

- 54 unit checks cover orbital/date maths, thin lenses, Snell refraction, total internal reflection, wave frequency, water phase plateaus, mass-loss persistence and dimension constraints.
- `node tests/science-browser.mjs` checks coupled heating/cooling, all three matter views, four optical elements in all three optical views, XY dragging, XYZ depth, camera orbit and touch pinch at 1440px desktop and 360px mobile.
- Existing regression coverage includes 37 lab cases, 12 teaching sequences, repeated lab disposal and 35 Solar checks.
- `tests/labs-accessibility.mjs` checks both themes; `tests/labs-offline.mjs` visits scientific views and optical elements disconnected. Solar offline checks exercise Normal, Details and Video.
- A controlled cold load of the water experiment at 4 Mbps with 150 ms request delay reached interactive 3D in **2.14 s Standard / 1.78 s Lite** with **353 KB** transferred. Browser cadence was approximately **60 fps** on Intel Iris Xe. Full offline installation took **7.9 s**, transferring about **997 KB**. These are desktop GPU measurements with a mobile viewport, not physical-phone certification.

Run the browser tests against a stable production preview by setting `LAB_URL` to its gateway URL and `PREVIEW_URL` to `solar.html`. `tests/performance-labs.mjs` measures the active water simulation with its own shared-bandwidth server; it no longer benchmarks a decorative gateway animation.

Scientific limits are visible under **Model and sources**. Water particle trajectories and escape rates are qualitative, oxygen electron density is schematic, and lens images use the paraxial thin-lens model. Blender is not required: the vessel, optical surfaces and dimension objects are procedural geometry connected directly to experiment parameters. No nuclear-fission experiment is presented; heating water must not imply a nuclear reaction.

See [decisions](docs/DECISIONS.md), [design](DESIGN.md), [interaction ownership](UX-CONTRACT.md) and [architecture](ARCHITECTURE.md). School-specific chapter mapping and native-language teacher review remain rollout tasks. New-lab Tamil content remains an explicitly marked English fallback; this release does not claim completed translation.

## If the site looks unchanged

The footer shows **Version 2026.11.24.2**. A cached older tab may need one reload after the update downloads. New versions provide **Check for updates** and **Reload latest version**; reloading restarts the current experiment but keeps saved notebooks. Updates do not force an active class to reload. The release-upgrade regression is `node tests/update-browser.mjs` after a production build.
