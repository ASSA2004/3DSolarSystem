---
version: alpha
colors:
  morning: "#F6FBEF"
  ink: "#0E2A22"
  primary: "#007F72"
  coral: "#FF6A4D"
  night: "#0A1022"
  ice: "#E8EEFF"
typography:
  display:
    fontFamily: "Bricolage Grotesque"
  body:
    fontFamily: "Figtree"
  numeric:
    fontFamily: "JetBrains Mono"
rounded:
  panel: "16px"
spacing:
  unit: "8px"
components:
  button:
    height: "44px"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.morning}"
---
## Overview
Prayog Lab is a set of classroom instruments for ages 10–14. Its signature is the experiment itself, with a lens/particle/orbit emblem identifying the shared classroom tool. Keep scientific objects prominent and controls quiet. This is a product, not a marketing funnel.
## Colors
Canonical runtime tokens: src/lab-ui/tokens.js. setTheme maps each key to --lab-{key}; Three scenes read currentTokens(). Morning uses pale lime daylight, white surfaces and green-black ink. Night uses navy, ice text and restrained emission. Teal primary is darkened on light surfaces for contrast. Amber/coral/teal/violet identify labs, never encode a result alone.
## Typography
Self-hosted Bricolage headings, Figtree reading text, JetBrains Mono measurements. Tamil uses system script fallback. New lab body text: 16px. No promotional all-caps paragraphs.
## Layout
Desktop: visible scene beside a 360px lesson panel. Phone: scene above naturally scrolling controls; a drawer must not consume the whole experiment. Gateway has five compact destinations and no decorative scene. Minimum 44px targets. Browser owns native selects and date picker.
## Elevation & Depth
Thin borders and one quiet shadow distinguish controls. Avoid nested heavy cards. Glow belongs to light, particles and selected objects.
## Shapes
16px instrument panels, 10px controls. Preserve Solar's three-view visual grammar; adapt its header and mobile reading sheet.
## Components
Shared shell owns modes, prediction loop, notebook, focus, announcements and errors. Shared Stage owns orbit controls and disposal. Native sliders provide keyboard alternatives to handles. The gateway is static for everyone; reduced motion uses immediate camera transforms.
## Do's and Don'ts
Explain what children can change and observe. Never disguise approximations, invent curriculum chapters, or animate a false sphere net. No tracking or third-party runtime assets. No fake achievement claims.

## Release visibility
Both Solar and the other labs use src/core/offline.js and css/offline.css for version, offline readiness and update recovery. The version is always readable in the footer. A dismissible update notice explains that reloading restarts the experiment but retains saved notebooks. Installing an update never forces a running lesson to reload. Theme colors use the shared lab tokens with Solar-safe fallbacks.
