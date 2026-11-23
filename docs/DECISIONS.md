# Prayog Lab v0.1 decisions — 23 November 2026

## Audit before implementation
- Existing repository: vanilla ES modules, Three.js 0.186.1, Vite, selective strict TypeScript, Vitest, Playwright, ESLint and Prettier. Preserve these and the Git history.
- Solar rendering, labels, camera controls, JPL orbital clock, lessons and offline cache already work. Live desktop/mobile browser regression: 33 checks pass.
- Visual inspection: mobile Details expands over nearly all the scene; date input is blank despite an active date; dense header and icon-only actions need clearer navigation when entering from a wider lab suite.
- Code: main.js coordinates many unrelated concerns; avoid extending it into a five-lab monolith. Keep Solar as its own entry and use shared lifecycle/learning UI for new labs.
- Asset loading: existing WebP tiers and lazy solar scene are reusable. No new external requests at runtime. All fonts and assets must be served locally.
- Existing project was moved to E:/works/web/3DSolarSystem-main. Restored a copy with its original Git history into this chat's authorized workspace; moved source remains intact.
- Adjacent standalone prototypes use CDN libraries/fonts. Treat them as reference, not deployable dependencies. Photosynthesis and heart/lung prototypes are out of this brief's scope.

## Scope and assumptions
The brief says four labs in places but explicitly enumerates five and the current request says all five. Implement Solar System, Optics, States of Matter, Mensuration 2D and Mensuration 3D, plus the gateway. Preserve Solar Normal/Details/Video.
Working brand: Prayog Lab. Audience: Grades 5–8, state-board classrooms. Chapter alignment is school-owned; do not invent chapter numbers. English complete for new labs; Tamil scaffolding visibly falls back to English until teacher-reviewed. Preserve existing Solar Tamil/Hindi.
No accounts, tracking, cookies, backend or third-party runtime requests. Local theme and notebook data only. Native select/date popups are intentionally platform-owned for keyboard/touch access.

## Architecture and delivery plan
1. Shared CSS tokens and one JS material-token adapter, self-hosted type, original SVG logo; Morning Lab / Night Observatory follow system then saved choice.
2. A five-destination gateway with keyboard DOM controls over a lightweight lazy Three scene. Reduced motion and WebGL failure use complete static cards.
3. Pure engines for Cartesian-sign optics, enthalpy/phase change and measurement/net mathematics, independently tested.
4. Each new lab lazily imports its scene; shared renderer owns resize, visibility, controls, picking and disposal. Each lab owns its experiment model. Typed content owns guided actions, checks and explanations.
5. Teach: three steps; explanation unlocks only after the action. Experiment: predict, test, explain, record readings in a bounded local notebook. Same controls and navigation across labs.
6. Solar remains an independently loaded document to preserve working simulation ownership and avoid mixed listeners. Its entry gains a return-to-labs link and theme adapter; original deep links continue to resolve.
7. Extend offline cache to every built entry, font and asset. CI checks physics, types, formatting, accessibility, lab entry/modes/themes and offline use before Pages publication.
8. Review 360px mobile, desktop/projector, both themes, reduced motion, unavailable WebGL, keyboard and repeated scene disposal. Record measurements, not unsupported performance claims.

## Scientific boundaries
Optics is a paraxial thin-element model, not full ray refraction. Cartesian x increases to the right: real object u<0; lenses use 1/v−1/u=1/f, m=v/u; mirrors use 1/v+1/u=1/f, m=−v/u. Concave mirror f<0, convex mirror f>0. Infinity is an explicit state.
Matter uses water at one atmosphere: melting 0°C, boiling 100°C. Energy changes intermolecular arrangement during plateaus, not the covalent bonds inside water molecules. Particle motion is a qualitative kinetic model, not molecular dynamics or a pressure prediction. References: OpenStax Physics 11.3 and University Physics 3 sections 2.2/2.4.
Sphere has no exact flat net: show gores as an explicitly approximate representation, never a false exact net. Cone net is a sector of radius slant height and arc length 2πr.
