// Public contract of the pure gameplay core (no Three.js / DOM imports).
// See docs/ARCHITECTURE.md. Requirement IDs: MEC-001..MEC-004, GDD §2, §4, §5.

export type Grade = 'perfect' | 'good' | 'bad';

export const TOPPINGS = ['pork', 'shrimp', 'liver', 'quailEgg'] as const;
export type Topping = (typeof TOPPINGS)[number];

export const GARNISHES = ['scallion', 'pepper', 'sprouts'] as const;
export type Garnish = (typeof GARNISHES)[number];

export type Ingredient = Topping | Garnish;
export const INGREDIENTS: readonly Ingredient[] = [...TOPPINGS, ...GARNISHES];

/** MEC-005: portions asked for one ingredient (ít 1, vừa 2, nhiều 3). */
export interface OrderLine<T extends Ingredient> {
  item: T;
  portions: number;
}

/** MEC-006 rule 3: an ingredient the customer does not want. Allergy is never forgiven. */
export type AvoidKind = 'dislike' | 'allergy';
export interface Avoid {
  item: Ingredient;
  kind: AvoidKind;
}

/** MEC-006: how the order is shown. Implied orders are a fixed phrase standing for a known recipe. */
export type OrderStyle = 'chips' | 'explicit' | 'implied';

export interface Order {
  toppings: OrderLine<Topping>[];
  garnishes: OrderLine<Garnish>[];
  /** Broth level: 1 ít nước, 2 vừa nước, 3 nhiều nước (MEC-006). */
  broth: number;
  avoid: Avoid | null;
  style: OrderStyle;
  /** Implied recipe id when `style` is 'implied' (see `implied.ts`). */
  implied: string | null;
  /** Tutorial customers see portion counts and the broth zone (MEC-006 rules 5-6). */
  tutorial: boolean;
  /** The player used "Hỏi lại": the order is shown explicitly (MEC-008 rule 2). */
  clarified: boolean;
}

export type CustomerKind = 'regular' | 'hurried';
/** Hidden temperament (MEC-006 rule 9). */
export type Temper = 'easy' | 'normal' | 'picky';
/** arriving → waiting → (eating | leaving-angry) → leaving → removed */
export type CustomerState = 'arriving' | 'waiting' | 'eating' | 'leaving';

export interface Customer {
  id: number;
  table: number;
  kind: CustomerKind;
  temper: Temper;
  state: CustomerState;
  order: Order;
  /** Seconds of patience left while waiting. */
  patience: number;
  maxPatience: number;
  /** Seconds spent in the current state. */
  stateTime: number;
  /** Set when the customer is leaving: served or gave up. */
  outcome: 'served' | 'angry' | null;
}

export interface Bowl {
  noodles: Grade | null;
  /** Blanch hold time minus the ideal, in seconds (+ overcooked, − undercooked). */
  noodleError: number | null;
  /** Portions per topping (MEC-005 rule 1). */
  toppings: Record<Topping, number>;
  broth: { fill: number; grade: Grade } | null;
  /** Portions per garnish. */
  garnishes: Record<Garnish, number>;
}

/** MEC-006 rule 8: reaction tiers, mildest first. */
export type Reaction = 'happy' | 'ok' | 'grumble' | 'complain' | 'scold';

/** The biggest reason for the deviation, so the customer can name it (MEC-006 rule 13). */
export interface Cause {
  kind: 'allergy' | 'dislike' | 'noodles' | 'broth' | 'missing' | 'extra' | 'amount';
  item?: Ingredient;
  /** +1 too much / overcooked, −1 too little / undercooked. */
  sign?: number;
}

export interface Kitchen {
  /** Graded noodles sitting in the basket, waiting to go into the bowl. */
  basket: Grade | null;
  /** Seconds the blanch has been held, or null when not blanching. */
  blanching: number | null;
  /** Current broth fill (0..maxFill) while pouring, or null. */
  pouring: number | null;
  bowl: Bowl;
}

export interface Payment {
  /** Price actually paid (part of the price on complain / scold). */
  price: number;
  tip: number;
  total: number;
  /** 0..1, derived from the deviation (1 = exact). */
  quality: number;
  perfect: boolean;
  reaction: Reaction;
  /** MEC-006 deviation D (0 = exact). */
  deviation: number;
  cause: Cause | null;
}

export interface DaySummary {
  revenue: number;
  target: number;
  won: boolean;
  served: number;
  perfect: number;
  lost: number;
}

/** What the FTUE hint should point at next. */
export type HintTarget = 'basket' | 'bowl' | 'toppings' | 'pot' | 'garnishes' | 'table' | null;

export type GameEvent =
  | { type: 'customerArrived'; customer: Customer }
  | { type: 'customerSeated'; customer: Customer }
  | { type: 'customerServed'; customer: Customer; payment: Payment }
  | { type: 'customerGaveUp'; customer: Customer }
  | { type: 'customerRemoved'; customerId: number; table: number }
  | { type: 'dayEnded'; summary: DaySummary };
