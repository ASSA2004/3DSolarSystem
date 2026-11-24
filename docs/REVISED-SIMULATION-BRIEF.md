# Revised simulation acceptance contract

The attached brief dated 24 November 2026 supersedes the previous emphasis on cards, guided content and decorative gateway objects.

Retain the existing vanilla Three.js application, pure engines, clock, accessible controls and offline system. Do not claim this revision complete until its behavior is implemented and tested.

- Solar: readable revolution, relative speed and distance; removable overlays and reset.
- Water: one experimental state drives vessel, water level, heat, vapor, molecular movement and view transitions. Solid vibration, liquid proximity and escaping gas must be distinct. Cooling an open vessel cannot magically recover escaped mass. Atomic detail must identify its schematic scale; electrons must not be drawn as literal planetary orbits.
- Optics: human observation, geometric rays and wave explanation are separate representations of the same configured experiment. Include convex/concave lenses, prism and plane mirror; reflection and refraction respond to surface orientation and optical properties.
- Dimensions: XY-constrained manipulation and real XYZ manipulation with square/cube correspondence. A projection is not a two-dimensional physical cube.
- Interface: experiment first; explanations dismissible; mobile controls never cover the experiment. No decorative equipment lists.
- Validation: scientific invariants, meaningful changes after input, retained context between views, desktop/mobile review and honest approximation labels.

Initial code audit confirms missing coupled macroscopic/molecular/atomic water views, prism/plane-mirror/wave optics, and integrated XY/XYZ dimension controls. Blender was not found on the command path; do not claim Blender assets were created. Asset modeling must support the experiment and does not replace real-time simulation math.

## Implementation and acceptance evidence

| Brief requirement | Implemented behavior | Verification |
| --- | --- | --- |
| Solar revolution, time and distances | Existing JPL positions/single clock; Normal, Details, Video retained; hide/show panels and non-overlapping label placement | `browser.mjs`, `offline.mjs`, orbital/date unit tests |
| Real water experiment | Open vessel, heater, thermometer, ice, level, boiling bubbles and rising mist respond to one enthalpy state | `science-browser.mjs` heats to the 100°C plateau, then cools to liquid |
| Linked molecular view | Lattice vibration, close liquid encounters and escaping gas; temperature-dependent mobility; escaped mass never returns on cooling | phase/mass tests and retained-temperature browser checks |
| Atomic/subatomic view | Inspect oxygen-16, hydrogen-1 and the oxygen nucleus; labelled protons, neutrons, electron probability envelope | view switching and atom selection on desktop/mobile |
| Purposeful optics views | Human observation, directional rays, slowed wavefronts; convex/concave lenses, prism and plane mirror; movable element and rotatable surfaces | all four elements × all three views; reflection/Snell/TIR/frequency unit tests |
| Genuine 2D/3D | Z=0 with fixed perpendicular camera in XY; solid geometry, Z translation and camera orbit in XYZ; square/cube correspondence | constrained-position unit test; drag, depth preservation, desktop orbit and mobile pinch browser checks |
| Remove clutter | Static gateway, collapsed optional learning/notebook, hidden irrelevant inputs, dismissible explanations and Solar panels | accessibility, narrow-width overflow and disclosure checks |
| Reset and retained context | Experiment reset and camera reset remain separate; changing view retains experiment state | browser checks and thermal-state unit check |
| Offline | Entire build cached after readiness, including lazy scientific views and reflection code | disconnected navigation through five labs and scientific tabs |

## Scientific boundaries

- Water assumes 1 atm and a uniformly heated sample. Heat/Cool are accelerated energy inputs, not calibrated laboratory power. The slider prepares a new sample. Specific enthalpy is zero for ice at 0°C. Escape rate, trajectories and visible condensed mist are illustrative; sub-boiling evaporation, humidity and a full open-system energy balance are not simulated.
- Oxygen's probability cloud is schematic, not a computed multi-electron orbital. Hydrogen's cloud is spherical. Nuclei are enormously enlarged. Heating changes molecular motion, never proton/neutron counts. The brief's fission condition does not apply because this app does not demonstrate a nuclear reaction.
- Geometric optics assumes ideal surfaces. Prism index is adjustable but wavelength-independent: no rainbow/dispersion claim. Wavefronts represent phase, not photons. Lens math is paraxial; human-view material shading is an approximation. Real lens images are drawn on a screen, not as extra physical candles.
- Dimensional shape examples are mathematical idealizations. The screen always shows a projection of 3D. Sphere/cylinder flat circles represent a face/cross-section or projection, not a flattening that preserves every surface measurement.
- Sources: [phase change](https://openstax.org/books/physics/pages/11-3-phase-change-and-latent-heat), [refraction](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction), [thin lenses](https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses), [atomic probability](https://openstax.org/books/chemistry-2e/pages/6-3-development-of-quantum-theory), and the existing NASA/JPL orbital data citations.

Browser checks use actual WebGL simulations in desktop Chrome and mobile/touch emulation. They do not certify physical phones, Safari or school hardware. Native-language classroom review remains necessary.

## Live-site follow-up — version 2026.11.24.2

The user's in-app browser reproduced the old animated gateway although GitHub Pages had the new release. The old cache-first worker kept serving its installed HTML, and the asynchronous offline-ready message could overwrite the update offer. The worker now fully caches and activates new releases without automatically reloading an ongoing lesson. New documents expose a version, an explicit update check and a dismissible reload notice. The upgrade test covers legacy workers as well as the current updater, saved notebooks and disconnected reuse.

A second interaction review corrected Ray diagram (now switches to rays), Flat view (now selects the actual XY representation), and experiment reset (also resets the camera). Water's percentage now explicitly means liquid plus ice remaining, avoiding a nonzero vessel reading when only gas remains. Atomic copy explains proton/neutron colors, and lens-bench components have visible supports. Readouts use plain names (Energy per kg, Object distance, Image size and Image type) while signed optics equations remain in Model and sources. These are behavior and teaching corrections within the supplied brief.

Verification: tests/update-browser.mjs, tests/science-browser.mjs, existing Solar/lab/teaching/offline/accessibility suites, unit tests, lint, formatting and production build. The static design scanner has seven known false positives on delegated actions; runtime tests verify those controls. Physical-device classroom review is still outside browser emulation coverage.
