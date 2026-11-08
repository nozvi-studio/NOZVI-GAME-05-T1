import type { Order } from '../core/types';
import type { LineProgress, OrderProgress } from './orderProgress';
import { amountWord, spokenOrder } from './speech';
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

interface Chip {
  root: HTMLSpanElement;
  count: HTMLSpanElement;
}

interface BubbleView {
  root: HTMLDivElement;
  bar: HTMLDivElement;
  toppingChips: Chip[];
  garnishChips: Chip[];
  excludeChip: HTMLSpanElement | null;
  spoken: boolean;
}

/** MEC-005 rule 8: portions given / wanted; green when exact, red when over. */
function showChip(chip: Chip | undefined, p: LineProgress): void {
  if (!chip) return;
  chip.count.textContent = ` ${p.given}/${p.wanted}`;
  chip.root.classList.toggle('done', p.given === p.wanted);
  chip.root.classList.toggle('over', p.given > p.wanted);
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
      // Spoken orders show no progress: reading the sentence is the challenge (MEC-005 rule 8).
      if (!bubble.spoken) {
        b.progress.toppings.forEach((p, i) => showChip(bubble.toppingChips[i], p));
        b.progress.garnishes.forEach((p, i) => showChip(bubble.garnishChips[i], p));
        bubble.excludeChip?.classList.toggle('over', b.progress.excludeViolated);
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

  private create(b: BubbleData): BubbleView {
    const root = el('div', 'htg-bubble', this.root);
    const view: BubbleView = { root, bar: root as HTMLDivElement, toppingChips: [], garnishChips: [], excludeChip: null, spoken: b.order.spoken };
    if (b.order.spoken) {
      root.classList.add('spoken');
      el('div', 'say', root).textContent = `“${spokenOrder(b.order, b.id)}”`;
    } else {
      // The amount word sits in its own span so short phones can hide it; the "given/wanted" count still shows the amount.
      const chip = (row: HTMLElement, cls: string, portions: number, text: string): Chip => {
        const c = el('span', cls, row);
        if (amountWord(portions)) el('span', 'amt', c).textContent = `${amountWord(portions)} `;
        el('span', '', c).textContent = text;
        return { root: c, count: el('span', 'n', c) };
      };
      const tops = el('div', 'row', root);
      view.toppingChips = b.order.toppings.map((l) => chip(tops, 'htg-chip', l.portions, `${TOPPING_ICON[l.item]} ${TOPPING_LABEL[l.item]}`));
      const gars = el('div', 'row', root);
      view.garnishChips = b.order.garnishes.map((l) => chip(gars, 'htg-chip g', l.portions, `${GARNISH_ICON[l.item]} ${GARNISH_LABEL[l.item]}`));
      const ex = b.order.exclude;
      if (ex) {
        const label = ex in TOPPING_LABEL ? TOPPING_LABEL[ex as keyof typeof TOPPING_LABEL] : GARNISH_LABEL[ex as keyof typeof GARNISH_LABEL];
        view.excludeChip = el('span', 'htg-chip no', el('div', 'row', root));
        view.excludeChip.textContent = `🚫 ${STR.no} ${label.toLocaleLowerCase('vi')}`;
      }
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
