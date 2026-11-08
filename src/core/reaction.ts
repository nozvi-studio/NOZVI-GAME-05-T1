import type { Balance } from './balance';
import type { BowlGrade } from './bowl';
import type { Bowl, Reaction } from './types';

/** MEC-005 rule 11: perfect needs high quality and no ingredient mistake. */
export function isPerfect(g: BowlGrade, q: Balance['quality']): boolean {
  return g.quality >= q.perfectBowlThreshold && g.mistakes === 0;
}

/** MEC-005 rules 12-14. */
export function decideReaction(bowl: Bowl, g: BowlGrade, q: Balance['quality'], r: Balance['reactions']): Reaction {
  const noodlesBad = bowl.noodles === 'bad';
  const brothBad = bowl.broth === null || bowl.broth.grade === 'bad';
  if (g.forbidden || g.quality < r.scoldBelow || (noodlesBad && brothBad)) return 'scold';
  if (g.quality < r.complainBelow || noodlesBad || brothBad) return 'complain';
  return isPerfect(g, q) ? 'happy' : 'ok';
}

/** MEC-005 rules 12-14: what the customer pays. `patienceLeft` is 0..1. */
export function payFor(
  reaction: Reaction,
  quality: number,
  patienceLeft: number,
  pay: Balance['payment'],
  r: Balance['reactions'],
): { price: number; tip: number } {
  if (reaction === 'scold') return { price: 0, tip: 0 };
  if (reaction === 'complain') return { price: Math.round(pay.price * r.complainPriceRatio), tip: 0 };
  return { price: pay.price, tip: Math.round(pay.maxTip * quality * patienceLeft) };
}
