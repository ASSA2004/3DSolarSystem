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
