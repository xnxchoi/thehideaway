import { Instrument_Serif, JetBrains_Mono } from "next/font/google";

/**
 * Display serif for the ticket's editorial moments — event name, date,
 * holder name, large serial. Instrument Serif is a high-contrast
 * Bodoni-adjacent display face that holds up at large sizes (the kind
 * of face that makes a ticket feel set rather than typed). Already
 * used elsewhere in the project for the Invoice component.
 */
export const ticketSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ticket-serif"
});

/**
 * Real mono replaces the system mono fallback chain. Two reasons:
 * 1. System mono (Menlo / Consolas / Liberation Mono) renders
 *    differently for every visitor — three different ticket
 *    personalities for three buyers.
 * 2. JetBrains Mono has the carved character that mono labels need
 *    on a luxury artifact; system mono looks utility-grade.
 */
export const ticketMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ticket-mono"
});

export const ticketFontVariables = `${ticketSerif.variable} ${ticketMono.variable}`;
