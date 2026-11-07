import type { Order } from '../core/types';
import type { OrderProgress } from './orderProgress';
import { GARNISH_ICON, GARNISH_LABEL, STR, TOPPING_ICON, TOPPING_LABEL, clock, money } from './strings';

/** Approximate bottom edge of the HUD bar, in CSS px. */
const HUD_BOTTOM_PX = 58;

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

  set(revenue: number, target: number, timeLeft: number): void {
    const key = `${revenue}|${target}|${Math.ceil(timeLeft)}`;
    if (key === this.last) return;
    this.last = key;
    this.money.innerHTML = `${STR.revenue}: <b>${money(revenue)}</b> / ${STR.target}: ${money(target)}`;
    this.timer.textContent = `⏱ ${STR.timeLeft} ${clock(timeLeft)}`;
    this.timer.classList.toggle('low', timeLeft <= 30);
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
}

interface BubbleView {
  root: HTMLDivElement;
  bar: HTMLDivElement;
  toppingChips: HTMLSpanElement[];
  garnishChips: HTMLSpanElement[];
}

/** One order bubble per waiting customer, above its table (icons + labels, not colour-only). */
export class OrderBubbles {
  private bubbles = new Map<number, BubbleView>();

  constructor(private root: HTMLElement) {}

  update(list: BubbleData[]): void {
    const seen = new Set<number>();
    for (const b of list) {
      seen.add(b.id);
      let bubble = this.bubbles.get(b.id);
      if (!bubble) {
        bubble = this.create(b);
        this.bubbles.set(b.id, bubble);
      }
      // Keep bubbles on screen and below the HUD bar (short landscape phones).
      const halfW = bubble.root.offsetWidth / 2 + 6;
      const x = Math.min(window.innerWidth - halfW, Math.max(halfW, b.at.x));
      const y = Math.max(HUD_BOTTOM_PX + bubble.root.offsetHeight, b.at.y);
      bubble.root.style.left = `${x}px`;
      bubble.root.style.top = `${y}px`;
      const p = Math.max(0, Math.min(1, b.patience));
      bubble.bar.style.width = `${p * 100}%`;
      bubble.bar.style.backgroundColor = p > 0.5 ? '#3fbf5a' : p > 0.25 ? '#e8c547' : '#e04848';
      b.progress.toppings.forEach((done, i) => bubble.toppingChips[i]?.classList.toggle('done', done));
      b.progress.garnishes.forEach((done, i) => bubble.garnishChips[i]?.classList.toggle('done', done));
      bubble.root.classList.toggle('ready', b.progress.ready);
    }
    for (const [id, bubble] of this.bubbles) {
      if (!seen.has(id)) {
        bubble.root.remove();
        this.bubbles.delete(id);
      }
    }
  }

  private create(b: BubbleData): BubbleView {
    const root = el('div', 'htg-bubble', this.root);
    const tops = el('div', 'row', root);
    const toppingChips = b.order.toppings.map((t) => {
      const chip = el('span', 'htg-chip', tops);
      chip.textContent = `${TOPPING_ICON[t]} ${TOPPING_LABEL[t]}`;
      return chip;
    });
    const gars = el('div', 'row', root);
    const garnishChips = b.order.garnishes.map((g) => {
      const chip = el('span', 'htg-chip g', gars);
      chip.textContent = `${GARNISH_ICON[g]} ${GARNISH_LABEL[g]}`;
      return chip;
    });
    if (b.hurried) el('span', 'tag', root).textContent = STR.hurried;
    const track = el('div', 'htg-patience', root);
    const bar = el('div', '', track);
    return { root, bar, toppingChips, garnishChips };
  }
}

export interface GaugeData {
  at: ScreenPoint;
  label: string;
  /** All values are fractions 0..1 of the gauge height. */
  value: number;
  perfect: [number, number];
  good: [number, number];
}

/** Vertical hold gauge for blanch and broth with green (perfect) and yellow (good) zones. */
export class HoldGauge {
  private root: HTMLDivElement;
  private good: HTMLDivElement;
  private perfect: HTMLDivElement;
  private needle: HTMLDivElement;
  private label: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'htg-gauge', parent);
    this.good = el('div', 'zone good', this.root);
    this.perfect = el('div', 'zone perfect', this.root);
    this.needle = el('div', 'needle', this.root);
    this.label = el('div', 'htg-gauge-label', parent);
    this.hide();
  }

  show(g: GaugeData): void {
    const pct = (v: number) => `${Math.max(0, Math.min(1, v)) * 100}%`;
    this.root.style.display = this.label.style.display = 'block';
    this.root.style.left = this.label.style.left = `${g.at.x}px`;
    this.root.style.top = this.label.style.top = `${g.at.y}px`;
    this.good.style.bottom = pct(g.good[0]);
    this.good.style.height = pct(g.good[1] - g.good[0]);
    this.perfect.style.bottom = pct(g.perfect[0]);
    this.perfect.style.height = pct(g.perfect[1] - g.perfect[0]);
    this.needle.style.bottom = pct(g.value);
    this.label.textContent = g.label;
  }

  hide(): void {
    this.root.style.display = this.label.style.display = 'none';
  }
}
