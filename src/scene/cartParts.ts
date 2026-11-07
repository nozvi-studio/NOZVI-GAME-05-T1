import * as THREE from 'three';
import { box, cylinder, mat } from './primitives';
import { bulb } from './steam';
import { noodleNest } from './bowl';

// Decorative cart parts (GDD §10). Interactable roots and hit boxes stay in cart.ts.

/** Brushed stainless look without an environment map: light grey, low roughness, smooth shading. */
export const steelMat = (color = 0xc3c7cc) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.32 });

function steelCylinder(rTop: number, rBottom: number, h: number, segments = 18, color?: number, open = false): THREE.Mesh {
  const material = steelMat(color);
  if (open) material.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, open), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function torus(r: number, tube: number, color: number | THREE.Material, segments = 18): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, segments), typeof color === 'number' ? mat(color) : color);
  m.rotation.x = Math.PI / 2;
  m.castShadow = true;
  return m;
}

/** Big stock pot with simmering broth, floating daikon and bones, and a ladle. */
export function buildBrothPotModel(): THREE.Group {
  const g = new THREE.Group();
  const body = steelCylinder(0.4, 0.37, 0.5, 18, undefined, true);
  body.position.y = 0.25;
  const rim = torus(0.4, 0.022, steelMat(0xd6d9dd));
  rim.position.y = 0.5;
  const band = torus(0.385, 0.012, steelMat(0x9ea3a9));
  band.position.y = 0.16;
  g.add(body, rim, band);
  for (const x of [-0.43, 0.43]) {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.014, 5, 10, Math.PI), steelMat(0x9ea3a9));
    handle.rotation.set(0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
    handle.position.set(x, 0.42, 0);
    g.add(handle);
  }

  const broth = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 20),
    new THREE.MeshStandardMaterial({ color: 0xc8903e, roughness: 0.08, metalness: 0.1 }),
  );
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.46;
  g.add(broth);
  // Daikon chunks, a pork bone and fat droplets on the surface.
  for (let i = 0; i < 5; i++) {
    const a = i * 2.3 + 0.4;
    const r = 0.12 + (i % 3) * 0.07;
    const chunk = box(0.07, 0.04, 0.07, 0xf1ead4);
    chunk.position.set(Math.cos(a) * r, 0.47, Math.sin(a) * r);
    chunk.rotation.y = a;
    g.add(chunk);
  }
  const bone = cylinder(0.035, 0.035, 0.22, 0xe8d9b8, 6);
  bone.rotation.z = Math.PI / 2;
  bone.rotation.y = 0.7;
  bone.position.set(-0.12, 0.475, 0.1);
  g.add(bone);
  const fatMat = new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 10; i++) {
    const a = i * 2.39996;
    const r = 0.06 + 0.28 * ((i * 37) % 10) / 10;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.012 + (i % 3) * 0.008, 7), fatMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(Math.cos(a) * r, 0.463, Math.sin(a) * r);
    g.add(dot);
  }

  // Ladle resting against the rim.
  const ladle = new THREE.Group();
  const stick = cylinder(0.018, 0.018, 0.75, 0x9ea3a9, 6);
  stick.position.y = 0.37;
  const cup = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steelMat());
  cup.position.y = 0.02;
  ladle.add(stick, cup);
  ladle.position.set(0.18, 0.38, 0.12);
  ladle.rotation.z = -0.45;
  ladle.rotation.x = 0.2;
  g.add(ladle);
  return g;
}

/** Smaller pot of boiling water for blanching, with bubbles that can be animated. */
export function buildWaterPotModel(): { group: THREE.Group; bubbles: THREE.Mesh[] } {
  const g = new THREE.Group();
  const body = steelCylinder(0.3, 0.27, 0.36, 16, undefined, true);
  body.position.y = 0.18;
  const rim = torus(0.3, 0.018, steelMat(0xd6d9dd), 16);
  rim.position.y = 0.36;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 18),
    new THREE.MeshStandardMaterial({ color: 0xa9cbd2, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.9 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.345;
  g.add(body, rim, water);
  const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xe8f6f8, roughness: 0.1, transparent: true, opacity: 0.8 });
  const bubbles: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), bubbleMat);
    const a = i * 2.39996;
    const r = 0.05 + 0.18 * ((i * 37) % 10) / 10;
    b.position.set(Math.cos(a) * r, 0.35, Math.sin(a) * r);
    bubbles.push(b);
    g.add(b);
  }
  return { group: g, bubbles };
}

/**
 * Glass display cabinet with an aluminium frame, noodle bundles on the shelf and a warm tube light.
 * Size 1.15 × 0.55 × 0.4, origin at its bottom centre.
 */
export function buildCabinet(): THREE.Group {
  const g = new THREE.Group();
  const W = 1.15;
  const H = 0.55;
  const D = 0.4;
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, D),
    new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }),
  );
  glass.position.y = H / 2;
  glass.renderOrder = 1;
  g.add(glass);
  const frame = 0xb7bcc2;
  const t = 0.025;
  for (const y of [0, H]) {
    for (const z of [-D / 2, D / 2]) {
      const e = box(W, t, t, frame);
      e.position.set(0, y, z);
      g.add(e);
    }
    for (const x of [-W / 2, W / 2]) {
      const e = box(t, t, D, frame);
      e.position.set(x, y, 0);
      g.add(e);
    }
  }
  for (const x of [-W / 2, W / 2]) {
    for (const z of [-D / 2, D / 2]) {
      const e = box(t, H, t, frame);
      e.position.set(x, H / 2, z);
      g.add(e);
    }
  }
  // Bundles of fresh rice noodles and a pile of bean sprouts inside.
  const noodleMat = new THREE.MeshStandardMaterial({ color: 0xf8f1dc, roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const nest = noodleNest(0.1, 0.05, noodleMat, 8);
    nest.position.set(-0.36 + i * 0.22, 0.04, 0);
    g.add(nest);
  }
  const herbs = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), mat(i % 2 ? 0x4c9a3a : 0x6fbf4a));
    leaf.scale.set(1.3, 0.5, 1);
    leaf.position.set(0.32 + (i % 3) * 0.06, 0.05 + Math.floor(i / 3) * 0.04, (i % 2) * 0.06 - 0.03);
    herbs.add(leaf);
  }
  g.add(herbs);
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, W * 0.8, 6),
    new THREE.MeshBasicMaterial({ color: 0xfff1d0, toneMapped: false }),
  );
  tube.rotation.z = Math.PI / 2;
  tube.position.set(0, H - 0.04, -D / 2 + 0.05);
  g.add(tube);
  return g;
}

/** Bent pipe from the cabinet with a shaded bulb over the counter. Returns the light so it can flicker. */
export function buildCartLamp(base: THREE.Vector3, bulbAt: THREE.Vector3): { group: THREE.Group; light: THREE.PointLight } {
  const g = new THREE.Group();
  const pipe = 0x3b3b3e;
  const riseH = bulbAt.y + 0.25 - base.y;
  const rise = cylinder(0.022, 0.022, riseH, pipe, 6);
  rise.position.set(base.x, base.y + riseH / 2, base.z);
  const armLen = Math.abs(bulbAt.x - base.x);
  const arm = cylinder(0.02, 0.02, armLen, pipe, 6);
  arm.rotation.z = Math.PI / 2;
  arm.position.set((base.x + bulbAt.x) / 2, base.y + riseH, base.z);
  const cord = cylinder(0.006, 0.006, 0.2, 0x111111, 4);
  cord.position.set(bulbAt.x, bulbAt.y + 0.15, bulbAt.z);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.12, 12, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.5, side: THREE.DoubleSide }),
  );
  shade.position.set(bulbAt.x, bulbAt.y + 0.04, bulbAt.z);
  const b = bulb(0xffd58c, 0.05, 0.9);
  b.position.copy(bulbAt);
  const light = new THREE.PointLight(0xffc27a, 7, 6, 1.4);
  light.position.copy(bulbAt).y -= 0.08;
  g.add(rise, arm, cord, shade, b, light);
  return { group: g, light };
}

/** Spoked cart wheel facing the camera (axis along z). */
export function buildWheel(): THREE.Group {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 18), mat(0x1c1c1c));
  tire.castShadow = true;
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.015, 4, 18), steelMat(0x8d9399));
  const hub = cylinder(0.05, 0.05, 0.1, 0x8d9399, 8);
  hub.rotation.x = Math.PI / 2;
  g.add(tire, rimRing, hub);
  for (let i = 0; i < 6; i++) {
    const spoke = box(0.012, 0.5, 0.012, 0x8d9399);
    spoke.rotation.z = (i / 6) * Math.PI;
    g.add(spoke);
  }
  return g;
}

/** Stack of spare bowls, chopstick cup and a chili sauce bottle (back of the counter). */
export function buildCounterProps(): THREE.Group {
  const g = new THREE.Group();
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35 });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.11, 0.12, 14, 1, true), bowlMat);
    b.position.set(-0.25, 0.06 + i * 0.045, -0.42);
    b.castShadow = true;
    const rim = torus(0.2, 0.008, 0x2f5fa8, 14);
    rim.position.set(-0.25, 0.12 + i * 0.045, -0.42);
    g.add(b, rim);
  }
  const cup = steelCylinder(0.055, 0.05, 0.16, 10);
  cup.position.set(0.1, 0.08, -0.62);
  g.add(cup);
  for (let i = 0; i < 6; i++) {
    const stick = cylinder(0.006, 0.006, 0.3, i % 2 ? 0xd9b98c : 0xc79e6b, 4);
    stick.position.set(0.1 + ((i % 3) - 1) * 0.02, 0.2, -0.62 + (Math.floor(i / 3) - 0.5) * 0.02);
    stick.rotation.z = ((i % 3) - 1) * 0.08;
    g.add(stick);
  }
  const bottle = cylinder(0.04, 0.045, 0.2, 0xc62e1f, 8);
  bottle.position.set(0.2, 0.1, -0.5);
  const cap = cylinder(0.015, 0.03, 0.06, 0x2e7d32, 8);
  cap.position.set(0.2, 0.23, -0.5);
  g.add(bottle, cap);
  return g;
}
