attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = position;
    gl_Position = vec4(2.0 * position - 1.0, 0.0, 1.0);
}