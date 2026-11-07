import * as THREE from 'three';
import { glowTexture, steamTexture } from './textures';

interface Puff {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  age: number;
  life: number;
  vx: number;
  vz: number;
  size: number;
}

/**
 * Pooled steam emitter (GDD §6 "steam puff"). Visual only: no gameplay state.
 * `rate` is puffs per second; 0 lets the remaining puffs fade out.
 */
export class Steam {
  readonly group = new THREE.Group();
  rate: number;
  private puffs: Puff[] = [];
  private acc = 0;
  private next = 0;
  private seed = 1;

  constructor(
    private radius: number,
    rate: number,
    private rise = 0.9,
    private maxOpacity = 0.32,
    pool = 14,
  ) {
    this.rate = rate;
    for (let i = 0; i < pool; i++) {
      const material = new THREE.SpriteMaterial({
        map: steamTexture(),
        color: 0xf3ece2,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.renderOrder = 2;
      this.group.add(sprite);
      this.puffs.push({ sprite, material, age: 0, life: 0, vx: 0, vz: 0, size: 0.3 });
    }
  }

  private rand(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  update(dt: number): void {
    this.acc += dt * this.rate;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.emit();
    }
    for (const p of this.puffs) {
      if (!p.sprite.visible) continue;
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        p.sprite.visible = false;
        continue;
      }
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.z += p.vz * dt;
      p.sprite.position.y += this.rise * dt * (1 - k * 0.5);
      const s = p.size * (0.6 + k * 1.4);
      p.sprite.scale.set(s, s, 1);
      // Fade in fast, fade out slowly.
      p.material.opacity = this.maxOpacity * Math.min(1, k * 5) * (1 - k);
      p.material.rotation += dt * 0.4;
    }
  }

  private emit(): void {
    const p = this.puffs[this.next];
    this.next = (this.next + 1) % this.puffs.length;
    const a = this.rand() * Math.PI * 2;
    const r = this.radius * Math.sqrt(this.rand());
    p.sprite.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    p.vx = (this.rand() - 0.5) * 0.12;
    p.vz = (this.rand() - 0.5) * 0.12;
    p.age = 0;
    p.life = 1.4 + this.rand() * 0.9;
    p.size = this.radius * (1.5 + this.rand() * 1.0);
    p.material.rotation = this.rand() * Math.PI * 2;
    p.sprite.visible = true;
  }
}

/** Additive halo sprite that fakes bloom around a light bulb. */
export function glow(color: number, size: number, opacity = 0.8): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = 3;
  return sprite;
}

/** Emissive bulb with a halo. */
export function bulb(color: number, radius: number, haloSize: number): THREE.Group {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 10, 8),
    new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
  g.add(mesh, glow(color, haloSize));
  return g;
}
