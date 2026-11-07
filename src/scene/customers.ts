import * as THREE from 'three';
import type { Bowl, Customer, CustomerKind } from '../core/types';
import { BowlView } from './bowl';
import { box, disposeGeometries, mat, sphere } from './primitives';
import { SEAT, TABLE_TOP } from './props';

const SHIRT: Record<CustomerKind, number> = { regular: 0xf0c75e, hurried: 0x8e5ad1 };
const SKIN = 0xe0b48a;
const ANGRY = 0xe04848;
const STREET_Z = -7;

// Seated pose: the group drops SIT_DROP below the lifted seat point, so head height is derived, not guessed.
const SEAT_LIFT = 0.1;
const SIT_DROP = 0.45;
const HEAD_TOP_LOCAL = 1.38; // top of the hair in the customer's local space
/** Head-top height of a seated customer above the table origin (VIS-101: anchor for bubbles and floating text). */
export const SEATED_HEAD_TOP = SEAT.y + SEAT_LIFT - SIT_DROP + HEAD_TOP_LOCAL;

export interface CustomerTiming {
  arriveSeconds: number;
  leaveSeconds: number;
}

/** Low-poly person: legs pivot at the hip so the same mesh can walk or sit. */
class CustomerView {
  readonly group = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private headMat = mat(SKIN);
  private shirtMat: THREE.MeshStandardMaterial;
  private mouth: THREE.Mesh;
  private angerMark: THREE.Mesh;
  bowl: BowlView | null = null;

  constructor(readonly id: number, kind: CustomerKind) {
    this.shirtMat = mat(SHIRT[kind]);
    for (const [leg, x] of [[this.legL, -0.11], [this.legR, 0.11]] as const) {
      const mesh = box(0.16, 0.45, 0.16, 0x33384a);
      mesh.position.y = -0.22;
      leg.add(mesh);
      leg.position.set(x, 0.45, 0);
    }
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.28), this.shirtMat);
    torso.castShadow = true;
    torso.position.y = 0.73;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 1), this.headMat);
    head.castShadow = true;
    head.position.y = 1.18;
    const hair = sphere(0.2, 0x2a1a12, 1);
    hair.scale.set(1, 0.55, 1);
    hair.position.set(0, 1.27, -0.03);
    const eyes = new THREE.Group();
    for (const x of [-0.07, 0.07]) {
      const eye = box(0.04, 0.04, 0.02, 0x1a1a1a);
      eye.position.set(x, 1.21, 0.18);
      eyes.add(eye);
    }
    this.mouth = box(0.1, 0.025, 0.02, 0x6b2b2b);
    this.mouth.position.set(0, 1.1, 0.18);
    this.angerMark = box(0.12, 0.12, 0.04, ANGRY);
    this.angerMark.position.set(0.18, 1.42, 0);
    this.angerMark.rotation.z = Math.PI / 4;
    this.angerMark.visible = false;
    this.group.add(this.legL, this.legR, torso, head, hair, eyes, this.mouth, this.angerMark);
  }

  setAngry(angry: boolean): void {
    this.headMat.color.setHex(angry ? 0xe58a6e : SKIN);
    this.mouth.rotation.z = angry ? 0.5 : 0;
    this.angerMark.visible = angry;
  }

  walk(from: THREE.Vector3, to: THREE.Vector3, t: number, time: number): void {
    this.group.position.lerpVectors(from, to, t);
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    this.group.rotation.y = Math.atan2(dx, dz);
    const swing = Math.sin(time * 10) * 0.5;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.group.position.y += Math.abs(Math.sin(time * 10)) * 0.04;
  }

  sit(seat: THREE.Vector3, time: number, eating: boolean): void {
    this.group.position.set(seat.x, seat.y - SIT_DROP, seat.z);
    this.group.rotation.y = 0; // face the cart
    this.legL.rotation.x = this.legR.rotation.x = -Math.PI / 2;
    // Small bob while eating.
    this.group.position.y += eating ? Math.abs(Math.sin(time * 6)) * 0.03 : 0;
  }
}

/** Customer views driven by `sim.customers` each frame (MEC-003). */
export class CustomerViews {
  private views = new Map<number, CustomerView>();
  private tmpFrom = new THREE.Vector3();
  private tmpTo = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private tables: THREE.Group[],
    private timing: CustomerTiming,
  ) {}

  private seatOf(table: number, out: THREE.Vector3): THREE.Vector3 {
    const t = this.tables[table];
    return out.set(t.position.x + SEAT.x, t.position.y + SEAT.y + SEAT_LIFT, t.position.z + SEAT.z);
  }

  /** Put a copy of the served bowl on the customer's table while they eat. */
  setServedBowl(customerId: number, table: number, bowl: Bowl): void {
    const view = this.views.get(customerId);
    if (!view) return;
    this.removeBowl(view);
    const bv = new BowlView();
    bv.set(bowl);
    bv.group.scale.setScalar(0.85);
    const t = this.tables[table];
    bv.group.position.set(t.position.x, t.position.y + TABLE_TOP, t.position.z - 0.12);
    this.scene.add(bv.group);
    view.bowl = bv;
  }

  update(customers: readonly Customer[], time: number): void {
    const alive = new Set<number>();
    for (const c of customers) {
      alive.add(c.id);
      let view = this.views.get(c.id);
      if (!view) {
        view = new CustomerView(c.id, c.kind);
        this.views.set(c.id, view);
        this.scene.add(view.group);
      }
      const seat = this.seatOf(c.table, this.tmpTo);
      const side = this.tables[c.table].position.x >= 0 ? 1 : -1;
      if (c.state === 'arriving') {
        const t = Math.min(1, c.stateTime / this.timing.arriveSeconds);
        this.tmpFrom.set(seat.x + side * 1.5, 0.1, STREET_Z);
        view.walk(this.tmpFrom, seat.setY(0.1), t, time);
      } else if (c.state === 'leaving') {
        const t = Math.min(1, c.stateTime / this.timing.leaveSeconds);
        this.tmpFrom.copy(seat).setY(0.1);
        this.tmpTo.set(seat.x + side * 5, 0.1, STREET_Z + 1);
        view.walk(this.tmpFrom, this.tmpTo, t, time);
      } else {
        view.sit(seat, time, c.state === 'eating');
      }
      view.setAngry(c.outcome === 'angry');
      if (c.state !== 'eating') this.removeBowl(view);
    }
    for (const [id, view] of this.views) if (!alive.has(id)) this.remove(id, view);
  }

  clear(): void {
    for (const [id, view] of this.views) this.remove(id, view);
  }

  private removeBowl(view: CustomerView): void {
    if (view.bowl) {
      this.scene.remove(view.bowl.group);
      disposeGeometries(view.bowl.group);
      view.bowl = null;
    }
  }

  private remove(id: number, view: CustomerView): void {
    this.removeBowl(view);
    this.scene.remove(view.group);
    disposeGeometries(view.group);
    this.views.delete(id);
  }
}
