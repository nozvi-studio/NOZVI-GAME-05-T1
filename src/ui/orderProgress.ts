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
  /** The bowl holds the ingredient the customer said "không" to. */
  excludeViolated: boolean;
  /** Every line has exactly its amount, nothing excluded, and the bowl has noodles and broth. */
  ready: boolean;
}

/**
 * VIS-102 / MEC-005: portions already in the bowl for each ordered line. Display only (no sim state);
 * items the order did not ask for are not flagged, except the explicit exclusion.
 */
export function orderProgress(order: Order, bowl: Bowl): OrderProgress {
  const toppings = order.toppings.map((l) => ({ given: bowl.toppings[l.item] ?? 0, wanted: l.portions }));
  const garnishes = order.garnishes.map((l) => ({ given: bowl.garnishes[l.item] ?? 0, wanted: l.portions }));
  const ex = order.exclude;
  const excludeViolated = ex !== null && ((bowl.toppings as Record<string, number>)[ex] ?? (bowl.garnishes as Record<string, number>)[ex] ?? 0) > 0;
  const exact = [...toppings, ...garnishes].every((p) => p.given === p.wanted);
  const ready = bowl.noodles !== null && bowl.broth !== null && exact && !excludeViolated;
  return { toppings, garnishes, excludeViolated, ready };
}
