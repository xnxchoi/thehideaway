import { redirect } from "next/navigation";

/**
 * Retired route. Subscriptions + billing are administrative concerns,
 * folded into Account. A standalone Subscriptions page added a hop the
 * user didn't need — same fields, same surface, simpler tree.
 */
export default function SubscriptionsRedirectPage() {
  redirect("/me/settings/account");
}
