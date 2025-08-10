varying vec2 vUv;

uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

uniform float fade;
uniform float opacity;

uniform float preloadPower;
uniform sampler2D tPoster;
uniform sampler2D tPreload;
uniform sampler2D tDiffuse;

float borderAlpha(vec2 uv, float radius) {
    vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
    vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
    vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
    float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
    float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
    return alpha;
}

void main() {

    vec2 ratio = vec2(
    min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0),
    min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0)
    );
    vec2 uvCover = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    float alpha = borderAlpha(vUv, borderRadius);
    alpha = step(0.5, alpha);


    vec4 iPoster = texture(tPoster, uvCover);
    vec4 iPreload = texture(tPreload, uvCover);
    vec4 iDiffuse = texture(tDiffuse, uvCover);


    vec4 iMix = mix(iDiffuse, iPreload, preloadPower);


    gl_FragColor = vec4(iMix.rgb, iMix.a * alpha * fade * opacity);


}