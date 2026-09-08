"use client";

import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import { LostCartLineImage } from "@lostinseoul/cart-line-image";
import "@lostinseoul/index.css";

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
  const { lines, remove, total } = useStoreCart();
  const currency = lines[0]?.currency ?? "KRW";
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <main className="lost-cart-root min-h-screen bg-[var(--n-s-bg)] px-4 py-5 text-[var(--n-s-fg)] selection:bg-[var(--n-s-fg)] selection:text-[var(--n-s-bg)] md:px-10 md:py-8">
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
            background: var(--n-s-bg);
          }
        `}
      </style>

      <header className="grid min-h-[56px] grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.1)] pb-5">
        <Link
          aria-label="LOSTINSEOUL home"
          className="inline-flex min-h-[44px] items-center font-sans text-sm font-bold tracking-[0.24em] uppercase"
          href="/lostinseoul"
        >
          LOSTINSEOUL
        </Link>
        <h1 className="font-sans text-xs font-bold tracking-[0.2em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)] uppercase">
          {labels.title} / {count.toString().padStart(2, "0")}
        </h1>
        <div className="flex justify-end">
          <Link
            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.08)] px-4 text-sm font-medium text-[var(--n-s-fg)] backdrop-blur-md"
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
              <p className="font-sans text-[11px] tracking-[0.22em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.45)] uppercase">
                {count.toString().padStart(2, "0")} {labels.objects}
              </p>
              <h2 className="mt-4 text-6xl font-medium tracking-tight md:text-8xl">
                {labels.title}
              </h2>
            </div>
            <p className="font-sans text-xs tracking-[0.18em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.5)] uppercase">
              {labels.total} {formatLostMoney(total, currency)}
            </p>
          </div>

          <div className="border-y border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.1)]">
            {lines.length === 0 ? (
              <div className="grid min-h-[320px] content-center justify-items-center gap-5 text-center">
                <p className="font-sans text-sm font-bold tracking-[0.18em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)] uppercase">
                  {labels.empty}
                </p>
                <Link
                  className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.08)] px-4 text-sm font-medium text-[var(--n-s-fg)]"
                  href="/lostinseoul"
                >
                  {labels.back}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[oklch(from_var(--n-s-fg)_l_c_h_/_0.1)]">
                {lines.map((line) => (
                  <div
                    className="grid gap-5 py-6 md:grid-cols-[116px_1fr_auto]"
                    key={`${line.productId}:${line.skuId}:${line.mode}:${line.campaignId ?? ""}`}
                  >
                    <Link
                      className="aspect-square w-28 overflow-hidden rounded-[3px] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.06)]"
                      href={`/lostinseoul/products/${line.productSlug}`}
                    >
                      {line.imageUrl ? (
                        <LostCartLineImage
                          alt={line.productName}
                          src={line.imageUrl}
                          surface="page"
                        />
                      ) : null}
                    </Link>
                    <div>
                      <Link
                        className="inline-flex min-h-[44px] items-center text-2xl font-medium tracking-tight"
                        href={`/lostinseoul/products/${line.productSlug}`}
                      >
                        {line.productName}
                      </Link>
                      <p className="mt-2 font-sans text-[11px] tracking-[0.16em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.55)] uppercase">
                        {line.variantLabel ? `${line.variantLabel} / ` : ""}
                        {line.mode.replaceAll("_", " ")} / x {line.quantity}
                      </p>
                      <Button
                        className="mt-5 inline-flex min-h-[44px] items-center rounded-[4px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] px-4 text-sm text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)] transition hover:bg-[var(--n-s-fg)] hover:text-[var(--n-s-bg)]"
                        onClick={() => remove(line)}
                        type="button"
                      >
                        {labels.remove}
                      </Button>
                    </div>
                    <p className="font-sans text-xs text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.55)] tabular-nums">
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

        <aside className="h-fit border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.1)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.035)] p-5 md:sticky md:top-8 md:p-7">
          <div className="flex items-center justify-between border-b border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.1)] pb-5 font-sans text-xs tracking-[0.16em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.6)] uppercase">
            <span>{labels.total}</span>
            <span>{formatLostMoney(total, currency)}</span>
          </div>
          <div className="grid gap-3 pt-5">
            {lines.length > 0 ? (
              <Link
                className="inline-flex min-h-[48px] items-center justify-center rounded-[4px] bg-[var(--n-s-fg)] px-5 text-sm font-medium text-[var(--n-s-bg)]"
                href="/lostinseoul/checkout"
              >
                {labels.checkout}
              </Link>
            ) : (
              <Link
                className="inline-flex min-h-[48px] items-center justify-center rounded-[4px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.12)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.08)] px-5 text-sm font-medium text-[var(--n-s-fg)]"
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
