import PageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";
import {
  FounderCard,
  PriceCard
} from "@/components/sections/PriceCard/PriceCard";
import { Justification } from "@/components/UX/Justification/Justification";
import { getTranslations } from "next-intl/server";

export default async function PlansPage() {
  const t = await getTranslations("Plans");
  return (
    <RPage type="pages" slug={["plans"]}>
      <div className="relative mx-auto w-full px-[1.25em] pt-[10em] sm:px-[2em] sm:pt-[15em]">
        <div className="mb-[4.5em] text-center">
          <div className="mx-auto w-full max-w-[44em]">
            <div className="flex flex-col items-center justify-start gap-[1.25em]">
              <div>
                <div className="mb-[.75em]">
                  <div
                    className="leading-[1] font-normal uppercase"
                    style={{ fontSize: ".75em" }}
                  >
                    <div className="mb-[-.1em] overflow-hidden pb-[.1em]">
                      <div className="single-line">Membership</div>
                    </div>
                  </div>
                </div>
                <h1 className="my-0 leading-[1]">
                  <div className="mb-[-.1em] overflow-hidden pb-[.1em]">
                    {t("title")}
                  </div>
                </h1>
              </div>
              <div className="w-full max-w-[35em] items-center">
                <p
                  aria-hidden="true"
                  data-split="lines"
                  data-reveal="load"
                  className="leading-[1.4] font-medium opacity-70"
                  style={{ fontSize: "1em" }}
                >
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[72em] lg:max-w-[75vw]">
          <div
            className="relative flex"
            style={{ flexFlow: "wrap", gridRowGap: "3em" }}
          >
            <PriceCard type="standard" />
            <PriceCard type="pro" />
          </div>
          <div className="px-[.8rem] pt-[1.6rem]" data-theme="dark">
            <FounderCard />
          </div>
          <div className="price-bottom">
            <Justification
              posterEnabled={false}
              controls={false}
              loop={true}
              playsInline={true}
              muted={false}
              autoPlay={true}
              restartOnEnter={true}
              objectFit="cover"
              backgroundColor=""
              volume={25}
              startTime={0}
            />
          </div>
        </div>
      </div>
      <PageClient />
    </RPage>
  );
}
