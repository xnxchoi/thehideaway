uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec2 meshUV;

void main() {
    vec3 transformed = position * 0.5;
    meshUV = uv;
    vUv = textureMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}