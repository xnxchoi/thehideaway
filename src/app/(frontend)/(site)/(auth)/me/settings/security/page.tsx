import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import SecuritySectionClient from "./page.client";

export const metadata: Metadata = { title: "Security · Settings" };

export default async function SecuritySettingsPage() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/security");
  return <SecuritySectionClient user={user} />;
}
