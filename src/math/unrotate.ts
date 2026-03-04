import { Matrix3x3 } from "./matrix3x3";

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
export function unrotate(matrix: Matrix3x3): Matrix3x3 {
  const scaleX = Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21);
  const scaleY = Math.sqrt(matrix.m12 * matrix.m12 + matrix.m22 * matrix.m22);

  return new Matrix3x3(
    scaleX,
    0,
    matrix.m13,
    0,
    scaleY,
    matrix.m23,
    matrix.m31,
    matrix.m32,
    matrix.m33
  );
}
