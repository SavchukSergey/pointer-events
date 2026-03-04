/**
 * An immutable 2D vector with floating-point components.
 */
declare class Vec2F {
    readonly x: number;
    readonly y: number;
    /** The zero vector `(0, 0)`. */
    static readonly zero: Vec2F;
    /** The unit vector along the X axis `(1, 0)`. */
    static readonly x: Vec2F;
    /** The unit vector along the Y axis `(0, 1)`. */
    static readonly y: Vec2F;
    /**
     * @param x - The X component of the vector.
     * @param y - The Y component of the vector.
     */
    constructor(x?: number, y?: number);
    /**
     * Multiplies this vector by a scalar.
     * @param k - The scalar to multiply by.
     * @returns A new vector scaled by `k`.
     */
    mul(k: number): Vec2F;
    /**
     * Divides this vector by a scalar.
     * @param k - The scalar to divide by.
     * @returns A new vector divided by `k`.
     */
    div(k: number): Vec2F;
    /**
     * Adds another vector to this vector.
     * @param other - The vector to add.
     * @returns A new vector that is the sum of the two vectors.
     */
    add(other: Vec2F): Vec2F;
    /**
     * Subtracts another vector from this vector.
     * @param other - The vector to subtract.
     * @returns A new vector that is the difference of the two vectors.
     */
    sub(other: Vec2F): Vec2F;
    /**
     * Computes the Euclidean length (magnitude) of this vector.
     * @returns The length of the vector.
     */
    length(): number;
    /**
     * Returns a unit vector in the same direction as this vector.
     * @returns A new vector with length `1`.
     */
    normalize(): Vec2F;
    /**
     * Returns a vector in the same direction as this vector but with the specified length.
     * @param len - The desired length.
     * @returns A new vector with the given length.
     */
    withLength(len: number): Vec2F;
    /**
     * Checks whether this vector is equal to another vector by comparing components.
     * @param other - The vector to compare with.
     * @returns `true` if both components are strictly equal.
     */
    equals(other: Vec2F): boolean;
    /**
     * Returns a string representation of the vector.
     * @returns A string in the format `{x:<x>, y:<y>}`.
     */
    toString(): string;
}

/**
 * An immutable 3x3 matrix for 2D affine transformations
 * (translation, rotation, scaling).
 */
declare class Matrix3x3 {
    readonly m11: number;
    readonly m12: number;
    readonly m13: number;
    readonly m21: number;
    readonly m22: number;
    readonly m23: number;
    readonly m31: number;
    readonly m32: number;
    readonly m33: number;
    /** The 3x3 identity matrix. */
    static readonly identity: Matrix3x3;
    /**
     * @param m11 - Row 1, column 1.
     * @param m12 - Row 1, column 2.
     * @param m13 - Row 1, column 3.
     * @param m21 - Row 2, column 1.
     * @param m22 - Row 2, column 2.
     * @param m23 - Row 2, column 3.
     * @param m31 - Row 3, column 1.
     * @param m32 - Row 3, column 2.
     * @param m33 - Row 3, column 3.
     */
    constructor(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number);
    /**
     * Creates a uniform scale matrix.
     * @param k - The uniform scale factor applied to both axes.
     * @returns A new uniform scale matrix.
     */
    static scaleAll(k: number): Matrix3x3;
    /**
     * Creates a non-uniform scale matrix.
     * @param kx - The scale factor along the X axis.
     * @param ky - The scale factor along the Y axis.
     * @returns A new scale matrix.
     */
    static scale(kx: number, ky: number): Matrix3x3;
    /**
     * Creates a rotation matrix.
     * @param radians - The rotation angle in radians.
     * @returns A new rotation matrix, or the identity matrix if the angle is zero.
     */
    static rotate(radians: number): Matrix3x3;
    /**
     * Creates a translation matrix.
     * @param vec - The translation vector.
     * @returns A new translation matrix, or the identity matrix if the vector is zero.
     */
    static translate(vec: Vec2F): Matrix3x3;
    /**
     * Multiplies every element of this matrix by a scalar.
     * @param k - The scalar to multiply by.
     * @returns A new matrix scaled by `k`, or this matrix if `k` is `1`.
     */
    mulK(k: number): Matrix3x3;
    /**
     * Multiplies this matrix by another matrix.
     * @param other - The right-hand side matrix.
     * @returns The product matrix.
     */
    mulM(other: Matrix3x3): Matrix3x3;
    /**
     * Multiplies this matrix by a 2D vector (implicitly `z = 1`).
     * @param other - The vector to transform.
     * @returns The transformed 2D vector.
     */
    mulV2(other: Vec2F): Vec2F;
    /**
     * Transposes this matrix (swaps rows and columns).
     * @returns The transposed matrix.
     */
    transpose(): Matrix3x3;
    /**
     * Computes the inverse of this matrix.
     * @returns The inverse matrix.
     */
    inverse(): Matrix3x3;
    /**
     * Decomposes this matrix into translation, rotation, and scale components.
     * @returns An object containing the decomposed `translate`, `rotate`, `scale`, `scaleX`, and `scaleY` values.
     */
    decode(): IDecodedMatrix;
    /**
     * Computes the determinant of this matrix.
     * @returns The determinant value.
     */
    getDet(): number;
    /**
     * Computes the minor for element at row 1, column 1.
     * @returns The minor value.
     */
    getMinor11(): number;
    /**
     * Computes the minor for element at row 1, column 2.
     * @returns The minor value.
     */
    getMinor12(): number;
    /**
     * Computes the minor for element at row 1, column 3.
     * @returns The minor value.
     */
    getMinor13(): number;
    /**
     * Computes the minor for element at row 2, column 1.
     * @returns The minor value.
     */
    getMinor21(): number;
    /**
     * Computes the minor for element at row 2, column 2.
     * @returns The minor value.
     */
    getMinor22(): number;
    /**
     * Computes the minor for element at row 2, column 3.
     * @returns The minor value.
     */
    getMinor23(): number;
    /**
     * Computes the minor for element at row 3, column 1.
     * @returns The minor value.
     */
    getMinor31(): number;
    /**
     * Computes the minor for element at row 3, column 2.
     * @returns The minor value.
     */
    getMinor32(): number;
    /**
     * Computes the minor for element at row 3, column 3.
     * @returns The minor value.
     */
    getMinor33(): number;
    /**
     * Computes the matrix of minors.
     * @returns A new matrix containing all minor values.
     */
    getMinors(): Matrix3x3;
    /**
     * Computes the cofactor matrix (minors with alternating signs).
     * @returns A new cofactor matrix.
     */
    getCofactors(): Matrix3x3;
    /**
     * Computes the angle of a direction vector in radians, in the range `[0, 2*PI)`.
     * @param vec - The direction vector.
     * @returns The angle in radians, or `0` if the vector has zero length.
     */
    private getAngle;
    toString(): string;
}
/**
 * The result of decomposing a transformation matrix into its components.
 */
interface IDecodedMatrix {
    readonly translate: Vec2F;
    readonly rotate: number;
    readonly scale: number;
    readonly scaleX: number;
    readonly scaleY: number;
}

/**
 * Returns a new matrix with the scaling removed, preserving rotation and translation.
 *
 * Each column of the 2×2 rotation sub-matrix is divided by its length
 * (`scaleX = √(m11²+m21²)` and `scaleY = √(m12²+m22²)`), reducing both
 * scale factors to 1.  The translation components (m13, m23) and the
 * bottom row are left unchanged.  If a scale factor is zero the
 * corresponding column elements are set to zero.
 *
 * @param matrix - The source matrix.
 * @returns A new matrix with unit scale, or `matrix` if both scale factors are already 1.
 */
declare function unscale(matrix: Matrix3x3): Matrix3x3;

/**
 * Returns a new matrix with the rotation removed, preserving scale and translation.
 *
 * Each column of the 2×2 rotation sub-matrix is replaced by its length
 * placed on the diagonal (`scaleX` on m11, `scaleY` on m22), zeroing out
 * the rotation terms.  The translation components (m13, m23) and the
 * bottom row are left unchanged.
 *
 * @param matrix - The source matrix.
 * @returns A new axis-aligned scale + translation matrix.
 */
declare function unrotate(matrix: Matrix3x3): Matrix3x3;

/**
 * Returns a new matrix with the skew removed, preserving rotation, scale, and translation.
 *
 * The first column is kept as-is; the second column is orthogonalised
 * against the first via Gram-Schmidt and then rescaled to its original
 * length, so both column norms and the rotation direction are preserved.
 * The translation components (m13, m23) and the bottom row are left
 * unchanged.  If the first column has zero length, the second column is
 * zeroed out.
 *
 * @param matrix - The source matrix.
 * @returns A new matrix with orthogonal columns, or `matrix` if the columns are already orthogonal.
 */
declare function unskew(matrix: Matrix3x3): Matrix3x3;

/**
 * Tracks up to three simultaneous touch points and computes an affine
 * transformation matrix that represents the combined translation, rotation,
 * and scaling described by those touches.
 */
declare class Multitouch {
    private touches;
    private accMatrix;
    private start;
    /**
     * Registers a touch. If there is no active touch or there are less than 3 active touches, the touch is added to the current touches and the start state is updated. Otherwise, the touch is ignored.
     * @param id - Unique identifier for the touch point.
     * @param point - The initial position of the touch.
     * @returns This instance for method chaining.
     */
    touch(id: string, point: Vec2F): Multitouch;
    /**
     * Updates the position of an active touch. If the touch is not active, it is ignored.
     * @param id - Unique identifier of the touch to update.
     * @param point - The new position of the touch.
     * @returns This instance for method chaining.
     */
    move(id: string, point: Vec2F): Multitouch;
    /**
     * Removes a touch. If there is no active touch, it is ignored.
     * @param id - Unique identifier of the touch to remove.
     * @returns This instance for method chaining.
     */
    untouch(id: string): Multitouch;
    /**
     * Evaluates the current transformation matrix based on the active touches and the start state. If there is no start state, it returns the identity matrix.
     * @returns The accumulated transformation matrix.
     */
    eval(): Matrix3x3;
    /**
     * Resets the start state with the given set of touches and snapshots the
     * current accumulated matrix so subsequent moves are computed relative to it.
     */
    private startMove;
}

/** A handle that stops an active subscription when unsubscribed. */
type Subscriber<T> = (value: T) => void;
type SubscriptionTearDown = () => void;
declare class Subscription {
    private readonly _teardowns;
    private _closed;
    add(sub: {
        unsubscribe(): void;
    }): void;
    unsubscribe(): void;
}
/** A lazy push collection: subscribing runs the setup function and returns a Subscription. */
declare class Observable<T> {
    private readonly _setup;
    constructor(_setup: (subscriber: {
        next: Subscriber<T>;
    }) => SubscriptionTearDown | void);
    subscribe(callback: Subscriber<T>): Subscription;
    pipe<U>(op: (source: Observable<T>) => Observable<U>): Observable<U>;
}
/** A multicast observable that pushes values to all current subscribers. */
declare class Subject<T> extends Observable<T> {
    private _subscribers;
    constructor();
    next(value: T): void;
}

type PointersStateMap = {
    [key: string]: IPointerState;
};
/**
 * Creates an observable that tracks pointer state on the given element using the
 * Pointer Events API. Subscribing starts listening for `pointerdown`, `pointermove`,
 * `pointerup`, and `pointercancel` on the element. Pointer capture is used to route
 * move and up events to the element even when the pointer leaves its bounds.
 * @param node - The DOM element to listen for pointer events on.
 * @returns An observable that emits a new {@link IPointersState} on every pointer change.
 */
declare function createPointersState(node: HTMLElement): Observable<IPointersState>;
/** A snapshot of all active pointer states at a given point in time. */
interface IPointersState {
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
interface IPointerPosition {
    /** The position in client coordinates. */
    readonly point: Vec2F;
    /** The timestamp when this position was recorded. */
    readonly timeStamp: number;
}
/** The full state of a single tracked pointer. */
interface IPointerState {
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

/**
 * Recognises tap, double-tap, long-tap, and drag gestures from a stream
 * of pointer states emitted by {@link createPointersState}.
 *
 * @typeParam TDragData - Application-specific payload attached to drag operations.
 */
declare class PointerGestures<TDragData> {
    /** Emits when a double-tap gesture is recognised. */
    readonly doubleTaps$: Subject<IPointerTapEvent>;
    /** Emits when a single-tap gesture is recognised. */
    readonly taps$: Subject<IPointerTapEvent>;
    /** Emits when a long-tap gesture is recognised. */
    readonly longTaps$: Subject<IPointerTapEvent>;
    /** Emits when a drag gesture begins and the consumer can attach data. Consumer has to set drag data in the event otherwise drag&drop considered unsupзorted. */
    readonly dragStart$: Subject<IPointerDragStartEvent<TDragData>>;
    /** Emits on every pointer move during an active drag. */
    readonly dragMove$: Subject<IPointerDragEvent<TDragData>>;
    /** Emits when all pointers are released during an active drag. */
    readonly dragEnd$: Subject<IPointerDropEvent<TDragData>>;
    /** Emits when a drag is cancelled (e.g. by pressing Escape). */
    readonly dragCancel$: Subject<IPointerDragCancelEvent<TDragData>>;
    private readonly _edges;
    private _doubleTapTimeout;
    private _longTapTimeout;
    private _dragState;
    private readonly options;
    constructor(options?: Partial<IPointerGesturesOptions>);
    /**
     * Resets the edge history buffer to empty states.
     */
    private resetEdgesHistory;
    /**
     * Cancels the pending double-tap timeout, if any.
     */
    private cancelDoubleTapTimeout;
    /**
     * Cancels the pending long-tap timeout, if any.
     */
    private cancelLongTapTimeout;
    /**
     * Resets all internal gesture state (edges, timeouts).
     */
    private reset;
    /**
     * Pushes a new state onto the edge history buffer, shifting older entries out.
     * @param state - The pointer state to record.
     */
    private pushEdge;
    /**
     * Attempts to match a double-tap pattern from the edge history.
     * If matched, emits on {@link doubleTaps$} and resets state.
     * @returns `true` if a double-tap was recognised, `false` otherwise.
     */
    private matchDoubleTap;
    /**
     * Attempts to match a single-tap pattern from the edge history.
     * If matched, schedules a deferred emit on {@link taps$} to allow
     * double-tap detection to take priority.
     */
    private matchTap;
    /**
     * Synchronises a {@link Multitouch} instance with the latest pointer state
     * by applying removals, additions, and moves in order.
     * @param multitouch - The multitouch tracker to update.
     * @param state - The current pointer state.
     */
    private updateMultitouch;
    /**
     * Processes a new pointer state snapshot and emits the appropriate gesture
     * events (tap, double-tap, long-tap, drag, drop, or cancel).
     * @param state - The latest pointer state to process.
     */
    accept(state: IPointersState): void;
}
/** Describes a tap gesture event (single, double, or long). */
interface IPointerTapEvent {
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
interface IPointerDragStartEvent<TDragData> {
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
interface IPointerDragEvent<TDragData> {
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
interface IPointerDragCancelEvent<TDragData> {
    /** The application-specific drag data. */
    readonly data: TDragData;
}
/** Emitted when all pointers are released, completing the drag. */
interface IPointerDropEvent<TDragData> {
    /** The final affine transformation matrix. */
    readonly matrix: Matrix3x3;
    /** The application-specific drag data. */
    readonly data: TDragData;
    readonly shiftKey: boolean;
    readonly ctrlKey: boolean;
    readonly altKey: boolean;
}
interface IPointerGesturesOptions {
    /** Time in milliseconds to detect double taps. Set to zero to disable */
    readonly doubleTapTimeWindow: number;
    /** Time in milliseconds to detect long taps. Set to Infinity to disable */
    readonly longTapTimeWindow: number;
    /** Distance pointer moved after which gesture is considered a drag */
    readonly dragThreshold: number;
}

export { Matrix3x3, Multitouch, PointerGestures, createPointersState, unrotate, unscale, unskew };
