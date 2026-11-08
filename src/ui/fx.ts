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

/** Customer's spoken line above their head (MEC-006 rules 13-14). `tone` styles the border. */
export function sayText(root: HTMLElement, at: ScreenPoint, text: string, tone: string): void {
  const e = el('div', `htg-say ${tone}`, root);
  e.textContent = text;
  e.style.left = `${at.x}px`;
  e.style.top = `${at.y}px`;
  e.addEventListener('animationend', () => e.remove());
  setTimeout(() => e.remove(), 4000);
}

/** MEC-007: one-line tutorial caption, next to the hint ring when `at` is given, else top centre. */
export class TutorialBar {
  private e: HTMLDivElement;
  private last = '';

  constructor(root: HTMLElement) {
    this.e = el('div', 'htg-tut', root);
    this.hide();
  }

  show(text: string, at: ScreenPoint | null): void {
    if (text !== this.last) {
      this.e.textContent = text;
      this.last = text;
    }
    this.e.style.display = 'block';
    this.e.classList.toggle('anchored', at !== null);
    if (at) {
      const halfW = this.e.offsetWidth / 2 + 8;
      this.e.style.left = `${Math.min(window.innerWidth - halfW, Math.max(halfW, at.x))}px`;
      this.e.style.top = `${Math.max(this.e.offsetHeight + 56, at.y - 40)}px`;
    } else {
      this.e.style.left = '50%';
      this.e.style.top = '';
    }
  }

  hide(): void {
    this.e.style.display = 'none';
  }
}

/** MEC-007 rule 4a: opening card on the first day; one tap to start. */
export class IntroCard {
  private e: HTMLDivElement;
  private text: HTMLDivElement;

  constructor(root: HTMLElement, startLabel: string) {
    this.e = el('div', 'htg-intro', root);
    const card = el('div', 'htg-card', this.e);
    this.text = el('div', 'intro-text', card);
    const btn = el('button', '', card);
    btn.textContent = startLabel;
    btn.addEventListener('click', () => this.hide());
    this.hide();
  }

  show(text: string): void {
    this.text.textContent = text;
    this.e.style.display = 'flex';
  }

  hide(): void {
    this.e.style.display = 'none';
  }

  get visible(): boolean {
    return this.e.style.display !== 'none';
  }
}

/** Big centred one-time tip that fades out (MEC-007 rule 6). */
export function toast(root: HTMLElement, text: string): void {
  const e = el('div', 'htg-toast', root);
  e.textContent = text;
  e.addEventListener('animationend', () => e.remove());
  setTimeout(() => e.remove(), 6000);
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
        e.textContent = l.text;
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

  /** `verdict` replaces the default win / lose line (day-1 narrator lines, MEC-007 rule 4c). */
  show(s: DaySummary, day: number, extraTable = false, verdictText: string | null = null): void {
    const rows: Array<[string, string]> = [
      [STR.revenue, `${money(s.revenue)} / ${money(s.target)}`],
      [STR.served, String(s.served)],
      [STR.perfect, String(s.perfect)],
      [STR.lostCustomers, String(s.lost)],
    ];
    this.e.innerHTML = '';
    const card = el('div', 'htg-card', this.e);
    el('h1', '', card).textContent = `${STR.dayEnded.replace('!', '')} ${day}!`;
    const verdict = el('div', `verdict ${s.won ? 'win' : 'lose'}`, card);
    verdict.textContent = verdictText ?? (s.won ? STR.won : STR.lost);
    const table = el('table', '', card);
    for (const [k, v] of rows) {
      const tr = el('tr', '', table);
      el('td', '', tr).textContent = k;
      el('td', '', tr).textContent = v;
    }
    if (extraTable) el('div', 'more', card).textContent = STR.moreTables;
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
