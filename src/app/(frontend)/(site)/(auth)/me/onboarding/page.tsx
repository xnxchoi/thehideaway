"use client";
import { RPage } from "@/components/UX/Transition";
import { Suspense } from "react";
import PageClient from "./page.client";
export default function OnboardingPage() {
  return (
    <RPage
      key={"pages_onboarding"}
      type="account"
      slug={["onboarding"]}
      theme={"dark"}
    >
      <Suspense fallback={null}>
        <PageClient />
      </Suspense>
    </RPage>
  );
}
