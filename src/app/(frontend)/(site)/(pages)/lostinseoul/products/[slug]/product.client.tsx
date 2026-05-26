"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import type { LostProductDetail } from "@/lib/lost-commerce/queries";
import type { LostOrderMode } from "@/lib/lost-commerce/types";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";

type Labels = {
  back: string;
  cart: string;
  standard: string;
  request: string;
  private: string;
  add: string;
  requestQuote: string;
  added: string;
  campaign: string;
  progress: string;
  details: string;
  care: string;
  shipping: string;
  privateQuote: string;
};

const MODE_LABEL: Record<LostOrderMode, keyof Labels> = {
  standard_purchase: "standard",
  request_to_order: "request",
  private_order: "private"
};

export function LostProductDetailClient({
  product,
  labels
}: {
  product: LostProductDetail;
  labels: Labels;
}) {
  const { add, count } = useLostCart();
  const [mode, setMode] = useState<LostOrderMode>(
    product.modes[0] ?? "standard_purchase"
  );
  const [added, setAdded] = useState(false);

  const images = useMemo(
    () =>
      product.gallery.length > 0
        ? product.gallery
        : product.imageUrl
          ? [{ url: product.imageUrl, alt: product.imageAlt }]
          : [],
    [product.gallery, product.imageAlt, product.imageUrl]
  );

  const campaignPercent =
    product.campaign && product.campaign.minimumCommitments > 0
      ? Math.min(
          100,
          Math.round(
            (product.campaign.paidCommitments /
              product.campaign.minimumCommitments) *
              100
          )
        )
      : 0;

  const isQuoteOnly =
    mode === "private_order" && !product.privatePresetPriceEnabled;

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#161412]">
      <nav className="sticky top-0 z-20 border-b border-black/15 bg-[#f5f0e8]/90 px-6 py-4 backdrop-blur-md xl:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="text-sm font-medium" href="/lostinseoul">
            {labels.back}
          </Link>
          <Link className="text-sm font-medium" href="/lostinseoul/cart">
            {labels.cart} {count > 0 ? `(${count})` : ""}
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          {images.length > 0 ? (
            images.map((image) => (
              <div
                className="aspect-[4/5] overflow-hidden border border-black/15 bg-black/[0.04]"
                key={image.url}
              >
                <img
                  alt={image.alt ?? product.name}
                  className="h-full w-full object-cover"
                  src={image.url}
                />
              </div>
            ))
          ) : (
            <div className="aspect-[4/5] border border-black/15 bg-black/[0.04] p-5 font-serif text-8xl font-bold text-black/10 md:col-span-2">
              {product.name.slice(0, 1)}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-serif text-5xl font-bold leading-none tracking-tight md:text-6xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-black/70">
            {product.summary}
          </p>
          <p className="mt-5 font-mono text-sm tabular-nums text-black/70">
            {product.price}
          </p>

          <div className="mt-8 grid grid-cols-3 border border-black/20">
            {product.modes.map((item) => (
              <Button
                className={`min-h-12 border-r border-black/15 px-2 text-sm font-medium last:border-r-0 ${
                  mode === item ? "bg-black text-[#f5f0e8]" : "bg-transparent"
                }`}
                key={item}
                onClick={() => setMode(item)}
                type="button"
              >
                {labels[MODE_LABEL[item]]}
              </Button>
            ))}
          </div>

          {mode === "request_to_order" && product.campaign ? (
            <div className="mt-5 border border-black/15 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/60">
                {labels.campaign}
              </p>
              <p className="mt-2 text-base font-medium">
                {product.campaign.title}
              </p>
              {product.campaign.progressVisibility !== "hidden" ? (
                <div className="mt-4">
                  <div className="h-1.5 bg-black/10">
                    <div
                      className="h-full bg-black"
                      style={{ width: `${campaignPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-black/65">
                    {labels.progress} {campaignPercent}%
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {isQuoteOnly ? (
            <form
              className="mt-6 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await fetch("/api/lost/private-quotes", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    productId: product.id,
                    quantity: 1,
                    note: new FormData(event.currentTarget).get("note")
                  })
                });
                setAdded(true);
              }}
            >
              <textarea
                className="min-h-28 border border-black/20 bg-transparent p-3 text-sm outline-none"
                name="note"
                placeholder={labels.privateQuote}
              />
              <Button className="min-h-12 bg-black px-4 text-sm font-medium text-[#f5f0e8]">
                {added ? labels.added : labels.requestQuote}
              </Button>
            </form>
          ) : (
            <Button
              className="mt-6 min-h-12 w-full bg-black px-4 text-sm font-medium text-[#f5f0e8]"
              onClick={() => {
                add({
                  productId: product.id,
                  productName: product.name,
                  productSlug: product.slug,
                  mode,
                  campaignId:
                    mode === "request_to_order"
                      ? product.campaign?.id
                      : undefined,
                  quantity: 1,
                  price: product.price,
                  unitAmount:
                    mode === "private_order" && product.privateUnitAmount
                      ? product.privateUnitAmount
                      : product.unitAmount,
                  currency: product.currency,
                  imageUrl: product.imageUrl
                });
                setAdded(true);
              }}
              type="button"
            >
              {added ? labels.added : labels.add}
            </Button>
          )}

          <div className="mt-10 divide-y divide-black/15 border-y border-black/15">
            {[
              [labels.details, product.details],
              [labels.care, product.care],
              [labels.shipping, product.shippingReturns]
            ].map(([label, body]) =>
              body ? (
                <details className="py-4" key={label}>
                  <summary className="cursor-pointer text-sm font-medium">
                    {label}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">
                    {body}
                  </p>
                </details>
              ) : null
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
