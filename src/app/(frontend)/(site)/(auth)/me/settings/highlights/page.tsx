import { redirect } from "next/navigation";

/**
 * Retired route. Highlights are content (your annotations across the
 * site), not configuration — they belong on a future library / activity
 * surface, not in Settings. The redirect points at the hub today; once
 * the activity surface ships it will retarget there.
 */
export default function HighlightsRedirectPage() {
  redirect("/me/settings");
}
