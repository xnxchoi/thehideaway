import { InvoiceCertificate } from "@/components/UX/Invoice";
import type { InvoiceDisplay } from "@/components/UX/Invoice";
import { RPage } from "@/components/UX/Transition";
import InvoiceClient from "./page.client";
const fixture: InvoiceDisplay = {
  invoice_number: 1024,
  status: "paid",
  amount: 90000,
  currency: "krw",
  paid_at: "2026-04-28T09:14:00.000Z",
  cycle_start: "2026-04-28T00:00:00.000Z",
  cycle_end: "2027-04-28T00:00:00.000Z",
  bank_reference: "KB-2026-0428-9F2A",
  payment_method: [
    {
      method: "bank_transfer",
      amount: 90000,
      currency: "krw",
      payment_date: "2026-04-28T09:14:00.000Z",
      reference: "KB-2026-0428-9F2A"
    }
  ],
  client: {
    name: "Sean Choi",
    email: "seanschoi@lostinseoul.com",
    handle: "sean"
  },
  plan: {
    title: "Annual Membership",
    description: "Twelve months · Highlighting · The quarterly print"
  },
  issued_at: "2026-04-28T09:14:00.000Z"
};

export default function InvoicePreviewPage() {
  return (
    <RPage type="pages" slug={["invoice"]}>
      <div className="mx-auto w-full max-w-512 px-6 py-16 xl:px-10 xl:py-24">
        <div className="mb-16">
          <p className="font-sans text-small tracking-[0.3em] text-muted-foreground/60 uppercase">
            Details
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight xl:text-4xl">
            Invoice
          </h1>
        </div>

        <InvoiceClient fixture={fixture} />
      </div>
    </RPage>
  );
}
