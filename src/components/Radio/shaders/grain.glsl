uniform float uXCount;
uniform float uYCount;
uniform float uIntensity;

vec2 hash(vec2 p) // replace this by something better
{
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(in vec2 p) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n =
    h * h * h * h *
    vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

float speed = 12.;
// float intensity = .01;

float random2d(vec2 coord) {
    return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float blendSoftLight(float base, float blend) {
    return (blend < 0.5)
    ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
    : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return vec3(blendSoftLight(base.r, blend.r), blendSoftLight(base.g, blend.g),
    blendSoftLight(base.b, blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
    return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

void mainImage(const in vec4 inputColor, const in vec2 uv,
out vec4 outputColor) {
    float gridX = floor(uv.x * uXCount) / uXCount;
    float gridY = 1.0 - floor(uv.y * uYCount) / uYCount;
    float t = mod(time, 1.);
    // float timeSpeed = time; // -> fluide (it's random, so we cant control the
    // speed)
    float timeSpeed = floor(t * 8.); // -> saccadé
    // float timeSpeed = 1.;
    // float intensity = (inputColor.r + inputColor.g + inputColor.b) / 3.;
    float grain = random2d(vec2(gridX + timeSpeed, gridY));

    grain -= grain / 2.;
    grain *= .1;

    vec3 resultColor =
    blendSoftLight(inputColor.rgb, inputColor.rgb + grain, uIntensity);

    outputColor = vec4(resultColor, 1.0);
    // outputColor = vec4(inputColor.rgb, 1.0);
}