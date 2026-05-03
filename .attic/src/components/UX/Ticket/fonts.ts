import { Playfair_Display } from "next/font/google";

/**
 * Display serif for the ticket artifact — used by `TicketPaper`'s seal
 * monogram. Playfair Display has the high-contrast stress of a
 * transitional (Didot/Bodoni family) without falling apart at small sizes.
 *
 * Apply `ticketFontVariables` as a className on any subtree that hosts a
 * `<TicketPaper />` so the `--font-ticket-serif` CSS variable resolves.
 */
export const ticketSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ticket-serif"
});

export const ticketFontVariables = ticketSerif.variable;
