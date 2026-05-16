// Demimonde marble — vertex shader
// Drives a Drei <ScreenQuad>. `position` arrives in clip space (-1..1).
// Convert to a 0..1 uv for the fragment shader.

varying vec2 vUv;

void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  vUv = position.xy * 0.5 + 0.5;
}
