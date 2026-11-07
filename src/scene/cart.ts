import * as THREE from 'three';
import { GARNISHES, TOPPINGS } from '../core/types';
import { BasketView, BowlView, garnishPieces, toppingPieces } from './bowl';
import { GARNISH_COLORS } from './palette';
import { box, cylinder, hitBox, markInteractable } from './primitives';

/** Local y of the counter top surface. */
export const COUNTER_TOP = 1.28;

export interface Cart {
  group: THREE.Group;
  bowl: BowlView;
  basket: BasketView;
  /** Interactable roots on the cart, keyed by interactable name. */
  interactables: Map<string, THREE.Object3D>;
  /** Hint anchors for grouped targets (topping trays, garnish jars). */
  toppingsAnchor: THREE.Object3D;
  garnishesAnchor: THREE.Object3D;
}

function addHit(root: THREE.Object3D, w: number, h: number, d: number, y: number, z = 0): void {
  const hit = hitBox(w, h, d);
  hit.position.set(0, y, z);
  root.add(hit);
}

function buildTray(t: (typeof TOPPINGS)[number]): THREE.Group {
  const tray = markInteractable(new THREE.Group(), `topping:${t}`);
  const pan = box(0.52, 0.06, 0.46, 0xc7c7c7);
  pan.position.y = 0.03;
  const pieces = toppingPieces(t, 9, 0.18);
  pieces.position.y = 0.08;
  tray.add(pan, pieces);
  addHit(tray, 0.6, 0.4, 0.55, 0.15);
  return tray;
}

function buildJar(gn: (typeof GARNISHES)[number]): THREE.Group {
  const jar = markInteractable(new THREE.Group(), `garnish:${gn}`);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.35 }),
  );
  glass.position.y = 0.14;
  const fillColor = GARNISH_COLORS[gn];
  const content = cylinder(0.15, 0.15, 0.16, fillColor, 10);
  content.position.y = 0.09;
  const top = garnishPieces(gn, 10, 0.12);
  top.position.y = 0.18;
  // Lid colour also tells the jars apart, alongside the DOM labels (not colour-only).
  const lid = cylinder(0.18, 0.18, 0.05, gn === 'pepper' ? 0xb33a2b : gn === 'scallion' ? 0x2e7d32 : 0xd9a441, 10);
  lid.position.y = 0.31;
  jar.add(glass, content, top, lid);
  addHit(jar, 0.48, 0.55, 0.45, 0.2);
  return jar;
}

export function buildCart(): Cart {
  const group = new THREE.Group();
  group.name = 'cart';
  const interactables = new Map<string, THREE.Object3D>();
  const add = (obj: THREE.Object3D, x: number, z: number, y = COUNTER_TOP) => {
    obj.position.set(x, y, z);
    group.add(obj);
    if (obj.userData.interactable) interactables.set(obj.userData.interactable as string, obj);
  };

  const body = box(3.4, 0.9, 1.1, 0x2f6fa8);
  body.position.y = 0.75;
  const trim = box(3.42, 0.08, 1.12, 0xe8b04a);
  trim.position.y = 1.0;
  const counter = box(3.7, 0.08, 1.5, 0xd9c6a5);
  counter.position.set(0, 1.24, 0.1);
  group.add(body, trim, counter);

  // Glass display case at the back-left, behind the topping trays.
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.55, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.3 }),
  );
  glass.position.set(-1.15, COUNTER_TOP + 0.28, -0.42);
  group.add(glass);

  // Broth pot (hold to pour).
  const pot = markInteractable(new THREE.Group(), 'pot');
  const potBody = cylinder(0.4, 0.36, 0.5, 0x9a9a9a, 12);
  potBody.position.y = 0.25;
  const brothTop = cylinder(0.37, 0.37, 0.02, 0xc77f35, 12);
  brothTop.position.y = 0.47;
  const ladle = cylinder(0.03, 0.03, 0.7, 0x6b4a2b, 6);
  ladle.position.set(0.15, 0.6, 0.1);
  ladle.rotation.z = -0.4;
  pot.add(potBody, brothTop, ladle);
  addHit(pot, 0.9, 0.8, 0.9, 0.35);
  add(pot, 0.7, -0.2);

  // Small water pot and the noodle basket that dips into it (hold to blanch, drag to bowl).
  const waterPot = cylinder(0.3, 0.27, 0.36, 0x8d8d8d, 10);
  waterPot.position.set(1.45, COUNTER_TOP + 0.18, -0.25);
  const water = cylinder(0.27, 0.27, 0.02, 0x9fc6d1, 10);
  water.position.set(1.45, COUNTER_TOP + 0.35, -0.25);
  group.add(waterPot, water);
  const basketView = new BasketView();
  const basket = markInteractable(new THREE.Group(), 'basket');
  basket.add(basketView.group);
  addHit(basket, 0.6, 0.6, 1.0, 0.25, 0.25);
  add(basket, 1.45, -0.25, COUNTER_TOP + 0.3);

  // Bowl in the middle of the counter, in front of the pot.
  const bowlView = new BowlView();
  const bowl = markInteractable(new THREE.Group(), 'bowl');
  bowl.add(bowlView.group);
  addHit(bowl, 0.75, 0.45, 0.65, 0.18);
  add(bowl, -0.1, 0.45);

  // Topping trays 2x2 on the left (front row nearest the player).
  const toppingsAnchor = new THREE.Object3D();
  const trayPos: Array<[number, number]> = [[-1.45, 0.05], [-0.85, 0.05], [-1.45, 0.6], [-0.85, 0.6]];
  TOPPINGS.forEach((t, i) => add(buildTray(t), trayPos[i][0], trayPos[i][1]));
  add(toppingsAnchor, -1.15, 0.33, COUNTER_TOP + 0.1);

  // Garnish jars along the front-right edge.
  const garnishesAnchor = new THREE.Object3D();
  GARNISHES.forEach((gn, i) => add(buildJar(gn), 0.45 + i * 0.5, 0.58));
  add(garnishesAnchor, 0.95, 0.58, COUNTER_TOP + 0.2);

  // Awning leans away from the player so it never hides the counter.
  const roof = box(3.9, 0.05, 0.55, 0xc0392b);
  roof.position.set(0, 2.75, -0.55);
  roof.rotation.x = -0.45;
  group.add(roof);
  for (const x of [-1.75, 1.75]) {
    const pole = cylinder(0.03, 0.03, 1.5, 0x555555, 6);
    pole.position.set(x, 2.0, -0.55);
    group.add(pole);
  }
  for (const x of [-1.2, 1.2]) {
    const wheel = cylinder(0.32, 0.32, 0.1, 0x222222, 10);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.32, 0.6);
    group.add(wheel);
  }
  return { group, bowl: bowlView, basket: basketView, interactables, toppingsAnchor, garnishesAnchor };
}
