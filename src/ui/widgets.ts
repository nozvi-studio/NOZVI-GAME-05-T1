import type { Order } from '../core/types';
import { hudBottom } from './layout';
import type { LineProgress, OrderProgress } from './orderProgress';
import { avoidChip, brothWord, explicitOrder, lineText, spokenOrder } from './speech';
import { STR, clock, money } from './strings';


export interface ScreenPoint {
  x: number;
  y: number;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  parent?.appendChild(e);
  return e;
}

/** Revenue / target and day timer (GDD §4). */
export class Hud {
  private money: HTMLDivElement;
  private timer: HTMLDivElement;
  private last = '';

  constructor(root: HTMLElement) {
    const bar = el('div', 'htg-hud', root);
    this.money = el('div', 'htg-pill', bar);
    this.timer = el('div', 'htg-pill', bar);
  }

  /** `frozen`: the first customer is not timed (MEC-007 rule 2). */
  set(revenue: number, target: number, timeLeft: number, frozen = false, day = 1): void {
    const key = `${revenue}|${target}|${Math.ceil(timeLeft)}|${frozen}|${day}`;
    if (key === this.last) return;
    this.last = key;
    this.money.innerHTML = `${STR.day} ${day} · ${STR.revenue}: <b>${money(revenue)}</b> / ${STR.target}: ${money(target)}`;
    this.timer.textContent = frozen ? STR.notTimed : `${STR.timeLeft} ${clock(timeLeft)}`;
    this.timer.classList.toggle('low', !frozen && timeLeft <= 30);
  }
}

export interface BubbleData {
  id: number;
  at: ScreenPoint;
  order: Order;
  /** 0..1 */
  patience: number;
  hurried: boolean;
  /** What the current bowl already holds for this order (VIS-102). */
  progress: OrderProgress;
  /** MEC-008 rule 2a: "Hỏi lại" is unlocked (a quarter of the patience has passed). */
  canAsk: boolean;
}

interface Chip {
  root: HTMLSpanElement;
  count: HTMLSpanElement | null;
}

interface BubbleView {
  root: HTMLDivElement;
  bar: HTMLDivElement;
  toppingChips: Chip[];
  garnishChips: Chip[];
  brothChip: Chip | null;
  spoken: boolean;
  /** Rebuild the bubble when this changes (clarified, ask unlocked). */
  key: string;
}

/** MEC-006 rule 5: green when exact, never red; tutorial chips also show given/wanted. */
function showChip(chip: Chip | undefined | null, p: LineProgress): void {
  if (!chip) return;
  if (chip.count) chip.count.textContent = ` ${p.given}/${p.wanted}`;
  chip.root.classList.toggle('done', p.given === p.wanted);
}

/** One order bubble per waiting customer, above its table (icons + labels, not colour-only). */
export class OrderBubbles {
  private bubbles = new Map<number, BubbleView>();

  constructor(
    private root: HTMLElement,
    private onAsk: (customerId: number) => void,
    /** Screen area bubbles must keep clear of (the right-side guidance panel). */
    private avoid: () => DOMRect | null = () => null,
  ) {}

  update(list: BubbleData[]): void {
    const seen = new Set<number>();
    // Bubbles that would overlap (edge-pinned or near-edge ones) stack downward instead (MEC-009 rule 6).
    const placed: Array<{ l: number; r: number; t: number; b: number }> = [];
    const top = hudBottom() + 6;
    const keepOut = this.avoid();
    if (keepOut) placed.push({ l: keepOut.left - 4, r: keepOut.right + 4, t: keepOut.top - 4, b: keepOut.bottom + 4 });
    for (const b of list) {
      seen.add(b.id);
      let bubble = this.bubbles.get(b.id);
      const key = `${b.order.clarified}|${b.canAsk}`;
      if (bubble && bubble.key !== key) {
        bubble.root.remove();
        bubble = undefined;
      }
      if (!bubble) {
        bubble = this.create(b, key);
        this.bubbles.set(b.id, bubble);
      }
      // Keep bubbles on screen and below the HUD bar (short landscape phones).
      const halfW = bubble.root.offsetWidth / 2 + 6;
      let x = Math.min(window.innerWidth - halfW, Math.max(halfW, b.at.x));
      const w = bubble.root.offsetWidth;
      const h = bubble.root.offsetHeight;
      let y = Math.max(top + h, b.at.y);
      // Overlap: take the nearest sideways position that is free of every placed box; if none, stack below.
      const hits = (cx: number, cy: number) => placed.filter((p) => cx - w / 2 < p.r && cx + w / 2 > p.l && cy - h < p.b && cy > p.t);
      for (let tries = 0; tries < 8 && hits(x, y).length > 0; tries++) {
        const fits = (cx: number) => cx - w / 2 >= 4 && cx + w / 2 <= window.innerWidth - 4 && hits(cx, y).length === 0;
        const candidates = placed.flatMap((p) => [p.r + 4 + w / 2, p.l - 4 - w / 2]).filter(fits);
        if (candidates.length > 0) x = candidates.reduce((a, c) => (Math.abs(c - x) < Math.abs(a - x) ? c : a));
        else y = Math.max(...hits(x, y).map((p) => p.b)) + 6 + h;
      }
      placed.push({ l: x - w / 2, r: x + w / 2, t: y - h, b: y });
      bubble.root.style.left = `${x}px`;
      bubble.root.style.top = `${y}px`;
      // MEC-009 rule 6: a customer off-screen keeps the bubble pinned at the edge, pointing toward them.
      bubble.root.classList.toggle('edge-left', b.at.x < 0);
      bubble.root.classList.toggle('edge-right', b.at.x > window.innerWidth);
      const p = Math.max(0, Math.min(1, b.patience));
      bubble.bar.style.width = `${p * 100}%`;
      bubble.bar.style.backgroundColor = p > 0.5 ? '#3fbf5a' : p > 0.25 ? '#e8c547' : '#e04848';
      // Spoken orders show no progress: reading the sentence is the challenge (MEC-006 rule 5).
      if (!bubble.spoken) {
        b.progress.toppings.forEach((p, i) => showChip(bubble.toppingChips[i], p));
        b.progress.garnishes.forEach((p, i) => showChip(bubble.garnishChips[i], p));
        bubble.brothChip?.root.classList.toggle('done', b.progress.brothOk);
        bubble.root.classList.toggle('ready', b.progress.ready);
      }
    }
    for (const [id, bubble] of this.bubbles) {
      if (!seen.has(id)) {
        bubble.root.remove();
        this.bubbles.delete(id);
      }
    }
  }

  private create(b: BubbleData, key: string): BubbleView {
    const root = el('div', 'htg-bubble', this.root);
    const o = b.order;
    // MEC-008 rule 2: "Hỏi lại" turns an implied phrase into an explicit sentence, and an explicit sentence into chips.
    const spoken = o.style === 'implied' || (o.style === 'explicit' && !o.clarified);
    const view: BubbleView = { root, bar: root, toppingChips: [], garnishChips: [], brothChip: null, spoken, key };
    if (spoken) {
      root.classList.add('spoken');
      const text = o.clarified ? explicitOrder(o, b.id) : spokenOrder(o, b.id);
      el('div', 'say', root).textContent = `“${text}”`;
      if (b.canAsk) {
        const ask = el('button', 'htg-ask', root);
        ask.textContent = STR.askAgain;
        ask.addEventListener('pointerdown', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          this.onAsk(b.id);
        });
      }
    } else {
      const chip = (row: HTMLElement, cls: string, text: string, counted: boolean): Chip => {
        const c = el('span', cls, row);
        el('span', '', c).textContent = text;
        return { root: c, count: counted ? el('span', 'n', c) : null };
      };
      const t = b.order.tutorial;
      const tops = el('div', 'row', root);
      view.toppingChips = b.order.toppings.map((l) => chip(tops, 'htg-chip', lineText(l), t));
      const gars = el('div', 'row', root);
      view.garnishChips = b.order.garnishes.map((l) => chip(gars, 'htg-chip g', lineText(l), t));
      const extra = el('div', 'row', root);
      view.brothChip = chip(extra, 'htg-chip w', brothWord(b.order.broth), false);
      if (b.order.avoid) el('span', 'htg-chip no', extra).textContent = avoidChip(b.order.avoid);
    }
    if (b.hurried) el('span', 'tag', root).textContent = STR.hurried;
    const track = el('div', 'htg-patience', root);
    view.bar = el('div', '', track);
    return view;
  }
}

export interface GaugeData {
  at: ScreenPoint;
  label: string;
  /** All values are fractions 0..1 of the gauge height. */
  value: number;
  /** Coloured zones; null hides them (MEC-006 rule 6: broth after the tutorial). */
  perfect: [number, number] | null;
  good: [number, number] | null;
  /** Labelled tick marks, e.g. ít / vừa / nhiều nước. */
  ticks?: Array<{ at: number; label: string }>;
}

/** Vertical hold gauge with optional green (perfect) / yellow (good) zones and labelled ticks. */
export class HoldGauge {
  private root: HTMLDivElement;
  private good: HTMLDivElement;
  private perfect: HTMLDivElement;
  private needle: HTMLDivElement;
  private label: HTMLDivElement;
  private ticks: HTMLDivElement[] = [];

  constructor(parent: HTMLElement) {
    this.root = el('div', 'htg-gauge', parent);
    this.good = el('div', 'zone good', this.root);
    this.perfect = el('div', 'zone perfect', this.root);
    for (let i = 0; i < 3; i++) this.ticks.push(el('div', 'tick', this.root));
    this.needle = el('div', 'needle', this.root);
    this.label = el('div', 'htg-gauge-label', parent);
    this.hide();
  }

  show(g: GaugeData): void {
    const pct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;
    this.root.style.display = this.label.style.display = 'block';
    this.root.style.left = this.label.style.left = `${g.at.x}px`;
    this.root.style.top = this.label.style.top = `${g.at.y}px`;
    const zone = (e: HTMLDivElement, z: [number, number] | null) => {
      e.style.display = z ? 'block' : 'none';
      if (z) {
        e.style.bottom = pct(z[0]);
        e.style.height = pct(z[1] - z[0]);
      }
    };
    zone(this.good, g.good);
    zone(this.perfect, g.perfect);
    this.ticks.forEach((t, i) => {
      const tick = g.ticks?.[i];
      t.style.display = tick ? 'block' : 'none';
      if (tick) {
        t.style.bottom = pct(tick.at);
        t.textContent = tick.label;
      }
    });
    this.needle.style.bottom = pct(g.value);
    this.label.textContent = g.label;
  }

  hide(): void {
    this.root.style.display = this.label.style.display = 'none';
  }
}
