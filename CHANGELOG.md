# Changelog
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: SemVer (0.x until first public release).

## [Unreleased]
### Added
- `docs/standards/`: full repository snapshot of Studio Standards v0.1 and AI Vibe-Code Rules 0.6.0 (governance, templates 01–06, agent workflow, setup manifest, ruleset changelog, verbatim setup templates) so agents need no Notion access.
- M1 core loop playable: `DaySim` gameplay core (blanch, bowl assembly, broth, toppings, garnish, customers with patience, serving, tips, 3-minute day, win/lose summary) with 24 unit tests.
- Presentation: cart interactables (basket, pot, bowl, topping trays, garnish jars, trash), walking/sitting customers, bowl contents view, pointer input (hold / tap / drag-drop, mouse + touch), Vietnamese HUD, order bubbles with patience bars, hold gauge, FTUE hint, day summary with "Bán lại".
- `docs/ARCHITECTURE.md` and draft mechanic specs MEC-002…004.
- M2 visual pass (owner-approved, visuals only): night street lighting (warm key + cool rim, street lamp, festoon bulbs over the tables, hanging bulb over the cart, flicker), tiled sidewalk / asphalt / curb / puddles, parked scooters, CSS vignette, ACES tone mapping.
- Cart & food: stainless pots with visible simmering broth (daikon, bone, fat droplets), boiling water bubbles, steam from the broth pot, water pot (stronger while blanching) and the bowl once broth is in; glass cabinet with noodles and herbs; stainless topping pans; patterned bowl; noodle-strand nests instead of blobs; better shrimp, pork, egg, scallion pieces; spare bowls, chopsticks and chili sauce; spoked wheels; nicer plastic tables and stools.
### Changed
- Red awning removed (it hid seated customers); replaced by a slim pipe with a shaded bulb.
- `AGENTS.md`, `README.md`, `docs/README.md` point agents to `docs/standards/` as binding rules.
- Camera moved closer and tables pulled toward the cart so tap targets stay usable on landscape phones; HUD text scales with viewport height.
### Fixed
### Removed

## [0.0.1] - 2026-11-06
### Added
- Project scaffold: Vite 5, Three.js 0.170, TypeScript 5, Vitest 2.
- Agent rules and docs from AI Vibe-Code Rules 0.6.0 (AGENTS, CLAUDE, GDD, STATUS, DECISIONS, docs map, code map).
- Greybox low-poly street scene: noodle cart, three plastic tables with stools, street lamp, fixed tilted camera.
- MEC-001 blanch timing grade (`gradeBlanch`) with balance config and unit tests.
