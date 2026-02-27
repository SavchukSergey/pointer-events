import { expectMatrix3x3, expectVec2F } from "./asserts";
import { Matrix3x3 } from "./matrix3x3";
import { Multitouch } from "./multitouch";
import { Vec2F } from "./vec2f";

describe("Multitouch", () => {
  function testMultitouch(
    pointA?: [Vec2F, Vec2F],
    pointB?: [Vec2F, Vec2F],
    pointC?: [Vec2F, Vec2F]
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
      [new Vec2F(10, 20), new Vec2F(10, 30)]
    );
  });

  it("should evaluate 2-touch scale", () => {
    const matrix = testMultitouch(
      [new Vec2F(-10, -10), new Vec2F(-20, -20)],
      [new Vec2F(10, 10), new Vec2F(20, 20)]
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
    multitouch.untouch("A");
    multitouch.untouch("B");
    const actualGlobalA = multitouch.eval().mulV2(initialA);
    expectVec2F(actualGlobalA, finalA);
  });

  it("should evaluate 3-touch shift", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 20)],
      [new Vec2F(20, 10), new Vec2F(40, 20)],
      [new Vec2F(10, 20), new Vec2F(30, 30)]
    );
  });

  it("should evaluate 2-touch shift", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 20)],
      [new Vec2F(20, 10), new Vec2F(40, 20)]
    );
  });

  it("should evaluate 2-touch scale", () => {
    testMultitouch(
      [new Vec2F(10, 10), new Vec2F(30, 30)],
      [new Vec2F(20, 10), new Vec2F(60, 20)]
    );
  });

  it("should evaluate 1-touch shift", () => {
    testMultitouch([new Vec2F(10, 10), new Vec2F(30, 20)]);
  });

  it("should ignore a 4th touch", () => {
    const multitouch = new Multitouch();
    multitouch.touch("A", new Vec2F(0, 0));
    multitouch.touch("B", new Vec2F(10, 0));
    multitouch.touch("C", new Vec2F(0, 10));
    multitouch.touch("D", new Vec2F(10, 10)); // should be ignored

    multitouch.move("A", new Vec2F(5, 5));
    multitouch.move("B", new Vec2F(15, 5));
    multitouch.move("C", new Vec2F(5, 15));

    const matrix = multitouch.eval();
    // D was ignored, so the transform only uses A, B, C
    expectVec2F(matrix.mulV2(new Vec2F(0, 0)), new Vec2F(5, 5));
    expectVec2F(matrix.mulV2(new Vec2F(10, 0)), new Vec2F(15, 5));
    expectVec2F(matrix.mulV2(new Vec2F(0, 10)), new Vec2F(5, 15));
  });

  it("should handle untouch when no touches are active", () => {
    const multitouch = new Multitouch();
    // Calling untouch before any touch should not throw
    multitouch.touch("A", new Vec2F(0, 0));
    multitouch.move("A", new Vec2F(5, 5));
    multitouch.untouch("A");
    const matrix = multitouch.eval();
    expectMatrix3x3(matrix, Matrix3x3.translate(new Vec2F(5, 5)));
  });
});
