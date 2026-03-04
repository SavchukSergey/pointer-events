import { Matrix3x3 } from "./matrix3x3";

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
export function unscale(matrix: Matrix3x3): Matrix3x3 {
  const scaleX = Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21);
  const scaleY = Math.sqrt(matrix.m12 * matrix.m12 + matrix.m22 * matrix.m22);

  if (scaleX === 1 && scaleY === 1) {
    return matrix;
  }

  const invX = scaleX ? 1 / scaleX : 0;
  const invY = scaleY ? 1 / scaleY : 0;

  return new Matrix3x3(
    matrix.m11 * invX,
    matrix.m12 * invY,
    matrix.m13,
    matrix.m21 * invX,
    matrix.m22 * invY,
    matrix.m23,
    matrix.m31,
    matrix.m32,
    matrix.m33
  );
}
