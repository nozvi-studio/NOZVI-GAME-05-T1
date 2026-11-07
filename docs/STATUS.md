# STATUS — project memory

> AI: read at session start, rewrite at session end. Keep under ~60 lines; move history to CHANGELOG.

**Updated:** 2026-11-07 by Claude Code (main agent) **Milestone:** M1 — core loop playable (M2 visuals started early, owner-approved)

## Now (in progress)
- [x] Studio standards + AI rules snapshot in `docs/standards/`
- [x] M1 greybox core loop playable end to end (cook → serve → day summary → replay)
- [x] M2 visual pass: night atmosphere, cart & food detail, steam (DECISIONS 2026-11-07)
- [ ] First playtest with 5 testers (M1 exit criterion, GDD §11)

Playtest build (private, owner shares it): https://claude.ai/artifact/FD2D6yUBwNEWZixyqQERPo — built with `npx vite build --base=./`. Updated 2026-11-07 with the night visual pass (commit 08f4e24).

## Next (ordered, max 5)
1. Run the first playtest; create `docs/PLAYTEST.md` from `docs/standards/templates/PLAYTEST.md`
2. Retune balance from playtest data
3. M2 juice: coin pop / tip sparkle, customer frown, sounds, haptics (GDD §6); steam done
4. Code-split Three.js if bundle grows (Vite chunk-size warning at 512 kB raw)

## Blockers / open questions for human
- Final game name ("Hu Tieu Ganh" is a working title).

## Known issues / tech debt
- Customer materials are not disposed on removal (geometries are); small, acceptable for M1.
- No automated browser test in CI; Playwright smoke script is manual.
- `.claude/settings.json` plugin and permission patterns not yet verified in a live session.

## Last session summary
- What was done: pushed the source to GitHub (`master` + `claude/affectionate-gates-8u4r4k`); M2 visuals-only pass in `src/scene/` (+ tone mapping in `main.ts`, vignette in `index.html`, one `street.update` call in `game.ts`).
- Last verified step (command + result): `npm test` 24/24 passed; `npm run build` passed (141 kB gzip); Playwright at 1280×720 blanched, moved noodles, poured broth, added garnish with no console errors; 844×390 screenshot checked.
- Commands that failed / work left uncommitted (check `git status`): none.
- What was learned / gotchas: metal materials look black without an env map, so steel uses low metalness; open-ended pot cylinders are needed to see the broth; decorative sprites must stay off raycast layer 0.
