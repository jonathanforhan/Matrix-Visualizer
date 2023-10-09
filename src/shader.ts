const vertexShaderString = `#version 100
  attribute vec3 position;
  attribute vec2 texture_coords_in;
  varying highp vec2 texture_coords_frag;
  uniform mat4 projection;
  uniform mat4 view;
  uniform mat4 model;

  void main() {
    gl_Position = projection * view * model * vec4(position, 1.0);
    texture_coords_frag = texture_coords_in;
  }
`;

const fragmentShaderString = `#version 100
  varying highp vec2 texture_coords_frag;
  uniform sampler2D texture_smpl;

  void main() {
    gl_FragColor = texture2D(texture_smpl, texture_coords_frag * vec2(1, -1));
  }
`;

export { vertexShaderString, fragmentShaderString };
