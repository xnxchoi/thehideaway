import { Playfair_Display } from "next/font/google";

/**
 * Display serif used by the TicketPaper seal monogram. Apply
 * `ticketFontVariables` as a className on a subtree that hosts
 * <TicketPaper /> so the `--font-ticket-serif` CSS variable resolves.
 */
export const ticketSerif = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ticket-serif"
});

export const ticketFontVariables = ticketSerif.variable;
