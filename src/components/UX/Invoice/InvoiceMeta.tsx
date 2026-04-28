import { instrumentSerif } from "./fonts";
import { currencyCode, formatAmount, formatDate } from "./format";
import type { InvoiceDisplay } from "./types";

const statusCopy: Record<InvoiceDisplay["status"], string> = {
  paid: "Settled",
  pending: "Pending",
  void: "Void"
};

type RowProps = {
  label: string;
  value: string;
  mono?: boolean;
};

const Row = ({ label, value, mono = true }: RowProps) => (
  <div className="flex items-baseline justify-between gap-6 border-b border-border/15 py-3">
    <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
      {label}
    </span>
    <span
      className={
        mono
          ? "font-mono text-[11px] text-foreground/90"
          : `${instrumentSerif.className} text-[15px] text-foreground`
      }
    >
      {value}
    </span>
  </div>
);

type InvoiceMetaProps = {
  invoice: InvoiceDisplay;
};

export function InvoiceMeta({ invoice }: InvoiceMetaProps) {
  const code = currencyCode(invoice.currency);
  const method = invoice.payment_method?.[0];

  return (
    <div className="flex h-full w-full flex-col">
      {/* Eyebrow */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase">
          Receipt
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-foreground/80 uppercase">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background:
                invoice.status === "paid"
                  ? "currentColor"
                  : invoice.status === "pending"
                    ? "rgba(180,140,0,0.9)"
                    : "rgba(150,40,40,0.9)"
            }}
          />
          {statusCopy[invoice.status]}
        </span>
      </div>

      {/* Hero amount */}
      <div className="mt-10">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
          Total
        </p>
        <p
          className={`${instrumentSerif.className} mt-2 text-6xl leading-none tracking-tight text-foreground xl:text-7xl`}
        >
          {formatAmount(invoice.amount, invoice.currency)}
          <span className="ml-3 align-top font-mono text-xs tracking-widest text-muted-foreground/60">
            {code}
          </span>
        </p>
      </div>

      {/* Ledger */}
      <div className="mt-10 flex flex-col">
        <Row
          label="Invoice"
          value={`№ ${String(invoice.invoice_number).padStart(7, "0")}`}
        />
        <Row
          label="Plan"
          mono={false}
          value={invoice.plan.title ?? "Membership"}
        />
        <Row label="Settled" value={formatDate(invoice.paid_at)} />
        {invoice.cycle_start ? (
          <Row
            label="Cycle"
            value={`${formatDate(invoice.cycle_start)} → ${
              invoice.cycle_end ? formatDate(invoice.cycle_end) : "Lifetime"
            }`}
          />
        ) : null}
        {method ? (
          <Row
            label="Method"
            value={method.method === "bank_transfer" ? "Bank transfer" : "Cash"}
            mono={false}
          />
        ) : null}
        {invoice.bank_reference ? (
          <Row label="Reference" value={invoice.bank_reference} />
        ) : null}
      </div>

      {/* Footnote */}
      <p
        className={`${instrumentSerif.className} mt-auto pt-10 text-[13px] leading-relaxed text-muted-foreground/70 italic`}
      >
        Tap the certificate to inspect.
      </p>
    </div>
  );
}
