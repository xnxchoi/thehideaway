import {
  Content,
  ContentColumns,
  ContentStack,
  ContentTable,
  ContentText,
  Margins,
  PageSize,
  TableCell,
  TDocumentDefinitions
} from "pdfmake/interfaces";
import { DateTime } from "luxon";
import { Currency, Invoice, Subscription, User } from "@/payload-types";
import {
  CRESTS_SVG_MARKUP,
  CRESTS_SVG_WIDTH,
  HIDEAWAY_LOGO_DATA_URL
} from "@/components/UX/Invoice/branding";

type RecurringPlan = {
  id: string;
  name: string;
  price: string;
};

type InvoiceLineItem = RecurringPlan & {
  quantity?: string | number;
  tax?: string;
};


const toCurrencyCode = (value: Currency | string): InvoiceCurrencyCode => {
  const raw = typeof value === "string" ? value : value.name;
  const lower = raw.toLowerCase();
  return lower === "usd" || lower === "eur" ? lower : "krw";
};

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
    date: string;
    reference: string;
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
  items?: InvoiceLineItem[];
  breakBeforeTerms?: boolean;
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
const footer =
  (strings: InvoiceStrings): TDocumentDefinitions["footer"] =>
  (currentPage, pageCount) => ({
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
        columns: [
          { text: "", width: "*" },
          {
            text: strings.footer.brand,
            font: "Joly",
            alignment: "center",
            fontSize: 7,
            bold: true,
            width: "auto"
          },
          {
            text: `${currentPage} / ${pageCount}`,
            font: "Joly",
            alignment: "right",
            fontSize: 6,
            width: "*",
            margin: [0, 1, 50, 0]
          }
        ],
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
            text: info.name, // Names may contain Hangul or Latin; the per-locale default
            // font already handles both.
            lineHeight: 1.1,
            bold: true,
            margin: [0, 0, 0, 0.5]
          }, // Email and URL are always Latin — pin to Joly so they stay in the
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

type PaymentMethodLine = {
  method: string;
  amount: number;
  currency: "usd" | "krw" | "eur";
  payment_date?: string | null;
  reference?: string | null;
};

const methodField = (
  methods: PaymentMethodLine[],
  strings: InvoiceStrings,
  locale: InvoiceLocale
): ContentTable => {
  const entries = methods.filter((method) => !!method);
  const methodLabel = (key: string): string => {
    if (key === "bank_transfer") return strings.methods.bank_transfer;
    if (key === "cash") return strings.methods.cash;
    return key;
  };
  const bcp47 = locale === "ko" ? "ko-KR" : "en-US";
  const formatPaymentDate = (value: string | null | undefined): string => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(bcp47, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(date);
  };
  const formatPaymentAmount = (method: PaymentMethodLine): string =>
    new Intl.NumberFormat(
      method.currency === "krw"
        ? "ko-KR"
        : method.currency === "eur"
          ? "en-IE"
          : "en-US",
      {
        style: "decimal",
        minimumFractionDigits: method.currency === "krw" ? 0 : 2,
        maximumFractionDigits: method.currency === "krw" ? 0 : 2
      }
    ).format(method.amount);
  const cell = (text: string, extra: Partial<TableCell> = {}): TableCell => ({
    text,
    border: [false, false, false, false],
    ...extra
  });
  return {
    table: {
      widths: [locale === "ko" ? 62 : 112, "*", 62, 82, 112],
      body: [
        [
          cell(strings.methods.label),
          cell(""),
          cell(strings.methods.amt, { alignment: "right" }),
          cell(strings.methods.date),
          cell(strings.methods.reference)
        ],
        ...entries.map((method) => [
          cell(""),
          cell(methodLabel(method.method)),
          cell(formatPaymentAmount(method), {
            alignment: "right",
            font: "Joly"
          }),
          cell(formatPaymentDate(method.payment_date), {
            ...(locale === "en" ? { font: "Joly" } : {})
          }),
          cell(method.reference?.trim() ?? "", { font: "Joly" })
        ])
      ]
    },
    layout: "noBorders",
    margin: [0, 20, 0, 20]
  };
};

const currencyLikePattern = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;

const parseLineAmount = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !currencyLikePattern.test(trimmed)) return null;
  const parsed = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const decimalPlaces = (value: unknown): number => {
  if (typeof value !== "string") return 0;
  const [, fraction = ""] = value.split(".");
  return fraction.length;
};

const formatLineAmount = (value: number, samples: unknown[]): string => {
  const fractionDigits = Math.max(0, ...samples.map(decimalPlaces));
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
};

const sumLineAmounts = (
  items: InvoiceLineItem[],
  select: (item: InvoiceLineItem) => unknown
): string | null => {
  let total = 0;
  const samples: unknown[] = [];
  for (const item of items) {
    const raw = select(item);
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      continue;
    }
    const amount = parseLineAmount(raw);
    if (amount === null) return null;
    total += amount;
    samples.push(raw);
  }
  return samples.length > 0 ? formatLineAmount(total, samples) : null;
};

const invoiceTable = (
  items: InvoiceLineItem[],
  strings: InvoiceStrings
): ContentTable => {
  // Cartier-style: Description / Quantity / Total Amount / Tax Amount.
  // Per-line tax defaults to "0" so the column is always populated even when
  // no tax is collected.
  const rows = items.map((item) => {
    const hasValue = Boolean(
      item.name || item.price || item.quantity || item.tax
    );
    const quantity = item.quantity ?? (hasValue ? "1" : "");
    const tax = item.tax ?? (hasValue ? "0" : "");
    return [
      {
        text: item.name,
        bold: true,
        border: [false, false, false, false]
      },
      {
        text: String(quantity),
        font: "Joly",
        border: [false, false, false, false],
        alignment: "right"
      },
      {
        text: item.price,
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
    ];
  });
  return {
    table: {
      headerRows: 1,
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
        ...rows
      ]
    },
    layout: "invoice"
  };
};

const FIRST_ITEM_PAGE_ROWS = 12;
const CONTINUATION_ITEM_PAGE_ROWS = 14;

const chunkLineItems = (items: InvoiceLineItem[]): InvoiceLineItem[][] => {
  if (items.length <= FIRST_ITEM_PAGE_ROWS) return [items];
  const first = items.slice(0, FIRST_ITEM_PAGE_ROWS);
  const rest = items.slice(FIRST_ITEM_PAGE_ROWS);
  const continuations = Array.from(
    { length: Math.ceil(rest.length / CONTINUATION_ITEM_PAGE_ROWS) },
    (_, index) => {
      const start = index * CONTINUATION_ITEM_PAGE_ROWS;
      return rest.slice(start, start + CONTINUATION_ITEM_PAGE_ROWS);
    }
  );
  return [first, ...continuations];
};

const invoiceTables = (
  items: InvoiceLineItem[],
  strings: InvoiceStrings
): ContentTable[] =>
  chunkLineItems(items).map((chunk, index) => ({
    ...invoiceTable(chunk, strings),
    ...(index > 0 ? { pageBreak: "before" as const } : {})
  }));

const totalTable = (
  info: {
    subtotal: string;
    tax?: string;
    total: string;
  },
  strings: InvoiceStrings
): ContentTable => {
  const taxValue = info.tax ?? "0";
  const row = (label: string, value: string, bold = false): TableCell[] => [
    {
      text: label,
      bold,
      border: [false, false, false, false] as [
        boolean,
        boolean,
        boolean,
        boolean
      ]
    },
    {
      text: value, // Force values into Joly so the figures stay tabular and consistent
      // with the line-item column above.
      font: "Joly",
      alignment: "right" as const,
      bold,
      border: [false, false, false, false] as [
        boolean,
        boolean,
        boolean,
        boolean
      ]
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
  // Finalized invoices must not preserve empty template capacity. The only
  // caller that should pass placeholder rows is the fillable-template source
  // renderer; normal invoice generation should pass actual purchase rows so
  // totals, terms, and payment details pull up after the last real item.
  const items =
    info.items && info.items.length > 0
      ? info.items
      : [
          {
            ...info.item,
            name: info.item.name || strings.planFallback
          }
        ];
  const subtotal = sumLineAmounts(items, (item) => item.price);
  const tax = sumLineAmounts(items, (item) => item.tax);
  const template: TDocumentDefinitions & { content: Content[] } = {
    header: header(strings),
    content: [
      dateField({ date: info.createdAt }, locale),
      customerField(info.client, strings),
      invoiceInfo(info, strings, locale),
      clientCopy(strings),
      ...invoiceTables(items, strings),
      totalTable(
        {
          subtotal: subtotal ?? info.item.price.toString(),
          ...(tax !== null ? { tax } : {}),
          total: info.amount.toString()
        },
        strings
      ),
      {
        ...terms(strings),
        ...(info.breakBeforeTerms ? { pageBreak: "before" as const } : {})
      }
    ],
    footer: footer(strings),
    ...pageMargins(),
    ...pageSize(),
    ...defaultStyle(locale)
  };
  if (info.subscription?.paid && info.paid_at && info.payment_method) {
    const methods = info.payment_method?.map((m) => {
      return {
        method: m.method,
        amount: m.amount,
        currency: toCurrencyCode(m.currency),
        payment_date: m.payment_date ?? null,
        reference: m.reference ?? null
      };
    });
    if (methods.length > 0) {
      template.content.push(methodField(methods, strings, locale));
    }
  }
  return template;
};
