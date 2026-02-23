import { expectVec2F } from "./asserts";
import type { IPointersState, IPointerState } from "./pointers-state";
import {
  addPointerState,
  changePointerState,
  createPointersState,
  EMPTY_STATE,
  removePointerState,
} from "./pointers-state";
import { Vec2F } from "./vec2f";

function mockPointerCapture(elem: HTMLElement): void {
  elem.setPointerCapture = () => { };
  elem.releasePointerCapture = () => { };
}

function dispatchPointerEvent(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  pointerId: number,
  pointerType: "touch" | "pen",
  clientPosition: Vec2F,
): PointerEvent {
  const ev = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId,
    pointerType,
    clientX: clientPosition.x,
    clientY: clientPosition.y,
  });
  target.dispatchEvent(ev);
  return ev;
}

function expectPointersState(actual: IPointersState, expected: IPointersState) {
  for (const pointerId in actual.pointers) {
    const actualState = actual.pointers[pointerId];
    if (actualState) {
      const expectedState = expected.pointers[pointerId];
      expectPointerState(actualState, expectedState);
    }
  }
  for (const pointerId in expected.pointers) {
    const expectedState = expected.pointers[pointerId];
    if (expectedState) {
      const actualState = actual.pointers[pointerId];
      expectPointerState(actualState, expectedState);
    }
  }
  expect(actual.active).toBe(expected.active);
}

function expectPointerState(
  actual: IPointerState | undefined,
  expected: IPointerState | undefined,
) {
  if (!!actual !== !!expected) {
    throw new Error(`expected: ${expected}, but actual: ${actual}`);
  } else if (actual && expected) {
    expectVec2F(actual.point, expected.point);
    expect(actual.pointerId).toBe(expected.pointerId);
  }
}

function checkSimpleMove(pointerId: number, pointerType: "touch") {
  return new Promise<void>((resolve) => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    elem.style.top = "100px";
    elem.style.left = "200px";
    elem.style.width = "300px";
    elem.style.height = "300px";
    const rect = elem.getBoundingClientRect();
    const centerY = (rect.top + rect.bottom) / 2;
    const centerX = (rect.left + rect.right) / 2;
    const center = new Vec2F(centerX, centerY);
    const end = center.add(new Vec2F(10, 0));

    const stateKey = pointerId;
    const precision = pointerType === "touch" ? "low" : "normal";

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    dispatchPointerEvent(elem, "pointerdown", pointerId, pointerType, center);
    dispatchPointerEvent(elem, "pointermove", pointerId, pointerType, end);
    dispatchPointerEvent(elem, "pointerup", pointerId, pointerType, end);
    subscription.unsubscribe();

    expect(states.length).toBe(3);
    expectPointersState(states[0], {
      pointers: {
        [stateKey]: {
          pointerId: stateKey,
          point: center,
          timeStamp: -1,
          start: {
            point: center,
            timeStamp: -1,
          },
          prev: null,
          precision,
          clientDistance: 0,
        },
      },
      active: 1,
      added: null,
      changed: null,
      timeStamp: -1,
      removed: null,
    });

    expectPointersState(states[1], {
      pointers: {
        [stateKey]: {
          pointerId: stateKey,
          point: end,
          timeStamp: -1,
          start: {
            point: center,
            timeStamp: -1,
          },
          prev: {
            point: center,
            timeStamp: -1,
          },
          precision,
          clientDistance: 10,
        },
      },
      active: 1,
      added: null,
      changed: null,
      timeStamp: -1,
      removed: null,
    });

    expectPointersState(states[2], {
      pointers: {},
      active: 0,
      added: null,
      changed: null,
      timeStamp: -1,
      removed: null,
    });

    document.body.removeChild(elem);
    resolve();
  });
}

describe("addPointerState", () => {
  it("should add a pointer to empty state", () => {
    const point = new Vec2F(100, 200);
    const state = addPointerState(EMPTY_STATE, { pointerId: 1, point, precision: "normal" }, 10);

    expect(state.active).toBe(1);
    expect(state.timeStamp).toBe(10);
    const added = state.added;
    expect(added).toBeDefined();
    if (added) {
      expect(added.pointerId).toBe(1);
      expectVec2F(added.point, point);
      expect(added.precision).toBe("normal");
      expect(added.clientDistance).toBe(0);
      expect(added.prev).toBeNull();
      expectVec2F(added.start.point, point);
      expect(added.start.timeStamp).toBe(10);
    }
    expect(state.changed).toBeNull();
    expect(state.removed).toBeNull();
  });

  it("should add multiple pointers", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 5);
    state = addPointerState(state, { pointerId: 2, point: new Vec2F(30, 40), precision: "low" }, 5);

    expect(state.active).toBe(2);
    expect(state.added).toBeDefined();
    expect(state.pointers[1]).toBeDefined();
    expect(state.pointers[2]).toBeDefined();
  });

  it("should not add a pointer that already exists", () => {
    const first = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "normal" }, 0);
    const second = addPointerState(first, { pointerId: 1, point: new Vec2F(50, 60), precision: "normal" }, 10);

    expect(second.active).toBe(1);
    expect(second.added).toBeNull();
    // Original position should be preserved
    expectVec2F(second.pointers[1]?.point, new Vec2F(10, 20));
  });

  it("should add a second pointer to existing state", () => {
    const first = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 0);
    const second = addPointerState(first, { pointerId: 2, point: new Vec2F(50, 60), precision: "low" }, 10);

    expect(second.active).toBe(2);
    const added = second.added;
    expect(added).toBeDefined();
    if (added) {
      expect(added.pointerId).toBe(2);
    }
    expect(second.pointers[1]).toBeDefined();
    expect(second.pointers[2]).toBeDefined();
  });
});

describe("changePointerState", () => {
  it("should update the position of an existing pointer", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 0);
    state = changePointerState(state, { pointerId: 1, point: new Vec2F(110, 120), precision: "normal" }, 10);

    expect(state.active).toBe(1);
    const changed = state.changed;
    expect(changed).toBeDefined();
    if (changed) {
      expectVec2F(changed.point, new Vec2F(110, 120));
    }
    expect(state.added).toBeNull();
    expect(state.removed).toBeNull();
    expectVec2F(state.pointers[1]?.point, new Vec2F(110, 120));
  });

  it("should preserve the start position", () => {
    const start = new Vec2F(100, 100);
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: start, precision: "normal" }, 0);
    state = changePointerState(state, { pointerId: 1, point: new Vec2F(200, 300), precision: "normal" }, 10);

    const changed = state.changed;
    expect(changed).toBeDefined();
    if (changed) {
      expectVec2F(changed.start.point, start);
      expect(changed.start.timeStamp).toBe(0);
    }
  });

  it("should set prev to the previous position", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 0);
    state = changePointerState(state, { pointerId: 1, point: new Vec2F(110, 100), precision: "normal" }, 10);

    const changed = state.changed;
    expect(changed).toBeDefined();
    if (changed) {
      expect(changed.prev).not.toBeNull();
      expectVec2F(changed.prev?.point, new Vec2F(100, 100));
      expect(changed.prev?.timeStamp).toBe(0);
    }
  });

  it("should accumulate clientDistance across multiple moves", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(0, 0), precision: "normal" }, 0);
    state = changePointerState(state, { pointerId: 1, point: new Vec2F(3, 4), precision: "normal" }, 10);
    // distance = sqrt(9+16) = 5
    expect(state.pointers[1]?.clientDistance).toBeCloseTo(5);

    state = changePointerState(state, { pointerId: 1, point: new Vec2F(6, 8), precision: "normal" }, 20);
    // additional distance = sqrt(9+16) = 5, total = 10
    expect(state.pointers[1]?.clientDistance).toBeCloseTo(10);
  });

  it("should ignore a pointer that does not exist", () => {
    const state = changePointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "normal" }, 10);

    expect(state.active).toBe(0);
    expect(state.changed).toBeNull();
  });

  it("should update the timestamp", () => {
    const initial = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(0, 0), precision: "normal" }, 0);
    const moved = changePointerState(initial, { pointerId: 1, point: new Vec2F(10, 0), precision: "normal" }, 42);

    expect(moved.timeStamp).toBe(42);
    expect(moved.changed?.timeStamp).toBe(42);
  });
});

describe("removePointerState", () => {
  it("should remove an existing pointer", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 0);
    state = removePointerState(state, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 10);

    expect(state.active).toBe(0);
    const removed = state.removed;
    expect(removed).toBeDefined();
    if (removed) {
      expect(removed.pointerId).toBe(1);
    }
    expect(state.added).toBeNull();
    expect(state.changed).toBeNull();
    expect(state.pointers[1]).toBeUndefined();
    expect(state.timeStamp).toBe(10);
  });

  it("should ignore a pointer that does not exist", () => {
    const state = removePointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "normal" }, 10);

    expect(state.active).toBe(0);
    expect(state.removed).toBeNull();
  });

  it("should remove one pointer and keep the other", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 0);
    state = addPointerState(state, { pointerId: 2, point: new Vec2F(30, 40), precision: "low" }, 0);

    state = removePointerState(state, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 10);

    expect(state.active).toBe(1);
    const removed = state.removed;
    expect(removed).toBeDefined();
    if (removed) {
      expect(removed.pointerId).toBe(1);
    }
    expect(state.pointers[1]).toBeUndefined();
    expect(state.pointers[2]).toBeDefined();
  });

  it("should remove multiple pointers", () => {
    let state = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 0);
    state = addPointerState(state, { pointerId: 2, point: new Vec2F(30, 40), precision: "low" }, 0);

    state = removePointerState(state, { pointerId: 1, point: new Vec2F(10, 20), precision: "low" }, 10);
    state = removePointerState(state, { pointerId: 2, point: new Vec2F(30, 40), precision: "low" }, 10);

    expect(state.active).toBe(0);
    const removed = state.removed;
    expect(removed).toBeDefined();
    expect(state.pointers[1]).toBeUndefined();
    expect(state.pointers[2]).toBeUndefined();
  });

  it("should not mutate the original state", () => {
    const initial = addPointerState(EMPTY_STATE, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 0);
    removePointerState(initial, { pointerId: 1, point: new Vec2F(100, 100), precision: "normal" }, 10);

    // Original state should still have the pointer
    expect(initial.active).toBe(1);
    expect(initial.pointers[1]).toBeDefined();
  });
});

describe("createPointersState", () => {
  it("tracks pointer positions", async () => {
    await checkSimpleMove(1, "touch");
  });

  it("should not call preventDefault when event is already prevented", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    const downEvent = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch", clientX: 50, clientY: 50 });
    downEvent.preventDefault();
    elem.dispatchEvent(downEvent);

    const moveEvent = new PointerEvent("pointermove", {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch",
      clientX: 60, clientY: 60,
    });
    moveEvent.preventDefault();
    elem.dispatchEvent(moveEvent);

    const upEvent = new PointerEvent("pointerup", {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: "touch",
      clientX: 60, clientY: 60,
    });
    upEvent.preventDefault();
    elem.dispatchEvent(upEvent);

    subscription.unsubscribe();
    expect(states.length).toBe(3);

    document.body.removeChild(elem);
  });

  it("should handle a second pointerdown from the same pointer while first is still active", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // First pointerdown
    dispatchPointerEvent(elem, "pointerdown", 1, "touch", new Vec2F(50, 50));
    // Second pointerdown with same ID (no-op in addPointerState, still emits)
    dispatchPointerEvent(elem, "pointerdown", 1, "touch", new Vec2F(60, 60));

    dispatchPointerEvent(elem, "pointermove", 1, "touch", new Vec2F(70, 70));
    dispatchPointerEvent(elem, "pointerup", 1, "touch", new Vec2F(70, 70));

    subscription.unsubscribe();
    expect(states.length).toBe(4);

    document.body.removeChild(elem);
  });

  it("should handle two simultaneous pointers from different IDs", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    dispatchPointerEvent(elem, "pointerdown", 1, "touch", new Vec2F(50, 50));
    dispatchPointerEvent(elem, "pointerdown", 2, "touch", new Vec2F(100, 100));
    expect(states[1].active).toBe(2);

    dispatchPointerEvent(elem, "pointerup", 1, "touch", new Vec2F(50, 50));
    expect(states[2].active).toBe(1);

    dispatchPointerEvent(elem, "pointermove", 2, "touch", new Vec2F(110, 110));
    expect(states[3].active).toBe(1);

    dispatchPointerEvent(elem, "pointerup", 2, "touch", new Vec2F(110, 110));
    expect(states[4].active).toBe(0);

    subscription.unsubscribe();
    expect(states.length).toBe(5);

    document.body.removeChild(elem);
  });

  it("should handle pointercancel by removing the pointer from state", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    dispatchPointerEvent(elem, "pointerdown", 1, "touch", new Vec2F(50, 50));
    dispatchPointerEvent(elem, "pointercancel", 1, "touch", new Vec2F(50, 50));

    subscription.unsubscribe();
    expect(states.length).toBe(2);
    expect(states[0].active).toBe(1);
    expect(states[1].active).toBe(0);

    document.body.removeChild(elem);
  });

  it("should clean up listeners on unsubscribe", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    mockPointerCapture(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    dispatchPointerEvent(elem, "pointerdown", 1, "touch", new Vec2F(50, 50));

    // Unsubscribe while pointer is still active
    subscription.unsubscribe();

    // Further events should not produce emissions
    dispatchPointerEvent(elem, "pointermove", 1, "touch", new Vec2F(70, 70));
    dispatchPointerEvent(elem, "pointerup", 1, "touch", new Vec2F(70, 70));

    expect(states.length).toBe(1); // Only the pointerdown

    document.body.removeChild(elem);
  });
});
