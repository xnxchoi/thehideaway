// Minimal vertex shader — the ambient background is a flat full-screen quad.
// All visual complexity lives in the fragment shader.
varying vec2 v_uv;
varying vec3 v_color;

void main() {
    v_uv = uv;
    v_color = vec3(0.5);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
