import { RPage } from "@/components/UX/Transition";
import { Metadata } from "next";
import RadioClient from "@/app/(frontend)/(site)/(pages)/radio/page.client";

export const metadata: Metadata = {
  title: "Radio — The Hideaway",
  description: "Listen to The Hideaway Sessions"
};

export default function RadioPage() {
  return (
    <RPage slug={["radio"]} type={"pages"}>
      <RadioClient />
    </RPage>
  );
}
