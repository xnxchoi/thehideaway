import * as THREE from "three";

export interface TicketTextureInput {
  eventName: string;
  ticketNumber: number | null;
  date: string | null;
  location: string | null;
}

// ── Geometry-anchored constants ──────────────────────────────────────────
//
// STUB_RATIO must match the geometry's normalised perforation x:
//   geometry: TICKET_W = 4.6, STUB_OFFSET = 0.6 (centred shape)
//   normalised u of perforation = (0.6 - (-2.3)) / 4.6 ≈ 0.63
const W = 2400;
const H = 1200;
const STUB_RATIO = 0.63;
const STUB_X = Math.round(W * STUB_RATIO);
const PAD = 96;

// ── Palette ───────────────────────────────────────────────────────────────
//
// "Stamp Vermilion" — bone paper, ink black, vermilion seal, champagne foil.
// Synthesised from research (Korean hanko / cinema ticket / letterpress) and
// the critic's pivot to a saturated commitment color. The whole card is
// disciplined ink-on-bone *except* the stamp, which is the iconic moment.
const PAPER_LIGHT = "#f5ecd6"; // bone, warm
const PAPER_DARK = "#e6dabd"; // bone, slightly oxidised at edges
const STUB_TINT = "rgba(20, 14, 8, 0.05)";

// Letterpress bite — pull ink density up so type doesn't read gauzy.
const INK = "rgba(14, 9, 6, 0.99)";
const INK_MID = "rgba(14, 9, 6, 0.78)";
const INK_SOFT = "rgba(14, 9, 6, 0.55)";
const INK_GHOST = "rgba(14, 9, 6, 0.16)";
const INK_HAIR = "rgba(14, 9, 6, 0.34)";
const PAPER_GRAIN = "rgba(40, 24, 12, 0.06)";

// Vermilion — Korean inkan / Japanese hanko ink, oxidised at the rim so
// it reads as actual stamp impression rather than a vector fill.
const STAMP_RED = "rgba(196, 48, 32, 0.95)";
const STAMP_RED_DEEP = "rgba(140, 22, 14, 0.99)";
const STAMP_RED_SOFT = "rgba(196, 48, 32, 0.6)";
const STAMP_RED_BLOOM = "rgba(196, 48, 32, 0.18)";

// Champagne foil — H monogram and serial digits. The foil *mesh layer*
// (separate from this colour bake) lifts these zones into anisotropic
// metallic shimmer. The colour bake here is the underlying tone.
const FOIL_GOLD = "rgba(202, 162, 96, 0.96)";
const FOIL_GOLD_MID = "rgba(202, 162, 96, 0.7)";

// CSS variables wired up in components/UX/Ticket/Ticket3D/fonts.ts via
// next/font/google. The ticket page applies the ticketFontVariables
// className to its subtree so canvas2D can resolve them. The fallback
// chain still ships system serifs so we don't catastrophically fail if
// the page using this texture forgot to apply the variables.
const FONT_SANS =
  "var(--font-ticket-sans), 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const FONT_SERIF =
  "var(--font-ticket-serif), 'Playfair Display', 'Didot', 'Bodoni 72', Georgia, serif";
const FONT_KR =
  "var(--font-ticket-kr), 'Noto Serif KR', 'Apple SD Gothic Neo', system-ui, sans-serif";

/**
 * Front of the ticket.
 *
 * Reference set:
 *   - Korean hanko / Japanese inkan ticket stamps (the vermilion seal as a
 *     cultural anchor, off-axis, oxidised, slightly imperfect).
 *   - Cereal magazine event collateral (light serif display + mono caps,
 *     generous margins, hairline grid, never decorative).
 *   - Massimo Vignelli's transit tickets (ruthless letter-spacing on caps).
 *   - Anders Bakken's Munch museum stubs (display numerals as the stub
 *     anchor, no competition).
 *
 * Layout:
 *   - Top rail: H monogram (foil) + THE HIDEAWAY wordmark + ADMIT ONE caps.
 *   - Editorial date block: massive serif day numerals + month/dow/year grid.
 *   - Vermilion stamp seal (signature visual moment) in the upper-right
 *     quadrant — Korean 입장 (admission) characters. Off-axis, oxidised.
 *   - Event name in light display serif italic — single calmest line.
 *   - Foot strip: TIME · VENUE caps with hairline rule above.
 *   - Hairline frame around the printable area.
 *
 * Stub: serial + ADMIT ONE only. No competition.
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
  drawStampSeal(ctx);

  return finalize(c);
}

/**
 * Back of the ticket. Quiet, identity-only — the mark + boilerplate + a
 * single secondary stamp echo. No data — the back doesn't compete with
 * the front for attention.
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
  // Bone base — warm, oxidised at edges. Diagonal gradient feels more
  // hand-laid than a centred radial.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, PAPER_LIGHT);
  bg.addColorStop(0.55, PAPER_LIGHT);
  bg.addColorStop(1, PAPER_DARK);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Edge oxidation — corners darker, suggests aged paper.
  const edge = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.4,
    W / 2,
    H / 2,
    H * 0.95
  );
  edge.addColorStop(0, "rgba(40, 24, 12, 0)");
  edge.addColorStop(1, "rgba(40, 24, 12, 0.18)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);

  // Paper grain — warm-toned dust.
  ctx.fillStyle = PAPER_GRAIN;
  for (let i = 0; i < 4200; i++) {
    const r = Math.random();
    ctx.globalAlpha = 0.4 + r * 0.6;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Stub tint — slightly more aged than the body, subtle shift in zones.
  ctx.fillStyle = STUB_TINT;
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  // Outer hairline frame — Vignelli discipline.
  ctx.strokeStyle = INK_HAIR;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
}

function drawPerforation(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(18,12,8,0.42)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(STUB_X, 40);
  ctx.lineTo(STUB_X, H - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(18,12,8,0.55)";
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

  // ── Top rail: H monogram (foil) + wordmark (left) + ADMIT ONE (right) ──
  // The H is the body's foil anchor. Bumped to 88px so it carries gravity
  // matching the seal — the previous 64px was timid corner ornament.
  ctx.fillStyle = FOIL_GOLD;
  ctx.font = `400 92px ${FONT_SERIF}`;
  ctx.textAlign = "left";
  ctx.fillText("H", PAD, PAD + 78);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 22px ${FONT_MONO}`;
  drawTracked(ctx, "THE  HIDEAWAY", PAD + 90, PAD + 50, 6);

  ctx.fillStyle = INK_MID;
  ctx.font = `700 24px ${FONT_MONO}`;
  ctx.textAlign = "right";
  drawTracked(ctx, "ADMIT  ONE", innerR, PAD + 50, 6, "right");

  // Hairline rule below the top rail.
  ctx.strokeStyle = INK_HAIR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + 108);
  ctx.lineTo(innerR, PAD + 108);
  ctx.stroke();

  // ── Editorial date block ───────────────────────────────────────────────
  // Day numerals in display serif (Playfair Display / Bodoni). The serif
  // is the romantic moment in an otherwise mono-caps disciplined card.
  ctx.fillStyle = INK;
  ctx.font = `300 280px ${FONT_SERIF}`;
  ctx.textAlign = "left";
  const dayStr = meta.day || "—";
  ctx.fillText(dayStr, PAD - 6, 460);

  // Month / day-of-week / year — mono caps, anchored beside the numerals.
  const dayWidth = ctx.measureText(dayStr).width;
  const gridX = PAD - 6 + dayWidth + 36;

  ctx.fillStyle = INK_MID;
  ctx.font = `700 36px ${FONT_MONO}`;
  drawTracked(ctx, meta.monthCaps, gridX, 280, 6);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${FONT_MONO}`;
  drawTracked(ctx, meta.dowCaps, gridX, 318, 6);

  ctx.fillStyle = INK_MID;
  ctx.font = `400 48px ${FONT_MONO}`;
  ctx.fillText(meta.year || "", gridX, 410);

  // Thin vermilion accent rule beneath the date numerals — a second
  // place for the brand red beyond the stamp. Doubles the chromatic
  // commitment on the front without becoming a "red ticket".
  ctx.strokeStyle = STAMP_RED;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD - 4, 478);
  ctx.lineTo(PAD - 4 + dayWidth, 478);
  ctx.stroke();

  // ── Event name — light display serif italic ───────────────────────────
  // The single italic line on the whole card. Typographic centrepiece.
  ctx.fillStyle = INK;
  ctx.font = `italic 300 78px ${FONT_SERIF}`;
  wrapText(ctx, input.eventName, PAD, 660, innerR - PAD, 92, 2);

  // Bilingual eyebrow — Korean 입장권 (admission ticket) paired with the
  // English equivalent in tracked mono caps. The Hideaway is bilingual
  // by mandate; the body now declares both languages, not just the seal.
  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${FONT_KR}`;
  ctx.textAlign = "left";
  ctx.fillText("입장권", PAD, 818);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 18px ${FONT_MONO}`;
  drawTracked(ctx, "·   ADMISSION  TICKET", PAD + 76, 816, 4);

  // ── Foot strip: time · venue ──────────────────────────────────────────
  ctx.strokeStyle = INK_HAIR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD - 60);
  ctx.lineTo(innerR, H - PAD - 60);
  ctx.stroke();

  ctx.fillStyle = INK_MID;
  ctx.font = `700 28px ${FONT_MONO}`;
  ctx.textAlign = "left";
  const venue = (input.location ?? "VENUE").toUpperCase();
  const footLine = meta.timeCaps ? `${meta.timeCaps}    ·    ${venue}` : venue;
  drawTracked(ctx, footLine, PAD, H - PAD - 18, 6);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 22px ${FONT_MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("hideawayseoul.com", innerR, H - PAD - 18);
}

/**
 * Vermilion stamp seal — the signature cultural anchor.
 *
 * A real hanko/inkan never prints a perfect circle. Tradition: carved
 * stone, oxidised vermilion ink, paper fibres absorbing unevenly. We
 * synthesize that with:
 *
 *   1. **Irregular silhouette** — the outer ring is drawn as a closed
 *      polyline with 64 vertices, each radially displaced by a layered
 *      sine "noise" function. The ring is filled, not stroked, so the
 *      rim has true thickness variance.
 *   2. **Ink-pool rim** — a radial gradient inside the ring goes from
 *      lighter at centre to deeper at the rim (real ink pools outward as
 *      the stamp dwells on paper). The classic CAD-stamp look had it
 *      backwards (uniform fill).
 *   3. **Paper-fibre mask** — random bone-coloured dabs in `destination-out`
 *      eat the ink at the right scale to read as fibre absorption. We use
 *      hundreds of small dabs, not 80 large ones, so it reads as texture
 *      not as drop-out spots.
 *   4. **Bloom** — a soft red halo bleeding past the silhouette suggests
 *      ink wicking into the fibre, sized so it's visible at typical
 *      screen scale.
 *
 * Bigger and more dramatic than v1 — this is the iconic moment, sized to
 * compete with the day numerals as the eye's second anchor.
 */
function drawStampSeal(ctx: CanvasRenderingContext2D): void {
  // Anchor the stamp to clip across the event-name baseline (~y=660-720) —
  // a real hanko is applied *over* the printed type, not floated beside it
  // in dead space. Off to the right so it overlaps the second line of the
  // event name without obliterating it.
  const cx = STUB_X - 220;
  const cy = 700;
  const rOuter = 168;
  const rInner = rOuter - 26;
  const rRingInner = rInner - 8;
  const rotation = -0.07;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // ── 1. Outer bloom (drawn first so it sits below ink) ────────────────
  const bloom = ctx.createRadialGradient(
    0,
    0,
    rOuter * 0.85,
    0,
    0,
    rOuter * 1.55
  );
  bloom.addColorStop(0, "rgba(196, 48, 32, 0)");
  bloom.addColorStop(0.5, STAMP_RED_BLOOM);
  bloom.addColorStop(1, "rgba(196, 48, 32, 0)");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // ── 2. Irregular ring silhouette (filled annulus) ─────────────────────
  // Radial-displace 64 verts on the outer + inner ring to create a
  // hand-cut stone outline.
  const verts = 96;
  const noise = (a: number, scale: number, seed: number): number =>
    Math.sin(a * 5 + seed) * 0.35 +
    Math.sin(a * 11 + seed * 1.7) * 0.18 +
    Math.sin(a * 23 + seed * 2.3) * 0.08;

  ctx.fillStyle = STAMP_RED_DEEP;
  ctx.beginPath();
  for (let i = 0; i <= verts; i++) {
    const t = (i / verts) * Math.PI * 2;
    const r = rOuter + noise(t, 1, 0.7) * 5;
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = verts; i >= 0; i--) {
    const t = (i / verts) * Math.PI * 2;
    const r = rInner + noise(t, 1, 1.3) * 4;
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // ── 3. Ink-pool gradient on the ring ──────────────────────────────────
  // Wash a radial gradient over the ring that's lighter at centre and
  // deeper at the rim — emulating ink pooling outward.
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= verts; i++) {
    const t = (i / verts) * Math.PI * 2;
    const r = rOuter + noise(t, 1, 0.7) * 5;
    const x = Math.cos(t) * r;
    const y = Math.sin(t) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.clip();
  const pool = ctx.createRadialGradient(0, 0, rInner - 6, 0, 0, rOuter + 4);
  pool.addColorStop(0, "rgba(196, 48, 32, 0)");
  pool.addColorStop(0.6, "rgba(196, 48, 32, 0)");
  pool.addColorStop(1, "rgba(60, 8, 4, 0.45)");
  ctx.fillStyle = pool;
  ctx.fillRect(
    -rOuter - 20,
    -rOuter - 20,
    (rOuter + 20) * 2,
    (rOuter + 20) * 2
  );
  ctx.restore();

  // ── 4. Korean 입장 (admission) — Noto Serif KR for carved feel ───────
  ctx.fillStyle = STAMP_RED_DEEP;
  ctx.font = `900 96px ${FONT_KR}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("입", 0, -46);
  ctx.fillText("장", 0, 50);

  // ── 5. Paper-fibre mask — many small dabs in destination-out ─────────
  // Concentrated near the ring (where fibre absorption is most visible)
  // and a sparser pass over the glyphs.
  ctx.globalCompositeOperation = "destination-out";

  // Ring fibre dabs.
  for (let i = 0; i < 320; i++) {
    const a = Math.random() * Math.PI * 2;
    // Bias toward the ring annulus.
    const along =
      rRingInner + (rOuter - rRingInner) * (0.2 + Math.random() * 0.95);
    const px = Math.cos(a) * along;
    const py = Math.sin(a) * along;
    ctx.globalAlpha = 0.1 + Math.random() * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, 0.8 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Glyph fibre dabs.
  for (let i = 0; i < 240; i++) {
    const px = (Math.random() * 2 - 1) * (rRingInner * 0.85);
    const py = (Math.random() * 2 - 1) * (rRingInner * 0.85);
    ctx.globalAlpha = 0.08 + Math.random() * 0.22;
    ctx.beginPath();
    ctx.arc(px, py, 0.6 + Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Edge breaks — a few larger missing chunks on the rim.
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const px = Math.cos(a) * (rOuter - 4);
    const py = Math.sin(a) * (rOuter - 4);
    ctx.globalAlpha = 0.4 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, 3 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  ctx.restore();
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

  ctx.strokeStyle = INK_HAIR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(STUB_X + 64, PAD + 84);
  ctx.lineTo(W - PAD, PAD + 84);
  ctx.stroke();

  // Stub serial — drawn in champagne foil. The foil mesh layer overlays
  // this in spec-shimmer to lift it from "gold ink" to "actual foil".
  // Auto-shrink so any 4-6 digit number reads as the stub anchor.
  const maxNumWidth = stubW - 80;
  let numFontSize = 240;
  ctx.font = `300 ${numFontSize}px ${FONT_SERIF}`;
  while (ctx.measureText(num).width > maxNumWidth && numFontSize > 80) {
    numFontSize -= 8;
    ctx.font = `300 ${numFontSize}px ${FONT_SERIF}`;
  }
  // Single foil pass — the foil mesh layer above this carries the actual
  // specular shimmer; doubling here would smear the alpha-mask on that
  // mesh and dull the metallic effect.
  ctx.fillStyle = FOIL_GOLD;
  ctx.fillText(num, cx, H / 2 + numFontSize / 2 - 16);

  // Foot rule + ADMIT ONE caps.
  ctx.strokeStyle = INK_HAIR;
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

  ctx.fillStyle = INK_MID;
  ctx.font = `600 24px ${FONT_MONO}`;
  ctx.textAlign = "left";
  drawTracked(ctx, "THE  HIDEAWAY", PAD, PAD + 48, 6);

  // Single huge ghost monogram — identity, no data.
  ctx.fillStyle = INK_GHOST;
  ctx.font = `300 720px ${FONT_SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText("H", cx, H / 2 + 240);

  // Echo of the stamp on the back — much smaller, ghosted, tucked low.
  ctx.save();
  ctx.translate(PAD + 90, H - PAD - 220);
  ctx.rotate(0.06);
  ctx.strokeStyle = STAMP_RED_SOFT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = STAMP_RED_SOFT;
  ctx.font = `700 32px ${FONT_KR}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("입", 0, -16);
  ctx.fillText("장", 0, 16);
  ctx.restore();

  // Boilerplate.
  const lines = [
    "THIS TICKET ADMITS ONE.",
    "NON-TRANSFERABLE ONCE ACTIVATED.",
    "PRESENT THE QR ON YOUR ACCOUNT AT THE DOOR."
  ];
  ctx.fillStyle = INK_SOFT;
  ctx.font = `500 22px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, i) => {
    drawTracked(ctx, line, PAD, H - PAD - 48 + (i - lines.length + 1) * 32, 4);
  });

  ctx.strokeStyle = INK_HAIR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, H - PAD - 144);
  ctx.lineTo(innerR, H - PAD - 144);
  ctx.stroke();

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

  ctx.fillStyle = INK_MID;
  ctx.font = `700 24px ${FONT_MONO}`;
  drawTracked(ctx, "ADMIT  ONE", cx, PAD + 56, 6, "center");
  ctx.fillText("·", cx, PAD + 92);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `600 28px ${FONT_MONO}`;
  drawTracked(ctx, "No.", cx, H / 2 - 60, 4, "center");

  ctx.fillStyle = FOIL_GOLD;
  ctx.font = `300 130px ${FONT_SERIF}`;
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
    const isMidnight = parsed.getHours() === 0 && parsed.getMinutes() === 0;
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
 * Foil alpha mask — used by the separate foil mesh layer in TicketMesh.
 *
 * White = foil, black = paper. The foil mesh sits a hair above the
 * front face plane with an anisotropic metallic material; the alpha
 * mask cuts the metallic to *only* the H monogram (top-left) and the
 * serial digits (stub centre). That's the difference between "drawn
 * gold ink" and "actual specular foil that streaks under raking light".
 */
export function makeTicketFoilMask(input: TicketTextureInput): THREE.Texture {
  if (typeof document === "undefined") {
    return new THREE.Texture();
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture();

  // Black canvas — everywhere else is paper.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // ── H monogram, top-left (matches drawBodyFront at 92px / y+78) ──────
  ctx.fillStyle = "#fff";
  ctx.font = `400 92px ${FONT_SERIF}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("H", PAD, PAD + 78);

  // ── Stub serial — same size logic as drawStubFront ───────────────────
  const stubW = W - STUB_X;
  const cx = STUB_X + stubW / 2;
  const num = String(input.ticketNumber ?? 0).padStart(4, "0");
  const maxNumWidth = stubW - 80;
  let numFontSize = 240;
  ctx.font = `300 ${numFontSize}px ${FONT_SERIF}`;
  while (ctx.measureText(num).width > maxNumWidth && numFontSize > 80) {
    numFontSize -= 8;
    ctx.font = `300 ${numFontSize}px ${FONT_SERIF}`;
  }
  ctx.textAlign = "center";
  ctx.fillText(num, cx, H / 2 + numFontSize / 2 - 16);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Roughness map.
 *
 * Three.js convention: white = rough, black = smooth.
 * - Body: warm-paper rough so ink reads cleanly head-on.
 * - Foil zones (H monogram, serial): pulled toward smooth so the foil
 *   layer's anisotropic shimmer concentrates on those marks.
 * - Stamp: matte (rough) — ink doesn't shine.
 * - Edges + perforation seam: smoother so light catches the contour.
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

  // Base — moderately rough paper.
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(0, 0, W, H);

  // Stub — slightly smoother than body so the foil serial pops.
  const stubGrad = ctx.createLinearGradient(STUB_X, 0, W, 0);
  stubGrad.addColorStop(0, "#7a7a7a");
  stubGrad.addColorStop(1, "#4a4a4a");
  ctx.fillStyle = stubGrad;
  ctx.fillRect(STUB_X, 0, W - STUB_X, H);

  // Edge bevel — smoother edges catch contour light.
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 40;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "rgba(60,60,60,0.5)";
  ctx.lineWidth = 90;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Perforation seam — smooth so light grazes the spine.
  const seam = ctx.createLinearGradient(STUB_X - 50, 0, STUB_X + 50, 0);
  seam.addColorStop(0, "rgba(60,60,60,0)");
  seam.addColorStop(0.5, "rgba(50,50,50,0.85)");
  seam.addColorStop(1, "rgba(60,60,60,0)");
  ctx.fillStyle = seam;
  ctx.fillRect(STUB_X - 50, 0, 100, H);

  // Top-left foil monogram zone — pull to smooth.
  ctx.fillStyle = "rgba(40,40,40,0.7)";
  ctx.fillRect(PAD - 10, PAD - 10, 80, 80);

  // Stamp area — rough (ink). Slight ring of bumpiness.
  ctx.fillStyle = "rgba(180,180,180,0.4)";
  ctx.beginPath();
  ctx.arc(STUB_X - 240, 800, 140, 0, Math.PI * 2);
  ctx.fill();

  // Paper grain micro-variation.
  for (let i = 0; i < 6000; i++) {
    const v = 130 + Math.floor(Math.random() * 40);
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
