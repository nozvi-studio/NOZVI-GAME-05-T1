import * as THREE from 'three';
import { box, cylinder, hitBox, markInteractable } from './primitives';

/** Local y of a table top surface. */
export const TABLE_TOP = 0.58;
/** Local position of the stool the customer sits on (faces the cart). */
export const SEAT = new THREE.Vector3(0, 0.3, -0.75);

export function buildTable(index: number): THREE.Group {
  const table = markInteractable(new THREE.Group(), `table:${index}`);
  const top = cylinder(0.45, 0.45, 0.05, 0xd64545, 12);
  top.position.y = 0.55;
  const leg = cylinder(0.08, 0.2, 0.55, 0xd64545, 8);
  leg.position.y = 0.27;
  table.add(top, leg);
  for (const [x, z] of [[0.75, 0], [-0.75, 0], [SEAT.x, SEAT.z]]) {
    const stool = cylinder(0.18, 0.2, 0.3, 0x2b7bd6, 8);
    stool.name = 'stool';
    stool.position.set(x, 0.15, z);
    table.add(stool);
  }
  // Generous drop area covering the table and the seated customer.
  const hit = hitBox(1.9, 1.8, 1.9);
  hit.position.set(0, 0.9, -0.3);
  table.add(hit);
  return table;
}

export function buildLamp(): THREE.Group {
  const lamp = new THREE.Group();
  const pole = cylinder(0.06, 0.08, 4.5, 0x3a3a3a, 6);
  pole.position.y = 2.25;
  const head = box(0.5, 0.12, 0.25, 0x3a3a3a);
  head.position.set(0.25, 4.5, 0);
  const light = new THREE.PointLight(0xffb259, 30, 14, 1.6);
  light.position.set(0.4, 4.3, 0);
  light.castShadow = true;
  lamp.add(pole, head, light);
  return lamp;
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
