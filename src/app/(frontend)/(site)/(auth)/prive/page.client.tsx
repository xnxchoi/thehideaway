"use client";
import { useAuthenticate } from "@/lib/auth/betterauth-ui/src";
import AccountSwitcher from "@/components/UX/account-switch";
import { UserCard } from "@/app/(frontend)/(site)/(auth)/prive/user-card";

export const PageClient = () => {
  useAuthenticate();
  return <></>;
};
