uniform float time;
uniform vec3 energyColor;
uniform float pulseSpeed;
uniform float numberOfPulses;
uniform float pulseWidth;
uniform float glowStrength;
uniform float glowSpread;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    float pulsePhase = fract(vUv.x * numberOfPulses - time * pulseSpeed);
    float pulse = smoothstep(0.0, pulseWidth, pulsePhase) *
    smoothstep(pulseWidth * 2.0, pulseWidth, pulsePhase);
    vec3 viewDirection = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), glowSpread);
    float alpha = smoothstep(0.1, 1.0, max(pulse * 0.8, fresnel * 0.3));
    vec3 finalColor = energyColor * (pulse + fresnel * 0.5) * glowStrength;
    gl_FragColor = vec4(finalColor, alpha);
}