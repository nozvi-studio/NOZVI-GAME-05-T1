import * as THREE from 'three';

// GDD §10: warm low-poly look, built from primitives only.
export const mat = (color: number) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });

export function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(rTop: number, rBottom: number, h: number, color: number, segments = 8): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function sphere(r: number, color: number, detail = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(color));
  mesh.castShadow = true;
  return mesh;
}

const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

/**
 * Invisible box that enlarges the tap area of an interactable (phone landscape).
 * Raycasting ignores material visibility, so it still receives hits.
 */
export function hitBox(w: number, h: number, d: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMaterial);
  mesh.name = 'hit';
  return mesh;
}

/** Marks a root object as an interactable (ARCHITECTURE §5). */
export function markInteractable<T extends THREE.Object3D>(obj: T, name: string): T {
  obj.userData.interactable = name;
  obj.name = name;
  return obj;
}

/** Free per-instance geometries of a removed subtree (materials may be shared, so they are kept). */
export function disposeGeometries(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });
}
