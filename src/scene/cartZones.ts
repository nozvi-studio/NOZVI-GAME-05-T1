import * as THREE from 'three';

// VIS-106: subtle work zones on the counter so the flow (ingredients → cook → assemble) reads at a glance.
// Decoration only: none of these meshes are interactables, so pointer raycasts never hit them.

const zoneMat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });

function pad(y: number, x0: number, x1: number, z0: number, z1: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.006, z1 - z0), zoneMat(color));
  mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  mesh.receiveShadow = true;
  return mesh;
}

/** Cart-local coordinates, same frame as the counter in `buildCart`. `counterTop` is passed in to avoid a circular import. */
export function buildCounterZones(counterTop: number): THREE.Group {
  const y = counterTop + 0.003;
  const g = new THREE.Group();
  g.name = 'counterZones';
  // Ingredients: cool slate under the topping trays and the garnish jars.
  g.add(pad(y, -1.78, -0.52, -0.22, 0.86, 0x62666d));
  g.add(pad(y, 0.32, 1.72, 0.36, 0.84, 0x62666d));
  // Cooking: warm tint under the two pots.
  g.add(pad(y, 0.22, 1.76, -0.62, 0.2, 0x82695a));
  // Assembly: a ring where the bowl rests (also a clear drop target for the noodle basket).
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.014, 4, 32), zoneMat(0xe8dcc0));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(-0.1, y + 0.004, 0.43);
  g.add(ring);
  return g;
}
