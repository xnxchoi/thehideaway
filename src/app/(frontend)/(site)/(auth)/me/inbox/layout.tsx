import { currentUser } from "@/lib/auth/context/get-context-props";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Auth gate only. `NotificationProvider` is mounted globally in
 * `src/providers/index.tsx`, so the inbox tree can call
 * `useNotifications()` without an additional wrapper here.
 */
export default async function NotificationsLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) return redirect("/");
  return <>{children}</>;
}
