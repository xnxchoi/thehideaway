import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostProductBySlug } from "@/lib/lost-commerce/queries";
import { LostProductDetailClient } from "./product.client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLostProductBySlug(slug).catch(() => null);
  return {
    title: product ? `${product.name} — LOSTINSEOUL` : "LOSTINSEOUL",
    description: product?.summary ?? "LOSTINSEOUL product detail."
  };
}

export default async function LostProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getLostProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "products", slug]} type="pages">
      <LostProductDetailClient
        product={product}
        labels={{
          back: t("nav.back"),
          cart: t("nav.cart"),
          standard: t("modes.standard"),
          request: t("modes.request"),
          private: t("modes.private"),
          add: t("actions.add"),
          requestQuote: t("actions.requestQuote"),
          added: t("actions.added"),
          campaign: t("product.campaign"),
          progress: t("product.progress"),
          details: t("product.details"),
          care: t("product.care"),
          shipping: t("product.shipping"),
          privateQuote: t("product.privateQuote")
        }}
      />
    </RPage>
  );
}
