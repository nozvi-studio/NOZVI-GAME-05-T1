import { describe, expect, it } from 'vitest';
import { BASE_FOV, PHONE_FOV, cameraFov } from '../src/scene/framing';
import { shouldAskRotate } from '../src/ui/rotatePrompt';

// VIS-501: phone held upright gets a "rotate" popup. Tablets and desktops never do.
describe('shouldAskRotate', () => {
  it('asks a touch phone held in portrait', () => {
    expect(shouldAskRotate({ coarsePointer: true, shortSide: 390, portrait: true })).toBe(true);
  });

  it('does not ask once the phone is landscape', () => {
    expect(shouldAskRotate({ coarsePointer: true, shortSide: 390, portrait: false })).toBe(false);
  });

  it('does not ask on a tablet (short side 600 px or more)', () => {
    expect(shouldAskRotate({ coarsePointer: true, shortSide: 744, portrait: true })).toBe(false);
    expect(shouldAskRotate({ coarsePointer: true, shortSide: 600, portrait: true })).toBe(false);
  });

  it('does not ask on a mouse device, even in a narrow portrait window', () => {
    expect(shouldAskRotate({ coarsePointer: false, shortSide: 390, portrait: true })).toBe(false);
  });
});

// VIS-502: phone landscape frames the cart a little closer than the base camera.
describe('cameraFov', () => {
  it('zooms in on phone landscape sizes', () => {
    for (const [w, h] of [[844, 390], [932, 430], [740, 360], [667, 375]] as const) {
      expect(cameraFov(w, h)).toBe(PHONE_FOV);
    }
  });

  it('keeps the base camera on desktop and tablet-like sizes', () => {
    for (const [w, h] of [[1480, 1220], [1280, 720], [1024, 768], [1366, 1024]] as const) {
      expect(cameraFov(w, h)).toBe(BASE_FOV);
    }
  });

  it('keeps the base camera for a short but nearly square window', () => {
    expect(cameraFov(500, 450)).toBe(BASE_FOV);
  });

  it('zooms in, never out', () => {
    expect(PHONE_FOV).toBeLessThan(BASE_FOV);
  });
});
