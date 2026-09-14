import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
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

export default function Page() {
  return (
    <RPage slug={["lostinseoul"]} theme="dark" type="pages">
      <Suspense fallback={null}>
        <StoreContent />
      </Suspense>
    </RPage>
  );
}

async function StoreContent() {
  await connection();
  const t = await getTranslations("LOSTINSEOUL");
  const data = await getLostHomeData();

  return (
    <StoreFront
      title={t("home.title")}
      eyebrow={t("home.eyebrow")}
      lede={t("home.lede")}
      products={data.products}
      drops={data.drops}
    />
  );
}
