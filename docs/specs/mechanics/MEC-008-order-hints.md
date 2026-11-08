---
id: MEC-008
type: mechanic
status: draft
owner: game-design
version: 0.1
parent: GDD
related: [MEC-005, MEC-006, MEC-007]
studio_standard: 0.1
updated: 2026-11-08
---
# MEC-008 — Hints when the player cannot read the customer (research and proposal)

> **Draft for owner decision.** Nothing here is implemented. Owner request 2026-11-08: "nghiên cứu tính năng gợi ý khi người chơi không đoán được ý khách".

## 1. Problem
From day 2 almost every order is spoken, and the implied share grows to 60 % by the end of the day (MEC-006 / MEC-007). An implied phrase ("Đói quá, làm tô thật đầy!") or an avoid clause the player cannot decode leads to a large deviation, often a scold (little or no money). Being stuck with no way out is frustrating and teaches nothing. The hint must keep reading as the core challenge, give a way out that has a cost, and teach the phrases so that hints are needed less over time.

## 2. Evidence from the current build
- Implied orders already store the full recipe (`Order.toppings`, `garnishes`, `broth`), so the game can always state the order explicitly. No new data is needed.
- The order bubble is DOM with `pointer-events: none` (`src/ui/styles.ts`). A tappable hint needs a small `pointer-events: auto` button that does not start a canvas drag.
- Patience is the natural cost currency: it drives tips (MEC-006 rule 12) and walk-outs (MEC-006 rule 14).
- There are 10 fixed implied phrases (`src/core/implied.ts`). A player can learn them all, so a notebook that fills up has a natural end.

## 3. Options
| # | Option | How it works | Player impact | Cost to the challenge | Complexity |
|---|---|---|---|---|---|
| A | **Hỏi lại** (ask again) | Tap a small "Hỏi lại" button on a spoken bubble. The customer restates the order explicitly: implied → explicit sentence; explicit → word chips. Costs `hints.askPatienceSeconds` (8 s) of patience; once per customer | High: always a way out, and it fits the fiction (you can ask a street-food customer to repeat) | Medium: costs time and tip, but reading still pays | Medium (button, core `askAgain`, display switch) |
| B | **Sổ ghi chú** (phrase notebook) | A button opens a panel listing the implied phrases met so far with their recipes. The day keeps running while it is open | Medium–high: lets players learn; useful between days | Low–medium: looking things up costs time | Medium (panel, unlock tracking) |
| C | **Tiered hint** | First tap highlights the key words ("đầy", "khô", "dị ứng"); second tap gives the full translation. Each tier costs patience | High for learning, but slower to use | Low at tier 1 | High (key-word markup per phrase) |
| D | **Learn from mistakes** | If a phrase was served badly (complain or scold), the next time that phrase appears the bubble shows its translation in small text under it, for free | Medium: a safety net with no UI to learn | Low: only after a failure | Low |
| E | **Paid hint** | The hint costs money (e.g. −5 k) instead of patience | Low–medium: feels punitive when revenue is tight | Medium | Low |

## 4. Recommendation
Ship **A + D** first, keep **B** for the meta milestone (M3, together with saved progress):
- A gives an immediate, fair way out with a cost that is already part of the game (patience → tip and walk-out risk).
- D turns failures into learning without extra buttons.
- B is most valuable once progress is saved across sessions (GDD §8, M3). It adds a panel that is hard to use on a 5" phone mid-day.
- C is the most elegant for teaching but needs per-phrase key-word data and two taps under time pressure. Revisit it after the playtest.

## 5. Proposed rules (if A + D are approved)
1. Spoken bubbles (explicit or implied) show a "Hỏi lại" button. Chip orders do not.
2. Tapping it costs `hints.askPatienceSeconds` (8 s) of patience, never below `hints.minPatienceSeconds` (3 s). The bubble then shows the explicit sentence (implied orders) or word chips (explicit orders). Once per customer.
3. A phrase served with complain or scold is remembered for the session. The next order with that phrase shows its explicit sentence in small text under the phrase, at no cost.
4. Hints never change grading; they only change what is shown.
5. Tutorial customers (day 1) do not need hints, so the button is hidden for them.

## 6. Technical notes
- Core: `DaySim.askAgain(customerId): boolean` (patience cost, sets `order.clarified`); deterministic, unit-tested.
- UI: button with `pointer-events: auto` and at least 32 px tall on phones; stop propagation so it never starts a canvas raycast; reuse `explicitOrder` and chips from `src/ui/speech.ts`.
- Controller: remember failed implied ids for the session (in memory, no save in M1).
- Analytics (when INT is added): hint taps per order style, to tune the implied share.

## 7. Balance impact
Each hint costs about 15 % of a regular customer's patience (8 / 55 s). A bot probe after implementation should check that using a hint on every implied order still reaches the target on some days at ~20 s per bowl.

## 12. Open questions (owner)
1. Approve A + D (recommended), or another mix?
2. Cost: patience 8 s (recommended), money, or tip only?
3. Uses per customer: 1 (recommended) or unlimited with growing cost?
4. Phrase notebook (B): now, or later in M3 with saved progress (recommended)?
