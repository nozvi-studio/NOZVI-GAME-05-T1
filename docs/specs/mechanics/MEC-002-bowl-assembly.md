---
id: MEC-002
type: mechanic
status: approved
owner: game-design
version: 0.1
parent: GDD
related: [MEC-001, MEC-004]
studio_standard: 0.1
updated: 2026-11-06
---
# MEC-002 — Bowl assembly & quality

## 1. Purpose
Turn the order into a sequence of quick cooking actions whose accuracy decides the tip (GDD §2).

## 2. Entities
Kitchen: `basket` (graded noodles or empty), `bowl` (noodles, toppings, broth, garnishes). One bowl in progress at a time.

## 5. Rules
> Rules 3, 6 and 7 are superseded by MEC-005 (ingredient portions, amount-aware scoring, perfect bowl).

1. Blanch (MEC-001): only when the basket is empty and not blanching. Hold time grows with time; releasing grades it via `gradeBlanch`. Holding beyond `blanch.maxHoldSeconds` auto-releases.
2. Noodles to bowl: only when the basket holds noodles and the bowl has none. Moves the grade into `bowl.noodles` and empties the basket.
3. Toppings and garnishes: only when the bowl has noodles. Each item at most once; repeated taps are ignored.
4. Broth: only when the bowl has noodles and no broth yet. Fill grows at `broth.fillPerSecond`; release records fill. Grade: `|fill − targetFill| ≤ perfectTolerance` → perfect, `≤ goodTolerance` → good, else bad. Reaching `maxFill` auto-releases.
5. Discard empties the bowl (not the basket).
6. Quality (0..1) = weighted sum (`quality.weights`) of: noodle grade score, broth grade score (0 if no broth), topping score, garnish score. Grade scores from `quality.gradeScore`. Set score = `max(0, 1 − mistakePenalty × (missing + extra))`.
7. A bowl is "perfect" when quality ≥ `quality.perfectBowlThreshold`.

## 7. Edge cases
Release without an active hold → ignored. Serving a bowl without noodles → rejected (MEC-004).

## 10. Acceptance criteria
- Given an empty kitchen, when the player holds the basket 3.0 s and releases, then the basket holds `perfect` noodles.
- Given noodles in the basket and an empty bowl, when dragged to the bowl, then `bowl.noodles` is set and the basket is empty.
- Given a bowl matching the order with perfect noodles and broth, then quality = 1 and the bowl is perfect.
- Given one missing topping, then the topping score is 0.66.
