"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthView as AuthCard } from "@/components/auth";
import { ConsentGate } from "@/components/UX/Consent/ConsentGate";
import { VGradientModule } from "@/components/UX/Gradient/Gradient_M";
import { Suspense } from "react";

export default function Page() {
  return (
    <AuthShell
      slug={["sign-up"]}
      width="md"
      backdrop={
        <Suspense>
          <VGradientModule />
        </Suspense>
      }
    >
      <ConsentGate>
        <AuthCard view="SIGN_UP" redirectTo="/me" />
      </ConsentGate>
    </AuthShell>
  );
}
