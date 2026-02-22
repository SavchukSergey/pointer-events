import { fromEvent, merge, Observable, Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { Vec2F } from "./vec2f";

/** The default empty pointer state with no active pointers. */
export const EMPTY_STATE: IPointersState = {
  active: 0,
  added: [],
  changed: [],
  timeStamp: -1,
  pointers: {},
  removed: [],
};

type PointersStateMap = { [key: string]: IPointerState | undefined };

const emptyList: readonly IPointerState[] = [];

/**
 * Produces a new state with the given pointers added.
 * @param state - The current pointer state.
 * @param curadd - The pointer change events to add.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the added pointers.
 */
export function addPointerState(
  state: IPointersState,
  curadd: readonly IPointerChangeEvent[],
  timeStamp: number,
): IPointersState {
  const pointers = { ...state.pointers };
  let active = state.active;
  const added: IPointerState[] = [];

  for (const add of curadd) {
    if (!pointers[add.pointerId]) {
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
      pointers[add.pointerId] = newPointer;

      active++;
      added.push(newPointer);
    }
  }

  return {
    timeStamp,
    pointers,
    added,
    changed: emptyList,
    removed: emptyList,
    active,
  };
}

/**
 * Produces a new state with the given pointers updated to new positions.
 * @param state - The current pointer state.
 * @param curchange - The pointer change events to apply.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the changed pointers.
 */
export function changePointerState(
  state: IPointersState,
  curchange: readonly IPointerChangeEvent[],
  timeStamp: number,
): IPointersState {
  const pointers = { ...state.pointers };
  const changed: IPointerState[] = [];
  for (const change of curchange) {
    const oldPointer = pointers[change.pointerId];
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
      pointers[change.pointerId] = changedPointer;
      changed.push(changedPointer);
    }
  }
  return {
    timeStamp,
    pointers,
    added: emptyList,
    changed,
    removed: emptyList,
    active: state.active,
  };
}

/**
 * Produces a new state with the given pointers removed.
 * @param state - The current pointer state.
 * @param curremove - The pointer change events identifying pointers to remove.
 * @param timeStamp - The event timestamp.
 * @returns A new pointer state with the removed pointers.
 */
export function removePointerState(
  state: IPointersState,
  curremove: readonly IPointerChangeEvent[],
  timeStamp: number,
): IPointersState {
  const pointers = { ...state.pointers };
  let active = state.active;
  const removed: IPointerState[] = [];
  for (const remove of curremove) {
    const oldPointer = pointers[remove.pointerId];
    if (oldPointer) {
      delete pointers[remove.pointerId];
      active--;
      removed.push(oldPointer);
    }
  }
  return {
    timeStamp,
    pointers,
    added: emptyList,
    changed: emptyList,
    removed,
    active,
  };
}

/**
 * Creates an observable that tracks mouse and touch pointer state on the given element.
 * Subscribing starts listening for `mousedown` / `touchstart` on the element and
 * `mousemove` / `touchmove` / `mouseup` / `touchend` on the window.
 * @param node - The DOM element to listen for pointer-down events on.
 * @returns An observable that emits a new {@link IPointersState} on every pointer change.
 */
export function createPointersState(node: Element): Observable<IPointersState> {
  return new Observable<IPointersState>((subscriber) => {
    let state: IPointersState = EMPTY_STATE;

    const touchStart$ = fromEvent<TouchEvent>(node, "touchstart", {
      passive: false,
    }).pipe(
      map<TouchEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: getTouchesPosition(event.touches),
        };
      }),
    );

    const mouseDown$ = fromEvent<MouseEvent>(node, "mousedown", {
      passive: false,
    }).pipe(
      map<MouseEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: [getMousePosition(event)],
        };
      }),
    );

    const touchMove$ = fromEvent<TouchEvent>(window, "touchmove", {
      passive: false,
    }).pipe(
      map<TouchEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: getTouchesPosition(event.changedTouches),
        };
      }),
    );

    const mouseMove$ = fromEvent<MouseEvent>(window, "mousemove", {
      passive: false,
    }).pipe(
      map<MouseEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: [getMousePosition(event)],
        };
      }),
    );

    const mouseUp$ = fromEvent<MouseEvent>(window, "mouseup", {
      passive: false,
    }).pipe(
      map<MouseEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: [getMousePosition(event)],
        };
      }),
    );

    const touchEnd$ = fromEvent<TouchEvent>(window, "touchend", {
      passive: false,
    }).pipe(
      map<TouchEvent, IPointersChangeEvent>((event) => {
        return {
          event,
          pointers: getTouchesPosition(event.changedTouches),
        };
      }),
    );

    const changes$ = merge(mouseMove$, touchMove$);
    const removals$ = merge(mouseUp$, touchEnd$);

    let changesSubscription: Subscription | null = null;

    function subscribeChanges(): void {
      if (!changesSubscription) {
        changesSubscription = new Subscription();
        changesSubscription.add(
          changes$.subscribe((cur) => {
            state = changePointerState(
              state,
              cur.pointers,
              cur.event.timeStamp,
            );
            if (!cur.event.defaultPrevented) {
              cur.event.preventDefault();
            }
            subscriber.next(state);
          }),
        );
        changesSubscription.add(
          removals$.subscribe((cur) => {
            state = removePointerState(
              state,
              cur.pointers,
              cur.event.timeStamp,
            );
            if (!cur.event.defaultPrevented) {
              cur.event.preventDefault();
            }
            if (state.active === 0 && changesSubscription) {
              changesSubscription.unsubscribe();
              changesSubscription = null;
            }
            subscriber.next(state);
          }),
        );
      }
    }

    const startsub = merge(mouseDown$, touchStart$).subscribe((cur) => {
      state = addPointerState(state, cur.pointers, cur.event.timeStamp);
      if (!cur.event.defaultPrevented) {
        cur.event.preventDefault();
      }
      subscriber.next(state);
      subscribeChanges();
    });

    return () => {
      startsub.unsubscribe();
      changesSubscription?.unsubscribe();
    };
  });
}

/**
 * Extracts pointer change events from a `TouchList`.
 * @param touches - The browser `TouchList` to read from.
 * @returns An array of pointer change events.
 */
function getTouchesPosition(
  touches: TouchList,
): readonly IPointerChangeEvent[] {
  const res: IPointerChangeEvent[] = [];
  for (let i = 0; i < touches.length; i++) {
    const touch = touches.item(i);
    if (touch) {
      res.push(getTouchPosition(touch));
    }
  }
  return res;
}

/**
 * Converts a single `Touch` to a pointer change event.
 * @param touch - The browser `Touch` object.
 * @returns A pointer change event with `"low"` precision.
 */
function getTouchPosition(touch: Touch): IPointerChangeEvent {
  return {
    pointerId: `touch-${touch.identifier}`,
    point: new Vec2F(touch.clientX, touch.clientY),
    precision: "low",
  };
}

/**
 * Converts a `MouseEvent` to a pointer change event.
 * @param mouseEvent - The browser `MouseEvent`.
 * @returns A pointer change event with `"normal"` precision.
 */
function getMousePosition(mouseEvent: MouseEvent): IPointerChangeEvent {
  return {
    pointerId: "mouse",
    point: new Vec2F(mouseEvent.clientX, mouseEvent.clientY),
    precision: "normal",
  };
}

/** A snapshot of all active pointer states at a given point in time. */
export interface IPointersState {
  /** Map of pointer ID to its current state. */
  readonly pointers: PointersStateMap;
  /** Number of currently active pointers. */
  readonly active: number;
  /** Pointers that were added in this update. */
  readonly added: readonly IPointerState[];
  /** Pointers that were removed in this update. */
  readonly removed: readonly IPointerState[];
  /** Pointers that changed position in this update. */
  readonly changed: readonly IPointerState[];
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
  readonly pointerId: string;
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

/** Internal event grouping a DOM event with its extracted pointer changes. */
interface IPointersChangeEvent {
  /** The original DOM event. */
  readonly event: Event;
  /** The extracted pointer change events. */
  readonly pointers: readonly IPointerChangeEvent[];
}

/** Internal representation of a single pointer change. */
export interface IPointerChangeEvent {
  /** The position in client coordinates. */
  readonly point: Vec2F;
  /** Unique identifier for this pointer. */
  readonly pointerId: string;
  /** Input precision level. */
  readonly precision: "low" | "normal";
}
