import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@/payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ConnectedSectionClient from "./page.client";

export const metadata: Metadata = { title: "Connected · Settings" };

export default async function ConnectedSettingsPage() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/connected");
  return <ConnectedSectionClient />;
}
