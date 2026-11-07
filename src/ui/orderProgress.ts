import type { Bowl, Order } from '../core/types';

export interface OrderProgress {
  /** One flag per ordered topping, same order as `order.toppings`. */
  toppings: boolean[];
  /** One flag per ordered garnish, same order as `order.garnishes`. */
  garnishes: boolean[];
  /** Every ordered item is in the bowl and it also holds noodles and broth. */
  ready: boolean;
}

/**
 * VIS-102: which ordered items the current bowl already holds. Display only (no sim state);
 * items the order did not ask for are ignored (owner decision 2026-11-07).
 */
export function orderProgress(order: Order, bowl: Bowl): OrderProgress {
  const toppings = order.toppings.map((t) => bowl.toppings.includes(t));
  const garnishes = order.garnishes.map((g) => bowl.garnishes.includes(g));
  const ready = bowl.noodles !== null && bowl.broth !== null && toppings.every(Boolean) && garnishes.every(Boolean);
  return { toppings, garnishes, ready };
}
