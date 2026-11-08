import * as THREE from 'three';
import { Game } from './game';
import { STR } from './ui';

// Thin bootstrap (ARCHITECTURE §2): renderer, Game, loop.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Filmic tone mapping keeps the warm bulbs bright without washing out the night scene (GDD §10).
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const game = new Game(renderer, document.body);
const resize = () => game.resize(window.innerWidth, window.innerHeight);
resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

// ARCHITECTURE §6: lost WebGL context → reload prompt.
renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  if (window.confirm(STR.webglLost)) window.location.reload();
});

let last = performance.now();
renderer.setAnimationLoop((now: number) => {
  const dt = (now - last) / 1000;
  last = now;
  game.frame(dt);
});
