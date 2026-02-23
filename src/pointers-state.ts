import { Observable } from "./observable";
import { Vec2F } from "./vec2f";

/** The default empty pointer state with no active pointers. */
export const EMPTY_STATE: IPointersState = {
  active: 0,
  added: null,
  changed: null,
  timeStamp: -1,
  pointers: {},
  removed: null,
};

type PointersStateMap = { [key: string]: IPointerState | undefined };

/**
 * Produces a new state with the given pointers added.
 * @param state - The current pointer state.
 * @param add - The pointer change event to add.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the added pointers.
 */
export function addPointerState(state: IPointersState, add: IPointerChangeEvent, timeStamp: number): IPointersState {
  if (!state.pointers[add.pointerId]) {
    const newPointer: IPointerState = {
      pointerId: add.pointerId,
      point: add.point,
      timeStamp: timeStamp,
      start: {
        point: add.point,
        timeStamp,
      },
      prev: null,
      precision: add.precision,
      clientDistance: 0,
    };

    return {
      ...state,
      timeStamp,
      pointers: {
        ...state.pointers,
        [add.pointerId]: newPointer
      },
      added: newPointer,
      changed: null,
      removed: null,
      active: state.active + 1,
    };
  }

  return {
    ...state,
    added: null,
    changed: null,
    removed: null,
  };
}

/**
 * Produces a new state with the given pointers updated to new positions.
 * @param state - The current pointer state.
 * @param change - The pointer change event to apply.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the changed pointers.
 */
export function changePointerState(state: IPointersState, change: IPointerChangeEvent, timeStamp: number): IPointersState {
  const oldPointer = state.pointers[change.pointerId];
  if (oldPointer) {
    const changedPointer: IPointerState = {
      pointerId: oldPointer.pointerId,
      point: change.point,
      timeStamp: timeStamp,
      start: oldPointer.start,
      prev: {
        point: oldPointer.point,
        timeStamp: oldPointer.timeStamp,
      },
      precision: change.precision,
      clientDistance:
        oldPointer.clientDistance +
        change.point.sub(oldPointer.point).length(),
    };

    return {
      ...state,
      timeStamp,
      pointers: {
        ...state.pointers,
        [change.pointerId]: changedPointer
      },
      added: null,
      changed: changedPointer,
      removed: null,
    };
  }
  return {
    ...state,
    added: null,
    changed: null,
    removed: null,
  };
}

/**
 * Produces a new state with the given pointers removed.
 * @param state - The current pointer state.
 * @param remove - The pointer change events identifying pointers to remove.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the removed pointers.
 */
export function removePointerState(state: IPointersState, remove: IPointerChangeEvent, timeStamp: number): IPointersState {
  const oldPointer = state.pointers[remove.pointerId];
  if (oldPointer) {
    const pointers = { ...state.pointers };
    delete pointers[remove.pointerId];
    return {
      ...state,
      timeStamp,
      pointers,
      added: null,
      changed: null,
      removed: oldPointer,
      active: state.active - 1,
    };
  }
  return {
    ...state,
    added: null,
    changed: null,
    removed: null
  };
}

/**
 * Creates an observable that tracks pointer state on the given element using the
 * Pointer Events API. Subscribing starts listening for `pointerdown`, `pointermove`,
 * `pointerup`, and `pointercancel` on the element. Pointer capture is used to route
 * move and up events to the element even when the pointer leaves its bounds.
 * @param node - The DOM element to listen for pointer events on.
 * @returns An observable that emits a new {@link IPointersState} on every pointer change.
 */
export function createPointersState(node: HTMLElement): Observable<IPointersState> {
  return new Observable<IPointersState>((subscriber) => {
    let state: IPointersState = EMPTY_STATE;

    const onDown = (event: PointerEvent) => {
      try {
        node.setPointerCapture(event.pointerId);
      } catch { /* empty */ }
      state = addPointerState(state, getPointerPosition(event), event.timeStamp);
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onMove = (event: PointerEvent) => {
      state = changePointerState(state, getPointerPosition(event), event.timeStamp);
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onUp = (event: PointerEvent) => {
      try {
        node.releasePointerCapture(event.pointerId);
      } catch { /* empty */ }
      state = removePointerState(state, getPointerPosition(event), event.timeStamp);
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onCancel = (event: PointerEvent) => {
      try {
        node.releasePointerCapture(event.pointerId);
      } catch { /* empty */ }
      state = removePointerState(state, getPointerPosition(event), event.timeStamp);
      subscriber.next(state);
    };

    node.addEventListener("pointerdown", onDown, { passive: false });
    node.addEventListener("pointermove", onMove, { passive: false });
    node.addEventListener("pointerup", onUp, { passive: false });
    node.addEventListener("pointercancel", onCancel);

    return () => {
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onCancel);
    };
  });
}

/**
 * Converts a `PointerEvent` to a pointer change event.
 * @param event - The browser `PointerEvent`.
 * @returns A pointer change event; precision is `"low"` for touch, `"normal"` otherwise.
 */
function getPointerPosition(event: PointerEvent): IPointerChangeEvent {
  return {
    pointerId: event.pointerId,
    point: new Vec2F(event.clientX, event.clientY),
    precision: event.pointerType === "touch" ? "low" : "normal",
  };
}

/** A snapshot of all active pointer states at a given point in time. */
export interface IPointersState {
  /** Map of pointer ID to its current state. */
  readonly pointers: PointersStateMap;
  /** Number of currently active pointers. */
  readonly active: number;
  /** Pointers that were added in this update. */
  readonly added: IPointerState | null;
  /** Pointers that were removed in this update. */
  readonly removed: IPointerState | null;
  /** Pointers that changed position in this update. */
  readonly changed: IPointerState | null;
  /** Timestamp of the event that produced this state. */
  readonly timeStamp: number;
}

/** A recorded position with its timestamp. */
export interface IPointerPosition {
  /** The position in client coordinates. */
  readonly point: Vec2F;
  /** The timestamp when this position was recorded. */
  readonly timeStamp: number;
}

/** The full state of a single tracked pointer. */
export interface IPointerState {
  /** Unique identifier for this pointer. */
  readonly pointerId: number;
  /** Current position in client coordinates. */
  readonly point: Vec2F;
  /** Timestamp of the last update. */
  readonly timeStamp: number;
  /** The position and timestamp when this pointer was first added. */
  readonly start: IPointerPosition;
  /** The previous position and timestamp, or `null` if the pointer has not moved. */
  readonly prev: IPointerPosition | null;
  /** Input precision level: `"low"` for touch, `"normal"` for mouse. */
  readonly precision: "low" | "normal";
  /** Total distance the pointer has travelled in client coordinates. */
  readonly clientDistance: number;
}

/** Internal representation of a single pointer change. */
export interface IPointerChangeEvent {
  /** The position in client coordinates. */
  readonly point: Vec2F;
  /** Unique identifier for this pointer. */
  readonly pointerId: number;
  /** Input precision level. */
  readonly precision: "low" | "normal";
}
