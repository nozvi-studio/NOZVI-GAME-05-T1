import type { Balance } from './balance';
import { GARNISHES, TOPPINGS, type Bowl, type Grade, type Ingredient, type Order, type OrderLine } from './types';

const zeros = <T extends string>(items: readonly T[]) => Object.fromEntries(items.map((i) => [i, 0])) as Record<T, number>;

export function emptyBowl(): Bowl {
  return { noodles: null, toppings: zeros(TOPPINGS), broth: null, garnishes: zeros(GARNISHES) };
}

// MEC-002 rule 4: grade broth fill against the target line.
export function gradeBroth(fill: number, cfg: Balance['broth']): Grade {
  const error = Math.abs(fill - cfg.targetFill);
  if (error <= cfg.perfectTolerance + 1e-9) return 'perfect';
  if (error <= cfg.goodTolerance + 1e-9) return 'good';
  return 'bad';
}

export interface PartScore {
  /** 0..1 */
  score: number;
  /** Ingredients that are missing, extra or in the wrong amount. */
  mistakes: number;
  /** The excluded ingredient was added. */
  forbidden: boolean;
}

/** MEC-005 rule 9: score one ingredient group (toppings or garnishes) against the order lines. */
export function partScore<T extends Ingredient>(
  items: readonly T[],
  wanted: readonly OrderLine<T>[],
  given: Record<T, number>,
  exclude: Ingredient | null,
  q: Balance['quality'],
): PartScore {
  let penalty = 0;
  let mistakes = 0;
  let forbidden = false;
  for (const item of items) {
    const w = wanted.find((l) => l.item === item)?.portions ?? 0;
    const g = given[item] ?? 0;
    if (w === g) continue;
    mistakes += 1;
    if (g === 0) penalty += q.missingPenalty;
    else if (w === 0 && item === exclude) {
      penalty += q.forbiddenPenalty;
      forbidden = true;
    } else if (w === 0) penalty += q.missingPenalty;
    else penalty += q.portionPenalty * Math.abs(g - w);
  }
  return { score: Math.max(0, Math.round((1 - penalty) * 1e6) / 1e6), mistakes, forbidden };
}

export interface BowlGrade {
  /** 0..1 */
  quality: number;
  mistakes: number;
  forbidden: boolean;
}

// MEC-005 rules 9-10: weighted bowl quality in 0..1 plus the mistakes that decide the reaction.
export function gradeBowl(bowl: Bowl, order: Order, q: Balance['quality']): BowlGrade {
  const grade = (g: Grade | null | undefined) => (g ? q.gradeScore[g] : 0);
  const tops = partScore(TOPPINGS, order.toppings, bowl.toppings, order.exclude, q);
  const gars = partScore(GARNISHES, order.garnishes, bowl.garnishes, order.exclude, q);
  const quality =
    q.weights.noodles * grade(bowl.noodles) +
    q.weights.broth * grade(bowl.broth?.grade) +
    q.weights.toppings * tops.score +
    q.weights.garnishes * gars.score;
  return {
    quality: Math.min(1, Math.max(0, Math.round(quality * 1000) / 1000)),
    mistakes: tops.mistakes + gars.mistakes,
    forbidden: tops.forbidden || gars.forbidden,
  };
}

export function bowlQuality(bowl: Bowl, order: Order, q: Balance['quality']): number {
  return gradeBowl(bowl, order, q).quality;
}
