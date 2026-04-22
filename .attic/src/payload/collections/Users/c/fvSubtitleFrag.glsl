varying vec2 vUv;

uniform float opacity;

uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform vec2 i_resolution;
uniform float borderRadius;

float borderAlpha(vec2 uv, float radius) {
    vec2 aspectCorrectedUV = uv * resolution.xy / min(resolution.x, resolution.y);
    vec2 q = aspectCorrectedUV - 0.5 * resolution.xy / min(resolution.x, resolution.y);
    vec2 p = abs(q) - (vec2(0.5 * resolution.xy / min(resolution.x, resolution.y)) - radius);
    float dist = length(max(vec2(max(p.x, 0.0), max(p.y, 0.0)), 0.0));
    float alpha = max(p.x, p.y) < 0.0 ? 1.0 : 1.0 - smoothstep(radius - 0.001, radius, dist);
    return alpha;
}

void main() {

    vec2 ratio = vec2(min((resolution.x / resolution.y) / (i_resolution.x / i_resolution.y), 1.0), min((resolution.y / resolution.x) / (i_resolution.y / i_resolution.x), 1.0));

    vec2 uvCover = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);

    float alpha = borderAlpha(vUv, borderRadius);
    vec4 iFin = texture(tDiffuse, uvCover);
    iFin.a = iFin.a * alpha * opacity;
    gl_FragColor = iFin;

}