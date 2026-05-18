import { cookies } from "next/headers";
import type { Metadata } from "next";
import { RPage } from "@/components/UX/Transition";
import { DayNNightLanding } from "@/components/sections/DayNNight";
import { DAY_N_NIGHT_VIEW_COOKIE } from "@/components/sections/DayNNight/useViewPref";
import type { DayNNightView } from "@/components/sections/DayNNight/useViewPref";

const PAGE_TITLE = "Day n Night · Haebangchon, May 24";
const PAGE_DESCRIPTION =
  "An evening that turns the night — cookout at sundown, cocktails after the burn-down. Haebangchon, Sunday May 24, 2026.";
const PAGE_URL = "https://hideawayseoul.com/day-n-night";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    siteName: "The Hideaway",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION
  },
  robots: { index: true, follow: true }
};

// schema.org Event payload — emitted as JSON-LD on the page so search
// surfaces and link-unfurlers can render date / location / offer without
// parsing the immersive landing. Cash-only is encoded as a single Offer
// with priceCurrency=KRW; the actual on-site payment instructions live
// in the i18n copy.
const eventSchema = {
  "@context": "https://schema.org",
  "@type": "SocialEvent",
  name: "Day n Night",
  description: PAGE_DESCRIPTION,
  startDate: "2026-05-24T18:30:00+09:00",
  endDate: "2026-05-25T00:00:00+09:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Haebangchon · Itaewon",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Yongsan-gu",
      addressRegion: "Seoul",
      addressCountry: "KR"
    }
  },
  organizer: {
    "@type": "Organization",
    name: "The Hideaway",
    url: "https://hideawayseoul.com"
  },
  offers: {
    "@type": "Offer",
    price: "60000",
    priceCurrency: "KRW",
    availability: "https://schema.org/InStock",
    url: "https://hideawayseoul.com/tickets/day-n-night"
  }
};

/**
 * /day-n-night — one-off event landing for Day n Night, May 24, 2026.
 *
 * Server reads the user's cookie-stored view preference and hands the
 * initial value to the client entry. First-time visitors land on the
 * immersive view; returning visitors keep whatever they last selected
 * via the on-page toggle.
 */
export default async function DayNNightPage() {
  const store = await cookies();
  const raw = store.get(DAY_N_NIGHT_VIEW_COOKIE)?.value;
  const initialView: DayNNightView =
    raw === "simplified" ? "simplified" : "immersive";

  return (
    <RPage type="pages" slug={["day-n-night"]}>
      <script
        type="application/ld+json"
        // JSON.stringify of an in-file constant — no untrusted input, so
        // dangerouslySetInnerHTML here is the standard Next.js JSON-LD
        // pattern with no XSS surface.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <DayNNightLanding initialView={initialView} />
    </RPage>
  );
}
