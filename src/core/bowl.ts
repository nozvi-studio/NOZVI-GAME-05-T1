import type { Balance } from './balance';
import type { Bowl, Grade, Order } from './types';

export function emptyBowl(): Bowl {
  return { noodles: null, toppings: [], broth: null, garnishes: [] };
}

// MEC-002 rule 4: grade broth fill against the target line.
export function gradeBroth(fill: number, cfg: Balance['broth']): Grade {
  const error = Math.abs(fill - cfg.targetFill);
  if (error <= cfg.perfectTolerance + 1e-9) return 'perfect';
  if (error <= cfg.goodTolerance + 1e-9) return 'good';
  return 'bad';
}

/** MEC-002 rule 6: 1 − penalty × (missing + extra), floored at 0. */
export function setScore<T>(wanted: readonly T[], given: readonly T[], penalty: number): number {
  const missing = wanted.filter((w) => !given.includes(w)).length;
  const extra = given.filter((g) => !wanted.includes(g)).length;
  return Math.max(0, 1 - penalty * (missing + extra));
}

// MEC-002 rule 6: weighted bowl quality in 0..1.
export function bowlQuality(bowl: Bowl, order: Order, q: Balance['quality']): number {
  const grade = (g: Grade | null | undefined) => (g ? q.gradeScore[g] : 0);
  const quality =
    q.weights.noodles * grade(bowl.noodles) +
    q.weights.broth * grade(bowl.broth?.grade) +
    q.weights.toppings * setScore(order.toppings, bowl.toppings, q.mistakePenalty) +
    q.weights.garnishes * setScore(order.garnishes, bowl.garnishes, q.mistakePenalty);
  return Math.min(1, Math.max(0, Math.round(quality * 1000) / 1000));
}
