---
id: ARCH-001
type: architecture
status: approved
owner: tech-lead
version: 0.1
parent: GDD
related: [MEC-001, MEC-002, MEC-003, MEC-004]
studio_standard: 0.1
updated: 2026-11-06
---
# Architecture — Hu Tieu Ganh (M1)

## 1. Scope and constraints
Web only (WebGL 2), Three.js 0.170, TypeScript strict, Vite. 60 fps, ≤ 1 MB gzipped JS. Mouse and touch via Pointer Events. No backend, no save data, no third-party SDKs in M1.

## 2. Layering (dependency direction: top may import below, never the reverse)
| Layer | Folder | Responsibility | May import |
|---|---|---|---|
| App | `src/main.ts` | Bootstrap renderer, create `Game`, run loop | everything |
| Game controller | `src/game/` | Wires input → `DaySim` actions, sim events → views/UI; owns frame update | core, scene, input, ui |
| Input | `src/input/` | Pointer raycasting against named interactables; emits press / release / drag-drop | `three` |
| Scene / views | `src/scene/` | Three.js models: street, cart, interactables, customers, bowl contents | `three`, core **types only** |
| UI | `src/ui/` | DOM overlay: HUD, order bubbles, hold gauge, day summary. Vietnamese player strings in `src/ui/strings.ts` | core **types only** |
| Core | `src/core/` | Pure deterministic rules (`DaySim`), no `three`, no DOM | `config/balance.json` |

## 3. Core public API (`src/core/index.ts`)
Types in `src/core/types.ts`. Single entry class:
```ts
class DaySim {
  constructor(opts?: { seed?: number; balance?: Balance });
  readonly balance: Balance;
  readonly kitchen: Kitchen;                // live state, read-only for callers
  get customers(): readonly Customer[];
  get time(): number;                       // seconds since day start
  get revenue(): number;
  get ended(): boolean;
  update(dt: number): GameEvent[];          // advance time; returns events since last call (incl. from actions)
  // Cooking actions — return false/null when not allowed in current state (no throw)
  startBlanch(): boolean;                   // MEC-001
  releaseBlanch(): Grade | null;
  moveNoodlesToBowl(): boolean;             // MEC-002
  addTopping(t: Topping): boolean;
  startPour(): boolean;
  releasePour(): Grade | null;
  addGarnish(g: Garnish): boolean;
  discardBowl(): void;
  serve(table: number): Payment | null;     // MEC-004
  summary(): DaySummary;
  nextHint(): HintTarget;                   // FTUE pointer (GDD §3b)
}
```
Rules: `DaySim` never reads wall-clock time or `Math.random`; randomness comes from a seeded RNG (`src/core/rng.ts`). All tunables come from `config/balance.json`.

## 4. Lifecycle
Boot → `Game` creates `DaySim` → loop: `events = sim.update(dt)` → views react to events and read state → render. On `dayEnded` the summary overlay shows; "Play again" builds a new `DaySim` (≤ 1 s, no reload).

## 5. Interactable names (contract between scene, input and game)
`basket` (noodle basket over the pot), `bowl` (bowl on counter), `pot` (broth pot), `topping:<Topping>`, `garnish:<Garnish>`, `trash`, `table:<index>`. Scene sets `object.userData.interactable = '<name>'` on the root mesh/group.

| Interaction | Input | Core call |
|---|---|---|
| Blanch | hold `basket` | `startBlanch` on press, `releaseBlanch` on release |
| Noodles to bowl | drag `basket` → drop on `bowl` | `moveNoodlesToBowl` |
| Toppings / garnish | tap `topping:*` / `garnish:*` | `addTopping` / `addGarnish` |
| Broth | hold `pot` | `startPour` / `releasePour` |
| Serve | drag `bowl` → drop on `table:i` | `serve(i)` |
| Discard | tap `trash`, or drag `bowl` → drop on `trash` | `discardBowl` |

Pointer-up always emits a release; `releaseBlanch`/`releasePour` are no-ops when nothing is held. The UI never imports `three`: the controller projects 3D anchors to screen points and passes them to the UI.

A press that starts a hold on `basket` is a blanch when the basket is empty and a drag source when it holds noodles.

## 6. Failure modes
Lost WebGL context → page reload prompt. Tab hidden → the controller clamps `dt` to ≤ 0.1 s so the day does not skip.

## 7. Verification
Core: Vitest unit tests per MEC (`tests/`). Presentation: `npm run build` + headless Playwright smoke run (no console errors, canvas renders).
