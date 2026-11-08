import { describe, expect, it } from 'vitest';
import { decideReaction, defaultBalance as B, deviation, emptyBowl, gradeBroth, isPerfect, payFor, type Bowl, type Order, type Temper } from '../src/core';

const defaultBalance = B;
import { KitchenState } from '../src/core/kitchen';


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

// MEC-006 rules 7-12.
const order = (over: Partial<Order> = {}): Order => ({
  toppings: [{ item: 'pork', portions: 2 }],
  garnishes: [{ item: 'scallion', portions: 3 }],
  broth: 2,
  avoid: null,
  style: 'chips',
  implied: null,
  tutorial: false,
  clarified: false,
  ...over,
});

/** A bowl that matches `order()` exactly, perfectly cooked. */
const exact = (): Bowl => {
  const b = emptyBowl();
  b.noodles = 'perfect';
  b.noodleError = 0;
  b.broth = { fill: B.broth.levelFill[1], grade: 'perfect' };
  b.toppings.pork = 2;
  b.garnishes.scallion = 3;
  return b;
};

const react = (b: Bowl, temper: Temper = 'normal', o = order()) => decideReaction(deviation(b, o, B), temper, B);

describe('MEC-006 deviation', () => {
  it('an exact bowl has D = 0 and is perfect', () => {
    const dev = deviation(exact(), order(), B);
    expect(dev.d).toBe(0);
    expect(dev.cause).toBeNull();
    expect(isPerfect(decideReaction(dev, 'normal', B), dev, B)).toBe(true);
  });

  it('one portion off is D = 1 and names the item', () => {
    const b = exact();
    b.garnishes.scallion = 2;
    const dev = deviation(b, order(), B);
    expect(dev.d).toBe(1);
    expect(dev.cause).toEqual({ kind: 'amount', item: 'scallion', sign: -1 });
  });

  it('noodles count 1.5 per second off, signed', () => {
    const b = exact();
    b.noodleError = 1;
    expect(deviation(b, order(), B)).toMatchObject({ d: 1.5, cause: { kind: 'noodles', sign: 1 } });
  });

  it('broth is graded against the ordered level', () => {
    const b = exact();
    b.broth = { fill: B.broth.levelFill[0], grade: 'bad' };
    expect(deviation(b, order({ broth: 1 }), B).d).toBe(0);
    expect(deviation(b, order({ broth: 3 }), B)).toMatchObject({ d: 5, cause: { kind: 'broth', sign: -1 } });
    expect(deviation({ ...exact(), broth: null }, order(), B).d).toBe(B.deviation.missingBroth);
  });

  it('allergy forces a scold; dislike costs 1.5 per portion and forces at 2', () => {
    const b = exact();
    b.toppings.shrimp = 1;
    expect(deviation(b, order({ avoid: { item: 'shrimp', kind: 'allergy' } }), B)).toMatchObject({ forced: true, cause: { kind: 'allergy', item: 'shrimp' } });
    const one = deviation(b, order({ avoid: { item: 'shrimp', kind: 'dislike' } }), B);
    expect(one).toMatchObject({ d: 1.5, forced: false });
    b.toppings.shrimp = 2;
    expect(deviation(b, order({ avoid: { item: 'shrimp', kind: 'dislike' } }), B).forced).toBe(true);
  });
});

describe('MEC-006 reactions and payment', () => {
  it('temperament shifts a one-portion mistake: easy happy, normal ok, picky grumble', () => {
    const b = exact();
    b.garnishes.scallion = 2;
    expect([react(b, 'easy'), react(b, 'normal'), react(b, 'picky')]).toEqual(['happy', 'ok', 'grumble']);
  });

  it('noodles 1 s off is ok for a normal customer', () => {
    const b = exact();
    b.noodleError = -1;
    expect(react(b)).toBe('ok');
  });

  it('far-off noodles and broth escalate to complain and scold', () => {
    const b = exact();
    b.noodleError = 2.5; // 3.75
    expect(react(b)).toBe('complain');
    b.broth = { fill: 1.2, grade: 'bad' }; // + 4
    expect(react(b)).toBe('scold');
  });

  it('allergy scolds even an easy customer', () => {
    const b = exact();
    b.toppings.liver = 1;
    expect(react(b, 'easy', order({ avoid: { item: 'liver', kind: 'allergy' } }))).toBe('scold');
  });

  it('pays by tier and temperament', () => {
    const { price, maxTip } = B.payment;
    const r = B.reactions;
    expect(payFor('happy', 'normal', 1, B)).toEqual({ price, tip: maxTip });
    expect(payFor('ok', 'normal', 1, B)).toEqual({ price, tip: Math.round(maxTip * r.okTipRatio) });
    expect(payFor('grumble', 'normal', 1, B)).toEqual({ price, tip: 0 });
    expect(payFor('complain', 'normal', 1, B)).toEqual({ price: Math.round(price * r.complainPriceRatio), tip: 0 });
    expect(payFor('scold', 'normal', 1, B)).toEqual({ price: Math.round(price * r.scoldPayRatio), tip: 0 });
    expect(payFor('scold', 'easy', 1, B)).toEqual({ price: Math.round(price * r.scoldPayRatio), tip: 0 });
    expect(payFor('scold', 'picky', 1, B)).toEqual({ price: 0, tip: 0 });
  });
});
