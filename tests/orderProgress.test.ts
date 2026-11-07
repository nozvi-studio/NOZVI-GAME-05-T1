import { describe, expect, it } from 'vitest';
import type { Bowl, Order } from '../src/core/types';
import { orderProgress } from '../src/ui/orderProgress';

const order: Order = { toppings: ['pork', 'liver'], garnishes: ['scallion', 'sprouts'] };

const bowl = (over: Partial<Bowl> = {}): Bowl => ({ noodles: null, toppings: [], broth: null, garnishes: [], ...over });

// VIS-102: order chips show done / not done against the current bowl.
describe('orderProgress', () => {
  it('marks nothing done for an empty bowl', () => {
    const p = orderProgress(order, bowl());
    expect(p.toppings).toEqual([false, false]);
    expect(p.garnishes).toEqual([false, false]);
    expect(p.ready).toBe(false);
  });

  it('marks only the items already in the bowl, in order position', () => {
    const p = orderProgress(order, bowl({ noodles: 'good', toppings: ['liver'], garnishes: ['sprouts'] }));
    expect(p.toppings).toEqual([false, true]);
    expect(p.garnishes).toEqual([false, true]);
    expect(p.ready).toBe(false);
  });

  it('ignores items the order did not ask for', () => {
    const p = orderProgress(order, bowl({ toppings: ['shrimp', 'quailEgg'], garnishes: ['pepper'] }));
    expect(p.toppings).toEqual([false, false]);
    expect(p.garnishes).toEqual([false, false]);
  });

  it('is not ready when every chip is done but noodles or broth are missing', () => {
    const items = { toppings: ['pork', 'liver'], garnishes: ['scallion', 'sprouts'] } as const;
    const noBroth = orderProgress(order, bowl({ noodles: 'perfect', toppings: [...items.toppings], garnishes: [...items.garnishes] }));
    expect(noBroth.toppings.every(Boolean) && noBroth.garnishes.every(Boolean)).toBe(true);
    expect(noBroth.ready).toBe(false);
    const noNoodles = orderProgress(
      order,
      bowl({ broth: { fill: 0.8, grade: 'good' }, toppings: [...items.toppings], garnishes: [...items.garnishes] }),
    );
    expect(noNoodles.ready).toBe(false);
  });

  it('is ready with noodles, broth and every ordered item', () => {
    const p = orderProgress(
      order,
      bowl({
        noodles: 'good',
        toppings: ['pork', 'liver'],
        broth: { fill: 0.8, grade: 'perfect' },
        garnishes: ['scallion', 'sprouts'],
      }),
    );
    expect(p.ready).toBe(true);
  });

  it('handles an order without garnishes', () => {
    const p = orderProgress({ toppings: ['pork'], garnishes: [] }, bowl({ noodles: 'good', toppings: ['pork'], broth: { fill: 0.8, grade: 'good' } }));
    expect(p.garnishes).toEqual([]);
    expect(p.ready).toBe(true);
  });
});
