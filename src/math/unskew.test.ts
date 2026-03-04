import { Matrix3x3 } from "./matrix3x3";
import { unskew } from "./unskew";

describe("unskew", () => {
  it("should return matrix for a pure rotation matrix (no skew)", () => {
    const rotate = Matrix3x3.rotate(Math.PI / 4);
    expect(unskew(rotate)).toBe(rotate);
  });

  it("should return matrix for a uniform scale+rotation matrix (no skew)", () => {
    const matrix = Matrix3x3.scaleAll(3).mulM(Matrix3x3.rotate(Math.PI / 6));
    expect(unskew(matrix)).toBe(matrix);
  });

  it("should return matrix for identity", () => {
    expect(unskew(Matrix3x3.identity)).toBe(Matrix3x3.identity);
  });

  it("should orthogonalise a skewed matrix", () => {
    // col1=(2,0), col2=(1,2) — not orthogonal
    const matrix = new Matrix3x3(2, 1, 0, 0, 2, 0, 0, 0, 1);
    const result = unskew(matrix);
    const dot = result.m11 * result.m12 + result.m21 * result.m22;
    expect(dot).toBeCloseTo(0, 10);
  });

  it("should preserve column norms after unskew", () => {
    const matrix = new Matrix3x3(2, 1, 0, 0, 2, 0, 0, 0, 1);
    const result = unskew(matrix);
    const scaleX = Math.sqrt(matrix.m11 ** 2 + matrix.m21 ** 2);
    const scaleY = Math.sqrt(matrix.m12 ** 2 + matrix.m22 ** 2);
    expect(Math.sqrt(result.m11 ** 2 + result.m21 ** 2)).toBeCloseTo(scaleX, 10);
    expect(Math.sqrt(result.m12 ** 2 + result.m22 ** 2)).toBeCloseTo(scaleY, 10);
  });

  it("should preserve col1 direction after unskew", () => {
    const matrix = new Matrix3x3(2, 1, 0, 0, 2, 0, 0, 0, 1);
    const result = unskew(matrix);
    expect(result.m11).toBeCloseTo(matrix.m11, 10);
    expect(result.m21).toBeCloseTo(matrix.m21, 10);
  });

  it("should remove skewX, giving a diagonal scale matrix", () => {
    // skewX with s=1: col1=(1,0), col2=(1,1)
    // expected: col2 becomes (0, sqrt(2))
    const matrix = new Matrix3x3(1, 1, 0, 0, 1, 0, 0, 0, 1);
    const result = unskew(matrix);
    expect(result.m12).toBeCloseTo(0, 10);
    expect(result.m22).toBeCloseTo(Math.sqrt(2), 10);
    expect(result.m11).toBeCloseTo(1, 10);
    expect(result.m21).toBeCloseTo(0, 10);
  });

  it("should preserve translation when removing skew", () => {
    const matrix = new Matrix3x3(2, 1, 50, 0, 2, 80, 0, 0, 1);
    const result = unskew(matrix);
    expect(result.m13).toBe(50);
    expect(result.m23).toBe(80);
  });
});
