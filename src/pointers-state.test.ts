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

function createTouch(
  pointerId: number,
  clientPosition: Vec2F,
): Touch {
  return {
    identifier: pointerId,
    clientX: clientPosition.x,
    clientY: clientPosition.y,
  } as unknown as Touch;
}

function createTouchList(touches: Touch[]): TouchList {
  return {
    length: touches.length,
    item: (i: number) => touches[i] ?? null,
  } as unknown as TouchList;
}

function dispatchMouseEvent(
  el: HTMLElement,
  eventName: string,
  clientPosition: Vec2F,
): MouseEvent {
  const ev = document.createEvent("MouseEvent");
  ev.initMouseEvent(
    eventName,
    true /* bubble */,
    true /* cancelable */,
    window,
    0, //detail
    0, //screenX,
    0, //screenY,
    clientPosition.x, // clientX
    clientPosition.y, // clientY
    false, // ctrlKey,
    false, // altKey
    false, // shiftKey
    false, // metaKey */,
    0, // buttonArg
    null, // relatedTarget
  );
  el.dispatchEvent(ev);
  return ev;
}

function dispatchTouchEvent(
  el: HTMLElement | Window,
  pointerId: number,
  eventName: "touchstart" | "touchmove" | "touchend",
  clientPosition: Vec2F,
): TouchEvent {
  const touch = createTouch(pointerId, clientPosition);
  const touchList = createTouchList([touch]);
  const emptyTouchList = createTouchList([]);
  const ev = new TouchEvent(eventName, {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  Object.defineProperty(ev, "touches", {
    value: eventName === "touchstart" ? touchList : emptyTouchList,
  });
  Object.defineProperty(ev, "changedTouches", {
    value: eventName === "touchmove" || eventName === "touchend" ? touchList : emptyTouchList,
  });
  el.dispatchEvent(ev);
  return ev;
}

function dispatchMouseDown(el: HTMLElement, clientPosition: Vec2F): MouseEvent {
  return dispatchMouseEvent(el, "mousedown", clientPosition);
}

function dispatchMouseMove(el: HTMLElement, clientPosition: Vec2F): MouseEvent {
  return dispatchMouseEvent(el, "mousemove", clientPosition);
}

function dispatchMouseUp(el: HTMLElement, clientPosition: Vec2F): MouseEvent {
  return dispatchMouseEvent(el, "mouseup", clientPosition);
}

function dispatchPointerStart(
  el: HTMLElement,
  pointerId: string,
  clientPosition: Vec2F,
): MouseEvent | TouchEvent {
  switch (pointerId) {
    case "mouse":
      return dispatchMouseDown(el, clientPosition);
    default:
      return dispatchTouchEvent(
        el,
        parseInt(pointerId, 10),
        "touchstart",
        clientPosition,
      );
  }
}

function dispatchPointerMove(
  el: HTMLElement,
  pointerId: string,
  clientPosition: Vec2F,
): MouseEvent | TouchEvent {
  switch (pointerId) {
    case "mouse":
      return dispatchMouseMove(el, clientPosition);
    default:
      return dispatchTouchEvent(
        window,
        parseInt(pointerId, 10),
        "touchmove",
        clientPosition,
      );
  }
}

function dispatchPointerEnd(
  el: HTMLElement,
  pointerId: string,
  clientPosition: Vec2F,
): MouseEvent | TouchEvent {
  switch (pointerId) {
    case "mouse":
      return dispatchMouseUp(el, clientPosition);
    default:
      return dispatchTouchEvent(
        el,
        parseInt(pointerId, 10),
        "touchend",
        clientPosition,
      );
  }
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

function checkSimpleMove(pointerId: string) {
  return new Promise<void>((resolve) => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);
    elem.style.top = "100px";
    elem.style.left = "200px";
    elem.style.width = "300px";
    elem.style.height = "300px";
    const rect = elem.getBoundingClientRect();
    const centerY = (rect.top + rect.bottom) / 2;
    const centerX = (rect.left + rect.right) / 2;
    const center = new Vec2F(centerX, centerY);

    const end = center.add(new Vec2F(10, 0));

    // Resolve the pointer key used in the state map
    const isTouch = pointerId !== "mouse";
    const stateKey = isTouch ? `touch-${pointerId}` : pointerId;
    const precision = isTouch ? "low" : "normal";

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });
    dispatchPointerStart(elem, pointerId, center);
    dispatchPointerMove(elem, pointerId, end);
    dispatchPointerEnd(elem, pointerId, end);
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
      added: [],
      changed: [],
      timeStamp: -1,
      removed: [],
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
      added: [],
      changed: [],
      timeStamp: -1,
      removed: [],
    });

    expectPointersState(states[2], {
      pointers: {},
      active: 0,
      added: [],
      changed: [],
      timeStamp: -1,
      removed: [],
    });

    document.body.removeChild(elem);
    resolve();
  });
}

describe("addPointerState", () => {
  it("should add a pointer to empty state", () => {
    const point = new Vec2F(100, 200);
    const state = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point, precision: "normal" }],
      10,
    );

    expect(state.active).toBe(1);
    expect(state.timeStamp).toBe(10);
    expect(state.added.length).toBe(1);
    expect(state.added[0].pointerId).toBe("mouse");
    expectVec2F(state.added[0].point, point);
    expect(state.added[0].precision).toBe("normal");
    expect(state.added[0].clientDistance).toBe(0);
    expect(state.added[0].prev).toBeNull();
    expectVec2F(state.added[0].start.point, point);
    expect(state.added[0].start.timeStamp).toBe(10);
    expect(state.changed.length).toBe(0);
    expect(state.removed.length).toBe(0);
  });

  it("should add multiple pointers at once", () => {
    const state = addPointerState(
      EMPTY_STATE,
      [
        { pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" },
        { pointerId: "touch-1", point: new Vec2F(30, 40), precision: "low" },
      ],
      5,
    );

    expect(state.active).toBe(2);
    expect(state.added.length).toBe(2);
    expect(state.pointers["touch-0"]).toBeDefined();
    expect(state.pointers["touch-1"]).toBeDefined();
  });

  it("should not add a pointer that already exists", () => {
    const first = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(10, 20), precision: "normal" }],
      0,
    );
    const second = addPointerState(
      first,
      [{ pointerId: "mouse", point: new Vec2F(50, 60), precision: "normal" }],
      10,
    );

    expect(second.active).toBe(1);
    expect(second.added.length).toBe(0);
    // Original position should be preserved
    expectVec2F(second.pointers["mouse"]!.point, new Vec2F(10, 20));
  });

  it("should add a second pointer to existing state", () => {
    const first = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" }],
      0,
    );
    const second = addPointerState(
      first,
      [{ pointerId: "touch-1", point: new Vec2F(50, 60), precision: "low" }],
      10,
    );

    expect(second.active).toBe(2);
    expect(second.added.length).toBe(1);
    expect(second.added[0].pointerId).toBe("touch-1");
    expect(second.pointers["touch-0"]).toBeDefined();
    expect(second.pointers["touch-1"]).toBeDefined();
  });
});

describe("changePointerState", () => {
  it("should update the position of an existing pointer", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      0,
    );
    const moved = changePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(110, 120), precision: "normal" }],
      10,
    );

    expect(moved.active).toBe(1);
    expect(moved.changed.length).toBe(1);
    expect(moved.added.length).toBe(0);
    expect(moved.removed.length).toBe(0);
    expectVec2F(moved.changed[0].point, new Vec2F(110, 120));
    expectVec2F(moved.pointers["mouse"]!.point, new Vec2F(110, 120));
  });

  it("should preserve the start position", () => {
    const start = new Vec2F(100, 100);
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: start, precision: "normal" }],
      0,
    );
    const moved = changePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(200, 300), precision: "normal" }],
      10,
    );

    expectVec2F(moved.changed[0].start.point, start);
    expect(moved.changed[0].start.timeStamp).toBe(0);
  });

  it("should set prev to the previous position", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      0,
    );
    const moved = changePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(110, 100), precision: "normal" }],
      10,
    );

    expect(moved.changed[0].prev).not.toBeNull();
    expectVec2F(moved.changed[0].prev!.point, new Vec2F(100, 100));
    expect(moved.changed[0].prev!.timeStamp).toBe(0);
  });

  it("should accumulate clientDistance across multiple moves", () => {
    let state = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(0, 0), precision: "normal" }],
      0,
    );
    state = changePointerState(
      state,
      [{ pointerId: "mouse", point: new Vec2F(3, 4), precision: "normal" }],
      10,
    );
    // distance = sqrt(9+16) = 5
    expect(state.pointers["mouse"]!.clientDistance).toBeCloseTo(5);

    state = changePointerState(
      state,
      [{ pointerId: "mouse", point: new Vec2F(6, 8), precision: "normal" }],
      20,
    );
    // additional distance = sqrt(9+16) = 5, total = 10
    expect(state.pointers["mouse"]!.clientDistance).toBeCloseTo(10);
  });

  it("should ignore a pointer that does not exist", () => {
    const state = changePointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(10, 20), precision: "normal" }],
      10,
    );

    expect(state.active).toBe(0);
    expect(state.changed.length).toBe(0);
  });

  it("should update the timestamp", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(0, 0), precision: "normal" }],
      0,
    );
    const moved = changePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(10, 0), precision: "normal" }],
      42,
    );

    expect(moved.timeStamp).toBe(42);
    expect(moved.changed[0].timeStamp).toBe(42);
  });
});

describe("removePointerState", () => {
  it("should remove an existing pointer", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      0,
    );
    const removed = removePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      10,
    );

    expect(removed.active).toBe(0);
    expect(removed.removed.length).toBe(1);
    expect(removed.removed[0].pointerId).toBe("mouse");
    expect(removed.added.length).toBe(0);
    expect(removed.changed.length).toBe(0);
    expect(removed.pointers["mouse"]).toBeUndefined();
    expect(removed.timeStamp).toBe(10);
  });

  it("should ignore a pointer that does not exist", () => {
    const state = removePointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(10, 20), precision: "normal" }],
      10,
    );

    expect(state.active).toBe(0);
    expect(state.removed.length).toBe(0);
  });

  it("should remove one pointer and keep the other", () => {
    let state = addPointerState(
      EMPTY_STATE,
      [
        { pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" },
        { pointerId: "touch-1", point: new Vec2F(30, 40), precision: "low" },
      ],
      0,
    );
    state = removePointerState(
      state,
      [{ pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" }],
      10,
    );

    expect(state.active).toBe(1);
    expect(state.removed.length).toBe(1);
    expect(state.removed[0].pointerId).toBe("touch-0");
    expect(state.pointers["touch-0"]).toBeUndefined();
    expect(state.pointers["touch-1"]).toBeDefined();
  });

  it("should remove multiple pointers at once", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [
        { pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" },
        { pointerId: "touch-1", point: new Vec2F(30, 40), precision: "low" },
      ],
      0,
    );
    const removed = removePointerState(
      initial,
      [
        { pointerId: "touch-0", point: new Vec2F(10, 20), precision: "low" },
        { pointerId: "touch-1", point: new Vec2F(30, 40), precision: "low" },
      ],
      10,
    );

    expect(removed.active).toBe(0);
    expect(removed.removed.length).toBe(2);
    expect(removed.pointers["touch-0"]).toBeUndefined();
    expect(removed.pointers["touch-1"]).toBeUndefined();
  });

  it("should not mutate the original state", () => {
    const initial = addPointerState(
      EMPTY_STATE,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      0,
    );
    removePointerState(
      initial,
      [{ pointerId: "mouse", point: new Vec2F(100, 100), precision: "normal" }],
      10,
    );

    // Original state should still have the pointer
    expect(initial.active).toBe(1);
    expect(initial.pointers["mouse"]).toBeDefined();
  });
});

describe("createPointersState", () => {
  it("tracks mouse positions", async () => {
    await checkSimpleMove("mouse");
  });
  it("tracks touch positions", async () => {
    await checkSimpleMove("1");
  });

  it("should not call preventDefault when event is already prevented", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // Dispatch a mousedown that is already defaultPrevented
    const downEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 50,
    });
    downEvent.preventDefault();
    elem.dispatchEvent(downEvent);

    // Dispatch a mousemove that is already defaultPrevented
    const moveEvent = new MouseEvent("mousemove", {
      bubbles: true,
      cancelable: true,
      clientX: 60,
      clientY: 60,
    });
    moveEvent.preventDefault();
    window.dispatchEvent(moveEvent);

    // Dispatch a mouseup that is already defaultPrevented
    const upEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: 60,
      clientY: 60,
    });
    upEvent.preventDefault();
    window.dispatchEvent(upEvent);

    subscription.unsubscribe();
    expect(states.length).toBe(3);

    document.body.removeChild(elem);
  });

  it("should handle second mousedown while first pointer is still active", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // First mousedown
    dispatchMouseDown(elem, new Vec2F(50, 50));
    // Second mousedown without mouseup (subscribeChanges already active)
    dispatchMouseDown(elem, new Vec2F(60, 60));

    // Move and release
    dispatchMouseEvent(window as unknown as HTMLElement, "mousemove", new Vec2F(70, 70));
    dispatchMouseEvent(window as unknown as HTMLElement, "mouseup", new Vec2F(70, 70));

    subscription.unsubscribe();
    // Should have received: mousedown, mousedown, mousemove, mouseup
    expect(states.length).toBe(4);

    document.body.removeChild(elem);
  });

  it("should handle touch with null item in TouchList", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // Create a TouchList that reports length=2 but item(1) returns null
    const touch = createTouch(0, new Vec2F(50, 50));
    const touchListWithNull = {
      length: 2,
      item: (i: number) => (i === 0 ? touch : null),
    } as unknown as TouchList;

    const ev = new TouchEvent("touchstart", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    Object.defineProperty(ev, "touches", { value: touchListWithNull });
    Object.defineProperty(ev, "changedTouches", {
      value: createTouchList([]),
    });
    elem.dispatchEvent(ev);

    subscription.unsubscribe();
    // Only one valid touch should produce one pointer
    expect(states.length).toBe(1);
    expect(states[0].active).toBe(1);

    document.body.removeChild(elem);
  });

  it("should keep changesSubscription active when one touch ends but another remains", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // First touch start
    dispatchTouchEvent(elem, 0, "touchstart", new Vec2F(50, 50));

    // Second touch start
    dispatchTouchEvent(elem, 1, "touchstart", new Vec2F(100, 100));

    // End first touch while second is still active (active goes from 2 to 1)
    dispatchTouchEvent(window as unknown as HTMLElement, 0, "touchend", new Vec2F(50, 50));

    // Move second touch — should still work since subscription is alive
    dispatchTouchEvent(window as unknown as HTMLElement, 1, "touchmove", new Vec2F(110, 110));

    // End second touch
    dispatchTouchEvent(window as unknown as HTMLElement, 1, "touchend", new Vec2F(110, 110));

    subscription.unsubscribe();
    // touchstart, touchstart, touchend, touchmove, touchend
    expect(states.length).toBe(5);
    // After last event, should have 0 active pointers
    expect(states[states.length - 1].active).toBe(0);

    document.body.removeChild(elem);
  });

  it("should clean up subscriptions on unsubscribe", () => {
    const elem = document.createElement("div");
    document.body.appendChild(elem);

    const states: IPointersState[] = [];
    const subscription = createPointersState(elem).subscribe((state) => {
      states.push(state);
    });

    // Start a pointer interaction (activates changesSubscription)
    dispatchMouseDown(elem, new Vec2F(50, 50));

    // Unsubscribe while pointer is still active (teardown with changesSubscription active)
    subscription.unsubscribe();

    // Further events should not produce emissions
    dispatchMouseEvent(window as unknown as HTMLElement, "mousemove", new Vec2F(70, 70));
    dispatchMouseEvent(window as unknown as HTMLElement, "mouseup", new Vec2F(70, 70));

    expect(states.length).toBe(1); // Only the mousedown

    document.body.removeChild(elem);
  });
});
