import {
  ContentColumns,
  ContentStack,
  ContentText,
  ContentTable,
  Margins,
  PageSize,
  TDocumentDefinitions,
  Content
} from "pdfmake/interfaces";
import { DateTime } from "luxon";
import { Invoice, Subscription, User } from "@/payload-types";
import {
  CRESTS_SVG_MARKUP,
  CRESTS_SVG_WIDTH,
  HIDEAWAY_LOGO_DATA_URL
} from "@/components/UX/Invoice/branding";

/**
 * Translatable strings the invoice template consumes. The shape mirrors the
 * `Invoice` namespace in `messages/{en,ko}.json` exactly — the API route
 * builds this object via `getTranslations({ locale, namespace: "Invoice" })`
 * and passes it down. Keeping everything inside one object means the
 * template is purely presentational; it never reaches into next-intl
 * itself, which lets it stay reusable for offline renderers and tests.
 */
export type InvoiceStrings = {
  subWordmark: string;
  tagline: string;
  purchasedBy: string;
  memberSince: (year: number) => string;
  clientCopy: string;
  cycleLabel: string;
  fields: {
    invoiceNumber: string;
    orderNo: string;
  };
  table: {
    quantity: string;
    totalAmount: string;
    taxAmount: string;
  };
  totals: {
    subtotal: string;
    tax: string;
    total: string;
  };
  methods: {
    label: string;
    amt: string;
    bank_transfer: string;
    cash: string;
  };
  footer: {
    tagline: string;
    thanks: string;
    brand: string;
  };
  terms: string;
  planFallback: string;
};

export type InvoiceLocale = "en" | "ko";

type InvoiceProps = Invoice & {
  client: Pick<User, "name" | "email" | "slug" | "createdAt">;
  subscription: Pick<
    Subscription,
    "start_date" | "subscription_status" | "paid" | "plan" | "id"
  > & {
    user: User["id"];
  };
  item: RecurringPlan;
};

/* ---------------------------------------------------------------- *
 *  Font selection
 *
 *  Joly is a Latin-only display face — it has no Hangul glyphs. When the
 *  locale is Korean every Korean character would render as a `.notdef`
 *  box. We swap the default font to Pretendard for KO so the body type
 *  reads naturally, and we keep Joly for EN where its editorial character
 *  is the whole point. Either way the wordmark "The Hideaway" still uses
 *  Joly via an explicit `font` override on that node, so the brand mark
 *  never loses its identity.
 * ---------------------------------------------------------------- */
const fontFor = (locale: InvoiceLocale): "Joly" | "Pretendard" =>
  locale === "ko" ? "Pretendard" : "Joly";

const header = (strings: InvoiceStrings): TDocumentDefinitions["header"] => ({
  stack: [
    // Crests strip — centered via a 3-cell columns row with `*` spacers,
    // because pdfmake's text-only `alignment: "center"` does not propagate
    // to SVG nodes.
    {
      columns: [
        { text: "", width: "*" },
        { svg: CRESTS_SVG_MARKUP, width: CRESTS_SVG_WIDTH },
        { text: "", width: "*" }
      ],
      margin: [0, 0, 0, 22]
    },
    {
      image: HIDEAWAY_LOGO_DATA_URL,
      width: 45,
      margin: [0, 0, 0, 5]
    },
    {
      // Brand wordmark stays Latin and stays Joly across every locale.
      text: "The Hideaway",
      font: "Joly",
      alignment: "center",
      fontSize: 12,
      margin: [0, 5, 0, 0]
    },
    {
      text: strings.subWordmark,
      font: "Joly",
      fontSize: 6,
      bold: true,
      alignment: "center",
      margin: [0, 0, 0, 3]
    },
    {
      // Brand tagline — English across every locale, so we pin it to Joly
      // alongside the rest of the wordmark stack.
      text: strings.tagline,
      font: "Joly",
      fontSize: 7.5,
      italics: true,
      alignment: "center",
      margin: [0, 0, 0, 0]
    }
  ],
  style: "header",
  alignment: "center",
  margin: [0, 25, 0, 15]
});

// Footer is pure brand chrome — every line is English in every locale, so
// every cell is pinned to Joly to keep the editorial voice intact even
// when the locale's default font is Pretendard.
const footer = (strings: InvoiceStrings): TDocumentDefinitions["footer"] => ({
  stack: [
    {
      text: strings.footer.tagline,
      font: "Joly",
      alignment: "center",
      italics: true,
      fontSize: 9,
      margin: [0, 5, 0, 0]
    },
    {
      text: strings.footer.thanks,
      font: "Joly",
      alignment: "center",
      fontSize: 7,
      margin: [0, 0, 0, 15]
    },
    {
      text: strings.footer.brand,
      font: "Joly",
      alignment: "center",
      fontSize: 7,
      bold: true,
      margin: [0, 10, 0, 0]
    }
  ]
});

const formatShortRange = (
  start: string | null | undefined,
  end: string | null | undefined,
  locale: InvoiceLocale
): string | null => {
  if (!start && !end) return null;
  const bcp47 = locale === "ko" ? "ko-KR" : "en-US";
  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(bcp47, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(date);
  };
  return `${fmt(start)} → ${fmt(end)}`;
};

const invoiceInfo = (
  info: InvoiceProps,
  strings: InvoiceStrings,
  locale: InvoiceLocale
): ContentColumns => {
  // Cartier-style "Label    : value" alignment. Korean labels run a bit
  // wider than English so we widen the label column when KO is active.
  const labelWidth = locale === "ko" ? 90 : 70;
  const row = (label: string, value: string) => [
    { text: label, fontSize: 9 },
    { text: `: ${value}`, fontSize: 9, font: "Joly" }
  ];
  // Subscription cycle is conditional — physical / one-off products skip
  // the row entirely so the metadata block stays tight.
  const body: ReturnType<typeof row>[] = [
    row(strings.fields.invoiceNumber, String(info.invoice_number)),
    row(strings.fields.orderNo, String(info.subscription.id))
  ];
  const cycleRange = formatShortRange(
    info.cycle_start ?? null,
    info.cycle_end ?? null,
    locale
  );
  if (cycleRange) {
    body.push(row(strings.cycleLabel, cycleRange));
  }
  return {
    columns: [
      {
        table: {
          widths: [labelWidth, "auto"],
          body
        },
        layout: "noBorders",
        margin: [0, 20, 0, 20],
        width: "50%"
      }
    ]
  };
};

const pageSize = (
  size = "A4" as PageSize
): Pick<TDocumentDefinitions, "pageSize"> => ({
  pageSize: size
});

const pageMargins = (
  margins?:
    | {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
        x?: number;
        y?: number;
      }
    | Margins
): Pick<TDocumentDefinitions, "pageMargins"> => {
  // NOTE: this function used to return `{ margins: [...] }`, which is NOT a
  // real pdfmake field — the correct top-level key is `pageMargins`. As a
  // result, every margin override silently fell through to pdfmake's
  // [40, 60, 40, 60] default, and the header kept clipping because 60pt of
  // top space cannot fit the crests + logo + wordmark + sub-wordmark + tagline.
  if (!margins) {
    return { pageMargins: [50, 165, 50, 90] };
  }
  if (Array.isArray(margins) || typeof margins === "number") {
    return { pageMargins: margins };
  } else {
    const { left, right, top, bottom, x, y } = margins;
    return {
      pageMargins: [
        left || x || 30,
        top || y || 110,
        right || x || 30,
        bottom || y || 90
      ]
    };
  }
};

const defaultStyle = (
  locale: InvoiceLocale,
  defaultOverrides?: TDocumentDefinitions["defaultStyle"]
): Pick<TDocumentDefinitions, "defaultStyle"> => {
  return {
    defaultStyle: {
      font: fontFor(locale),
      fontSize: 10,
      ...defaultOverrides
    }
  };
};

// "Client copy" — single line with a long horizontal rule below it. The
// previous version wrapped this inside a 30%-wide column + 2-col table,
// which squeezed the label and forced it to break across two lines.
const clientCopy = (strings: InvoiceStrings): ContentStack => ({
  stack: [
    {
      text: strings.clientCopy,
      margin: [0, 0, 0, 2],
      italics: true,
      fontSize: 9
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 220,
          y2: 0,
          lineWidth: 0.5,
          lineColor: "#1a1612"
        }
      ]
    }
  ],
  margin: [0, 5, 0, 12]
});

const terms = (strings: InvoiceStrings): ContentText => ({
  text: strings.terms,
  fontSize: 7.5,
  lineHeight: 1,
  margin: [0, 10, 0, 10]
});

const customerField = (
  info: InvoiceProps["client"],
  strings: InvoiceStrings
): ContentColumns => {
  const year = DateTime.fromISO(info.createdAt).year;
  return {
    columns: [
      {
        stack: [
          {
            text: strings.purchasedBy,
            italics: true,
            lineHeight: 1.35
          },
          {
            text: info.name,
            // Names may contain Hangul or Latin; the per-locale default
            // font already handles both.
            lineHeight: 1.1,
            bold: true,
            margin: [0, 0, 0, 0.5]
          },
          // Email and URL are always Latin — pin to Joly so they stay in the
          // editorial face regardless of the active locale.
          { text: info.email, font: "Joly", fontSize: 9, lineHeight: 1 },
          {
            text: `hideawayseoul.com/@${info.slug}`,
            font: "Joly",
            fontSize: 9,
            lineHeight: 1
          },
          {
            text: strings.memberSince(year),
            fontSize: 9,
            lineHeight: 1
          }
        ]
      }
    ],
    margin: [0, 20, 0, 20]
  };
};

const dateField = (
  { date }: { date: string | Date },
  locale: InvoiceLocale
): ContentText => {
  const bcp47 = locale === "ko" ? "ko-KR" : "en-US";
  return {
    text:
      new Date(date).toLocaleDateString(bcp47, {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) || "",
    fontSize: 9,
    alignment: "right",
    margin: [0, 10, 0, 20]
  };
};

const methodField = (
  methods: {
    [method: string]: { amount: number; currency: "usd" | "krw" };
  },
  strings: InvoiceStrings
): ContentStack => {
  const entries = Object.entries(methods).filter(([, c]) => !!c);
  const methodLabel = (key: string): string => {
    if (key === "bank_transfer") return strings.methods.bank_transfer;
    if (key === "cash") return strings.methods.cash;
    return key;
  };
  const rows: ContentColumns[] = entries.map(([methodName, cont], i) => {
    const formatted = new Intl.NumberFormat(
      cont.currency === "krw" ? "ko-KR" : "en-US",
      {
        style: "decimal",
        minimumFractionDigits: cont.currency === "krw" ? 0 : 2,
        maximumFractionDigits: cont.currency === "krw" ? 0 : 2
      }
    ).format(cont.amount);
    return {
      columns: [
        { text: i === 0 ? strings.methods.label : "", width: "auto" },
        { text: methodLabel(methodName), width: "auto" },
        { text: i === 0 ? strings.methods.amt : "", width: "auto" },
        // Numeric value stays in Joly so the figures keep their tabular
        // proportions regardless of locale.
        { text: formatted, font: "Joly", width: "auto" }
      ],
      columnGap: 18
    };
  });
  return {
    stack: rows,
    margin: [0, 20, 0, 20]
  };
};

const invoiceTable = (
  items: RecurringPlan & { tax?: string },
  strings: InvoiceStrings
): ContentTable => {
  // Cartier-style: Description / Quantity / Total Amount / Tax Amount.
  // Per-line tax defaults to "0" so the column is always populated even when
  // no tax is collected.
  const tax = items.tax ?? "0";
  return {
    table: {
      widths: ["*", "auto", "auto", "auto"],
      body: [
        [
          { text: "", border: [false, false, false, false] },
          {
            text: strings.table.quantity,
            border: [false, false, false, false],
            alignment: "right"
          },
          {
            text: strings.table.totalAmount,
            border: [false, false, false, false],
            alignment: "right"
          },
          {
            text: strings.table.taxAmount,
            border: [false, false, false, false],
            alignment: "right"
          }
        ],
        [
          {
            text: items.name,
            bold: true,
            border: [false, false, false, false]
          },
          {
            text: "1",
            font: "Joly",
            border: [false, false, false, false],
            alignment: "right"
          },
          {
            text: items.price,
            font: "Joly",
            border: [false, false, false, false],
            alignment: "right"
          },
          {
            text: tax,
            font: "Joly",
            border: [false, false, false, false],
            alignment: "right"
          }
        ]
      ]
    },
    layout: "invoice"
  };
};

const totalTable = (
  info: {
    subtotal: string;
    tax?: string;
    total: string;
  },
  strings: InvoiceStrings
): ContentTable => {
  const taxValue = info.tax ?? "0";
  const row = (label: string, value: string, bold = false) => [
    {
      text: label,
      bold,
      border: [false, false, false, false]
    },
    {
      text: value,
      // Force values into Joly so the figures stay tabular and consistent
      // with the line-item column above.
      font: "Joly",
      alignment: "right" as const,
      bold,
      border: [false, false, false, false]
    }
  ];
  return {
    table: {
      widths: ["*", "auto"],
      body: [
        row(strings.totals.subtotal, info.subtotal),
        row(strings.totals.tax, taxValue),
        row(strings.totals.total, info.total, true)
      ]
    },
    layout: "totalSum",
    margin: [0, 10, 0, 20]
  };
};

/**
 * Build the pdfmake document definition for an invoice. The `locale`
 * argument selects fonts and date formatting; `strings` carries every
 * piece of user-facing copy, already resolved against next-intl by the
 * caller.
 */
export const invoiceTemplate = (
  info: InvoiceProps,
  strings: InvoiceStrings,
  locale: InvoiceLocale = "en"
): TDocumentDefinitions => {
  const template: TDocumentDefinitions & { content: Content[] } = {
    header: header(strings),
    content: [
      dateField({ date: info.createdAt }, locale),
      customerField(info.client, strings),
      invoiceInfo(info, strings, locale),
      clientCopy(strings),
      invoiceTable(
        // Fall back to the localized "Membership" if the plan didn't supply
        // its own title — the line-item bold row should never be blank.
        { ...info.item, name: info.item.name || strings.planFallback },
        strings
      ),
      totalTable(
        {
          subtotal: info.item.price.toString(),
          total: info.amount.toString()
        },
        strings
      ),
      terms(strings)
    ],
    footer: footer(strings),
    ...pageMargins(),
    ...pageSize(),
    ...defaultStyle(locale)
  };
  if (info.subscription?.paid && info.paid_at && info.payment_method) {
    const methods: {
      [method: string]: { amount: number; currency: "usd" | "krw" | "eur" };
    } = {};
    info.payment_method?.forEach((m) => {
      methods[m.method] = { amount: m.amount, currency: m.currency };
    });
    template.content.push(
      methodField(
        methods as {
          [method: string]: { amount: number; currency: "usd" | "krw" };
        },
        strings
      )
    );
  }
  return template;
};
