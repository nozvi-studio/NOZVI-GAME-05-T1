---
id: MEC-006
type: mechanic
status: approved
owner: game-design
version: 0.1
parent: GDD
related: [MEC-001, MEC-002, MEC-003, MEC-004, MEC-005]
studio_standard: 0.1
updated: 2026-11-08
---
# MEC-006 — Deviation scoring, temperament, avoid requests and implied orders

> **Approved by the owner on 2026-11-08** (answers in §12). Supersedes MEC-005 rules 5 and 8–15 and MEC-003 rule 3 (spawn pacing). MEC-005 rules 1–4, 6, 7 (portions, amounts ít 1 / vừa 2 / nhiều 3, cap 4) still apply. All numbers live in `config/balance.json`.

## 1. Purpose
The further a bowl drifts from what the customer wanted (said or implied), the harder they complain. Noodles and broth weigh the most. Customers have hidden temperaments, some refuse ingredients, and later in the day they talk more naturally, so the player must listen.

## 2. Entities and terminology
- **Broth level**: ít nước / vừa nước / nhiều nước = target fill `broth.levelFill` [0.55, 0.8, 1.05] (max 1.2). Every order has one (default vừa).
- **Avoid request** (at most one per order): `dislike` ("không X" or "tôi không thích ăn X") or `allergy` ("tôi dị ứng X" or "tôi không ăn được X").
- **Order style**: `chips` (list), `explicit` (spoken sentence naming each item), `implied` (a fixed phrase that stands for a known recipe, §5 table).
- **Tô thường** (standard bowl): thịt bằm vừa, hành vừa, vừa nước. Taught by the first customer; most implied phrases modify it.
- **Tutorial customers**: the first `orders.tutorialCustomers` (3) customers.
- **Temperament** (hidden): `easy` 30 %, `normal` 50 %, `picky` 20 %.
- **Deviation D**: a number ≥ 0 that measures how far the bowl is from the order (rule 5).
- **Reaction tiers**: happy < ok < grumble < complain < scold ("la làng").

## 3. Preconditions
As MEC-002 / MEC-005.

## 4. Trigger
Customer spawn (order), pour release (broth feedback), serve (deviation, reaction, payment), patience out (leave line).

## 5. Rules and observable behavior
**Orders**
1. Customer 1 orders tô thường as chips and is always `easy` (gentle first contact). Customers 2–3 get random chip orders. All three are tutorial customers.
2. Each ordered ingredient gets ít / vừa / nhiều (MEC-005 rule 3). The broth level is drawn with `orders.brothWeights` (ít 25 %, vừa 50 %, nhiều 25 %).
3. With chance `orders.avoidChance` (30 %), the order adds one avoid request on an ingredient not in the order. Its kind is drawn with `orders.avoidKindWeights` (dislike 70 %, allergy 30 %).
4. After the tutorial and from `orders.spokenFromSeconds` (30 s), an order is spoken with a chance that rises linearly over the day from `spokenChanceStart` (30 %) to `spokenChanceEnd` (80 %). Among spoken orders, the implied share rises from `impliedShareStart` (10 %) to `impliedShareEnd` (60 %). An implied order may still carry an avoid request.

| Implied phrase (player sees) | Recipe |
|---|---|
| "Cho tô thường." | thịt bằm vừa, hành vừa, vừa nước |
| "Đói quá, làm tô thật đầy!" | thịt bằm nhiều, hành vừa, nhiều nước |
| "Ăn nhẹ thôi, tô nhỏ nhỏ." | thịt bằm ít, hành ít, ít nước |
| "Tô thường, thêm hải sản nha." | thịt bằm vừa, tôm vừa, hành vừa, vừa nước |
| "Bớt thịt, cho nhiều rau." | thịt bằm ít, hành nhiều, giá vừa, vừa nước |
| "Tô khô khô, ít nước thôi." | thịt bằm vừa, hành vừa, ít nước |
| "Nước nhiều cho tui húp." | thịt bằm vừa, hành vừa, nhiều nước |
| "Tô bổ dưỡng, thêm gan với trứng." | thịt bằm vừa, gan vừa, trứng cút vừa, hành vừa, vừa nước |
| "Thích cay thơm, nhiều tiêu vô." | thịt bằm vừa, hành vừa, tiêu nhiều, vừa nước |
| "Tô thường, đừng bỏ hành." | thịt bằm vừa, vừa nước (no hành) |

**Display**
5. No icons anywhere. Chip orders show words: "Nhiều hành", "Ít thịt bằm", "Thịt bằm" (vừa), "Ít nước", "Không tiêu", "Không thích gan", "Dị ứng tôm". Tutorial chips also show portions given / wanted. Every chip-order chip turns green when its amount is exact, with no red state. Spoken orders show only the sentence, with no progress.
6. Broth gauge: with a tutorial customer waiting, the zones show the first waiting tutorial customer's level. Otherwise the gauge shows only the fill needle and three tick marks labelled ít / vừa / nhiều. On release, the float text names the nearest level ("Ít nước", "Vừa nước", "Nhiều nước").

**Deviation (replaces MEC-005 rules 9–11)**
7. D = noodles + broth + ingredients, with:
   - noodles: `deviation.noodleWeight` (1.5) × |held − ideal| / `noodleUnitSeconds` (1.0 s);
   - broth: `brothWeight` (1.5) × |fill − level target| / `brothUnitFill` (0.15); no broth = `missingBroth` (6);
   - ingredients: `portionWeight` (1) per portion off for every ingredient (missing, extra, wrong amount); for a disliked ingredient, `dislikePortionWeight` (1.5) per portion added.
8. Base tier by D with `deviation.tiers` [0.5, 1.5, 3, 5]: D ≤ 0.5 happy, ≤ 1.5 ok, ≤ 3 grumble, ≤ 5 complain, else scold.
9. Temperament shifts the tier: easy one tier milder, picky one tier harsher (clamped). Scold can be softened by an easy temperament unless rule 10 applies.
10. Forced scold, whatever the temperament: the allergy ingredient was added (any amount), or a disliked ingredient was added `dislikeScoldPortions` (2) or more times.
11. A bowl is **perfect** when the final tier is happy and D ≤ 0.5.

**Payment and reaction (replaces MEC-005 rules 12–15)**
12. happy: price + round(maxTip × patience left). ok: price + round(maxTip × patience left × `reactions.okTipRatio` (0.5)). grumble: price, no tip. complain: price × `complainPriceRatio` (0.5), no tip. scold: picky pays 0; normal and easy pay price × `scoldPayRatio` (0.3). Scold also means the customer walks off angry and counts as lost.
13. Each reaction says one line whose harshness rises with the tier. It names the worst cause (allergy, disliked item, noodles too soft or too hard, too little or too much broth, missing or extra item). Picky customers use sharper wording. No profanity.
14. A customer whose patience runs out says a leave line ("Lâu quá, thôi đi chỗ khác!") and walks off. No extra penalty.

**Pacing (replaces MEC-003 rule 3 interval)**
15. The spawn interval goes linearly from `spawnIntervalStartSeconds` (14) to `spawnIntervalMidSeconds` (9.5) at half the day, then to `spawnIntervalEndSeconds` (7).

## 6. State transitions
As MEC-005; scold → `leaving` + `angry`; other tiers → `eating`.

## 7. Edge cases
- Wrong table: graded against that customer's order (often scold).
- The avoid ingredient is never part of the same order.
- The broth float at release is feedback only; grading uses the served customer's level.
- Temperament is fixed at spawn and deterministic per seed.

## 8. Player feedback
Text only, no icons. Reaction speech bubble with a coloured border (green / grey / amber / orange / red). Louder tiers use more "!" and short shouted words. Floating money shows the actual amount.

## 9. Balance parameters (`config/balance.json`)
`broth.levelFill`; `orders.*` (tutorialCustomers, brothWeights, avoidChance, avoidKindWeights, spokenFromSeconds, spokenChanceStart/End, impliedShareStart/End); `deviation.*`; `temper.weights`; `reactions.okTipRatio`, `complainPriceRatio`, `scoldPayRatio`; `customers.spawnIntervalMidSeconds`. Defaults are the values in §2 and §5.

## 10. Acceptance criteria
- An exact, perfectly cooked bowl → D = 0, happy, price + full tip (full patience).
- One portion off → D = 1 → ok for normal, happy for easy, grumble for picky.
- Noodles held 1 s too long, rest exact → D = 1.5 → ok (normal).
- No broth → D ≥ 6 → scold; normal pays 30 % of the price, picky pays 0.
- Allergy ingredient added to an otherwise exact bowl → scold even for an easy customer.
- Disliked ingredient ×1 → D = 1.5 → ok for normal; ×2 → forced scold.
- Customers 1–3 have chip orders and are tutorial customers; customer 1 orders tô thường.
- The spoken share after 30 s and the implied share rise over the day; same seed → same orders and temperaments.

## 11. Dependencies
Core `types.ts`, `kitchen.ts` (records blanch time on the bowl), `bowl.ts` (deviation), `reaction.ts`, `day.ts`, `implied.ts`. UI `speech.ts`, `widgets.ts` (chips, gauge ticks), `strings.ts` (icons removed), `fx.ts`. Tests: `bowl`, `day`, `orderProgress`.

## 12. Owner decisions (2026-11-08)
1. X/N progress only for the first 3 customers. No red state; green on exact is kept for chip orders (agent interpretation of "không đỏ").
2. Remove all icons, including emoji in the HUD and the hint hand. The hint ring and the CSS phone drawing stay (agent interpretation).
3. Broth levels as recommended: zones for tutorial customers only, ticks afterwards, fills 0.55 / 0.8 / 1.05.
4. Noodles have no ordered doneness: one ideal, deviation grows with distance.
5. Five tiers as recommended.
6. Temperament 30 / 50 / 20, hidden.
7. Allergy → scold; picky pays 0; normal and easy still pay part (30 %, agent proposal).
8. Explicit and implied spoken orders; implied ones grow later in the day.
9. (Not answered; default) spoken share 30 % → 80 %.
10. Leaving customers say a line, no extra penalty.
11. Slightly faster pace by mid-day (interval 9.5 s at half the day instead of 10.5 s).
