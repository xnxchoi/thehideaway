import * as THREE from "three";

export interface TicketTextureInput {
  eventName: string;
  ticketNumber: number | null;
  date: string | null;
  location: string | null;
}

// Texture proportions match the geometry's 2:1 silhouette in TicketMesh.
// STUB_RATIO corresponds to the geometric perforation x-position so the
// printed dots line up with the notches cut into the mesh outline.
const W = 2400;
const H = 1200;
const STUB_RATIO = 0.7;
const STUB_X = Math.round(W * STUB_RATIO);
const PAD = 96;

const INK = "rgba(20, 16, 12, 0.96)";
const INK_MID = "rgba(20, 16, 12, 0.72)";
const INK_SOFT = "rgba(20, 16, 12, 0.5)";
const INK_GHOST = "rgba(20, 16, 12, 0.18)";
const PAPER_TINT = "rgba(20, 16, 12, 0.04)";
const PAPER_GRAIN = "rgba(20, 16, 12, 0.05)";
const PERF_INK = "rgba(20, 16, 12, 0.55)";

const FONT_SANS =
  "Helvetica Neue, Helvetica, Arial, system-ui, -apple-system, sans-serif";
const FONT_MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

/**
 * Front of the ticket.
 *
 * Layout reference set:
 *   - Anders Bakken's Munch Museum tickets (display numerals on the stub,
 *     ink-stamp restraint).
 *   - Massimo Vignelli's transit tickets (hairline grid, Helvetica caps,
 *     ruthless letter-spacing).
 *   - MoMA's typographic restraint (single-ink discipline, generous
 *     margins, hairline rules between zones).
 *   - Wayne Nieves' letterpress ADMIT-ONE revival (the cinema-ticket
 *     vocabulary treated with reverence).
 *   - Cereal magazine event collateral (light serif italic for the
 *     event name, paired against mono caps for everything else — gives
 *     the layout some romance against the mono discipline).
 *
 * Body: editorial column. Big day numerals as the visual anchor. Month
 * caps + day-of-week + year as a tight gridded data block beside it.
 * Event name in light serif italic (the only italic on the whole card).
 * Time and venue as a mono-caps strip across the foot.
 *
 * Stub: just the serial. Massive numerals. No competition.
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

  drawPaper(ctx);
  drawPerforation(ctx);
  drawBodyFront(ctx, input);
  drawStubFront(ctx, input.ticketNumber);

  return finalize(c);
}

/**
 * Back of the ticket. Quiet, identity-only — the mark + boilerplate.
 * No data — the back doesn't compete with the front for attention.
 */
export function makeTicketBackTexture(
  input: TicketTextureInput
): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();

  drawPaper(ctx);
  drawPerforation(ctx);
  drawBodyBack(ctx, input);
  drawStubBack(ctx, input.ticketNumber);

  return finalize(c);
}

// ── Shared scaffolding ────────────────────────────────────────────────────

function finalize(c: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function drawPaper(ctx: CanvasRenderingContext2D): void {
  // Cool pearl base with a faint vignette so edges feel hand-laid.
  const bg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H);
  bg.addColorStop(0, "#f6f4ee");
  bg.addColorStop(1, "#e2e0d8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Paper grain — cheap white-noise dots.
  ctx.fillStyle = PAPER_GRAIN;
  for (let i = 0; i < 3600; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Stub gets a faintly different tint so the two zones read distinctly.
  ctx.fillStyle = PAPER_TINT;
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  // Outer hairline frame.
  ctx.strokeStyle = "rgba(20,16,12,0.32)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
}

function drawPerforation(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(20,16,12,0.4)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(STUB_X, 40);
  ctx.lineTo(STUB_X, H - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = PERF_INK;
  for (let y = 64; y < H - 64; y += 26) {
    ctx.beginPath();
    ctx.arc(STUB_X, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Front face ────────────────────────────────────────────────────────────

function drawBodyFront(
  ctx: CanvasRenderingContext2D,
  input: TicketTextureInput
): void {
  const innerR = STUB_X - 56;
  const meta = parseDate(input.date);

  ctx.textBaseline = "alphabetic";

  // ── Top rail: brand on the left, ADMIT ONE on the right ──────────────
  ctx.fillStyle = INK;
  ctx.font = `400 64px ${FONT_SERIF}`;
  ctx.textAlign = "left";
  ctx.fillText("H", PAD, PAD + 56);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 22px ${FONT_MONO}`;
  // Simulate letter-spacing for the wordmark — canvas2D's letter-spacing
  // is unreliable across browsers, so we draw character by character with
  // a fixed step.
  drawTracked(ctx, "THE  HIDEAWAY", PAD + 60, PAD + 42, 6);

  ctx.fillStyle = INK_MID;
  ctx.font = `700 24px ${FONT_MONO}`;
  ctx.textAlign = "right";
  drawTracked(ctx, "ADMIT  ONE", innerR, PAD + 42, 6, "right");

  // Hairline rule below the top rail (Vignelli-grade discipline).
  ctx.strokeStyle = "rgba(20,16,12,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + 84);
  ctx.lineTo(innerR, PAD + 84);
  ctx.stroke();

  // ── Editorial date block ────────────────────────────────────────────
  // Day numerals as the body's visual anchor — bold but not so dramatic
  // it dwarfs the labels beside it.
  ctx.fillStyle = INK;
  ctx.font = `200 240px ${FONT_SANS}`;
  ctx.textAlign = "left";
  const dayStr = meta.day || "—";
  ctx.fillText(dayStr, PAD - 4, 440);

  // Month / day-of-week / year in a tight mono-caps grid to the right
  // of the day numerals, anchored to their measured width.
  const dayWidth = ctx.measureText(dayStr).width;
  const gridX = PAD - 4 + dayWidth + 36;

  ctx.fillStyle = INK_MID;
  ctx.font = `700 36px ${FONT_MONO}`;
  drawTracked(ctx, meta.monthCaps, gridX, 270, 6);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${FONT_MONO}`;
  drawTracked(ctx, meta.dowCaps, gridX, 308, 6);

  ctx.fillStyle = INK_MID;
  ctx.font = `400 48px ${FONT_MONO}`;
  ctx.fillText(meta.year || "", gridX, 396);

  // ── Event name — light sans, the calmest line on the card ───────────
  // Italic serif looked decorative at full res but fell apart after the
  // texture downsamples onto the mesh; switching to a light sans keeps
  // crisp edges at any rendered size.
  ctx.fillStyle = INK;
  ctx.font = `300 64px ${FONT_SANS}`;
  wrapText(ctx, input.eventName, PAD, 600, innerR - PAD, 76, 2);

  // ── Foot strip: time · venue, with a hairline rule above ────────────
  ctx.strokeStyle = "rgba(20,16,12,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD - 60);
  ctx.lineTo(innerR, H - PAD - 60);
  ctx.stroke();

  ctx.fillStyle = INK_MID;
  ctx.font = `700 28px ${FONT_MONO}`;
  ctx.textAlign = "left";
  // Drop the time segment when it's empty (no real time on the event)
  // so we don't print a bare "·" floating in front of the venue.
  const venue = (input.location ?? "VENUE").toUpperCase();
  const footLine = meta.timeCaps
    ? `${meta.timeCaps}    ·    ${venue}`
    : venue;
  drawTracked(ctx, footLine, PAD, H - PAD - 18, 6);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 22px ${FONT_MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("hideawayseoul.com", innerR, H - PAD - 18);
}

function drawStubFront(
  ctx: CanvasRenderingContext2D,
  ticketNumber: number | null
): void {
  const stubW = W - STUB_X;
  const cx = STUB_X + stubW / 2;
  const num = String(ticketNumber ?? 0).padStart(4, "0");

  ctx.textBaseline = "alphabetic";

  // Top label.
  ctx.fillStyle = INK_MID;
  ctx.font = `700 26px ${FONT_MONO}`;
  ctx.textAlign = "center";
  drawTracked(ctx, "TICKET  No.", cx, PAD + 56, 6, "center");

  // Hairline below the label.
  ctx.strokeStyle = "rgba(20,16,12,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(STUB_X + 64, PAD + 84);
  ctx.lineTo(W - PAD, PAD + 84);
  ctx.stroke();

  // Stub serial — sized to fit the stub width with a comfortable margin
  // on either side. 0004 at 320px mono overflowed the 720px stub; we
  // measure and scale so any 4-digit number reads as the stub anchor
  // without colliding with the perforation or outer frame.
  const maxNumWidth = stubW - 96;
  let numFontSize = 220;
  ctx.font = `200 ${numFontSize}px ${FONT_MONO}`;
  while (ctx.measureText(num).width > maxNumWidth && numFontSize > 80) {
    numFontSize -= 8;
    ctx.font = `200 ${numFontSize}px ${FONT_MONO}`;
  }
  ctx.fillStyle = INK;
  ctx.fillText(num, cx, H / 2 + numFontSize / 2 - 16);

  // Foot rule + ADMIT ONE caps along the bottom.
  ctx.strokeStyle = "rgba(20,16,12,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(STUB_X + 64, H - PAD - 60);
  ctx.lineTo(W - PAD, H - PAD - 60);
  ctx.stroke();

  ctx.fillStyle = INK_MID;
  ctx.font = `700 26px ${FONT_MONO}`;
  drawTracked(ctx, "ADMIT  ONE", cx, H - PAD - 18, 6, "center");

  ctx.textAlign = "left";
}

// ── Back face ─────────────────────────────────────────────────────────────

function drawBodyBack(
  ctx: CanvasRenderingContext2D,
  input: TicketTextureInput
): void {
  const innerR = STUB_X - 56;
  const cx = (PAD + innerR) / 2;

  ctx.textBaseline = "alphabetic";

  // Wordmark up top.
  ctx.fillStyle = INK_MID;
  ctx.font = `600 24px ${FONT_MONO}`;
  ctx.textAlign = "left";
  drawTracked(ctx, "THE  HIDEAWAY", PAD, PAD + 48, 6);

  // Single huge ghost monogram — identity, no data.
  ctx.fillStyle = INK_GHOST;
  ctx.font = `300 720px ${FONT_SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("H", cx, H / 2 + 240);

  // Boilerplate at the foot.
  const lines = [
    "THIS TICKET ADMITS ONE.",
    "NON-TRANSFERABLE ONCE ACTIVATED.",
    "PRESENT THE QR ON YOUR ACCOUNT AT THE DOOR."
  ];
  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    drawTracked(ctx, line, PAD, H - PAD - 48 + (i - lines.length + 1) * 32, 4);
  });

  // Hairline above the boilerplate.
  ctx.strokeStyle = "rgba(20,16,12,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD - 144);
  ctx.lineTo(innerR, H - PAD - 144);
  ctx.stroke();

  // Tiny event echo above the boilerplate.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 22px ${FONT_MONO}`;
  drawTracked(ctx, input.eventName.toUpperCase(), PAD, H - PAD - 168, 4);
}

function drawStubBack(
  ctx: CanvasRenderingContext2D,
  ticketNumber: number | null
): void {
  const stubW = W - STUB_X;
  const cx = STUB_X + stubW / 2;
  const num = String(ticketNumber ?? 0).padStart(4, "0");

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";

  // ADMIT ONE / · / NO. xxxx / · / ADMIT ONE rhythm down the stub.
  ctx.fillStyle = INK_MID;
  ctx.font = `700 24px ${FONT_MONO}`;
  drawTracked(ctx, "ADMIT  ONE", cx, PAD + 56, 6, "center");
  ctx.fillText("·", cx, PAD + 92);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 28px ${FONT_MONO}`;
  drawTracked(ctx, "No.", cx, H / 2 - 60, 4, "center");

  ctx.fillStyle = INK;
  ctx.font = `200 130px ${FONT_MONO}`;
  ctx.fillText(num, cx, H / 2 + 40);

  ctx.fillStyle = INK_MID;
  ctx.font = `700 24px ${FONT_MONO}`;
  ctx.fillText("·", cx, H - PAD - 92);
  drawTracked(ctx, "ADMIT  ONE", cx, H - PAD - 18, 6, "center");

  ctx.textAlign = "left";
}

// ── Helpers ───────────────────────────────────────────────────────────────

interface DateMeta {
  day: string;
  monthCaps: string;
  dowCaps: string;
  year: string;
  timeCaps: string;
}

/**
 * Take a string like "Thursday, May 7, 2026" or "May 7, 2026" and split
 * it into individually-styleable pieces. Falls back gracefully if the
 * input doesn't match.
 *
 * Time is suppressed when the parsed value lands on midnight (00:00) —
 * that's the default when an event was configured with a date but no
 * time, and "12:00 AM" reads like wrong data on a printed ticket.
 */
function parseDate(d: string | null): DateMeta {
  if (!d) {
    return { day: "—", monthCaps: "", dowCaps: "", year: "", timeCaps: "" };
  }
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate());
    const month = parsed
      .toLocaleString("en-US", { month: "long" })
      .toUpperCase();
    const dow = parsed
      .toLocaleString("en-US", { weekday: "long" })
      .toUpperCase();
    const year = String(parsed.getFullYear());
    const isMidnight =
      parsed.getHours() === 0 && parsed.getMinutes() === 0;
    const time = isMidnight
      ? ""
      : parsed
          .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          .toUpperCase()
          .replace(/\s+/g, " ");
    return { day, monthCaps: month, dowCaps: dow, year, timeCaps: time };
  }
  return {
    day: d.toUpperCase(),
    monthCaps: "",
    dowCaps: "",
    year: "",
    timeCaps: ""
  };
}

/**
 * Draw text with manual letter-spacing. Canvas2D `letterSpacing` is
 * inconsistently supported across browsers; this draws each character at
 * a measured offset so spacing is reliable. `align` lets us anchor at
 * left, right, or centre (for caps that need to feel evenly distributed).
 */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "right" | "center" = "left"
): void {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);

  let cursor: number;
  if (align === "right") cursor = x - total;
  else if (align === "center") cursor = x - total / 2;
  else cursor = x;

  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor, y);
    cursor += widths[i] + spacing;
  }
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

/**
 * Roughness map — paired with the colour texture. White = rough,
 * black = smooth (three.js convention). Body moderately rough so the
 * printed type reads cleanly head-on; borders, stub, and the perforation
 * seam smoother so iridescence concentrates there as the card rotates.
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

  ctx.fillStyle = "#b4b4b4";
  ctx.fillRect(0, 0, W, H);

  const stubGrad = ctx.createLinearGradient(STUB_X, 0, W, 0);
  stubGrad.addColorStop(0, "#7a7a7a");
  stubGrad.addColorStop(1, "#5a5a5a");
  ctx.fillStyle = stubGrad;
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 40;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "rgba(60,60,60,0.5)";
  ctx.lineWidth = 90;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  const seam = ctx.createLinearGradient(STUB_X - 50, 0, STUB_X + 50, 0);
  seam.addColorStop(0, "rgba(60,60,60,0)");
  seam.addColorStop(0.5, "rgba(60,60,60,0.85)");
  seam.addColorStop(1, "rgba(60,60,60,0)");
  ctx.fillStyle = seam;
  ctx.fillRect(STUB_X - 50, 0, 100, H);

  for (let i = 0; i < 6000; i++) {
    const v = 140 + Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgba(${v},${v},${v},0.05)`;
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
