import * as THREE from 'three';
import { box, cylinder, mat } from './primitives';
import { bulb, glow } from './steam';
import { asphaltTexture, sidewalkTexture } from './textures';

// Night street mood (GDD §10): cool moonlit fill, warm pools of light from the street lamp,
// the cart bulb and a festoon string over the tables. Decoration only: nothing here is interactable.

export const NIGHT_SKY = 0x0d0b12;

export interface Atmosphere {
  /** Gentle flicker of the warm bulbs. */
  update(time: number): void;
}

export function addLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(NIGHT_SKY);
  scene.fog = new THREE.Fog(NIGHT_SKY, 11, 24);

  scene.add(new THREE.HemisphereLight(0x4a5a92, 0x1c130d, 0.38));

  // Warm key from the street lamp's direction: the only shadow caster (cheap on phones).
  const key = new THREE.DirectionalLight(0xffb873, 0.6);
  key.position.set(-5, 9, 1);
  key.target.position.set(0.5, 0, 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  const cam = key.shadow.camera;
  cam.left = -7;
  cam.right = 7;
  cam.top = 7;
  cam.bottom = -7;
  cam.near = 1;
  cam.far = 25;
  scene.add(key, key.target);

  // Cool rim from behind so silhouettes separate from the dark street.
  const rim = new THREE.DirectionalLight(0x7f9ad8, 0.45);
  rim.position.set(3, 6, -8);
  scene.add(rim);
}

export function buildGround(): THREE.Group {
  const g = new THREE.Group();

  const sidewalkTex = sidewalkTexture().clone();
  sidewalkTex.repeat.set(15, 4);
  sidewalkTex.needsUpdate = true;
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.2, 8),
    new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.92 }),
  );
  sidewalk.position.set(0, 0, 1);
  sidewalk.receiveShadow = true;

  const curb = box(30, 0.22, 0.25, 0x6f6a66);
  curb.position.set(0, 0.0, -3.0);
  curb.castShadow = false;

  const roadTex = asphaltTexture().clone();
  roadTex.repeat.set(10, 3.3);
  roadTex.needsUpdate = true;
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.1, 10),
    new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.85 }),
  );
  road.position.set(0, -0.05, -8);
  road.receiveShadow = true;
  g.add(sidewalk, curb, road);

  // Lane dashes and a couple of rain puddles that catch the warm light.
  for (let i = 0; i < 7; i++) {
    const stripe = box(1.6, 0.02, 0.14, 0xcfc6a2);
    stripe.castShadow = false;
    stripe.position.set(-14 + i * 4.6, 0.01, -8);
    g.add(stripe);
  }
  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x3a4258, roughness: 0.08, metalness: 0 });
  for (const [x, z, s] of [[-2.2, -5.2, 1.0], [4.2, -6.4, 0.7], [-6.5, -4.6, 0.6]] as const) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(s, 14), puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.set(1.6, 1, 1);
    puddle.position.set(x, 0.012, z);
    puddle.receiveShadow = true;
    g.add(puddle);
  }
  return g;
}

/** Simple parked scooter (side view along x), muted so it stays in the background. */
function buildMotorbike(color: number): THREE.Group {
  const g = new THREE.Group();
  const tireMat = mat(0x151515);
  for (const x of [-0.5, 0.5]) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.065, 5, 12), tireMat);
    tire.position.set(x, 0.27, 0);
    tire.castShadow = true;
    const hub = cylinder(0.07, 0.07, 0.1, 0x8a8a8a, 8);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, 0.27, 0);
    g.add(tire, hub);
  }
  const rear = box(0.62, 0.3, 0.3, color);
  rear.position.set(-0.32, 0.55, 0);
  const seat = box(0.58, 0.08, 0.26, 0x1f1a17);
  seat.position.set(-0.28, 0.74, 0);
  const floor = box(0.42, 0.06, 0.26, 0x2a2a2a);
  floor.position.set(0.12, 0.34, 0);
  const shield = box(0.09, 0.62, 0.3, color);
  shield.position.set(0.42, 0.62, 0);
  shield.rotation.z = -0.25;
  const fender = box(0.3, 0.06, 0.16, color);
  fender.position.set(0.52, 0.5, 0);
  const bar = cylinder(0.018, 0.018, 0.55, 0x2a2a2a, 5);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.55, 0.98, 0);
  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  headlight.position.set(0.6, 0.9, 0);
  g.add(rear, seat, floor, shield, fender, bar, headlight);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.12), new THREE.MeshBasicMaterial({ color: 0xff3b2f, toneMapped: false }));
  tail.position.set(-0.64, 0.62, 0);
  g.add(tail);
  return g;
}

function buildStreetLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const pole = cylinder(0.06, 0.09, 4.5, 0x2d2d30, 6);
  pole.position.y = 2.25;
  const arm = box(0.9, 0.06, 0.06, 0x2d2d30);
  arm.position.set(0.45, 4.45, 0);
  const head = box(0.5, 0.12, 0.25, 0x2d2d30);
  head.position.set(0.8, 4.4, 0);
  const lens = bulb(0xffc27a, 0.1, 2.4);
  lens.position.set(0.8, 4.3, 0);
  const light = new THREE.PointLight(0xffa14d, 45, 12, 1.7);
  light.position.set(0.8, 4.2, 0);
  lamp.add(pole, arm, head, lens, light);
  return lamp;
}

/** Festoon string of bulbs over the tables, hung between two thin poles just off-screen. */
function buildFestoon(): { group: THREE.Group; bulbs: THREE.Sprite[]; light: THREE.PointLight } {
  const g = new THREE.Group();
  const halfSpan = 5;
  const topY = 3.35;
  const sag = 0.65;
  const z = 0.9;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = -halfSpan + t * halfSpan * 2;
    points.push(new THREE.Vector3(x, topY - sag * 4 * t * (1 - t), z));
  }
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x151210 })));
  const colors = [0xffd27a, 0xffb05c, 0xfff0c8, 0xff8a5c];
  const halos: THREE.Sprite[] = [];
  for (let i = 1; i < 16; i++) {
    const t = i / 16;
    const x = -halfSpan + t * halfSpan * 2;
    const b = bulb(colors[i % colors.length], 0.045, 0.55);
    b.position.set(x, topY - sag * 4 * t * (1 - t) - 0.07, z);
    halos.push(b.children[1] as THREE.Sprite);
    g.add(b);
  }
  for (const x of [-halfSpan, halfSpan]) {
    const pole = cylinder(0.04, 0.05, topY, 0x2d2d30, 6);
    pole.position.set(x, topY / 2, z);
    g.add(pole);
  }
  const light = new THREE.PointLight(0xffc27a, 22, 9, 1.4);
  light.position.set(0, topY - sag - 0.3, z - 0.4);
  g.add(light);
  return { group: g, bulbs: halos, light };
}

export function buildStreetDecor(scene: THREE.Scene): Atmosphere {
  const lamp = buildStreetLamp();
  lamp.position.set(-4.6, 0.1, -0.6);
  scene.add(lamp);

  const festoon = buildFestoon();
  scene.add(festoon.group);

  // Parked motorbikes along the curb, placed clear of the customers' walking paths.
  for (const [x, color] of [[-1.7, 0x9b3a33], [6.6, 0x3d5f86], [-7.4, 0x4a4a4a]] as const) {
    const bike = buildMotorbike(color);
    bike.position.set(x, 0, -3.65);
    bike.rotation.y = x < 0 ? 0.08 : Math.PI - 0.08;
    scene.add(bike);
  }

  // Faint distant lights so the top of the frame is not a flat void on wide screens.
  for (let i = 0; i < 6; i++) {
    const g = glow(i % 2 ? 0xff9e5e : 0xffd38a, 1.6, 0.35);
    g.position.set(-12 + i * 4.8, 2.2, -13.5);
    scene.add(g);
  }

  const baseIntensity = festoon.light.intensity;
  return {
    update(time: number) {
      festoon.light.intensity = baseIntensity * (0.96 + 0.04 * Math.sin(time * 2.3) * Math.sin(time * 5.1));
      festoon.bulbs.forEach((s, i) => {
        s.material.opacity = 0.72 + 0.12 * Math.sin(time * 3 + i * 1.7);
      });
    },
  };
}
