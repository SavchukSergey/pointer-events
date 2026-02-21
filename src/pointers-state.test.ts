import { expectVec2F } from "./math.testing";
import type { IPointersState, IPointerState } from "./pointers-state";
import { createPointersState } from "./pointers-state";
import { Vec2F } from "./vec2f";

function createTouch(
  el: HTMLElement,
  pointerId: number,
  clientPosition: Vec2F,
): Touch {
  return new Touch({
    identifier: pointerId,
    clientX: clientPosition.x,
    clientY: clientPosition.y,
    target: el,
  });
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
  el: HTMLElement,
  pointerId: number,
  eventName: string,
  clientPosition: Vec2F,
): TouchEvent {
  const ev = new TouchEvent(eventName, {
    // identifier: pointerId,
    changedTouches: [createTouch(el, pointerId, clientPosition)],
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
        el,
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
    fail(`expected: ${actual}, but actual: ${actual}`);
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
        mouse: {
          pointerId,
          point: center,
          timeStamp: -1,
          start: {
            point: center,
            timeStamp: -1,
          },
          prev: null,
          precision: "normal",
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
        mouse: {
          pointerId,
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
          precision: "normal",
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

describe("createPointersState", () => {
  it("tracks pointers positions", async () => {
    await checkSimpleMove("mouse");
  });
});
