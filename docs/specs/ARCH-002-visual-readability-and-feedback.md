---
id: ARCH-002
type: architecture
status: approved
owner: tech-lead
version: 0.2
parent: GDD
related: [ARCH-001, PLAN-001]
studio_standard: 0.1
updated: 2026-11-07
---
# ARCH-002 — Visual readability, polish and feedback (M2)

> Presentation only. This spec adds no gameplay rule and changes no balance value. It realizes GDD §6 (juice) and §10 (art, audio, UI direction) on top of ARCH-001. Approved by the owner on 2026-11-07 with the default answers in §7. Phase 1 may start; VIS-206 and VIS-408 stay deferred.

## 1. Scope and constraints
- In scope: `src/scene/`, `src/ui/`, `src/input/`, `src/game/` (wiring only), `index.html` styles.
- Out of scope: `src/core/`, `config/balance.json`, MEC-001…004 rules, camera framing, positions of interactables (see Open questions).
- Hard limits: 60 fps on a mid-range phone, bundle ≤ 1 MB gzip (now ≈ 141 kB), no new dependency, no post-processing, no external art assets (DECISIONS 2026-11-06 and 2026-11-07).
- Art direction is unchanged: warm low-poly night street. Rule recorded here: flat shading for environment, people and raw food; smooth shading only for hero props (pots, bowl, glass).
- Reference viewports for every check: **844×390** (phone landscape) and **1480×1220** (desktop-like, the owner's screenshots).

## 2. Findings this spec answers (evidence)
Source: visual audit of 2026-11-07 (code review + owner screenshots). IDs are used in tests and commits.
| ID | Finding | Evidence |
|---|---|---|
| V1 | Floor grout lines too dark and tile scale equals tray scale | `src/scene/textures.ts` sidewalk grout alpha 0.8, 3 px; `atmosphere.ts` repeat 15×4 |
| V2/N8 | Counter and trays are the same light grey as food; counter blown out at center-left, pots and jars near black | `cart.ts` counter `steelMat(0xb5b2aa)`; screenshots |
| V3 | Counter has no visual zones | `cart.ts` layout on one flat surface |
| V4/N6 | Labels ≈ 11.7 px at 844×390, no icon, none for pot/basket/bowl, topping labels cover the food | `styles.ts` `.htg-label`; `game.ts` `labels()` |
| N7 | Order bubbles and floating text anchor ≈ 0.8 units above seated heads | `game.ts` `HEAD_HEIGHT = 1.75` vs `customers.ts` seated y |
| U3 | Order bubble does not show what the current bowl already has | `widgets.ts` `OrderBubbles.create` |
| N1/N2 | Trash can oversized and near black; garnish jar lids hide contents, sprouts lid is orange | `props.ts`, `cart.ts` `buildJar` |
| V8 | Empty bowl reads as a dark steel funnel | `bowl.ts` inner shell `BackSide`, dim light |
| V5 | Garnish pieces ≈ 2 px at 844×390 | `bowl.ts` `garnishPieces` sizes |
| V6/V7 | Mixed shading language, metals have no reflections | `primitives.ts` vs `cartParts.ts` |
| L1/L2 | Uneven local light, shadow frustum ±7, no contact shadow | `cartParts.ts` lamp intensity 7; `atmosphere.ts` |
| N3/N4/N9 | Festoon poles become huge diagonals; cart lamp pipe pierces the cabinet; cabinet strip light blown out | `atmosphere.ts`, `cartParts.ts` |
| U1/U2 | Invalid taps silent; no hover/pressed/disabled/completed states; drag snaps back | `game.ts` `onTap`/`onDrop`; `pointer.ts` |
| J2–J9 | No pop-in, no coin/tip effect, minimal customer reaction, no sound or haptic | `bowl.ts`, `fx.ts`, `customers.ts` |

## 3. Requirements and acceptance criteria
Numeric targets marked *(tune)* are proposals to be fixed during the phase and recorded in the PR.

### Phase 1 — Visual readability
| ID | Requirement | Acceptance |
|---|---|---|
| VIS-101 | Order bubbles and floating text anchor just above the seated head (N7) | Bubble tail tip is within ≈ 40 px of the customer's head top at both viewports; no bubble overlaps the HUD |
| VIS-102 | Each order chip shows done / not done against the current bowl (U3). Done chips are dimmed with a check mark. A fully satisfied bubble gets a distinct state. Display only, no sim change | Unit test of the pure helper; screenshot with a partial bowl shows mixed chip states |
| VIS-103 | Floor reads as background (V1): grout contrast reduced, floor mean luminance below counter mean luminance | Screenshot luminance check *(tune)*; grout no longer aligns visually with tray edges |
| VIS-104 | Food stands out from the counter (V2, N8): darker counter value, dark tray liners, no clipped counter area | In the screenshot < 2 % of counter pixels are fully saturated white *(tune)*; every topping is distinguishable from its tray |
| VIS-105 | Labels are readable and consistent (V4, N6): pill with icon + word, ≥ 12 px at 844×390, shared icon set with order chips, unambiguous icons for liver and pepper, labels sit outside the food they name, labels for pot, basket and bowl | Visual check at both viewports; no label covers an ingredient |
| VIS-106 | Counter zones (V3): ingredients, cooking, assembly; a ring marks where the bowl rests | Zones visible at both viewports; no hit box or interactable position changes |
| VIS-107 | Trash can scaled down visually and toned down; garnish jars show contents (N1, N2); lid colors neutral | Trash hit box screen size not smaller than before; jar contents visible |

### Phase 2 — Asset and material polish
| ID | Requirement | Acceptance |
|---|---|---|
| VIS-201 | Empty bowl reads as a white glazed bowl with blue rim (V8) | Screenshot of the empty bowl |
| VIS-202 | Hero props refined (bowl, pots, trays): silhouette, proportion, rim | Before/after screenshots |
| VIS-203 | Material rules applied (V6): flat for environment/people/raw food, smooth for hero props; steel vs plastic vs glaze vs wood distinguishable | Rule listed in DECISIONS; spot check |
| VIS-204 | Ingredient size and color tuned for the phone viewport (V5): garnish pieces ≥ ≈ 4 px at 844×390 | Pixel measurement from screenshot |
| VIS-205 | Finished bowl layout stable and attractive (toppings keep fixed positions per type) | Screenshot with full bowl |
| VIS-206 | Metal reflections: **owner decision** (code-generated env map vs fake highlights) | Decision recorded before work |

### Phase 3 — Lighting and environment
| ID | Requirement | Acceptance |
|---|---|---|
| VIS-301 | Lighting hierarchy: work area brightest and warm, tables medium, street dark and cool; warm night mood kept | Screenshot review |
| VIS-302 | Even local light on the counter (L1, N8): no blown-out half and no black half | Left/right counter mean luminance ratio within *(tune)* |
| VIS-303 | Shadows and depth (L2): tighter shadow frustum, soft contact shadows under pots, trays, bowl, tables and stools; no screen-space AO | Frame time not worse than baseline by more than *(tune)* on a throttled run |
| VIS-304 | Background decluttered (L3, N3, N4, N9): festoon poles out of frame or thin, lamp pipe no longer pierces the cabinet, cabinet strip not clipped, signs and halos toned down | Screenshot review |

### Phase 4 — Game juice and animation
| ID | Requirement | Acceptance |
|---|---|---|
| VIS-401 | Hover (mouse) and pressed (touch) highlight on interactables, drawn on the FX layer so raycasts ignore it (U2) | Hover halo appears on valid targets only; raycast results unchanged |
| VIS-402 | Invalid action feedback and disabled states (U1): short shake or flash, tray dimmed when the step is not available. The controller reads sim return values | Tapping a topping before noodles gives visible feedback and no state change |
| VIS-403 | Pop-in for added toppings and garnish; scatter effect for garnish (J2) | Visible on add; no frame drops |
| VIS-404 | Drag polish (J3): lift and scale while dragging, valid drop targets highlighted, eased return | Drag basket to bowl and bowl to table shows highlight and easing |
| VIS-405 | Pot and steam tuning (J6): stronger steam on pour and on topping add | Visual check |
| VIS-406 | Customer reactions (J4, N10): happy and angry reactions, readable face | Visible on serve and on give-up |
| VIS-407 | Coin pop and tip sparkle on payment (J7); "bowl ready" cue on bowl and target table when the order is complete (U4, J5) | Coin effect on every serve; sparkle only on perfect |
| VIS-408 | Sound and haptics (J8, J9): synthesized WebAudio, `navigator.vibrate`. **Blocked until the owner lifts the deferral in DECISIONS 2026-11-07** | Owner approval recorded |

## 4. Runtime components touched
| Component | Change | Interface impact |
|---|---|---|
| `src/ui/orderProgress.ts` (new, pure) | Compare an `Order` with a `Bowl` | `orderProgress(order, bowl)`; imports core types only |
| `src/ui/widgets.ts`, `styles.ts`, `strings.ts` | Chips with state, label pills, icon set | `BubbleData` gains a progress field |
| `src/scene/customers.ts`, `props.ts` | Exported seated-head height; trash visual scale | Constant exported for the controller |
| `src/scene/cart.ts`, `cartParts.ts`, `atmosphere.ts`, `textures.ts`, `palette.ts` | Materials, zones, lights, floor | None |
| `src/input/pointer.ts` | Phase 4 only: optional `hover(name \| null)` in `PointerHandlers` | Backward compatible (optional) |
| `src/game/game.ts` | Wiring, label list, anchors | No change to `DaySim` calls |

Layering from ARCH-001 §2 is unchanged: the UI never imports `three`; views never call `DaySim` actions.

## 5. Failure modes
- Hover halo or zone meshes must never become raycast roots: they are not registered in `interactables`, and halos live on the FX layer.
- Material changes must not alter hit boxes (invisible `hitBox` meshes stay as they are).
- Any new light is non-shadow-casting. If frame time regresses, drop the new light first.

## 6. Verification
Per phase, before merge (AGENTS §6b):
1. `npm test` (existing 24 tests plus new unit tests), `npm run typecheck`, `npm run build`.
2. Headless Playwright run at both viewports with `Math.random` pinned so seeds repeat; no console errors.
3. Before/after screenshots for: empty start, 3 customers waiting, partial bowl, full bowl, after a serve.
4. Pointer behavior unchanged: press, release, tap, drag-drop still work (smoke run).
5. Docs sync: CODEMAP, STATUS, CHANGELOG; DECISIONS for each non-obvious choice.

## 7. Owner decisions (2026-11-07, "use defaults")
1. **Trash can position:** not moved. VIS-107 scales only the visual; the hit box and position stay (DECISIONS 2026-11-06 "Tighter framing").
2. **Extra items in the bowl:** no warning state. Chips show only done / not done.
3. **Progress on bubbles:** every bubble shows progress against the current bowl.
4. **Env map (VIS-206) and sound / haptics (VIS-408):** deferred. Revisit before Phase 2 (env map) and Phase 4 (sound, haptics).
5. **Icon set:** keep emoji, replace the ambiguous ones (🟤 liver, ⚫ pepper) with clearer picks, shared by bubbles and labels.

## Linked design requirements
GDD §3 (readable controls), §3b (FTUE hint), §6 (feedback table), §10 (art, UI). MEC-002 (bowl contents, read only), MEC-003 (customer states, read only).
