"use client";
import { useAuthenticate } from "@betterauth-ui";
import AccountSwitcher from "@/components/UX/account-switch";
import { UserCard } from "@/app/(frontend)/(site)/(auth)/me/settings/user-card";

export const PageClient = () => {
  useAuthenticate();
  return <></>;
};
