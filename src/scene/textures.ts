import * as THREE from 'three';

// Procedural canvas textures (GDD §10: no external art assets). Each is built once and shared.

const cache = new Map<string, THREE.Texture>();

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb = true): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Tiny deterministic PRNG so textures look the same every load. */
function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Soft round glow for light halos (used with additive blending). */
export function glowTexture(): THREE.Texture {
  return canvasTexture('glow', 128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Wispy puff for steam particles. */
export function steamTexture(): THREE.Texture {
  return canvasTexture('steam', 128, (ctx, s) => {
    const rnd = prng(7);
    for (let i = 0; i < 9; i++) {
      const x = s * (0.3 + rnd() * 0.4);
      const y = s * (0.3 + rnd() * 0.4);
      const r = s * (0.15 + rnd() * 0.18);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
  });
}

/** Square sidewalk tiles with grout lines and slight colour variation. */
export function sidewalkTexture(): THREE.Texture {
  const tex = canvasTexture('sidewalk', 256, (ctx, s) => {
    const rnd = prng(11);
    const n = 4;
    const cell = s / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 96 + Math.floor(rnd() * 20);
        ctx.fillStyle = `rgb(${v + 6},${v + 2},${v - 4})`;
        ctx.fillRect(x * cell, y * cell, cell, cell);
        // Speckles.
        for (let k = 0; k < 40; k++) {
          const d = Math.floor(rnd() * 30) - 15;
          ctx.fillStyle = `rgba(${v + d},${v + d - 6},${v + d - 14},0.5)`;
          ctx.fillRect(x * cell + rnd() * cell, y * cell + rnd() * cell, 2, 2);
        }
      }
    }
    ctx.strokeStyle = 'rgba(40,30,24,0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, s);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(s, i * cell);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Dark speckled asphalt. */
export function asphaltTexture(): THREE.Texture {
  const tex = canvasTexture('asphalt', 256, (ctx, s) => {
    const rnd = prng(23);
    ctx.fillStyle = '#2b2a2e';
    ctx.fillRect(0, 0, s, s);
    for (let k = 0; k < 2500; k++) {
      const v = 30 + Math.floor(rnd() * 40);
      ctx.fillStyle = `rgba(${v},${v},${v + 4},0.6)`;
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Classic street-stall bowl: white glaze, blue bands and a simple leaf motif (wraps around the shell). */
export function bowlTexture(): THREE.Texture {
  return canvasTexture('bowl', 256, (ctx, s) => {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#2f5fa8';
    // UV v=1 is the rim (top of the canvas).
    ctx.fillRect(0, s * 0.06, s, s * 0.05);
    ctx.fillRect(0, s * 0.82, s, s * 0.03);
    ctx.strokeStyle = '#2f5fa8';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const cx = (i + 0.5) * (s / 4);
      ctx.beginPath();
      ctx.ellipse(cx, s * 0.45, s * 0.07, s * 0.16, 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.05, s * 0.6);
      ctx.lineTo(cx + s * 0.05, s * 0.3);
      ctx.stroke();
    }
  });
}
