import { join } from "path";
import { cookies, headers as nextHeaders } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import pdfmake from "pdfmake";
import type { CustomTableLayout } from "pdfmake/interfaces";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";

import { getServerSession } from "@/lib/auth/getServerSession";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import {
  invoiceTemplate,
  type InvoiceLocale,
  type InvoiceStrings
} from "@/payload/collections/(consumption)/Invoices/pdfmake/template";
import {
  formatAmount,
  formatInvoiceNumber
} from "@/components/UX/Invoice/format";
import type {
  InvoiceCurrency,
  InvoiceDisplay,
  InvoiceStatus
} from "@/components/UX/Invoice/types";

export const runtime = "nodejs";

/* ---------------------------------------------------------------- *
 *  Server-driven invoice PDF.
 *
 *  Earlier this route consumed a client-supplied invoice payload,
 *  which meant any logged-in user could mint a Hideaway-branded
 *  "paid" PDF for any name + amount they POSTed. Tax-document
 *  forgery as a service.
 *
 *  The route now accepts only `{ invoice_id }`, fetches the canonical
 *  row from the `invoices` collection, and verifies the requesting
 *  user is either an admin/editor OR the bound `client`. Nothing the
 *  client sends ends up in the PDF.
 * ---------------------------------------------------------------- */

const BodySchema = z.object({
  invoice_id: z.string().min(1)
});

type CurrencyRel = string | { name?: string | null } | null | undefined;

type InvoiceRow = {
  id: string;
  invoice_number: number;
  status: InvoiceStatus;
  amount: number;
  currency: CurrencyRel;
  paid_at?: string | null;
  cycle_start?: string | null;
  cycle_end?: string | null;
  bank_reference?: string | null;
  createdAt?: string | null;
  client?: unknown;
  plan?: unknown;
  payment_method?: Array<{
    method: "bank_transfer" | "cash";
    amount: number;
    currency: CurrencyRel;
    payment_date?: string | null;
    reference?: string | null;
  }> | null;
};

type UserLite = {
  id: string;
  email?: string | null;
  name?: string | null;
  username?: string | null;
};

type PlanLite = {
  name?: string | null;
  tier_label?: string | null;
  description?: string | null;
};

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

const objOf = <T>(rel: unknown): T | null =>
  rel && typeof rel === "object" ? (rel as T) : null;

/**
 * Sprint 2: Invoice.currency is now a relationship to the `currency`
 * collection. The PDF route fetches with `depth: 1` so the Currency
 * doc is populated. This helper extracts the lowercase code that the
 * downstream template / formatter pipeline expects.
 *
 * Defaults to "krw" — KRW-only at launch, and the formatter falls
 * back gracefully on unknown codes.
 */
const currencyCode = (rel: CurrencyRel): InvoiceCurrency => {
  const raw =
    rel && typeof rel === "object" && rel.name
      ? rel.name
      : typeof rel === "string"
        ? rel
        : "";
  const lower = raw.toLowerCase();
  return lower === "usd" || lower === "eur" ? lower : "krw";
};

/* ---------------------------------------------------------------- *
 *  pdfmake fonts + table layouts (unchanged from prior version).
 * ---------------------------------------------------------------- */

function fontPath(family: string, file: string) {
  return join(process.cwd(), "public", "assets", "fonts", family, file);
}

// pdfmake needs every font family it might reference registered up front.
// `Joly` carries the brand wordmark and the Latin body type; `Pretendard`
// is the Korean-capable fallback used when the locale is `ko`. Pretendard
// only ships in a regular set, so for italic styles we reuse Regular/Bold
// — the document doesn't italicize any Korean strings, so the substitute
// is never visually exercised.
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

const tableLayouts: { [k: string]: CustomTableLayout } = {
  invoice: {
    hLineWidth: (row) => (row === 1 ? 0.5 : 0),
    vLineWidth: () => 0,
    paddingLeft: (i) => (i === 0 ? 0 : 4),
    paddingRight: (i, node) =>
      i === (node.table.widths?.length ?? 0) - 1 ? 0 : 4
  },
  totalSum: {
    vLineWidth: () => 0,
    hLineWidth: (rowIndex, node) =>
      rowIndex === node.table.body.length - 1 ? 0.5 : 0,
    paddingLeft: (i) => (i === 0 ? 0 : 4),
    paddingRight: (i, node) =>
      i === (node.table.widths?.length ?? 0) - 1 ? 0 : 4
  }
};

/* ---------------------------------------------------------------- *
 *  Server-side projection: collection row → InvoiceDisplay shape.
 * ---------------------------------------------------------------- */

function projectInvoice(row: InvoiceRow): InvoiceDisplay {
  const client = objOf<UserLite>(row.client);
  const plan = objOf<PlanLite>(row.plan);
  return {
    invoice_number: row.invoice_number,
    status: row.status,
    amount: row.amount,
    currency: currencyCode(row.currency),
    paid_at: row.paid_at ?? null,
    cycle_start: row.cycle_start ?? null,
    cycle_end: row.cycle_end ?? null,
    bank_reference: row.bank_reference ?? null,
    payment_method: (row.payment_method ?? []).map((m) => ({
      method: m.method,
      amount: m.amount,
      currency: currencyCode(m.currency),
      payment_date: m.payment_date ?? new Date().toISOString(),
      reference: m.reference ?? null
    })),
    client: {
      name: client?.name ?? client?.email ?? "Member",
      email: client?.email ?? "",
      handle: client?.username ?? null
    },
    plan: {
      title: plan?.tier_label ?? plan?.name ?? "Membership",
      description: plan?.description ?? null
    },
    issued_at: row.createdAt ?? row.paid_at ?? new Date().toISOString()
  };
}

function toTemplateInput(invoice: InvoiceDisplay) {
  const issuedAt =
    invoice.issued_at ?? invoice.paid_at ?? new Date().toISOString();
  const planTitle = invoice.plan.title ?? "Membership";
  const moneyLabel = formatAmount(invoice.amount, invoice.currency);
  const orderRef =
    invoice.bank_reference ?? formatInvoiceNumber(invoice.invoice_number);

  return {
    invoice_number: formatInvoiceNumber(invoice.invoice_number),
    amount: moneyLabel,
    paid_at: invoice.paid_at ?? null,
    createdAt: issuedAt,
    payment_method: (invoice.payment_method ?? []).map((m) => ({
      method: m.method,
      amount: m.amount,
      currency: m.currency
    })),
    client: {
      name: invoice.client.name ?? invoice.client.email ?? "Member",
      email: invoice.client.email ?? "",
      slug: invoice.client.handle ?? "",
      createdAt: issuedAt
    },
    subscription: {
      id: orderRef,
      start_date: invoice.cycle_start ?? issuedAt,
      subscription_status: invoice.status,
      paid: invoice.status === "paid",
      plan: planTitle,
      user: ""
    },
    // Template was renamed `plan` → `item` to keep the single-line shape
    // generic; for membership invoices the item *is* the plan, so we just
    // mirror the same title/price into both fields downstream.
    item: {
      id: "",
      name: planTitle,
      price: moneyLabel
    },
    cycle_start: invoice.cycle_start ?? null,
    cycle_end: invoice.cycle_end ?? null
  };
}

/* ---------------------------------------------------------------- *
 *  Route handler
 * ---------------------------------------------------------------- */

export async function POST(req: NextRequest): Promise<NextResponse | Response> {
  const session = await getServerSession(await nextHeaders());
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimitOr429(req, "expensive", String(session.user.id));
  if (rl) return rl;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request — { invoice_id } required" },
      { status: 422 }
    );
  }

  const payload = await getPayload({ config });
  const row = (await payload
    .findByID({
      collection: "invoices",
      id: parsed.data.invoice_id,
      depth: 1,
      overrideAccess: true
    })
    .catch(() => null)) as InvoiceRow | null;

  if (!row) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Authorization: admin/editor OR the bound client.
  const role = session.user.role;
  const isStaff = role === "admin" || role === "editor";
  if (!isStaff) {
    const clientId = idOf(row.client);
    if (clientId !== String(session.user.id)) {
      // 404 not 403 — do not leak existence of other users' invoices.
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
  }

  const display = projectInvoice(row);
  const templateInput = toTemplateInput(display);

  // Locale resolution: read the same `locale` cookie next-intl uses for
  // server components, so the PDF copy matches whatever the user sees in
  // the rest of the site. Fall back to English on missing/unknown values.
  const cookieStore = await cookies();
  const localeRaw = cookieStore.get("locale")?.value;
  const locale: InvoiceLocale = localeRaw === "ko" ? "ko" : "en";

  const t = await getTranslations({ locale, namespace: "Invoice" });
  const strings: InvoiceStrings = {
    subWordmark: t("subWordmark"),
    tagline: t("tagline"),
    purchasedBy: t("purchasedBy"),
    memberSince: (year: number) => t("memberSince", { year }),
    clientCopy: t("clientCopy"),
    // Cycle label lives under the panel namespace because that's where it
    // was first introduced; reused here for the printed metadata row.
    cycleLabel: t("panel.cycleLabel"),
    fields: {
      invoiceNumber: t("fields.invoiceNumber"),
      orderNo: t("fields.orderNo")
    },
    table: {
      quantity: t("table.quantity"),
      totalAmount: t("table.totalAmount"),
      taxAmount: t("table.taxAmount")
    },
    totals: {
      subtotal: t("totals.subtotal"),
      tax: t("totals.tax"),
      total: t("totals.total")
    },
    methods: {
      label: t("methods.label"),
      amt: t("methods.amt"),
      bank_transfer: t("methods.bank_transfer"),
      cash: t("methods.cash")
    },
    footer: {
      tagline: t("footer.tagline"),
      thanks: t("footer.thanks"),
      brand: t("footer.brand")
    },
    terms: t("terms"),
    planFallback: t("planFallback")
  };

  const docDefinition = invoiceTemplate(
    templateInput as unknown as Parameters<typeof invoiceTemplate>[0],
    strings,
    locale
  );

  try {
    pdfmake.setFonts(fonts);
    pdfmake.setTableLayouts(tableLayouts);
    const output = pdfmake.createPdf(docDefinition);
    const buffer = await output.getBuffer();

    const filename = `hideaway-invoice-${formatInvoiceNumber(row.invoice_number)}.pdf`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    payload.logger.error?.(
      `[invoice/pdf] generation failed for ${row.id}: ${(err as Error).message}`
    );
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
