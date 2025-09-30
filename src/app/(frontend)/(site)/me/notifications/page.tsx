import { NotificationCenter } from "@/components/UX/Notifications/NotificationCenter";
import { currentUser } from "@/lib/auth/context/servers";
import { redirect } from "next/navigation";
import PageClient from "./page.client";

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) return redirect("/auth/sign-in");
  return (
    <PageClient>
      <div className="flex h-full min-h-screen w-full">
        <NotificationCenter className="w-full" />
      </div>
    </PageClient>
  );
}
