import { Vec2F } from "./vec2f";
import { Vec3F } from "./vec3f";

/**
 * An immutable 3x3 matrix for 2D affine transformations
 * (translation, rotation, scaling).
 */
export class Matrix3x3 {
  /** The 3x3 identity matrix. */
  public static readonly identity = new Matrix3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);

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
  constructor(
    public readonly m11: number,
    public readonly m12: number,
    public readonly m13: number,
    public readonly m21: number,
    public readonly m22: number,
    public readonly m23: number,
    public readonly m31: number,
    public readonly m32: number,
    public readonly m33: number,
  ) { }

  /**
   * Creates a uniform scale matrix.
   * @param k - The uniform scale factor applied to both axes.
   * @returns A new uniform scale matrix.
   */
  public static scaleAll(k: number): Matrix3x3 {
    return this.scale(k, k);
  }

  /**
   * Creates a non-uniform scale matrix.
   * @param kx - The scale factor along the X axis.
   * @param ky - The scale factor along the Y axis.
   * @returns A new scale matrix.
   */
  public static scale(kx: number, ky: number): Matrix3x3 {
    return new Matrix3x3(kx, 0, 0, 0, ky, 0, 0, 0, 1);
  }

  /**
   * Creates a rotation matrix.
   * @param radians - The rotation angle in radians.
   * @returns A new rotation matrix, or the identity matrix if the angle is zero.
   */
  public static rotate(radians: number): Matrix3x3 {
    if (!radians) {
      return Matrix3x3.identity;
    }
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return new Matrix3x3(cos, -sin, 0, sin, cos, 0, 0, 0, 1);
  }

  /**
   * Creates a translation matrix.
   * @param vec - The translation vector.
   * @returns A new translation matrix, or the identity matrix if the vector is zero.
   */
  public static translate(vec: Vec2F): Matrix3x3 {
    const { x, y } = vec;
    if (!x && !y) {
      return Matrix3x3.identity;
    }
    return new Matrix3x3(1, 0, x, 0, 1, y, 0, 0, 1);
  }

  /**
   * Multiplies every element of this matrix by a scalar.
   * @param k - The scalar to multiply by.
   * @returns A new matrix scaled by `k`, or this matrix if `k` is `1`.
   */
  public mulK(k: number): Matrix3x3 {
    if (k === 1) {
      return this;
    }
    return new Matrix3x3(
      this.m11 * k,
      this.m12 * k,
      this.m13 * k,
      this.m21 * k,
      this.m22 * k,
      this.m23 * k,
      this.m31 * k,
      this.m32 * k,
      this.m33 * k,
    );
  }

  /**
   * Multiplies this matrix by another matrix.
   * @param other - The right-hand side matrix.
   * @returns The product matrix.
   */
  public mulM(other: Matrix3x3): Matrix3x3 {
    return new Matrix3x3(
      this.m11 * other.m11 + this.m12 * other.m21 + this.m13 * other.m31,
      this.m11 * other.m12 + this.m12 * other.m22 + this.m13 * other.m32,
      this.m11 * other.m13 + this.m12 * other.m23 + this.m13 * other.m33,

      this.m21 * other.m11 + this.m22 * other.m21 + this.m23 * other.m31,
      this.m21 * other.m12 + this.m22 * other.m22 + this.m23 * other.m32,
      this.m21 * other.m13 + this.m22 * other.m23 + this.m23 * other.m33,

      this.m31 * other.m11 + this.m32 * other.m21 + this.m33 * other.m31,
      this.m31 * other.m12 + this.m32 * other.m22 + this.m33 * other.m32,
      this.m31 * other.m13 + this.m32 * other.m23 + this.m33 * other.m33,
    );
  }

  /**
   * Multiplies this matrix by a 3D vector.
   * @param other - The vector to transform.
   * @returns The transformed 3D vector.
   */
  public mulV3(other: Vec3F): Vec3F {
    return new Vec3F(
      this.m11 * other.x + this.m12 * other.y + this.m13 * other.z,
      this.m21 * other.x + this.m22 * other.y + this.m23 * other.z,
      this.m31 * other.x + this.m32 * other.y + this.m33 * other.z,
    );
  }

  /**
   * Multiplies this matrix by a 2D vector (implicitly `z = 1`).
   * @param other - The vector to transform.
   * @returns The transformed 2D vector.
   */
  public mulV2(other: Vec2F): Vec2F {
    return new Vec2F(
      this.m11 * other.x + this.m12 * other.y + this.m13,
      this.m21 * other.x + this.m22 * other.y + this.m23,
    );
  }

  /**
   * Transposes this matrix (swaps rows and columns).
   * @returns The transposed matrix.
   */
  public transpose(): Matrix3x3 {
    return new Matrix3x3(
      this.m11,
      this.m21,
      this.m31,
      this.m12,
      this.m22,
      this.m32,
      this.m13,
      this.m23,
      this.m33,
    );
  }

  /**
   * Computes the inverse of this matrix.
   * @returns The inverse matrix.
   */
  public inverse(): Matrix3x3 {
    return this.getCofactors()
      .transpose()
      .mulK(1 / this.getDet());
  }

  /**
   * Decomposes this matrix into translation, rotation, and scale components.
   * @returns An object containing the decomposed `translate`, `rotate`, `scale`, `scaleX`, and `scaleY` values.
   */
  public decode(): IDecodedMatrix {
    const translate = new Vec2F(this.m13, this.m23);
    const scaleX = Math.sqrt(this.m11 * this.m11 + this.m21 * this.m21);
    const scaleY = Math.sqrt(this.m12 * this.m12 + this.m22 * this.m22);
    const scale = Math.sqrt(scaleX * scaleY);
    const rotate = this.getAngle(new Vec2F(this.m11, -this.m12));

    return {
      translate,
      rotate,
      scale,
      scaleX,
      scaleY,
    };
  }

  /**
   * Computes the determinant of this matrix.
   * @returns The determinant value.
   */
  public getDet(): number {
    return (
      this.m11 * this.getMinor11() -
      this.m12 * this.getMinor12() +
      this.m13 * this.getMinor13()
    );
  }

  /**
   * Computes the minor for element at row 1, column 1.
   * @returns The minor value.
   */
  public getMinor11(): number {
    return this.m22 * this.m33 - this.m23 * this.m32;
  }

  /**
   * Computes the minor for element at row 1, column 2.
   * @returns The minor value.
   */
  public getMinor12(): number {
    return this.m21 * this.m33 - this.m23 * this.m31;
  }

  /**
   * Computes the minor for element at row 1, column 3.
   * @returns The minor value.
   */
  public getMinor13(): number {
    return this.m21 * this.m32 - this.m22 * this.m31;
  }

  /**
   * Computes the minor for element at row 2, column 1.
   * @returns The minor value.
   */
  public getMinor21(): number {
    return this.m12 * this.m33 - this.m13 * this.m32;
  }

  /**
   * Computes the minor for element at row 2, column 2.
   * @returns The minor value.
   */
  public getMinor22(): number {
    return this.m11 * this.m33 - this.m13 * this.m31;
  }

  /**
   * Computes the minor for element at row 2, column 3.
   * @returns The minor value.
   */
  public getMinor23(): number {
    return this.m11 * this.m32 - this.m12 * this.m31;
  }

  /**
   * Computes the minor for element at row 3, column 1.
   * @returns The minor value.
   */
  public getMinor31(): number {
    return this.m12 * this.m23 - this.m13 * this.m22;
  }

  /**
   * Computes the minor for element at row 3, column 2.
   * @returns The minor value.
   */
  public getMinor32(): number {
    return this.m11 * this.m23 - this.m13 * this.m21;
  }

  /**
   * Computes the minor for element at row 3, column 3.
   * @returns The minor value.
   */
  public getMinor33(): number {
    return this.m11 * this.m22 - this.m12 * this.m21;
  }

  /**
   * Computes the matrix of minors.
   * @returns A new matrix containing all minor values.
   */
  public getMinors(): Matrix3x3 {
    return new Matrix3x3(
      this.getMinor11(),
      this.getMinor12(),
      this.getMinor13(),
      this.getMinor21(),
      this.getMinor22(),
      this.getMinor23(),
      this.getMinor31(),
      this.getMinor32(),
      this.getMinor33(),
    );
  }

  /**
   * Computes the cofactor matrix (minors with alternating signs).
   * @returns A new cofactor matrix.
   */
  public getCofactors(): Matrix3x3 {
    return new Matrix3x3(
      this.getMinor11(),
      -this.getMinor12(),
      this.getMinor13(),
      -this.getMinor21(),
      this.getMinor22(),
      -this.getMinor23(),
      this.getMinor31(),
      -this.getMinor32(),
      this.getMinor33(),
    );
  }

  /**
   * Computes the angle of a direction vector in radians, in the range `[0, 2*PI)`.
   * @param vec - The direction vector.
   * @returns The angle in radians, or `0` if the vector has zero length.
   */
  private getAngle(vec: Vec2F): number {
    if (!vec.x && !vec.y) {
      return 0;
    }
    const angle = Math.atan2(vec.y, vec.x);
    return angle < 0 ? angle + 2 * Math.PI : angle;
  }
}

/**
 * The result of decomposing a transformation matrix into its components.
 */
export interface IDecodedMatrix {
  readonly translate: Vec2F;
  readonly rotate: number;
  readonly scale: number;
  readonly scaleX: number;
  readonly scaleY: number;
}