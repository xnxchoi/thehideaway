import { queryUserBySlug } from "@/payload/collections/Users/operations/queryMemberBySlug";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { getPayload, PaginatedDocs } from "payload";
import config from "@payload-config";
import { ProfileSlide } from "@/components/layouts/Profile/ProfileSlide";
import React from "react";
import { redirect } from "next/navigation";
import { createRichtext } from "@/payload/collections/Users/helpers/createRichtext";
import type { Metadata } from "next";
import { generateMeta } from "@/utilities/generateMeta";
import { randomNumber } from "@/utilities/randomNumber";
import { SliderProps } from "@/components/layouts/Profile/types";

export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const users = (await payload
    .find({
      collection: "users",
      where: {
        and: [
          {
            banned: {
              not_equals: true
            }
          }
        ]
      },
      limit: 1000,
      pagination: false,
      overrideAccess: true,
      select: {
        slug: true
      }
    })
    .then((r) => r)
    .catch((error) => {
      console.log(error);
      return {
        totalDocs: 0,
        docs: [] as { id: string; slug: string }[]
      };
    })) as PaginatedDocs<{ id: string; slug: string }>;

  const usersl = users.docs.map(({ slug }) => {
    return { user: slug };
  });
  return [...usersl];
}

type Args = {
  params: Promise<{
    user?: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { user = "" } = await paramsPromise;
  const userSlug = user.startsWith("@") ? user.split("@")[1] : user;
  if (!userSlug || userSlug.length < 1) {
    return redirect("/404");
  }
  const payload = await getPayload({ config });
  const page = await payload
    .find({
      collection: "users",
      where: {
        slug: {
          like: userSlug
        }
      },
      pagination: false,
      select: {
        profile: true
      },
      limit: 1,
      depth: 1
    })
    .then((r) => r.docs[0])
    .then((r) => r || null)
    .catch((err) => {
      payload.logger.error(err);
      return null;
    });
  console.log("user query for {profile:true}", page);
  if (!page) {
    return redirect("/404");
  }
  const slides = await payload
    .find({
      collection: "profile",
      where: {
        author: {
          equals: page.id
        }
      },
      pagination: false,
      overrideAccess: true,
      limit: 1,
      select: {
        hero: true,
        slides: true
      }
    })
    .then((res) => res.docs[0] || null)
    .catch((err) => {
      console.error(err);
      return null;
    });

  const placeholders: [string, string, string, string] = [
    "/media/IMG_6521-1920x1439.webp",
    "/media/IMG_6355-1920x3415.jpg",
    "/media/21succession-recap-articleLarge.webp",
    "/media/branded_2-1200x630.webp"
  ];
  const phLim = placeholders.length - 1;
  const slidesExist = Boolean(
    slides && slides?.slides && slides.slides.length > 1
  );
  const firstSlide = {
    title:
      (slides?.slides?.[0]?.title || "The Hideaway") +
      " " +
      (user.startsWith("@") ? user.split("@")[1] : user),
    content:
      slides?.slides?.[0]?.content?.root ||
      createRichtext(
        "The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet."
      ).root,
    url:
      typeof slides?.slides?.[0]?.visuals === "string"
        ? slides?.slides?.[0]?.visuals
        : "/media/IMG_6521-1920x1439.webp",
    mimeType:
      slides?.slides?.[0]?.visuals &&
      typeof slides.slides[0].visuals !== "string" &&
      "mimeType" in slides.slides[0].visuals &&
      slides.slides[0].visuals.mimeType
        ? slides.slides[0].visuals.mimeType
        : "image/webp"
  } satisfies SliderProps;
  const secondSlide = {
    title: "The Hideaway",
    content:
      slides?.slides?.[1]?.content?.root ||
      createRichtext(
        "The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet."
      ).root,
    url:
      typeof slides?.slides?.[1]?.visuals === "string"
        ? slides.slides[1].visuals
        : "/media/IMG_6355-1920x3415.jpg",
    mimeType:
      slides?.slides?.[1]?.visuals &&
      typeof slides.slides[1].visuals !== "string" &&
      "mimeType" in slides.slides[1].visuals &&
      slides.slides[1].visuals.mimeType
        ? slides.slides[1].visuals.mimeType
        : "image/jpg"
  } satisfies SliderProps;
  const thirdSlide = {
    title: "The Hideaway",
    content:
      slides?.slides?.[2]?.content?.root ||
      createRichtext(
        "The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet."
      ).root,
    url:
      typeof slides?.slides?.[2]?.visuals === "string"
        ? slides.slides[2].visuals
        : "/media/21succession-recap-articleLarge.webp",
    mimeType:
      slides?.slides?.[2]?.visuals &&
      typeof slides.slides[2].visuals !== "string" &&
      "mimeType" in slides.slides[2].visuals &&
      slides.slides[2].visuals.mimeType
        ? slides.slides[2].visuals.mimeType
        : "image/webp"
  };
  const fourthSlide = {
    title: "The Hideaway",
    content:
      slides?.slides?.[3]?.content?.root ||
      createRichtext(
        "The Hideaway is a community of creators, writers, and artists who share their stories and experiences through the internet."
      ).root,
    url:
      typeof slides?.slides?.[3]?.visuals === "string"
        ? slides.slides[3].visuals
        : "/media/branded_2-1200x630.webp",
    mimeType:
      slides?.slides?.[3]?.visuals &&
      typeof slides.slides[3].visuals !== "string" &&
      "mimeType" in slides.slides[3].visuals &&
      slides.slides[3].visuals.mimeType
        ? slides.slides[3].visuals.mimeType
        : "image/webp"
  };
  const sliders: SliderProps[] = slidesExist
    ? slides!.slides!.map((slide, index) => {
        const { title, visuals, content } = slide;
        const i = randomNumber(0, placeholders.length - 1);
        const bu = placeholders[i]!;
        const url =
          (visuals
            ? typeof visuals === "string"
              ? visuals
              : visuals.url
            : index <= phLim && placeholders[index]) || bu;
        const mm = url.split(".").at(-1) || "jpg";
        const mimeType = `image/${mm}`;
        return {
          title,
          content: (content && content.root) || null,
          url,
          mimeType
        };
      })
    : [firstSlide, secondSlide, thirdSlide, fourthSlide];

  return (
    <>
      <ProfileSlide
        userId={page.id}
        name={user}
        bio={user}
        places={["", "", ""]}
        image={""}
        textures={sliders.flatMap((r, i) => {
          const { url, mimeType } = r;
          if (!url || !mimeType) return [];
          return { url, mimeType };
        })}
        slides={sliders}
        hero={{
          subtitle: slides?.hero?.subtitle || "",
          gradient1: slides?.hero?.gradient1 || "#c8dee8",
          gradient2: slides?.hero?.gradient2 || "#ee9c5a",
          title: slides?.hero?.title || ""
        }}
      />
    </>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { user = "" } = await paramsPromise;

  const page = await queryUserBySlug({
    userSlug: user
  });
  if (!page) {
    return {
      title: "THIS IS NOT AN EXIT",
      description: "Wrong Turn."
    };
  }
  const { portrait, ...rest } = page;
  return generateMeta({
    doc: {
      ...rest,
      portrait: portrait?.url || rest.image || ""
    }
  });
}
