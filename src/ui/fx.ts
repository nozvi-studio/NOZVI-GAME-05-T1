import type { DaySummary } from '../core/types';
import { el, type ScreenPoint } from './widgets';
import { STR, money } from './strings';

/** Short floating text, e.g. "+35k" on payment or a grade on release. */
export function floatText(root: HTMLElement, at: ScreenPoint, text: string, small = false): void {
  const e = el('div', small ? 'htg-float small' : 'htg-float', root);
  e.textContent = text;
  e.style.left = `${at.x}px`;
  e.style.top = `${at.y}px`;
  e.addEventListener('animationend', () => e.remove());
  // Fallback when animations do not run (hidden tab).
  setTimeout(() => e.remove(), 2000);
}

/** Customer's spoken reaction above their head (MEC-005 §8). `tone` styles the border. */
export function sayText(root: HTMLElement, at: ScreenPoint, text: string, tone: string): void {
  const e = el('div', `htg-say ${tone}`, root);
  e.textContent = text;
  e.style.left = `${at.x}px`;
  e.style.top = `${at.y}px`;
  e.addEventListener('animationend', () => e.remove());
  setTimeout(() => e.remove(), 4000);
}

/** Pulsing ring + hand on the next FTUE target (GDD §3b). */
export class HintRing {
  private e: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.e = el('div', 'htg-hint', root);
    this.hide();
  }

  show(at: ScreenPoint): void {
    this.e.style.display = 'block';
    this.e.style.left = `${at.x}px`;
    this.e.style.top = `${at.y}px`;
  }

  hide(): void {
    this.e.style.display = 'none';
  }
}

export interface WorldLabel {
  key: string;
  /** Emoji shown before the word, same set as the order chips. */
  icon?: string;
  text: string;
  at: ScreenPoint;
}

/** One-word labels under counter objects so ingredients are not colour-only. */
export class WorldLabels {
  private labels = new Map<string, HTMLDivElement>();

  constructor(private root: HTMLElement) {}

  update(list: WorldLabel[]): void {
    for (const l of list) {
      let e = this.labels.get(l.key);
      if (!e) {
        e = el('div', 'htg-label', this.root);
        if (l.icon) el('span', 'ico', e).textContent = `${l.icon} `;
        el('span', '', e).textContent = l.text;
        this.labels.set(l.key, e);
      }
      e.style.left = `${l.at.x}px`;
      e.style.top = `${l.at.y}px`;
    }
  }
}

/** Day-summary overlay with the restart button (GDD §4: ≤ 1 tap, ≤ 1 s). */
export class SummaryOverlay {
  private e: HTMLDivElement;

  constructor(root: HTMLElement, onReplay: () => void) {
    this.e = el('div', 'htg-summary', root);
    this.e.addEventListener('click', (ev) => {
      if ((ev.target as HTMLElement).tagName === 'BUTTON') onReplay();
    });
    this.hide();
  }

  show(s: DaySummary): void {
    const rows: Array<[string, string]> = [
      [STR.revenue, `${money(s.revenue)} / ${money(s.target)}`],
      [STR.served, String(s.served)],
      [STR.perfect, String(s.perfect)],
      [STR.lostCustomers, String(s.lost)],
    ];
    this.e.innerHTML = '';
    const card = el('div', 'htg-card', this.e);
    el('h1', '', card).textContent = STR.dayEnded;
    const verdict = el('div', `verdict ${s.won ? 'win' : 'lose'}`, card);
    verdict.textContent = s.won ? STR.won : STR.lost;
    const table = el('table', '', card);
    for (const [k, v] of rows) {
      const tr = el('tr', '', table);
      el('td', '', tr).textContent = k;
      el('td', '', tr).textContent = v;
    }
    el('button', '', card).textContent = STR.playAgain;
    this.e.style.display = 'flex';
  }

  hide(): void {
    this.e.style.display = 'none';
  }

  get visible(): boolean {
    return this.e.style.display !== 'none';
  }
}
