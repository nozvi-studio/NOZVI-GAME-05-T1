# GDD — Hu Tieu Ganh (working title)

> Casual-game GDD. Sections marked **[REQUIRED]** must be filled (no `TBD`) before any gameplay code.
> Keep it short: a casual GDD over ~3 pages usually means scope is too big.
> Numeric targets below are **defaults** for mobile casual games, not laws. Override per game with a one-line reason in `docs/DECISIONS.md`.
> The GDD owns product intent, scope and milestones. Exact rules of a complex mechanic go in `docs/specs/mechanics/MEC-xxx.md` and are linked here, not repeated.
> **Version:** 0.1 · **Status:** Approved by owner 2026-11-06 (v0.1 incl. §2 toppings and §7 balance table) · **Updated:** 2026-11-06 · **Owner:** Khanh Nguyen

## 1. Pitch [REQUIRED]
- **One sentence:** Cook hu tieu step by step at a Saigon roadside cart and serve each bowl to the right table before customers lose patience.
- **Hook (why someone taps it in a store/feed in 3 seconds):** A warm, steaming street-food cart at night; tactile cooking actions (blanch, ladle broth, drop toppings) that look satisfying in a short clip.
- **Reference games (2–3) and what we take / avoid from each:**
  - *Cook, Serve, Delicious!* — take: every dish is a short sequence of input steps; avoid: keyboard-heavy recipe memorisation.
  - *Overcooked* — take: time pressure, several orders at once; avoid: chaotic movement and co-op dependency.
  - *Diner Dash* — take: serve-to-the-right-table and tips; avoid: long free-to-play energy loops.
  - *Cooking Simulator* — take: tactile feel only; avoid: physics simulation (too costly).
- **Target player:** casual players on desktop browser or mobile landscape; 3–5 min sessions; curious about Vietnamese street food.

## 2. Core loop [REQUIRED]
    Customer arrives & orders → Cook the bowl through step mini-games → Serve to the right table → Earn money + tip → More customers, less patience → Day ends (target met / missed) → Next day
- **Core verb(s)** (max 2): *cook* (tap / hold / drag per step), *serve* (drag bowl to table).
- **What makes one attempt different from the last:** random orders (broth or dry, topping mix), customer types with different patience, timing skill in each step.

Cooking steps (each one short interaction):
| Step | Input | Graded by |
|---|---|---|
| Blanch noodles | Hold, release in the green zone | Timing (MEC-001) |
| Put in bowl | Drag basket to bowl | Done / not done |
| Toppings (pork, shrimp, liver, quail egg) | Tap once per portion (ít 1 / vừa 2 / nhiều 3) | Deviation from the wanted amounts (MEC-006) |
| Ladle broth | Hold to pour; ít / vừa / nhiều nước per order | Deviation from the ordered level (MEC-006) |
| Garnish | Tap scallion / pepper / bean sprouts, once per portion | Correct items and amounts; "không X" respected (MEC-005) |
| Serve | Drag bowl to the ordering table | Right table, speed |

## 2b. Mechanics index [REQUIRED once a 2nd mechanic exists]
| ID | Mechanic | Player-facing purpose | Spec | Status |
|---|---|---|---|---|
| MEC-001 | Blanch timing | Skill moment that grades noodle texture | GDD §2 (`src/core/blanch.ts`) | Approved |
| MEC-002 | Order & assembly | Match toppings / broth to the order | `docs/specs/mechanics/MEC-002-bowl-assembly.md` | Approved |
| MEC-003 | Customer patience | Time pressure, drives tips | `docs/specs/mechanics/MEC-003-customers.md` | Approved |
| MEC-004 | Serve to table | Deliver to the correct customer | `docs/specs/mechanics/MEC-004-serve-payment.md` | Approved |
| MEC-005 | Amounts, spoken orders, reactions | Read orders carefully; bad or wrong bowls cost money and anger customers | `docs/specs/mechanics/MEC-005-amounts-spoken-orders-reactions.md` | Approved |
| MEC-006 | Deviation, temperament, implied orders | The further from what the customer wanted, the harsher they react | `docs/specs/mechanics/MEC-006-deviation-temperament-implied-orders.md` | Approved |
| MEC-007 | Day length & tutorial | 5-minute day; untimed, captioned first bowl | `docs/specs/mechanics/MEC-007-day-length-tutorial.md` | Approved |
| MEC-008 | Order hints | A way out when a spoken order cannot be decoded | `docs/specs/mechanics/MEC-008-order-hints.md` | Draft |

## 3. Controls & input [REQUIRED]
- Input scheme: mouse or touch only — tap, hold, drag. Landscape. Fixed camera, tilted top-down from behind the cart.
- Launch to first input: **≤ 5 s**. No text walls: the first three customers are the tutorial, with one-line captions (MEC-007).

## 3b. First-time user experience (first 60 s) [REQUIRED]
- Second 0–5: the cart at night, one customer walks up and sits; a speech bubble shows one bowl. A pulsing hand points at the noodle basket.
- How the core verb is taught: each step highlights the next object and a one-line caption names it; the first customer is not timed (MEC-007).
- First success moment: first bowl served at ~20 s (overrides the 15 s default; see DECISIONS).
- First failure and retry: a later customer leaves if patience runs out; the table frees and the next customer arrives — no game over mid-day.
- Hidden until later: upgrades, money totals screen, settings.

## 4. Win / lose & session [REQUIRED]
- **Fail condition:** day ends with revenue below the day target.
- **Win / level-complete condition:** reach the day revenue target before the day timer ends.
- **Target session length:** one day = 5 minutes (MEC-007); 5–10 min per sitting.
- **Restart cost:** ≤ 1 tap, ≤ 1 s ("Bán lại / Play again").

## 5. Difficulty & pacing [REQUIRED]
- Ramp within a day: customer spawn interval shortens, more toppings per order, impatient customer types appear after ~60 s.
- First-time player should first lose a customer after ~90 s, and feel it was their fault (slow or wrong step).

## 6. Feedback & juice [REQUIRED for M2]
| Event | Visual | Sound | Haptic |
|---|---|---|---|
| Core action | Steam puff, ingredient pop-in | Splash / clink | Short tap (mobile) |
| Score / reward | Coin pop above table, tip sparkle | Coin jingle | Short tap |
| Fail | Customer frowns and walks off, grey bubble | Low sigh | None |

## 7. Balance parameters [REQUIRED]
All numbers live in `config/balance.json`; this table is the human-readable mirror.
| Key | Value | Notes |
|---|---|---|
| `blanch.idealSeconds` | 3.0 | Ideal hold time |
| `blanch.perfectToleranceSeconds` | 0.4 | ± window for "perfect" |
| `blanch.goodToleranceSeconds` | 1.0 | ± window for "good" |
| `blanch.maxHoldSeconds` | 6.0 | Auto-release (burnt) |
| `broth.fillPerSecond` / `targetFill` | 0.5 / 0.8 | Hold ≈ 1.6 s for a perfect pour |
| `broth.perfectTolerance` / `goodTolerance` | 0.06 / 0.15 | Fill bands |
| `quality.weights` | noodles 0.3, broth 0.2, toppings 0.35, garnish 0.15 | MEC-002 |
| `day.lengthSeconds` | 300 | One day = 5 min (MEC-007); first customer untimed |
| `day.revenueTarget` | 350 (k VND) | Keeps MEC-006 difficulty on the 5-min day (MEC-007 bot probe) |
| `customers.spawnIntervalStart/Mid/EndSeconds` | 14 → 9.5 (half day) → 7 | Faster by mid-day (MEC-006) |
| `customers.patienceSeconds` | regular 55, hurried 35 | Hurried from 100 s, 35 % chance; raised from 45 / 28 for MEC-005 (DECISIONS 2026-11-08) |
| `customers.toppingsPerOrder` | 1–2, then 2–3 at 100 s, 3–4 at 200 s | GDD §5 ramp |
| `payment.price` / `maxTip` | 30 / 15 (k VND) | Tip = maxTip × quality × patience left (happy / ok only) |
| `amounts.maxPortions` / `portionWeights` | 4 / ít 0.25, vừa 0.5, nhiều 0.25 | MEC-005 |
| `broth.levelFill` | ít 0.55 / vừa 0.8 / nhiều 1.05 | MEC-006 broth levels |
| `orders.*` | 3 tutorial customers; avoid 30 % (dislike 70 / allergy 30); spoken 30 → 80 %, implied 10 → 60 % of spoken | MEC-006 |
| `deviation.*` | noodles 1.5 / s, broth 1.5 / 0.15 fill, no broth 6, 1 per portion, dislike 1.5; tiers 0.5 / 1.5 / 3 / 5 | MEC-006 |
| `temper.weights` | easy 0.3, normal 0.5, picky 0.2 (hidden) | MEC-006 |
| `reactions.*` | ok tip 50 %, complain 50 % price, scold 30 % price (0 for picky) | MEC-006 |

## 8. Progression & meta [M3]
- Short-term (per run): revenue, tips, perfect-bowl streak.
- Long-term: cart upgrades, new dishes (hu tieu Nam Vang, dry), more tables, multiple days.
- **Reason to come back tomorrow:** next day's higher target and a new upgrade.

## 9. Monetization [M4 — optional for prototype]
- Model: none for the prototype.

## 10. Art, audio & UI direction [REQUIRED]
- Style: warm low-poly built from Three.js primitives — orange street-lamp light, red plastic tables, blue stools, steam.
- Screens (minimal): Boot → Game (day) → Day summary.
- Readability: playable on a 5" phone in landscape; high contrast; order icons not colour-only.
- Player-facing strings in Vietnamese (localized); code and docs in English.

## 11. Scope & milestones [REQUIRED]
| Milestone | Exit criteria | In scope | Out of scope |
|---|---|---|---|
| M1 Core loop | Greybox; 5 testers replay ≥ 3 times unprompted | §2–5, §13 — 1 dish (broth hu tieu), 3 tables | art, menus, meta, ads |
| M2 Juice | Feels good; §6 table done | §6, §10 | meta, ads |
| M3 Meta | Reason to return | §8 | ads |
| M4 Ship | Web-ready | polish | new mechanics |

## 12. Success metrics & playtest [REQUIRED]
- Hypothesis being tested: step-by-step cooking with a timing grade is satisfying enough to replay a 3-minute day.
- Metrics: first-session length, days played per session, % of bowls graded perfect, customers lost per day.
- Analytics events needed: `day_start`, `bowl_served`, `customer_left`, `day_end`.
- Playtest log → `docs/PLAYTEST.md` (create at first playtest).

## 13. Technical constraints [REQUIRED]
- Target: evergreen desktop browsers and mid-range mobile browsers (WebGL 2).
- 60 fps target; ≤ 3 s to first input on a mid-range phone.
- Build size budget: ≤ 1 MB gzipped JS for M1.
- Offline: not required. Save data: none for M1 (local in M3).

## Parking lot (ideas not in scope)
- Multiple dishes, cart upgrades, rain / night events, motorbike traffic, customer regulars with stories.
