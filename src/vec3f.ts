/**
 * An immutable 3D vector with floating-point components.
 */
export class Vec3F {
  /** The zero vector `(0, 0, 0)`. */
  public static readonly zero = new Vec3F(0, 0, 0);

  /** The unit vector along the X axis `(1, 0, 0)`. */
  public static readonly x = new Vec3F(1, 0, 0);

  /** The unit vector along the Y axis `(0, 1, 0)`. */
  public static readonly y = new Vec3F(0, 1, 0);

  /** The unit vector along the Z axis `(0, 0, 1)`. */
  public static readonly z = new Vec3F(0, 0, 1);

  /**
   * @param x - The X component of the vector.
   * @param y - The Y component of the vector.
   * @param z - The Z component of the vector.
   */
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {}

  /**
   * Multiplies this vector by a scalar.
   * @param k - The scalar to multiply by.
   * @returns A new vector scaled by `k`.
   */
  public mul(k: number): Vec3F {
    return new Vec3F(this.x * k, this.y * k, this.z * k);
  }

  /**
   * Divides this vector by a scalar.
   * @param k - The scalar to divide by.
   * @returns A new vector divided by `k`.
   */
  public div(k: number): Vec3F {
    return new Vec3F(this.x / k, this.y / k, this.z / k);
  }

  /**
   * Adds another vector to this vector.
   * @param other - The vector to add.
   * @returns A new vector that is the sum of the two vectors.
   */
  public add(other: Vec3F): Vec3F {
    return new Vec3F(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  /**
   * Subtracts another vector from this vector.
   * @param other - The vector to subtract.
   * @returns A new vector that is the difference of the two vectors.
   */
  public sub(other: Vec3F): Vec3F {
    return new Vec3F(this.x - other.x, this.y - other.y, this.z - other.z);
  }
}
