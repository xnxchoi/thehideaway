"use client";
import { RPage } from "@/components/UX/Transition";
import { SplitSection } from "@/components/sections/split-section/SplitSection";
import { Lanyard } from "@/components/layouts/Registration/lanyard";
import { RegistrationTour } from "@/components/UX/Tour/RegistrationTour";

export default function OnboardingPage() {
  return (
    <RPage
      key={"pages_onboarding"}
      type="account"
      slug={["onboarding"]}
      theme={"dark"}
    >
      <RegistrationTour />
    </RPage>
  );
}
