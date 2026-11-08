import { describe, expect, it } from 'vitest';
import { DaySim, defaultBalance, type GameEvent } from '../src/core';

const cfg = defaultBalance.customers;

function run(sim: DaySim, seconds: number, step = 0.1): GameEvent[] {
  const events: GameEvent[] = [];
  for (let t = 0; t < seconds - 1e-9; t += step) events.push(...sim.update(Math.min(step, seconds - t)));
  return events;
}

/** Cooks the first customer's order exactly; `blanchSeconds` lets a test overcook the noodles. */
function cookPerfect(sim: DaySim, blanchSeconds = defaultBalance.blanch.idealSeconds): void {
  const { toppings, garnishes } = sim.customers[0].order;
  sim.startBlanch();
  run(sim, blanchSeconds);
  sim.releaseBlanch();
  sim.moveNoodlesToBowl();
  for (const l of toppings) for (let i = 0; i < l.portions; i++) sim.addTopping(l.item);
  sim.startPour();
  run(sim, defaultBalance.broth.targetFill / defaultBalance.broth.fillPerSecond);
  sim.releasePour();
  for (const l of garnishes) for (let i = 0; i < l.portions; i++) sim.addGarnish(l.item);
}

const seated = () => {
  const sim = new DaySim({ seed: 1 });
  run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
  return sim;
};

describe('MEC-003 customers & day', () => {
  it('first customer waits with the fixed FTUE order', () => {
    const sim = new DaySim({ seed: 1 });
    const events = run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    expect(events.map((e) => e.type)).toEqual(['customerArrived', 'customerSeated']);
    expect(sim.customers[0].state).toBe('waiting');
    expect(sim.customers[0].order).toEqual({
      toppings: [{ item: 'pork', portions: 2 }],
      garnishes: [{ item: 'scallion', portions: 2 }],
      exclude: null,
      spoken: false,
    });
  });

  it('a regular customer gives up after their patience runs out', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    const first = sim.customers[0];
    const events = run(sim, cfg.patienceSeconds.regular + 0.2);
    expect(events.some((e) => e.type === 'customerGaveUp' && e.customer.id === first.id)).toBe(true);
    expect(sim.summary().lost).toBe(1);
  });

  it('never seats more customers than tables', () => {
    const sim = new DaySim({ seed: 7 });
    for (let i = 0; i < 1000; i++) {
      sim.update(0.1);
      const tables = sim.customers.map((c) => c.table);
      expect(new Set(tables).size).toBe(tables.length);
      expect(tables.length).toBeLessThanOrEqual(defaultBalance.day.tables);
    }
  });

  it('is deterministic for the same seed', () => {
    const orders = (seed: number) => {
      const sim = new DaySim({ seed });
      return run(sim, 120)
        .filter((e) => e.type === 'customerArrived')
        .map((e) => (e.type === 'customerArrived' ? [e.customer.table, e.customer.kind, e.customer.order] : null));
    };
    expect(orders(42)).toEqual(orders(42));
  });

  it('ends the day once with a summary and then freezes', () => {
    const sim = new DaySim({ seed: 3 });
    const events = run(sim, defaultBalance.day.lengthSeconds + 5);
    expect(events.filter((e) => e.type === 'dayEnded')).toHaveLength(1);
    expect(sim.ended).toBe(true);
    expect(sim.time).toBe(defaultBalance.day.lengthSeconds);
    expect(sim.startBlanch()).toBe(false);
    expect(sim.summary().won).toBe(false);
  });
});

describe('MEC-004 serve & payment', () => {
  it('a quick perfect bowl pays close to price + maxTip', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    const table = sim.customers[0].table;
    cookPerfect(sim);
    const payment = sim.serve(table);
    expect(payment?.quality).toBe(1);
    expect(payment?.perfect).toBe(true);
    expect(payment?.reaction).toBe('happy');
    expect(payment!.total).toBeGreaterThan(defaultBalance.payment.price);
    expect(payment!.total).toBeLessThanOrEqual(defaultBalance.payment.price + defaultBalance.payment.maxTip);
    expect(sim.revenue).toBe(payment!.total);
    expect(sim.customers[0].state).toBe('eating');
    expect(sim.kitchen.bowl.noodles).toBeNull();
  });

  it('tip is exactly maxTip when served with full patience', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    const c = sim.customers[0];
    cookPerfect(sim);
    c.patience = c.maxPatience;
    expect(sim.serve(c.table)?.total).toBe(defaultBalance.payment.price + defaultBalance.payment.maxTip);
  });

  it('rejects serving an empty table or an empty bowl', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    const table = sim.customers[0].table;
    expect(sim.serve(table)).toBeNull();
    cookPerfect(sim);
    const empty = [0, 1, 2].find((t) => t !== table)!;
    expect(sim.serve(empty)).toBeNull();
    expect(sim.kitchen.bowl.noodles).not.toBeNull();
  });

  it('customer leaves after eating and frees the table', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    const c = sim.customers[0];
    cookPerfect(sim);
    sim.serve(c.table);
    const events = run(sim, cfg.eatSeconds + cfg.leaveSeconds + 0.2);
    expect(events.some((e) => e.type === 'customerRemoved' && e.customerId === c.id)).toBe(true);
    expect(sim.summary().served).toBe(1);
  });

  it('nextHint walks the FTUE sequence', () => {
    const sim = new DaySim({ seed: 1 });
    run(sim, cfg.firstSpawnSeconds + cfg.arriveSeconds + 0.3);
    expect(sim.nextHint()).toBe('basket');
    sim.startBlanch();
    run(sim, 3);
    sim.releaseBlanch();
    expect(sim.nextHint()).toBe('bowl');
    sim.moveNoodlesToBowl();
    expect(sim.nextHint()).toBe('toppings');
    sim.addTopping('pork');
    expect(sim.nextHint()).toBe('toppings'); // vừa = 2 portions (MEC-005 rule 6)
    sim.addTopping('pork');
    expect(sim.nextHint()).toBe('pot');
    sim.startPour();
    run(sim, 1.6);
    sim.releasePour();
    expect(sim.nextHint()).toBe('garnishes');
    sim.addGarnish('scallion');
    expect(sim.nextHint()).toBe('garnishes');
    sim.addGarnish('scallion');
    expect(sim.nextHint()).toBe('table');
  });
});

describe('MEC-005 orders and reactions in the day', () => {
  it('scold: an excluded ingredient means no payment, an angry exit and a lost customer', () => {
    const sim = seated();
    const c = sim.customers[0];
    c.order.exclude = 'pepper';
    cookPerfect(sim);
    sim.addGarnish('pepper');
    const p = sim.serve(c.table);
    expect(p?.reaction).toBe('scold');
    expect(p?.total).toBe(0);
    expect(sim.revenue).toBe(0);
    expect(c.state).toBe('leaving');
    expect(c.outcome).toBe('angry');
    expect(sim.summary()).toMatchObject({ lost: 1, served: 0 });
    expect(sim.kitchen.bowl.noodles).toBeNull();
  });

  it('complain: overcooked noodles pay half price and no tip', () => {
    const sim = seated();
    const c = sim.customers[0];
    cookPerfect(sim, defaultBalance.blanch.maxHoldSeconds - 0.5);
    expect(sim.kitchen.bowl.noodles).toBe('bad');
    const p = sim.serve(c.table);
    expect(p?.reaction).toBe('complain');
    expect(p?.total).toBe(Math.round(defaultBalance.payment.price * defaultBalance.reactions.complainPriceRatio));
    expect(c.state).toBe('eating');
    expect(sim.summary().served).toBe(1);
  });

  it('generates amounts, exclusions and spoken orders by the rules', () => {
    const o = defaultBalance.orders;
    let late = 0;
    let spoken = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const sim = new DaySim({ seed });
      for (const e of run(sim, defaultBalance.day.lengthSeconds, 0.25)) {
        if (e.type !== 'customerArrived') continue;
        const { order } = e.customer;
        for (const l of [...order.toppings, ...order.garnishes]) expect([1, 2, 3]).toContain(l.portions);
        const items: string[] = [...order.toppings, ...order.garnishes].map((l) => l.item);
        if (order.exclude) expect(items).not.toContain(order.exclude);
        if (sim.time < o.spokenFromSeconds) expect(order.spoken).toBe(false);
        else {
          late += 1;
          if (order.spoken) spoken += 1;
        }
      }
    }
    expect(spoken / late).toBeGreaterThan(o.spokenChance - 0.15);
    expect(spoken / late).toBeLessThan(o.spokenChance + 0.15);
  });
});
