# Shared learning interaction contract
Visual direction: DESIGN.md. Business assumptions: docs/DECISIONS.md.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native HTML select | src/lab-ui/shell.js | device popup | tests/labs.mjs |
| Date | Native HTML date | src/main.js | UTC, 1800–2050 | tests/browser.mjs |
| Form | Shared labelled controls | src/lab-ui/shell.js | handles and sliders | tests/labs-teaching.mjs |
| Scrollbar | Browser scroll | css/labs.css | mobile page, desktop panel | tests/labs.mjs |
| Toast | Shared live region | src/lab-ui/shell.js | save and error | tests/labs.mjs |
| Navigation | Gateway and shared shell | src/lab-app.js | Teach/Experiment | tests/labs.mjs |


Teach explanations unlock after a model action; a check question precedes the next step. Experiment requires a prediction before Test and recording. Changed controls make prior results stale. Notebooks retain the latest 20 rows locally. No account or personal data. Rendering stops when hidden. Exiting disposes scene resources and listeners. WebGL failure leaves controls and numeric evidence available. Failed imports offer retry and return. Focus moves to the lab heading and returns to the gateway button. Theme persists; locale fallback is explicit. Native date/select popup geometry and locale are platform-owned.


## Static scanner limitations
The premium static scanner reports eight actionless-button findings because it does not resolve delegated `data-*` event handlers. The buttons are owned by the click handlers in src/lab-app.js, src/lab-ui/shell.js, src/lab-ui/solar-learning.js and src/main.js. Playwright checks exercise these actions, teaching gates, navigation, notebook operations and classroom controls. No inline event-handler workaround is used.
