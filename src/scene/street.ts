import * as THREE from 'three';
import { buildCart, type Cart } from './cart';
import { box } from './primitives';
import { buildLamp, buildShopfronts, buildTable, buildTrash } from './props';

export interface StreetScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cart: Cart;
  tables: THREE.Group[];
  trash: THREE.Group;
  /** Every interactable root (ARCHITECTURE §5), keyed by name. */
  interactables: Map<string, THREE.Object3D>;
}

export function createStreetScene(aspect: number): StreetScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b1410);
  scene.fog = new THREE.Fog(0x1b1410, 14, 30);

  scene.add(new THREE.HemisphereLight(0xffd9a8, 0x2a1d14, 0.9));
  const moon = new THREE.DirectionalLight(0xffe2bf, 0.6);
  moon.position.set(4, 8, 6);
  moon.castShadow = true;
  scene.add(moon);

  const road = box(30, 0.1, 10, 0x2e2e33);
  road.position.set(0, -0.05, -8);
  const sidewalk = box(30, 0.2, 8, 0x8c7b6a);
  sidewalk.position.set(0, 0, 1);
  scene.add(road, sidewalk, buildShopfronts());
  for (let i = 0; i < 6; i++) {
    const stripe = box(1.6, 0.02, 0.15, 0xd8d0b0);
    stripe.position.set(-12 + i * 5, 0.01, -8);
    scene.add(stripe);
  }

  const interactables = new Map<string, THREE.Object3D>();

  const cart = buildCart();
  cart.group.position.set(0, 0.1, 3);
  scene.add(cart.group);
  for (const [name, obj] of cart.interactables) interactables.set(name, obj);

  const tables: THREE.Group[] = [];
  const tablePos: Array<[number, number]> = [[-3.0, 0.7], [0, 0.0], [3.0, 0.7]];
  tablePos.forEach(([x, z], i) => {
    const table = buildTable(i);
    table.position.set(x, 0.1, z);
    tables.push(table);
    scene.add(table);
    interactables.set(table.userData.interactable as string, table);
  });

  const trash = buildTrash();
  trash.position.set(2.5, 0.1, 3.2);
  scene.add(trash);
  interactables.set('trash', trash);

  const lamp = buildLamp();
  lamp.position.set(-4.6, 0.1, -0.6);
  scene.add(lamp);

  // Camera stands behind the cart, tilted down toward the tables (GDD §3).
  const camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
  camera.position.set(0, 5.3, 6.3);
  camera.lookAt(0, 0.7, 1.4);

  return { scene, camera, cart, tables, trash, interactables };
}
