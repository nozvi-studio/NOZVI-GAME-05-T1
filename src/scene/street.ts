import * as THREE from 'three';
import { addLights, buildGround, buildStreetDecor } from './atmosphere';
import { buildCart, FX_LAYER, type Cart, type CartFxState } from './cart';
import { buildShopfronts, buildTable, buildTrash } from './props';

export interface StreetScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cart: Cart;
  tables: THREE.Group[];
  trash: THREE.Group;
  /** Every interactable root (ARCHITECTURE §5), keyed by name. */
  interactables: Map<string, THREE.Object3D>;
  /** Visual-only animation (steam, bulbs); never touches gameplay state. */
  update(dt: number, time: number, fx: CartFxState): void;
}

export function createStreetScene(aspect: number): StreetScene {
  const scene = new THREE.Scene();
  addLights(scene);
  scene.add(buildGround(), buildShopfronts());
  const decor = buildStreetDecor(scene);

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

  // Camera stands behind the cart, tilted down toward the tables (GDD §3).
  const camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
  camera.position.set(0, 5.3, 6.3);
  camera.lookAt(0, 0.7, 1.4);
  camera.layers.enable(FX_LAYER);

  const update = (dt: number, time: number, fx: CartFxState) => {
    cart.update(dt, time, fx);
    decor.update(time);
  };

  return { scene, camera, cart, tables, trash, interactables, update };
}
