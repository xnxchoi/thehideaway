import { currentUser } from "@/lib/auth/context/get-context-props";
import type { User } from "@payload-types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileSectionClient from "./page.client";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Profile · Settings" };

export default function ProfileSettingsPage() {
  return (
    <Suspense>
      <ProfileSettingsBody />
    </Suspense>
  );
}

async function ProfileSettingsBody() {
  const user = (await currentUser()) as User | null;
  if (!user) return redirect("/sign-in?next=/me/settings/profile");
  return <ProfileSectionClient user={user} />;
}
