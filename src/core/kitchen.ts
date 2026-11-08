import type { Balance } from './balance';
import { gradeBlanch } from './blanch';
import { emptyBowl, gradeBroth } from './bowl';
import type { Garnish, Grade, Kitchen, Topping } from './types';

// MEC-001 / MEC-002: cooking actions on the single in-progress bowl.
export class KitchenState {
  readonly state: Kitchen = { basket: null, blanching: null, pouring: null, bowl: emptyBowl() };

  constructor(private readonly balance: Balance) {}

  /** Advance holds; auto-release at their caps (MEC-002 rules 1 and 4). */
  update(dt: number): void {
    const k = this.state;
    if (k.blanching !== null) {
      k.blanching += dt;
      if (k.blanching >= this.balance.blanch.maxHoldSeconds) this.releaseBlanch();
    }
    if (k.pouring !== null) {
      k.pouring = Math.min(this.balance.broth.maxFill, k.pouring + dt * this.balance.broth.fillPerSecond);
      if (k.pouring >= this.balance.broth.maxFill) this.releasePour();
    }
  }

  startBlanch(): boolean {
    const k = this.state;
    if (k.basket !== null || k.blanching !== null) return false;
    k.blanching = 0;
    return true;
  }

  releaseBlanch(): Grade | null {
    const k = this.state;
    if (k.blanching === null) return null;
    const grade = gradeBlanch(k.blanching, this.balance.blanch);
    k.blanching = null;
    k.basket = grade;
    return grade;
  }

  moveNoodlesToBowl(): boolean {
    const k = this.state;
    if (k.basket === null || k.bowl.noodles !== null) return false;
    k.bowl.noodles = k.basket;
    k.basket = null;
    return true;
  }

  // MEC-005 rule 1: one portion per tap, capped at amounts.maxPortions.
  addTopping(t: Topping): boolean {
    const bowl = this.state.bowl;
    if (bowl.noodles === null || bowl.toppings[t] >= this.balance.amounts.maxPortions) return false;
    bowl.toppings[t] += 1;
    return true;
  }

  addGarnish(g: Garnish): boolean {
    const bowl = this.state.bowl;
    if (bowl.noodles === null || bowl.garnishes[g] >= this.balance.amounts.maxPortions) return false;
    bowl.garnishes[g] += 1;
    return true;
  }

  startPour(): boolean {
    const k = this.state;
    if (k.bowl.noodles === null || k.bowl.broth !== null || k.pouring !== null) return false;
    k.pouring = 0;
    return true;
  }

  releasePour(): Grade | null {
    const k = this.state;
    if (k.pouring === null) return null;
    const fill = Math.round(k.pouring * 1000) / 1000;
    const grade = gradeBroth(fill, this.balance.broth);
    k.bowl.broth = { fill, grade };
    k.pouring = null;
    return grade;
  }

  discardBowl(): void {
    this.state.pouring = null;
    this.state.bowl = emptyBowl();
  }
}
