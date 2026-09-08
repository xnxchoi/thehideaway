import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostHomeData } from "@/lib/lost-commerce/queries";
import { StoreFront } from "@lostinseoul/storefront";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LOSTINSEOUL.meta");

  return {
    title: t("title"),
    description: t("description")
  };
}

export default async function Page() {
  const t = await getTranslations("LOSTINSEOUL");
  const data = await getLostHomeData().catch(() => ({
    products: [],
    drops: []
  }));

  return (
    <RPage slug={["lostinseoul"]} theme="dark" type="pages">
      <StoreFront
        title={t("home.title")}
        eyebrow={t("home.eyebrow")}
        lede={t("home.lede")}
        products={data.products}
        drops={data.drops}
      />
    </RPage>
  );
}
