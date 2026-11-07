import * as THREE from 'three';
import { DaySim } from '../core';
import type { Bowl, GameEvent, Grade, HintTarget } from '../core/types';
import { GARNISHES, TOPPINGS } from '../core/types';
import { PointerInput } from '../input';
import { COUNTER_TOP, CustomerViews, SEATED_HEAD_TOP, createStreetScene, type StreetScene } from '../scene';
import { GARNISH_LABEL, GRADE_LABEL, STR, TOPPING_LABEL, Ui, money, orderProgress, type BubbleData, type ScreenPoint, type WorldLabel } from '../ui';

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
    this.street.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /** Starts a new day with a fresh DaySim, no reload (GDD §4). */
  restart(): void {
    this.input.cancel();
    this.sim = new DaySim({ seed: newSeed() });
    this.customerViews.clear();
    this.ui.reset();
    this.prevBasket = null;
    this.prevBroth = false;
  }

  frame(dt: number): void {
    dt = Math.min(Math.max(dt, 0), MAX_DT);
    this.clockTime += dt;
    if (!this.sim.ended) for (const e of this.sim.update(dt)) this.onEvent(e);
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
    if (kind === 'topping') {
      const t = TOPPINGS.find((x) => x === item);
      if (t) this.sim.addTopping(t);
    } else if (kind === 'garnish') {
      const g = GARNISHES.find((x) => x === item);
      if (g) this.sim.addGarnish(g);
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
    if (e.type === 'customerServed') {
      const at = this.project(this.headPos(e.customer.table, 0.3));
      this.ui.float(at, `+${money(e.payment.total)}`);
      if (e.payment.perfect) this.ui.float({ x: at.x, y: at.y + 30 }, GRADE_LABEL.perfect, true);
    } else if (e.type === 'customerGaveUp') {
      this.ui.float(this.project(this.headPos(e.customer.table, 0.3)), '😠', true);
    } else if (e.type === 'dayEnded') {
      this.input.cancel();
      this.ui.showSummary(e.summary);
    }
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
    if (broth && !this.prevBroth) this.ui.float(this.objPos('bowl', 0.6), GRADE_LABEL[broth.grade], true);
    this.prevBasket = k.basket;
    this.prevBroth = broth !== null;
  }

  private syncUi(): void {
    const sim = this.sim;
    const b = sim.balance;
    this.ui.hud.set(sim.revenue, b.day.revenueTarget, b.day.lengthSeconds - sim.time);

    const bubbles: BubbleData[] = [];
    for (const c of sim.customers) {
      if (c.state !== 'waiting' || sim.ended) continue;
      bubbles.push({
        id: c.id,
        at: this.project(this.headPos(c.table, 0.15)),
        order: c.order,
        patience: c.patience / c.maxPatience,
        hurried: c.kind === 'hurried',
        progress: orderProgress(c.order, sim.kitchen.bowl),
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
      const { targetFill: t, perfectTolerance: p, goodTolerance: g, maxFill: max } = b.broth;
      this.ui.gauge.show({
        at: this.objPos('pot', 0.5, -0.6),
        label: STR.broth,
        value: k.pouring / max,
        perfect: [(t - p) / max, (t + p) / max],
        good: [(t - g) / max, (t + g) / max],
      });
    } else this.ui.gauge.hide();

    const hint = !sim.ended && sim.summary().served === 0 ? this.hintPos(sim.nextHint()) : null;
    if (hint && !this.input.dragging) this.ui.hint.show(hint);
    else this.ui.hint.hide();

    this.ui.labels.update(this.labels());
  }

  private labels(): WorldLabel[] {
    const out: WorldLabel[] = [];
    for (const t of TOPPINGS) out.push({ key: t, text: TOPPING_LABEL[t], at: this.objPos(`topping:${t}`, 0.1, 0, 0.12) });
    for (const g of GARNISHES) out.push({ key: g, text: GARNISH_LABEL[g], at: this.objPos(`garnish:${g}`, 0, 0, 0.24) });
    out.push({ key: 'trash', text: STR.trash, at: this.objPos('trash', 0.05, 0, 0.35) });
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
