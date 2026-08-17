import configPromise from "@payload-config";
import { SurfContent } from "@/components/content/surf/surf";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { cacheTag } from "next/cache";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};
export default async function SurfPage({ params }: Args) {
  const { slug } = await params;
  const surfs = await getSurf({ slug });

  if (!surfs.docs.length) {
    notFound();
  }
  const surfsData = surfs.docs[0]!;
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16 xl:px-10 xl:py-24">
      <SurfContent title={surfsData.title} content={surfsData.content} />
    </main>
  );
}

async function getSurf({ slug }: { slug: string }) {
  "use cache";
  cacheTag("surf-" + slug);
  const payload = await getPayload({ config: configPromise });
  const surfs = await payload.find({
    collection: "surf",
    where: {
      slug: {
        equals: slug
      }
    },
    pagination: false,
    limit: 1,
    overrideAccess: true,
    select: {
      slug: true,
      title: true,
      content: true,
      author: true,
      tags: true,
      category: true
    }
  });
  return surfs;
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const surfs = await getSurf({ slug });
  if (!surfs.docs.length) {
    return {
      title: "404",
      description: "Not Found"
    };
  }
  const surfData = surfs.docs[0]!;
  return {
    title: `${surfData.title} | Surf `,
    description: surfData.title
  };
}
