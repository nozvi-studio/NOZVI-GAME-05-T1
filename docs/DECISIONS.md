# Decision log
Append-only. Format: `## YYYY-MM-DD — <decision>` then Context / Choice / Alternatives / Consequence (1 line each).

## 2026-11-06 — Step-based cooking mini-games
Context: prototype needs a fun, buildable core loop. Choice: each cooking step is a short tap/hold/drag mini-game (Cook, Serve, Delicious! style). Alternatives: real-time multi-customer management; physics cooking sim. Consequence: simple input, easy balancing; depth comes from orders and timing.

## 2026-11-06 — Fixed tilted camera behind the cart
Context: must work on desktop and mobile. Choice: fixed perspective camera behind the cart looking down at the tables. Alternatives: first-person; isometric with a moving character. Consequence: mouse/touch only, no movement controls.

## 2026-11-06 — Warm low-poly from primitives, one vertical slice
Context: no art pipeline yet. Choice: build all models from Three.js primitives; M1 = one dish, three tables. Alternatives: cartoon assets; voxel. Consequence: zero external assets; art pass deferred to M2.

## 2026-11-06 — Stack: Vite + Three.js + TypeScript + Vitest
Context: web target, fast iteration, testable logic. Choice: Vite 5, Three.js 0.170, TS strict, Vitest; pure rules in `src/core/` without Three.js imports. Alternatives: plain JS; a full engine (Babylon, PlayCanvas). Consequence: small toolchain; gameplay rules unit-testable in Node.

## 2026-11-06 — Landscape and longer first-success target
Context: GDD template defaults to one-hand portrait and first success ≤ 15 s. Choice: landscape layout; first bowl served at ~20 s. Alternatives: portrait. Consequence: the street scene reads better wide; a bowl needs several steps, so 15 s is unrealistic.

## 2026-11-06 — Standards live in the repository, not Notion
Context: owner wants future AI agents to work from GitHub alone, without Notion access. Choice: copy both Notion hubs (Studio Standards v0.1, AI Vibe-Code Rules 0.6.0, incl. pages the hub marks Notion-only) into `docs/standards/` and reference them from `AGENTS.md`. Alternatives: keep Notion as the rule source and copy only the setup manifest. Consequence: repo is self-contained; Notion is optional authoring space and any sync back is a manual, owner-approved step.

## 2026-11-06 — Tighter framing for phone tap targets
Context: at 844×390 the topping trays rendered ~30 px tall. Choice: move tables closer to the cart (z 0–0.7), bring the camera nearer (fov 46), clamp order bubbles below the HUD, scale HUD text by viewport height. Alternatives: separate 2D cooking panel; bigger props. Consequence: same fixed-camera design (GDD §3), larger targets; the street background shows less.

## 2026-11-06 — Day revenue target 250k
Context: bot probe over 30 seeds showed 300k needs ≤ ~17 s per bowl. Choice: `day.revenueTarget` = 250 (met at ≈ 18 s per bowl). Alternatives: keep 300; shorter spawn interval. Consequence: a first-time player can plausibly win day one after a couple of tries; retune after the first playtest.

## 2026-11-06 — Owner approved MEC-002…004 and GDD §2/§7 additions
Context: specs were drafted by the agent from the approved GDD. Choice: owner approved the specs, the topping list, the balance table and the 250k day target. Alternatives: none. Consequence: these are now the implementation baseline; further rule changes need owner approval.
