import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostHomeData } from "@/lib/lost-commerce/queries";
import {
  getCommerceFragrancePresentation,
  getCommerceProductPresentation
} from "@/lib/commerce/product-presentation";
import { shouldEnableLostProductStage } from "../../fragrance/product-stage/product-stage-gate";
import { LostProductDetailClient } from "./product.client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCommerceProductPresentation(slug).catch(() => null);
  return {
    title: product ? `${product.name} — LOSTINSEOUL` : "LOSTINSEOUL",
    description: product?.summary ?? "LOSTINSEOUL product detail."
  };
}

export default async function LostProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCommerceProductPresentation(slug).catch(() => null);
  if (!product) notFound();
  const [data, fragrance] = await Promise.all([
    getLostHomeData().catch(() => ({ drops: [], products: [] })),
    getCommerceFragrancePresentation().catch(() => null)
  ]);
  const relatedProducts = data.products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);
  // The WebGL flacon stage stays dormant until the bottle is a real model (workplan
  // Level 2) — until then every PDP, fragrance included, uses the photographic gallery.
  const enableProductStage = shouldEnableLostProductStage({
    productSlug: slug,
    fragranceSlug: fragrance?.slug
  });
  const checkoutEnabled = false;

  const [t, tCommerce] = await Promise.all([
    getTranslations("LOSTINSEOUL"),
    getTranslations("Commerce.product")
  ]);

  return (
    <RPage slug={["lostinseoul", "products", slug]} theme="dark" type="pages">
      <LostProductDetailClient
        checkoutEnabled={checkoutEnabled}
        drops={data.drops}
        enableProductStage={enableProductStage}
        product={product}
        relatedProducts={relatedProducts}
        commerce={{
          eyebrow: tCommerce("eyebrow"),
          refundTitle: tCommerce("refundTitle"),
          refundBody: tCommerce("refundBody"),
          deliveryTitle: tCommerce("deliveryTitle"),
          deliveryBody: tCommerce("deliveryBody"),
          link: tCommerce("link")
        }}
        labels={{
          announcement: t("home.announcement"),
          back: t("nav.back"),
          cart: t("nav.cart"),
          archiveLabel: t("nav.archive"),
          checkoutLabel: t("cart.checkout"),
          clearSearchLabel: t("nav.clearSearch"),
          emptyLabel: t("cart.empty"),
          allProducts: t("home.products"),
          standard: t("modes.standard"),
          request: t("modes.request"),
          private: t("modes.private"),
          add: t("actions.add"),
          requestQuote: t("actions.requestQuote"),
          quoteFailed: t("checkout.failed"),
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
          variants: t("product.variants"),
          origin: t("product.origin"),
          madeInSeoul: t("product.madeInSeoul"),
          selected: t("product.selected"),
          status: t("product.status"),
          stockInStock: t("product.stock.inStock"),
          stockOutOfStock: t("product.stock.outOfStock"),
          stockOnRequest: t("product.stock.onRequest"),
          stockPreOrder: t("product.stock.preOrder"),
          removeLabel: t("cart.remove"),
          searchLabel: t("nav.search"),
          searchPlaceholder: t("nav.searchPlaceholder"),
          shopLabel: t("nav.shop"),
          totalLabel: t("cart.total"),
          viewProduct: t("actions.view")
        }}
      />
    </RPage>
  );
}
