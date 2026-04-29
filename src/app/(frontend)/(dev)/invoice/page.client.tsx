"use client";
import { InvoiceCertificate, InvoiceDisplay } from "@/components/UX/Invoice";

export default function InvoiceClientPage({
  fixture
}: {
  fixture: InvoiceDisplay;
}) {
  return (
    <InvoiceCertificate
      invoice={fixture}
      onDownload={() => {
        // eslint-disable-next-line no-console
        console.info("download invoice", fixture.invoice_number);
      }}
    />
  );
}
