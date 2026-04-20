import {currentUser} from "@/lib/auth/context/get-context-props";
import { NotificationProvider } from "@/providers/Notifications";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function NotificationsLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  if (!user) return redirect("/");
  return <NotificationProvider user={user.id}>{children}</NotificationProvider>;
}
