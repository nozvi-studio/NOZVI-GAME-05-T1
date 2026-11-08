import type { Avoid, Cause, Ingredient, Order, OrderLine, Reaction, Temper } from '../core/types';
import { GARNISH_LABEL, TOPPING_LABEL } from './strings';

// MEC-005 / MEC-006: all Vietnamese wording for orders and customer lines (presentation only, no icons).

const LABEL: Record<Ingredient, string> = { ...TOPPING_LABEL, ...GARNISH_LABEL };
const lower = (s: string) => s.toLocaleLowerCase('vi');
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('vi') + s.slice(1);
const pick = <T>(list: readonly T[], v: number): T => list[Math.abs(v) % list.length];

/** Chip prefix for an amount: ít 1, vừa 2 (no word), nhiều 3. */
export function amountWord(portions: number): string {
  if (portions <= 1) return 'Ít';
  if (portions >= 3) return 'Nhiều';
  return '';
}

/** "Ít nước" / "Vừa nước" / "Nhiều nước". */
export function brothWord(level: number): string {
  return level <= 1 ? 'Ít nước' : level >= 3 ? 'Nhiều nước' : 'Vừa nước';
}

/** Chip text for one ordered ingredient: "Nhiều hành", "Thịt bằm". */
export function lineText(l: OrderLine<Ingredient>): string {
  const w = amountWord(l.portions);
  return w ? `${w} ${lower(LABEL[l.item])}` : LABEL[l.item];
}

/** Chip text for an avoid request: "Không tiêu", "Dị ứng tôm". */
export function avoidChip(a: Avoid): string {
  return a.kind === 'allergy' ? `Dị ứng ${lower(LABEL[a.item])}` : `Không ${lower(LABEL[a.item])}`;
}

/** Spoken avoid clause; `variant` picks between equivalent phrasings. */
function avoidClause(a: Avoid, v: number): string {
  const x = lower(LABEL[a.item]);
  // No trailing particle here: the sentence ending adds one (avoids "nha nghen").
  if (a.kind === 'allergy') return pick([`tui dị ứng ${x}`, `tui không ăn được ${x}`], v);
  return pick([`không ${x}`, `tui không thích ăn ${x}`], v);
}

const OPENERS = ['Cho 1 tô ', 'Một tô ', 'Bán cho tô hủ tiếu ', 'Cho tô '];
const ENDINGS = [' nha!', '!', ' nghen!', ' nhé!'];

/** Explicit spoken order naming every item, e.g. "Cho 1 tô nhiều hành, giá, ít thịt bằm, ít nước nha!". */
export function explicitOrder(order: Order, variant: number): string {
  const parts = [...order.toppings, ...order.garnishes].map((l) => lower(lineText(l)));
  if (order.broth !== 2) parts.push(lower(brothWord(order.broth)));
  if (order.avoid) parts.push(avoidClause(order.avoid, variant));
  return `${pick(OPENERS, variant)}${parts.join(', ')}${pick(ENDINGS, variant)}`;
}

/** MEC-006 rule 4: phrase for each implied recipe id (`src/core/implied.ts`). */
export const IMPLIED_PHRASE: Record<string, string> = {
  regular: 'Cho tô thường.',
  hungry: 'Đói quá, làm tô thật đầy!',
  light: 'Ăn nhẹ thôi, tô nhỏ nhỏ.',
  seafood: 'Tô thường, thêm hải sản nha.',
  veggie: 'Bớt thịt, cho nhiều rau.',
  dry: 'Tô khô khô, ít nước thôi.',
  soupy: 'Nước nhiều cho tui húp.',
  nourishing: 'Tô bổ dưỡng, thêm gan với trứng.',
  spicy: 'Thích cay thơm, nhiều tiêu vô.',
  noScallion: 'Tô thường, đừng bỏ hành.',
};

/** The sentence shown for a spoken order (explicit or implied). */
export function spokenOrder(order: Order, variant: number): string {
  if (order.style === 'implied' && order.implied) {
    const base = IMPLIED_PHRASE[order.implied] ?? IMPLIED_PHRASE.regular;
    return order.avoid ? `${base} À, ${avoidClause(order.avoid, variant)}!` : base;
  }
  return explicitOrder(order, variant);
}

/** What the customer complains about, from the biggest cause of the deviation. */
function causeText(c: Cause | null): string {
  if (!c) return '';
  const x = c.item ? lower(LABEL[c.item]) : '';
  switch (c.kind) {
    case 'allergy':
      return `tui dị ứng ${x} mà`;
    case 'dislike':
      return `đã nói không ${x} rồi`;
    case 'noodles':
      return (c.sign ?? 0) > 0 ? 'mì nát hết rồi' : 'mì còn sống nhăn';
    case 'broth':
      return (c.sign ?? 0) > 0 ? 'nước ngập cả tô' : 'nước gì mà ít xíu';
    case 'missing':
      return `thiếu ${x} rồi`;
    case 'extra':
      return `ai kêu bỏ ${x} đâu`;
    default:
      return (c.sign ?? 0) > 0 ? `${x} nhiều quá` : `${x} ít quá`;
  }
}

const HAPPY = ['Ngon quá!', 'Đúng ý luôn, mai ghé nữa!', 'Tuyệt vời!'];
const OK = ['Được đó.', 'Cũng ổn.', 'Tạm được.'];

/**
 * MEC-006 rule 13: the line grows harsher with the tier and names the worst cause.
 * Picky customers are sharper. Playful, never profane (owner decision 2026-11-08).
 */
export function reactionLine(reaction: Reaction, cause: Cause | null, temper: Temper, variant: number): string {
  const why = causeText(cause);
  const sharp = temper === 'picky';
  switch (reaction) {
    case 'happy':
      return pick(HAPPY, variant);
    case 'ok':
      return why ? `Cũng được, mà ${why}.` : pick(OK, variant);
    case 'grumble':
      return sharp ? `Hừm, ${why}. Không tip đâu.` : `${cap(why)}, lần sau để ý nha.`;
    case 'complain':
      return sharp ? `${cap(why)}! Trả nửa tiền thôi!` : `${cap(why)}, nửa tiền thôi nha!`;
    default:
      return sharp ? `TRỜI ĐẤT ƠI! ${cap(why)}!! Không trả đồng nào!` : `Trời ơi, ${why}!! Tui đi đây!`;
  }
}

/** MEC-006 rule 14: a customer who waited too long says this and leaves. */
export function leaveLine(temper: Temper, variant: number): string {
  if (temper === 'picky') return pick(['Chờ cả buổi! Bán buôn kiểu gì vậy!', 'Thôi khỏi, chậm như rùa!'], variant);
  return pick(['Lâu quá, thôi đi chỗ khác!', 'Đói xỉu rồi, tui đi đây.', 'Thôi, lần khác ăn vậy.'], variant);
}
