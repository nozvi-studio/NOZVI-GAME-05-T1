# STATUS — project memory

> AI: read at session start, rewrite at session end. Keep under ~60 lines; move history to CHANGELOG.

**Updated:** 2026-11-07 by Claude Code (main agent) **Milestone:** M1 — core loop playable (M2 visuals started early, owner-approved)

## Now (in progress)
- [x] Studio standards + AI rules snapshot in `docs/standards/`
- [x] M1 greybox core loop playable end to end (cook → serve → day summary → replay)
- [x] M2 visual pass: night atmosphere, cart & food detail, steam (DECISIONS 2026-11-07)
- [ ] Visual polish (ARCH-002 spec, PLAN-001 plan; both approved 2026-11-07): see the phase table below
- [ ] First playtest with 5 testers (M1 exit criterion, GDD §11)

### Visual polish: 4 phases (presentation only, no core or balance change)
| Phase | Scope | State | Commits |
|---|---|---|---|
| 1 Readability | Bubble anchor, order progress, floor, counter, labels, zones, jars, trash (VIS-101…107) | Done, accepted by owner | `43b6979`, `0d88fd4`, `a04d4fc`, `80116c1` |
| 2 Asset & material | Empty bowl, ingredient size, bowl scale, material rule (VIS-201…205) | Done, **awaiting owner review**. Trays and pots unchanged on purpose | `0bff32d` |
| 3 Lighting & environment | Even counter light, shadow frustum, contact shadows, declutter festoon poles / lamp pipe / cabinet strip (VIS-301…304) | Not started, starts after the Phase 2 review | — |
| 4 Juice & animation | Hover, invalid-tap feedback, pop-in, drag polish, customer reactions, coin / tip, "bowl ready" cue (VIS-401…407) | Not started | — |
Phone layout (owner request 2026-11-08, VIS-501/502): rotate popup + closer camera on phone landscape, implemented, awaiting review on a real phone. Tablets out of scope.
Deferred by owner: env map (VIS-206), sound and haptics (VIS-408). Details and acceptance criteria: ARCH-002 §3, steps: PLAN-001.

Playtest build (private, owner shares it): https://claude.ai/artifact/FD2D6yUBwNEWZixyqQERPo (version 4 = Phase 1 + 2, commit `0bff32d`), built with `npx vite build --base=./`. Republish after each phase.

## Owner review needed
0b. **Real-phone check after the mobile fix:** fullscreen on "Bắt đầu" (Android), compact layout when the browser bars stay (iOS or refused fullscreen), right-side guidance panel, "Để tôi thử" card.
0a. **MEC-006 → MEC-009** live on the work branch (5-min day, tutorial, later days spoken, hints A + D, +1 table per won day with swipe pan). **Balance warning:** a smarter bot (skips customers who would leave mid-cook) reaches 350 k on 30/30 days, so earlier probes overstated difficulty; tables barely change earnings. Needs the playtest before any retune (e.g. a target that grows with day or tables, GDD §8).
0. **Phone layout** (new): on a real phone, check the rotate popup (portrait) and the closer framing (landscape). Known limits: browsers cannot force landscape, so players must rotate; with the phone's auto-rotate lock on, the popup stays and the day stays paused.
1. **Phase 2** on the playtest link: does the empty bowl read as a bowl? Are garnish and toppings readable inside the bowl on a phone? Say "ok" or point at what is wrong; Phase 3 waits for this.
2. **Real phone check** (not possible here): do the emoji 🫀 (liver) and 🧂 (pepper) render, and is the label row readable at 844×390?
3. **Phase 4 gates:** decide on sound and haptics (VIS-408) and the code-generated env map (VIS-206) before those steps.
4. **Playtest:** run the first one with 5 testers (GDD §11), then `docs/PLAYTEST.md`.

## Next (ordered, max 5)
1. Owner review of Phase 2; then PLAN-001 Phase 3 (lighting, shadows, declutter)
2. PLAN-001 Phase 4 (juice), after the Phase 3 review
3. Run the first playtest; create `docs/PLAYTEST.md` from `docs/standards/templates/PLAYTEST.md`
4. Retune balance from playtest data
5. Code-split Three.js if bundle grows (Vite chunk-size warning at 512 kB raw)

## Blockers / open questions for human
- Final game name ("Hu Tieu Ganh" is a working title).

## Known issues / tech debt
- Customer materials are not disposed on removal (geometries are); small, acceptable for M1.
- No automated browser test in CI; Playwright smoke script is manual.
- `.claude/settings.json` plugin and permission patterns not yet verified in a live session.

## Last session summary
- What was done: ARCH-002 / PLAN-001 written and approved; Phase 1 (4 commits) and Phase 2 (1 commit) implemented and pushed; playtest artifact republished (version 4).
- Last verified step (command + result): `npm test` 30/30; `npm run build` 141.85 kB gzip; headless Playwright at 844×390 and 1480×1220 with pinned `Math.random`, console clean. Phase 1: floor luminance 0.35 → 0.20, counter 0.66 → 0.57, no clipped counter pixels. Phase 2 was checked by eye on before/after crops, not measured.
- Commands that failed / work left uncommitted (check `git status`): `claude plugin install superpowers@...` was denied by the auto-mode classifier (plugin still not installed here). The screenshot script lives outside the repo (session scratchpad) and is not committed.
- What was learned / gotchas: importing `COUNTER_TOP` from `cart.ts` into a module that `cart.ts` imports hits a circular-import TDZ that typecheck cannot see, so pass it as an argument; at 844×390 the label row is too tight for icons (hidden under 480 px height); the jars hide the pot wall, so pot and basket have no fixed label; a dev server started in one session dies on worker restart.
