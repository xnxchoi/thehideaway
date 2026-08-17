import { redirect } from "next/navigation";

/**
 * Membership checkout is intentionally disconnected from the commerce
 * baseline. Keep this route as a stable reconnectable seam until membership
 * commerce is designed against the new minimal order system.
 */
export default function CheckoutPage() {
  redirect("/plans");
}
