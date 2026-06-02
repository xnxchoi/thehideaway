
uniform sampler2D bloomTexture;
uniform float uNoiseStrength;
uniform float uVignetteStrength;
uniform vec3 uVignetteColor;
uniform float uMaxDistort;
uniform float uBendAmount;

const int iterations = 5;

vec2 barrelDistortion(vec2 coord, float amt) {
    vec2 cc = coord - 0.5;
    float dist = dot(cc, cc);
    return coord + cc * dist * amt;
}

float sat(float t) {
    return clamp(t, 0.0, 1.0);
}

float linterp(float t) {
    return sat(1.0 - abs(2.0 * t - 1.0));
}

float remap(float t, float a, float b) {
    return sat((t - a) / (b - a));
}

vec4 spectrum_offset(float t) {
    vec4 ret;
    float lo = step(t, 0.5);
    float hi = 1.0 - lo;
    float w = linterp(remap(t, 1.0 / 6.0, 5.0 / 6.0));
    ret = vec4(lo, 1.0, hi, 1.0) * vec4(1.0 - w, w, 1.0 - w, 1.0);
    return pow(ret, vec4(1.0 / 2.2));
}

float random(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 443.8975);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float blendSoftLight(float base, float blend) {
    return blend < 0.5
    ? 2.0 * base * blend + base * base * (1.0 - 2.0 * blend)
    : sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return vec3(
    blendSoftLight(base.r, blend.r),
    blendSoftLight(base.g, blend.g),
    blendSoftLight(base.b, blend.b)
    );
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
    return blendSoftLight(base, blend) * opacity + base * (1.0 - opacity);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 sumcol = vec4(0.0);
    vec4 sumw = vec4(0.0);
    float reci_num_iter_f = 1.0 / float(iterations);

    for (int i = 0; i < iterations; i++) {
        float t = float(i) * reci_num_iter_f;
        vec4 w = spectrum_offset(t);
        sumw += w;
        sumcol += w * texture2D(
        bloomTexture,
        barrelDistortion(uv, uBendAmount * uMaxDistort * t)
        );
    }

    outputColor = vec4(sumcol / sumw);

    vec2 uv2 = uv;
    uv2 *= 1.0 - vUv.yx;
    float vig = uv2.x * uv2.y * 20.0;
    vig = pow(vig, uVignetteStrength);
    outputColor = mix(vec4(uVignetteColor, 1.0), outputColor, vig);

    float noise = random(uv) - 0.5;
    outputColor.rgb = blendSoftLight(outputColor.rgb, vec3(noise), uNoiseStrength);
    outputColor.a += noise * uNoiseStrength;
}