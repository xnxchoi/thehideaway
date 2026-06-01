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
    drops: [],
    products: []
  }));
  const relatedProducts = data.products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "products", slug]} type="pages">
      <LostProductDetailClient
        drops={data.drops}
        product={product}
        relatedProducts={relatedProducts}
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
