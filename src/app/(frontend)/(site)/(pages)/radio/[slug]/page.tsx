import { Release } from "../../../../../../components/content/Radio/Release/Release";
import { RPage } from "@/components/UX/Transition";
import { queryReleaseBySlug } from "@/payload/collections/Radio/api/queryReleaseBySlug";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageParams {
  params: Promise<{ slug: string }>;
}

export default async function RadioReleasePage({ params }: PageParams) {
  const { slug } = await params;
  const release = await queryReleaseBySlug(slug);

  if (!release) notFound();

  return (
    <RPage slug={["radio", slug]} type={"pages"}>
      <Release release={release} />
    </RPage>
  );
}

export async function generateMetadata({
  params
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const release = await queryReleaseBySlug(slug);

  if (!release) {
    return {
      title: "Not found — Hideaway FM",
      description: "This release does not exist."
    };
  }

  const kind = release.kind === "album" ? "Long-play" : "Curation";
  const artist =
    release.kind === "album"
      ? (release.data as { artist?: string }).artist
      : null;

  const title = `${release.data.title}${artist ? ` — ${artist}` : ""} · Hideaway FM`;
  const description = release.data.description ?? `${kind} on Hideaway FM.`;

  return {
    title,
    description
  };
}
