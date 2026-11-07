---
id: MEC-003
type: mechanic
status: approved
owner: game-design
version: 0.1
parent: GDD
related: [MEC-002, MEC-004]
studio_standard: 0.1
updated: 2026-11-06
---
# MEC-003 — Customers, patience & the day

## 1. Purpose
Time pressure and pacing (GDD §4, §5).

## 5. Rules
1. A day lasts `day.lengthSeconds`; there are `day.tables` tables, one customer each.
2. The first customer spawns at `customers.firstSpawnSeconds` with the fixed order pork + scallion (FTUE, GDD §3b).
3. Spawn interval interpolates linearly from `spawnIntervalStartSeconds` to `spawnIntervalEndSeconds` over the day. When the interval elapses and no table is free, the spawn waits until one frees up. The table is chosen at random among free tables.
4. Kind: `regular`, or `hurried` with probability `hurriedChance` once time ≥ `hurriedFromSeconds`. Patience = `patienceSeconds[kind]`.
5. Order: topping count drawn uniformly from the latest `toppingsPerOrder` bracket whose `fromSeconds` ≤ time; garnish count from `garnishesPerOrder`. Items are distinct, drawn at random.
6. States: `arriving` (`arriveSeconds`) → `waiting` (patience drains 1 per second) → served: `eating` (`eatSeconds`) → `leaving`; patience 0: `leaving` with outcome `angry` (counted as lost). `leaving` lasts `leaveSeconds`, then the customer is removed and the table is free.
7. When time reaches the day length: no more spawns, `dayEnded` is emitted once with the summary, and further updates do nothing. Win if revenue ≥ `day.revenueTarget` (GDD §4).

## 10. Acceptance criteria
- Given a new day, after `firstSpawnSeconds + arriveSeconds` the first customer is waiting with order pork + scallion.
- Given a waiting regular customer, after `patienceSeconds.regular` without service, they leave angry and `lost` increases by 1.
- Given all tables taken, no customer spawns until one is removed.
- Same seed → same sequence of customers and orders.
