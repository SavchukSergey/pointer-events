import type { Matrix3x3 } from "./matrix3x3";
import type { Vec2F } from "./vec2f";

export function expectVec2F(
  actual: Vec2F | undefined | null,
  expected: Vec2F | undefined | null,
) {
  if (!!actual !== !!expected) {
    fail(`expected: ${actual}, but actual: ${actual}`);
  } else if (actual && expected) {
    const digits = 5;
    expect(actual.x).toBeCloseTo(expected.x, digits);
    expect(actual.y).toBeCloseTo(expected.y, digits);
  }
}

export function expectMatrix3x3(actual: Matrix3x3, expected: Matrix3x3) {
  const digits = 5;
  expect(actual.m11).toBeCloseTo(expected.m11, digits);
  expect(actual.m12).toBeCloseTo(expected.m12, digits);
  expect(actual.m13).toBeCloseTo(expected.m13, digits);
  expect(actual.m21).toBeCloseTo(expected.m21, digits);
  expect(actual.m22).toBeCloseTo(expected.m22, digits);
  expect(actual.m23).toBeCloseTo(expected.m23, digits);
  expect(actual.m31).toBeCloseTo(expected.m31, digits);
  expect(actual.m32).toBeCloseTo(expected.m32, digits);
  expect(actual.m33).toBeCloseTo(expected.m33, digits);
}
