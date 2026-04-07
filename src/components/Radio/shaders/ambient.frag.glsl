uniform float u_time;
uniform vec4 u_resolution;
uniform vec3 u_bgColor;
uniform vec3 u_color1;        // primary blob color (warm amber/gold)
uniform vec3 u_color2;        // secondary blob color (teal/cool accent)
uniform vec3 u_color3;        // tertiary (deeper, earthier)
uniform float u_audioLevel;   // 0-1 audio energy → controls blob spread
uniform float u_fogProgress;  // 0-1 idle fog
uniform float u_opacity;
uniform float u_grainIntensity;
uniform float u_blobIntensity; // how visible the blobs are (playing vs stopped)
uniform sampler2D u_noiseTexture;
varying vec2 v_uv;
varying vec3 v_color;

// ── Simplex 2D noise ──────────────────────────────────────────────────────
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
        dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
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

// ── Film grain ────────────────────────────────────────────────────────────
float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float filmGrain(vec2 uv, float time) {
    float g = hash(uv * 1200.0 + fract(time * 5.7) * 200.0);
    // Harsh, contrasty grain — not soft gaussian
    g = pow(g, 1.5) * 2.0 - 0.5;
    return clamp(g, -0.5, 0.5);
}

// ── Soft blob (large gaussian-like radial) ────────────────────────────────
float blob(vec2 uv, vec2 center, float radius, float softness) {
    float d = length(uv - center);
    return smoothstep(radius + softness, radius * 0.1, d);
}

void main() {
    vec2 uv = v_uv;
    float t = u_time * 0.06; // slow organic drift

    // Aspect-correct coordinates centered at origin
    vec2 nUv = (uv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    nUv.x *= aspect;

    // Audio drives how much the blobs spread outward (halation)
    float spread = 1.0 + u_audioLevel * 0.4;
    float softMod = 1.0 + u_audioLevel * 0.25;

    // ── Organic blob positions — large, slow-drifting focal points ────────
    // 4 blobs with different orbits, like a lava lamp in slow motion
    vec2 b1Pos = vec2(
        sin(t * 0.71 + 1.2) * 0.7,
        cos(t * 0.53 + 0.8) * 0.5
    );
    vec2 b2Pos = vec2(
        cos(t * 0.47 - 0.5) * 0.8,
        sin(t * 0.67 + 2.4) * 0.6
    );
    vec2 b3Pos = vec2(
        sin(t * 0.59 + 3.1) * 0.5,
        cos(t * 0.41 - 1.2) * 0.7
    );
    vec2 b4Pos = vec2(
        cos(t * 0.37 + 0.9) * 0.6,
        sin(t * 0.83 - 0.4) * 0.4
    );

    // Large radii — these are screen-spanning blobs, not pinpoints
    float b1 = blob(nUv, b1Pos, 0.9 * spread, 0.6 * softMod);
    float b2 = blob(nUv, b2Pos, 0.7 * spread, 0.5 * softMod);
    float b3 = blob(nUv, b3Pos, 0.8 * spread, 0.55 * softMod);
    float b4 = blob(nUv, b4Pos, 0.6 * spread, 0.45 * softMod);

    // ── Noise-texture distortion of blob shapes ───────────────────────────
    // Sample the seamless texture to warp blob boundaries organically
    vec2 noiseUv1 = uv * 1.5 + t * 0.3;
    vec2 noiseUv2 = uv * 2.0 - t * 0.2;
    float noiseMod1 = texture2D(u_noiseTexture, noiseUv1).r;
    float noiseMod2 = texture2D(u_noiseTexture, noiseUv2).r;
    float noiseWarp = (noiseMod1 + noiseMod2) * 0.5;

    // Warp the blob intensities with noise for organic, fabric-like folds
    b1 *= mix(0.6, 1.0, noiseWarp);
    b2 *= mix(0.7, 1.0, 1.0 - noiseWarp);
    b3 *= mix(0.5, 1.0, snoise(nUv * 0.8 + t * 0.5) * 0.5 + 0.5);
    b4 *= mix(0.6, 1.0, noiseWarp * noiseWarp);

    // ── Color mixing ──────────────────────────────────────────────────────
    vec3 color = u_bgColor;

    // Layer blobs with their colors — like overlapping colored lights
    float intensity = u_blobIntensity;
    color = mix(color, u_color1, b1 * intensity * 0.85);
    color = mix(color, u_color2, b2 * intensity * 0.55);
    color = mix(color, u_color3, b3 * intensity * 0.45);
    color = mix(color, mix(u_color1, u_color3, 0.5), b4 * intensity * 0.35);

    // ── Folding / overlapping darks (FC Porto fabric look) ────────────────
    // Where blobs overlap, create darker creases
    float overlap = b1 * b2 + b2 * b3 + b1 * b3;
    color = mix(color, u_bgColor * 0.7, overlap * 0.3 * intensity);

    // ── Simplex noise for additional organic variation ─────────────────────
    float sn = snoise(nUv * 1.2 + t * 2.0) * 0.5 + 0.5;
    color = mix(color, color * (0.85 + sn * 0.3), intensity * 0.4);

    // ── Fog: idle state pushes everything toward bg ───────────────────────
    float vignette = length(nUv / vec2(aspect, 1.0));
    vignette = smoothstep(0.2, 1.5, vignette);
    float fogMask = mix(vignette, 1.0, u_fogProgress * 0.65);
    color = mix(color, u_bgColor, u_fogProgress * 0.9 * fogMask);

    // ── Film grain — heavy, contrasty ─────────────────────────────────────
    float grain = filmGrain(uv, u_time);
    color += grain * u_grainIntensity;

    // ── Contrast S-curve ──────────────────────────────────────────────────
    color = clamp(color, 0.0, 1.0);
    color = color * color * (3.0 - 2.0 * color);

    gl_FragColor = vec4(color, u_opacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
