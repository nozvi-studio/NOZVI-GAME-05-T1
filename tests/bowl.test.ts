import { describe, expect, it } from 'vitest';
import { bowlQuality, defaultBalance, gradeBroth, setScore } from '../src/core';
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

  it('rejects toppings, garnish and broth before noodles; ignores duplicates', () => {
    const k = new KitchenState(defaultBalance);
    expect(k.addTopping('pork')).toBe(false);
    expect(k.addGarnish('scallion')).toBe(false);
    expect(k.startPour()).toBe(false);
    k.startBlanch();
    k.releaseBlanch();
    k.moveNoodlesToBowl();
    expect(k.addTopping('pork')).toBe(true);
    expect(k.addTopping('pork')).toBe(false);
    expect(k.state.bowl.toppings).toEqual(['pork']);
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

  it('scores sets with missing and extra items', () => {
    expect(setScore(['pork', 'shrimp'], ['pork'], 0.34)).toBeCloseTo(0.66);
    expect(setScore(['pork'], ['pork', 'liver'], 0.34)).toBeCloseTo(0.66);
    expect(setScore(['pork'], ['shrimp', 'liver', 'quailEgg'], 0.34)).toBe(0);
  });

  it('quality is 1 for a perfect matching bowl', () => {
    const order = { toppings: ['pork' as const], garnishes: ['scallion' as const] };
    const bowl = { noodles: 'perfect' as const, toppings: ['pork' as const], broth: { fill: 0.8, grade: 'perfect' as const }, garnishes: ['scallion' as const] };
    expect(bowlQuality(bowl, order, q)).toBe(1);
    expect(bowlQuality({ ...bowl, broth: null }, order, q)).toBeCloseTo(0.8);
  });
});
