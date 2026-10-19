# Performance checkpoint — 18 October 2026

Changed: src/core/scene.js, src/core/quality.js, src/utils/assets.js, src/utils/storage.js, src/main.js, src/ui/templates.js, css/styles.css, converted images and textures, tests and scripts.

WebP standard (1024px) and Lite (512px) textures replace the initial 2K JPEG downloads. Moon textures load on focus. Lite uses smaller spheres and hides atmosphere/asteroid effects. Hidden tabs stop scheduling frames; unchanged paused scenes skip GPU rendering. Quality is remembered and low-end devices are offered Lite Mode.

Plain-language entry instructions and chapter headings replace promotional copy. Key reading text and targets are larger.

Validation: lint, build, 9 Vitest tests, 33 browser checks and 7 recovery checks passed. Run npm test, npm run test:browser and npm run test:recovery with the dev server running. To repeat measurements, build, run npm run preview, then node tests/performance.mjs.

| Cold production preview | Standard | Lite |
|---|---:|---:|
| Landing load | 702 ms | 715 ms |
| Navigation to first usable 3D (including entry click) | 2660 ms | 2158 ms |
| Transferred through first usable 3D | 610726 bytes | 328884 bytes |
| Browser frame cadence | 60.10 fps | 60.20 fps |
| 95th percentile frame interval | 16.9 ms | 16.9 ms |

Environment: headless Chrome, Intel Iris Xe GPU, 390×844 viewport at DPR 2, emulated 4 Mbps down / 1 Mbps up / 150 ms latency, cold cache, no CPU throttling. Single runs, not physical-phone certification. Local hosting excludes public server latency. First usable 3D excludes later on-demand moons. The complete original imagery inventory was 6.47 MB; this is not a like-for-like initial transfer comparison.

Remaining: real phone/old-PC measurements, 2D fallback, further lifecycle and GPU-memory validation, complete reading-size/contrast audit. KTX2 is deferred until measurements show that decoder and maintenance costs are justified.

## Offline checkpoint

Changed: scripts/pwa.mjs, src/core/offline.js, public/manifest.webmanifest, generated install icons, vite.config.js, index.html, src/main.js, tests/offline.mjs.

Production build generates a versioned cache-first service worker. All essential build assets are saved before the offline-ready label appears. Updates wait for an explicit Update now action. Static resources use scope-relative URLs for Pages deployments.

Validation: production build and offline browser test pass (initial online visit, network disabled, reload, open 3D and select Earth). Entire generated dist is 1,353,366 bytes at this checkpoint, before transport compression. Offline caching adds background transfers; the earlier initial-load timings must be remeasured with this feature enabled. No new physical-device FPS claim.

Repeat: npm run build; npm run preview; node tests/offline.mjs. Development mode intentionally does not register a service worker.

## Orbital positions and old-PC fallback checkpoint

Changed: src/data/orbits.json; src/utils/orbits.js, dates.js, physics.ts; src/core/timeController.js, scene.js, flatScene.js; main/UI templates; orbital fixtures and tests.

JPL Table 1 elements and rates now drive inclined elliptical positions. Data rows were parsed from the official source to preserve signs. UTC date selection covers 1800–2050. The video advances the same clock. Days passed remains distinct from the displayed calendar date. Moon phases and surface spin remain illustrative.

17 unit tests pass, including six independent Horizons positions at J2000 and 2030. The Neptune J2000 discrepancy is about 0.00735 AU (~1.1 million km); the regression bound is 0.01 AU and is not an all-date accuracy guarantee. UTC-to-TDB corrections are omitted. Earth is the Earth–Moon barycenter. Sources and exact API requests are stored beside data/fixtures.

33 browser checks and 8 recovery checks pass, including WebGL-disabled 2D selection. Standard main JS is 88.42 KB raw / 42.84 KB gzip; scene JS 589.47 KB raw / 147.48 KB gzip; fallback 1.72 KB raw / 0.89 KB gzip. Load time and physical-device FPS need a fresh final run; earlier measurements are not reused as current results.

## Classroom release checkpoint — 19 October 2026

Teacher/student activities: `src/modes/classroom.js`, `quiz.js`, `src/data/lessons.json`, `questions.json`, `main.js`, templates and CSS. Three guided lessons, focus lock, explanatory quiz feedback and local scores. Test with `node tests/classroom.mjs` and the quiz sequence in `tests/browser.mjs`.

Scale Journey and sharing: `src/modes/journey.js`, `src/utils/share.js`, `main.js`, `tests/journey-share.test.js`. True body sizes and orbital distances, a frozen-date Sun–Neptune flight, pause/seek, calculated light time, validated date/planet/view URLs and browser history restoration. General time/scale controls are disabled during the journey. Test via Classroom → Start Scale Journey, or open `?planet=mars&date=2030-01-01&mode=true-scale`.

Languages and reading layout: `src/i18n/*`, catalog/reference JSON, templates, tour, CSS and language tests. English/Tamil/Hindi dictionaries cover facts, quizzes and lessons; the adapter also translates generated UI text. Mobile planet tabs scroll without overlapping. Legacy templates still contain English lookup strings; moving every template to explicit translation keys remains a maintainability improvement. Native-speaking teacher review remains needed.

Release: About page, original social preview, README, architecture, asset provenance, MIT code license and Pages workflow. Automated accessibility scans report no violations across six tested screens; this is not a full accessibility certification. Offline reload works at both the root and `/3DSolarSystem/` deployment path. All 20 unit tests, 33 browser checks, 8 recovery checks, classroom and language flows pass.

### Final measured build

Standard textures are now 768px WebP; Lite remains 512px. Texture downloads begin alongside the lazy 3D engine after the user enters the explorer. Offline registration waits four seconds after document load to avoid competing with initial rendering. The ready-for-offline message still waits for cache completion.

| Cold production build | Standard | Lite |
| --- | ---: | ---: |
| Landing load | 865 ms | 880 ms |
| Navigation to usable 3D, including entry click | 2611 ms | 2504 ms |
| Response-body bytes through usable 3D | 473111 | 330919 |
| Offline copy ready | 6446 ms | 6756 ms |
| Total response-body bytes through offline ready | 703471 | 703471 |
| Browser frame cadence | 60.05 fps | 60.11 fps |
| 95th percentile frame interval | 17.0 ms | 16.9 ms |

Reproduce with `npm run build` then `node tests/performance-release.mjs`. The harness serves gzip text with one shared 4 Mbps response-body budget and 150 ms delay per request, including service-worker requests. Fresh Chrome contexts, Intel Iris Xe desktop GPU, 390×844 at DPR 2, no CPU throttling; single runs. Bytes exclude HTTP headers. This is a local controlled measurement, not a public-host latency test, GPU-render-time measurement, or physical-phone certification.

The final dist inventory is 1,462,194 bytes before transport compression. Main JavaScript is 141.18 KB raw / 56.46 KB gzip; lazy scene JavaScript 590.57 KB raw / 147.74 KB gzip; CSS 42.47 KB raw / 9.60 KB gzip. Tamil/Hindi load as separate chunks. Features share one build, so individual incremental load/FPS numbers are not claimed.

Before a broad school rollout: test a real mid-range Android phone and an old classroom PC; review Tamil/Hindi lesson wording with teachers; confirm redistribution rights for inherited imagery. The local changes have not been published to the live site.
