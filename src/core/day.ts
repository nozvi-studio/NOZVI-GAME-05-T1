import { type Balance, defaultBalance } from './balance';
import { deviation, emptyBowl } from './bowl';
import { IMPLIED_RECIPES, REGULAR_BOWL, type ImpliedRecipe } from './implied';
import { decideReaction, isPerfect, payFor, qualityOf } from './reaction';
import { KitchenState } from './kitchen';
import { Rng } from './rng';
import {
  GARNISHES,
  INGREDIENTS,
  TOPPINGS,
  type Customer,
  type CustomerKind,
  type DaySummary,
  type GameEvent,
  type Garnish,
  type Grade,
  type HintTarget,
  type Kitchen,
  type Ingredient,
  type Order,
  type OrderLine,
  type Temper,
  type Payment,
  type Topping,
} from './types';

export interface DaySimOptions {
  seed?: number;
  balance?: Balance;
  /** 1 for the first day of a session; later days skip the tutorial (MEC-007 rules 8-9). */
  day?: number;
  /** Tables open today (MEC-009 rule 1); defaults to `day.tables`, capped at `day.maxTables`. */
  tables?: number;
}

const TEMPERS: readonly Temper[] = ['easy', 'normal', 'picky'];

const fromRecipe = (r: ImpliedRecipe): Pick<Order, 'toppings' | 'garnishes' | 'broth'> => ({
  toppings: r.toppings.map((l) => ({ ...l })),
  garnishes: r.garnishes.map((l) => ({ ...l })),
  broth: r.broth,
});

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
  private tutorialReleased = false;

  /** Day number in this session (1 = first day, with the tutorial). */
  readonly dayNumber: number;
  /** Tables open today (MEC-009). */
  readonly tableCount: number;

  constructor(opts: DaySimOptions = {}) {
    this.balance = opts.balance ?? defaultBalance;
    this.dayNumber = Math.max(1, opts.day ?? 1);
    this.tableCount = Math.min(this.balance.day.maxTables, Math.max(1, opts.tables ?? this.balance.day.tables));
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

  /**
   * MEC-007 rule 2: from the first spawn until `releaseTutorial()` (the player presses "Để tôi thử" after the
   * first customer leaves), the day clock, spawning and patience stand still; cooking holds still run.
   */
  get frozen(): boolean {
    if (!this.balance.day.freezeUntilFirstServed || this.dayNumber > 1 || this.tutorialReleased) return false;
    return this.spawned >= 1;
  }

  /** MEC-007 rule 2: the player pressed "Để tôi thử" after the first customer left; the day starts. */
  releaseTutorial(): void {
    this.tutorialReleased = true;
  }

  /** The first (tutorial) customer is still at the stall: arriving, waiting, eating or leaving. */
  get firstCustomerPresent(): boolean {
    return this.list.some((c) => c.id === 1);
  }

  update(dt: number): GameEvent[] {
    if (!this.isEnded && dt > 0) {
      const day = this.balance.day.lengthSeconds;
      const frozen = this.frozen;
      const step = frozen ? dt : Math.min(dt, day - this.clock);
      if (!frozen) this.clock += step;
      this.kitchenState.update(step);
      this.updateCustomers(step, frozen);
      if (!frozen) this.updateSpawning(step);
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

  // MEC-004 / MEC-006: serve the current bowl to the customer at `table`; the reaction decides the payment.
  serve(table: number): Payment | null {
    if (this.isEnded) return null;
    const bowl = this.kitchen.bowl;
    const customer = this.list.find((c) => c.table === table && c.state === 'waiting');
    if (!customer || bowl.noodles === null || this.kitchen.pouring !== null) return null;

    const b = this.balance;
    const dev = deviation(bowl, customer.order, b);
    const reaction = decideReaction(dev, customer.temper, b);
    const { price, tip } = payFor(reaction, customer.temper, customer.patience / customer.maxPatience, b);
    const payment: Payment = {
      price,
      tip,
      total: price + tip,
      quality: qualityOf(dev, b),
      perfect: isPerfect(reaction, dev, b),
      reaction,
      deviation: dev.d,
      cause: dev.cause,
    };
    this.money += payment.total;
    if (reaction === 'scold') {
      // MEC-006 rule 12: walks off angry, counted as lost.
      this.setState(customer, 'leaving');
      customer.outcome = 'angry';
      this.stats.lost += 1;
    } else {
      this.setState(customer, 'eating');
      customer.outcome = 'served';
      this.stats.served += 1;
      if (payment.perfect) this.stats.perfect += 1;
    }
    this.kitchen.bowl = emptyBowl();
    this.pending.push({ type: 'customerServed', customer, payment });
    return payment;
  }

  /**
   * MEC-008 rule 2: "Hỏi lại" on a spoken order, once a quarter of the patience has passed. Costs
   * `hints.askPatienceSeconds` (not below `hints.minPatienceSeconds`), once per customer; grading is unchanged.
   */
  askAgain(customerId: number): boolean {
    const c = this.list.find((x) => x.id === customerId);
    if (this.isEnded || !c || c.state !== 'waiting' || c.order.style === 'chips' || c.order.clarified || c.order.tutorial) return false;
    const h = this.balance.hints;
    if (!this.canAskAgain(c)) return false;
    c.patience = Math.max(Math.min(c.patience, h.minPatienceSeconds), c.patience - h.askPatienceSeconds);
    c.order.clarified = true;
    return true;
  }

  /** MEC-008 rule 2a: "Hỏi lại" only unlocks after `hints.askAfterShare` (1/4) of the customer's patience has passed. */
  canAskAgain(c: Customer): boolean {
    return (
      c.state === 'waiting' &&
      c.order.style !== 'chips' &&
      !c.order.clarified &&
      !c.order.tutorial &&
      c.patience <= c.maxPatience * (1 - this.balance.hints.askAfterShare) + 1e-9
    );
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
    if (order && order.toppings.some((l) => k.bowl.toppings[l.item] < l.portions)) return 'toppings';
    if (k.bowl.broth === null) return 'pot';
    if (order && order.garnishes.some((l) => k.bowl.garnishes[l.item] < l.portions)) return 'garnishes';
    return 'table';
  }

  private setState(c: Customer, state: Customer['state']): void {
    c.state = state;
    c.stateTime = 0;
  }

  private updateCustomers(dt: number, frozen = false): void {
    const cfg = this.balance.customers;
    for (const c of [...this.list]) {
      c.stateTime += dt;
      if (c.state === 'arriving' && c.stateTime >= cfg.arriveSeconds) {
        this.setState(c, 'waiting');
        this.pending.push({ type: 'customerSeated', customer: c });
      } else if (c.state === 'waiting') {
        if (!frozen) c.patience = Math.max(0, c.patience - dt);
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
    this.spawnTimer = this.spawnInterval();
  }

  /** MEC-006 rule 15: start → mid at half the day → end, linear in between. */
  private spawnInterval(): number {
    const c = this.balance.customers;
    const p = this.clock / this.balance.day.lengthSeconds;
    if (p <= 0.5) return c.spawnIntervalStartSeconds + (c.spawnIntervalMidSeconds - c.spawnIntervalStartSeconds) * (p / 0.5);
    return c.spawnIntervalMidSeconds + (c.spawnIntervalEndSeconds - c.spawnIntervalMidSeconds) * ((p - 0.5) / 0.5);
  }

  private freeTables(): number[] {
    const taken = new Set(this.list.map((c) => c.table));
    const free: number[] = [];
    for (let i = 0; i < this.tableCount; i++) if (!taken.has(i)) free.push(i);
    return free;
  }

  private spawn(table: number): void {
    const cfg = this.balance.customers;
    const first = this.spawned === 0;
    const kind: CustomerKind =
      !first && this.clock >= cfg.hurriedFromSeconds && this.rng.next() < cfg.hurriedChance ? 'hurried' : 'regular';
    // MEC-006: the tutorial's first customer is always easy-going; others draw a hidden temperament.
    const tw = this.balance.temper.weights;
    const temper: Temper = first && this.dayNumber === 1 ? 'easy' : TEMPERS[this.weighted([tw.easy, tw.normal, tw.picky])];
    const patience = cfg.patienceSeconds[kind];
    const customer: Customer = {
      id: this.nextId++,
      table,
      kind,
      temper,
      state: 'arriving',
      order: this.makeOrder(this.spawned),
      patience,
      maxPatience: patience,
      stateTime: 0,
      outcome: null,
    };
    this.spawned += 1;
    this.list.push(customer);
    this.pending.push({ type: 'customerArrived', customer });
  }

  // MEC-006 rules 1-4 (replaces MEC-003 rule 5 and MEC-005 rules 3-5).
  private makeOrder(index: number): Order {
    const o = this.balance.orders;
    const later = this.dayNumber > 1;
    const tutorial = !later && index < o.tutorialCustomers;
    if (!later && index === 0) return { ...fromRecipe(REGULAR_BOWL), avoid: null, style: 'chips', implied: null, tutorial, clarified: false };

    let spoken: boolean;
    let p: number;
    if (later) {
      // MEC-007 rule 9: a short chip warm-up, then (almost) everyone speaks; the implied share still ramps over the day.
      p = Math.min(1, this.clock / this.balance.day.lengthSeconds);
      spoken = index >= o.laterDays.warmupCustomers && this.rng.next() < o.laterDays.spokenChance;
    } else {
      p = Math.min(1, Math.max(0, (this.clock - o.spokenFromSeconds) / (this.balance.day.lengthSeconds - o.spokenFromSeconds)));
      spoken = !tutorial && this.clock >= o.spokenFromSeconds && this.rng.next() < o.spokenChanceStart + (o.spokenChanceEnd - o.spokenChanceStart) * p;
    }
    const implied = spoken && this.rng.next() < o.impliedShareStart + (o.impliedShareEnd - o.impliedShareStart) * p;

    let base: Pick<Order, 'toppings' | 'garnishes' | 'broth'>;
    let recipe: ImpliedRecipe | null = null;
    if (implied) {
      recipe = this.rng.pick(IMPLIED_RECIPES);
      base = fromRecipe(recipe);
    } else base = this.randomLines();

    const used = new Set<Ingredient>([...base.toppings, ...base.garnishes].map((l) => l.item));
    const free = INGREDIENTS.filter((i) => !used.has(i));
    let avoid: Order['avoid'] = null;
    if (free.length > 0 && this.rng.next() < o.avoidChance) {
      const item = this.rng.pick(free);
      avoid = { item, kind: this.weighted([o.avoidKindWeights.dislike, o.avoidKindWeights.allergy]) === 0 ? 'dislike' : 'allergy' };
    }
    return { ...base, avoid, style: implied ? 'implied' : spoken ? 'explicit' : 'chips', implied: recipe?.id ?? null, tutorial, clarified: false };
  }

  private randomLines(): Pick<Order, 'toppings' | 'garnishes' | 'broth'> {
    const cfg = this.balance.customers;
    const bracket = [...cfg.toppingsPerOrder].reverse().find((b) => b.fromSeconds <= this.clock) ?? cfg.toppingsPerOrder[0];
    const toppingCount = this.rng.int(bracket.min, Math.min(bracket.max, TOPPINGS.length));
    const garnishCount = this.rng.int(cfg.garnishesPerOrder.min, Math.min(cfg.garnishesPerOrder.max, GARNISHES.length));
    const toppings = this.rng.sample(TOPPINGS, toppingCount).map((item) => this.line(item));
    const garnishes = this.rng.sample(GARNISHES, garnishCount).map((item) => this.line(item));
    return { toppings, garnishes, broth: this.weighted(this.balance.orders.brothWeights) + 1 };
  }

  /** Amount for one ordered ingredient: ít 1 / vừa 2 / nhiều 3, drawn with `amounts.portionWeights`. */
  private line<T extends Ingredient>(item: T): OrderLine<T> {
    return { item, portions: this.weighted(this.balance.amounts.portionWeights) + 1 };
  }

  /** Index drawn with the given weights. */
  private weighted(weights: readonly number[]): number {
    let roll = this.rng.next() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll < 0) return i;
    }
    return weights.length - 1;
  }

  private endDay(): void {
    this.isEnded = true;
    this.kitchenState.state.blanching = null;
    this.kitchenState.state.pouring = null;
    this.pending.push({ type: 'dayEnded', summary: this.summary() });
  }
}
