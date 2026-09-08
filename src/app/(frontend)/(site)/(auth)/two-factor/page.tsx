"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { TwoFactorCard } from "@/components/auth/TwoFactorCard";

export default function Page() {
  return (
    <AuthShell slug={["two-factor"]}>
      <TwoFactorCard mode="totp" />
    </AuthShell>
  );
}
