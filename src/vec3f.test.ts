import { Vec3F } from "./vec3f";

describe("vec3f", () => {
  function expectVec3F(actual: Vec3F, expected: Vec3F) {
    const digits = 5;
    expect(actual.x).toBeCloseTo(expected.x, digits);
    expect(actual.y).toBeCloseTo(expected.y, digits);
    expect(actual.z).toBeCloseTo(expected.z, digits);
  }

  it("should add", () => {
    expectVec3F(
      new Vec3F(10, 20, 30).add(new Vec3F(-2, 12, 4)),
      new Vec3F(8, 32, 34),
    );
  });

  it("should sub", () => {
    expectVec3F(
      new Vec3F(10, 20, 30).sub(new Vec3F(-2, 12, 4)),
      new Vec3F(12, 8, 26),
    );
  });

  it("should mul", () => {
    expectVec3F(new Vec3F(10, 20, 30).mul(4), new Vec3F(40, 80, 120));
  });

  it("should div", () => {
    expectVec3F(new Vec3F(40, 80, 120).div(4), new Vec3F(10, 20, 30));
  });
});
