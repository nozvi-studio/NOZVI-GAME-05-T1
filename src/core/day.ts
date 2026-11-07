import { type Balance, defaultBalance } from './balance';
import { bowlQuality, emptyBowl } from './bowl';
import { KitchenState } from './kitchen';
import { Rng } from './rng';
import {
  GARNISHES,
  TOPPINGS,
  type Customer,
  type CustomerKind,
  type DaySummary,
  type GameEvent,
  type Garnish,
  type Grade,
  type HintTarget,
  type Kitchen,
  type Order,
  type Payment,
  type Topping,
} from './types';

export interface DaySimOptions {
  seed?: number;
  balance?: Balance;
}

const FIRST_ORDER: Order = { toppings: ['pork'], garnishes: ['scallion'] };

// MEC-003 / MEC-004: one selling day — customers, patience, serving, revenue.
export class DaySim {
  readonly balance: Balance;
  private readonly rng: Rng;
  private readonly kitchenState: KitchenState;
  private readonly list: Customer[] = [];
  private pending: GameEvent[] = [];
  private clock = 0;
  private money = 0;
  private nextId = 1;
  private spawnTimer: number;
  private spawned = 0;
  private stats = { served: 0, perfect: 0, lost: 0 };
  private isEnded = false;

  constructor(opts: DaySimOptions = {}) {
    this.balance = opts.balance ?? defaultBalance;
    this.rng = new Rng(opts.seed ?? Date.now());
    this.kitchenState = new KitchenState(this.balance);
    this.spawnTimer = this.balance.customers.firstSpawnSeconds;
  }

  get kitchen(): Kitchen {
    return this.kitchenState.state;
  }
  get customers(): readonly Customer[] {
    return this.list;
  }
  get time(): number {
    return this.clock;
  }
  get revenue(): number {
    return this.money;
  }
  get ended(): boolean {
    return this.isEnded;
  }

  update(dt: number): GameEvent[] {
    if (!this.isEnded && dt > 0) {
      const day = this.balance.day.lengthSeconds;
      const step = Math.min(dt, day - this.clock);
      this.clock += step;
      this.kitchenState.update(step);
      this.updateCustomers(step);
      this.updateSpawning(step);
      if (this.clock >= day) this.endDay();
    }
    const events = this.pending;
    this.pending = [];
    return events;
  }

  startBlanch(): boolean {
    return !this.isEnded && this.kitchenState.startBlanch();
  }
  releaseBlanch(): Grade | null {
    return this.kitchenState.releaseBlanch();
  }
  moveNoodlesToBowl(): boolean {
    return !this.isEnded && this.kitchenState.moveNoodlesToBowl();
  }
  addTopping(t: Topping): boolean {
    return !this.isEnded && this.kitchenState.addTopping(t);
  }
  addGarnish(g: Garnish): boolean {
    return !this.isEnded && this.kitchenState.addGarnish(g);
  }
  startPour(): boolean {
    return !this.isEnded && this.kitchenState.startPour();
  }
  releasePour(): Grade | null {
    return this.kitchenState.releasePour();
  }
  discardBowl(): void {
    this.kitchenState.discardBowl();
  }

  // MEC-004: serve the current bowl to the customer at `table`.
  serve(table: number): Payment | null {
    if (this.isEnded) return null;
    const bowl = this.kitchen.bowl;
    const customer = this.list.find((c) => c.table === table && c.state === 'waiting');
    if (!customer || bowl.noodles === null || this.kitchen.pouring !== null) return null;

    const quality = bowlQuality(bowl, customer.order, this.balance.quality);
    const { price, maxTip } = this.balance.payment;
    const tip = Math.round(maxTip * quality * (customer.patience / customer.maxPatience));
    const payment: Payment = {
      price,
      tip,
      total: price + tip,
      quality,
      perfect: quality >= this.balance.quality.perfectBowlThreshold,
    };
    this.money += payment.total;
    this.stats.served += 1;
    if (payment.perfect) this.stats.perfect += 1;
    this.setState(customer, 'eating');
    customer.outcome = 'served';
    this.kitchen.bowl = emptyBowl();
    this.pending.push({ type: 'customerServed', customer, payment });
    return payment;
  }

  summary(): DaySummary {
    const target = this.balance.day.revenueTarget;
    return { revenue: this.money, target, won: this.money >= target, ...this.stats };
  }

  // GDD §3b: what the player should touch next.
  nextHint(): HintTarget {
    const k = this.kitchen;
    if (k.bowl.noodles === null) return k.basket === null ? 'basket' : 'bowl';
    const order = this.list.find((c) => c.state === 'waiting')?.order;
    if (order && order.toppings.some((t) => !k.bowl.toppings.includes(t))) return 'toppings';
    if (k.bowl.broth === null) return 'pot';
    if (order && order.garnishes.some((g) => !k.bowl.garnishes.includes(g))) return 'garnishes';
    return 'table';
  }

  private setState(c: Customer, state: Customer['state']): void {
    c.state = state;
    c.stateTime = 0;
  }

  private updateCustomers(dt: number): void {
    const cfg = this.balance.customers;
    for (const c of [...this.list]) {
      c.stateTime += dt;
      if (c.state === 'arriving' && c.stateTime >= cfg.arriveSeconds) {
        this.setState(c, 'waiting');
        this.pending.push({ type: 'customerSeated', customer: c });
      } else if (c.state === 'waiting') {
        c.patience = Math.max(0, c.patience - dt);
        if (c.patience <= 0) {
          this.setState(c, 'leaving');
          c.outcome = 'angry';
          this.stats.lost += 1;
          this.pending.push({ type: 'customerGaveUp', customer: c });
        }
      } else if (c.state === 'eating' && c.stateTime >= cfg.eatSeconds) {
        this.setState(c, 'leaving');
      } else if (c.state === 'leaving' && c.stateTime >= cfg.leaveSeconds) {
        this.list.splice(this.list.indexOf(c), 1);
        this.pending.push({ type: 'customerRemoved', customerId: c.id, table: c.table });
      }
    }
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const free = this.freeTables();
    if (free.length === 0) return; // wait until a table frees up (MEC-003 rule 3)
    this.spawn(this.spawned === 0 ? free[0] : this.rng.pick(free));
    const cfg = this.balance.customers;
    const progress = this.clock / this.balance.day.lengthSeconds;
    this.spawnTimer =
      cfg.spawnIntervalStartSeconds + (cfg.spawnIntervalEndSeconds - cfg.spawnIntervalStartSeconds) * progress;
  }

  private freeTables(): number[] {
    const taken = new Set(this.list.map((c) => c.table));
    const free: number[] = [];
    for (let i = 0; i < this.balance.day.tables; i++) if (!taken.has(i)) free.push(i);
    return free;
  }

  private spawn(table: number): void {
    const cfg = this.balance.customers;
    const first = this.spawned === 0;
    const kind: CustomerKind =
      !first && this.clock >= cfg.hurriedFromSeconds && this.rng.next() < cfg.hurriedChance ? 'hurried' : 'regular';
    const patience = cfg.patienceSeconds[kind];
    const customer: Customer = {
      id: this.nextId++,
      table,
      kind,
      state: 'arriving',
      order: first ? structuredClone(FIRST_ORDER) : this.randomOrder(),
      patience,
      maxPatience: patience,
      stateTime: 0,
      outcome: null,
    };
    this.spawned += 1;
    this.list.push(customer);
    this.pending.push({ type: 'customerArrived', customer });
  }

  // MEC-003 rule 5.
  private randomOrder(): Order {
    const cfg = this.balance.customers;
    const bracket = [...cfg.toppingsPerOrder].reverse().find((b) => b.fromSeconds <= this.clock) ?? cfg.toppingsPerOrder[0];
    const toppingCount = this.rng.int(bracket.min, Math.min(bracket.max, TOPPINGS.length));
    const garnishCount = this.rng.int(cfg.garnishesPerOrder.min, Math.min(cfg.garnishesPerOrder.max, GARNISHES.length));
    return { toppings: this.rng.sample(TOPPINGS, toppingCount), garnishes: this.rng.sample(GARNISHES, garnishCount) };
  }

  private endDay(): void {
    this.isEnded = true;
    this.kitchenState.state.blanching = null;
    this.kitchenState.state.pouring = null;
    this.pending.push({ type: 'dayEnded', summary: this.summary() });
  }
}
