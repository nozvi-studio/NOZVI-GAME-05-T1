import * as THREE from 'three';
import type { Bowl, Garnish, Grade, Topping } from '../core/types';
import { GARNISHES, TOPPINGS } from '../core/types';
import { box, cylinder, mat, sphere } from './primitives';
import { BROTH_COLOR, GARNISH_COLORS, NOODLE_COLORS, RAW_NOODLE_COLOR, TOPPING_COLORS } from './palette';
import { bowlTexture } from './textures';

const BOWL_H = 0.22;
const R_BOTTOM = 0.2; // wider foot: from above the empty bowl reads as a bowl, not a funnel (VIS-201)
const R_TOP = 0.32;

/** Small low-poly pieces for one topping (also used on the counter trays). */
export function toppingPieces(t: Topping, count: number, spread: number): THREE.Group {
  const g = new THREE.Group();
  const color = TOPPING_COLORS[t];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + i * 0.7;
    const r = spread * (0.35 + 0.65 * ((i * 37) % 10) / 10);
    const lift = ((i * 13) % 5) * 0.006;
    let piece: THREE.Object3D;
    if (t === 'pork') {
      // Minced pork: a little crumbly heap.
      piece = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const crumb = sphere(0.022, k === 1 ? 0xb06a3e : color);
        crumb.scale.set(1.2, 0.7, 1);
        crumb.position.set((k - 1) * 0.022, k === 1 ? 0.012 : 0, ((k * 7) % 3 - 1) * 0.012);
        piece.add(crumb);
      }
    } else if (t === 'shrimp') {
      const body = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.016, 5, 8, Math.PI * 1.35), mat(color));
      body.castShadow = true;
      const tail = box(0.02, 0.008, 0.026, 0xd8452b);
      tail.position.set(0.034, -0.012, 0);
      body.add(tail);
      body.rotation.x = -Math.PI / 2;
      piece = body;
    } else if (t === 'liver') {
      piece = box(0.08, 0.018, 0.05, color);
      piece.rotation.z = 0.15;
    } else {
      // Peeled quail egg, cut in half: white with a yolk on top.
      piece = sphere(0.032, color, 1);
      piece.scale.set(1, 0.8, 1.15);
      const yolk = sphere(0.017, 0xf2b632, 1);
      yolk.position.y = 0.022;
      piece.add(yolk);
    }
    piece.position.set(Math.cos(a) * r, lift, Math.sin(a) * r);
    piece.rotation.y += a;
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
    if (gn === 'scallion') {
      // Sliced green onion rings.
      piece = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.008, 4, 7), mat(i % 3 ? color : 0xb8e08a));
      piece.rotation.x = -Math.PI / 2;
    } else if (gn === 'pepper') piece = sphere(0.014, color);
    else {
      piece = cylinder(0.011, 0.011, 0.1, color, 4);
      piece.rotation.z = Math.PI / 2;
    }
    piece.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    piece.rotation.y = a;
    g.add(piece);
  }
  return g;
}

/**
 * A nest of thin rice noodles: overlapping flattened arcs instead of one blob,
 * so the bowl reads as hu tieu at a glance.
 */
export function noodleNest(radius: number, height: number, material: THREE.Material, count = 16): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const k = (i * 7919) % 101 / 101; // deterministic 0..1
    const r = radius * (0.35 + 0.5 * k);
    const arc = Math.PI * (1.1 + 0.8 * ((i * 31) % 17) / 17);
    const strand = new THREE.Mesh(new THREE.TorusGeometry(r, radius * 0.045, 3, 14, arc), material);
    strand.castShadow = true;
    strand.rotation.x = -Math.PI / 2 + (k - 0.5) * 0.5;
    strand.rotation.z = i * 2.4;
    const off = radius * 0.25 * ((i * 13) % 7) / 7;
    strand.position.set(Math.cos(i * 1.7) * off, height * (((i * 11) % 9) / 9), Math.sin(i * 1.7) * off);
    g.add(strand);
  }
  return g;
}

/** Visual of a bowl's contents (MEC-002), driven from a `Bowl` snapshot. */
export class BowlView {
  readonly group = new THREE.Group();
  private noodles: THREE.Group;
  private noodleMat: THREE.MeshStandardMaterial;
  private broth: THREE.Mesh;
  private toppings = new Map<Topping, THREE.Group>();
  private garnishes = new Map<Garnish, THREE.Group>();

  constructor() {
    const shellGeo = new THREE.CylinderGeometry(R_TOP, R_BOTTOM, BOWL_H, 18, 1, true);
    const outer = new THREE.Mesh(
      shellGeo,
      new THREE.MeshStandardMaterial({ map: bowlTexture(), roughness: 0.35, side: THREE.FrontSide }),
    );
    const inner = new THREE.Mesh(
      shellGeo,
      new THREE.MeshStandardMaterial({ color: 0xf4f1e8, emissive: 0x6a6256, roughness: 0.35, side: THREE.BackSide }), // emissive keeps the glaze white in shade (VIS-201)
    );
    for (const m of [outer, inner]) {
      m.position.y = BOWL_H / 2;
      m.castShadow = true;
      m.receiveShadow = true;
    }
    const base = cylinder(R_BOTTOM, R_BOTTOM * 0.85, 0.03, 0xf4f1e8, 18);
    base.position.y = 0.015;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP, 0.013, 5, 24), mat(0x2f5fa8));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = BOWL_H;
    const band = new THREE.Mesh(new THREE.TorusGeometry(R_TOP - 0.025, 0.009, 4, 24), mat(0x2f5fa8));
    band.rotation.x = Math.PI / 2;
    band.position.y = BOWL_H - 0.035;
    this.group.add(outer, inner, base, rim, band);

    this.noodleMat = new THREE.MeshStandardMaterial({ color: NOODLE_COLORS.perfect, roughness: 0.45 });
    this.noodles = noodleNest(0.19, 0.06, this.noodleMat);
    this.noodles.position.y = 0.06;

    const brothMat = new THREE.MeshStandardMaterial({
      color: BROTH_COLOR,
      transparent: true,
      opacity: 0.7,
      roughness: 0.12,
      metalness: 0.1,
    });
    this.broth = new THREE.Mesh(new THREE.CircleGeometry(1, 20), brothMat);
    this.broth.rotation.x = -Math.PI / 2;
    // Fat droplets catching the light (unit coords; the broth disc is scaled to the bowl).
    const fatMat = new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39996;
      const r = 0.25 + 0.6 * ((i * 37) % 10) / 10;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.035 + (i % 3) * 0.015, 8), fatMat);
      dot.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.002);
      this.broth.add(dot);
    }
    this.group.add(this.noodles, this.broth);

    TOPPINGS.forEach((t, i) => {
      const pieces = toppingPieces(t, 4, 0.055);
      const a = (i / TOPPINGS.length) * Math.PI * 2 + 0.4;
      pieces.scale.setScalar(1.4); // readable at phone size (VIS-204)
      pieces.position.set(Math.cos(a) * 0.15, 0.15, Math.sin(a) * 0.15);
      this.toppings.set(t, pieces);
      this.group.add(pieces);
    });
    GARNISHES.forEach((gn) => {
      const pieces = garnishPieces(gn, gn === 'pepper' ? 16 : 11, 0.18);
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

  /** True when the bowl holds hot broth (drives the steam effect). */
  get steaming(): boolean {
    return this.broth.visible;
  }
}

/** Noodle basket next to the broth pot: shows noodles while blanching or when holding a graded batch. */
export class BasketView {
  readonly group = new THREE.Group();
  /** Part that dips into the water while blanching. */
  private body = new THREE.Group();
  private noodles: THREE.Group;
  private noodleMat = new THREE.MeshStandardMaterial({ color: RAW_NOODLE_COLOR, roughness: 0.45 });

  constructor() {
    const cage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.17, 0.26, 10, 2, true),
      new THREE.MeshStandardMaterial({ color: 0xb0b4b8, metalness: 0.5, roughness: 0.4, wireframe: true }),
    );
    cage.position.y = 0.13;
    const bottom = cylinder(0.17, 0.17, 0.02, 0x7d8186, 10);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 5, 16), mat(0x9aa0a6));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.26;
    const handle = cylinder(0.025, 0.03, 0.6, 0x7a4b2a, 6);
    handle.rotation.x = Math.PI / 2 - 0.25;
    handle.position.set(0, 0.34, 0.47);
    const grip = cylinder(0.034, 0.034, 0.16, 0x3a2416, 6);
    grip.rotation.x = Math.PI / 2 - 0.25;
    grip.position.set(0, 0.4, 0.7);
    this.noodles = noodleNest(0.16, 0.09, this.noodleMat, 14);
    this.noodles.position.y = 0.07;
    this.body.add(cage, bottom, ring, handle, grip, this.noodles);
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
