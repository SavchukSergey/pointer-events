import { Matrix3x3 } from "./matrix3x3";

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
export function unskew(matrix: Matrix3x3): Matrix3x3 {
  const scaleX = Math.sqrt(matrix.m11 * matrix.m11 + matrix.m21 * matrix.m21);
  const invScaleX = scaleX ? 1 / scaleX : 0;

  // unit vector along col1
  const ux = matrix.m11 * invScaleX;
  const uy = matrix.m21 * invScaleX;

  // scalar projection of col2 onto col1 (skew component)
  const dot = matrix.m12 * ux + matrix.m22 * uy;

  if (!dot) {
    return matrix; // columns already orthogonal
  }

  // orthogonal complement of col2 with respect to col1
  const ox = matrix.m12 - dot * ux;
  const oy = matrix.m22 - dot * uy;

  // rescale orthogonal col2 back to original scaleY
  const scaleY = Math.sqrt(matrix.m12 * matrix.m12 + matrix.m22 * matrix.m22);
  const len = Math.sqrt(ox * ox + oy * oy);
  const k = len ? scaleY / len : 0;

  return new Matrix3x3(
    matrix.m11,
    ox * k,
    matrix.m13,
    matrix.m21,
    oy * k,
    matrix.m23,
    matrix.m31,
    matrix.m32,
    matrix.m33
  );
}
