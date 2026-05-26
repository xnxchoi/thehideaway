"use client";

import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";

type Labels = {
  title: string;
  empty: string;
  checkout: string;
  remove: string;
  total: string;
  back: string;
  objects: string;
};

export function LostCartPageClient({ labels }: { labels: Labels }) {
  const { lines, remove, total } = useLostCart();
  const currency = lines[0]?.currency ?? "KRW";
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="lost-cart-root min-h-screen bg-black px-4 py-5 text-white selection:bg-white selection:text-black md:px-10 md:py-8">
      <style>
        {`
          body:has(.lost-cart-root) #rp-header,
          body:has(.lost-cart-root) footer,
          body:has(.lost-cart-root) .rp__cursor,
          body:has(.lost-cart-root) .menu__frame,
          body:has(.lost-cart-root) .menu__frame-corner,
          body:has(.lost-cart-root) .menu__corner-svg,
          body:has(.lost-cart-root) .menu__preview-preview,
          body:has(.lost-cart-root) .pt_mask,
          body:has(.lost-cart-root) .pt_cornerstones,
          body:has(.lost-cart-root) .scroll-indicator,
          body:has(.lost-cart-root) [class*="z-239"],
          body:has(.lost-cart-root) [class*="z-[248]"],
          body:has(.lost-cart-root) [class*="top-fx-bottom"] {
            display: none !important;
          }
          body:has(.lost-cart-root) {
            background: #000;
          }
        `}
      </style>

      <header className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/10 pb-5">
        <Link
          aria-label="LOSTINSEOUL home"
          className="font-mono text-sm font-bold uppercase tracking-[0.24em]"
          href="/lostinseoul"
        >
          LOSTINSEOUL
        </Link>
        <h1 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/70">
          {labels.title} / {count.toString().padStart(2, "0")}
        </h1>
        <div className="flex justify-end">
          <Link
            className="inline-flex min-h-9 items-center rounded-[4px] border border-white/12 bg-white/[0.08] px-3 text-sm font-medium text-white backdrop-blur-md"
            href="/lostinseoul"
          >
            {labels.back}
          </Link>
        </div>
      </header>

      <section className="grid min-h-[calc(100svh-6rem)] gap-10 py-12 md:grid-cols-[minmax(0,1fr)_360px] md:gap-16 md:py-20 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="mb-12 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">
                {count.toString().padStart(2, "0")} {labels.objects}
              </p>
              <h2 className="mt-4 text-6xl font-medium tracking-tight md:text-8xl">
                {labels.title}
              </h2>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/50">
              {labels.total} {formatLostMoney(total, currency)}
            </p>
          </div>

          <div className="border-y border-white/10">
            {lines.length === 0 ? (
              <div className="grid min-h-[320px] content-center justify-items-center gap-5 text-center">
                <p className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-white/70">
                  {labels.empty}
                </p>
                <Link
                  className="inline-flex min-h-10 items-center rounded-[4px] border border-white/12 bg-white/[0.08] px-4 text-sm font-medium text-white"
                  href="/lostinseoul"
                >
                  {labels.back}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {lines.map((line) => (
                  <div
                    className="grid gap-5 py-6 md:grid-cols-[116px_1fr_auto]"
                    key={`${line.productId}:${line.mode}:${line.campaignId ?? ""}`}
                  >
                    <Link
                      className="aspect-square w-28 overflow-hidden rounded-[3px] bg-white/[0.06]"
                      href={`/lostinseoul/products/${line.productSlug}`}
                    >
                      {line.imageUrl ? (
                        <img
                          alt={line.productName}
                          className="h-full w-full object-cover grayscale"
                          src={line.imageUrl}
                        />
                      ) : null}
                    </Link>
                    <div>
                      <Link
                        className="text-2xl font-medium tracking-tight"
                        href={`/lostinseoul/products/${line.productSlug}`}
                      >
                        {line.productName}
                      </Link>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                        {line.mode.replaceAll("_", " ")} / x {line.quantity}
                      </p>
                      <Button
                        className="mt-5 rounded-[4px] border border-white/12 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white hover:text-black"
                        onClick={() => remove(line)}
                        type="button"
                      >
                        {labels.remove}
                      </Button>
                    </div>
                    <p className="font-mono text-xs tabular-nums text-white/55">
                      {formatLostMoney(
                        line.unitAmount * line.quantity,
                        line.currency
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit border border-white/10 bg-white/[0.035] p-5 md:sticky md:top-8 md:p-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 font-mono text-xs uppercase tracking-[0.16em] text-white/60">
            <span>{labels.total}</span>
            <span>{formatLostMoney(total, currency)}</span>
          </div>
          <div className="grid gap-3 pt-5">
            {lines.length > 0 ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-5 text-sm font-medium text-black"
                href="/lostinseoul/checkout"
              >
                {labels.checkout}
              </Link>
            ) : (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/12 bg-white/[0.08] px-5 text-sm font-medium text-white"
                href="/lostinseoul"
              >
                {labels.back}
              </Link>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
