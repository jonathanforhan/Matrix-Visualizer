import {MathfieldElement} from "mathlive";

export type matrix_t = number[];

export default class Matrix {
  public model: matrix_t;
  public view: matrix_t;
  public projection: matrix_t;

  constructor() {
    this.model = Matrix.getIdentity(16);
    this.view = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -10, 1
    ];
    this.projection = Matrix.getIdentity(16);
  }

  static decodeMatrix(mf: MathfieldElement, x = 16): string[] {
    let n = Math.sqrt(x)
    let arr = new Array(16);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        arr[i * n + j] = mf.getPromptValue("" + i + j);
      }
    }
    return arr;
  }

  static multiplySquareMatrix(a: matrix_t, b: matrix_t, x: number): matrix_t {
    const n = Math.sqrt(x);
    if (a.length !== b.length || a.length !== x) {
      throw `Not a ${n} by ${n} matrix`;
    }
    let c = Array(x).fill(0);
    for (let i = 0; i < c.length; i++) {
      for (let j = 0; j < n; j++) {
        c[i] += a[i - (i % n) + j] * b[(i % n) + (j * n)];
      }
    }
    return c;
  }

  static getProjection(fov: number, ratio: number, zMin: number, zMax: number) {
    const angle = Math.tan((fov * 0.5) * Math.PI / 180);
    return [
      0.5 / angle, 0 , 0, 0,
      0, 0.5 * ratio / angle, 0, 0,
      0, 0, -(zMax + zMin) / (zMax - zMin), -1,
      0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
    ];
  }

  static getIdentity(x: number): matrix_t {
    let n = Math.sqrt(x);
    let mat = new Array(x).fill(0);
    for (let i = 0; i < mat.length; i += n + 1) {
      mat[i] = 1;
    }
    return mat;
  }

  static getIdentityPrototype(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "0", "0", "0", "1",
    ];
  }

  static getRotationX(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "\\cos t", "-\\sin t", "0",
      "0", "\\sin t", "\\cos t", "0",
      "0", "0", "0", "1",
    ];
  };

  static getRotationY(): string[] {
    return [
      "\\cos t", "0", "\\sin t", "0",
      "0", "1", "0", "0",
      "-\\sin t", "0", "\\cos t", "0",
      "0", "0", "0", "1",
    ];
  };

  static getRotationZ(): string[] {
    return [
      "\\cos t", "-\\sin t", "0", "0",
      "\\sin t", "\\cos t", "0", "0",
      "0", "0", "1", "0",
      "0", "0", "0", "1",
    ];
  };

  static getOrbitX(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "0", "2\\cos(2t)", "2\\sin(2t)", "1",
    ];
  }

  static getOrbitY(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "2\\cos(2t)", "0", "2\\sin(2t)", "1",
    ];
  }

  static getOrbitZ(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "2\\cos(2t)", "2\\sin(2t)", "0", "1",
    ];
  }

  static getTranslateX(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "2", "0", "0", "1",
    ];
  }

  static getTranslateY(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "0", "0", "0", "1",
      "0", "2", "0", "1",
    ];
  }

  static getTranslateZ(): string[] {
    return [
      "1", "0", "0", "0",
      "0", "1", "0", "0",
      "0", "0", "1", "0",
      "0", "0", "-2", "1",
    ];
  }

  static getScaled(): string[] {
    return [
      "\\sin t + 2", "0", "0", "0",
      "0", "\\sin t + 2", "0", "0",
      "0", "0", "\\sin t + 2", "0",
      "0", "0", "0", "1",
    ];
  }
}