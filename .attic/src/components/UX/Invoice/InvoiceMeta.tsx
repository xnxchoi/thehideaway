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
  onInspect?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
};

export function InvoiceMeta({
  invoice,
  onInspect,
  onPrint,
  onDownload
}: InvoiceMetaProps) {
  const code = currencyCode(invoice.currency);
  const method = invoice.payment_method?.[0];
  const clientPrimary = invoice.client.name ?? invoice.client.email ?? "Member";

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
      <div className="mt-8">
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

      {/* Issued to */}
      <div className="mt-8 border-t border-border/15 pt-6">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
          Issued to
        </p>
        <p
          className={`${instrumentSerif.className} mt-1 text-2xl tracking-tight text-foreground`}
        >
          {clientPrimary}
        </p>
        {invoice.client.handle ? (
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
            @{invoice.client.handle}
          </p>
        ) : null}
      </div>

      {/* Ledger */}
      <div className="mt-6 flex flex-col">
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

      {/* Action rail */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-10">
        {onInspect ? (
          <ActionButton onClick={onInspect} label="Inspect" />
        ) : null}
        {onPrint ? (
          <ActionButton onClick={onPrint} label="Print" muted />
        ) : null}
        {onDownload ? (
          <ActionButton onClick={onDownload} label="Save PDF" muted />
        ) : null}
      </div>
    </div>
  );
}

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  muted?: boolean;
};

function ActionButton({ label, onClick, muted }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        muted
          ? "border border-border/30 px-5 py-2.5 font-mono text-[11px] tracking-widest text-muted-foreground/70 uppercase transition-colors hover:border-border/60 hover:text-foreground"
          : "border border-border/50 bg-foreground/[0.04] px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground uppercase transition-colors hover:border-border hover:bg-foreground/[0.07]"
      }
    >
      {label}
    </button>
  );
}
