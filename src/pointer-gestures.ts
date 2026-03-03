import type { Matrix3x3 } from "./matrix3x3";
import { Multitouch } from "./multitouch";
import { filter, fromEvent, Subject, type Subscription } from "./observable";
import {
  EMPTY_STATE,
  type IPointersState,
  type PointersStateMap
} from "./pointers-state";
import type { Vec2F } from "./vec2f";

const cancel$ = fromEvent<KeyboardEvent>(window, "keydown").pipe(
  filter((kb) => kb.key === "Escape")
);

/**
 * Recognises tap, double-tap, long-tap, and drag gestures from a stream
 * of pointer states emitted by {@link createPointersState}.
 *
 * @typeParam TDragData - Application-specific payload attached to drag operations.
 */
export class PointerGestures<TDragData> {
  /** Emits when a double-tap gesture is recognised. */
  public readonly doubleTaps$ = new Subject<IPointerTapEvent>();
  /** Emits when a single-tap gesture is recognised. */
  public readonly taps$ = new Subject<IPointerTapEvent>();
  /** Emits when a long-tap gesture is recognised. */
  public readonly longTaps$ = new Subject<IPointerTapEvent>();
  /** Emits when a drag gesture begins and the consumer can attach data. Consumer has to set drag data in the event otherwise drag&drop considered unsupзorted. */
  public readonly dragStart$ = new Subject<IPointerDragStartEvent<TDragData>>();
  /** Emits on every pointer move during an active drag. */
  public readonly dragMove$ = new Subject<IPointerDragEvent<TDragData>>();
  /** Emits when all pointers are released during an active drag. */
  public readonly dragEnd$ = new Subject<IPointerDropEvent<TDragData>>();
  /** Emits when a drag is cancelled (e.g. by pressing Escape). */
  public readonly dragCancel$ = new Subject<IPointerDragCancelEvent<TDragData>>();

  private readonly _edges: [IPointersState, IPointersState, IPointersState, IPointersState] = [EMPTY_STATE, EMPTY_STATE, EMPTY_STATE, EMPTY_STATE];
  private _doubleTapTimeout: number | undefined;
  private _longTapTimeout: number | undefined;
  private _dragState: IDragState<TDragData> | undefined;

  private readonly options: IPointerGesturesOptions;

  constructor(options: Partial<IPointerGesturesOptions> = {}) {
    this.options = {
      ...{
        doubleTapTimeWindow: 300,
        longTapTimeWindow: 1000,
        dragThreshold: 10
      },
      ...options
    };
  }

  /**
   * Resets the edge history buffer to empty states.
   */
  private resetEdgesHistory(): void {
    this._edges[0] = EMPTY_STATE;
    this._edges[1] = EMPTY_STATE;
    this._edges[2] = EMPTY_STATE;
    this._edges[3] = EMPTY_STATE;
  }

  /**
   * Cancels the pending double-tap timeout, if any.
   */
  private cancelDoubleTapTimeout(): void {
    if (this._doubleTapTimeout) {
      clearTimeout(this._doubleTapTimeout);
      this._doubleTapTimeout = undefined;
    }
  }

  /**
   * Cancels the pending long-tap timeout, if any.
   */
  private cancelLongTapTimeout(): void {
    if (this._longTapTimeout) {
      clearTimeout(this._longTapTimeout);
      this._longTapTimeout = undefined;
    }
  }

  /**
   * Resets all internal gesture state (edges, timeouts).
   */
  private reset(): void {
    this.resetEdgesHistory();
    this.cancelDoubleTapTimeout();
    this.cancelLongTapTimeout();
  }

  /**
   * Pushes a new state onto the edge history buffer, shifting older entries out.
   * @param state - The pointer state to record.
   */
  private pushEdge(state: IPointersState): void {
    const edgesHistory = this._edges;
    edgesHistory[0] = edgesHistory[1];
    edgesHistory[1] = edgesHistory[2];
    edgesHistory[2] = edgesHistory[3];
    edgesHistory[3] = state;
  }

  /**
   * Attempts to match a double-tap pattern from the edge history.
   * If matched, emits on {@link doubleTaps$} and resets state.
   * @returns `true` if a double-tap was recognised, `false` otherwise.
   */
  private matchDoubleTap(): boolean {
    const edgesHistory = this._edges;
    const raisingEdge = edgesHistory[2];
    const fallingEdge = edgesHistory[3];
    // double check edges (as we may have EMPTY_STATEs)
    const added = edgesHistory[0].added;
    if (edgesHistory[0].active && !edgesHistory[1].active && raisingEdge.active && !fallingEdge.active && added) {
      const duration = edgesHistory[3].timeStamp - edgesHistory[0].timeStamp;
      const removed = fallingEdge.removed;
      if (duration <= this.options.doubleTapTimeWindow && removed) {
        const event: IPointerTapEvent = {
          pointerId: added.pointerId.toString(),
          point: removed.point,
          precision: added.precision,
          timeStamp: fallingEdge.timeStamp
        };
        this.reset();
        this.doubleTaps$.next(event);
        return true;
      }
    }
    return false;
  }

  /**
   * Attempts to match a single-tap pattern from the edge history.
   * If matched, schedules a deferred emit on {@link taps$} to allow
   * double-tap detection to take priority.
   */
  private matchTap(): void {
    const edgesHistory = this._edges;
    const raisingEdge = edgesHistory[2];
    const fallingEdge = edgesHistory[3];
    const added = raisingEdge.added;
    const removed = fallingEdge.removed;
    if (edgesHistory[2].active && !edgesHistory[3].active && added && removed) {
      const distance = removed.clientDistance;
      if (distance < this.options.dragThreshold) {
        const timeSpent = fallingEdge.timeStamp - raisingEdge.timeStamp;
        const timeLeft = this.options.doubleTapTimeWindow - timeSpent;
        this.cancelDoubleTapTimeout();
        this._doubleTapTimeout = timeout(() => {
          this.reset();
          this.taps$.next({
            pointerId: added.pointerId.toString(),
            point: removed.point,
            precision: added.precision,
            timeStamp: fallingEdge.timeStamp
          });
        }, timeLeft);
      }
    }
  }

  /**
   * Synchronises a {@link Multitouch} instance with the latest pointer state
   * by applying removals, additions, and moves in order.
   * @param multitouch - The multitouch tracker to update.
   * @param state - The current pointer state.
   */
  private updateMultitouch(
    multitouch: Multitouch,
    state: IPointersState
  ): void {
    if (state.removed) {
      multitouch.untouch(state.removed.pointerId.toString());
    }
    if (state.added) {
      multitouch.touch(state.added.pointerId.toString(), state.added.point);
    }
    if (state.changed) {
      multitouch.move(state.changed.pointerId.toString(), state.changed.point);
    }
  }

  /**
   * Processes a new pointer state snapshot and emits the appropriate gesture
   * events (tap, double-tap, long-tap, drag, drop, or cancel).
   * @param state - The latest pointer state to process.
   */
  public accept(state: IPointersState): void {
    let activeDistance = 0;
    for (const pointerId in state.pointers) {
      activeDistance += state.pointers[pointerId]?.clientDistance || 0;
    }
    if (activeDistance > this.options.dragThreshold || state.active > 1) {
      this.cancelLongTapTimeout();
      if (!this._dragState) {
        const multitouch = new Multitouch();
        for (const pointerId in state.pointers) {
          const point = state.pointers[pointerId]?.start?.point;
          if (point) {
            multitouch.touch(pointerId, point);
          }
        }
        state = { ...state, added: null }; // prevent dragStart event from re-adding touches to multitouch
        const dragStart: IPointerDragStartEvent<TDragData> = {
          pointers: state.pointers,
          multitouch,
          shiftKey: state.shiftKey,
          ctrlKey: state.ctrlKey,
          altKey: state.altKey
        };
        this.dragStart$.next(dragStart);
        if (dragStart.data) {
          this.reset();
          const data = dragStart.data;
          const cancelSubscription = cancel$.subscribe(() => {
            cancelSubscription.unsubscribe();
            this._dragState = undefined;
            this.dragCancel$.next({ data });
          });
          this._dragState = {
            payload: {
              data,
              multitouch,
              cancelSubscription
            }
          };
        } else {
          this._dragState = {
            payload: undefined // client does not support drag&drop
          };
        }
      }
    }
    if (this._dragState?.payload) {
      this.updateMultitouch(this._dragState.payload.multitouch, state);

      const matrix = this._dragState.payload.multitouch.eval();
      if (state.active) {
        this.dragMove$.next({
          pointers: state,
          data: this._dragState.payload.data,
          matrix,
          shiftKey: state.shiftKey,
          ctrlKey: state.ctrlKey,
          altKey: state.altKey
        });
      } else {
        this.dragEnd$.next({
          data: this._dragState.payload.data,
          matrix,
          shiftKey: state.shiftKey,
          ctrlKey: state.ctrlKey,
          altKey: state.altKey
        });
        this._dragState.payload.cancelSubscription.unsubscribe();
        this._dragState = undefined;
      }

      return;
    }

    if (!state.active) {
      this._dragState = undefined;
    }

    const edges = this._edges;
    if (state.active > 1) {
      this.resetEdgesHistory();
      this.cancelDoubleTapTimeout();
      this.cancelLongTapTimeout();
    } else if (edges[3].active !== state.active) {
      //single pointer edge detection
      this.pushEdge(state);

      const added = state.added;
      if (state.active && added) {
        this.cancelLongTapTimeout();
        this._longTapTimeout = timeout(() => {
          this.reset();
          this.longTaps$.next({
            pointerId: added.pointerId.toString(),
            point: added.point,
            precision: added.precision,
            timeStamp: state.timeStamp
          });
        }, this.options.longTapTimeWindow);
      } else {
        if (!this.matchDoubleTap()) {
          this.matchTap();
        }
      }
    }
  }
}

function timeout(func: () => void, time: number): number {
  if (time === Infinity) {
    return 0;
  }
  if (time <= 0) {
    func();
    return 0;
  } else {
    return setTimeout(func, time) as unknown as number;
  }
}
/** Describes a tap gesture event (single, double, or long). */
export interface IPointerTapEvent {
  /** The identifier of the pointer that performed the tap. */
  readonly pointerId: string;
  /** The timestamp of the tap event. */
  readonly timeStamp: number;
  /** The position where the tap occurred. */
  readonly point: Vec2F;
  /** The precision level of the input device. */
  readonly precision: "low" | "normal";
}

/** Emitted at the start of a drag gesture; consumers may set `data` to opt in. */
export interface IPointerDragStartEvent<TDragData> {
  /** The pointers that initiated the drag. */
  readonly pointers: PointersStateMap;
  /** The multitouch tracker for this drag session. */
  readonly multitouch: Multitouch;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  /** Set this to attach application-specific drag data and accept the drag. */
  data?: TDragData;
}

/** Emitted on every pointer move during an active drag. */
export interface IPointerDragEvent<TDragData> {
  /** The current pointer state snapshot. */
  readonly pointers: IPointersState;
  /** The accumulated affine transformation matrix. */
  readonly matrix: Matrix3x3;
  /** The application-specific drag data. */
  readonly data: TDragData;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

/** Emitted when a drag is cancelled (e.g. by pressing Escape). */
export interface IPointerDragCancelEvent<TDragData> {
  /** The application-specific drag data. */
  readonly data: TDragData;
}

/** Emitted when all pointers are released, completing the drag. */
export interface IPointerDropEvent<TDragData> {
  /** The final affine transformation matrix. */
  readonly matrix: Matrix3x3;
  /** The application-specific drag data. */
  readonly data: TDragData;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

/** Internal drag state wrapper. */
interface IDragState<TDragState> {
  readonly payload: IDragStatePayload<TDragState> | undefined;
}

/** Internal drag state payload holding data, multitouch, and the cancel subscription. */
interface IDragStatePayload<TDragState> {
  readonly data: TDragState;
  readonly multitouch: Multitouch;
  readonly cancelSubscription: Subscription;
}

export interface IPointerGesturesOptions {
  /** Time in milliseconds to detect double taps. Set to zero to disable */
  readonly doubleTapTimeWindow: number;
  /** Time in milliseconds to detect long taps. Set to Infinity to disable */
  readonly longTapTimeWindow: number;
  /** Distance pointer moved after which gesture is considered a drag */
  readonly dragThreshold: number;
}
