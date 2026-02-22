import { expectMatrix3x3, expectVec2F } from "./asserts";
import { Matrix3x3 } from "./matrix3x3";
import { Vec2F } from "./vec2f";
import { Vec3F } from "./vec3f";

describe("Matrix3x3", () => {
  it("should calculate determinant", () => {
    const matrix = new Matrix3x3(1, 2, 3, 0, 1, 4, 5, 6, 0);
    expect(matrix.getDet()).toBeCloseTo(1);
  });

  it("should transpose", () => {
    const matrix = new Matrix3x3(1, 2, 3, 0, 1, 4, 5, 6, 0);
    const transposed = matrix.transpose();
    expectMatrix3x3(transposed, new Matrix3x3(1, 0, 5, 2, 1, 6, 3, 4, 0));
  });

  it("should get minors", () => {
    const matrix = new Matrix3x3(3, 0, 2, 2, 0, -2, 0, 1, 1);
    const minors = matrix.getMinors();
    expectMatrix3x3(minors, new Matrix3x3(2, 2, 2, -2, 3, 3, 0, -10, 0));
  });

  it("should calculate inverse", () => {
    expectMatrix3x3(
      new Matrix3x3(3, 0, 2, 2, 0, -2, 0, 1, 1).inverse(),
      new Matrix3x3(0.2, 0.2, 0, -0.2, 0.3, 1, 0.2, -0.3, 0),
    );
    expectMatrix3x3(
      new Matrix3x3(1, 2, 3, 0, 1, 4, 5, 6, 0).inverse(),
      new Matrix3x3(-24, 18, 5, 20, -15, -4, -5, 4, 1),
    );
  });

  it("should rotate", () => {
    const actual = Matrix3x3.rotate((30 * Math.PI) / 180);
    expectMatrix3x3(
      actual,
      new Matrix3x3(0.866025, -0.5, 0, 0.5, 0.866025, 0, 0, 0, 1),
    );
  });

  it("should scaleAll", () => {
    const actual = Matrix3x3.scaleAll(10);
    expectMatrix3x3(actual, new Matrix3x3(10, 0, 0, 0, 10, 0, 0, 0, 1));
  });

  it("should translate", () => {
    const actual = Matrix3x3.translate(new Vec2F(10, 20));
    expectMatrix3x3(actual, new Matrix3x3(1, 0, 10, 0, 1, 20, 0, 0, 1));
  });

  it("should translate zero to identity", () => {
    const actual = Matrix3x3.translate(new Vec2F(0, 0));
    expect(actual).toBe(Matrix3x3.identity);
  });

  it("should decode rotation", () => {
    [0, 60, 90, 150, 180, 240, 270, 330].forEach((angle) => {
      const radians = (angle / 180) * Math.PI;
      const matrix = Matrix3x3.rotate(radians);
      const decode = matrix.decode();
      const digits = 5;
      expect(decode.rotate).toBeCloseTo(radians, digits);
    });
  });

  it("should decode scale", () => {
    const matrix = Matrix3x3.scale(10, 20);
    const decode = matrix.decode();
    const digits = 5;
    expect(decode.scaleX).toBeCloseTo(10, digits);
    expect(decode.scaleY).toBeCloseTo(20, digits);
    expect(decode.scale).toBeCloseTo(Math.sqrt(200), digits);
  });

  it("should decode translate", () => {
    const matrix = Matrix3x3.translate(new Vec2F(100, 200));
    const decode = matrix.decode();
    const digits = 5;
    expect(decode.translate.x).toBeCloseTo(100, digits);
    expect(decode.translate.y).toBeCloseTo(200, digits);
  });

  it("should decode all", () => {
    const translate = Matrix3x3.translate(new Vec2F(100, 200));
    const rotate = Matrix3x3.rotate((30 * Math.PI) / 180);
    const scale = Matrix3x3.scale(10, 10);
    const matrix = translate.mulM(scale).mulM(rotate);

    const decode = matrix.decode();
    const digits = 5;
    expectVec2F(new Vec2F(100, 200), decode.translate);
    expect(decode.rotate).toBeCloseTo((30 * Math.PI) / 180, digits);
    expect(decode.scaleX).toBeCloseTo(10, digits);
    expect(decode.scaleY).toBeCloseTo(10, digits);
  });

  it("should decode zero x-axis", () => {
    const matrix = new Matrix3x3(0, 0, 0, 0, 1, 0, 0, 0, 1);
    const decode = matrix.decode();
    expect(decode.rotate).toBe(0);
    expect(decode.scaleX).toBe(0);
  });

  it("should multiply matrix by Vec3F", () => {
    const matrix = new Matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9);
    const vec = new Vec3F(2, 3, 4);
    const result = matrix.mulV3(vec);
    // row1: 1*2 + 2*3 + 3*4 = 20
    // row2: 4*2 + 5*3 + 6*4 = 47
    // row3: 7*2 + 8*3 + 9*4 = 74
    expect(result.x).toBeCloseTo(20);
    expect(result.y).toBeCloseTo(47);
    expect(result.z).toBeCloseTo(74);
  });

  it("should multiply identity matrix by Vec3F", () => {
    const vec = new Vec3F(5, 10, 15);
    const result = Matrix3x3.identity.mulV3(vec);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(10);
    expect(result.z).toBeCloseTo(15);
  });

  it("should multiply scale matrix by Vec3F", () => {
    const matrix = Matrix3x3.scale(3, 4);
    const vec = new Vec3F(2, 5, 1);
    const result = matrix.mulV3(vec);
    expect(result.x).toBeCloseTo(6);
    expect(result.y).toBeCloseTo(20);
    expect(result.z).toBeCloseTo(1);
  });

  it("should multiply rotation matrix by Vec3F", () => {
    const matrix = Matrix3x3.rotate(Math.PI / 2); // 90 degrees
    const vec = new Vec3F(1, 0, 1);
    const result = matrix.mulV3(vec);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
    expect(result.z).toBeCloseTo(1);
  });
});
