import type { Balance } from './balance';
import type { Deviation } from './bowl';
import type { Reaction, Temper } from './types';

const TIERS: readonly Reaction[] = ['happy', 'ok', 'grumble', 'complain', 'scold'];

/** MEC-006 rules 8-10: tier from the deviation, shifted by temperament; forced cases always scold. */
export function decideReaction(dev: Deviation, temper: Temper, b: Balance): Reaction {
  if (dev.forced) return 'scold';
  let i = b.deviation.tiers.findIndex((t) => dev.d <= t + 1e-9);
  if (i < 0) i = TIERS.length - 1;
  i = Math.min(TIERS.length - 1, Math.max(0, i + b.temper.shift[temper]));
  return TIERS[i];
}

/** MEC-006 rule 11. */
export function isPerfect(reaction: Reaction, dev: Deviation, b: Balance): boolean {
  return reaction === 'happy' && dev.d <= b.deviation.tiers[0] + 1e-9;
}

/** 0..1 score for the summary and floats: 1 when exact, 0 at the scold threshold. */
export function qualityOf(dev: Deviation, b: Balance): number {
  const scoldAt = b.deviation.tiers[b.deviation.tiers.length - 1];
  return Math.max(0, Math.round((1 - dev.d / scoldAt) * 1000) / 1000);
}

/** MEC-006 rule 12: what the customer pays. `patienceLeft` is 0..1. */
export function payFor(reaction: Reaction, temper: Temper, patienceLeft: number, b: Balance): { price: number; tip: number } {
  const { price, maxTip } = b.payment;
  const r = b.reactions;
  switch (reaction) {
    case 'happy':
      return { price, tip: Math.round(maxTip * patienceLeft) };
    case 'ok':
      return { price, tip: Math.round(maxTip * patienceLeft * r.okTipRatio) };
    case 'grumble':
      return { price, tip: 0 };
    case 'complain':
      return { price: Math.round(price * r.complainPriceRatio), tip: 0 };
    default:
      return { price: temper === 'picky' ? 0 : Math.round(price * r.scoldPayRatio), tip: 0 };
  }
}
