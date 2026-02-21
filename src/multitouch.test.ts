import { expectMatrix3x3, expectVec2F } from "./math.testing";
import { Matrix3x3 } from "./matrix3x3";
import { Multitouch } from "./multitouch";
import { Vec2F } from "./vec2f";

describe("Multitouch", () => {
  function testMultitouch(
    pointA?: [Vec2F, Vec2F],
    pointB?: [Vec2F, Vec2F],
    pointC?: [Vec2F, Vec2F],
  ) {
    const multitouch = new Multitouch();

    if (pointA) {
      multitouch.touch("A", pointA[0]);
    }
    if (pointB) {
      multitouch.touch("B", pointB[0]);
    }
    if (pointC) {
      multitouch.touch("C", pointC[0]);
    }
    if (pointA) {
      multitouch.move("A", pointA[1]);
    }
    if (pointB) {
      multitouch.move("B", pointB[1]);
    }
    if (pointC) {
      multitouch.move("C", pointC[1]);
    }

    const matrix = multitouch.eval();

    if (pointA) {
      expectVec2F(matrix.mulV2(pointA[0]), pointA[1]);
    }
    if (pointB) {
      expectVec2F(matrix.mulV2(pointB[0]), pointB[1]);
    }
    if (pointC) {
      expectVec2F(matrix.mulV2(pointC[0]), pointC[1]);
    }

    return matrix;
  }

  it("should evaluate 3-touch scale", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(10, 10)],
      [new Vec2F(20, 10), new Vec2F(30, 10)],
      [new Vec2F(10, 20), new Vec2F(10, 30)],
    );
  });

  it("should evaluate 2-touch scale", () => {
    const matrix = testMultitouch(
      [new Vec2F(-10, -10), new Vec2F(-20, -20)],
      [new Vec2F(10, 10), new Vec2F(20, 20)],
    );
    expectMatrix3x3(matrix, Matrix3x3.scaleAll(2));
  });

  it("should evaluate 2-touch scale after 1-touch shift", () => {
    const multitouch = new Multitouch();
    const initialA = new Vec2F(-10, -10);
    multitouch.touch("A", initialA);
    multitouch.move("A", new Vec2F(0, 0));
    multitouch.touch("B", new Vec2F(10, 10));
    const finalA = new Vec2F(-20, -20);
    multitouch.move("A", finalA);
    multitouch.move("B", new Vec2F(20, 20));
    const actualMatrix = multitouch.eval();
    multitouch.untouch("A");
    multitouch.untouch("B");
    const actualGlobalA = actualMatrix.mulV2(initialA);
    expectVec2F(actualGlobalA, finalA);
  });

  it("should evaluate 3-touch shift", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 20)],
      [new Vec2F(20, 10), new Vec2F(40, 20)],
      [new Vec2F(10, 20), new Vec2F(30, 30)],
    );
  });

  it("should evaluate 2-touch shift", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 20)],
      [new Vec2F(20, 10), new Vec2F(40, 20)],
    );
  });

  it("should evaluate 2-touch scale", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 30)],
      [new Vec2F(20, 10), new Vec2F(60, 20)],
    );
  });

  it("should evaluate 1-touch shift", () => {
    testMultitouch([new Vec2F(10, 10), new Vec2F(30, 20)]);
  });
});
