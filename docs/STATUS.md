# STATUS — project memory

> AI: read at session start, rewrite at session end. Keep under ~60 lines; move history to CHANGELOG.

**Updated:** 2026-11-06 by Claude Code (main agent) **Milestone:** M1 — core loop playable

## Now (in progress)
- [x] Studio standards + AI rules snapshot in `docs/standards/`
- [x] M1 greybox core loop playable end to end (cook → serve → day summary → replay)
- [ ] First playtest with 5 testers (M1 exit criterion, GDD §11)

Playtest build (private, owner shares it): https://claude.ai/artifact/FD2D6yUBwNEWZixyqQERPo — built with `npx vite build --base=./`.

## Next (ordered, max 5)
1. Run the first playtest; create `docs/PLAYTEST.md` from `docs/standards/templates/PLAYTEST.md`
2. Retune balance from playtest data
3. M2 juice: steam, sounds, haptics (GDD §6)
4. Code-split Three.js if bundle grows (Vite chunk-size warning at 512 kB raw)

## Blockers / open questions for human
- Final game name ("Hu Tieu Ganh" is a working title).
- Push to GitHub fails (403): the Claude GitHub App lacks write access to the repo; commits are local only.

## Known issues / tech debt
- Customer materials are not disposed on removal (geometries are); small, acceptable for M1.
- No automated browser test in CI; Playwright smoke script is manual.
- `.claude/settings.json` plugin and permission patterns not yet verified in a live session.

## Last session summary
- What was done: DaySim core + tests; presentation layer (subagent) integrated; phone framing fixes.
- Last verified step (command + result): `npm test` 24/24 passed; `npm run build` passed (133 kB gzip); Playwright flow at 1280×720 served the first customer for 36k with no console errors; 844×390 screenshot checked.
- Commands that failed / work left uncommitted (check `git status`): `git push` → 403 (no GitHub App access).
- What was learned / gotchas: under swiftshader frames are slow, so scripted holds overshoot; use gauge readout, not timers.
