uniform sampler2D uSimulationTexture;
uniform vec2 uDisplacementStrength;
uniform float uCursorColoring;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // UV aspect fix
    /* vec2 nUv = (-.5 + uv) * 2.;
    if( resolution.x < resolution.y ) {
        nUv.x *= resolution.x / resolution.y;
    } else {
        nUv.y *= resolution.y / resolution.x;
    }
    nUv = nUv / 2. + .5; */

    vec4 gpgpuColor = texture2D(uSimulationTexture, vUv);

    vec2 dUv = vec2(
    uv.x - (-0.5 + gpgpuColor.r) * uDisplacementStrength.x * gpgpuColor.b,
    uv.y - (-0.5 + gpgpuColor.g) * uDisplacementStrength.y * gpgpuColor.b
    );

    vec4 color = texture2D(inputBuffer, dUv);

    color.rgb += color.rgb * gpgpuColor.b * uCursorColoring;

    outputColor = vec4(color.rgb, 1.0);
}