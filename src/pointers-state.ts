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
  shiftKey: false,
  ctrlKey: false,
  altKey: false
};

export type PointersStateMap = { [key: string]: IPointerState };

/**
 * Produces a new state with the given pointers added.
 * @param state - The current pointer state.
 * @param event - The pointer change event to add.
 * @returns A new pointer state with the added pointers.
 */
export function addPointerState(state: IPointersState, event: IPointerChangeEvent): IPointersState {
  const existingPointer = state.pointers[event.pointerId];

  const newPointer: IPointerState | undefined = existingPointer ? undefined : {
    pointerId: event.pointerId,
    point: event.point,
    timeStamp: event.timeStamp,
    start: {
      point: event.point,
      timeStamp: event.timeStamp
    },
    prev: null,
    precision: event.precision,
    clientDistance: 0
  };

  return {
    ...state,
    timeStamp: event.timeStamp,
    pointers: existingPointer ? state.pointers : {
      ...state.pointers,
      [event.pointerId]: newPointer
    },
    active: existingPointer ? state.active : state.active + 1,
    added: newPointer || null,
    changed: null,
    removed: null,
    shiftKey: event.shiftKey ?? false,
    ctrlKey: event.ctrlKey ?? false,
    altKey: event.altKey ?? false
  };
}

/**
 * Produces a new state with the given pointers updated to new positions.
 * @param state - The current pointer state.
 * @param event - The pointer change event to apply.
 * @returns A new pointer state with the changed pointers.
 */
export function changePointerState(state: IPointersState, event: IPointerChangeEvent): IPointersState {
  const oldPointer = state.pointers[event.pointerId];

  const changedPointer: IPointerState | undefined = oldPointer ? {
    pointerId: oldPointer.pointerId,
    point: event.point,
    timeStamp: event.timeStamp,
    start: oldPointer.start,
    prev: {
      point: oldPointer.point,
      timeStamp: oldPointer.timeStamp
    },
    precision: event.precision,
    clientDistance: oldPointer.clientDistance + event.point.sub(oldPointer.point).length()
  } : undefined;

  return {
    ...state,
    timeStamp: event.timeStamp,
    pointers: changedPointer ? {
      ...state.pointers,
      [event.pointerId]: changedPointer
    } : state.pointers,
    added: null,
    changed: changedPointer || null,
    removed: null,
    shiftKey: event.shiftKey ?? false,
    ctrlKey: event.ctrlKey ?? false,
    altKey: event.altKey ?? false
  };
}

/**
 * Produces a new state with the given pointers removed.
 * @param state - The current pointer state.
 * @param event - The pointer change events identifying pointers to remove.
 * @returns A new pointer state with the removed pointers.
 */
export function removePointerState(state: IPointersState, event: IPointerChangeEvent): IPointersState {
  const { [event.pointerId]: oldPointer, ...otherPointers } = state.pointers;

  return {
    ...state,
    timeStamp: event.timeStamp,
    pointers: otherPointers,
    active: oldPointer ? state.active - 1 : state.active,
    added: null,
    changed: null,
    removed: oldPointer || null,
    shiftKey: event.shiftKey ?? false,
    ctrlKey: event.ctrlKey ?? false,
    altKey: event.altKey ?? false
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
      state = addPointerState(state, getPointerPosition(event));
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onMove = (event: PointerEvent) => {
      state = changePointerState(state, getPointerPosition(event));
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onUp = (event: PointerEvent) => {
      try {
        node.releasePointerCapture(event.pointerId);
      } catch { /* empty */ }
      state = removePointerState(state, getPointerPosition(event));
      if (!event.defaultPrevented) event.preventDefault();
      subscriber.next(state);
    };

    const onCancel = (event: PointerEvent) => {
      try {
        node.releasePointerCapture(event.pointerId);
      } catch { /* empty */ }
      state = removePointerState(state, getPointerPosition(event));
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
    timeStamp: event.timeStamp,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey
  };
}

/** A snapshot of all active pointer states at a given point in time. */
export interface IPointersState {
  /** Map of pointer ID to its current state. */
  readonly pointers: PointersStateMap;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
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
  /** The event timestamp. */
  readonly timeStamp: number;
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly altKey?: boolean;
}
