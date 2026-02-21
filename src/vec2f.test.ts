import { expectVec2F } from "./math.testing";
import { Vec2F } from "./vec2f";

describe("vec2f", () => {
  it("should add", () => {
    expectVec2F(new Vec2F(10, 20).add(new Vec2F(-2, 12)), new Vec2F(8, 32));
  });

  it("should sub", () => {
    expectVec2F(new Vec2F(10, 20).sub(new Vec2F(-2, 12)), new Vec2F(12, 8));
  });

  it("should mul", () => {
    expectVec2F(new Vec2F(10, 20).mul(4), new Vec2F(40, 80));
  });

  it("should div", () => {
    expectVec2F(new Vec2F(40, 80).div(4), new Vec2F(10, 20));
  });

  it("should normalize", () => {
    expectVec2F(new Vec2F(30, 40).normalize(), new Vec2F(0.6, 0.8));
  });

  it("should withLength", () => {
    expectVec2F(new Vec2F(30, 40).withLength(10), new Vec2F(6, 8));
  });

  it("should equals", () => {
    expect(new Vec2F(30, 40).equals(new Vec2F(30, 40))).toBeTruthy();
    expect(new Vec2F(30, 40).equals(new Vec2F(31, 40))).toBeFalsy();
    expect(new Vec2F(30, 40).equals(new Vec2F(30, 41))).toBeFalsy();
  });

  it("should toString", () => {
    expect(new Vec2F(30, 40).toString()).toBe("{x:30, y:40}");
  });
});
