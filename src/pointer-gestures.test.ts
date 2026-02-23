import { expectMatrix3x3 } from "./asserts";
import { Matrix3x3 } from "./matrix3x3";
import { Subscription } from "./observable";
import type { IPointerDragCancelEvent, IPointerDragEvent, IPointerDragStartEvent, IPointerDropEvent, IPointerTapEvent } from "./pointer-gestures";
import { PointerGestures } from "./pointer-gestures";
import type { IPointerChangeEvent } from "./pointers-state";
import { addPointerState, changePointerState, EMPTY_STATE, removePointerState } from "./pointers-state";
import { Vec2F } from "./vec2f";

describe("PointerGestures", () => {
  function createGestureTrackerTest<TDragData = unknown>() {
    let state = EMPTY_STATE;
    const events = new PointerGestures<TDragData>();

    const taps: IPointerTapEvent[] = [];
    const doubleTaps: IPointerTapEvent[] = [];
    const longTaps: IPointerTapEvent[] = [];
    const dragStarts: IPointerDragStartEvent<TDragData>[] = [];
    const dragMoves: IPointerDragEvent<TDragData>[] = [];
    const dragEnds: IPointerDropEvent<TDragData>[] = [];
    const dragCancels: IPointerDragCancelEvent<TDragData>[] = [];

    const subscription = new Subscription();

    subscription.add(events.doubleTaps$.subscribe((tapEvent) => doubleTaps.push(tapEvent)));
    subscription.add(events.longTaps$.subscribe((tapEvent) => longTaps.push(tapEvent)));
    subscription.add(events.taps$.subscribe((tapEvent) => taps.push(tapEvent)));
    subscription.add(events.dragStart$.subscribe((dragEvent) => dragStarts.push(dragEvent)));
    subscription.add(events.dragMove$.subscribe((dragEvent) => dragMoves.push(dragEvent)));
    subscription.add(events.dragEnd$.subscribe((dragEvent) => dragEnds.push(dragEvent)));
    subscription.add(events.dragCancel$.subscribe((dragEvent) => dragCancels.push(dragEvent)));

    return {
      events,
      taps: taps as readonly IPointerTapEvent[],
      doubleTaps: doubleTaps as readonly IPointerTapEvent[],
      longTaps: longTaps as readonly IPointerTapEvent[],
      dragMoves: dragMoves as readonly IPointerDragEvent<TDragData>[],
      dragStarts: dragStarts as readonly IPointerDragStartEvent<TDragData>[],
      dragEnds: dragEnds as readonly IPointerDropEvent<TDragData>[],
      dragCancels: dragCancels as readonly IPointerDragCancelEvent<TDragData>[],
      add(ev: IPointerChangeEvent) {
        state = addPointerState(state, ev);
        events.accept(state);
      },
      change(ev: IPointerChangeEvent) {
        state = changePointerState(state, ev);
        events.accept(state);
      },
      remove(ev: IPointerChangeEvent) {
        state = removePointerState(state, ev);
        events.accept(state);
      },
      dispose() {
        subscription.unsubscribe();
      },
    };
  }

  it("should track taps", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });
      await delay(350); // skip double tap check
      expect(tracker.taps.length).toBe(1);
    } finally {
      tracker.dispose();
    }
  });
  it("should not track unfinished taps", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 200 });
      await delay(350); // skip double tap check
      expect(tracker.taps.length).toBe(1);
    } finally {
      tracker.dispose();
    }
  });
  it("should track double tap after tap", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });
      await delay(350);
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 200 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 300 });
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 400 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 500 });
      expect(tracker.taps.length).toBe(1);
      expect(tracker.taps[0].timeStamp).toBe(100);
      expect(tracker.doubleTaps.length).toBe(1);
      expect(tracker.doubleTaps[0].timeStamp).toBe(500);
    } finally {
      tracker.dispose();
    }
  });
  it("should track double taps", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 200 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 300 });
      expect(tracker.doubleTaps.length).toBe(1);
    } finally {
      tracker.dispose();
    }
  });
  it("does not emit double tap when total duration exceeds window", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 250 });
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 350 });

      await delay(350);

      // Duration exceeds 300ms so matchDoubleTap returns false
      expect(tracker.doubleTaps.length).toBe(0);
      expect(tracker.taps.length).toBe(1);
    } finally {
      tracker.dispose();
    }
  });

  it("should track long taps", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 0 });
      await delay(1200);
      tracker.remove({ pointerId: 1, point: new Vec2F(100, 100), precision: "low", timeStamp: 1200 });
      expect(tracker.longTaps.length).toBe(1);
    } finally {
      tracker.dispose();
    }
  });

  describe("drag & drop with single touch", () => {
    const DRAG_DATA = { item: "card-1" } as const;

    it("should emit dragStart when pointer moves beyond threshold", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });

        expect(tracker.dragStarts.length).toBe(1);
        expect(tracker.dragStarts[0].pointer.pointerId).toBe(2);
        expect(tracker.dragStarts[0].data).toEqual(DRAG_DATA);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should not emit dragStart when pointer stays within threshold", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        tracker.change({ pointerId: 2, point: new Vec2F(55, 50), precision: "low", timeStamp: 10 });

        expect(tracker.dragStarts.length).toBe(0);
      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should emit dragMove on subsequent moves after dragStart", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        // Move past threshold to start drag
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        // Additional moves should emit dragMove
        tracker.change({ pointerId: 2, point: new Vec2F(80, 50), precision: "low", timeStamp: 20 });
        tracker.change({ pointerId: 2, point: new Vec2F(100, 60), precision: "low", timeStamp: 30 });

        // First accept after threshold emits both dragStart and dragMove
        // Subsequent accepts emit dragMove
        expect(tracker.dragMoves.length).toBe(3);
        expect(tracker.dragMoves[0].data).toEqual(DRAG_DATA);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should emit dragEnd when pointer is released during active drag", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        tracker.change({ pointerId: 2, point: new Vec2F(100, 80), precision: "low", timeStamp: 20 });
        tracker.remove({ pointerId: 2, point: new Vec2F(100, 80), precision: "low", timeStamp: 30 });

        expect(tracker.dragStarts.length).toBe(1);
        expect(tracker.dragEnds.length).toBe(1);
        expect(tracker.dragEnds[0].data).toEqual(DRAG_DATA);
        expectMatrix3x3(Matrix3x3.translate(new Vec2F(50, 30)), tracker.dragEnds[0].matrix);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should not emit dragMove or dragEnd if consumer does not set data on dragStart", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      try {
        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        tracker.change({ pointerId: 2, point: new Vec2F(100, 50), precision: "low", timeStamp: 20 });
        tracker.remove({ pointerId: 2, point: new Vec2F(100, 50), precision: "low", timeStamp: 30 });

        expect(tracker.dragMoves.length).toBe(0);
        expect(tracker.dragEnds.length).toBe(0);

      } finally {
        tracker.dispose();
      }
    });

    it("should produce a translation matrix matching the pointer displacement on dragMove", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        const startPoint = new Vec2F(50, 50);
        const endPoint = new Vec2F(150, 100);

        tracker.add({ pointerId: 2, point: startPoint, precision: "low", timeStamp: 0 });
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        tracker.change({ pointerId: 2, point: endPoint, precision: "low", timeStamp: 20 });

        const lastMove = tracker.dragMoves[tracker.dragMoves.length - 1];
        const decoded = lastMove.matrix.decode();
        expect(decoded.translate.x).toBeCloseTo(endPoint.x - startPoint.x, 5);
        expect(decoded.translate.y).toBeCloseTo(endPoint.y - startPoint.y, 5);
        expect(decoded.scale).toBeCloseTo(1, 5);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should only emit one dragStart even with multiple moves", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const sub = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });

      try {
        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        // Multiple moves past threshold
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        tracker.change({ pointerId: 2, point: new Vec2F(80, 50), precision: "low", timeStamp: 20 });
        tracker.change({ pointerId: 2, point: new Vec2F(100, 50), precision: "low", timeStamp: 30 });

        expect(tracker.dragStarts.length).toBe(1);

      } finally {
        sub.unsubscribe();
        tracker.dispose();
      }
    });

    it("should emit dragCancel when Escape key is pressed during active drag", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        // Move past threshold to start drag
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });

        // Press Escape to cancel the drag
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

        expect(tracker.dragCancels.length).toBe(1);
        expect(tracker.dragCancels[0].data).toEqual(DRAG_DATA);
        // dragEnd should not have been emitted — the drag was cancelled, not completed
        expect(tracker.dragEnds.length).toBe(0);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });

    it("should not emit tap after a drag gesture", async () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {
        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });
        // Drag past threshold
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });
        // Release
        tracker.remove({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 20 });

        await delay(350);

        expect(tracker.dragStarts.length).toBe(1);
        expect(tracker.taps.length).toBe(0);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });
  });

  describe("multi-pointer drag", () => {
    const DRAG_DATA = { item: "card-1" } as const;

    it("should update multitouch when a second pointer is added during active drag", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const subs = tracker.events.dragStart$.subscribe((e) => {
        e.data = DRAG_DATA;
      });
      try {

        // First pointer down
        tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });

        // Move past threshold to start drag
        tracker.change({ pointerId: 2, point: new Vec2F(65, 50), precision: "low", timeStamp: 10 });

        // Add second pointer during active drag (covers line 178)
        tracker.add({ pointerId: 3, point: new Vec2F(100, 100), precision: "low", timeStamp: 20 });

        expect(tracker.dragMoves.length).toBeGreaterThanOrEqual(2);

      } finally {
        subs.unsubscribe();
        tracker.dispose();
      }
    });
  });

  it("should reset edges when multiple pointers are active", async () => {
    const tracker = createGestureTrackerTest<{ item: string }>();
    try {

      tracker.add({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 0 });

      tracker.add({ pointerId: 3, point: new Vec2F(100, 100), precision: "low", timeStamp: 50 });

      // Remove both pointers
      tracker.remove({ pointerId: 2, point: new Vec2F(50, 50), precision: "low", timeStamp: 100 });
      tracker.remove({ pointerId: 3, point: new Vec2F(100, 100), precision: "low", timeStamp: 100 });

      await delay(350);

      // No tap should fire because edges were reset by multi-pointer
      expect(tracker.taps.length).toBe(0);
    } finally {
      tracker.dispose();
    }
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
