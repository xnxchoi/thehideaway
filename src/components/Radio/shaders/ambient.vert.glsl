// Full-screen quad: output clip-space coords directly, bypass camera.
// PlaneGeometry(2,2) has vertices at (-1,-1) to (1,1) — perfect clip space.
varying vec2 v_uv;

void main() {
    v_uv = uv;
    // Write position directly to clip space — fills entire screen
    // regardless of camera settings.
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
