import { Matrix3x3 } from "./matrix3x3";
import { Vec2F } from "./vec2f";

/**
 * Tracks up to three simultaneous touch points and computes an affine
 * transformation matrix that represents the combined translation, rotation,
 * and scaling described by those touches.
 */
export class Multitouch {
  private touches: readonly ITouchInfo[] = [];

  private accMatrix = Matrix3x3.identity;

  private start: {
    readonly matrix: Matrix3x3;
    readonly inverseMatrix: Matrix3x3;
  } | null = null;

  /**
   * Registers a touch. If there is no active touch or there are less than 3 active touches, the touch is added to the current touches and the start state is updated. Otherwise, the touch is ignored.
   * @param id - Unique identifier for the touch point.
   * @param point - The initial position of the touch.
   * @returns This instance for method chaining.
   */
  public touch(id: string, point: Vec2F): Multitouch {
    if (!this.start || this.touches.length < 3) {
      this.startMove([
        ...this.touches, {
          id,
          point,
        },
      ]);
    }
    return this;
  }

  /**
   * Updates the position of an active touch. If the touch is not active, it is ignored.
   * @param id - Unique identifier of the touch to update.
   * @param point - The new position of the touch.
   * @returns This instance for method chaining.
   */
  public move(id: string, point: Vec2F): Multitouch {
    this.touches = this.touches.map((touch) => touch.id === id ? {
      id,
      point,
    } : touch);
    return this;
  }

  /**
   * Removes a touch. If there is no active touch, it is ignored.
   * @param id - Unique identifier of the touch to remove.
   * @returns This instance for method chaining.
   */
  public untouch(id: string): Multitouch {
    if (this.start) {
      this.startMove(this.touches.filter((touch) => touch.id !== id));
    }
    return this;
  }

  /**
   * Evaluates the current transformation matrix based on the active touches and the start state. If there is no start state, it returns the identity matrix.
   * @returns The accumulated transformation matrix.
   */
  public eval(): Matrix3x3 {
    if (!this.start) {
      return this.accMatrix;
    }

    const newInfo = buildMatrix(this.touches);
    const current = newInfo.mulM(this.start.inverseMatrix);

    return current.mulM(this.accMatrix);
  }

  /**
   * Resets the start state with the given set of touches and snapshots the
   * current accumulated matrix so subsequent moves are computed relative to it.
   */
  private startMove(touches: readonly ITouchInfo[]): void {
    this.accMatrix = this.eval();
    if (!touches.length) {
      this.start = null;
    } else {
      const matrix = buildMatrix(touches);
      this.start = {
        matrix,
        inverseMatrix: matrix.inverse(),
      };
    }
    this.touches = touches;
  }
}

/**
 * Generates a synthetic second point when only one touch is active.
 * Offset by `(1, 0)` from `pointA` to allow translation-only transforms.
 */
function getPseudoB(pointA: Vec2F): Vec2F {
  return pointA.add(new Vec2F(1, 0));
}

/**
 * Generates a synthetic third point when only two touches are active.
 * Computed as the point perpendicular to the `A -> B` segment from `A`,
 * preserving uniform scaling (no skew).
 */
function getPseudoC(pointA: Vec2F, pointB: Vec2F): Vec2F {
  const u = pointB.sub(pointA);

  return new Vec2F(-u.y, u.x).add(pointA);
}

/** A single tracked touch point. */
interface ITouchInfo {
  readonly id: string;
  readonly point: Vec2F;
}

/**
 * Builds a 3x3 matrix from up to three touch points.
 * Missing points are filled with {@link getPseudoB} and {@link getPseudoC}
 * to constrain the degrees of freedom appropriately.
 */
function buildMatrix(touches: readonly ITouchInfo[]): Matrix3x3 {
  const pointA = touches[0].point;
  const pointB = touches[1]?.point ?? getPseudoB(pointA);
  const pointC = touches[2]?.point ?? getPseudoC(pointA, pointB);

  return new Matrix3x3(
    pointA.x,
    pointB.x,
    pointC.x,
    pointA.y,
    pointB.y,
    pointC.y,
    1,
    1,
    1,
  );
}
