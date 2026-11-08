import type { DaySummary } from '../core/types';
import { el, type ScreenPoint } from './widgets';
import { STR, money } from './strings';
import { enterFullscreenLandscape } from './fullscreen';
import { hudBottom } from './layout';

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
      this.e.style.top = `${Math.max(this.e.offsetHeight + hudBottom() + 4, at.y - 40)}px`;
    } else {
      this.e.style.left = '50%';
      this.e.style.top = '';
    }
  }

  hide(): void {
    this.e.style.display = 'none';
  }
}

/** MEC-007 rules 4a / 4b: story card with one button (opening line, then the first-bowl verdict). */
export class IntroCard {
  private e: HTMLDivElement;
  private text: HTMLDivElement;
  private btn: HTMLButtonElement;
  private onDone: (() => void) | null = null;

  constructor(root: HTMLElement, private defaultLabel: string) {
    this.e = el('div', 'htg-intro', root);
    const card = el('div', 'htg-card', this.e);
    this.text = el('div', 'intro-text', card);
    this.btn = el('button', '', card);
    this.btn.addEventListener('click', () => {
      enterFullscreenLandscape();
      this.hide();
      const done = this.onDone;
      this.onDone = null;
      done?.();
    });
    this.hide();
  }

  show(text: string, label = this.defaultLabel, onDone: (() => void) | null = null): void {
    this.text.textContent = text;
    this.btn.textContent = label;
    this.onDone = onDone;
    this.e.style.display = 'flex';
  }

  hide(): void {
    this.e.style.display = 'none';
  }

  get visible(): boolean {
    return this.e.style.display !== 'none';
  }
}

/**
 * MEC-007 rule 5: guidance after the first customer sits in a panel on the right, one message at a time,
 * for `SIDE_SECONDS` or until the player taps X. Order bubbles keep clear of it.
 */
export class SidePanel {
  private e: HTMLDivElement;
  private text: HTMLDivElement;
  private queue: string[] = [];
  private current: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(root: HTMLElement) {
    this.e = el('div', 'htg-side', root);
    this.text = el('div', '', this.e);
    const x = el('button', 'x', this.e);
    x.textContent = 'X';
    x.setAttribute('aria-label', 'Đóng');
    x.addEventListener('click', () => this.next());
    this.e.style.display = 'none';
  }

  push(message: string): void {
    if (message === this.current || this.queue.includes(message)) return;
    this.queue.push(message);
    if (this.current === null) this.next();
  }

  /** On-screen rectangle while visible, so bubbles can avoid it. */
  get rect(): DOMRect | null {
    return this.current === null ? null : this.e.getBoundingClientRect();
  }

  clear(): void {
    this.queue = [];
    this.current = null;
    if (this.timer) clearTimeout(this.timer);
    this.e.style.display = 'none';
  }

  private next(): void {
    if (this.timer) clearTimeout(this.timer);
    this.current = this.queue.shift() ?? null;
    this.e.style.display = this.current === null ? 'none' : 'block';
    if (this.current === null) return;
    this.text.textContent = this.current;
    this.timer = setTimeout(() => this.next(), SIDE_SECONDS * 1000);
  }
}

/** How long a right-panel message stays up without a tap on X. */
const SIDE_SECONDS = 10;

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
      if ((ev.target as HTMLElement).tagName === 'BUTTON') {
        enterFullscreenLandscape();
        onReplay();
      }
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
