import { STR } from './strings';
import { el } from './widgets';

/** A touch device whose short side is below this (CSS px) counts as a phone; tablets are out of scope. */
export const PHONE_MAX_SHORT_SIDE = 600;

export interface RotateEnv {
  coarsePointer: boolean;
  /** Short side of the physical screen in CSS px. */
  shortSide: number;
  portrait: boolean;
}

/** VIS-501: ask a phone held upright to turn sideways. Mouse devices and tablets never see the prompt. */
export function shouldAskRotate(e: RotateEnv): boolean {
  return e.coarsePointer && e.shortSide < PHONE_MAX_SHORT_SIDE && e.portrait;
}

export function readRotateEnv(): RotateEnv {
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    shortSide: Math.min(window.screen.width, window.screen.height),
    portrait: window.innerHeight > window.innerWidth,
  };
}

/** Full-screen popup with an animated phone icon. It also blocks taps, and the game pauses while it shows. */
export class RotatePrompt {
  private root: HTMLDivElement;
  private shown = false;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'htg-rotate', parent);
    el('div', 'phone', this.root);
    el('div', 'title', this.root).textContent = STR.rotateTitle;
    el('div', 'sub', this.root).textContent = STR.rotateSub;
    this.root.style.display = 'none';
  }

  get visible(): boolean {
    return this.shown;
  }

  /** Re-reads the screen state; returns whether the popup is now visible. */
  update(): boolean {
    this.shown = shouldAskRotate(readRotateEnv());
    this.root.style.display = this.shown ? 'flex' : 'none';
    return this.shown;
  }
}
