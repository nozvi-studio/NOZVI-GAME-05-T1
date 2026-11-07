import * as THREE from 'three';
import { GARNISHES, TOPPINGS } from '../core/types';
import { BasketView, BowlView, garnishPieces, toppingPieces } from './bowl';
import {
  buildBrothPotModel,
  buildCabinet,
  buildCartLamp,
  buildCounterProps,
  buildWaterPotModel,
  buildWheel,
  steelMat,
} from './cartParts';
import { GARNISH_COLORS } from './palette';
import { box, cylinder, hitBox, markInteractable } from './primitives';
import { Steam } from './steam';

/** Local y of the counter top surface. */
export const COUNTER_TOP = 1.28;

/** Steam and decoration are drawn on this layer so pointer raycasts (layer 0) ignore them. */
export const FX_LAYER = 1;

export interface CartFxState {
  blanching: boolean;
  bowlSteaming: boolean;
}

export interface Cart {
  group: THREE.Group;
  bowl: BowlView;
  basket: BasketView;
  /** Interactable roots on the cart, keyed by interactable name. */
  interactables: Map<string, THREE.Object3D>;
  /** Hint anchors for grouped targets (topping trays, garnish jars). */
  toppingsAnchor: THREE.Object3D;
  garnishesAnchor: THREE.Object3D;
  /** Visual-only animation: steam, boiling bubbles, bulb flicker. */
  update(dt: number, time: number, fx: CartFxState): void;
}

function addHit(root: THREE.Object3D, w: number, h: number, d: number, y: number, z = 0): void {
  const hit = hitBox(w, h, d);
  hit.position.set(0, y, z);
  root.add(hit);
}

/** Puts every sprite of a steam emitter on the FX layer. */
function fxLayer(steam: Steam): Steam {
  steam.group.traverse((o) => o.layers.set(FX_LAYER));
  return steam;
}

function buildTray(t: (typeof TOPPINGS)[number]): THREE.Group {
  const tray = markInteractable(new THREE.Group(), `topping:${t}`);
  // Stainless gastronorm pan with a raised lip.
  const W = 0.52;
  const D = 0.46;
  const pan = new THREE.Mesh(new THREE.BoxGeometry(W, 0.03, D), steelMat(0xb9bec4));
  pan.position.y = 0.015;
  pan.receiveShadow = true;
  tray.add(pan);
  for (const [w, d, x, z] of [[W, 0.02, 0, D / 2], [W, 0.02, 0, -D / 2], [0.02, D, W / 2, 0], [0.02, D, -W / 2, 0]]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), steelMat(0xd0d4d8));
    lip.position.set(x, 0.04, z);
    tray.add(lip);
  }
  const pieces = toppingPieces(t, 14, 0.19);
  pieces.position.y = 0.05;
  tray.add(pieces);
  addHit(tray, 0.6, 0.4, 0.55, 0.15);
  return tray;
}

function buildJar(gn: (typeof GARNISHES)[number]): THREE.Group {
  const jar = markInteractable(new THREE.Group(), `garnish:${gn}`);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.28, 14),
    new THREE.MeshStandardMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false }),
  );
  glass.position.y = 0.14;
  const fillColor = GARNISH_COLORS[gn];
  const content = cylinder(0.15, 0.15, 0.16, fillColor, 12);
  content.position.y = 0.09;
  const top = garnishPieces(gn, 14, 0.13);
  top.position.y = 0.18;
  // Lid colour also tells the jars apart, alongside the DOM labels (not colour-only).
  const lid = cylinder(0.18, 0.18, 0.05, gn === 'pepper' ? 0xb33a2b : gn === 'scallion' ? 0x2e7d32 : 0xd9a441, 12);
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

  // Body: blue painted cabinet, yellow trim, red accent band, stainless counter.
  const body = box(3.4, 0.9, 1.1, 0x2a64a0);
  body.position.y = 0.75;
  const trim = box(3.42, 0.07, 1.12, 0xe8b04a);
  trim.position.y = 1.0;
  const band = box(3.42, 0.12, 1.12, 0xc0392b);
  band.position.y = 0.42;
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.08, 1.5), steelMat(0xb5b2aa));
  counter.position.set(0, 1.24, 0.1);
  counter.receiveShadow = true;
  counter.castShadow = true;
  const edge = box(3.72, 0.03, 0.04, 0xd8d6d0);
  edge.position.set(0, 1.285, 0.85);
  group.add(body, trim, band, counter, edge);

  // Glass display case at the back-left, behind the topping trays.
  const cabinet = buildCabinet();
  cabinet.position.set(-1.15, COUNTER_TOP, -0.42);
  group.add(cabinet);

  // Hanging bulb over the counter, placed in the gap between the left and middle customers.
  const lamp = buildCartLamp(new THREE.Vector3(-1.15, COUNTER_TOP + 0.55, -0.55), new THREE.Vector3(-0.6, 2.75, -0.55));
  group.add(lamp.group);

  group.add(buildCounterProps().translateY(COUNTER_TOP));

  // Broth pot (hold to pour).
  const pot = markInteractable(new THREE.Group(), 'pot');
  pot.add(buildBrothPotModel());
  const potSteam = fxLayer(new Steam(0.3, 4, 0.8, 0.42));
  potSteam.group.position.y = 0.5;
  pot.add(potSteam.group);
  addHit(pot, 0.9, 0.8, 0.9, 0.35);
  add(pot, 0.7, -0.2);

  // Small water pot and the noodle basket that dips into it (hold to blanch, drag to bowl).
  const waterPot = buildWaterPotModel();
  waterPot.group.position.set(1.45, COUNTER_TOP, -0.25);
  const waterSteam = fxLayer(new Steam(0.22, 2, 0.9, 0.4));
  waterSteam.group.position.set(1.45, COUNTER_TOP + 0.38, -0.25);
  group.add(waterPot.group, waterSteam.group);
  const basketView = new BasketView();
  const basket = markInteractable(new THREE.Group(), 'basket');
  basket.add(basketView.group);
  addHit(basket, 0.6, 0.6, 1.0, 0.25, 0.25);
  add(basket, 1.45, -0.25, COUNTER_TOP + 0.3);

  // Bowl in the middle of the counter, in front of the pot.
  const bowlView = new BowlView();
  const bowl = markInteractable(new THREE.Group(), 'bowl');
  bowl.add(bowlView.group);
  const bowlSteam = fxLayer(new Steam(0.2, 0, 0.6, 0.38, 10));
  bowlSteam.group.position.y = 0.22;
  bowl.add(bowlSteam.group);
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

  for (const x of [-1.2, 1.2]) {
    const wheel = buildWheel();
    wheel.position.set(x, 0.32, 0.6);
    group.add(wheel);
  }

  const lampBase = lamp.light.intensity;
  const bubbleBase = waterPot.bubbles.map((b) => b.position.clone());
  const update = (dt: number, time: number, fx: CartFxState) => {
    potSteam.update(dt);
    waterSteam.rate = fx.blanching ? 7 : 2;
    waterSteam.update(dt);
    bowlSteam.rate = fx.bowlSteaming ? 2.5 : 0;
    bowlSteam.update(dt);
    // Rolling boil: faster while blanching.
    const speed = fx.blanching ? 9 : 4;
    waterPot.bubbles.forEach((b, i) => {
      const k = (time * speed * 0.25 + i * 0.37) % 1;
      b.position.set(bubbleBase[i].x + Math.sin(time * 3 + i) * 0.01, bubbleBase[i].y + k * 0.015, bubbleBase[i].z);
      b.scale.setScalar(0.5 + k);
    });
    lamp.light.intensity = lampBase * (0.97 + 0.03 * Math.sin(time * 7.3) * Math.sin(time * 3.1));
  };

  return { group, bowl: bowlView, basket: basketView, interactables, toppingsAnchor, garnishesAnchor, update };
}
