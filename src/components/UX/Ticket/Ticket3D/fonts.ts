import { Playfair_Display, Inter, Noto_Serif_KR } from "next/font/google";

/**
 * Display serif for the editorial moments on the ticket — day numerals,
 * event name, the foil serial. Playfair Display has the high-contrast
 * stress and ball terminals of a transitional like Didot/Bodoni without
 * being so brittle it falls apart after the canvas texture downsamples
 * onto the mesh.
 */
export const ticketSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ticket-serif"
});

/**
 * Grotesque for the disciplined caps + mono-flavoured labels. Inter has
 * the construction needed for tracked caps to read at small sizes after
 * downsampling. We use the variable axis at 500/700 so the labels stay
 * sharp even when the canvas baking renders at 1× pixel ratio.
 */
export const ticketSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ticket-sans"
});

/**
 * Korean serif for the hanko stamp glyphs (입장 = admission). Noto Serif
 * KR's strokes carry the carved/seal-script feel; Noto Sans KR (which we
 * had previously) reads as generic UI Korean — wrong for a stamp.
 */
export const ticketKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  variable: "--font-ticket-kr"
});

/**
 * Single string aggregating the three font variables so a layout/page
 * can apply them in one className.
 */
export const ticketFontVariables = `${ticketSerif.variable} ${ticketSans.variable} ${ticketKR.variable}`;
