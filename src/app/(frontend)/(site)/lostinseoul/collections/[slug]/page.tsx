import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostCollectionBySlug } from "@/lib/lost-commerce/queries";
import { StoreFront } from "@lostinseoul/storefront";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await getLostCollectionBySlug(slug).catch(() => null);
  if (!collection) notFound();

  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "collections", slug]} type="pages">
      <StoreFront
        drops={collection.drops}
        eyebrow={collection.kicker ?? t("home.eyebrow")}
        lede={collection.lede ?? ""}
        products={collection.products}
        title={collection.title}
      />
    </RPage>
  );
}
