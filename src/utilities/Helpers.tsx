"use client";

import Script from "next/script";
import { RefObject } from "react";
import { Header } from "@/payload-types";
import { PageType } from "@/stores/Routing/RP_Voyageur";
import { PayloadLinkProps } from "@/components/UX/Link/types";

export const lerp = (start: number, end: number, amount = 0.1) => {
  return start + (end - start) * amount;
};

export const waitForWebfonts = (fonts: string[], callback: () => void) => {
  let loadedFonts = 0;

  fonts.forEach((font: string) => {
    const span = document.createElement("span");
    span.innerHTML = "giItT1WQy@!-/#";
    span.style.position = "absolute";
    span.style.left = "-10000px";
    span.style.top = "-10000px";
    span.style.fontSize = "300px";
    span.style.fontFamily = "sans-serif";
    span.style.fontVariant = "normal";
    span.style.fontStyle = "normal";
    span.style.fontWeight = "normal";
    span.style.letterSpacing = "0";
    document.body.appendChild(span);

    const initialWidth = span.offsetWidth;
    span.style.fontFamily = font;

    const checkFont = () => {
      if (span.offsetWidth !== initialWidth) {
        loadedFonts++;
        // @ts-ignore
        span.parentNode.removeChild(span);
        if (loadedFonts === fonts.length) {
          clearInterval(interval);
          callback();
        }
      }
    };

    const interval = setInterval(checkFont, 50);
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return { unit: "Bytes", size: 0 };

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return {
    size: parseFloat((bytes / k ** i).toFixed(dm)),
    unit: sizes[i]
  };
};

export const bytesToMb = (bytes: number) => {
  const { size, unit } = formatBytes(bytes);
  return unit === "KB" ? size / 1024 : size;
};
export const kbToBytes = (kb: number) => {
  return kb * 1024;
};
export const buildIdFromText = (text: string) => {
  return text
    .trim()
    .replace(/[^\w\s+]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
};

export const getImageUrl = (
  image: { asset: { url: string } },
  options: {
    quality: number;
    invert: boolean;
    width: number | string | null;
    height: number | null;
    fit: string | null;
    fm: string | null;
    sat: any;
    rect: any;
  }
) => {
  const {
    width,
    height,
    fit,
    quality = 80,
    invert,
    fm = "webp",
    sat = null,
    rect = null
  } = options;

  if (!image?.asset?.url) {
    console.warn("No image.asset.url in image object supplied.", image);
    return null;
  }

  const { url } = image.asset;
  const params: string[] = [];

  if (width) params.push(`w=${`${width}`}`);
  if (height) params.push(`h=${height}`);
  if (quality) params.push(`q=${quality}`);
  if (invert) params.push(`invert=${invert}`);
  if (fm) params.push(`fm=${fm}`);
  if (sat) params.push(`sat=${sat}`);
  if (rect) params.push(`rect=${rect}`);
  if (fit) params.push(`fit=${fit}`);

  return `${url}?${params.join("&")}`;
};
export const getPageTypeFromUrl = (l: string): PageType => {
  const c = "pages";
  if (l.startsWith(`/essays`)) {
    return "posts";
  }
  if (l.startsWith("/@") || l.startsWith("/users")) {
    return "users";
  }

  return c as PageType;
};
export const getPagePathBySlug = (l: string) =>
  l === "home" || l === "/" ? "/home" : `/${l}`;
export const getArticlePathBySlug = (slug: string) => `/essays/${slug}`;
export const getWorkPathBySlug = (slug: string) => `/work/${slug}`;

export const getUrlFromPageData = (type: string, slug: string) => {
  switch (type) {
    case "pages":
      return getPagePathBySlug(slug);
    case "posts":
      return getArticlePathBySlug(slug);
    case "portfolioItem":
      return getWorkPathBySlug(slug);
    default:
      return `/${type}/${slug}`;
  }
};

export const generateArticleSchema = (data: {
  updatedAt: Date;
  createdAt: Date;
  title: string;
  imageUrl: string;
  authorName: string;
}) => {
  const { updatedAt, createdAt, title, imageUrl, authorName } = data;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    image: [imageUrl],
    datePublished: createdAt,
    dateModified: updatedAt,
    author: [
      {
        "@type": "Person",
        name: authorName,
        url: `https://www.metalab.com${getPagePathBySlug("blog")}`
      }
    ]
  });
};

export const generateOrgStructuredDataSchema = (data: {
  companyTitle: string;
  companyDescription: string;
  image: any;
  addressInfo: any;
  telephone: string;
  foundingDate: Date;
  numberOfEmployees: number;
  email: string;
  otherLinks: any;
}) => {
  const {
    companyTitle,
    companyDescription,
    image,
    addressInfo,
    telephone,
    foundingDate,
    numberOfEmployees,
    email,
    otherLinks
  } = data;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: companyTitle,
    description: companyDescription,
    url: "https://www.metalab.com",
    logo: image.asset.url,
    foundingDate,
    address: {
      "@type": "PostalAddress",
      streetAddress: addressInfo.streetAddress,
      addressLocality: addressInfo.locality,
      addressRegion: addressInfo.region,
      postalCode: addressInfo.postalCode,
      addressCountry: addressInfo.country
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+[${telephone}]`,
      email
    },
    numberOfEmployees,
    sameAs: otherLinks
  });
};

export const getMenuPagePreviewKey = (type: PageType, slug: string) =>
  `${type}_${slug}`;

export const getPagesToFetch = (data: {
  navigationItems: any[];
  notifications: any[];
  caseStudies: { items: any[]; allWork: any };
}) => {
  const pages = [
    {
      type: "pages",
      slug: "home"
    }
  ];
  const uniqueKeys = new Set();

  const addLinkToPages = (link: any) => {
    if (!link || !link.link) return;
    const {
      link: { _type, slug }
    } = link;
    const key = getMenuPagePreviewKey(_type, slug);
    if (!uniqueKeys.has(key)) {
      uniqueKeys.add(key);
      pages.push({ type: _type, slug });
    }
  };

  data.navigationItems.forEach(addLinkToPages);
  data.notifications.forEach((notification) => {
    notification.linkArray?.[0] && addLinkToPages(notification.linkArray[0]);
  });

  if (window.innerWidth >= 768 || data.caseStudies.items) {
    data.caseStudies.items.forEach(addLinkToPages);
  }

  if (data.caseStudies.allWork) {
    addLinkToPages({ link: { _type: "page", slug: "work" } });
  }

  return pages;
};

// @ts-ignore
export const simpleImagesPreload = ({ urls, onComplete, onProgress }) => {
  let loadedCount = 0;
  const totalImages = urls.length;

  urls.forEach((url: string) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (onProgress) onProgress(loadedCount / totalImages, url);
      if (loadedCount === totalImages && onComplete) onComplete();
    };
    img.src = url;
  });
};

interface SectionSchema {
  _type: string;
  _key: string;
  title: string;
  content: any;
  section: any;
  _createdAt: any;
  _updatedAt: any;
  _id: string;
  _rev: string;
}

export type ColData = {
  image: any;
  category: { title: string; [x: string]: any };
};
export type PageData = {
  id: string;
  sections: Array<any>;
  minimizePageDuringOpenNav: boolean;
  footerType: any;
  type: any;
  slug: string;
};
export type ArticleData = ColData & {
  authors: Array<any>;
  publishedDate: any;
  related: any;
  subheading: string;
};
export type PortfolioData = ColData & {
  imageMobile: any;
  videoLoopDesktop: any;
  videoLoopMobile: any;
  stage: any;
  tags: any;
};
export type SectionData = {
  _type: "caseStudyHero" | "blogArticle" | string;
  _id: "caseStudyHero" | "blogArticle" | string;
  cmsSettings: {
    isHidden: boolean;
    cmsTitle: string;
  };
  title: string;
  image: any;
  category?: string;
};
export type PortfolioSection = SectionData & {
  imageMobile: any;
  slug: string;
  videoLoopDesktop: any | null;
  videoLoopMobile: any | null;
  stage: any;
  deliverables: any;
};
export type ArticleSection = SectionData & {
  authors: any[];
  content: any;
  createdAt: any;
  related: any;
  subheading?: string;
};
export type PageSectionn = SectionData & {
  minimizePageDuringOpenNav: (
    target: RefObject<HTMLElement | null>,
    isNavOpen: boolean
  ) => void;
  footerType: any;
};
export type SectionContent = {
  _type: "pages" | "posts" | "portfolioItem" | string;
  sections: Array<any | { section: ArticleSection[] | PortfolioSection[] }>;
  articleData?: ArticleData;
  content: any;
  _createdAt: any;
  title: string;
  slug: { current: any };
  data?: PortfolioData;
  footerType?: any;
};
export type NavigationItemData = Pick<Header, "navItems">;
export const getSections: (content: SectionContent) => Array<
  | any
  | {
      section: ArticleSection[] | PortfolioSection[];
    }
> = (content: SectionContent) => {
  if (content._type === "pages") {
    return content.sections;
  }

  if (content._type === "posts" || content._type === "portfolioItem") {
    let sectionData: null | { section: PortfolioSection[] | ArticleSection[] } =
      null;

    if (content._type === "posts") {
      sectionData = {
        section: [
          {
            _type: "blogArticle",
            _id: "blogArticle",
            authors: content.articleData?.authors || [],
            category: content.articleData?.category?.title,
            cmsSettings: {
              isHidden: false,
              cmsTitle: "Blog Article Hero"
            },
            content: content.content,
            createdAt: content.articleData?.publishedDate || content._createdAt,
            image: content.articleData?.image,
            related: content.articleData?.related,
            subheading: content.articleData?.subheading,
            title: content.title
          }
        ]
      };
    }

    if (content._type === "portfolioItem") {
      sectionData = {
        section: [
          {
            _type: "caseStudyHero",
            _id: "caseStudyHero",
            cmsSettings: {
              isHidden: false,
              cmsTitle: `${content.title} - Case Study Hero`
            },
            title: content.title,
            slug: content.slug.current,
            image: content.data?.image,
            imageMobile: content.data?.imageMobile,
            videoLoopDesktop: content.data?.videoLoopDesktop || null,
            videoLoopMobile: content.data?.videoLoopMobile || null,
            stage: content.data?.stage,
            deliverables: content.data?.tags,
            category: content.data?.category?.title || ""
          }
        ]
      };
    }

    if (!sectionData) {
      return content.sections;
    }
    const combinedSections = [sectionData];
    if (content.sections?.length) {
      content.sections.forEach((section) => {
        combinedSections.push(section);
      });
    }
    return combinedSections.filter(
      (l) => Object.keys(l.section[0] || {}).length
    );
  }

  return content.sections;
};

// @ts-ignore
const OrgStructuredData = ({
  companyTitle,
  companyDescription,
  image,
  addressInfo,
  telephone,
  email,
  foundingDate,
  numberOfEmployees,
  otherLinks
}) => {
  if (!companyTitle) {
    return null;
  }

  const orgStructuredDataSchema = generateOrgStructuredDataSchema({
    companyTitle,
    companyDescription,
    image,
    addressInfo,
    telephone,
    foundingDate,
    numberOfEmployees,
    email,
    otherLinks
  });

  return (
    <Script
      id="orgStructuredDataSchema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: orgStructuredDataSchema }}
    />
  );
};
export const typeSlugFromLink = ({ link }: { link: PayloadLinkProps }) => {
  switch (link.type) {
    case "reference":
      if (
        link.reference?.value !== undefined &&
        link.reference?.value !== null
      ) {
        switch (typeof link.reference.value) {
          case "number":
            return { type: "pages", slug: `${link.reference.value}` };
          case "object":
            return {
              type: link.reference.relationTo,
              slug: link.reference.value.slug ?? ""
            };
          default:
            return { type: "pages", slug: link.reference.value ?? "" };
        }
      } else {
        return { type: "pages", slug: link.url ?? "" };
      }
    case "custom":
      return { type: "external", slug: link.url ?? "" };
  }
};
export default {
  getSections,
  OrgStructuredData,
  formatBytes,
  lerp,
  waitForWebfonts,
  bytesToMb,
  getMenuPagePreviewKey,
  getPagePathBySlug,
  getPagesToFetch,
  getArticlePathBySlug
};
