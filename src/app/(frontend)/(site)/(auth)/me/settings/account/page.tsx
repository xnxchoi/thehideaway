import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import AccountSectionClient from "./page.client";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Account · Settings" };

export default function AccountSettingsPage() {
  return (
    <Suspense>
      <AccountSettingsBody />
    </Suspense>
  );
}

async function AccountSettingsBody() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/account");
  return <AccountSectionClient user={user} />;
}
