import type { ReactNode } from "react";
/**
 * Route-group layout for `/day-n-night/*`.
 *
 * The public landing is now intentionally open. Ticket purchase keeps its
 * own passcode gate inside `/tickets/[event]`, but the story surface no
 * longer blocks entry behind the shared event password.
 */
export default function DayNNightLayout({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
