---
id: MEC-004
type: mechanic
status: approved
owner: game-design
version: 0.1
parent: GDD
related: [MEC-002, MEC-003]
studio_standard: 0.1
updated: 2026-11-06
---
# MEC-004 — Serve & payment

## 5. Rules
> Rule 3 (payment) is superseded by MEC-005 (happy / ok / complain / scold reactions).

1. Serving targets a table. Allowed only if the bowl has noodles and that table's customer is `waiting`; otherwise rejected and the bowl stays.
2. The bowl is graded against **that** customer's order (MEC-002 quality). Serving the wrong table is allowed but usually scores low.
3. Payment: price = `payment.price`; tip = round(`payment.maxTip` × quality × patience/maxPatience); total added to revenue immediately.
4. The customer switches to `eating`; the bowl is emptied for the next order.
5. Money is shown in thousand VND (e.g. 30 → "30k").

## 10. Acceptance criteria
- Given a perfect bowl served with full patience, total = price + maxTip.
- Given a table with no waiting customer, serve returns null and the bowl is unchanged.
