# Code map
Updated: 2026-11-07 · Keep under ~80 lines. One row per module, not per file.

## Entry points
| What | File |
|---|---|
| App bootstrap | `index.html` → `src/main.ts` |
| Main game scene / loop | `src/game/game.ts` (controller + frame loop), `src/scene/street.ts` (scene) |
| Balance config | `config/balance.json` |
| Test setup | `tests/` (Vitest, default config) |

## Modules
| Module (folder) | Responsibility | Key files (max 3) | Depends on | Requirement IDs | Tests |
|---|---|---|---|---|---|
| `src/core/` | Pure, seeded gameplay rules: `DaySim`, kitchen, bowl quality, RNG; no Three.js / DOM | `day.ts`, `kitchen.ts`, `bowl.ts` | `config/balance.json` | MEC-001…004 | `tests/blanch.test.ts`, `tests/bowl.test.ts`, `tests/day.test.ts` |
| `src/game/` | Controller: input → `DaySim` actions, sim events → views/UI, dt clamp | `game.ts` | core, scene, input, ui | ARCH §4–5 | Playwright smoke (manual) |
| `src/input/` | Pointer Events + raycasting; press / release / tap / drop on interactables | `pointer.ts` | `three` | ARCH §5 | — |
| `src/scene/` | Three.js models: street, cart + interactables, tables, customers, bowl/basket views; night atmosphere (`atmosphere.ts`), decorative cart parts (`cartParts.ts`), steam/halo sprites on FX layer 1 (`steam.ts`), counter zones (`cartZones.ts`), phone framing (`framing.ts`), procedural canvas textures (`textures.ts`) | `street.ts`, `cart.ts`, `atmosphere.ts` | `three`, core types | GDD §3, §6, §10, ARCH-002 | — (visual check) |
| `src/ui/` | DOM overlay: HUD, order bubbles with done / not done chips (`orderProgress.ts`, pure), counter label pills, rotate-phone popup (`rotatePrompt.ts`), hold gauge, hint, floating text, day summary; Vietnamese strings | `index.ts`, `widgets.ts`, `strings.ts` | core types | GDD §3b, §4, §10, ARCH-002 | `tests/orderProgress.test.ts`, `tests/phoneLayout.test.ts` |

## Do not read (generated, vendored or binary)
`dist/`, `build/`, `coverage/`, `node_modules/`, `assets/` binaries, lockfiles — unless the task is specifically about them.

## Conventions that help navigation
- One module = one folder with a small public entry (e.g. `index.ts`); other modules import only that entry.
- Keep source files under ~300 lines; split when larger.
- File and folder names match the domain terms in the GDD / MEC specs.
