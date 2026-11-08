import { describe, expect, it } from 'vitest';
import { emptyBowl, type Bowl, type Order } from '../src/core';
import { orderProgress } from '../src/ui/orderProgress';
import { amountWord, reactionLine, spokenOrder } from '../src/ui/speech';

const order: Order = {
  toppings: [{ item: 'pork', portions: 1 }, { item: 'liver', portions: 3 }],
  garnishes: [{ item: 'scallion', portions: 3 }, { item: 'sprouts', portions: 2 }],
  exclude: 'pepper',
  spoken: false,
};

const bowl = (fill: (b: Bowl) => void = () => {}): Bowl => {
  const b = emptyBowl();
  fill(b);
  return b;
};

// VIS-102 + MEC-005 rule 8: chips show portions given / wanted.
describe('orderProgress', () => {
  it('counts portions per ordered line', () => {
    const p = orderProgress(order, bowl((b) => { b.toppings.liver = 2; b.garnishes.scallion = 3; }));
    expect(p.toppings).toEqual([{ given: 0, wanted: 1 }, { given: 2, wanted: 3 }]);
    expect(p.garnishes).toEqual([{ given: 3, wanted: 3 }, { given: 0, wanted: 2 }]);
    expect(p.ready).toBe(false);
  });

  it('is ready only with noodles, broth and every amount exact', () => {
    const full = (b: Bowl) => {
      b.noodles = 'good';
      b.broth = { fill: 0.8, grade: 'good' };
      b.toppings.pork = 1;
      b.toppings.liver = 3;
      b.garnishes.scallion = 3;
      b.garnishes.sprouts = 2;
    };
    expect(orderProgress(order, bowl(full)).ready).toBe(true);
    expect(orderProgress(order, bowl((b) => { full(b); b.toppings.liver = 4; })).ready).toBe(false);
    expect(orderProgress(order, bowl((b) => { full(b); b.broth = null; })).ready).toBe(false);
  });

  it('flags the excluded ingredient and is then never ready', () => {
    const p = orderProgress(order, bowl((b) => {
      b.noodles = 'good';
      b.broth = { fill: 0.8, grade: 'good' };
      b.toppings.pork = 1;
      b.toppings.liver = 3;
      b.garnishes.scallion = 3;
      b.garnishes.sprouts = 2;
      b.garnishes.pepper = 1;
    }));
    expect(p.excludeViolated).toBe(true);
    expect(p.ready).toBe(false);
  });
});

// MEC-005 rules 5 and 8: Vietnamese wording.
describe('speech', () => {
  it('words amounts as ít / (none) / nhiều', () => {
    expect([amountWord(1), amountWord(2), amountWord(3)]).toEqual(['Ít', '', 'Nhiều']);
  });

  it('builds a spoken order with amounts and the exclusion', () => {
    expect(spokenOrder(order, 0)).toBe('Cho 1 tô ít thịt bằm, nhiều gan, nhiều hành, giá, không tiêu nha!');
    expect(spokenOrder({ ...order, exclude: null }, 1)).toBe('Một tô ít thịt bằm, nhiều gan, nhiều hành, giá!');
  });

  it('scolds by naming the excluded ingredient', () => {
    expect(reactionLine('scold', 0, 'pepper')).toBe('Tôi dặn không tiêu mà! Không trả đâu!');
    expect(reactionLine('happy', 0, null)).toBe('Ngon quá!');
  });
});
