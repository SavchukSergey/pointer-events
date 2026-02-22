# pointer-gestures

A lightweight TypeScript library for unified pointer tracking and gesture recognition in the browser. It normalises mouse and touch input into a single reactive stream and provides high-level gesture detection -- taps, double-taps, long-taps, and multitouch drag & drop with an affine transformation matrix.

## Features

- Unified mouse and touch tracking via a single Observable
- Gesture recognition: tap, double-tap, long-tap
- Drag & drop with multitouch support (up to 3 simultaneous touch points)
- Affine transformation matrix (translation, rotation, scale) computed from touch movements
- Immutable state snapshots on every pointer change
- Drag cancellation via Escape key
- Zero runtime dependencies

## Installation

```bash
npm install pointer-gestures
```

## Quick start

```ts
import { createPointersState, PointerGestures } from "pointer-gestures";

const element = document.getElementById("canvas")!;

// 1. Create a pointer state observable from a DOM element
const pointers$ = createPointersState(element);

// 2. Create a gesture recogniser
const gestures = new PointerGestures<{ id: string }>();

// 3. Listen for gestures
gestures.taps$.subscribe((tap) => {
  console.log(`Tap at (${tap.point.x}, ${tap.point.y})`);
});

gestures.doubleTaps$.subscribe((tap) => {
  console.log(`Double-tap at (${tap.point.x}, ${tap.point.y})`);
});

gestures.longTaps$.subscribe((tap) => {
  console.log(`Long-tap at (${tap.point.x}, ${tap.point.y})`);
});

// 4. Feed pointer state into the gesture recogniser
pointers$.subscribe((state) => {
  gestures.accept(state);
});
```

## API

### `createPointersState(node: Element): Observable<IPointersState>`

Creates an Observable that tracks all mouse and touch interactions on the given DOM element. Each emission is an immutable `IPointersState` snapshot containing added, changed, and removed pointers.

```ts
import { createPointersState } from "pointer-gestures";

const element = document.getElementById("target")!;
const pointers$ = createPointersState(element);

const subscription = pointers$.subscribe((state) => {
  console.log("Active pointers:", state.active);

  for (const pointer of state.added) {
    console.log(`Pointer ${pointer.pointerId} added at (${pointer.point.x}, ${pointer.point.y})`);
  }

  for (const pointer of state.changed) {
    console.log(`Pointer ${pointer.pointerId} moved to (${pointer.point.x}, ${pointer.point.y})`);
    console.log(`  Total distance travelled: ${pointer.clientDistance}px`);
  }

  for (const pointer of state.removed) {
    console.log(`Pointer ${pointer.pointerId} removed`);
  }
});

// Unsubscribe to stop listening
subscription.unsubscribe();
```

### `PointerGestures<TDragData>`

A gesture recogniser that consumes `IPointersState` snapshots and emits high-level gesture events.

`TDragData` is a generic type parameter for the application-specific data attached to drag operations.

#### Tap gestures

```ts
import { createPointersState, PointerGestures } from "pointer-gestures";

const gestures = new PointerGestures();

gestures.taps$.subscribe((event) => {
  // Single tap detected (emitted after the double-tap time window expires)
  console.log(`Tap by ${event.pointerId} at (${event.point.x}, ${event.point.y})`);
});

gestures.doubleTaps$.subscribe((event) => {
  // Two taps within 300ms
  console.log(`Double-tap at (${event.point.x}, ${event.point.y})`);
});

gestures.longTaps$.subscribe((event) => {
  // Pointer held down for 1000ms without moving
  console.log(`Long-tap at (${event.point.x}, ${event.point.y})`);
});

const pointers$ = createPointersState(document.getElementById("target")!);
pointers$.subscribe((state) => gestures.accept(state));
```

#### Drag & drop

To opt in to a drag operation, set `data` on the `dragStart$` event. If `data` is not set, the drag is ignored.

```ts
import { createPointersState, PointerGestures } from "pointer-gestures";

interface DragPayload {
  elementId: string;
  startX: number;
  startY: number;
}

const gestures = new PointerGestures<DragPayload>();

// Accept the drag by assigning data
gestures.dragStart$.subscribe((event) => {
  event.data = {
    elementId: "my-element",
    startX: event.pointer.point.x,
    startY: event.pointer.point.y,
  };
});

// Track movement -- matrix contains the accumulated affine transform
gestures.dragMove$.subscribe((event) => {
  const { translate, rotate, scale } = event.matrix.decode();
  const el = document.getElementById(event.data.elementId)!;
  el.style.transform = `translate(${translate.x}px, ${translate.y}px) rotate(${rotate}rad) scale(${scale})`;
});

// Finalise the drop
gestures.dragEnd$.subscribe((event) => {
  console.log("Dropped:", event.data.elementId);
  console.log("Final matrix:", event.matrix);
});

// Handle Escape key cancellation
gestures.dragCancel$.subscribe((event) => {
  console.log("Drag cancelled for:", event.data.elementId);
  // Revert the element to its original position
});

const pointers$ = createPointersState(document.getElementById("target")!);
pointers$.subscribe((state) => gestures.accept(state));
```

### `Multitouch`

Tracks up to three simultaneous touch points and computes an affine transformation matrix representing the combined translation, rotation, and scaling. Used internally by `PointerGestures` but can also be used standalone.

```ts
import { Multitouch } from "pointer-gestures";
import { Vec2F } from "pointer-gestures"; // Vec2F is not exported; use inline

// Note: Vec2F is an internal type. When using Multitouch standalone,
// construct touch points by providing { x, y } objects.

const mt = new Multitouch();

// Simulate a single-finger drag (translation only)
mt.touch("finger-1", new Vec2F(100, 100));
mt.move("finger-1", new Vec2F(150, 120));

const matrix = mt.eval();
const { translate, rotate, scale } = matrix.decode();
console.log(`Translation: (${translate.x}, ${translate.y})`); // (50, 20)
console.log(`Rotation: ${rotate} rad`);                       // ~0
console.log(`Scale: ${scale}`);                                // ~1

// Add a second finger for pinch-to-zoom / rotate
mt.touch("finger-2", new Vec2F(200, 100));
mt.move("finger-1", new Vec2F(80, 80));
mt.move("finger-2", new Vec2F(250, 150));

const updated = mt.eval().decode();
console.log(`Scale: ${updated.scale}`);
console.log(`Rotation: ${updated.rotate} rad`);

// Remove fingers
mt.untouch("finger-1");
mt.untouch("finger-2");
```

## Gesture detection thresholds

| Gesture | Threshold |
|---|---|
| Drag | > 10px total pointer distance |
| Double-tap | Both taps within 300ms |
| Long-tap | Pointer held for 1000ms |

## License

MIT
