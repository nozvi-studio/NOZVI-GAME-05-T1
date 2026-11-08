import { describe, expect, it } from 'vitest';
import { bowlQuality, decideReaction, defaultBalance, emptyBowl, gradeBowl, gradeBroth, partScore, payFor, type Bowl, type Order } from '../src/core';
import { KitchenState } from '../src/core/kitchen';

const q = defaultBalance.quality;

function hold(k: KitchenState, seconds: number, step = 0.05): void {
  for (let t = 0; t < seconds - 1e-9; t += step) k.update(Math.min(step, seconds - t));
}

describe('MEC-002 bowl assembly', () => {
  it('blanch 3 s then release gives perfect noodles in the basket', () => {
    const k = new KitchenState(defaultBalance);
    expect(k.startBlanch()).toBe(true);
    hold(k, 3);
    expect(k.releaseBlanch()).toBe('perfect');
    expect(k.state.basket).toBe('perfect');
    expect(k.startBlanch()).toBe(false);
  });

  it('auto-releases blanch at maxHoldSeconds', () => {
    const k = new KitchenState(defaultBalance);
    k.startBlanch();
    hold(k, defaultBalance.blanch.maxHoldSeconds + 0.5);
    expect(k.state.blanching).toBeNull();
    expect(k.state.basket).toBe('bad');
  });

  it('moves noodles to the bowl only when allowed', () => {
    const k = new KitchenState(defaultBalance);
    expect(k.moveNoodlesToBowl()).toBe(false);
    k.startBlanch();
    hold(k, 3);
    k.releaseBlanch();
    expect(k.moveNoodlesToBowl()).toBe(true);
    expect(k.state.basket).toBeNull();
    expect(k.state.bowl.noodles).toBe('perfect');
  });

  it('rejects toppings, garnish and broth before noodles', () => {
    const k = new KitchenState(defaultBalance);
    expect(k.addTopping('pork')).toBe(false);
    expect(k.addGarnish('scallion')).toBe(false);
    expect(k.startPour()).toBe(false);
  });

  // MEC-005 rule 1: each tap adds one portion, capped at maxPortions.
  it('adds one portion per tap up to maxPortions', () => {
    const k = new KitchenState(defaultBalance);
    k.startBlanch();
    k.releaseBlanch();
    k.moveNoodlesToBowl();
    const max = defaultBalance.amounts.maxPortions;
    for (let i = 0; i < max; i++) expect(k.addGarnish('scallion')).toBe(true);
    expect(k.addGarnish('scallion')).toBe(false);
    expect(k.state.bowl.garnishes.scallion).toBe(max);
    expect(k.addTopping('pork')).toBe(true);
    expect(k.state.bowl.toppings.pork).toBe(1);
  });

  it('pours broth once and grades the fill', () => {
    const k = new KitchenState(defaultBalance);
    k.startBlanch();
    k.releaseBlanch();
    k.moveNoodlesToBowl();
    expect(k.startPour()).toBe(true);
    hold(k, defaultBalance.broth.targetFill / defaultBalance.broth.fillPerSecond);
    expect(k.releasePour()).toBe('perfect');
    expect(k.startPour()).toBe(false);
  });

  it('auto-releases broth at maxFill as bad', () => {
    const k = new KitchenState(defaultBalance);
    k.startBlanch();
    k.releaseBlanch();
    k.moveNoodlesToBowl();
    k.startPour();
    hold(k, 10);
    expect(k.state.bowl.broth).toEqual({ fill: defaultBalance.broth.maxFill, grade: 'bad' });
  });

  it('discard empties the bowl but keeps the basket', () => {
    const k = new KitchenState(defaultBalance);
    k.startBlanch();
    k.releaseBlanch();
    k.moveNoodlesToBowl();
    k.startBlanch();
    k.releaseBlanch();
    k.discardBowl();
    expect(k.state.bowl.noodles).toBeNull();
    expect(k.state.basket).not.toBeNull();
  });

  it('grades broth bands', () => {
    expect(gradeBroth(0.8, defaultBalance.broth)).toBe('perfect');
    expect(gradeBroth(0.9, defaultBalance.broth)).toBe('good');
    expect(gradeBroth(0.4, defaultBalance.broth)).toBe('bad');
  });

});

// MEC-005 rules 9-15.
const order = (over: Partial<Order> = {}): Order => ({
  toppings: [{ item: 'pork', portions: 2 }],
  garnishes: [{ item: 'scallion', portions: 3 }],
  exclude: null,
  spoken: false,
  ...over,
});

/** A bowl that matches `order()` exactly, with perfect cooking. */
const goodBowl = (): Bowl => {
  const b = emptyBowl();
  b.noodles = 'perfect';
  b.broth = { fill: 0.8, grade: 'perfect' };
  b.toppings.pork = 2;
  b.garnishes.scallion = 3;
  return b;
};

describe('MEC-005 scoring', () => {
  it('a missing or extra ingredient costs missingPenalty', () => {
    const given = { ...emptyBowl().toppings };
    expect(partScore(['pork', 'shrimp'], [{ item: 'pork', portions: 1 }], given, null, q).score).toBeCloseTo(0.66);
    given.pork = 1;
    given.liver = 2;
    const extra = partScore(['pork', 'liver'], [{ item: 'pork', portions: 1 }], given, null, q);
    expect(extra.score).toBeCloseTo(0.66);
    expect(extra.mistakes).toBe(1);
    expect(extra.forbidden).toBe(false);
  });

  it('a wrong amount costs portionPenalty per portion', () => {
    const b = goodBowl();
    b.toppings.pork = 3; // vừa ordered, nhiều given
    const g = gradeBowl(b, order(), q);
    expect(partScore(['pork'], order().toppings, b.toppings, null, q).score).toBeCloseTo(1 - q.portionPenalty);
    expect(g.mistakes).toBe(1);
  });

  it('adding an excluded ingredient marks the bowl forbidden', () => {
    const b = goodBowl();
    b.garnishes.pepper = 1;
    const g = gradeBowl(b, order({ exclude: 'pepper' }), q);
    expect(g.forbidden).toBe(true);
    expect(partScore(['scallion', 'pepper'], order().garnishes, b.garnishes, 'pepper', q).score).toBeCloseTo(1 - q.forbiddenPenalty);
  });

  it('quality is 1 for an exact bowl and drops without broth', () => {
    expect(bowlQuality(goodBowl(), order(), q)).toBe(1);
    expect(bowlQuality({ ...goodBowl(), broth: null }, order(), q)).toBeCloseTo(0.8);
  });
});

describe('MEC-005 reactions and payment', () => {
  const r = defaultBalance.reactions;
  const pay = defaultBalance.payment;
  const react = (b: Bowl, o = order()) => decideReaction(b, gradeBowl(b, o, q), q, r);

  it('an exact, well cooked bowl makes the customer happy and pays price + tip', () => {
    expect(react(goodBowl())).toBe('happy');
    expect(payFor('happy', 1, 1, pay, r)).toEqual({ price: pay.price, tip: pay.maxTip });
  });

  it('one portion off is still paid but not perfect (ok)', () => {
    const b = goodBowl();
    b.garnishes.scallion = 2;
    expect(react(b)).toBe('ok');
  });

  it('bad noodles with good broth: the customer complains and pays half, no tip', () => {
    const b = goodBowl();
    b.noodles = 'bad';
    b.broth = { fill: 0.9, grade: 'good' };
    expect(react(b)).toBe('complain');
    expect(payFor('complain', 0.7, 1, pay, r)).toEqual({ price: Math.round(pay.price * r.complainPriceRatio), tip: 0 });
  });

  it('bad noodles and bad broth: the customer scolds and pays nothing', () => {
    const b = goodBowl();
    b.noodles = 'bad';
    b.broth = { fill: 1.2, grade: 'bad' };
    expect(react(b)).toBe('scold');
    expect(payFor('scold', 0.6, 1, pay, r)).toEqual({ price: 0, tip: 0 });
  });

  it('an excluded ingredient makes the customer scold even if the rest is perfect', () => {
    const b = goodBowl();
    b.garnishes.pepper = 1;
    expect(react(b, order({ exclude: 'pepper' }))).toBe('scold');
  });

  it('very low quality scolds', () => {
    const b = goodBowl();
    b.toppings.pork = 0;
    b.toppings.shrimp = 2;
    b.toppings.liver = 2;
    b.garnishes.scallion = 0;
    b.garnishes.pepper = 2;
    b.noodles = 'good';
    b.broth = null;
    expect(gradeBowl(b, order(), q).quality).toBeLessThan(defaultBalance.reactions.scoldBelow);
    expect(react(b)).toBe('scold');
  });
});
