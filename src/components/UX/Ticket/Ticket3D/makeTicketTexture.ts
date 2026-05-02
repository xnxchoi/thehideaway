import * as THREE from "three";

export interface TicketTextureInput {
  eventName: string;
  ticketNumber: number | null;
  date: string | null;
  location: string | null;
}

const W = 1024;
const H = 640;
const PAD = 64;

const PAPER_INK = "rgba(28, 22, 18, 0.92)";
const PAPER_INK_SOFT = "rgba(28, 22, 18, 0.62)";
const PAPER_INK_GHOST = "rgba(28, 22, 18, 0.32)";

/**
 * Generate the canvas texture used as the colour map on the ticket front.
 * Designed with a single ticket aesthetic in mind — typographic, high
 * contrast, leaves room for the holographic shift to dominate the surface.
 */
export function makeTicketTexture(input: TicketTextureInput): THREE.Texture {
  // SSR safety — texture is created lazily on the client.
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();

  // Bone paper base with a faint vignette so edges feel hand-laid.
  const bg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H);
  bg.addColorStop(0, "#f5ecdb");
  bg.addColorStop(1, "#e7dcc6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain (cheap white-noise dots).
  ctx.fillStyle = "rgba(28,22,18,0.04)";
  for (let i = 0; i < 1400; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Outer hairline frame.
  ctx.strokeStyle = "rgba(28,22,18,0.32)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Top-left eyebrow.
  ctx.fillStyle = PAPER_INK_SOFT;
  ctx.font = "600 18px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ADMIT  ONE", PAD, PAD + 30);

  // Brand monogram — top-right corner.
  ctx.fillStyle = PAPER_INK_GHOST;
  ctx.font = "300 96px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "right";
  ctx.fillText("H", W - PAD, PAD + 90);
  ctx.textAlign = "left";

  // Event name — wrapped, large, light weight.
  ctx.fillStyle = PAPER_INK;
  ctx.font =
    "300 64px ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', sans-serif";
  wrapText(ctx, input.eventName, PAD, 220, W - PAD * 2 - 200, 72, 3);

  // Date · location strip — mono caps.
  ctx.fillStyle = PAPER_INK_SOFT;
  ctx.font =
    "500 18px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.letterSpacing = "0.18em";
  const meta =
    [input.date, input.location].filter(Boolean).join("   ·   ") ||
    "DATE   ·   PLACE";
  ctx.fillText(meta.toUpperCase(), PAD, H - PAD - 40);

  // Ticket number block — bottom-right, big mono.
  const num = String(input.ticketNumber ?? 0).padStart(4, "0");
  ctx.fillStyle = PAPER_INK;
  ctx.font = "300 96px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.textAlign = "right";
  ctx.fillText(num, W - PAD, H - PAD - 16);
  ctx.fillStyle = PAPER_INK_SOFT;
  ctx.font = "600 14px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.fillText("NO.", W - PAD, H - PAD - 96);
  ctx.textAlign = "left";

  // Perforation-style row of dots near the bottom edge for ticket-feel.
  ctx.fillStyle = "rgba(28,22,18,0.28)";
  for (let x = PAD + 8; x < W - PAD; x += 14) {
    ctx.beginPath();
    ctx.arc(x, H - 28 - 0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
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

  // Truncate the final line with an ellipsis if we ran out.
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (
      ctx.measureText(`${last}…`).width > maxWidth &&
      last.length > 0
    ) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }

  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}
