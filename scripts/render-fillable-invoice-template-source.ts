// Source render for the fillable invoice template generator.
// Run with:  pnpm tsx scripts/render-fillable-invoice-template-source.ts
// Outputs:   /tmp/fillable-invoice-source-en.pdf and /tmp/fillable-invoice-source-ko.pdf
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import pdfmake from "pdfmake";
import enMessages from "../messages/en.json" with { type: "json" };
import koMessages from "../messages/ko.json" with { type: "json" };
import {
  invoiceTemplate,
  type InvoiceLocale,
  type InvoiceStrings
} from "@/payload/collections/(consumption)/Invoices/pdfmake/template";

const fontPath = (family: string, file: string) =>
  join(process.cwd(), "public", "assets", "fonts", family, file);

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

// Fillable templates reserve editable row capacity. Finalized/generated
// invoices should never copy this padding; they should pass only actual rows
// so the following sections move up after the last purchase line.
const itemRows = [
  {
    id: "line-01",
    name: "Annual Membership",
    quantity: "1",
    price: "90,000",
    tax: "0"
  },
  ...Array.from({ length: 17 }, (_, index) => {
    const row = String(index + 2).padStart(2, "0");
    return {
      id: `line-${row}`,
      name: `ITEM${row}DESC`,
      quantity: `Q${row}`,
      price: `AMT${row}`,
      tax: `TAX${row}`
    };
  })
];

const templateInput = {
  invoice_number: "0001024",
  amount: "90,000",
  paid_at: "2026-04-28T09:14:00.000Z",
  createdAt: "2026-04-28T09:14:00.000Z",
  payment_method: [
    {
      method: "bank_transfer",
      amount: 90000,
      currency: "krw",
      payment_date: "2026-04-28T09:14:00.000Z",
      reference: "KB-2026-0428-9F2A"
    },
    {
      method: "PAYMETHOD02",
      amount: 2222,
      currency: "krw",
      payment_date: "DATE02",
      reference: "REF02"
    },
    {
      method: "PAYMETHOD03",
      amount: 3333,
      currency: "krw",
      payment_date: "DATE03",
      reference: "REF03"
    },
    {
      method: "PAYMETHOD04",
      amount: 4444,
      currency: "krw",
      payment_date: "DATE04",
      reference: "REF04"
    }
  ],
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
  },
  item: { id: "line-01", name: "Annual Membership", price: "90,000" },
  items: itemRows,
  breakBeforeTerms: true
};

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
    date: string;
    reference: string;
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
  memberSince: (year: number) => raw.memberSince.replace("{year}", String(year))
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
  console.log(`ok ${locale} -> ${outPath} (${buffer.length} bytes)`);
};

await renderFor(
  "en",
  buildStrings((enMessages as { Invoice: RawInvoiceNamespace }).Invoice),
  "/tmp/fillable-invoice-source-en.pdf"
);
await renderFor(
  "ko",
  buildStrings((koMessages as { Invoice: RawInvoiceNamespace }).Invoice),
  "/tmp/fillable-invoice-source-ko.pdf"
);
