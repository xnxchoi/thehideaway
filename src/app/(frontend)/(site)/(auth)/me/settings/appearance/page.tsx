import { redirect } from "next/navigation";

/**
 * Retired route. Theme + reduced-motion are interface preferences and
 * live under General now. The standalone "Appearance" page was a single
 * setting plus a read-only OS mirror — not enough weight for its own
 * surface.
 */
export default function AppearanceRedirectPage() {
  redirect("/me/settings/general");
}
