# Learning design

## Product promise

The experience turns a familiar solar-system diagram into a testable mental model. Learners predict what should happen, observe the simulation, and then receive a short explanation that names the cause rather than only the result.

## Audiences and difficulty levels

| Level | Audience | Design choice |
| --- | --- | --- |
| Explorer | Around 10 years | Friendly language, short facts and concrete comparisons. |
| Student | Around 15 years | More precise vocabulary, relationships and numerical context. |
| Advanced | Deep dive | Model assumptions, periods, approximations and orbital reasoning. |

All level metadata lives in `js/data/learning.js`, so future translations can replace copy without changing scene logic.

## Learning objectives

1. Explain why seasons happen through axial tilt.
2. Compare planetary size with the much larger distances between planets.
3. Compare rotation periods (days) with orbital periods (years).
4. Describe why outer planets move more slowly in plain language.
5. Relate surface gravity to weight on different worlds.
6. Use alignment and shadow geometry to explain moons and eclipses.
7. Read a visual model critically, distinguishing compressed display scale from real measurements.

## Missions

The planned mission sequence is stored as data and designed for two-to-four-minute loops:

- **Why do we have seasons?** Change Earth’s tilt, predict the sunlight angle, observe it, then explain it.
- **How big is space?** Use analogies and a light-travel pulse to make distance memorable.
- **Days vs years** Compare rotation and revolution, including Venus’s retrograde day.
- **Why do outer planets move slowly?** Plot period against distance and discover Kepler’s relationship.
- **Your weight on other worlds** Enter a mass and compare surface gravity.
- **Moons and eclipses** Explore alignment, phases and shadow geometry.

## Misconceptions addressed

The experience explicitly corrects the ideas that seasons come from distance, planets are physically close together, the Sun is a solid coloured ball, every day is shorter than its year, and every planet moves at the same orbital speed.

## Predict → observe → explain

Every mission and future assessment should follow this sequence:

1. Ask for a prediction before changing the scene.
2. Let the learner manipulate one meaningful variable.
3. Reveal the observed result.
4. Explain the causal relationship in one or two sentences.
5. Record the outcome so missed ideas can be revisited.

## Assessment and progress

`js/progress.js` wraps `localStorage` safely and stores difficulty, completed missions, quiz attempts and discoveries. If storage is unavailable, the product continues with an in-memory session. Future mission and quiz screens should use the same store and re-ask missed concepts with spaced review.

## Data and accuracy

Planet values are maintained in `js/data/planets.js`. Sources are listed in `js/data/learning.js` and `ATTRIBUTION.md`. The visual system is intentionally compressed for comprehension; the UI must always identify that approximation.

## Interview talking points

1. A shared planet data model drives scroll sections, scene objects, cards and future missions.
2. A single Earth-day simulation clock keeps orbit, spin and moon motion coherent.
3. Learning copy is separated from scene logic to support difficulty levels and translation.
4. Progress storage is capability-safe, so privacy settings do not break the experience.
5. Mission contracts describe objective and interaction before visual implementation.
6. Compressed scale is labelled as a teaching choice rather than presented as a physical diagram.
