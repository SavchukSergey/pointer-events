import { expectMatrix3x3 } from "../asserts";
import { Matrix3x3 } from "./matrix3x3";
import { Vec2F } from "../vec2f";
import { unscale } from "./unscale";

describe("unscale", () => {
  it("should return matrix when scale is already 1", () => {
    const rotate = Matrix3x3.rotate(Math.PI / 4);
    expect(unscale(rotate)).toBe(rotate);
  });

  it("should remove uniform scale, preserving rotation", () => {
    const rotate = Matrix3x3.rotate(Math.PI / 6);
    const scale = Matrix3x3.scaleAll(5);
    const matrix = scale.mulM(rotate);
    expectMatrix3x3(unscale(matrix), rotate);
  });

  it("should remove non-uniform scale", () => {
    const scale = Matrix3x3.scale(3, 4);
    expectMatrix3x3(unscale(scale), Matrix3x3.identity);
  });

  it("should preserve translation when removing scale", () => {
    const translate = Matrix3x3.translate(new Vec2F(100, 200));
    const scale = Matrix3x3.scaleAll(5);
    const matrix = translate.mulM(scale);
    expectMatrix3x3(unscale(matrix), translate);
  });

  it("should preserve translation and rotation when removing scale", () => {
    const translate = Matrix3x3.translate(new Vec2F(100, 200));
    const rotate = Matrix3x3.rotate((30 * Math.PI) / 180);
    const scale = Matrix3x3.scaleAll(10);
    const matrix = translate.mulM(scale).mulM(rotate);
    expectMatrix3x3(unscale(matrix), translate.mulM(rotate));
  });

  it("should not throw on zero scale and zero out affected elements", () => {
    const matrix = Matrix3x3.scale(0, 0);
    const result = unscale(matrix);
    expect(result.m11).toBe(0);
    expect(result.m21).toBe(0);
    expect(result.m12).toBe(0);
    expect(result.m22).toBe(0);
  });

  it("should leave identity unchanged", () => {
    expectMatrix3x3(unscale(Matrix3x3.identity), Matrix3x3.identity);
  });
});
