# STATUS — project memory

> AI: read at session start, rewrite at session end. Keep under ~60 lines; move history to CHANGELOG.

**Updated:** 2026-11-07 by Claude Code (main agent) **Milestone:** M1 — core loop playable (M2 visuals started early, owner-approved)

## Now (in progress)
- [x] Studio standards + AI rules snapshot in `docs/standards/`
- [x] M1 greybox core loop playable end to end (cook → serve → day summary → replay)
- [x] M2 visual pass: night atmosphere, cart & food detail, steam (DECISIONS 2026-11-07)
- [x] Visual polish ARCH-002 / PLAN-001 approved; Phase 1 (readability) accepted by owner
- [x] Visual polish Phase 2 (bowl, ingredient scale, material rule) implemented, awaiting owner review
- [ ] Visual polish Phases 3–4 (lighting, juice) pending
- [ ] First playtest with 5 testers (M1 exit criterion, GDD §11)

Playtest build (private, owner shares it): https://claude.ai/artifact/FD2D6yUBwNEWZixyqQERPo — built with `npx vite build --base=./`. It still serves the pre-visual-pass build until republished.

## Next (ordered, max 5)
1. Owner review of Phase 2; then PLAN-001 Phase 3 (lighting, shadows, declutter)
2. Run the first playtest; create `docs/PLAYTEST.md` from `docs/standards/templates/PLAYTEST.md`
3. Retune balance from playtest data
4. M2 juice: coin pop / tip sparkle, customer frown, sounds, haptics (GDD §6); steam done
5. Code-split Three.js if bundle grows (Vite chunk-size warning at 512 kB raw)

## Blockers / open questions for human
- Final game name ("Hu Tieu Ganh" is a working title).

## Known issues / tech debt
- Customer materials are not disposed on removal (geometries are); small, acceptable for M1.
- No automated browser test in CI; Playwright smoke script is manual.
- `.claude/settings.json` plugin and permission patterns not yet verified in a live session.

## Last session summary
- What was done: ARCH-002 / PLAN-001 approved with default owner answers; Phase 1 implemented as 4 commits (bubble anchor + order progress, floor + counter values, label pills, counter zones + open jars + smaller trash). Presentation only.
- Last verified step (command + result): `npm test` 30/30; `npm run typecheck` clean; `npm run build` 141.83 kB gzip; headless Playwright at 844×390 and 1480×1220 with pinned `Math.random`, console clean; floor luminance 0.35 → 0.20, counter 0.66 → 0.57, no clipped counter pixels.
- Commands that failed / work left uncommitted (check `git status`): `claude plugin install superpowers@...` was denied by the auto-mode classifier (plugin still not installed here).
- What was learned / gotchas: importing `COUNTER_TOP` from `cart.ts` into a module that `cart.ts` imports hits a circular-import TDZ that typecheck cannot see, so pass it as an argument; at 844×390 the label row is too tight for icons (hidden under 480 px height); the jars hide the pot wall, so pot and basket have no fixed label.
