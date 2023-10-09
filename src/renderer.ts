import {MathfieldElement} from "mathlive";
import Matrix from "./matrix.ts";
import {ComputeEngine} from "@cortex-js/compute-engine";

export default class Renderer {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _gl: WebGLRenderingContext;
  private readonly _mf: MathfieldElement;
  private readonly _ce: ComputeEngine;
  private _dt: number;
  private _buffer?: WebGLBuffer;
  private _shaderProgram?: WebGLProgram;
  private _textureID?: WebGLTexture;

  constructor(canvas: HTMLCanvasElement, mf: MathfieldElement) {
    this._canvas = canvas;
    this._gl = this._canvas.getContext('experimental-webgl')! as WebGLRenderingContext;
    this._mf = mf;
    this._ce = new ComputeEngine();
    this._dt = 0;

    const resize = () => [
      this._canvas.width = window.innerWidth - this._mf.clientWidth - 105,
      this._canvas.height = window.innerHeight
    ];
    window.addEventListener('load', resize)
    window.addEventListener('resize', resize)
  }

  public createShaderProgram(vertexString: string, fragmentString: string) {
    const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
    if (!vertexShader) throw "Failed to create GL Vertex Shader";
    this._gl.shaderSource(vertexShader, vertexString)
    this._gl.compileShader(vertexShader);

    const fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
    if (!fragmentShader) throw "Failed to create GL Fragment Shader";
    this._gl.shaderSource(fragmentShader, fragmentString)
    this._gl.compileShader(fragmentShader);

    const shaderProgram = this._gl.createProgram();
    if (!shaderProgram) throw "Failed to create GL Shader Program";
    this._gl.attachShader(shaderProgram, vertexShader);
    this._gl.attachShader(shaderProgram, fragmentShader);
    this._gl.linkProgram(shaderProgram);

    this._shaderProgram = shaderProgram;
  }

  public createBuffers(vertices: number[]) {
    if (!this._shaderProgram) { throw "Cannot create Buffers without Shader Program" }

    let vbo = this._gl.createBuffer();
    if (!vbo) throw "Failed to create GL Buffer";

    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);

    let pos = this._gl.getAttribLocation(this._shaderProgram, "position");
    this._gl.vertexAttribPointer(pos, 3, this._gl.FLOAT, false, 5 * 4, 0);
    this._gl.enableVertexAttribArray(pos);

    let tex = this._gl.getAttribLocation(this._shaderProgram, "texture_coords_in");
    this._gl.vertexAttribPointer(tex, 2, this._gl.FLOAT, false, 5 * 4, 3 * 4);
    this._gl.enableVertexAttribArray(tex);

    this._buffer = vbo;
  }

  public async loadTexture(url: string) {
    const texture = this._gl.createTexture();
    if (!texture) throw "Failed to create GL Texture";
    this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

    const image = new Image();
    image.addEventListener('load', () => {
      this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, image);
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.REPEAT);
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.REPEAT);
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
      this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
    });
    image.src = url;
    if ((image.width & (image.height - 1)) !== 0) {
      alert("Textures must be multiples of 2, i.e. 128, 256, 512 etc, due to WebGL using GLSL ES");
    }
    await image.decode();
    this._textureID = texture;
  }

  public enterRenderLoop() {
    if (!this._shaderProgram || !this._textureID || !this._buffer)
      throw "entered Render Loop without proper renderer initialization";

    this._gl.enable(this._gl.DEPTH_TEST);
    this._gl.depthFunc(this._gl.LEQUAL);
    this._gl.clearColor(0.3, 0.3, 0.3, 1.0);
    this._gl.clearDepth(1.0);
    this._gl.depthFunc(this._gl.LEQUAL);
    this._gl.useProgram(this._shaderProgram);
    this._gl.activeTexture(this._gl.TEXTURE0)
    this._gl.bindTexture(this._gl.TEXTURE_2D, this._textureID);
    this._gl.uniform1i(this._gl.getUniformLocation(this._shaderProgram, "texture_smpl"), 0)

    const uniformProjection = this._gl.getUniformLocation(this._shaderProgram, "projection");
    const uniformView = this._gl.getUniformLocation(this._shaderProgram, "view");
    const uniformModel = this._gl.getUniformLocation(this._shaderProgram, "model");

    let mvp: Matrix = new Matrix();
    mvp.projection = Matrix.getProjection(45, this._canvas.width / this._canvas.height, 1, 100);
    let modelPrototype: string[] = Matrix.getIdentity(4) as unknown as string[];
    let appendModels: string[][] = [];

    document.querySelector("#apply")!.addEventListener("click", () => {
      modelPrototype = Matrix.decodeMatrix(this._mf)
      appendModels = [];
    });
    document.querySelector("#append")!.addEventListener("click", () => {
      appendModels.push(Matrix.decodeMatrix(this._mf));
    });
    document.querySelector("#reset")!.addEventListener("click", () => {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          let c = i === j ? '1' : '0';
          this._mf.setPromptContent("" + i + j, c, {});
        }
      }
    });
    document.querySelector("#clear")!.addEventListener("click", () => {
      modelPrototype = Matrix.getIdentity(4) as unknown as string[];
      appendModels = [];
      document.querySelector<HTMLButtonElement>("#reset")!.click();
    });

    let t = 0;
    let then = 0;
    const animate = (now: number) => {
      now *= 0.001;
      this._dt = now - then;
      then = now;
      t += this._dt;

      mvp.projection = Matrix.getProjection(45, this._canvas.width / this._canvas.height, 1, 100);

      this._ce.symbol('t').value = t;
      this._ce.symbol('T').value = t;

      mvp.model = modelPrototype.map(x => {
        if (!isNaN(+x)) return +x;
        const expr = this._ce.parse(x).evaluate();
        return expr?.isValid && !isNaN(+expr) ? +expr.valueOf() : 0;
      });

      appendModels.forEach((mat) => {
        mvp.model = Matrix.multiplySquareMatrix(mvp.model, mat.map(x => {
          if (!isNaN(+x)) return +x;
          const expr = this._ce.parse(x).evaluate();
          return expr?.isValid && !isNaN(+expr) ? +expr.valueOf() : 0;
        }), 16);
      })

      this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
      this._gl.uniformMatrix4fv(uniformProjection, false, mvp.projection);
      this._gl.uniformMatrix4fv(uniformView, false, mvp.view);
      this._gl.uniformMatrix4fv(uniformModel, false, mvp.model);
      this._gl.drawArrays(this._gl.TRIANGLES, 0, 36);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }
}