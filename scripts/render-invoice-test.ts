// One-off PDF render that bypasses the auth-gated /api/invoice/pdf route.
// Run with:  pnpm tsx scripts/render-invoice-test.ts
// Outputs:   /tmp/test-invoice-en.pdf and /tmp/test-invoice-ko.pdf
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import pdfmake from "pdfmake";
import enMessages from "../messages/en.json" with { type: "json" };
import koMessages from "../messages/ko.json" with { type: "json" };
import {
  type InvoiceLocale,
  type InvoiceStrings,
  invoiceTemplate
} from "@/payload/collections/(consumption)/Invoices/pdfmake/template";

const fontPath = (family: string, file: string) =>
  join(process.cwd(), "public", "assets", "fonts", family, file);

// Mirror the API route font registration verbatim so the offline render
// reflects the production behaviour. Joly handles Latin / brand; Pretendard
// handles Korean and substitutes its Regular/Bold for italics (none of the
// Korean strings are italicized in the document).
const fonts = {
  Joly: {
    normal: fontPath("Weaved", "JolyTextRegular.otf"),
    italics: fontPath("Weaved", "JolyTextRegularItalic.otf"),
    bold: fontPath("Weaved", "JolyDisplayBold.otf"),
    bolditalics: fontPath("Weaved", "JolyDisplayBoldItalic.otf")
  },
  Pretendard: {
    normal: fontPath("Pretendard", "Pretendard-Regular.otf"),
    italics: fontPath("Pretendard", "Pretendard-Regular.otf"),
    bold: fontPath("Pretendard", "Pretendard-Bold.otf"),
    bolditalics: fontPath("Pretendard", "Pretendard-Bold.otf")
  }
};

// Keep layouts in lockstep with src/app/api/invoice/pdf/route.ts so the
// offline render matches what the API endpoint serves.
type TableLayoutNode = {
  table: { body: unknown[]; widths: unknown[] };
};
const tableLayouts = {
  invoice: {
    hLineWidth: (row: number) => (row === 1 ? 0.5 : 0),
    vLineWidth: () => 0,
    paddingLeft: (i: number) => (i === 0 ? 0 : 4),
    paddingRight: (i: number, node: TableLayoutNode) =>
      i === node.table.widths.length - 1 ? 0 : 4
  },
  totalSum: {
    vLineWidth: () => 0,
    hLineWidth: (rowIndex: number, node: TableLayoutNode) =>
      rowIndex === node.table.body.length - 1 ? 0.5 : 0,
    paddingLeft: (i: number) => (i === 0 ? 0 : 4),
    paddingRight: (i: number, node: TableLayoutNode) =>
      i === node.table.widths.length - 1 ? 0 : 4
  }
};

const templateInput = {
  invoice_number: "0001024",
  amount: "90,000",
  paid_at: "2026-04-28T09:14:00.000Z",
  createdAt: "2026-04-28T09:14:00.000Z",
  cycle_start: "2026-04-28T00:00:00.000Z",
  cycle_end: "2027-04-28T00:00:00.000Z",
  payment_method: [{ method: "bank_transfer", amount: 90000, currency: "krw" }],
  client: {
    name: "Sean Choi",
    email: "seanschoi@lostinseoul.com",
    slug: "sean",
    createdAt: "2026-04-28T09:14:00.000Z"
  },
  subscription: {
    id: "KB-2026-0428-9F2A",
    start_date: "2026-04-28T00:00:00.000Z",
    subscription_status: "paid",
    paid: true,
    plan: "Annual Membership",
    user: ""
  }, // Template field is `item` (the renamed single-line concept) — for a
  // membership invoice the item IS the plan, so the shape is the same.
  item: { id: "", name: "Annual Membership", price: "90,000" }
};

// Build an InvoiceStrings bundle out of a parsed messages JSON. We mirror
// next-intl's shape: leaf strings stay strings; the date-formatted
// `memberSince` is reconstituted into a function that interpolates `year`.
type RawInvoiceNamespace = {
  subWordmark: string;
  tagline: string;
  purchasedBy: string;
  memberSince: string;
  clientCopy: string;
  fields: { invoiceNumber: string; orderNo: string };
  table: { quantity: string; totalAmount: string; taxAmount: string };
  totals: { subtotal: string; tax: string; total: string };
  methods: {
    label: string;
    amt: string;
    bank_transfer: string;
    cash: string;
  };
  footer: { tagline: string; thanks: string; brand: string };
  terms: string;
  planFallback: string;
  panel: { cycleLabel: string };
};

const buildStrings = (raw: RawInvoiceNamespace): InvoiceStrings => ({
  ...raw,
  cycleLabel: raw.panel.cycleLabel,
  memberSince: (year: number) => raw.memberSince.replace("{year}", `${year}`)
});

const renderFor = async (
  locale: InvoiceLocale,
  strings: InvoiceStrings,
  outPath: string
) => {
  const docDef = invoiceTemplate(
    templateInput as unknown as Parameters<typeof invoiceTemplate>[0],
    strings,
    locale
  );
  const pdfmakeAny = pdfmake as unknown as {
    setFonts: (f: unknown) => void;
    setTableLayouts: (t: unknown) => void;
    createPdf: (def: unknown) => { getBuffer: () => Promise<Buffer> };
  };
  pdfmakeAny.setFonts(fonts);
  pdfmakeAny.setTableLayouts(tableLayouts);
  const output = pdfmakeAny.createPdf(docDef);
  const buffer = await output.getBuffer();
  await writeFile(outPath, buffer);
  console.log(`ok ${locale} → ${outPath} (${buffer.length} bytes)`);
};

await renderFor(
  "en",
  buildStrings((enMessages as { Invoice: RawInvoiceNamespace }).Invoice),
  "/tmp/test-invoice-en.pdf"
);
await renderFor(
  "ko",
  buildStrings((koMessages as { Invoice: RawInvoiceNamespace }).Invoice),
  "/tmp/test-invoice-ko.pdf"
);
