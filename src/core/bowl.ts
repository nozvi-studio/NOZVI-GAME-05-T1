import type { Balance } from './balance';
import { GARNISHES, INGREDIENTS, TOPPINGS, type Bowl, type Cause, type Grade, type Ingredient, type Order } from './types';

const zeros = <T extends string>(items: readonly T[]) => Object.fromEntries(items.map((i) => [i, 0])) as Record<T, number>;

export function emptyBowl(): Bowl {
  return { noodles: null, noodleError: null, toppings: zeros(TOPPINGS), broth: null, garnishes: zeros(GARNISHES) };
}

// MEC-002 rule 4: grade broth fill against the vừa line (gauge feedback only since MEC-006).
export function gradeBroth(fill: number, cfg: Balance['broth']): Grade {
  const error = Math.abs(fill - cfg.targetFill);
  if (error <= cfg.perfectTolerance + 1e-9) return 'perfect';
  if (error <= cfg.goodTolerance + 1e-9) return 'good';
  return 'bad';
}

/** Target fill for a broth level (1 ít, 2 vừa, 3 nhiều). */
export function brothTarget(level: number, cfg: Balance['broth']): number {
  return cfg.levelFill[Math.min(cfg.levelFill.length, Math.max(1, level)) - 1];
}

/** Level (1..3) whose target is closest to `fill`. */
export function nearestBrothLevel(fill: number, cfg: Balance['broth']): number {
  let best = 0;
  cfg.levelFill.forEach((f, i) => {
    if (Math.abs(f - fill) < Math.abs(cfg.levelFill[best] - fill)) best = i;
  });
  return best + 1;
}

export interface Deviation {
  /** MEC-006 D: 0 when the bowl is exactly what the customer wanted. */
  d: number;
  /** Largest single contribution, for the reaction line. */
  cause: Cause | null;
  /** Allergy hit, or a disliked ingredient added too often: scold whatever the temperament (rule 10). */
  forced: boolean;
}

const portionsOf = (bowl: Bowl, item: Ingredient): number =>
  (bowl.toppings as Record<string, number>)[item] ?? (bowl.garnishes as Record<string, number>)[item] ?? 0;

// MEC-006 rule 7.
export function deviation(bowl: Bowl, order: Order, b: Balance): Deviation {
  const cfg = b.deviation;
  const parts: Array<{ amount: number; cause: Cause }> = [];
  let forced = false;

  const err = bowl.noodleError ?? 0;
  if (err !== 0) parts.push({ amount: (cfg.noodleWeight * Math.abs(err)) / cfg.noodleUnitSeconds, cause: { kind: 'noodles', sign: Math.sign(err) } });

  if (bowl.broth === null) parts.push({ amount: cfg.missingBroth, cause: { kind: 'broth', sign: -1 } });
  else {
    const off = bowl.broth.fill - brothTarget(order.broth, b.broth);
    if (Math.abs(off) > 1e-9) parts.push({ amount: (cfg.brothWeight * Math.abs(off)) / cfg.brothUnitFill, cause: { kind: 'broth', sign: Math.sign(off) } });
  }

  const wanted = new Map<Ingredient, number>([...order.toppings, ...order.garnishes].map((l) => [l.item, l.portions]));
  for (const item of INGREDIENTS) {
    const g = portionsOf(bowl, item);
    if (order.avoid && order.avoid.item === item) {
      if (g === 0) continue;
      if (order.avoid.kind === 'allergy') {
        forced = true;
        parts.push({ amount: Number.MAX_SAFE_INTEGER, cause: { kind: 'allergy', item } });
        continue;
      }
      if (g >= cfg.dislikeScoldPortions) forced = true;
      parts.push({ amount: cfg.dislikePortionWeight * g, cause: { kind: 'dislike', item } });
      continue;
    }
    const w = wanted.get(item) ?? 0;
    if (g === w) continue;
    const kind = w === 0 ? 'extra' : g === 0 ? 'missing' : 'amount';
    parts.push({ amount: cfg.portionWeight * Math.abs(g - w), cause: { kind, item, sign: Math.sign(g - w) } });
  }

  const real = parts.filter((p) => p.amount < Number.MAX_SAFE_INTEGER);
  const d = Math.round(real.reduce((a, p) => a + p.amount, 0) * 1e6) / 1e6;
  const top = parts.reduce<(typeof parts)[number] | null>((a, p) => (a === null || p.amount > a.amount ? p : a), null);
  return { d, cause: top?.cause ?? null, forced };
}
