import { currentUser } from "@/lib/auth/context/get-context-props";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import AppearanceSectionClient from "./page.client";

export const metadata: Metadata = { title: "Appearance · Settings" };

export default async function AppearanceSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/appearance");
  return <AppearanceSectionClient />;
}
