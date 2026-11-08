// Mobile browsers in landscape keep the address bar, which can leave ~260 px of height for the game.
// On touch devices, a user tap ("Bắt đầu" / "Bán lại") asks for fullscreen and, where supported, a landscape lock.
// iOS Safari has no element fullscreen: it silently keeps the short-screen layout.

type LockableOrientation = ScreenOrientation & { lock?: (o: 'landscape') => Promise<void> };

export function enterFullscreenLandscape(): void {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const root = document.documentElement;
  if (!document.fullscreenEnabled || document.fullscreenElement || !root.requestFullscreen) return;
  root
    .requestFullscreen({ navigationUI: 'hide' })
    .then(() => (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape'))
    .catch(() => {
      /* refused or unsupported: keep playing in the browser window */
    });
}
