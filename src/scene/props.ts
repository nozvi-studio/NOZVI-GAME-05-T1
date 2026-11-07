import * as THREE from 'three';
import { box, cylinder, hitBox, markInteractable, sphere } from './primitives';

/** Local y of a table top surface. */
export const TABLE_TOP = 0.58;
/** Local position of the stool the customer sits on (faces the cart). */
export const SEAT = new THREE.Vector3(0, 0.3, -0.75);

export function buildTable(index: number): THREE.Group {
  const table = markInteractable(new THREE.Group(), `table:${index}`);
  // Red plastic street table: round top with a rolled rim and a flared pedestal.
  const red = new THREE.MeshStandardMaterial({ color: 0xd8352f, roughness: 0.45 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), red);
  top.position.y = 0.55;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 5, 24), red);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.56;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.24, 0.55, 12), red);
  leg.position.y = 0.27;
  for (const m of [top, rim, leg]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  table.add(top, rim, leg);
  // Chopstick cup and a little dish of lime and chili on each table.
  const cup = cylinder(0.04, 0.035, 0.1, 0xe8e2d0, 8);
  cup.position.set(0.25, 0.63, 0.12);
  const dish = cylinder(0.07, 0.05, 0.02, 0xf4f1e8, 10);
  dish.position.set(-0.25, 0.59, 0.15);
  const lime = sphere(0.025, 0x7dbb3c);
  lime.position.set(-0.26, 0.61, 0.15);
  table.add(cup, dish, lime);
  const blue = new THREE.MeshStandardMaterial({ color: 0x2b7bd6, roughness: 0.45 });
  for (const [x, z] of [[0.75, 0], [-0.75, 0], [SEAT.x, SEAT.z]]) {
    const stool = new THREE.Group();
    stool.name = 'stool';
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 14), blue);
    seat.position.y = 0.28;
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.27, 14, 1, true), blue);
    legs.position.y = 0.135;
    for (const m of [seat, legs]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    stool.add(seat, legs);
    stool.position.set(x, 0, z);
    table.add(stool);
  }
  // Generous drop area covering the table and the seated customer.
  const hit = hitBox(1.9, 1.8, 1.9);
  hit.position.set(0, 0.9, -0.3);
  table.add(hit);
  return table;
}

export function buildTrash(): THREE.Group {
  const trash = markInteractable(new THREE.Group(), 'trash');
  const bin = cylinder(0.3, 0.24, 0.7, 0x3d6b3a, 10);
  bin.position.y = 0.35;
  const lid = cylinder(0.32, 0.32, 0.06, 0x2c4f2a, 10);
  lid.position.y = 0.72;
  const knob = box(0.14, 0.05, 0.05, 0x1e3a1d);
  knob.position.y = 0.77;
  trash.add(bin, lid, knob);
  const hit = hitBox(0.85, 1.0, 0.85);
  hit.position.y = 0.45;
  trash.add(hit);
  return trash;
}

/** Background shopfronts so the street does not end in a void. */
export function buildShopfronts(): THREE.Group {
  const g = new THREE.Group();
  const colors = [0xb8865a, 0x9a6b4a, 0xc79a5e, 0x8a5e44, 0xa97a52];
  for (let i = 0; i < 6; i++) {
    const h = 3.5 + ((i * 7) % 4) * 0.6;
    const house = box(4.2, h, 2, colors[i % colors.length]);
    house.position.set(-11 + i * 4.4, h / 2, -15);
    const sign = box(2.6, 0.5, 0.1, i % 2 ? 0xffc65c : 0xe2574c);
    sign.position.set(-11 + i * 4.4, 2.6, -13.95);
    g.add(house, sign);
  }
  return g;
}
