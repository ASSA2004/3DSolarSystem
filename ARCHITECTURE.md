# Architecture

Orbit uses vanilla JavaScript ES modules, Three.js and Vite. Existing scene,
UI and tour logic was moved and extended rather than replaced by a framework.

```mermaid
flowchart LR
  Input[Keyboard, touch and UI] --> App[Application state]
  App --> Clock[Single simulation clock]
  Clock --> Orbit[Kepler solver and JPL JSON]
  Orbit --> Scene[3D scene or 2D fallback]
  App --> Learning[Lessons, quiz and journey]
  Learning --> UI[Accessible HTML controls]
  App --> UI
  Languages[Language JSON] --> UI
  Storage[Local device storage] <--> Learning
  Cache[Versioned offline cache] --> App
```

## Modules

- `src/core`: rendering, controls, simulation clock, quality detection, offline registration, 2D fallback.
- `src/data`: physical reference values, sourced orbital elements and lesson sequences.
- `src/ui`: templates and icons. HTML buttons remain available independently of ray picking.
- `src/modes`: guided video, quiz, teacher activities and Scale Journey.
- `src/i18n`: English, Tamil and Hindi dictionaries and DOM translation adapter.
- `src/utils`: orbital calculations, dates, storage, assets and validated share URLs.

## Simulation clock

`TimeController` owns the start Julian date and elapsed simulated days. Camera
easing uses render seconds; planetary motion uses days since J2000. Both normal
playback and the video advance the same clock. Video's chapter time is presentation
time, not a second planetary clock. Hidden tabs do not advance the simulation.
The date range is bounded to the sourced JPL table's 1800–2050 interval.

Calendar inputs represent midnight UTC. The current-date default starts at the
current instant. UTC is approximated as TDB for this classroom model; no time-scale
correction or light-time/aberration correction is applied to planet coordinates.

## Orbital model

JPL Table 1 supplies six elements and six rates per Julian century. The solver
reduces mean anomaly, solves Kepler's equation with Newton iteration, and rotates
orbital-plane coordinates into J2000 ecliptic coordinates. Three.js uses
`(X, Z, -Y)` so positive world Y is ecliptic north. Distances use all three axes.
Earth is represented by the Earth–Moon barycenter. Surface spin phases and moon
positions remain illustrative. Tests compare six positions with independent
DE441 Horizons fixtures. The measured Neptune J2000 discrepancy is about
0.00735 AU; this app must not be described as an exact ephemeris.

## Scale mapping

Compressed mode multiplies each planet's physical orbit by a planet-specific
factor, preserving its ellipse and inclination while bringing outer planets
closer. Display body sizes are enlarged. True scale uses 11 scene units per AU
for both distances and mean planetary radii. Labels remain readable screen-space
markers; they are not physical-sized objects. Focus adjusts the near plane and
camera distance so a tiny true-scale planet can still be inspected.

Scale Journey freezes the simulation date and moves along the Sun-to-Neptune
direction. Its 60-second presentation does not claim light-speed playback.
The light-time counter uses distance divided by 299,792.458 km/s. Other planets
are not rearranged along that ray. Reduced-motion users start with manual seeking.

## Lite Mode and lifecycle

Device memory and logical CPU hints offer Lite Mode; missing hints do not force
it. A warm-up period and five-second frame sample avoid reacting to initial
shader compilation. The user keeps control and the choice is stored locally.

Standard textures are 768px WebP; Lite textures are 512px. Lite caps DPR to 1,
uses fewer sphere segments and suppresses atmosphere/asteroid effects. Moon
textures are deferred until focus. There is no post-processing chain. Paused,
unchanged scenes skip drawing, while camera interaction still invalidates them.
Rendering resumes without catching up hidden time. Geometry, material and texture
disposal is centralized in the scene's disposal method.

WebGL 2 is required by the installed Three.js. Lite cannot restore unsupported
WebGL hardware; the 2D fallback retains planet selection and learning controls.

## Offline and privacy

The build generates a content-versioned service worker. It caches the small
production asset set before announcing offline readiness. New caches activate after a complete download; classroom documents are never automatically reloaded. A visible notice lets the user choose when to reload. URLs are scoped to the
deployment base. No accounts, analytics or server-stored student records are used.
Quiz progress and preferences are stored only in localStorage, with storage
exceptions handled. Source links require a connection and are not cached.

## Validation limits

Browser viewport emulation is not physical-device certification. Performance
records identify the network profile, hardware and measurement method. Translation
coverage and pedagogical wording need classroom review; do not infer approval by
NCERT or CBSE from a curriculum link. See `docs/performance.md` for measurements.


## Five-lab extension

```mermaid
flowchart LR
  Gateway[index.html / lab-app] --> Shared[Shared learning shell]
  Shared --> Content[Typed content and curriculum config]
  Shared --> Engine[Pure optics / matter / measurement engines]
  Shared --> Stage[Three Stage lifecycle]
  Stage --> Lab[Lazy lab scene]
  Gateway --> Solar[solar.html / existing Solar app]
  Solar --> Clock[Single Solar simulation clock]
  Cache[Versioned full offline inventory] --> Gateway
  Cache --> Solar
```

The Solar document retains ownership of its existing clock, camera and listeners. The gateway redirects old planet/date/view links to that entry. The learning adapter adds Teach/Experiment without replacing Normal/Details/Video. Learning panels are confined to Normal view to avoid obscuring Details and Video controls.

New labs use typed content in src/content, testable pure functions in src/engine, and one disposable Stage per mounted lab. Stage owns animation, visibility, resize, drag picking, orbit controls and GPU cleanup. Matter uses energy as state with separate latent-heat intervals. Geometry derivation moves actual pieces; the finite circle sectors approach the rectangle limit. Sphere gores remain approximate.

Hardware concurrency/memory hints select lower pixel ratio and particle count. FPS sampling can further reduce graphics; tab hiding stops rendering. Device hints are not a hardware benchmark. Shared tokens feed CSS and Three materials; Solar keeps a compatibility theme stylesheet. All fonts are local OFL variable fonts.

The service worker precaches every built entry, lazy chunk and local asset. A content digest changes the cache on release; activation is automatic while document reload remains a user action. Two previous caches retain chunks needed by open lessons. Offline readiness is separate from first interactive load, and the UI reports readiness only after cache installation. Cache-first navigation ignores query strings while app routing reads them. Notebook values are escaped and capped at 20 rows; storage denial leaves the current session usable.

## Scientific views (24 November 2026)

A lab owns one state object. `view` selects a representation without resetting temperature, enthalpy, optical configuration or shape coordinates. The shared shell renders each module's `views`; optional explanations use native disclosure elements. The gateway has no WebGL scene.

Matter advances specific enthalpy on the Stage clock. The same phase fractions drive the vessel fill, ice, boiling bubbles, mist, molecular motion and numeric readings. Escape monotonically removes sample mass; cooling cannot return escaped vapor. Molecular positions are deterministic teaching trajectories with bounded liquid interactions, lattice vibration and expanding gas. They are not molecular dynamics. Hydrogen density uses a spherical sample; oxygen's envelope is explicitly schematic. Nuclear structure is static and does not respond to heating.

`engine/rays.ts` handles unit-vector reflection, Snell refraction, polygon intersections and total internal reflection. Prism paths carry their refractive index and optical path offset so wavefront spacing and speed change together while frequency remains fixed. The plane mirror uses a real reflection render target in Human view, freed when the scene changes. Thin-lens screen images use the existing lens equation; glass appearance does not claim full camera ray tracing. Virtual images are marked as schematic apparent positions.

`engine/dimensions.ts` enforces Z=0 for XY. `labs/dimensions.js` uses ShapeGeometry for planar views and true solid geometry in XYZ, preserving coordinates when toggling. A drag plane at the object's depth preserves the initial grab offset; the Z slider provides depth translation. Camera rotation is disabled in XY and restored in XYZ. Cube/square correspondence is exact; other flat shapes are illustrative faces or projections, not claimed as volumetric solids.

Procedural geometry avoids downloading decorative models and keeps dimensions and optical surfaces aligned with their math. No Blender assets are required. Stage owns visibility pausing, pointer/touch controls, quality limits and disposal; Solar retains its separate existing clock and renderer.

## Release updates
Bump src/data/release.json for each published release. The build embeds this version in the app and service worker and emits dist/release.json. Worker installation completes the full offline cache before activation. Activation notifies clients; the shared offline controller compares worker and document versions without allowing the readiness promise to erase update feedback. Check for updates bypasses the browser's service-worker script cache. Both Solar and the gateway expose the version and update action. The bounded cache retention supports old open documents; no localStorage is cleared during updates.
