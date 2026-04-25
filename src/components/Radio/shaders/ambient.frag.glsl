varying vec2 vUv;
uniform float u_time;
uniform float u_scrollPhase;
uniform vec2 u_resolution;
uniform vec3 u_bgColor;
uniform vec3 u_color1;        // shadow valley
uniform vec3 u_color2;        // secondary shadow
uniform vec3 u_color3;        // lit ridge – vivid rosso / teal
uniform vec3 u_color4;        // secondary lit
uniform float u_audioLevel;
uniform float u_audioBeat;       // smooth peak-envelope (~280ms decay)
uniform float u_fogProgress;
uniform float u_opacity;
uniform float u_blobIntensity;
uniform sampler2D u_noiseTexture;

// ── Simplex 2D noise ──────────────────────────────────────────────────────
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                             dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 nUv = (vUv - 0.5) * vec2(aspect, 1.0);

    // Audio is intentionally NOT coupled to anything in the fragment shader.
    // The only audio response lives in the postprocess blur radius (JS side),
    // so colors literally "blur more/less" with the music. The fold field
    // itself moves at a constant pace independent of playback.

    float beat = u_audioBeat;
    float t = u_time * 1.6;
    float aud  = u_audioLevel * 0.06;
    float scrollOffset = u_scrollPhase * 2.0;

    // ── Single broad warp octave — leeroy uses two opposing-flow noise samples
    // averaged + one self-referenced re-sample. We replicate that here: low
    // frequency keeps folds BROAD (no fine subdivision), and the self-reference
    // step (foldBase fed back into a noise lookup) creates the "sticky silk"
    // quality without stacking high-frequency detail.
    // Noise frequency held constant — no audio modulation on shape, only bloom.
    float beatFreq = .22+0.4*clamp(0.,1.5,beat);
    vec2 qOrbit = vec2(cos(t * 0.10), sin(t * 0.12)) * 1.2;
    vec2 q = vec2(
        snoise(nUv * beatFreq + qOrbit),
        snoise(nUv * beatFreq - qOrbit + vec2(5.2, 1.3))
    );

    // ── No audio displacement on the fold plane — all audio response now
    //    lives in halation (specular bloom intensity) downstream.
    float audPunch = 0.0;
    float audioSwell = q[0];

    // ── Primary fold plane — broad strokes only ──────────────────────────────
    // Fewer / lower-amplitude warp terms = larger fold cells. Reference leeroy
    // has folds that span 1/4–1/3 of viewport; we were stacking too many
    // octaves and getting eddies/vortices instead of broad rolling silk.
    float foldBase = nUv.y * 0.85 + nUv.x * 0.40;
    foldBase += q.x * 1.30;             // slow morphing sweep
    foldBase += q.y * 0.55;             // diagonal warp
    foldBase += scrollOffset * 0.35;
    foldBase += audioSwell;

    // Self-reference (leeroy trick): re-sample noise at offset based on current
    // foldBase so folds stick to themselves and get the silk drape quality.
    // Two-pass: a broad pass (low freq, big amplitude) defines the major drape,
    // a finer pass (mid freq, smaller amplitude) adds variation along the
    // folds without breaking them into eddies. Both orbit so they evolve.
    vec2 selfOrbitA = vec2(sin(t * 0.14), cos(t * 0.13)) * 1.0;
    float selfRefA = snoise(nUv * 0.40 + foldBase * 0.20 + selfOrbitA) * 0.55*u_audioLevel;
    foldBase += selfRefA;

    vec2 selfOrbitB = vec2(cos(t * 0.11), sin(t * 0.16)) * 0.8;
    float selfRefB = snoise(nUv * 0.70 + foldBase * 0.12 + selfOrbitB) * 0.30;
    foldBase += selfRefB;

    float fold = sin(foldBase * 3.14159265);

    // ── Secondary fold layer for depth ───────────────────────────────────────
    // Single broad term. Different orbit so layers de-correlate over time.
    vec2 d2Orbit = vec2(sin(t * 0.13), cos(t * 0.15)) * 1.0;
    float foldBase2 = nUv.y * 0.55 + nUv.x * 0.25;
    foldBase2 += q.x * 0.95;
    foldBase2 += q.y * 0.40;
    foldBase2 += snoise(nUv * 0.30 + d2Orbit) * 0.55;
    foldBase2 += scrollOffset * 0.25;
    foldBase2 += audioSwell * 0.5;
    float fold2 = sin(foldBase2 * 3.14159265 + 1.2);

    // ── Mid-frequency fabric weave — kept low so it reads as fabric grain,
    //    NOT as additional fold detail. Single octave, lower frequency.
    vec2 wOrbit = vec2(cos(t * 0.18), sin(t * 0.20)) * 1.2;
    float weave = snoise(nUv * 1.1 + q * 0.4 + wOrbit) * 0.40;

    // ── Envelope: full coverage, only clip extreme corners ───────────────────
    float cornerDist = length(nUv / vec2(aspect * 0.5, 0.5));
    float envelope = 1.0 - smoothstep(1.25, 1.55, cornerDist);

    // ── Silk lighting — wide smoothstep ranges = soft gradient transitions ──
    // Weave shifts the lighting threshold per-pixel so fabric ridges show
    // through as brightness variation across the broad bloom.
    float foldShaded = fold + weave * 0.45;
    float litFace  = smoothstep(-1.30, 1.10, foldShaded);
    float litFace2 = smoothstep(-1.10, 1.00, fold2);
    float specular = smoothstep(0.55, 1.15, foldShaded);

    // ── Silk-gradient ramp ───────────────────────────────────────────────────
    // Two changes from straight quartile-linear mix:
    //   1) Smoothstep WITHIN each band → soft sigmoid blend at every stop,
    //      no derivative kinks at quartile boundaries. This is the single
    //      biggest factor in "silky" vs "banded" perception.
    //   2) Slight S-curve on the ramp itself (smoothstep applied to ramp)
    //      pushes dark/bright apart, compressing muddy mids → high-contrast
    //      silk look that leeroy gets from carefully curated stop colors.
    float ramp = clamp(foldShaded * 0.5 + 0.5, 0.0, 1.0);
    ramp = clamp(ramp + weave * 0.045, 0.0, 1.0);
    // Bias toward extremes — silk = strong dark + strong bright, soft mids.
    ramp = smoothstep(0.05, 0.95, ramp);

    vec3 foldSurface;
    if (ramp < 0.25) {
        foldSurface = mix(u_color1, u_color2, smoothstep(0.0, 1.0, ramp / 0.25));
    } else if (ramp < 0.50) {
        foldSurface = mix(u_color2, u_color3, smoothstep(0.0, 1.0, (ramp - 0.25) / 0.25));
    } else if (ramp < 0.75) {
        foldSurface = mix(u_color3, u_color4, smoothstep(0.0, 1.0, (ramp - 0.50) / 0.25));
    } else {
        foldSurface = u_color4;
    }

    // Secondary fold layer mix lowered — was pushing mid-tone presence too
    // high and muddying the high-contrast silk feel.
    float ramp2 = clamp(litFace2, 0.0, 1.0);
    vec3 foldSurface2 = mix(u_color1, u_color3, ramp2);
    foldSurface = mix(foldSurface, foldSurface2, 0.10);

    // ── Fine silk shimmer: micro-tonal variation across entire surface ───────
    foldSurface *= (1.0 + weave * 0.12);

    // ── Halation: static specular bloom (no audio coupling). The audio
    //    response is handled exclusively by the postprocess blur radius —
    //    the same colors get smeared more or less depending on the music.
    foldSurface = mix(foldSurface, u_color4 * 1.20, specular * 0.40);

    // ── Compose ──────────────────────────────────────────────────────────────
    vec3 color = mix(u_bgColor, foldSurface, envelope * u_blobIntensity);

    color = clamp(color, 0.0, 1.0);
    // Light s-curve only — heavier mix crushes midtones and makes the palette
    // look flat (poles dominate, intermediate stops vanish).
    vec3 sCurve = color * color * (3.0 - 2.0 * color);
    color = mix(color, sCurve, 0.18);

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
