import * as THREE from "three";

export interface TicketTextureInput {
  eventName: string;
  ticketNumber: number | null;
  date: string | null;
  location: string | null;
}

// Texture proportions match the geometry's 2:1 silhouette (see TicketMesh).
// 0.70 corresponds to the geometric perforation x-position so the printed
// dots line up with the notches cut into the mesh outline.
const W = 1600;
const H = 800;
const STUB_RATIO = 0.7;
const STUB_X = Math.round(W * STUB_RATIO);
const PAD = 80;

const INK = "rgba(22, 17, 14, 0.96)";
const INK_SOFT = "rgba(22, 17, 14, 0.62)";
const INK_GHOST = "rgba(22, 17, 14, 0.16)";

const FONT_SANS =
  "Helvetica Neue, Helvetica, Arial, system-ui, -apple-system, sans-serif";
const FONT_MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

/**
 * Generate the canvas texture for the ticket front. Designed at 2:1 aspect
 * to match the extruded silhouette in TicketMesh, with a clear two-section
 * layout — body on the left, tear-off stub on the right — and typography
 * bold enough to survive being downsampled onto the geometry.
 */
export function makeTicketTexture(input: TicketTextureInput): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();

  // ── Paper base ──────────────────────────────────────────────────────────
  // Cool pearl with a faint vignette so the edges feel hand-laid. Kept
  // neutral-cool on purpose — the iridescent material is what colours the
  // surface, and a warm cream base produces yellow-on-yellow.
  const bg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H);
  bg.addColorStop(0, "#f6f4ee");
  bg.addColorStop(1, "#e2e0d8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain — cheap white-noise dots.
  ctx.fillStyle = "rgba(22,17,14,0.05)";
  for (let i = 0; i < 2400; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Slightly different tint on the stub so the two sections read distinctly.
  ctx.fillStyle = "rgba(22,17,14,0.04)";
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  // ── Outer hairline frame ───────────────────────────────────────────────
  ctx.strokeStyle = "rgba(22,17,14,0.34)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // ── Perforation line at stub boundary ──────────────────────────────────
  // Dashed line + dots, running top to bottom.
  ctx.strokeStyle = "rgba(22,17,14,0.4)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(STUB_X, 36);
  ctx.lineTo(STUB_X, H - 36);
  ctx.stroke();
  ctx.setLineDash([]);

  // Heavier perforation dots layered on top for that real ticket feel.
  ctx.fillStyle = "rgba(22,17,14,0.55)";
  for (let y = 60; y < H - 60; y += 22) {
    ctx.beginPath();
    ctx.arc(STUB_X, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Body section (left) ────────────────────────────────────────────────
  drawBody(ctx, input);

  // ── Stub section (right) ───────────────────────────────────────────────
  drawStub(ctx, input.ticketNumber);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  input: TicketTextureInput
): void {
  const innerR = STUB_X - 36;

  // Eyebrow — top-left.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 30px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ADMIT ONE", PAD, PAD + 36);

  // Faint brand monogram in the upper-right of the body.
  ctx.fillStyle = INK_GHOST;
  ctx.font = `300 320px ${FONT_SERIF}`;
  ctx.textAlign = "right";
  ctx.fillText("H", innerR - 24, 280);

  // Event name — large, light weight, wrapped to up to two lines.
  ctx.fillStyle = INK;
  ctx.font = `300 96px ${FONT_SANS}`;
  ctx.textAlign = "left";
  wrapText(ctx, input.eventName, PAD, 360, innerR - PAD - 48, 104, 2);

  // Date · location strip — mono caps along the bottom of the body.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 26px ${FONT_MONO}`;
  const meta =
    [input.date, input.location].filter(Boolean).join("   ·   ") ||
    "DATE   ·   PLACE";
  // Apply caps + a touch of letter-spacing manually. canvas2D's
  // letter-spacing support is unreliable across browsers, so we draw the
  // string directly and accept default tracking.
  ctx.fillText(meta.toUpperCase(), PAD, H - PAD - 16);
}

function drawStub(
  ctx: CanvasRenderingContext2D,
  ticketNumber: number | null
): void {
  const stubW = W - STUB_X;
  const cx = STUB_X + stubW / 2;
  const num = String(ticketNumber ?? 0).padStart(4, "0");

  // "NO." label — top of stub, centred.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 26px ${FONT_MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("NO.", cx, PAD + 36);

  // Big ticket number — the visual anchor of the stub.
  ctx.fillStyle = INK;
  ctx.font = `300 180px ${FONT_MONO}`;
  ctx.fillText(num, cx, H / 2 + 60);

  // "ADMIT ONE" repeated as a vertical accent at the bottom of the stub.
  ctx.save();
  ctx.translate(cx, H - PAD - 16);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 22px ${FONT_MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("ADMIT ONE", 0, 0);
  ctx.restore();
}

/**
 * Generate a roughness map paired with the colour texture. White = rough,
 * black = smooth (three.js convention). The body is left moderately rough
 * so the printed typography reads cleanly head-on; the borders, stub, and
 * the perforation strip are smoother so the iridescence shimmer
 * concentrates there as the card rotates — selective sheen instead of
 * uniform plastic.
 */
export function makeTicketRoughness(): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();

  // Base — moderately rough body.
  ctx.fillStyle = "#b4b4b4";
  ctx.fillRect(0, 0, W, H);

  // Stub area — smoother.
  const stubGrad = ctx.createLinearGradient(STUB_X, 0, W, 0);
  stubGrad.addColorStop(0, "#7a7a7a");
  stubGrad.addColorStop(1, "#5a5a5a");
  ctx.fillStyle = stubGrad;
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  // Outer border ribbon — smooth foil-edge effect.
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 28;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  // Soften the border with a wider faint band so it bleeds into the body.
  ctx.strokeStyle = "rgba(60,60,60,0.5)";
  ctx.lineWidth = 60;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Perforation seam — keep it smooth so the seam catches light.
  const seam = ctx.createLinearGradient(STUB_X - 30, 0, STUB_X + 30, 0);
  seam.addColorStop(0, "rgba(60,60,60,0)");
  seam.addColorStop(0.5, "rgba(60,60,60,0.8)");
  seam.addColorStop(1, "rgba(60,60,60,0)");
  ctx.fillStyle = seam;
  ctx.fillRect(STUB_X - 30, 0, 60, H);

  // Light noise so the surface doesn't look perfectly machined.
  for (let i = 0; i < 4000; i++) {
    const v = 140 + Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgba(${v},${v},${v},0.06)`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): void {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = probe;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Truncate the final line with an ellipsis if we ran out of room.
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }

  ctx.textAlign = "left";
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}
