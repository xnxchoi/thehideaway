import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import {
  getLostHomeData,
  getLostProductBySlug
} from "@/lib/lost-commerce/queries";
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
  const data = await getLostHomeData().catch(() => ({
    products: [],
    drops: []
  }));
  const relatedProducts = data.products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "products", slug]} type="pages">
      <LostProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        labels={{
          back: t("nav.back"),
          cart: t("nav.cart"),
          allProducts: t("home.products"),
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
          directPurchase: t("product.directPurchase"),
          privateQuote: t("product.privateQuote"),
          related: t("product.related"),
          collectionPush: t("product.collectionPush"),
          viewProduct: t("actions.view"),
          variants: t("product.variants"),
          selected: t("product.selected"),
          status: t("product.status"),
          stockInStock: t("product.stock.inStock"),
          stockOutOfStock: t("product.stock.outOfStock"),
          stockOnRequest: t("product.stock.onRequest"),
          stockPreOrder: t("product.stock.preOrder")
        }}
      />
    </RPage>
  );
}
