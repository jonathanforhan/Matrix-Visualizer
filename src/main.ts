import "./style.css"
import {MathfieldElement} from "mathlive";
import {vertexShaderString, fragmentShaderString} from "./shader.ts"
import {cubeVertices} from "./cube.ts";
import Renderer from "./renderer.ts"
import * as textureUrl from "/public/snhu.png";

const canvas = document.querySelector("#gl-canvas")! as HTMLCanvasElement;
const matrix = document.querySelector<MathfieldElement>('#matrix')!;

document.querySelector("body")!.style.margin = "0";
document.querySelector("body")!.style.padding = "0";
document.querySelector("body")!.style.overflow = "clip";

/* Main Driver */
(async function main() {
  const renderer = new Renderer(canvas, matrix);
  renderer.createShaderProgram(vertexShaderString, fragmentShaderString);
  renderer.createBuffers(cubeVertices);
  await renderer.loadTexture(textureUrl.default);
  renderer.enterRenderLoop();
})()
