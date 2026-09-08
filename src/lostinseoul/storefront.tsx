"use client";

import type { ProductListing } from "@/lib/lost-commerce/queries";

import {
  FeaturedProductSection,
  Hero,
  ProductSection,
  Statement,
  VideoCollections
} from "./components";
import "./index.css";
import { Footer } from "@lostinseoul/parts/Footer";

const VIDEO_URL = "/assets/lostinseoul/home-video.mov";

type Props = {
  title: string;
  eyebrow: string;
  lede: string;
  products: ProductListing[];
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
};

export function StoreFront({ drops, eyebrow, lede, products, title }: Props) {
  const featureImage = products[0]?.imageUrl ?? null;
  const focusImage = products[0]?.imageUrl ?? null;
  const featureVideo = products[0]?.heroVideoUrl ?? VIDEO_URL;

  return (
    <main className="lost-commerce-inner">
      <Hero
        eyebrow={eyebrow}
        imageUrl={featureImage}
        title={title}
        videoUrl={featureVideo}
      />
      <Statement count={products.length} lede={lede} />
      <ProductSection products={products} />
      <FeaturedProductSection imageUrl={focusImage} products={products} />
      <VideoCollections
        drops={drops}
        fallbackImageUrl={featureImage}
        products={products}
      />
      <Footer />
    </main>
  );
}
