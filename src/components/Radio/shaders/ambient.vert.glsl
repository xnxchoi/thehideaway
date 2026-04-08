// Full-screen quad vertex shader.
// With orthographic camera + 2×2 plane, UVs map 1:1 to screen.
varying vec2 v_uv;

void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
