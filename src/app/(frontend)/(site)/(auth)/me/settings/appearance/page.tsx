import { currentUser } from "@/lib/auth/context/get-context-props";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppearanceSectionClient from "./page.client";
import { RPage } from "@/components/UX/Transition";

export const metadata: Metadata = { title: "Appearance · Settings" };

export default async function AppearanceSettingsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in?next=/me/settings/appearance");
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "ko") || "en";
  return <AppearanceSectionClient locale={locale} />;
}
