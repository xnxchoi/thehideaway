import { Container, Text } from "@react-three/uikit";
import {
  currencyCode,
  formatAmount,
  formatDate,
  formatInvoiceNumber
} from "../format";
import type { InvoiceDisplay } from "../types";

// Pixel dimensions for the Root. uikit lays out in CSS-pixel-equivalent
// units, then `pixelSize` converts to world units. With pixelSize 0.004 and
// width 500, the rendered Root spans 500 * 0.004 = 2 world units — matching
// the paper plane width.
const PAPER_PX_WIDTH = 500;
const PAPER_PX_HEIGHT = Math.round(PAPER_PX_WIDTH * 1.55);
const PIXEL_SIZE = 0.004;

const NEUTRAL_900 = "#171717";
const NEUTRAL_700 = "#404040";
const NEUTRAL_600 = "#525252";
const NEUTRAL_500 = "#737373";
const NEUTRAL_300 = "#d4d4d4";
const NEUTRAL_200 = "#e5e5e5";

type PaperContent3DProps = {
  invoice: InvoiceDisplay;
};

/**
 * Paper text content rendered inside the 3D scene using @react-three/uikit.
 * Real geometry, so the sleeve mesh in front of it occludes naturally — no
 * Html scaling hacks, no DOM stacking conflicts. Tradeoff vs DOM: text is
 * SDF-rendered (no copy-paste / a11y), but the focused/print mode still uses
 * the CSS InvoicePaper for those needs.
 *
 * Default font is Inter (uikit's bundled font). Adding Instrument Serif
 * requires an MSDF atlas — left as a follow-up.
 */
export function PaperContent3D({ invoice }: PaperContent3DProps) {
  const issuedAt = invoice.issued_at ?? invoice.paid_at;
  const code = currencyCode(invoice.currency);
  const tax = 0;
  const subtotal = invoice.amount;
  const total = subtotal + tax;

  return (
    <>
      <Container
        flexDirection="row"
        justifyContent="center"
        gap={24}
        opacity={0.6}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Text key={i} fontSize={10} letterSpacing={4} color={NEUTRAL_700}>
            ✦
          </Text>
        ))}
      </Container>

      {/* Hideaway header */}
      <Container marginTop={24} flexDirection="column" alignItems="center">
        <Text fontSize={42} color={NEUTRAL_900}>
          The Hideaway
        </Text>
        <Text marginTop={4} fontSize={9} letterSpacing={3} color={NEUTRAL_600}>
          S E O U L
        </Text>
      </Container>

      {/* Date — right aligned */}
      <Container marginTop={24} alignItems="flex-end">
        <Text fontSize={9} color={NEUTRAL_700}>
          {formatDate(issuedAt)}
        </Text>
      </Container>

      {/* Purchased by */}
      <Container marginTop={20} flexDirection="column">
        <Text fontSize={11} color={NEUTRAL_600}>
          Purchased by
        </Text>
        <Text marginTop={4} fontSize={14} color={NEUTRAL_900}>
          {invoice.client.name ?? invoice.client.email ?? "—"}
        </Text>
        {invoice.client.handle ? (
          <Text marginTop={2} fontSize={9} color={NEUTRAL_600}>
            @{invoice.client.handle}
          </Text>
        ) : null}
      </Container>

      {/* Invoice metadata */}
      <Container marginTop={20} flexDirection="column" gap={4}>
        <Container flexDirection="row" gap={12}>
          <Container width={110}>
            <Text fontSize={9} color={NEUTRAL_700}>
              Invoice number
            </Text>
          </Container>
          <Text fontSize={9} color={NEUTRAL_700}>
            : {formatInvoiceNumber(invoice.invoice_number)}
          </Text>
        </Container>
        <Container flexDirection="row" gap={12}>
          <Container width={110}>
            <Text fontSize={9} color={NEUTRAL_700}>
              Plan
            </Text>
          </Container>
          <Text fontSize={9} color={NEUTRAL_700}>
            : {invoice.plan.title ?? "Membership"}
          </Text>
        </Container>
        {invoice.bank_reference ? (
          <Container flexDirection="row" gap={12}>
            <Container width={110}>
              <Text fontSize={9} color={NEUTRAL_700}>
                Reference
              </Text>
            </Container>
            <Text fontSize={9} color={NEUTRAL_700}>
              : {invoice.bank_reference}
            </Text>
          </Container>
        ) : null}
      </Container>

      {/* Client copy divider */}
      <Container
        marginTop={20}
        paddingBottom={4}
        borderBottomWidth={1}
        borderColor={NEUTRAL_300}
      >
        <Text fontSize={11} color={NEUTRAL_600}>
          Client copy
        </Text>
      </Container>

      {/* Line item header */}
      <Container marginTop={20} flexDirection="column">
        <Container flexDirection="row" justifyContent="flex-end" gap={40}>
          <Text fontSize={8} letterSpacing={2} color={NEUTRAL_500}>
            QUANTITY
          </Text>
          <Text fontSize={8} letterSpacing={2} color={NEUTRAL_500}>
            TOTAL AMOUNT
          </Text>
        </Container>
        <Container
          marginTop={12}
          paddingBottom={12}
          borderBottomWidth={1}
          borderColor={NEUTRAL_200}
          flexDirection="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Container flexDirection="column" flexShrink={1}>
            <Text fontSize={13} color={NEUTRAL_900}>
              {invoice.plan.title ?? "Membership"}
            </Text>
            {invoice.plan.description ? (
              <Text marginTop={2} fontSize={9} color={NEUTRAL_500}>
                {invoice.plan.description}
              </Text>
            ) : null}
          </Container>
          <Container flexDirection="row" gap={40} alignItems="baseline">
            <Text fontSize={10} color={NEUTRAL_900}>
              1
            </Text>
            <Text fontSize={13} color={NEUTRAL_900}>
              {formatAmount(subtotal, invoice.currency)}
            </Text>
          </Container>
        </Container>
      </Container>

      {/* Totals */}
      <Container
        marginTop={16}
        flexDirection="column"
        alignItems="flex-end"
        gap={4}
      >
        <Container flexDirection="row" gap={40}>
          <Text fontSize={9} letterSpacing={2} color={NEUTRAL_500}>
            SUBTOTAL
          </Text>
          <Text fontSize={12} color={NEUTRAL_900}>
            {formatAmount(subtotal, invoice.currency)}
          </Text>
        </Container>
        <Container flexDirection="row" gap={40}>
          <Text fontSize={9} letterSpacing={2} color={NEUTRAL_500}>
            TAX
          </Text>
          <Text fontSize={12} color={NEUTRAL_900}>
            {formatAmount(tax, invoice.currency)}
          </Text>
        </Container>
        <Container
          marginTop={6}
          paddingTop={6}
          borderTopWidth={1}
          borderColor={NEUTRAL_300}
          flexDirection="row"
          gap={40}
          alignItems="baseline"
        >
          <Text fontSize={9} letterSpacing={2} color={NEUTRAL_700}>
            TOTAL
          </Text>
          <Container flexDirection="row" gap={6} alignItems="baseline">
            <Text fontSize={20} color={NEUTRAL_900}>
              {formatAmount(total, invoice.currency)}
            </Text>
            <Text fontSize={9} letterSpacing={2} color={NEUTRAL_600}>
              {code}
            </Text>
          </Container>
        </Container>
      </Container>

      {/* Footer note — pinned to the bottom */}
      <Container marginTop="auto" paddingTop={20} alignItems="center">
        <Text
          fontSize={8}
          color={NEUTRAL_500}
          textAlign="center"
          lineHeight={1.55}
        >
          Membership is non-transferable. Refunds within thirty days of
          purchase, subject to the terms of the Hideaway membership agreement.
          Thank you for keeping company with us.
        </Text>
      </Container>
    </>
  );
}
