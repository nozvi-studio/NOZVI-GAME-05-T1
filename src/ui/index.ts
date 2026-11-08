import type { DaySummary } from '../core/types';
import { HintRing, IntroCard, SummaryOverlay, TutorialBar, WorldLabels, floatText, sayText, toast } from './fx';
import { RotatePrompt } from './rotatePrompt';
import { STR } from './strings';
import { injectStyles } from './styles';
import { HoldGauge, Hud, OrderBubbles, el, type ScreenPoint } from './widgets';

export { STR, TOPPING_LABEL, GARNISH_LABEL, GRADE_LABEL, money } from './strings';
export type { BubbleData, GaugeData, ScreenPoint } from './widgets';
export { orderProgress } from './orderProgress';
export { shouldAskRotate } from './rotatePrompt';
export { brothWord, explicitOrder, leaveLine, reactionLine } from './speech';
export { INTRO, STOP_CUE, TIPS, firstBowlLine, firstDayLine, tutorialCaption } from './tutorial';
export type { WorldLabel } from './fx';

/** DOM overlay above the canvas. Takes screen positions only; never touches Three.js. */
export class Ui {
  readonly root: HTMLDivElement;
  readonly hud: Hud;
  readonly bubbles: OrderBubbles;
  readonly gauge: HoldGauge;
  readonly hint: HintRing;
  readonly labels: WorldLabels;
  readonly summary: SummaryOverlay;
  readonly rotate: RotatePrompt;
  readonly tutorial: TutorialBar;
  readonly intro: IntroCard;
  private toastLayer: HTMLDivElement;
  private fxLayer: HTMLDivElement;

  constructor(parent: HTMLElement, onReplay: () => void, onAsk: (customerId: number) => void) {
    injectStyles();
    this.root = el('div', 'htg-ui', parent);
    this.labels = new WorldLabels(el('div', '', this.root));
    this.bubbles = new OrderBubbles(el('div', '', this.root), onAsk);
    this.gauge = new HoldGauge(this.root);
    this.hint = new HintRing(this.root);
    this.fxLayer = el('div', '', this.root);
    this.tutorial = new TutorialBar(this.root);
    this.toastLayer = el('div', 'htg-toasts', this.root);
    this.hud = new Hud(this.root);
    this.summary = new SummaryOverlay(this.root, onReplay);
    this.intro = new IntroCard(this.root, STR.start);
    this.rotate = new RotatePrompt(this.root);
  }

  float(at: ScreenPoint, text: string, small = false): void {
    floatText(this.fxLayer, at, text, small);
  }

  toast(text: string): void {
    toast(this.toastLayer, text);
  }

  say(at: ScreenPoint, text: string, tone: string): void {
    sayText(this.fxLayer, at, text, tone);
  }

  showSummary(s: DaySummary, day: number, extraTable = false, verdict: string | null = null): void {
    this.gauge.hide();
    this.hint.hide();
    this.bubbles.update([]);
    this.tutorial.hide();
    this.summary.show(s, day, extraTable, verdict);
  }

  /** Clears transient UI for a new day. */
  reset(): void {
    this.summary.hide();
    this.gauge.hide();
    this.hint.hide();
    this.bubbles.update([]);
    this.fxLayer.innerHTML = '';
    this.toastLayer.innerHTML = '';
    this.tutorial.hide();
  }
}
