/** Vertical field of view of the fixed street camera (GDD §3). */
export const BASE_FOV = 46;
/** Phone landscape: a narrower view frames the cart a little closer so labels and tap targets grow (VIS-502). */
export const PHONE_FOV = 41;

/**
 * Camera FOV for a viewport in CSS px. Only short, wide screens (phones held sideways) zoom in;
 * tablets and desktops keep the base framing (tablet support is out of scope for now).
 */
export function cameraFov(width: number, height: number): number {
  const phoneLandscape = height < 480 && width / height >= 1.6;
  return phoneLandscape ? PHONE_FOV : BASE_FOV;
}
