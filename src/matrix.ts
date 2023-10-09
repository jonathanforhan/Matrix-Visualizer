import {MathfieldElement} from "mathlive";

export type matrix_t = number[];

export default class Matrix {
  public model: matrix_t;
  public view: matrix_t;
  public projection: matrix_t;

  constructor() {
    this.model = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
    this.view = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -10, 1
    ];
    this.projection = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
  }

  static decodeMatrix(mf: MathfieldElement, n = 4): string[] {
    let arr = new Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        arr[i * n + j] = mf.getPromptValue("" + i + j);
      }
    }
    return arr;
  }

  static multiplySquareMatrix(a: matrix_t, b: matrix_t, x: number) {
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

  static getIdentity(n: number): number[] {
    let mat = new Array(n * n).fill(0);
    for (let i = 0; i < mat.length; i += n + 1) {
      mat[i] = 1;
    }
    return mat;
  }
}