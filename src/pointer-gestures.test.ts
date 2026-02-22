import { Subscription } from "rxjs";
import { Matrix3x3 } from "./matrix3x3";
import {
  IPointerDragCancelEvent,
  IPointerDragEvent,
  IPointerDragStartEvent,
  IPointerDropEvent,
  IPointerTapEvent,
  PointerGestures,
} from "./pointer-gestures";
import {
  addPointerState,
  changePointerState,
  EMPTY_STATE,
  IPointerChangeEvent,
  removePointerState,
} from "./pointers-state";
import { Vec2F } from "./vec2f";

describe("PointerGestures", () => {
  function createGestureTrackerTest<TDragData = unknown>() {
    let state = EMPTY_STATE;
    const events = new PointerGestures<TDragData>();

    const taps: IPointerTapEvent[] = [];
    const doubleTaps: IPointerTapEvent[] = [];

    const subscription = new Subscription();

    subscription.add(
      events.doubleTaps$.subscribe((tapEvent) => doubleTaps.push(tapEvent)),
    );
    subscription.add(events.taps$.subscribe((tapEvent) => taps.push(tapEvent)));

    return {
      events,
      taps,
      doubleTaps,
      add(ev: readonly IPointerChangeEvent[], timeStamp: number) {
        state = addPointerState(state, ev, timeStamp);
        events.accept(state);
      },
      change(ev: readonly IPointerChangeEvent[], timeStamp: number) {
        state = changePointerState(state, ev, timeStamp);
        events.accept(state);
      },
      remove(ev: readonly IPointerChangeEvent[], timeStamp: number) {
        state = removePointerState(state, ev, timeStamp);
        events.accept(state);
      },
      dispose() {
        subscription.unsubscribe();
      },
    };
  }

  it("tracks taps", async () => {
    const tracker = createGestureTrackerTest();
    const taps: IPointerTapEvent[] = [];
    const subscription = tracker.events.taps$.subscribe((tapEvent) =>
      taps.push(tapEvent),
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );

    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );
    await delay(350); // skip double tap check
    subscription.unsubscribe();
    expect(taps.length).toBe(1);
  });
  it("should not track unfinished taps", async () => {
    const tracker = createGestureTrackerTest();
    const taps: IPointerTapEvent[] = [];
    const subscription = tracker.events.taps$.subscribe((tapEvent) =>
      taps.push(tapEvent),
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      200,
    );
    await delay(350); // skip double tap check
    subscription.unsubscribe();
    expect(taps.length).toBe(1);
  });
  it("should track double tap after tap", async () => {
    const tracker = createGestureTrackerTest();
    try {
      tracker.add(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        0,
      );
      tracker.remove(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        100,
      );
      await delay(350);
      tracker.add(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        200,
      );
      tracker.remove(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        300,
      );
      tracker.add(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        400,
      );
      tracker.remove(
        [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
        500,
      );
      expect(tracker.taps.length).toBe(1);
      expect(tracker.taps[0].timeStamp).toBe(100);
      expect(tracker.doubleTaps.length).toBe(1);
      expect(tracker.doubleTaps[0].timeStamp).toBe(500);
    } finally {
      tracker.dispose();
    }
  });
  it("tracks double taps", async () => {
    const tracker = createGestureTrackerTest();
    const doubleTaps: IPointerTapEvent[] = [];
    const subscription = tracker.events.doubleTaps$.subscribe((tapEvent) =>
      doubleTaps.push(tapEvent),
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      200,
    );
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      300,
    );
    subscription.unsubscribe();
    expect(doubleTaps.length).toBe(1);
  });
  it("does not emit double tap when total duration exceeds window", async () => {
    const tracker = createGestureTrackerTest();
    const doubleTaps: IPointerTapEvent[] = [];
    const taps: IPointerTapEvent[] = [];
    const subs = [
      tracker.events.doubleTaps$.subscribe((e) => doubleTaps.push(e)),
      tracker.events.taps$.subscribe((e) => taps.push(e)),
    ];

    // First tap-down at t=0
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    // First tap-up at t=100
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );

    // Second tap-down at t=250 (within real-time timeout, cancels pending tap)
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      250,
    );
    // Second tap-up at t=350 — total duration 350 > 300ms window
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      350,
    );

    await delay(350);

    // Duration exceeds 300ms so matchDoubleTap returns false
    expect(doubleTaps.length).toBe(0);
    expect(taps.length).toBe(1);

    subs.forEach((s) => s.unsubscribe());
  });

  it("tracks long taps", async () => {
    const tracker = createGestureTrackerTest();
    const longTaps: IPointerTapEvent[] = [];
    const subscription = tracker.events.longTaps$.subscribe((tapEvent) =>
      longTaps.push(tapEvent),
    );
    tracker.add(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    await delay(1200);
    tracker.remove(
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      1200,
    );
    subscription.unsubscribe();
    expect(longTaps.length).toBe(1);
  });

  describe("drag & drop with single touch", () => {
    const DRAG_DATA = { item: "card-1" };

    it("should emit dragStart when pointer moves beyond threshold", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Move beyond the 10px drag threshold
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );

      expect(dragStarts.length).toBe(1);
      expect(dragStarts[0].pointer.pointerId).toBe("touch-0");
      expect(dragStarts[0].data).toEqual(DRAG_DATA);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should not emit dragStart when pointer stays within threshold", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Move within the 10px drag threshold
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(55, 50), precision: "low" }],
        10,
      );

      expect(dragStarts.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should emit dragMove on subsequent moves after dragStart", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
        }),
        tracker.events.dragMove$.subscribe((e) => dragMoves.push(e)),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Move past threshold to start drag
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      // Additional moves should emit dragMove
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(80, 50), precision: "low" }],
        20,
      );
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(100, 60), precision: "low" }],
        30,
      );

      // First accept after threshold emits both dragStart and dragMove
      // Subsequent accepts emit dragMove
      expect(dragMoves.length).toBe(3);
      expect(dragMoves[0].data).toEqual(DRAG_DATA);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should emit dragEnd when pointer is released during active drag", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const dragEnds: IPointerDropEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
        tracker.events.dragEnd$.subscribe((e) => dragEnds.push(e)),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Start drag
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      // Move further
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(100, 80), precision: "low" }],
        20,
      );
      // Release pointer
      tracker.remove(
        [{ pointerId: "touch-0", point: new Vec2F(100, 80), precision: "low" }],
        30,
      );

      expect(dragStarts.length).toBe(1);
      expect(dragEnds.length).toBe(1);
      expect(dragEnds[0].data).toEqual(DRAG_DATA);
      expect(dragEnds[0].matrix).toBeInstanceOf(Matrix3x3);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should not emit dragMove or dragEnd if consumer does not set data on dragStart", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];
      const dragEnds: IPointerDropEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe(() => {
          /* no data set */
        }),
        tracker.events.dragMove$.subscribe((e) => dragMoves.push(e)),
        tracker.events.dragEnd$.subscribe((e) => dragEnds.push(e)),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        20,
      );
      tracker.remove(
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        30,
      );

      expect(dragMoves.length).toBe(0);
      expect(dragEnds.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should produce a translation matrix matching the pointer displacement on dragMove", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
        }),
        tracker.events.dragMove$.subscribe((e) => dragMoves.push(e)),
      ];

      const startPoint = new Vec2F(50, 50);
      const endPoint = new Vec2F(150, 100);

      tracker.add(
        [{ pointerId: "touch-0", point: startPoint, precision: "low" }],
        0,
      );
      // Move past threshold
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      // Move to final position
      tracker.change(
        [{ pointerId: "touch-0", point: endPoint, precision: "low" }],
        20,
      );

      const lastMove = dragMoves[dragMoves.length - 1];
      const decoded = lastMove.matrix.decode();
      expect(decoded.translate.x).toBeCloseTo(endPoint.x - startPoint.x, 5);
      expect(decoded.translate.y).toBeCloseTo(endPoint.y - startPoint.y, 5);
      expect(decoded.scale).toBeCloseTo(1, 5);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should only emit one dragStart even with multiple moves", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Multiple moves past threshold
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(80, 50), precision: "low" }],
        20,
      );
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        30,
      );

      expect(dragStarts.length).toBe(1);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should emit dragCancel when Escape key is pressed during active drag", () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const dragCancels: IPointerDragCancelEvent<{ item: string }>[] = [];
      const dragEnds: IPointerDropEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
        }),
        tracker.events.dragMove$.subscribe(() => {}),
        tracker.events.dragEnd$.subscribe((e) => dragEnds.push(e)),
        tracker.events.dragCancel$.subscribe((e) => dragCancels.push(e)),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Move past threshold to start drag
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );

      // Press Escape to cancel the drag
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(dragCancels.length).toBe(1);
      expect(dragCancels[0].data).toEqual(DRAG_DATA);
      // dragEnd should not have been emitted — the drag was cancelled, not completed
      expect(dragEnds.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should not emit tap after a drag gesture", async () => {
      const tracker = createGestureTrackerTest<{ item: string }>();
      const taps: IPointerTapEvent[] = [];
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const subs = [
        tracker.events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
        tracker.events.taps$.subscribe((e) => taps.push(e)),
      ];

      tracker.add(
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      // Drag past threshold
      tracker.change(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      // Release
      tracker.remove(
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        20,
      );

      await delay(350);

      expect(dragStarts.length).toBe(1);
      expect(taps.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });
  });

  describe("multi-pointer drag", () => {
    const DRAG_DATA = { item: "card-1" };

    it("should update multitouch when a second pointer is added during active drag", () => {
      const events = new PointerGestures<{ item: string }>();
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];

      const subs = [
        events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
        }),
        events.dragMove$.subscribe((e) => dragMoves.push(e)),
      ];

      let state = EMPTY_STATE;

      // First pointer down
      state = addPointerState(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Move past threshold to start drag
      state = changePointerState(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      // Add second pointer during active drag (covers line 178)
      state = addPointerState(
        state,
        [
          {
            pointerId: "touch-1",
            point: new Vec2F(100, 100),
            precision: "low",
          },
        ],
        20,
      );
      events.accept(state);

      expect(dragMoves.length).toBeGreaterThanOrEqual(2);

      subs.forEach((s) => s.unsubscribe());
    });
  });

  it("should reset edges when multiple pointers are active", async () => {
    const events = new PointerGestures();
    const taps: IPointerTapEvent[] = [];

    const subs = [events.taps$.subscribe((e) => taps.push(e))];

    let state = EMPTY_STATE;

    // First pointer down
    state = addPointerState(
      state,
      [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
      0,
    );
    events.accept(state);

    // Second pointer down (active > 1, covers line 255: resetEdgesHistory)
    state = addPointerState(
      state,
      [{ pointerId: "touch-1", point: new Vec2F(100, 100), precision: "low" }],
      50,
    );
    events.accept(state);

    // Remove both pointers at once
    state = removePointerState(
      state,
      [
        { pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" },
        { pointerId: "touch-1", point: new Vec2F(100, 100), precision: "low" },
      ],
      100,
    );
    events.accept(state);

    await delay(350);

    // No tap should fire because edges were reset by multi-pointer
    expect(taps.length).toBe(0);

    subs.forEach((s) => s.unsubscribe());
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
