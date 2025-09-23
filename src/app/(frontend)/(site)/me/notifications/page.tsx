import { NotificationTable } from "@/components/UX/Notifications/NotificationTable";
import { currentUser } from "@/lib/auth/context/servers";
import { redirect } from "next/navigation";
import PageClient from "./page.client";

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) return redirect("/auth/sign-in");
  return (
    <PageClient>
      <div
        className={
          "flex h-full min-h-screen w-screen flex-col justify-center p-14"
        }
      >
        <NotificationTable />
      </div>
    </PageClient>
  );
}
