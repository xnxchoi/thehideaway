"use client";
import { useAuthenticate } from "@/lib/auth/useAuthenticate";

export const PageClient = () => {
  useAuthenticate();
  return <></>;
};
