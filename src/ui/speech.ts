import type { Ingredient, Order, Reaction } from '../core/types';
import { GARNISH_LABEL, TOPPING_LABEL } from './strings';

// MEC-005: Vietnamese wording for amounts, spoken orders and customer reactions (presentation only).

const LABEL: Record<Ingredient, string> = { ...TOPPING_LABEL, ...GARNISH_LABEL };

/** Chip prefix for an amount: ít 1, vừa 2 (no word), nhiều 3. */
export function amountWord(portions: number): string {
  if (portions <= 1) return 'Ít';
  if (portions >= 3) return 'Nhiều';
  return '';
}

const lower = (s: string) => s.toLocaleLowerCase('vi');

const OPENERS = ['Cho 1 tô ', 'Một tô ', 'Bán cho tô hủ tiếu ', 'Cho tô '];
const ENDINGS = [' nha!', '!', ' nghen!', ' nhé!'];

/** One spoken sentence for the order, e.g. "Cho 1 tô nhiều hành, giá, ít thịt bằm nha!". `variant` picks the wording. */
export function spokenOrder(order: Order, variant: number): string {
  const parts = [...order.toppings, ...order.garnishes].map((l) => {
    const w = lower(amountWord(l.portions));
    return `${w ? `${w} ` : ''}${lower(LABEL[l.item])}`;
  });
  if (order.exclude) parts.push(`không ${lower(LABEL[order.exclude])}`);
  const v = Math.abs(variant);
  return `${OPENERS[v % OPENERS.length]}${parts.join(', ')}${ENDINGS[v % ENDINGS.length]}`;
}

const LINES: Record<Exclude<Reaction, 'scold'>, string[]> = {
  happy: ['Ngon quá!', 'Đúng ý luôn, mai ghé nữa!', 'Tuyệt vời!'],
  ok: ['Được đó.', 'Cũng ổn.', 'Tạm được.'],
  complain: ['Hơi dở nha, trả nửa tiền thôi!', 'Không ngon lắm, nửa tiền thôi!', 'Nấu chưa tới, nửa tiền thôi nha!'],
};
const SCOLD = ['Dở quá, không ăn nổi!', 'Nấu kiểu gì vậy trời! Không trả!', 'Sai hết rồi! Tôi đi đây!'];

/** Customer's line when served. Playful, no profanity (owner decision 2026-11-08). */
export function reactionLine(reaction: Reaction, variant: number, forbidden: Ingredient | null): string {
  const v = Math.abs(variant);
  if (reaction === 'scold') return forbidden ? `Tôi dặn không ${lower(LABEL[forbidden])} mà! Không trả đâu!` : SCOLD[v % SCOLD.length];
  const lines = LINES[reaction];
  return lines[v % lines.length];
}
