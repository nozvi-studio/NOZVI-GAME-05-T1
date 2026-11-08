/** Bottom edge of the HUD bar in CSS px; it shrinks on short screens, so bubbles and captions measure it. */
export function hudBottom(): number {
  return document.querySelector('.htg-hud')?.getBoundingClientRect().bottom ?? 50;
}
