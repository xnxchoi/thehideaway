varying vec2 vUv;
uniform float u_time;
uniform float u_size;
uniform vec2 u_offset;
uniform float u_speed;
uniform vec2 u_resolution;
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
void main() {
    gl_Position = projectionMatrix * modelViewMatrix  * modelMatrix * vec4(position, 1.0);
    vUv = uv;
}