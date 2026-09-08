import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PolicyContent } from "@lostinseoul/components/policyContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LOSTINSEOUL.legal.pages.refund");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default function RefundPage() {
  return <PolicyContent kind="refund" />;
}
