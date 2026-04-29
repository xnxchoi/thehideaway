import { instrumentSerif } from "./fonts";
import {
  currencyCode,
  formatAmount,
  formatDate,
  formatInvoiceNumber
} from "./format";
import type { InvoiceDisplay } from "./types";

const Crests = () => (
  <div className="flex items-center justify-center gap-6 opacity-60">
    {Array.from({ length: 6 }).map((_, i) => (
      <span
        key={i}
        className={`${instrumentSerif.className} text-[10px] tracking-[0.4em]`}
      >
        ✦
      </span>
    ))}
  </div>
);

type PaperContentProps = {
  invoice: InvoiceDisplay;
};

/**
 * Just the text content of the invoice paper. No background, no shadow, no
 * texture — those are provided by the surface this is rendered onto. Used by
 * both the standalone CSS InvoicePaper (with cream bg / shadow / SVG noise)
 * and the R3F path (mesh provides bg + texture, real lights cast real
 * shadows).
 */
export function PaperContent({ invoice }: PaperContentProps) {
  const issuedAt = invoice.issued_at ?? invoice.paid_at;
  const code = currencyCode(invoice.currency);
  const tax = 0;
  const subtotal = invoice.amount;
  const total = subtotal + tax;

  return (
    <div className="flex h-full flex-col px-[11%] py-[8%] text-neutral-900">
      <Crests />

      <div className="mt-[5%] flex flex-col items-center">
        <h2
          className={`${instrumentSerif.className} text-4xl leading-none tracking-tight sm:text-5xl`}
        >
          The Hideaway
        </h2>
        <p
          className={`${instrumentSerif.className} mt-1 text-[10px] tracking-[0.3em] text-neutral-600 italic`}
        >
          S E O U L
        </p>
      </div>

      <p className="mt-[5%] self-end font-mono text-[10px] tracking-wide text-neutral-700">
        {formatDate(issuedAt)}
      </p>

      <div className="mt-[4%]">
        <p
          className={`${instrumentSerif.className} text-[13px] text-neutral-600 italic`}
        >
          Purchased by
        </p>
        <p className={`${instrumentSerif.className} mt-1 text-base`}>
          {invoice.client.name ?? invoice.client.email ?? "—"}
        </p>
        {invoice.client.handle ? (
          <p className="mt-0.5 font-mono text-[10px] text-neutral-600">
            @{invoice.client.handle}
          </p>
        ) : null}
      </div>

      <dl className="mt-[4%] grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono text-[10px] text-neutral-700">
        <dt>Invoice number</dt>
        <dd>: {formatInvoiceNumber(invoice.invoice_number)}</dd>
        <dt>Plan</dt>
        <dd>: {invoice.plan.title ?? "Membership"}</dd>
        {invoice.bank_reference ? (
          <>
            <dt>Reference</dt>
            <dd>: {invoice.bank_reference}</dd>
          </>
        ) : null}
      </dl>

      <p
        className={`${instrumentSerif.className} mt-[4%] border-b border-neutral-300 pb-1 text-[12px] text-neutral-600 italic`}
      >
        Client copy
      </p>

      <div className="mt-[4%]">
        <div className="flex justify-between font-mono text-[9px] tracking-widest text-neutral-500 uppercase">
          <span />
          <span className="flex gap-10">
            <span>Quantity</span>
            <span>Total Amount</span>
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-b border-neutral-200 pb-3">
          <span className={`${instrumentSerif.className} text-[15px]`}>
            {invoice.plan.title ?? "Membership"}
            {invoice.plan.description ? (
              <span className="block font-mono text-[10px] text-neutral-500">
                {invoice.plan.description}
              </span>
            ) : null}
          </span>
          <span className="flex items-baseline gap-10">
            <span className="font-mono text-[11px]">1</span>
            <span className={`${instrumentSerif.className} text-[15px]`}>
              {formatAmount(subtotal, invoice.currency)}
            </span>
          </span>
        </div>
      </div>

      <dl className="mt-[4%] space-y-1 self-end text-right">
        <div className="flex justify-end gap-10">
          <dt className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            Subtotal
          </dt>
          <dd className={`${instrumentSerif.className} text-[14px]`}>
            {formatAmount(subtotal, invoice.currency)}
          </dd>
        </div>
        <div className="flex justify-end gap-10">
          <dt className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            Tax
          </dt>
          <dd className={`${instrumentSerif.className} text-[14px]`}>
            {formatAmount(tax, invoice.currency)}
          </dd>
        </div>
        <div className="mt-1 flex items-baseline justify-end gap-10 border-t border-neutral-300 pt-2">
          <dt className="font-mono text-[10px] tracking-widest text-neutral-700 uppercase">
            Total
          </dt>
          <dd
            className={`${instrumentSerif.className} text-2xl tracking-tight`}
          >
            {formatAmount(total, invoice.currency)}{" "}
            <span className="font-mono text-[10px] tracking-widest text-neutral-600">
              {code}
            </span>
          </dd>
        </div>
      </dl>

      <p
        className={`${instrumentSerif.className} mt-auto text-center text-[10px] leading-relaxed text-neutral-500 italic`}
      >
        Membership is non-transferable. Refunds within thirty days of purchase,
        subject to the terms of the Hideaway membership agreement. Thank you for
        keeping company with us.
      </p>
    </div>
  );
}
