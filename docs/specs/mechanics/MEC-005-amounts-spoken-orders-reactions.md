---
id: MEC-005
type: mechanic
status: approved
owner: game-design
version: 0.3
parent: GDD
related: [MEC-002, MEC-003, MEC-004]
studio_standard: 0.1
updated: 2026-11-08
---
# MEC-005 — Ingredient amounts, spoken orders and customer reactions

> **Approved by the owner on 2026-11-08** (answers in §12). Every number lives in `config/balance.json`. Once approved, MEC-005 owns amounts, spoken orders and reactions, and it **supersedes** MEC-002 rules 3, 6, 7, MEC-003 rule 5 and MEC-004 rule 3 (those specs will point here).

> **Rules 5 and 8–15 are superseded by MEC-006** (deviation scoring, tiers, temperament, avoid requests, implied orders). Rules 1–4, 6, 7 still apply.

## 1. Purpose
Make orders feel like real street-stall requests ("nhiều hành, ít thịt, không tiêu") and make cooking mistakes matter: the player must read carefully, tap the right number of times, and cook well, or the customer complains, refuses to pay and scolds.

## 2. Entities and terminology
- **Ingredient**: any topping (`pork`, `shrimp`, `liver`, `quailEgg`) or garnish (`scallion`, `pepper`, `sprouts`).
- **Portion**: one tap on a tray or jar adds one portion of that ingredient to the bowl.
- **Amount** (what the order asks for): `ít` = 1 portion, `vừa` (default, no word shown) = 2, `nhiều` = 3.
- **Exclusion**: an order line "không X". It asks for 0 portions of X, same as any unlisted ingredient, but violating it is worse (rule 9).
- **Chip order**: the order bubble shows one chip per ingredient with its amount word (today's display, extended).
- **Spoken order**: the bubble shows one Vietnamese sentence instead of chips, e.g. "Cho 1 tô nhiều hành, giá, ít thịt bằm nha!".
- **Reaction**: the customer's verdict when served: `happy`, `ok`, `complain` or `scold`.

## 3. Preconditions
As MEC-002: portions can be added only when the bowl has noodles.

## 4. Trigger
Tap on `topping:*` / `garnish:*` (portion); customer spawn (order generation); serve (grading, payment, reaction).

## 5. Rules and observable behavior
**Amounts (replaces MEC-002 rule 3)**
1. Each tap adds 1 portion of that ingredient, up to `amounts.maxPortions` (4) per ingredient; further taps are rejected (feedback, no state change). There is no "remove one portion"; the fix is to discard the bowl.
2. The bowl shows more pieces as portions grow, so the amount is visible.

**Order generation (replaces MEC-003 rule 5)**
3. The number of toppings and garnishes per order keeps today's brackets (`customers.toppingsPerOrder`, `garnishesPerOrder`). Each chosen ingredient gets an amount drawn with weights `amounts.weights` (ít 25 %, vừa 50 %, nhiều 25 %).
4. With chance `orders.exclusionChance` (30 %), the order adds one exclusion "không X", X drawn from ingredients not in the order.
5. From `orders.spokenFromSeconds` (30 s), each new order is spoken with chance `orders.spokenChance` (50 %). Never for the first customer.
6. The first customer keeps a fixed chip order for the tutorial: thịt bằm `vừa` + hành `vừa` (2 + 2 taps). The FTUE hint stays on an ingredient until its amount is reached.
7. Same seed → same orders, amounts, exclusions and spoken/chip choice (deterministic RNG).

**Display**
8. Chip orders show the amount word on the chip ("Nhiều 🌿 Hành", "Ít 🥩 Thịt bằm", "🚫 Tiêu") and the progress as portions given / wanted (green when exact, red when over). On screens under 480 px high the amount word is hidden so three bubbles fit; the count still shows the amount. Spoken orders show only the sentence: no chips and no progress marks (reading it is the challenge).

**Grading (replaces MEC-002 rules 6 and 7)**
9. For toppings and for garnishes separately, set score = max(0, 1 − Σ penalties) over every ingredient, with wanted `w` and given `g` portions:
   - `w > 0`, `g = 0` (missing): `quality.missingPenalty` (0.34, today's value);
   - `w = 0`, `g > 0` (extra): 0.34; if X was an explicit exclusion: `quality.forbiddenPenalty` (0.5) and the bowl is marked **forbidden**;
   - `w > 0`, `g > 0`, `g ≠ w` (wrong amount): `quality.portionPenalty` (0.12) × |g − w|.
10. Quality = today's weighted sum (`quality.weights`) of noodles, broth, toppings score, garnishes score.
11. A bowl is **perfect** when quality ≥ `quality.perfectBowlThreshold` (0.9) **and** it has no missing, extra or wrong-amount ingredient.

**Payment and reaction (replaces MEC-004 rule 3)**
12. `scold` if the bowl is forbidden, or quality < `reactions.scoldBelow` (0.35), or both noodles and broth are graded `bad` (or broth missing): the customer pays **nothing**, leaves angry and counts as lost.
13. `complain` (otherwise) if quality < `reactions.complainBelow` (0.6), or noodles are `bad`, or broth is `bad` or missing: pays `reactions.complainPriceRatio` (50 %) of the price, no tip.
14. Otherwise `happy` if the bowl is perfect, else `ok`: price + tip as today (tip = round(maxTip × quality × patience left)).
15. `reactions.scoldFine` (0 k by default) is subtracted from revenue on `scold`. Revenue never goes below 0.

## 6. State transitions
| Before | Event / Guard | After | Side effects |
| --- | --- | --- | --- |
| bowl with noodles, `g < maxPortions` | tap ingredient | `g + 1` | piece pop-in |
| bowl with noodles, `g = maxPortions` | tap ingredient | unchanged | "full" feedback |
| customer `waiting` | serve, rule 12 | `leaving`, outcome `angry` | 0 k (minus fine), scold line, lost + 1 |
| customer `waiting` | serve, rule 13 | `eating` | half price, complain line |
| customer `waiting` | serve, rule 14 | `eating` | price + tip, happy / ok line |

## 7. Edge cases
- Wrong table: graded against that customer's order (MEC-004 rule 2 unchanged), so it usually scolds.
- Exclusion of an ingredient the player never adds: no effect.
- Discard resets all portions; the basket is not affected (MEC-002 rule 5 unchanged).
- Day end while a reaction line is showing: the line finishes; no extra payment.

## 8. Player feedback
- Tap: "+1" pop and the bowl gains pieces; at the cap a short shake (ARCH-002 VIS-402).
- Reaction line in a speech bubble over the customer (Vietnamese, playful, **no profanity**): happy "Ngon quá!", ok "Được đó.", complain "Hơi dở nha, trả nửa tiền thôi!", scold "Tôi dặn không tiêu mà! Không trả đâu!" or "Dở quá, không ăn nổi!". Scold also uses the angry face and red tint (today's give-up look). Text plus colour, never colour alone.
- Floating money shows the actual amount (+0 k, +15 k, +38 k).

## 9. Balance parameters (`config/balance.json`)
| Key | Default | Note |
|---|---|---|
| `amounts.maxPortions` | 4 | Cap per ingredient |
| `amounts.weights` | ít 0.25, vừa 0.5, nhiều 0.25 | Amount draw |
| `orders.exclusionChance` | 0.3 | Adds "không X" |
| `orders.spokenFromSeconds` / `spokenChance` | 30 / 0.5 | Spoken orders |
| `quality.missingPenalty` | 0.34 | Renamed from `mistakePenalty` |
| `quality.portionPenalty` | 0.12 | Per portion off |
| `quality.forbiddenPenalty` | 0.5 | Exclusion violated |
| `reactions.scoldBelow` / `complainBelow` | 0.35 / 0.6 | Quality thresholds |
| `reactions.complainPriceRatio` | 0.5 | Half price |
| `reactions.scoldFine` | 0 | Optional fine |

**Balance impact:** an average order needs about twice as many taps (2 per ingredient instead of 1), and bad bowls now lose money. The `day.revenueTarget` of 250 k was tuned at ≈ 18 s per bowl (DECISIONS 2026-11-06) and will likely be too high. Plan: after implementation, re-run a bot probe over 30 seeds and propose a new target for owner approval.

## 10. Acceptance criteria
- Given a bowl with noodles, when the player taps hành 3 times, then the bowl holds 3 portions of hành; a 5th tap is rejected.
- Given an order "nhiều hành" and a bowl with 3 hành and everything else correct and perfect, then the bowl is perfect and pays price + full tip.
- Given an order "vừa thịt bằm" and a bowl with 3 thịt bằm, then the toppings score is 0.88 and the bowl is not perfect.
- Given an order with "không tiêu" and a bowl with 1 tiêu, when served, then the customer scolds, pays 0 and counts as lost.
- Given correct ingredients with `bad` noodles and `good` broth, when served, then the customer complains and pays 15 k.
- Given correct ingredients with `bad` noodles and `bad` broth, when served, then the customer scolds and pays 0.
- Given the first customer, then the order is a chip order thịt bằm vừa + hành vừa.
- Same seed → same orders, amounts, exclusions and spoken choice.

## 11. Dependencies
- Core: `src/core/types.ts` (`Order` and `Bowl` change from item lists to portion counts), `kitchen.ts`, `bowl.ts`, `day.ts`; tests `bowl`, `day`.
- UI: order chips and spoken bubble (`src/ui/widgets.ts`, `orderProgress.ts`, `strings.ts`); reaction lines (`fx.ts`).
- Scene: piece count per portion (`src/scene/bowl.ts`); customer face (`customers.ts`).
- Docs: GDD §2 table and §7, MEC-002/003/004 pointers, ARCHITECTURE §3 types, DECISIONS.

## 12. Owner decisions (2026-11-08)
1. Amount scale: ít 1 / vừa 2 / nhiều 3.
2. Scold: the customer pays nothing; no extra fine (`reactions.scoldFine` = 0).
3. Tone: playful lines, no profanity.
4. Spoken orders: about 50 % of orders from 30 s on.
5. Revenue target: keep 250 k for now; re-run the bot probe after implementation and propose a new value for approval.
