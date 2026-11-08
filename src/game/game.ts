import * as THREE from 'three';
import { DaySim, nearestBrothLevel } from '../core';
import type { Bowl, GameEvent, Grade, HintTarget } from '../core/types';
import { GARNISHES, TOPPINGS } from '../core/types';
import { PointerInput } from '../input';
import { COUNTER_TOP, CustomerViews, SEATED_HEAD_TOP, cameraFov, createStreetScene, type StreetScene } from '../scene';
import { GARNISH_LABEL, GRADE_LABEL, STR, TIPS, TOPPING_LABEL, Ui, brothWord, leaveLine, money, orderProgress, reactionLine, tutorialCaption, type BubbleData, type ScreenPoint, type WorldLabel } from '../ui';

const MAX_DT = 0.1; // ARCHITECTURE §6: hidden tab must not skip the day.

const newSeed = () => Math.floor(Math.random() * 0x7fffffff);

/** Game controller: owns the DaySim, wires input → actions and sim state/events → views and UI. */
export class Game {
  private sim: DaySim;
  private street: StreetScene;
  private customerViews: CustomerViews;
  private input: PointerInput;
  private ui: Ui;
  private clockTime = 0;
  private width = 1;
  private height = 1;
  private prevBasket: Grade | null = null;
  private prevBroth = false;
  /** MEC-007 rule 6: one-time tips already shown this session (not repeated on later days), and tutorial customers finished. */
  private tips = new Set<keyof typeof TIPS>();
  private tutorialDoneCount = 0;
  /** Day number in this session; day 2+ skips the tutorial (MEC-007 rule 8). */
  private day = 1;
  private tmp = new THREE.Vector3();

  constructor(
    private renderer: THREE.WebGLRenderer,
    container: HTMLElement,
  ) {
    this.sim = new DaySim({ seed: newSeed() });
    this.street = createStreetScene(1);
    this.customerViews = new CustomerViews(this.street.scene, this.street.tables, this.sim.balance.customers);
    this.ui = new Ui(container, () => this.restart());
    this.input = new PointerInput(
      renderer.domElement,
      this.street.camera,
      this.street.interactables,
      {
        press: (n) => this.onPress(n),
        release: (n) => this.onRelease(n),
        tap: (n) => this.onTap(n),
        drop: (s, t) => this.onDrop(s, t),
      },
      { canDrag: (n) => this.canDrag(n), dragHeight: this.street.cart.group.position.y + COUNTER_TOP + 0.35 },
    );
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.street.camera.aspect = width / height;
    this.street.camera.fov = cameraFov(width, height); // phones sideways: slightly closer (VIS-502)
    this.street.camera.updateProjectionMatrix();
    if (this.ui.rotate.update()) this.input.cancel(); // upright phone: popup shows and the day pauses (VIS-501)
    this.renderer.setSize(width, height);
  }

  /** Starts a new day with a fresh DaySim, no reload (GDD §4). */
  restart(): void {
    this.input.cancel();
    this.day += 1;
    this.sim = new DaySim({ seed: newSeed(), day: this.day });
    this.customerViews.clear();
    this.ui.reset();
    this.prevBasket = null;
    this.prevBroth = false;
    this.tutorialDoneCount = 0;
  }

  frame(dt: number): void {
    dt = Math.min(Math.max(dt, 0), MAX_DT);
    this.clockTime += dt;
    // The day is paused while the rotate popup covers the screen.
    if (!this.sim.ended && !this.ui.rotate.visible) for (const e of this.sim.update(dt)) this.onEvent(e);
    this.syncScene();
    this.street.update(dt, this.clockTime, {
      blanching: this.sim.kitchen.blanching !== null,
      bowlSteaming: this.street.cart.bowl.steaming,
    });
    this.syncUi();
    this.renderer.render(this.street.scene, this.street.camera);
  }

  // ---- input → actions (ARCHITECTURE §5) ----

  private canDrag(name: string): boolean {
    const k = this.sim.kitchen;
    if (name === 'basket') return k.basket !== null && k.blanching === null;
    if (name === 'bowl') return k.bowl.noodles !== null;
    return false;
  }

  private onPress(name: string): void {
    if (this.sim.ended) return;
    if (name === 'basket' && this.sim.kitchen.basket === null) this.sim.startBlanch();
    else if (name === 'pot') this.sim.startPour();
  }

  private onRelease(name: string): void {
    if (name === 'basket') this.sim.releaseBlanch();
    else if (name === 'pot') this.sim.releasePour();
  }

  private onTap(name: string): void {
    if (this.sim.ended) return;
    const [kind, item] = name.split(':');
    const hasNoodles = this.sim.kitchen.bowl.noodles !== null;
    if (kind === 'topping') {
      const t = TOPPINGS.find((x) => x === item);
      // MEC-005 rule 1: a rejected tap on a bowl with noodles means the portion cap was hit.
      if (t && !this.sim.addTopping(t) && hasNoodles) this.ui.float(this.objPos(name, 0.25), STR.full, true);
    } else if (kind === 'garnish') {
      const g = GARNISHES.find((x) => x === item);
      if (g && !this.sim.addGarnish(g) && hasNoodles) this.ui.float(this.objPos(name, 0.35), STR.full, true);
    } else if (name === 'trash') this.sim.discardBowl();
  }

  private onDrop(source: string, target: string | null): void {
    if (this.sim.ended || !target) return;
    if (source === 'basket' && target === 'bowl') this.sim.moveNoodlesToBowl();
    else if (source === 'bowl' && target === 'trash') this.sim.discardBowl();
    else if (source === 'bowl' && target.startsWith('table:')) {
      const table = Number(target.slice(6));
      const snapshot: Bowl = structuredClone(this.sim.kitchen.bowl);
      if (!this.sim.serve(table)) return;
      const customer = this.sim.customers.find((c) => c.table === table && c.state === 'eating');
      if (customer) this.customerViews.setServedBowl(customer.id, table, snapshot);
    }
  }

  // ---- sim → views / UI ----

  private onEvent(e: GameEvent): void {
    if (e.type === 'customerArrived') {
      const st = e.customer.order.style;
      if (st !== 'chips') this.tip('firstSpoken');
      if (st === 'implied') this.tip('firstImplied');
    } else if (e.type === 'customerServed') {
      const { payment: p, customer: c } = e;
      if (c.id === 1) this.tip('clockStarts');
      if (c.order.tutorial) this.tutorialFinished();
      const at = this.project(this.headPos(c.table, 0.3));
      this.ui.float(at, `+${money(p.total)}`);
      if (p.perfect) this.ui.float({ x: at.x, y: at.y + 30 }, GRADE_LABEL.perfect, true);
      // MEC-006 rule 13: the customer says how they feel, naming the worst cause.
      const say = this.project(this.headPos(c.table, 0.45));
      this.ui.say(say, reactionLine(p.reaction, p.cause, c.temper, c.id), p.reaction);
    } else if (e.type === 'customerGaveUp') {
      if (e.customer.order.tutorial) this.tutorialFinished();
      // MEC-006 rule 14: a line, then they walk off.
      this.ui.say(this.project(this.headPos(e.customer.table, 0.45)), leaveLine(e.customer.temper, e.customer.id), 'leave');
    } else if (e.type === 'dayEnded') {
      this.input.cancel();
      this.ui.showSummary(e.summary, this.day);
    }
  }

  /** Shows a one-time tip once per day. */
  private tip(key: keyof typeof TIPS): void {
    if (this.tips.has(key)) return;
    this.tips.add(key);
    this.ui.toast(TIPS[key]);
  }

  private tutorialFinished(): void {
    this.tutorialDoneCount += 1;
    if (this.tutorialDoneCount === this.sim.balance.orders.tutorialCustomers) this.tip('tutorialDone');
  }

  private syncScene(): void {
    const k = this.sim.kitchen;
    const { cart } = this.street;
    cart.basket.set(k.basket, k.blanching, this.clockTime);
    cart.bowl.set(k.bowl, k.pouring, this.sim.balance.broth.maxFill);
    this.customerViews.update(this.sim.customers, this.clockTime);

    // Grade pop-ups on every grading, including auto-release at the max hold.
    if (k.basket !== null && this.prevBasket === null) this.ui.float(this.objPos('basket', 0.7), GRADE_LABEL[k.basket], true);
    const broth = k.bowl.broth;
    // MEC-006 rule 6: name the level that was poured (grading uses the customer's level at serve time).
    if (broth && !this.prevBroth) this.ui.float(this.objPos('bowl', 0.6), brothWord(nearestBrothLevel(broth.fill, this.sim.balance.broth)), true);
    this.prevBasket = k.basket;
    this.prevBroth = broth !== null;
  }

  private syncUi(): void {
    const sim = this.sim;
    const b = sim.balance;
    this.ui.hud.set(sim.revenue, b.day.revenueTarget, b.day.lengthSeconds - sim.time, sim.frozen, this.day);

    const bubbles: BubbleData[] = [];
    for (const c of sim.customers) {
      if (c.state !== 'waiting' || sim.ended) continue;
      bubbles.push({
        id: c.id,
        at: this.project(this.headPos(c.table, 0.15)),
        order: c.order,
        patience: c.patience / c.maxPatience,
        hurried: c.kind === 'hurried',
        progress: orderProgress(c.order, sim.kitchen.bowl, sim.balance.broth),
      });
    }
    this.ui.bubbles.update(bubbles);

    const k = sim.kitchen;
    if (k.blanching !== null) {
      const { idealSeconds: ideal, perfectToleranceSeconds: p, goodToleranceSeconds: g, maxHoldSeconds: max } = b.blanch;
      this.ui.gauge.show({
        at: this.objPos('basket', 0.4, 0.55),
        label: STR.blanch,
        value: k.blanching / max,
        perfect: [(ideal - p) / max, (ideal + p) / max],
        good: [(ideal - g) / max, (ideal + g) / max],
      });
    } else if (k.pouring !== null) {
      const { perfectTolerance: p, goodTolerance: g, maxFill: max, levelFill } = b.broth;
      // MEC-006 rule 6: zones only while a tutorial customer waits; otherwise ít / vừa / nhiều ticks.
      const tut = sim.customers.find((c) => c.state === 'waiting' && c.order.tutorial);
      const t = tut ? levelFill[tut.order.broth - 1] : null;
      this.ui.gauge.show({
        at: this.objPos('pot', 0.5, -0.6),
        label: STR.broth,
        value: k.pouring / max,
        perfect: t === null ? null : [(t - p) / max, (t + p) / max],
        good: t === null ? null : [(t - g) / max, (t + g) / max],
        ticks: t === null ? levelFill.map((f, i) => ({ at: f / max, label: STR.brothLevels[i] })) : undefined,
      });
    } else this.ui.gauge.hide();

    const hint = !sim.ended && sim.summary().served === 0 ? this.hintPos(sim.nextHint()) : null;
    if (hint && !this.input.dragging) this.ui.hint.show(hint);
    else this.ui.hint.hide();

    // MEC-007 rules 4-5: captions for the three tutorial customers; anchored to the ring for the first.
    const tutorialOrder = sim.customers.find((c) => c.state === 'waiting' && c.order.tutorial)?.order ?? null;
    const caption = sim.ended ? null : tutorialCaption({ frozen: sim.frozen, hint: sim.nextHint(), tutorialOrder });
    if (caption) this.ui.tutorial.show(caption, sim.frozen && hint ? hint : null);
    else this.ui.tutorial.hide();

    this.ui.labels.update(this.labels());
  }

  /**
   * Counter labels: one-word pills (no icons, MEC-006), placed on or just below the front lip so they never cover the food (VIS-105).
   * Pot and basket have no fixed label: the jars hide the pot wall on phones; the hold gauge names them while in use.
   */
  private labels(): WorldLabel[] {
    const out: WorldLabel[] = [];
    // The 2x2 trays are 0.6 apart but a pill is wider, so push the two columns apart to avoid overlapping labels.
    TOPPINGS.forEach((t, i) => {
      const dx = i % 2 === 0 ? -0.17 : 0.17;
      out.push({ key: t, text: TOPPING_LABEL[t], at: this.objPos(`topping:${t}`, 0.06, dx, 0.27) });
    });
    for (const g of GARNISHES) out.push({ key: g, text: GARNISH_LABEL[g], at: this.objPos(`garnish:${g}`, 0, 0, 0.24) });
    out.push({ key: 'bowl', text: STR.bowl, at: this.objPos('bowl', 0, 0, 0.36) });
    out.push({ key: 'trash', text: STR.trash, at: this.objPos('trash', 0.05, 0, 0.3) });
    return out;
  }

  private hintPos(target: HintTarget): ScreenPoint | null {
    const { cart } = this.street;
    switch (target) {
      case 'basket':
      case 'bowl':
      case 'pot':
        return this.objPos(target, 0.2);
      case 'toppings':
        return this.project(cart.toppingsAnchor.getWorldPosition(this.tmp));
      case 'garnishes':
        return this.project(cart.garnishesAnchor.getWorldPosition(this.tmp));
      case 'table': {
        const c = this.sim.customers.find((x) => x.state === 'waiting');
        return c ? this.project(this.street.tables[c.table].getWorldPosition(this.tmp).setY(0.8)) : null;
      }
      default:
        return null;
    }
  }

  // ---- projection helpers ----

  private headPos(table: number, extra: number): THREE.Vector3 {
    const t = this.street.tables[table].position;
    return this.tmp.set(t.x, t.y + SEATED_HEAD_TOP + extra, t.z - 0.75);
  }

  private objPos(name: string, dy = 0, dx = 0, dz = 0): ScreenPoint {
    const obj = this.street.interactables.get(name);
    if (!obj) return { x: -100, y: -100 };
    obj.getWorldPosition(this.tmp);
    this.tmp.x += dx;
    this.tmp.y += dy;
    this.tmp.z += dz;
    return this.project(this.tmp);
  }

  private project(v: THREE.Vector3): ScreenPoint {
    const p = v.clone().project(this.street.camera);
    return { x: ((p.x + 1) / 2) * this.width, y: ((1 - p.y) / 2) * this.height };
  }
}
