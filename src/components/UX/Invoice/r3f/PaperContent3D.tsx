"use client";

import { Text } from "@react-three/drei";
import {
  currencyCode,
  formatAmount,
  formatDate,
  formatInvoiceNumber
} from "../format";
import type { InvoiceDisplay } from "../types";

const SERIF = "/fonts/InstrumentSerif-Regular.ttf";
const MONO = "/fonts/GeistMono-Regular.ttf";

// Ink colors — warm dark grey reads as printed ink, not UI text.
const INK = "#1a1612";
const INK_SOFT = "#3a342e";
const INK_FAINT = "#6e6760";
const RULE = "#c0bbb2";
const RULE_LIGHT = "#dcd7ce";

// Paper plane is 2 wide × 3.1 tall, centered. All positions are in those
// world units. z=0.005 puts text just in front of the paper so the depth
// buffer correctly orders it (and the sleeve mesh in front occludes it).
const Z = 0.005;
const PAPER_W = 2.0;
const PAPER_H = 3.1;
const HALF_W = PAPER_W / 2;
const HALF_H = PAPER_H / 2;

// Internal margin (matching CSS px-[11%] py-[8%])
const PAD_X = PAPER_W * 0.11;
const TEXT_LEFT = -HALF_W + PAD_X;
const TEXT_RIGHT = HALF_W - PAD_X;
const INNER_W = PAPER_W - PAD_X * 2;

type PaperContent3DProps = {
  invoice: InvoiceDisplay;
};

/**
 * Invoice content as real 3D text geometry on the paper plane.
 *
 * Each text element is a Drei <Text> SDF mesh — gets lit by the scene's
 * directional light, casts micro-shadows, gets occluded by the sleeve mesh
 * naturally via the depth buffer. Layout positions are tuned to mirror the
 * CSS popup proportions but in 3D space.
 *
 * Serif (Instrument Serif) for editorial text; mono (Geist Mono) for ledger
 * codes, dates, reference numbers — same duality as the CSS version.
 */
export function PaperContent3D({ invoice }: PaperContent3DProps) {
  const issuedAt = invoice.issued_at ?? invoice.paid_at;
  const code = currencyCode(invoice.currency);
  const tax = 0;
  const subtotal = invoice.amount;
  const total = subtotal + tax;

  return (
    <group>
      {/* ═══ Crests row — center top ═══ */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Text
          key={i}
          font={SERIF}
          fontSize={0.05}
          color={INK_FAINT}
          anchorX="center"
          anchorY="middle"
          position={[-0.4 + i * 0.16, HALF_H - 0.22, Z]}
        >
          ✦
        </Text>
      ))}

      {/* ═══ Hideaway header ═══ */}
      <Text
        font={SERIF}
        fontSize={0.22}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[0, HALF_H - 0.5, Z]}
      >
        The Hideaway
      </Text>
      <Text
        font={SERIF}
        fontSize={0.04}
        color={INK_SOFT}
        letterSpacing={0.4}
        anchorX="center"
        anchorY="middle"
        position={[0, HALF_H - 0.66, Z]}
      >
        S E O U L
      </Text>

      {/* ═══ Date — right aligned ═══ */}
      <Text
        font={MONO}
        fontSize={0.045}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 0.92, Z]}
      >
        {formatDate(issuedAt)}
      </Text>

      {/* ═══ Purchased by ═══ */}
      <Text
        font={SERIF}
        fontSize={0.058}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.18, Z]}
      >
        Purchased by
      </Text>
      <Text
        font={SERIF}
        fontSize={0.082}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.3, Z]}
      >
        {invoice.client.name ?? invoice.client.email ?? "—"}
      </Text>
      {invoice.client.handle ? (
        <Text
          font={MONO}
          fontSize={0.04}
          color={INK_SOFT}
          anchorX="left"
          anchorY="middle"
          position={[TEXT_LEFT, HALF_H - 1.4, Z]}
        >
          @{invoice.client.handle}
        </Text>
      ) : null}

      {/* ═══ Invoice metadata block ═══ */}
      <MetadataRow
        label="Invoice number"
        value={`: ${formatInvoiceNumber(invoice.invoice_number)}`}
        y={HALF_H - 1.62}
      />
      <MetadataRow
        label="Plan"
        value={`: ${invoice.plan.title ?? "Membership"}`}
        y={HALF_H - 1.7}
      />
      {invoice.bank_reference ? (
        <MetadataRow
          label="Reference"
          value={`: ${invoice.bank_reference}`}
          y={HALF_H - 1.78}
        />
      ) : null}

      {/* ═══ Client copy ═══ */}
      <Text
        font={SERIF}
        fontSize={0.052}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.95, Z]}
      >
        Client copy
      </Text>
      <mesh position={[0, HALF_H - 2.0, Z]}>
        <planeGeometry args={[INNER_W, 0.003]} />
        <meshBasicMaterial color={RULE} />
      </mesh>

      {/* ═══ Line item header — mono labels right side ═══ */}
      <Text
        font={MONO}
        fontSize={0.034}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.4, HALF_H - 2.13, Z]}
      >
        QUANTITY
      </Text>
      <Text
        font={MONO}
        fontSize={0.034}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 2.13, Z]}
      >
        TOTAL AMOUNT
      </Text>

      {/* ═══ Line item row ═══ */}
      <Text
        font={SERIF}
        fontSize={0.072}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 2.25, Z]}
      >
        {invoice.plan.title ?? "Membership"}
      </Text>
      {invoice.plan.description ? (
        <Text
          font={MONO}
          fontSize={0.036}
          color={INK_FAINT}
          maxWidth={1.0}
          lineHeight={1.4}
          anchorX="left"
          anchorY="top"
          position={[TEXT_LEFT, HALF_H - 2.32, Z]}
        >
          {invoice.plan.description}
        </Text>
      ) : null}
      <Text
        font={MONO}
        fontSize={0.046}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.4, HALF_H - 2.25, Z]}
      >
        1
      </Text>
      <Text
        font={SERIF}
        fontSize={0.072}
        color={INK}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 2.25, Z]}
      >
        {formatAmount(subtotal, invoice.currency)}
      </Text>
      <mesh position={[0, HALF_H - 2.45, Z]}>
        <planeGeometry args={[INNER_W, 0.002]} />
        <meshBasicMaterial color={RULE_LIGHT} />
      </mesh>

      {/* ═══ Subtotal ═══ */}
      <Text
        font={MONO}
        fontSize={0.038}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.36, HALF_H - 2.6, Z]}
      >
        SUBTOTAL
      </Text>
      <Text
        font={SERIF}
        fontSize={0.062}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 2.6, Z]}
      >
        {formatAmount(subtotal, invoice.currency)}
      </Text>

      {/* ═══ Tax ═══ */}
      <Text
        font={MONO}
        fontSize={0.038}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.36, HALF_H - 2.7, Z]}
      >
        TAX
      </Text>
      <Text
        font={SERIF}
        fontSize={0.062}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 2.7, Z]}
      >
        {formatAmount(tax, invoice.currency)}
      </Text>
      <mesh position={[TEXT_RIGHT - 0.23, HALF_H - 2.78, Z]}>
        <planeGeometry args={[0.46, 0.002]} />
        <meshBasicMaterial color={RULE} />
      </mesh>

      {/* ═══ Total ═══ */}
      <Text
        font={MONO}
        fontSize={0.04}
        color={INK_SOFT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.36, HALF_H - 2.9, Z]}
      >
        TOTAL
      </Text>
      <Text
        font={SERIF}
        fontSize={0.115}
        color={INK}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.05, HALF_H - 2.9, Z]}
      >
        {formatAmount(total, invoice.currency)}
      </Text>
      <Text
        font={MONO}
        fontSize={0.034}
        color={INK_SOFT}
        letterSpacing={0.2}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.04, HALF_H - 2.88, Z]}
      >
        {code}
      </Text>

      {/* ═══ Footer ═══ */}
      <Text
        font={SERIF}
        fontSize={0.038}
        color={INK_FAINT}
        maxWidth={1.55}
        lineHeight={1.55}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, -HALF_H + 0.25, Z]}
      >
        Membership is non-transferable. Refunds within thirty days of purchase,
        subject to the terms of the Hideaway membership agreement.
      </Text>
    </group>
  );
}

type MetadataRowProps = {
  label: string;
  value: string;
  y: number;
};

function MetadataRow({ label, value, y }: MetadataRowProps) {
  return (
    <>
      <Text
        font={MONO}
        fontSize={0.042}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, y, Z]}
      >
        {label}
      </Text>
      <Text
        font={MONO}
        fontSize={0.042}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT + 0.46, y, Z]}
      >
        {value}
      </Text>
    </>
  );
}
