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
  /** MEC-009: show `n` tables in the layout for that count; hidden tables leave `interactables`. */
  setTableCount(n: number): void;
  /** MEC-009 rule 4: pan the camera along x (height and angle unchanged). */
  setPan(x: number): void;
  /** Widest table edge on each side, for the pan limit. */
  tableEdge(): number;
}

/** MEC-009 rule 2: table positions [x, z] by count, in table-index order (index 0 near the cart). */
export const TABLE_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1.5, 0.2], [1.5, 0.2]],
  3: [[-3.0, 0.7], [0, 0.0], [3.0, 0.7]],
  4: [[-1.5, 0.2], [1.5, 0.2], [-4.5, 0.9], [4.5, 0.9]],
  5: [[-3.0, 0.7], [0, 0.0], [3.0, 0.7], [-6.0, 1.1], [6.0, 1.1]],
};
export const MAX_TABLES = 5;
/** Half-width of a table with its stools and seated customer, for pan limits. */
const TABLE_HALF_WIDTH = 1.1;

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
  for (let i = 0; i < MAX_TABLES; i++) {
    const table = buildTable(i);
    tables.push(table);
    scene.add(table);
  }
  let count = 0;
  const setTableCount = (n: number) => {
    count = Math.max(1, Math.min(MAX_TABLES, n));
    const layout = TABLE_LAYOUTS[count];
    tables.forEach((table, i) => {
      const name = table.userData.interactable as string;
      const on = i < count;
      table.visible = on;
      if (on) {
        table.position.set(layout[i][0], 0.1, layout[i][1]);
        interactables.set(name, table);
      } else interactables.delete(name);
    });
  };
  setTableCount(3);

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
  const setPan = (x: number) => {
    camera.position.x = x;
    camera.updateMatrixWorld();
  };
  const tableEdge = () => Math.max(...TABLE_LAYOUTS[count].map(([x]) => Math.abs(x))) + TABLE_HALF_WIDTH;

  return { scene, camera, cart, tables, trash, interactables, update, setTableCount, setPan, tableEdge };
}
