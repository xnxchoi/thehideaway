import { redirect } from "next/navigation";

/**
 * Retired route. OAuth providers + passkeys are now folded into Security
 * — they protect the credential, so they belong with 2FA / sessions /
 * danger zone, not as a standalone "Connected" surface.
 */
export default function ConnectedRedirectPage() {
  redirect("/me/settings/security");
}
