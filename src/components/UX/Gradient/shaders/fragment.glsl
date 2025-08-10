uniform float u_time;
uniform float u_progress;
uniform sampler2D u_texture1;
uniform vec4 u_resolution;
uniform float uAdditionalZoom;
uniform vec2 uAdditionalOffset;
uniform vec3 u_color[3];
uniform float uSize;
uniform vec2 uOffset;
uniform float uColorMixer;
uniform float uSpeed;
uniform sampler2D u_noiseTexture;
varying vec2 v_uv;
varying vec3 v_color;
varying vec3 v_position;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
    dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 nUv = (-.5 + v_uv) * 2.;
    if (u_resolution.x < u_resolution.y) {
        nUv.x *= u_resolution.x / u_resolution.y;
    } else {
        nUv.y *= u_resolution.y / u_resolution.x;
    }
    nUv = nUv / 2. + .5;
    float additionalZoom = uAdditionalZoom;
    vec2 offset = uOffset + uAdditionalOffset;

    vec2 bUv = nUv * (uSize * 2. + additionalZoom);
    vec2 nUv1 = bUv + offset * (1.) + u_time * uSpeed;
    bUv.y -= .5;
    vec2 nUv2 = bUv + offset * (1.) - u_time * uSpeed;
    vec4 noiseColor1 = texture2D(u_noiseTexture, nUv1);
    float noise1 = noiseColor1.r;

    vec4 noiseColor2 = texture2D(u_noiseTexture, nUv2);
    float noise2 = noiseColor2.r;
    float noise = clamp((noise1 + noise2) / 2., 0., 1.);

    vec2 nUv3 = bUv + noise * .5;
    noise = texture2D(u_noiseTexture, nUv3).r;
    vec3 color = vec3(0.);
    noise = mix(noise, noise * 1.25 + .15, 0.);
    if (noise < 0.25) {
        color = mix(v_color, u_color[1], noise / 0.25);
    } else if (noise < 0.5) {
        color = mix(v_color, u_color[2], (noise - 0.25) / 0.25);
    } else if (noise < 0.75) {
        color = mix(v_color, u_color[2], (noise - 0.5) / 0.25);
    } else {
        color = v_color;
    }
    vec3 alt = pow(color, vec3(2.));
    alt = alt * 1. - step(.01, color);
    color = mix(color, alt, uColorMixer);
    gl_FragColor = vec4(v_uv, 0.0, 1.);

    //    gl_FragColor = vec4(v_color, 1.);
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
