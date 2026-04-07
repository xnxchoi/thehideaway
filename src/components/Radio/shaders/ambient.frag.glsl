uniform float u_time;
uniform vec4 u_resolution;
uniform vec3 u_bgColor;
uniform vec3 u_color1;        // base tone 1 (near-bg, subtle warm shift)
uniform vec3 u_color2;        // base tone 2 (near-bg, subtle cool shift)
uniform vec3 u_color3;        // accent 1 (primary atmospheric hue)
uniform vec3 u_color4;        // accent 2 (secondary atmospheric hue)
uniform float u_audioLevel;   // 0-1 audio energy → controls blob spread
uniform float u_fogProgress;  // 0-1 idle fog
uniform float u_opacity;
uniform float u_blobIntensity; // how visible the blobs are (playing vs stopped)
uniform sampler2D u_noiseTexture;
varying vec2 v_uv;

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

// ── Soft blob (large gaussian-like radial) ────────────────────────────────
float blob(vec2 uv, vec2 center, float radius, float softness) {
    float d = length(uv - center);
    return smoothstep(radius + softness, radius * 0.1, d);
}

void main() {
    vec2 uv = v_uv;
    float t = u_time * 0.04; // very slow drift — sub-perceptual movement

    // Aspect-correct coordinates centered at origin
    vec2 nUv = (uv - 0.5) * 2.0;
    float aspect = u_resolution.x / u_resolution.y;
    nUv.x *= aspect;

    // ── Audio reactivity ───────────────────────────────────────────────────
    // Halation: blobs spread outward and soften on beats
    float spread = 1.0 + u_audioLevel * 0.4;
    float softMod = 1.0 + u_audioLevel * 0.25;
    // Audio-driven position jitter — subtle rhythmic displacement
    float audioJitter = u_audioLevel * 0.08;
    // Audio pulses the noise scroll speed — folds breathe with the music
    float noiseSpeedPulse = 1.0 + u_audioLevel * 0.6;

    // ── Noise-texture sampling at 3 scales (fold structure) ───────────────
    // Scale 1: broad folds — the dominant visual rhythm
    vec2 noiseUv1 = uv * 0.8 + t * 0.15 * noiseSpeedPulse;
    // Scale 2: medium detail — secondary fold ridges
    vec2 noiseUv2 = uv * 1.6 - t * 0.12 * noiseSpeedPulse;
    // Scale 3: fine organic grain in fold edges
    vec2 noiseUv3 = uv * 3.0 + vec2(t * 0.08, -t * 0.1) * noiseSpeedPulse;

    float n1 = texture2D(u_noiseTexture, noiseUv1).r;
    float n2 = texture2D(u_noiseTexture, noiseUv2).r;
    float n3 = texture2D(u_noiseTexture, noiseUv3).r;

    // Combined noise — weighted toward broad folds
    float noiseWarp = n1 * 0.55 + n2 * 0.30 + n3 * 0.15;

    // ── Organic blob positions ────────────────────────────────────────────
    // Noise-perturbed orbits prevent geometric regularity
    float np = snoise(vec2(t * 0.3, 0.0)) * 0.15;
    // Audio jitter adds per-blob rhythmic displacement
    float aj1 = snoise(vec2(u_time * 2.1, 1.0)) * audioJitter;
    float aj2 = snoise(vec2(u_time * 1.7, 3.0)) * audioJitter;
    float aj3 = snoise(vec2(u_time * 2.5, 5.0)) * audioJitter;
    float aj4 = snoise(vec2(u_time * 1.9, 7.0)) * audioJitter;

    // Base blobs (1-2): very large, slow — they set the atmospheric mood
    vec2 b1Pos = vec2(
        sin(t * 0.51 + 1.2) * 0.6 + np + aj1,
        cos(t * 0.37 + 0.8) * 0.45 - aj1 * 0.7
    );
    vec2 b2Pos = vec2(
        cos(t * 0.33 - 0.5) * 0.7 - aj2 * 0.8,
        sin(t * 0.47 + 2.4) * 0.5 - np + aj2
    );
    // Accent blobs (3-4): moderately sized, slightly faster
    vec2 b3Pos = vec2(
        sin(t * 0.59 + 3.1) * 0.5 - np * 0.7 + aj3,
        cos(t * 0.41 - 1.2) * 0.6 + aj3 * 0.6
    );
    vec2 b4Pos = vec2(
        cos(t * 0.43 + 0.9) * 0.55 - aj4 * 0.5,
        sin(t * 0.63 - 0.4) * 0.4 + np * 0.5 + aj4
    );

    // Base blobs: very large radii for maximum fold surface area
    float b1 = blob(nUv, b1Pos, 1.2 * spread, 0.8 * softMod);
    float b2 = blob(nUv, b2Pos, 1.0 * spread, 0.7 * softMod);
    // Accent blobs: slightly smaller but still screen-spanning
    float b3 = blob(nUv, b3Pos, 0.85 * spread, 0.6 * softMod);
    float b4 = blob(nUv, b4Pos, 0.7 * spread, 0.5 * softMod);

    // ── Noise warp of blob intensities — creates the fabric folds ─────────
    // Wider modulation range = deeper valleys = more visible creases after blur
    b1 *= mix(0.25, 1.0, noiseWarp);
    b2 *= mix(0.30, 1.0, 1.0 - noiseWarp);
    b3 *= mix(0.20, 1.0, n2 * 0.6 + n3 * 0.4);
    b4 *= mix(0.35, 1.0, snoise(nUv * 0.6 + t * 0.4) * 0.5 + 0.5);

    // ── Color mixing (leeroy 4-color: 2 base + 2 accent) ────────────────
    vec3 color = u_bgColor;
    float intensity = u_blobIntensity;

    // Base tones — dominant atmosphere
    color = mix(color, u_color1, b1 * intensity * 0.9);
    color = mix(color, u_color2, b2 * intensity * 0.75);

    // Accent hues — atmospheric color injection
    color = mix(color, u_color3, b3 * intensity * 0.6);
    color = mix(color, u_color4, b4 * intensity * 0.5);

    // ── Fold creases — darkening where blobs overlap ──────────────────────
    float overlap = b1 * b2 + b2 * b3 + b3 * b4 + b1 * b4;
    // Additional crease from noise ridge lines
    float ridgeLine = abs(noiseWarp - 0.5) * 2.0; // 0 at ridges, 1 in valleys
    ridgeLine = 1.0 - smoothstep(0.0, 0.4, ridgeLine); // sharpen ridge
    // Audio deepens creases — beats compress the folds
    float creaseDepth = 1.0 + u_audioLevel * 0.4;
    color = mix(color, u_bgColor * 0.65, overlap * 0.3 * intensity * creaseDepth);
    color = mix(color, u_bgColor * 0.8, ridgeLine * 0.15 * intensity * creaseDepth);

    // ── Organic variation via simplex ─────────────────────────────────────
    float sn = snoise(nUv * 0.9 + t * 1.5) * 0.5 + 0.5;
    color = mix(color, color * (0.88 + sn * 0.24), intensity * 0.35);

    // ── Fog: idle state pushes toward bg ──────────────────────────────────
    float vignette = length(nUv / vec2(aspect, 1.0));
    vignette = smoothstep(0.2, 1.5, vignette);
    float fogMask = mix(vignette, 1.0, u_fogProgress * 0.65);
    color = mix(color, u_bgColor, u_fogProgress * 0.9 * fogMask);

    // ── Gentle contrast — don't fight the blur ───────────────────────────
    color = clamp(color, 0.0, 1.0);
    // Softer S-curve: mix between linear and Hermite
    vec3 sCurve = color * color * (3.0 - 2.0 * color);
    color = mix(color, sCurve, 0.6);

    gl_FragColor = vec4(color, u_opacity);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
