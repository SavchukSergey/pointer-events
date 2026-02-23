/**
 * Polyfills PointerEvent for JSDOM, which does not implement it natively.
 * The polyfill extends MouseEvent and exposes the Pointer Events API fields
 * needed for tests (pointerId, pointerType, width, height, pressure, isPrimary).
 */
class PointerEventPolyfill extends MouseEvent {
  public readonly pointerId: number;
  public readonly pointerType: string;
  public readonly width: number;
  public readonly height: number;
  public readonly pressure: number;
  public readonly isPrimary: boolean;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? "";
    this.width = params.width ?? 1;
    this.height = params.height ?? 1;
    this.pressure = params.pressure ?? 0;
    this.isPrimary = params.isPrimary ?? false;
  }
}

global.PointerEvent =
  PointerEventPolyfill as unknown as typeof globalThis.PointerEvent;
