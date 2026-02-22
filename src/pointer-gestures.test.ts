import {
  IPointerDragEvent,
  IPointerDragStartEvent,
  IPointerDropEvent,
  IPointerTapEvent,
  PointerGestures,
} from "./pointer-gestures";
import { add, change, EMPTY_STATE, remove } from "./pointers-state";
import { Vec2F } from "./vec2f";
import { Matrix3x3 } from "./matrix3x3";

describe("PointerGestures", () => {
  it("tracks taps", async () => {
    let state = EMPTY_STATE;
    const events = new PointerGestures();
    const taps: IPointerTapEvent[] = [];
    const subscription = events.taps$.subscribe((tapEvent) =>
      taps.push(tapEvent),
    );
    state = add(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    events.accept(state);
    state = remove(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );
    events.accept(state);
    await delay(350); // skip double tap check
    subscription.unsubscribe();
    expect(taps.length).toBe(1);
  });
  it("tracks double taps", async () => {
    let state = EMPTY_STATE;
    const events = new PointerGestures();
    const doubleTaps: IPointerTapEvent[] = [];
    const subscription = events.doubleTaps$.subscribe((tapEvent) =>
      doubleTaps.push(tapEvent),
    );
    state = add(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    events.accept(state);
    state = remove(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      100,
    );
    events.accept(state);
    state = add(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      200,
    );
    events.accept(state);
    state = remove(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      300,
    );
    events.accept(state);
    subscription.unsubscribe();
    expect(doubleTaps.length).toBe(1);
  });
  it("tracks long taps", async () => {
    let state = EMPTY_STATE;
    const events = new PointerGestures();
    const longTaps: IPointerTapEvent[] = [];
    const subscription = events.longTaps$.subscribe((tapEvent) =>
      longTaps.push(tapEvent),
    );
    state = add(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      0,
    );
    events.accept(state);
    await delay(1200);
    state = remove(
      state,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "low" }],
      1200,
    );
    events.accept(state);
    subscription.unsubscribe();
    expect(longTaps.length).toBe(1);
  });

  describe("drag & drop with single touch", () => {
    const DRAG_DATA = { item: "card-1" };

    function setupDrag() {
      const events = new PointerGestures<{ item: string }>();
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];
      const dragEnds: IPointerDropEvent<{ item: string }>[] = [];

      const subs = [
        events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
        events.dragMove$.subscribe((e) => dragMoves.push(e)),
        events.dragEnd$.subscribe((e) => dragEnds.push(e)),
      ];

      const cleanup = () => subs.forEach((s) => s.unsubscribe());
      return { events, dragStarts, dragMoves, dragEnds, cleanup };
    }

    it("should emit dragStart when pointer moves beyond threshold", () => {
      const { events, dragStarts, cleanup } = setupDrag();

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Move beyond the 10px drag threshold
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      expect(dragStarts.length).toBe(1);
      expect(dragStarts[0].pointer.pointerId).toBe("touch-0");
      expect(dragStarts[0].data).toEqual(DRAG_DATA);

      cleanup();
    });

    it("should not emit dragStart when pointer stays within threshold", () => {
      const { events, dragStarts, cleanup } = setupDrag();

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Move within the 10px drag threshold
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(55, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      expect(dragStarts.length).toBe(0);

      cleanup();
    });

    it("should emit dragMove on subsequent moves after dragStart", () => {
      const { events, dragMoves, cleanup } = setupDrag();

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Move past threshold to start drag
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      // Additional moves should emit dragMove
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(80, 50), precision: "low" }],
        20,
      );
      events.accept(state);

      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 60), precision: "low" }],
        30,
      );
      events.accept(state);

      // First accept after threshold emits both dragStart and dragMove
      // Subsequent accepts emit dragMove
      expect(dragMoves.length).toBe(3);
      expect(dragMoves[0].data).toEqual(DRAG_DATA);

      cleanup();
    });

    it("should emit dragEnd when pointer is released during active drag", () => {
      const { events, dragStarts, dragEnds, cleanup } = setupDrag();

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Start drag
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      // Move further
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 80), precision: "low" }],
        20,
      );
      events.accept(state);

      // Release pointer
      state = remove(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 80), precision: "low" }],
        30,
      );
      events.accept(state);

      expect(dragStarts.length).toBe(1);
      expect(dragEnds.length).toBe(1);
      expect(dragEnds[0].data).toEqual(DRAG_DATA);
      expect(dragEnds[0].matrix).toBeInstanceOf(Matrix3x3);

      cleanup();
    });

    it("should not emit dragMove or dragEnd if consumer does not set data on dragStart", () => {
      const events = new PointerGestures<{ item: string }>();
      const dragMoves: IPointerDragEvent<{ item: string }>[] = [];
      const dragEnds: IPointerDropEvent<{ item: string }>[] = [];

      // Subscribe to dragStart but do NOT set data (opt out of drag)
      const subs = [
        events.dragStart$.subscribe(() => {
          /* no data set */
        }),
        events.dragMove$.subscribe((e) => dragMoves.push(e)),
        events.dragEnd$.subscribe((e) => dragEnds.push(e)),
      ];

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        20,
      );
      events.accept(state);

      state = remove(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        30,
      );
      events.accept(state);

      expect(dragMoves.length).toBe(0);
      expect(dragEnds.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });

    it("should produce a translation matrix matching the pointer displacement on dragMove", () => {
      const { events, dragMoves, cleanup } = setupDrag();

      const startPoint = new Vec2F(50, 50);
      const endPoint = new Vec2F(150, 100);

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: startPoint, precision: "low" }],
        0,
      );
      events.accept(state);

      // Move past threshold
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      // Move to final position
      state = change(
        state,
        [{ pointerId: "touch-0", point: endPoint, precision: "low" }],
        20,
      );
      events.accept(state);

      const lastMove = dragMoves[dragMoves.length - 1];
      const decoded = lastMove.matrix.decode();
      expect(decoded.translate.x).toBeCloseTo(endPoint.x - startPoint.x, 5);
      expect(decoded.translate.y).toBeCloseTo(endPoint.y - startPoint.y, 5);
      expect(decoded.scale).toBeCloseTo(1, 5);

      cleanup();
    });

    it("should only emit one dragStart even with multiple moves", () => {
      const { events, dragStarts, cleanup } = setupDrag();

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Multiple moves past threshold
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(80, 50), precision: "low" }],
        20,
      );
      events.accept(state);

      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(100, 50), precision: "low" }],
        30,
      );
      events.accept(state);

      expect(dragStarts.length).toBe(1);

      cleanup();
    });

    it("should not emit tap after a drag gesture", async () => {
      const events = new PointerGestures<{ item: string }>();
      const taps: IPointerTapEvent[] = [];
      const dragStarts: IPointerDragStartEvent<{ item: string }>[] = [];

      const subs = [
        events.dragStart$.subscribe((e) => {
          e.data = { ...DRAG_DATA };
          dragStarts.push(e);
        }),
        events.taps$.subscribe((e) => taps.push(e)),
      ];

      let state = EMPTY_STATE;
      state = add(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(50, 50), precision: "low" }],
        0,
      );
      events.accept(state);

      // Drag past threshold
      state = change(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        10,
      );
      events.accept(state);

      // Release
      state = remove(
        state,
        [{ pointerId: "touch-0", point: new Vec2F(65, 50), precision: "low" }],
        20,
      );
      events.accept(state);

      await delay(350);

      expect(dragStarts.length).toBe(1);
      expect(taps.length).toBe(0);

      subs.forEach((s) => s.unsubscribe());
    });
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
