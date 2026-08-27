import { NotificationCenter } from "@/components/UX/Notifications/NotificationCenter";
import { currentUser } from "@/lib/auth/context/get-context-props";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageClient from "./page.client";

export default function NotificationsPage() {
  return (
    <Suspense>
      <InboxBody />
    </Suspense>
  );
}

async function InboxBody() {
  const user = await currentUser();
  if (!user) return redirect("/auth/sign-in");
  return (
    <PageClient>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                  Your Account
                </p>
                <h1 className="mt-0.5 text-2xl font-light tracking-tight xl:text-3xl">
                  Inbox
                </h1>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-6 py-6 xl:px-10 xl:py-8">
          <NotificationCenter className="w-full" />
        </div>
      </div>
    </PageClient>
  );
}
