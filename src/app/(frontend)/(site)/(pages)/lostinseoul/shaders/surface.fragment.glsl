uniform sampler2D tBake;
uniform sampler2D tNormal;
uniform vec3 baseColor;
varying vec2 vUv;

float random2dSurface(vec2 coord) {
    return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 bake = texture2D(tBake, vUv).rgb;
    vec3 normalColor = texture2D(tNormal, vUv * 7.0).rgb;
    float grain = random2dSurface(gl_FragCoord.xy) - 0.5;
    float shade = 0.96 + bake.r * 0.035 + (normalColor.r - 0.5) * 0.024 + grain * 0.006;
    gl_FragColor = vec4(baseColor * shade, 1.0);
}