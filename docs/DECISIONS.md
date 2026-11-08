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

## 2026-11-07 — Start M2 visuals before the M1 playtest
Context: owner asked to improve the gameplay look now; GDD §11 puts art in M2. Choice: owner approved a visuals-only pass (night atmosphere, cart and food, steam) with no rule, balance or layout changes; sound and haptics stay deferred. Alternatives: wait for the M1 playtest; import CC0 glTF assets. Consequence: still zero external assets (procedural canvas textures, primitives); bundle 141 kB gzip; the M1 playtest now runs on the nicer build.

## 2026-11-07 — Night look without post-processing
Context: bloom/post-processing is costly on mid-range phones. Choice: ACES tone mapping, a few non-shadow point lights, one shadow-casting directional light, additive halo sprites for bulbs and a CSS vignette. Steam/halo sprites live on render layer 1 so pointer raycasts (layer 0) never hit them. Alternatives: UnrealBloomPass; baked light maps. Consequence: cheap, no new dependencies; glow is faked.

## 2026-11-07 — Approve visual polish spec and plan (ARCH-002, PLAN-001)
Context: an audit of the M2 build (code review plus owner screenshots) found readability problems in floor, counter, labels, order bubbles and feedback. Choice: owner approved ARCH-002 and PLAN-001 with default answers: trash can scaled visually but not moved, no warning for extra bowl items, progress on every order bubble, env map and sound/haptics deferred, emoji icons kept with clearer picks. Alternatives: redesign the art direction; import assets. Consequence: four presentation-only phases, no change to `src/core/` or balance; Phase 1 starts now.

## 2026-11-07 — Counter labels: icon pills, no fixed pot/basket labels
Context: Phase 1 screenshots at 844×390 showed label pills colliding in the bottom row, and labels for pot and basket landing on the garnish jars (the jars hide the pot wall from the camera). Choice: pill labels with icon + word shared with the order chips; icons hidden under 480 px viewport height; topping labels spread left/right of their tray column; a fixed label only for the bowl, trash, ingredients; pot and basket are named by the hold gauge while in use. Alternatives: shrink fonts below 12 px; labels above the pots (cover the broth). Consequence: no overlapping labels on phone and desktop; first-time players rely on the FTUE hint ring for pot and basket.

## 2026-11-07 — Counter zones as non-interactable inlays
Context: the counter was one flat surface. Choice: thin zone meshes (ingredients, cooking, bowl ring) in `src/scene/cartZones.ts`, not registered in `interactables`, so raycasts ignore them. Alternatives: textured counter; separate counter pieces. Consequence: zero effect on hit testing; positions are cart-local constants that must follow any future layout change.

## 2026-11-07 — Material rule: flat for environment, smooth for hero props
Context: `mat()` makes everything flat-shaded while steel, glass, plastic and glaze are smooth, with no stated rule (ARCH-002 VIS-203). Choice: flat shading for environment, people and raw food; smooth shading only for hero props (pots, bowl, glass, trays); metals stay low-metalness without an env map (env map deferred by the owner). Alternatives: make everything flat; make everything smooth. Consequence: new props follow this rule; no existing asset had to change in Phase 2.

## 2026-11-07 — Deploy the web build to GitHub Pages with Actions
Context: the owner wanted a shareable link without republishing a private artifact by hand. Choice: one workflow runs tests, typecheck and `vite build --base=./`, then publishes with `actions/upload-pages-artifact` and `actions/deploy-pages`; triggers are push to master and manual dispatch. Alternatives: keep the Claude artifact only; Netlify or Vercel (new accounts and secrets). Consequence: no secrets needed; the repo Pages source must be "GitHub Actions"; the `github-pages` environment may restrict deployments to master, so a feature branch needs that rule relaxed or a merge.

## 2026-11-07 — Publish Pages from a gh-pages branch, not the Pages deployment API
Context: the first workflow used `actions/deploy-pages`; its deploy job was rejected by GitHub before any step ran (no log), on the work branch and on master, and the repo Pages source was "Deploy from a branch" (it served the unbuilt `index.html`, so the game showed a black screen with a 404 for `/src/main.ts`). Choice: the workflow builds with `--base=./` and force-pushes `dist/` to a `gh-pages` branch using `GITHUB_TOKEN`; Pages serves that branch. Alternatives: keep `deploy-pages` and debug the environment or organization policy. Consequence: no Pages environment or OIDC needed; Settings -> Pages must point to `gh-pages` / root; `gh-pages` is a generated branch, never edited by hand.

## 2026-11-08 — Phone: rotate popup, pause while upright, closer camera in landscape
Context: owner asked for a popup telling phone players to turn the phone sideways and for a slightly larger view on phones; tablets are not targeted yet. Choice: a touch device with screen short side < 600 px in portrait gets a full-screen popup that also blocks taps; `Game` skips `sim.update` while it shows (the day cannot run unseen). Phone landscape (height < 480 px, aspect ≥ 1.6) uses FOV 41 instead of 46 (≈ 13 % closer), a camera-only change with no layout change (GDD §3 fixed camera still holds). Alternatives: `screen.orientation.lock` (needs fullscreen, unsupported on iOS Safari); scale the HUD only; zoom more (clips bubbles and the bottom label row at 844×390). Consequence: with the phone's rotation lock on, the popup stays up and the game stays paused; tablets keep the base camera and never see the popup.

## 2026-11-08 — Owner approved MEC-005 (amounts, spoken orders, reactions)
Context: the owner wanted repeated ingredients ("nhiều hành, ít thịt"), spoken orders, and penalties or scolding for wrong or badly cooked bowls. Choice: portions ít 1 / vừa 2 / nhiều 3 (cap 4), optional "không X" exclusion, spoken orders ~50 % from 30 s, reactions happy / ok / complain (half price, no tip) / scold (pays nothing, counts as lost, playful lines without profanity). Alternatives: lighter vừa 1 / nhiều 2 scale; a money fine on scold. Consequence: about twice the taps per bowl and lost income on bad bowls; the 250 k revenue target stays until a new bot probe, then a new value goes to the owner.

## 2026-11-08 — MEC-005 implementation notes: hit boxes, phone chips, balance probe
Context: with amounts and extras penalized, a tap landing on the wrong tray now costs money; on 844×390 the wider chips made three bubbles overlap; twice the taps changes the pace. Choice: tray and jar hit boxes now match the object height (a tall front-tray box covered the lower half of the back tray); on screens under 480 px high the chip amount word is hidden and bubbles are capped at 31 vw (the "given/wanted" count still shows the amount); balance left unchanged pending the owner. Bot probe (30 seeds, perfect cook): taps per order 3.85 → 7.43; at 20 s per bowl 0/30 days reach 250 k with patience 45/28, 11/30 with 55/35, 18/30 with 60/40. Alternatives: keep tall hit boxes; shrink chip fonts below 12 px. Consequence: taps hit what they look like; the target or patience needs an owner decision before the playtest.

## 2026-11-08 — Patience 55 / 35 s, revenue target stays 250 k
Context: MEC-005 roughly doubles taps per bowl; the bot probe showed 0/30 days reaching 250 k at ~20 s per bowl with patience 45 / 28 s. Choice: owner approved `customers.patienceSeconds` regular 55, hurried 35 and keeping `day.revenueTarget` 250 (11/30 days at 20 s per bowl, close to the old 13/30 at 18 s). Alternatives: patience 60 / 40 (18/30, easier); target ~150 k. Consequence: difficulty roughly as before; retune after the first playtest.

## 2026-11-08 — MEC-006: deviation tiers, temperament, implied orders; no icons
Context: the owner wanted harsher reactions the further a bowl drifts (noodles and broth most), hidden temperaments, allergy and dislike requests, broth levels, more natural and implied orders later in the day, leave lines, no icons and a slightly faster mid-day. Choice: a single deviation number D with weights in `config/balance.json`, five tiers shifted by temperament, forced scold on allergy or a disliked item added twice, scold pays 30 % (0 for picky), 10 fixed implied recipes in `src/core/implied.ts` with phrases in `src/ui/speech.ts`, spawn interval 14 → 9.5 (half day) → 7 s. Agent interpretations recorded in MEC-006 §12 (green kept without red; hint hand and check mark removed; first customer always easy). Alternatives: per-item hard thresholds; free-text natural language. Consequence: bot probe at ~20 s per bowl gives 8/30 days at 250 k (was 11/30); garnish chips lost their green tint so green only means "exact".

## 2026-11-08 — Five-minute day, untimed first customer, tutorial captions (MEC-007)
Context: the owner asked for a ~5-minute day, the same three tutorial customers, a tutorial and no clock for the first customer; GDD §3b had ruled out tutorial text. Choice: `day.lengthSeconds` 300 with absolute time marks scaled 5/3; a `frozen` state in `DaySim` that pauses clock, spawning and the first customer's patience while cooking still runs; pure caption and tip logic in `src/ui/tutorial.ts`, the first customer's caption anchored to the hint ring; revenue target 350 k from a bot probe that keeps the MEC-006 difficulty (7/30 days at 20 s per bowl). Alternatives: modal tutorial screens; keep 250 k. Consequence: GDD §3 / §3b / §4 / §7 updated; tests that let a day run unattended disable the freeze; the 350 k target awaits owner confirmation.

## 2026-11-08 — Later days skip the tutorial and go spoken; hint research drafted
Context: the owner confirmed the 350 k target and asked that from day 2 the game skip X/N, keep only a few chip customers and then switch to spoken orders, and asked for research on hints when a player cannot read a customer. Choice: `DaySim` takes a session day number; day 2+ has no tutorial, freeze or counts, 2 chip warm-up customers (`orders.laterDays`), then every order spoken; tips shown once per session; the day number lives in memory only (no save in M1). Hints: MEC-008 drafted with five options and a recommendation (ask again with a patience cost, plus a free translation after a failed phrase). Alternatives: persist the day number in localStorage (deferred to M3 saves). Consequence: later days are harder (all spoken); MEC-008 waits for the owner.

## 2026-11-08 — Hints A + D, more tables after a won day, camera pan; probe caveat
Context: the owner approved hint options A + D and asked for +1 table after reaching the target (max 5), with swiping on crowded phones. Choice: `DaySim.askAgain` (8 s patience, floor 3 s, once per customer) and a session list of failed implied phrases for free translations (MEC-008); `DaySim` takes a table count, the scene builds 5 tables with layouts per count, the camera pans only along x on every device (a near-square desktop window shows less width than a phone in landscape), auto-pans while dragging near an edge, and off-screen customers keep edge-pinned bubbles (MEC-009). Street props moved clear of the 5-table row. Alternatives: a second row of tables (crowds the top of a phone screen); zoom out (tiny tap targets). Consequence: a probe with a triaging bot reaches 350 k on 30/30 days for 3–5 tables, while the naive bot used for earlier balance calls reached 7/30 (3 tables) and 0/30 (4–5); earlier balance decisions overstated difficulty and the playtest must settle the target.

## 2026-11-08 — Owner tutorial wording; hint ring targets the missing ingredient
Context: the owner supplied the narrator lines (opening, five steps, first-bowl and day-1 verdicts) and reported that the hint ring pointed at tiêu while the first customer ordered hành. Choice: lines live in `src/ui/tutorial.ts` (pure, tested); the day-1 middle band uses `day.firstDayFairRevenue` (200 k) in balance; the ring now projects the first order line still short of portions instead of the group anchor (the garnish anchor sat on the middle jar). Two typos in the supplied text were corrected ("ngời" → "người", "dử" → "dữ"); the "tiềm năng / tiền năng" pun is kept. Alternatives: keep group anchors. Consequence: captions and ring wait for the opening card; the "Dừng!" cue only shows for the untimed first customer.
