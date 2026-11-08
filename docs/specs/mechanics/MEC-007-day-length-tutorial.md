---
id: MEC-007
type: mechanic
status: approved
owner: game-design
version: 0.4
parent: GDD
related: [MEC-003, MEC-006]
studio_standard: 0.1
updated: 2026-11-08
---
# MEC-007 — Five-minute day, untimed first customer, tutorial

> **Owner request 2026-11-08:** "kéo dài ngày ~5 phút, vẫn 3 khách đầu, thêm tutorial, khách đầu không tính thời gian". Agent choices are marked *(agent)* and listed in §12. Supersedes MEC-003 rule 1 (day length) and GDD §3 / §3b "no tutorial text".

## 1. Purpose
A longer day gives the ramp (spoken, then implied orders, mid-day pace) room to breathe. A step-by-step first bowl that costs no time teaches the controls without pressure.

## 5. Rules
1. A day lasts `day.lengthSeconds` = 300 s. Absolute time marks scale by 5/3: hurried customers from 100 s, topping brackets at 0 / 100 / 200 s, spoken orders from 50 s. Ramps defined as a share of the day (spawn interval, spoken and implied shares) are unchanged.
2. From the first spawn until the player presses "Để tôi thử" (`day.freezeUntilFirstServed`, `DaySim.releaseTutorial`), the day clock, spawning and patience stand still. Cooking holds (blanch, pour) and the customer's eating and leaving still run. The HUD timer reads "Chưa tính giờ".
3. The first three customers stay tutorial customers (MEC-006 rules 1, 5, 6).
4. For the first customer, a one-line caption sits next to the hint ring and names the next step (owner wording 2026-11-08, `src/ui/tutorial.ts`). The hint ring points at the exact ingredient still missing (it used to point at the middle of the jar row, i.e. tiêu). During the first blanch the gauge label reads "Dừng!" while the needle is in the green zone ("ông bà mách").
   - 4a. Day 1 opens with a card: "Tích góp bấy lâu nay cuối cùng cũng mở được quán hủ tiếu nhỉ. Chắc gì đã biết bán, coi rồi làm theo nè." and a "Bắt đầu" button; captions and the ring wait until it is dismissed.
   - 4b. When the first customer has eaten and left, a card shows the verdict on the first bowl with a "Để tôi thử" button that starts the real day (owner 2026-11-08). Verdicts: perfect → "Có tiềm năng, bán tiếp đi biết đâu xây biệt thự."; small miss (ok / grumble) → "Để ý khách nhé, nhiều người khó tính họ bỏ về đó."; far off (complain / scold) → "Có tiền năng nha, tiền năng về nhà bấm điện thoại tiếp chứ buôn bán gì nữa."
   - 4c. End of day 1: target met → "Thằng này được, mới tập tành buôn bán mà giỏi dữ."; at least `day.firstDayFairRevenue` (200 k) → "Ngày mai cố gắng thêm nhé, ngày đầu nhẹ nhàng thôi."; below → "Chà cần cải thiện thêm nha bây, buôn bán kiểu này không đủ tiền hụi."
5. After the first customer, all guidance (captions for customers 2–3 and one-time tips) goes to a panel on the right side of the screen, one message at a time, for 10 s or until X is tapped; each caption is shown once per session; order bubbles keep clear of the panel (owner 2026-11-08). Captions explain what is new in a tutorial order, in this priority: avoid / allergy request, broth level other than vừa, amounts ít / nhiều ("Lấy từng phần nhé, khách ăn ít thì lấy một phần thôi. Khách ăn nhiều thì lấy ba phần là đủ rồi.", owner wording), otherwise "chip turns green when exact".
6. One-time tips per session, in the right panel: clock starts (first serve), tutorial over (third tutorial customer served or gone), first spoken order, first implied order ("Tô thường = thịt bằm vừa, hành vừa, vừa nước"). *(agent)*
7. `day.revenueTarget` = 350 k so the difficulty stays as approved for MEC-006 (bot probe below). Confirmed by the owner 2026-11-08.

**Later days (owner request 2026-11-08: "từ ngày 2 để bắt lại nhịp")**
8. "Bán lại" starts day N + 1 in the same session (day number shown in the HUD and the summary title; not saved across page loads, GDD §13). From day 2: no tutorial customers, no X/N counts, no broth zones, no captions, no clock freeze; the first customer is a normal random customer. One-time tips are not repeated in the same session.
9. From day 2, the first `orders.laterDays.warmupCustomers` (2) customers order with chips (words only: ít / vừa / nhiều). From then on every order is spoken (`laterDays.spokenChance` 1.0); the implied share still ramps from `impliedShareStart` to `impliedShareEnd` over the day. *(agent: the warm-up count of 2)*

## 9. Balance parameters
`orders.laterDays.warmupCustomers` 2, `orders.laterDays.spokenChance` 1.0.
`day.lengthSeconds` 300, `day.freezeUntilFirstServed` true, `day.revenueTarget` 350, `customers.hurriedFromSeconds` 100, `customers.toppingsPerOrder[].fromSeconds` 0 / 100 / 200, `orders.spokenFromSeconds` 50.

Bot probe (30 seeds, exact cook, T s per bowl; 300 s day): at 20 s, 7/30 days reach 350 k (MEC-006 at 180 s / 250 k: 8/30); at 18 s, 22/30; at 22 s, 0/30.

## 10. Acceptance criteria
- The day lasts 300 s of clock time.
- With the first customer waiting and untouched for 120 s, the clock, the customer count and their patience do not change; a blanch still grades.
- After serving the first customer, the clock advances with time.
- Day 2+: no tutorial order, never frozen, the first 2 orders are chips, every later order is spoken.
- Captions: the first customer's steps follow `nextHint`; customers 2–3 get the "what is new" caption; no caption once no tutorial customer waits. No emoji in any caption or toast.

## 12. Owner decisions and agent choices
1. Day ≈ 5 minutes: 300 s (owner).
2. Still 3 tutorial customers (owner).
3. First customer untimed (owner); spawning and that customer's patience also pause (agent, so the second customer does not arrive mid-tutorial).
4. Tutorial content, placement and toasts (agent, rules 4–6).
5. Revenue target 350 k: confirmed by the owner.
6. Later days (rules 8–9): requested by the owner; warm-up of 2 chip customers chosen by the agent.
