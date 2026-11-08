---
id: MEC-009
type: mechanic
status: approved
owner: game-design
version: 0.1
parent: GDD
related: [MEC-003, MEC-007]
studio_standard: 0.1
updated: 2026-11-08
---
# MEC-009 — More tables after a won day, swipe to pan

> **Owner request 2026-11-08:** "khi đủ chỉ tiêu thì ngày sau tăng số lượng bàn lên 1, tối đa 5; nếu trên điện thoại chật thì có thể vuốt qua lại để xem". Agent choices are marked *(agent)*. Extends MEC-003 rule 1 (table count) and GDD §3 (fixed camera → fixed height and angle, horizontal pan only).

## 1. Purpose
Winning a day grows the stall, so the next day is busier. More tables can exceed the screen, so the player can pan sideways.

## 5. Rules
1. A session starts with `day.tables` (3) tables. If a day is won (revenue ≥ target), the next day has one more table, up to `day.maxTables` (5). A lost day keeps the count. Not saved across page loads (GDD §13). *(owner; "keep on loss" agent)*
2. Table layout, left to right, 3 m apart *(agent)*:
   - 3 tables: x −3, 0, 3 (unchanged);
   - 4 tables: x −4.5, −1.5, 1.5, 4.5;
   - 5 tables: x −6, −3, 0, 3, 6.

   Index 0 stays near the cart (3: −3, 4: −1.5, 5: −3), so the first customer of a day sits close by. Outer tables sit a little nearer the cart (z 0.7–1.1).
3. Street props move clear of the 5-table row and of the customers' walking paths: street lamp and festoon poles go further out, scooters into the gaps. *(agent)*
4. The camera keeps its height and angle and pans only along x, clamped so the outermost table plus a margin can be reached. If everything fits (e.g. 4 tables on a wide phone), there is no pan. *(agent: applies on every device, since a near-square desktop window shows less width than a phone in landscape)*
5. Pan input: drag or swipe on empty space (not on an interactable). While dragging the noodle basket or a bowl near the left or right edge, the camera auto-pans. Holds and taps are unaffected. *(agent)*
6. A waiting customer whose table is off-screen keeps their order bubble pinned at the screen edge, with an arrow shape pointing toward them (CSS shape, no icon). *(agent)*
7. The day summary says when tomorrow gets an extra table.

## 9. Balance parameters
`day.tables` 3, `day.maxTables` 5. Revenue target unchanged (350 k).

Bot probe (day 2+, 300 s, 30 seeds, exact cook, T s per bowl):
- naive cook (always the most impatient customer first): 3 tables 7/30 days ≥ 350 k at 20 s; 4 or 5 tables 0/30, because more tables let more customers queue and walk out mid-cook;
- triaging cook (skips customers who would leave before the bowl is ready): 30/30 days for 3, 4 and 5 tables at 18–22 s.

So tables barely change what a sensible player earns, and the earlier probes that set patience 55 / 35 s and the 350 k target (naive cook) overstate difficulty. Real difficulty lies between the two and needs the playtest.

## 10. Acceptance criteria
- A won day with 3 tables → next day 4 tables; with 5 → stays 5; a lost day keeps the count.
- `DaySim` with `tables: 5` seats up to 5 customers on distinct tables 0–4.
- With 5 tables on 1480×1220 and on 844×390, every table can be brought on screen by panning; with 3 tables the view is unchanged.
- Swiping on empty space pans; tapping or holding an interactable still works; dragging a bowl to an edge pans.
- An off-screen waiting customer has an edge-pinned bubble.

## 12. Owner decisions and agent choices
1. +1 table per won day, max 5 (owner). Lost day keeps the count (agent).
2. Pan on every device, not only phones (agent; desktop windows are narrower than phones in landscape).
3. Layout, prop moves, auto-pan while dragging, edge-pinned bubbles (agent).
4. Revenue target stays 350 k regardless of tables (agent; flagged with the probe).
