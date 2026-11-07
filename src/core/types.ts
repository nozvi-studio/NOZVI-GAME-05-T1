// Public contract of the pure gameplay core (no Three.js / DOM imports).
// See docs/ARCHITECTURE.md. Requirement IDs: MEC-001..MEC-004, GDD §2, §4, §5.

export type Grade = 'perfect' | 'good' | 'bad';

export const TOPPINGS = ['pork', 'shrimp', 'liver', 'quailEgg'] as const;
export type Topping = (typeof TOPPINGS)[number];

export const GARNISHES = ['scallion', 'pepper', 'sprouts'] as const;
export type Garnish = (typeof GARNISHES)[number];

export interface Order {
  toppings: Topping[];
  garnishes: Garnish[];
}

export type CustomerKind = 'regular' | 'hurried';
/** arriving → waiting → (eating | leaving-angry) → leaving → removed */
export type CustomerState = 'arriving' | 'waiting' | 'eating' | 'leaving';

export interface Customer {
  id: number;
  table: number;
  kind: CustomerKind;
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
  toppings: Topping[];
  broth: { fill: number; grade: Grade } | null;
  garnishes: Garnish[];
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
  price: number;
  tip: number;
  total: number;
  /** 0..1 */
  quality: number;
  perfect: boolean;
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
