---
id: PLAN-001
type: plan
status: approved
owner: tech-lead
version: 0.2
parent: ARCH-002
related: [GDD, ARCH-001]
studio_standard: 0.1
updated: 2026-11-07
---
# PLAN-001 — Visual polish implementation plan (4 phases)

> Implements ARCH-002. Nothing here starts until the owner approves ARCH-002 and the open questions it lists for that phase are answered. One phase = one branch/PR-sized change set, reviewed before the next begins. Presentation only: `src/core/` and `config/balance.json` stay untouched.

## 0. Working rules (from AGENTS.md)
- English only for files, comments, commits. Player strings stay Vietnamese.
- Ask before: `npm install` (not yet run, dependencies are missing), `git push`, editing `AGENTS.md` / `CLAUDE.md` / `.claude/**`. Never read `.env`.
- Keep files under ≈ 300 lines. `scene/cart.ts` is 197 lines and `cartParts.ts` 249: split into a new file before crossing the limit, for example `cartZones.ts`.
- Docs sync per phase: `docs/CODEMAP.md`, `docs/STATUS.md`, `CHANGELOG.md` `[Unreleased]`, and a `docs/DECISIONS.md` entry for each non-obvious choice.
- Tooling note: the Superpowers plugin is enabled in `.claude/settings.json` but is not installed in this cloud session, so this plan follows its brainstorm → spec → plan → implement flow by hand.

## 1. Shared verification harness (do once, before Phase 1)
1. After owner approval: `npm install`, then record the baseline: `npm test` (expect 24/24), `npm run typecheck`, `npm run build` (expect ≈ 141 kB gzip).
2. Screenshot script kept **outside the repo** (scratchpad) unless the owner wants it committed. It launches `npm run dev`, uses Playwright Chromium, pins `Math.random` with `addInitScript` so seeds repeat, and captures at 844×390 and 1480×1220: empty start, 3 customers waiting (fast-forward by waiting real time or a debug seed), partial bowl, full bowl, after a serve. Baseline images are taken **before any code change**.
3. Check the browser console is empty in every run.

## 2. Phase 1 — Visual readability (ARCH-002 VIS-101…107)
Order is by player impact and by dependency. Each step is a separate commit.

| Step | Work | Files | Test first? |
|---|---|---|---|
| 1.1 | Anchor bubbles and floating text to the seated head (VIS-101). Export a seated-head height derived from `SEAT` and the sit offset; replace `HEAD_HEIGHT` use for customers | `src/scene/customers.ts`, `src/scene/index.ts`, `src/game/game.ts` | Visual check; unit test for the derived constant is optional |
| 1.2 | Order progress (VIS-102). New pure `orderProgress(order, bowl)` returning which toppings and garnishes are present. Bubble chips keep element references and toggle a `done` class each frame; fully satisfied bubble gets a class | `src/ui/orderProgress.ts` (new), `src/ui/widgets.ts`, `src/ui/styles.ts`, `src/game/game.ts` | **Yes**: `tests/orderProgress.test.ts` (empty bowl, partial, complete, extras ignored) |
| 1.3 | Floor (VIS-103). Lower grout alpha and width, dim sidewalk material color, check tile scale | `src/scene/textures.ts`, `src/scene/atmosphere.ts` | Screenshot luminance check |
| 1.4 | Counter value and tray liners (VIS-104). Darker, matte counter; dark inset liner in each tray; keep bright lips | `src/scene/cart.ts`, `src/scene/palette.ts` | Screenshot luminance check |
| 1.5 | Labels (VIS-105). Pill style with icon + word, ≥ 12 px at 844×390, shared icon constants with the bubbles, replace ambiguous icons, move topping labels to the tray front lip, add labels for pot, basket and bowl | `src/ui/styles.ts`, `src/ui/widgets.ts`, `src/ui/fx.ts`, `src/ui/strings.ts`, `src/game/game.ts` | Visual check; label key list is pure data |
| 1.6 | Zones and bowl ring (VIS-106). Thin inlay meshes, not registered in `interactables`, so raycasts ignore them | `src/scene/cartZones.ts` (new), `src/scene/cart.ts` | Pointer smoke run unchanged |
| 1.7 | Trash scale and garnish jars (VIS-107). Scale only the visual children, keep the hit box; smaller neutral lids, visible contents | `src/scene/props.ts`, `src/scene/cart.ts` | Pointer smoke run unchanged |

Exit: all VIS-1xx acceptance items met, 24 + new tests pass, build passes, console clean at both viewports, before/after images reviewed by the owner.
Risks: counter and floor values interact with the lights, so retune only enough to meet the targets; Phase 3 does the final light balance.

## 3. Phase 2 — Asset and material polish (VIS-201…206)
| Step | Work | Files |
|---|---|---|
| 2.1 | Empty bowl as white glazed bowl: brighter inner shell, rim highlight (VIS-201) | `src/scene/bowl.ts`, `src/scene/textures.ts` |
| 2.2 | Ingredient scale and color for the phone viewport; fixed topping slots in the bowl (VIS-204, 205) | `src/scene/bowl.ts`, `src/scene/palette.ts` |
| 2.3 | Hero props: bowl, pots, trays silhouette and proportion (VIS-202) | `src/scene/bowl.ts`, `src/scene/cartParts.ts`, `src/scene/cart.ts` |
| 2.4 | Material rules: flat vs smooth, steel / plastic / glaze / wood (VIS-203); record the rule in DECISIONS | `src/scene/primitives.ts`, `src/scene/cartParts.ts`, `src/scene/props.ts` |
| 2.5 | **Gate:** owner picks env map or fake highlights (VIS-206); implement the chosen option and retune | `src/scene/atmosphere.ts` or `src/scene/cartParts.ts` |

Exit: VIS-2xx acceptance met; bundle and frame time not worse than baseline beyond the agreed margin.

## 4. Phase 3 — Lighting and environment (VIS-301…304)
| Step | Work | Files |
|---|---|---|
| 3.1 | Define the hierarchy and a lighting table in the code comments or DECISIONS (VIS-301) | `src/scene/atmosphere.ts` |
| 3.2 | Even counter light: reposition or add one non-shadow warm light; rebalance street lamp and festoon (VIS-302) | `src/scene/cartParts.ts`, `src/scene/atmosphere.ts` |
| 3.3 | Tighter shadow frustum; soft contact-shadow decals under pots, trays, bowl, tables, stools (VIS-303) | `src/scene/atmosphere.ts`, `src/scene/cartZones.ts`, `src/scene/props.ts` |
| 3.4 | Declutter: festoon poles out of frame or thin, lamp pipe off the cabinet, cabinet strip light tamed, signs and halos toned down (VIS-304) | `src/scene/atmosphere.ts`, `src/scene/cartParts.ts`, `src/scene/props.ts` |

Exit: VIS-3xx acceptance met; frame time measured on a CPU-throttled run versus baseline.
Risk: re-lighting shifts the colors tuned in Phases 1–2; re-shoot the full screenshot set and compare.

## 5. Phase 4 — Game juice and animation (VIS-401…408)
| Step | Work | Files |
|---|---|---|
| 4.1 | Invalid-action feedback and disabled states (VIS-402): controller reads `addTopping` / `addGarnish` / `serve` results and triggers a flash or shake; trays dim when the step is unavailable | `src/game/game.ts`, `src/scene/cart.ts`, `src/ui/fx.ts` |
| 4.2 | Hover and pressed highlight (VIS-401): optional `hover` handler in `PointerHandlers`; halo on the FX layer | `src/input/pointer.ts`, `src/game/game.ts`, `src/scene/cartFx.ts` (new) |
| 4.3 | Pop-in and garnish scatter (VIS-403) | `src/scene/bowl.ts` |
| 4.4 | Drag polish (VIS-404): lift, scale, drop-target highlight, eased return | `src/input/pointer.ts`, `src/game/game.ts` |
| 4.5 | Steam tuning (VIS-405) | `src/scene/cart.ts`, `src/scene/steam.ts` |
| 4.6 | Customer reactions and face (VIS-406) | `src/scene/customers.ts` |
| 4.7 | Coin pop, tip sparkle, "bowl ready" cue (VIS-407) | `src/ui/fx.ts`, `src/scene/cartFx.ts`, `src/game/game.ts` |
| 4.8 | **Gate:** sound and haptics (VIS-408) only after the owner lifts the DECISIONS deferral; then a small synthesized-audio module, no assets | `src/audio/` (new), `src/game/game.ts` |

Exit: VIS-4xx acceptance met; pointer behavior and 24 + new tests unchanged; no per-frame allocations in the new effects (reuse vectors and pools).

## 6. Per-phase checklist
- [ ] Owner approved the phase scope and its open questions
- [ ] Baseline screenshots taken before code changes
- [ ] Tests written first for pure helpers
- [ ] `npm test`, `npm run typecheck`, `npm run build` pass
- [ ] Playwright smoke at 844×390 and 1480×1220, console clean
- [ ] Before/after images reviewed
- [ ] CODEMAP, STATUS, CHANGELOG, DECISIONS updated
- [ ] Commit messages in English; push only after owner confirmation

## 7. Out of scope (parked)
Camera or layout changes, new gameplay, meta progression, external assets, post-processing, SSAO.
