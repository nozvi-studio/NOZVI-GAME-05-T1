# GDD — <Game Name>

> Casual-game GDD. Sections marked **[REQUIRED]** must be filled (no `TBD`) before any gameplay code.
> Keep it short: a casual GDD over ~3 pages usually means scope is too big.
> Numeric targets below are **defaults** for mobile casual games, not laws. Override per game with a one-line reason in `docs/DECISIONS.md`.
> The GDD owns product intent, scope and milestones. Exact rules of a complex mechanic go in `docs/specs/mechanics/MEC-xxx.md` and are linked here, not repeated.
> **Version:** 0.1 · **Updated:** YYYY-MM-DD · **Owner:** <name>

## 1. Pitch [REQUIRED]
- **One sentence:** <verb + goal + twist>
- **Hook (why someone taps it in a store/feed in 3 seconds):**
- **Reference games (2–3) and what we take / avoid from each:**
- **Target player:** <who, when they play, context e.g. "commute, 1 hand, sound off">

## 2. Core loop [REQUIRED]
The loop the player repeats every 5–30 seconds. If it isn't fun with grey boxes, nothing else will save it.
    <Action> → <Feedback/Reward> → <Challenge increases> → <Fail or Win> → <Instant retry>
- **Core verb(s)** (max 2):
- **What makes one attempt different from the last** (skill, randomness, choice):

## 2b. Mechanics index [REQUIRED once a 2nd mechanic exists]
One row per mechanic. Link a spec only when the mechanic has non-trivial rules or edge cases (Studio Standards template 03).
| ID | Mechanic | Player-facing purpose | Spec | Status |
|---|---|---|---|---|
| MEC-001 | <name> | <why it exists> | <docs/specs/mechanics/MEC-001-x.md or "GDD §2"> | Draft |

## 3. Controls & input [REQUIRED]
- Input scheme (tap / hold / swipe / drag) — one-hand portrait by default:
- Launch to first input: **≤ 5 s**. No tutorial text walls; teach by playing.

## 3b. First-time user experience (first 60 s) [REQUIRED]
- Second 0–5: what the player sees and the first thing they do:
- How the core verb is taught (by doing, not by text):
- First success moment and when it happens (target ≤ 15 s):
- First failure and how the game invites a retry:
- What is hidden until later (menus, currencies, settings):

## 4. Win / lose & session [REQUIRED]
- **Fail condition:**
- **Win / level-complete condition** (or "endless — score"):
- **Target session length:** <e.g. 30–90 s per run, 3–5 min per sitting>
- **Restart cost:** ≤ 1 tap, ≤ 1 s.

## 5. Difficulty & pacing [REQUIRED]
- How difficulty ramps (speed, density, new mechanic every N levels):
- First-time player should fail first after ~<N> s, and **feel it was their fault**.

## 6. Feedback & juice [REQUIRED for M2]
| Event | Visual | Sound | Haptic |
|---|---|---|---|
| Core action | | | |
| Score / reward | | | |
| Fail | | | |

## 7. Balance parameters [REQUIRED]
All numbers live in `config/balance.json`; this table is the human-readable mirror.
| Key | Value | Notes |
|---|---|---|

## 8. Progression & meta [M3]
- Short-term (per run): score, combo, stars…
- Long-term (across sessions): levels, unlocks, skins, daily goals…
- **Reason to come back tomorrow:**

## 9. Monetization [M4 — optional for prototype]
- Model: ads (rewarded / interstitial) · IAP · premium · none
- Rules: no interstitial before ~3rd session; rewarded ads must be opt-in.

## 10. Art, audio & UI direction [REQUIRED]
- Style in 1 line + 1–3 reference images/links:
- Screens (minimal): Boot → Game → Game Over (→ Menu only if needed)
- Readability: playable on a 5" phone, high contrast, colour-blind safe for critical info.

## 11. Scope & milestones [REQUIRED]
Default order; changing it needs a DECISIONS.md entry approved by the human.
| Milestone | Exit criteria | In scope | Out of scope |
|---|---|---|---|
| M1 Core loop | Greybox; 5 testers replay ≥ 3 times unprompted | §2–5, §13 | art, menus, meta, ads |
| M2 Juice | Feels good; §6 table done | §6, §10 | meta, ads |
| M3 Meta | Reason to return | §8 | ads |
| M4 Ship | Store/web-ready | §9, polish | new mechanics |

## 12. Success metrics & playtest [REQUIRED]
- Hypothesis being tested:
- Metrics: first-session length, retries per session, D1 retention (when live), % reaching run N.
- Analytics events needed to measure the above (names only; payloads, consent and SDK details live in `docs/integrations/analytics.md` when added):
- Playtest log → `docs/PLAYTEST.md` (create at first playtest).

## 13. Technical constraints [REQUIRED]
Short list; details belong in `docs/ARCHITECTURE.md` when it exists.
- Target devices / browsers and minimum spec:
- Frame-rate target (default 60 fps) and load-time budget (default ≤ 3 s to first input on mid-range phone):
- Build size budget:
- Offline play? Save data (none / local / cloud):

## Parking lot (ideas not in scope)
- …
