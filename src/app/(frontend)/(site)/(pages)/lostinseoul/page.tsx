import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostHomeData } from "@/lib/lost-commerce/queries";
import { LostStorefront } from "./storefront";

export const metadata: Metadata = {
  title: "LOSTINSEOUL",
  description:
    "A small storefront for Seoul objects, editions, and commitments."
};

export default async function LOSTINSEOULPage() {
  const t = await getTranslations("LOSTINSEOUL");
  const data = await getLostHomeData().catch(() => ({
    products: [],
    drops: []
  }));

  return (
    <RPage slug={["lostinseoul"]} type="pages">
      <LostStorefront
        title={t("home.title")}
        eyebrow={t("home.eyebrow")}
        lede={t("home.lede")}
        announcement={t("home.announcement")}
        productsLabel={t("home.products")}
        emptyLabel={t("home.empty")}
        cartLabel={t("nav.cart")}
        backLabel={t("nav.back")}
        checkoutLabel={t("cart.checkout")}
        removeLabel={t("cart.remove")}
        totalLabel={t("cart.total")}
        watchLabel={t("actions.watchVideo")}
        closeVideoLabel={t("video.close")}
        playVideoLabel={t("video.play")}
        pauseVideoLabel={t("video.pause")}
        muteVideoLabel={t("video.mute")}
        unmuteVideoLabel={t("video.unmute")}
        shopLabel={t("nav.shop")}
        archiveLabel={t("nav.archive")}
        collectionLabel={t("home.collection")}
        yearLabel={t("home.year")}
        objectsLabel={t("home.objects")}
        incomingLabel={t("home.incoming")}
        products={data.products}
        drops={data.drops}
      />
    </RPage>
  );
}
