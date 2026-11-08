import * as THREE from 'three';

export interface PointerHandlers {
  press(name: string): void;
  release(name: string): void;
  tap(name: string): void;
  drop(source: string, target: string | null): void;
  /** MEC-009 rule 5: drag or swipe on empty space; `dx` in CSS px since the last move. */
  pan?(dx: number): void;
}

export interface PointerOptions {
  /** Whether a press on `name` may turn into a drag (e.g. basket only when it holds noodles). */
  canDrag(name: string): boolean;
  /** World height of the plane the dragged object follows. */
  dragHeight: number;
}

interface Active {
  pointerId: number;
  /** Interactable name, or '' for a pan gesture on empty space. */
  name: string;
  lastX: number;
  lastY: number;
  x0: number;
  y0: number;
  dragging: boolean;
  ghost: THREE.Object3D | null;
  ghostOrigin: THREE.Vector3;
}

const DRAG_THRESHOLD_PX = 10;

/** Finds the interactable name of a hit by walking up parents (ARCHITECTURE §5). */
function interactableOf(obj: THREE.Object3D | null): THREE.Object3D | null {
  for (let o = obj; o; o = o.parent) if (typeof o.userData.interactable === 'string') return o;
  return null;
}

/**
 * Pointer Events (mouse + touch) → raycast over named interactables.
 * Emits press / release / tap / drop; moves the dragged object under the pointer as a ghost.
 */
export class PointerInput {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hitPoint = new THREE.Vector3();
  private active: Active | null = null;
  private listeners: Array<[string, (e: PointerEvent) => void]> = [];

  constructor(
    private dom: HTMLElement,
    private camera: THREE.Camera,
    private interactables: Map<string, THREE.Object3D>,
    private handlers: PointerHandlers,
    private options: PointerOptions,
  ) {
    dom.style.touchAction = 'none';
    this.plane.constant = -options.dragHeight;
    this.listen('pointerdown', (e) => this.onDown(e));
    this.listen('pointermove', (e) => this.onMove(e));
    this.listen('pointerup', (e) => this.onUp(e, false));
    this.listen('pointercancel', (e) => this.onUp(e, true));
    this.listen('lostpointercapture', (e) => this.onUp(e, true));
  }

  /** Name currently being dragged, if any (a pan gesture is not a drag). */
  get dragging(): string | null {
    return this.active?.dragging && this.active.name ? this.active.name : null;
  }

  /** Pointer x (CSS px, relative to the canvas) while an object is dragged; used for edge auto-pan. */
  get dragPointerX(): number | null {
    const a = this.active;
    if (!a?.dragging || !a.name) return null;
    return a.lastX - this.dom.getBoundingClientRect().left;
  }

  /** Re-places the dragged object under the pointer after the camera moved (auto-pan). */
  refreshDrag(): void {
    const a = this.active;
    if (a?.dragging && a.name) this.moveGhost(a, a.lastX, a.lastY);
  }

  dispose(): void {
    this.cancel();
    for (const [type, fn] of this.listeners) this.dom.removeEventListener(type, fn as EventListener);
    this.listeners = [];
  }

  /** Ends any hold or drag without emitting a drop (e.g. on restart). */
  cancel(): void {
    const a = this.active;
    if (!a) return;
    this.active = null;
    if (!a.name) return;
    this.restoreGhost(a);
    this.handlers.release(a.name);
  }

  private listen(type: string, fn: (e: PointerEvent) => void): void {
    this.dom.addEventListener(type, fn as EventListener);
    this.listeners.push([type, fn]);
  }

  private setRay(e: PointerEvent): void {
    this.setRayAt(e.clientX, e.clientY);
  }

  private setRayAt(clientX: number, clientY: number): void {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
  }

  private pick(e: PointerEvent, exclude: string | null): string | null {
    this.setRay(e);
    const roots = [...this.interactables].filter(([n]) => n !== exclude).map(([, o]) => o);
    for (const hit of this.raycaster.intersectObjects(roots, true)) {
      const root = interactableOf(hit.object);
      if (root && root.userData.interactable !== exclude) return root.userData.interactable as string;
    }
    return null;
  }

  private onDown(e: PointerEvent): void {
    if (this.active || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const name = this.pick(e, null);
    if (!name && !this.handlers.pan) return;
    e.preventDefault();
    this.dom.setPointerCapture?.(e.pointerId);
    this.active = {
      pointerId: e.pointerId,
      name: name ?? '',
      lastX: e.clientX,
      lastY: e.clientY,
      x0: e.clientX,
      y0: e.clientY,
      dragging: false,
      ghost: null,
      ghostOrigin: new THREE.Vector3(),
    };
    if (name) this.handlers.press(name);
  }

  private onMove(e: PointerEvent): void {
    const a = this.active;
    if (!a || e.pointerId !== a.pointerId) {
      if (!a && e.pointerType === 'mouse') this.dom.style.cursor = this.pick(e, null) ? 'pointer' : 'default';
      return;
    }
    const dx = e.clientX - a.lastX;
    a.lastX = e.clientX;
    a.lastY = e.clientY;
    if (!a.name) {
      // Pan gesture on empty space (MEC-009 rule 5).
      if (!a.dragging && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > DRAG_THRESHOLD_PX) a.dragging = true;
      if (a.dragging) this.handlers.pan?.(dx);
      return;
    }
    if (!a.dragging) {
      const moved = Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > DRAG_THRESHOLD_PX;
      if (!moved || !this.options.canDrag(a.name)) return;
      a.dragging = true;
      a.ghost = this.interactables.get(a.name) ?? null;
      if (a.ghost) a.ghostOrigin.copy(a.ghost.position);
      this.dom.style.cursor = 'grabbing';
    }
    this.moveGhost(a, e.clientX, e.clientY);
  }

  private moveGhost(a: Active, clientX: number, clientY: number): void {
    this.setRayAt(clientX, clientY);
    const ghost = a.ghost;
    if (ghost && this.raycaster.ray.intersectPlane(this.plane, this.hitPoint)) {
      ghost.position.copy(ghost.parent ? ghost.parent.worldToLocal(this.hitPoint) : this.hitPoint);
    }
  }

  private onUp(e: PointerEvent, cancelled: boolean): void {
    const a = this.active;
    if (!a || e.pointerId !== a.pointerId) return;
    this.active = null;
    this.dom.style.cursor = 'default';
    if (!a.name) return; // end of a pan gesture
    this.restoreGhost(a);
    this.handlers.release(a.name);
    if (cancelled) return;
    if (a.dragging) this.handlers.drop(a.name, this.pick(e, a.name));
    else if (Math.hypot(e.clientX - a.x0, e.clientY - a.y0) <= DRAG_THRESHOLD_PX * 3) this.handlers.tap(a.name);
  }

  private restoreGhost(a: Active): void {
    if (a.ghost) a.ghost.position.copy(a.ghostOrigin);
    a.ghost = null;
  }
}
