// Minimal vertex shader — the ambient background is a flat full-screen quad.
// All visual complexity lives in the fragment shader.
varying vec2 v_uv;

void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
