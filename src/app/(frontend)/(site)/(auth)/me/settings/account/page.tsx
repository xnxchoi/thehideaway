import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@/payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import AccountSectionClient from "./page.client";

export const metadata: Metadata = { title: "Account · Settings" };

export default async function AccountSettingsPage() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/account");
  return <AccountSectionClient user={user} />;
}
