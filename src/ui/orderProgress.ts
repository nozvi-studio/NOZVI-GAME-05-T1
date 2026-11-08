import type { Bowl, Order } from '../core/types';

export interface LineProgress {
  given: number;
  wanted: number;
}

export interface OrderProgress {
  /** One entry per ordered topping, same order as `order.toppings`. */
  toppings: LineProgress[];
  /** One entry per ordered garnish, same order as `order.garnishes`. */
  garnishes: LineProgress[];
  /** Broth poured within the good band of the ordered level. */
  brothOk: boolean;
  /** Every line exact, broth ok, noodles in and the avoided ingredient absent. */
  ready: boolean;
}

/** The broth numbers the UI needs, passed in by the controller (the UI does not read balance). */
export interface BrothBands {
  levelFill: readonly number[];
  goodTolerance: number;
}

/** VIS-102 / MEC-006 rule 5: what the current bowl already holds for this order. Display only. */
export function orderProgress(order: Order, bowl: Bowl, broth: BrothBands): OrderProgress {
  const toppings = order.toppings.map((l) => ({ given: bowl.toppings[l.item] ?? 0, wanted: l.portions }));
  const garnishes = order.garnishes.map((l) => ({ given: bowl.garnishes[l.item] ?? 0, wanted: l.portions }));
  const target = broth.levelFill[Math.min(broth.levelFill.length, Math.max(1, order.broth)) - 1];
  const brothOk = bowl.broth !== null && Math.abs(bowl.broth.fill - target) <= broth.goodTolerance + 1e-9;
  const a = order.avoid?.item;
  const avoided = !a || ((bowl.toppings as Record<string, number>)[a] ?? (bowl.garnishes as Record<string, number>)[a] ?? 0) === 0;
  const exact = [...toppings, ...garnishes].every((p) => p.given === p.wanted);
  return { toppings, garnishes, brothOk, ready: bowl.noodles !== null && brothOk && exact && avoided };
}
