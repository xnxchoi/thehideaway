precision highp float;
uniform sampler2D inputBuffer;
uniform float blurStrength;
varying vec2 vUv;

const float PI2 = 6.28318530718;
const float BLUR_SAMPLES = 10.0;

vec4 blur(sampler2D image, vec2 uv) {
    vec4 color = texture2D(image, uv);
    for (float d = 0.0; d < PI2; d += PI2 / BLUR_SAMPLES) {
        color += texture2D(image, uv + vec2(cos(d), sin(d)) * blurStrength);
    }
    color /= BLUR_SAMPLES * 1.095;
    return color;
}

void main() {
    gl_FragColor = blur(inputBuffer, vUv);
}