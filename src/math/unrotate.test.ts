import { expectMatrix3x3 } from "../asserts";
import { Matrix3x3 } from "./matrix3x3";
import { Vec2F } from "../vec2f";
import { unrotate } from "./unrotate";

describe("unrotate", () => {
  it("should remove rotation from a pure rotation matrix, giving identity", () => {
    const rotate = Matrix3x3.rotate(Math.PI / 4);
    expectMatrix3x3(unrotate(rotate), Matrix3x3.identity);
  });

  it("should remove rotation from scale+rotation, preserving scale", () => {
    const matrix = Matrix3x3.scaleAll(5).mulM(Matrix3x3.rotate(Math.PI / 3));
    expectMatrix3x3(unrotate(matrix), Matrix3x3.scaleAll(5));
  });

  it("should zero off-diagonals and put column norms on diagonal for non-uniform scale+rotation", () => {
    const matrix = Matrix3x3.scale(3, 7).mulM(Matrix3x3.rotate(Math.PI / 6));
    const result = unrotate(matrix);
    const scaleX = Math.sqrt(matrix.m11 ** 2 + matrix.m21 ** 2);
    const scaleY = Math.sqrt(matrix.m12 ** 2 + matrix.m22 ** 2);
    expect(result.m12).toBeCloseTo(0, 10);
    expect(result.m21).toBeCloseTo(0, 10);
    expect(result.m11).toBeCloseTo(scaleX, 5);
    expect(result.m22).toBeCloseTo(scaleY, 5);
  });

  it("should preserve translation when removing rotation", () => {
    const translate = Matrix3x3.translate(new Vec2F(100, 200));
    const matrix = translate
      .mulM(Matrix3x3.scaleAll(4))
      .mulM(Matrix3x3.rotate(Math.PI / 5));
    expectMatrix3x3(unrotate(matrix), translate.mulM(Matrix3x3.scaleAll(4)));
  });

  it("should leave a pure scale matrix with zero off-diagonals", () => {
    const result = unrotate(Matrix3x3.scale(3, 7));
    expect(result.m12).toBe(0);
    expect(result.m21).toBe(0);
  });

  it("should leave identity's components unchanged", () => {
    expectMatrix3x3(unrotate(Matrix3x3.identity), Matrix3x3.identity);
  });
});
