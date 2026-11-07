import * as THREE from 'three';
import type { Bowl, Garnish, Grade, Topping } from '../core/types';
import { GARNISHES, TOPPINGS } from '../core/types';
import { box, cylinder, mat, sphere } from './primitives';
import { BROTH_COLOR, GARNISH_COLORS, NOODLE_COLORS, RAW_NOODLE_COLOR, TOPPING_COLORS } from './palette';

const BOWL_H = 0.22;
const R_BOTTOM = 0.17;
const R_TOP = 0.32;

/** Small low-poly pieces for one topping (also used on the counter trays). */
export function toppingPieces(t: Topping, count: number, spread: number): THREE.Group {
  const g = new THREE.Group();
  const color = TOPPING_COLORS[t];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + i * 0.7;
    const r = spread * (0.35 + 0.65 * ((i * 37) % 10) / 10);
    let piece: THREE.Object3D;
    if (t === 'pork') piece = box(0.06, 0.035, 0.06, color);
    else if (t === 'shrimp') {
      piece = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.016, 4, 6, Math.PI * 1.4), mat(color));
      piece.rotation.x = -Math.PI / 2;
    } else if (t === 'liver') piece = box(0.08, 0.02, 0.05, color);
    else {
      piece = sphere(0.035, color, 1);
      const yolk = sphere(0.018, 0xf2b632);
      yolk.position.y = 0.022;
      piece.add(yolk);
    }
    piece.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    piece.rotation.y = a;
    g.add(piece);
  }
  return g;
}

/** Small pieces for one garnish (also used in the jars). */
export function garnishPieces(gn: Garnish, count: number, spread: number): THREE.Group {
  const g = new THREE.Group();
  const color = GARNISH_COLORS[gn];
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996;
    const r = spread * Math.sqrt((i + 0.5) / count);
    let piece: THREE.Mesh;
    if (gn === 'scallion') piece = box(0.025, 0.012, 0.025, color);
    else if (gn === 'pepper') piece = sphere(0.009, color);
    else {
      piece = cylinder(0.008, 0.008, 0.08, color, 4);
      piece.rotation.z = Math.PI / 2;
    }
    piece.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    piece.rotation.y = a;
    g.add(piece);
  }
  return g;
}

/** Visual of a bowl's contents (MEC-002), driven from a `Bowl` snapshot. */
export class BowlView {
  readonly group = new THREE.Group();
  private noodles: THREE.Mesh;
  private noodleMat: THREE.MeshStandardMaterial;
  private broth: THREE.Mesh;
  private toppings = new Map<Topping, THREE.Group>();
  private garnishes = new Map<Garnish, THREE.Group>();

  constructor() {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(R_TOP, R_BOTTOM, BOWL_H, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf3efe4, flatShading: true, roughness: 0.6, side: THREE.DoubleSide }),
    );
    shell.position.y = BOWL_H / 2;
    shell.castShadow = true;
    const base = cylinder(R_BOTTOM, R_BOTTOM * 0.9, 0.02, 0xf3efe4, 14);
    base.position.y = 0.01;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP, 0.012, 4, 18), mat(0x2f6fa8));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = BOWL_H;
    this.group.add(shell, base, rim);

    this.noodleMat = mat(NOODLE_COLORS.perfect);
    this.noodles = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), this.noodleMat);
    this.noodles.scale.set(1, 0.32, 1);
    this.noodles.position.y = 0.08;
    this.broth = new THREE.Mesh(
      new THREE.CircleGeometry(1, 16),
      new THREE.MeshStandardMaterial({ color: BROTH_COLOR, transparent: true, opacity: 0.8, roughness: 0.3 }),
    );
    this.broth.rotation.x = -Math.PI / 2;
    this.group.add(this.noodles, this.broth);

    TOPPINGS.forEach((t, i) => {
      const pieces = toppingPieces(t, 3, 0.05);
      const a = (i / TOPPINGS.length) * Math.PI * 2 + 0.4;
      pieces.position.set(Math.cos(a) * 0.13, 0.15, Math.sin(a) * 0.13);
      this.toppings.set(t, pieces);
      this.group.add(pieces);
    });
    GARNISHES.forEach((gn) => {
      const pieces = garnishPieces(gn, gn === 'pepper' ? 14 : 9, 0.17);
      pieces.rotation.y = gn.length;
      this.garnishes.set(gn, pieces);
      this.group.add(pieces);
    });
    this.set(null);
  }

  /** `liveFill` overrides the broth level while pouring (0..maxFill). */
  set(bowl: Bowl | null, liveFill: number | null = null, maxFill = 1.2): void {
    const noodles = bowl?.noodles ?? null;
    this.noodles.visible = noodles !== null;
    if (noodles) this.noodleMat.color.setHex(NOODLE_COLORS[noodles]);

    const fill = liveFill ?? bowl?.broth?.fill ?? null;
    this.broth.visible = fill !== null && fill > 0.01;
    let surface = 0.15;
    if (fill !== null) {
      const k = Math.min(1, fill / maxFill);
      const y = 0.03 + k * (BOWL_H - 0.03);
      const r = R_BOTTOM + (R_TOP - R_BOTTOM) * (y / BOWL_H) - 0.01;
      this.broth.position.y = y;
      this.broth.scale.setScalar(r);
      surface = Math.max(surface, y + 0.01);
    }
    for (const [t, g] of this.toppings) {
      g.visible = bowl?.toppings.includes(t) ?? false;
      g.position.y = surface;
    }
    for (const [gn, g] of this.garnishes) {
      g.visible = bowl?.garnishes.includes(gn) ?? false;
      g.position.y = surface + 0.02;
    }
  }
}

/** Noodle basket next to the broth pot: shows noodles while blanching or when holding a graded batch. */
export class BasketView {
  readonly group = new THREE.Group();
  /** Part that dips into the water while blanching. */
  private body = new THREE.Group();
  private noodles: THREE.Mesh;
  private noodleMat = mat(RAW_NOODLE_COLOR);

  constructor() {
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.17, 0.26, 8, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8a8a8a, wireframe: true }),
    );
    cage.position.y = 0.13;
    const bottom = cylinder(0.17, 0.17, 0.02, 0x6f6f6f, 8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 12), mat(0x7a7a7a));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.26;
    const handle = box(0.06, 0.05, 0.55, 0x5a3a22);
    handle.position.set(0, 0.3, 0.45);
    this.noodles = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), this.noodleMat);
    this.noodles.scale.set(1, 0.45, 1);
    this.noodles.position.y = 0.14;
    this.body.add(cage, bottom, ring, handle, this.noodles);
    this.group.add(this.body);
    this.set(null, null, 0);
  }

  set(graded: Grade | null, blanching: number | null, time: number): void {
    this.noodles.visible = graded !== null || blanching !== null;
    this.noodleMat.color.setHex(graded ? NOODLE_COLORS[graded] : RAW_NOODLE_COLOR);
    // Dip and bob while blanching; lift out when done.
    this.body.position.y = blanching !== null ? -0.18 + Math.sin(time * 8) * 0.015 : 0;
  }
}
