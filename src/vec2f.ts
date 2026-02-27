/**
 * An immutable 2D vector with floating-point components.
 */
export class Vec2F {
  /** The zero vector `(0, 0)`. */
  public static readonly zero = new Vec2F(0, 0);

  /** The unit vector along the X axis `(1, 0)`. */
  public static readonly x = new Vec2F(1, 0);

  /** The unit vector along the Y axis `(0, 1)`. */
  public static readonly y = new Vec2F(0, 1);

  /**
   * @param x - The X component of the vector.
   * @param y - The Y component of the vector.
   */
  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0
  ) {}

  /**
   * Multiplies this vector by a scalar.
   * @param k - The scalar to multiply by.
   * @returns A new vector scaled by `k`.
   */
  public mul(k: number): Vec2F {
    return new Vec2F(this.x * k, this.y * k);
  }

  /**
   * Divides this vector by a scalar.
   * @param k - The scalar to divide by.
   * @returns A new vector divided by `k`.
   */
  public div(k: number): Vec2F {
    return new Vec2F(this.x / k, this.y / k);
  }

  /**
   * Adds another vector to this vector.
   * @param other - The vector to add.
   * @returns A new vector that is the sum of the two vectors.
   */
  public add(other: Vec2F): Vec2F {
    return new Vec2F(this.x + other.x, this.y + other.y);
  }

  /**
   * Subtracts another vector from this vector.
   * @param other - The vector to subtract.
   * @returns A new vector that is the difference of the two vectors.
   */
  public sub(other: Vec2F): Vec2F {
    return new Vec2F(this.x - other.x, this.y - other.y);
  }

  /**
   * Computes the Euclidean length (magnitude) of this vector.
   * @returns The length of the vector.
   */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Returns a unit vector in the same direction as this vector.
   * @returns A new vector with length `1`.
   */
  public normalize(): Vec2F {
    return this.div(this.length());
  }

  /**
   * Returns a vector in the same direction as this vector but with the specified length.
   * @param len - The desired length.
   * @returns A new vector with the given length.
   */
  public withLength(len: number): Vec2F {
    return this.mul(len / this.length());
  }

  /**
   * Checks whether this vector is equal to another vector by comparing components.
   * @param other - The vector to compare with.
   * @returns `true` if both components are strictly equal.
   */
  public equals(other: Vec2F): boolean {
    return this.x === other.x && this.y === other.y;
  }

  /**
   * Returns a string representation of the vector.
   * @returns A string in the format `{x:<x>, y:<y>}`.
   */
  public toString(): string {
    return `{x:${this.x}, y:${this.y}}`;
  }
}
