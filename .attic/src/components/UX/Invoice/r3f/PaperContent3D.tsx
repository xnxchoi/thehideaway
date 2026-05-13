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

// Designed to be rendered inside a RenderTexture sub-scene with an ortho
// camera that maps the paper's bounds (2 wide × 3.1 tall, centered at origin)
// 1:1 to the texture. So positions are paper-local world units.
const PAPER_W = 2.0;
const PAPER_H = 3.1;
const HALF_W = PAPER_W / 2;
const HALF_H = PAPER_H / 2;

const PAD_X = PAPER_W * 0.11;
const TEXT_LEFT = -HALF_W + PAD_X;
const TEXT_RIGHT = HALF_W - PAD_X;
const INNER_W = PAPER_W - PAD_X * 2;

type PaperContent3DProps = {
  invoice: InvoiceDisplay;
};

/**
 * Invoice content as Drei <Text> SDF meshes — designed to live inside a
 * RenderTexture sub-scene so the output is baked into the paper material's
 * diffuse map. That way the paper's normalMap + roughnessMap then apply
 * uniformly to the text too: ink absorbs into the fiber, paper grain shows
 * through the printing.
 *
 * Sizes are ~35% smaller than the first pass; the previous version printed
 * the invoice in chunky type, which read as a UI mock rather than a
 * Cartier-style certificate.
 */
export function PaperContent3D({ invoice }: PaperContent3DProps) {
  const issuedAt = invoice.issued_at ?? invoice.paid_at;
  const code = currencyCode(invoice.currency);
  const subtotal = invoice.amount;
  const total = subtotal;

  return (
    <group>
      {/* Crests row — center top */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Text
          key={i}
          font={SERIF}
          fontSize={0.03}
          color={INK_FAINT}
          anchorX="center"
          anchorY="middle"
          position={[-0.24 + i * 0.096, HALF_H - 0.14, 0]}
        >
          ✦
        </Text>
      ))}

      {/* Hideaway header */}
      <Text
        font={SERIF}
        fontSize={0.12}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[0, HALF_H - 0.28, 0]}
      >
        The Hideaway
      </Text>
      <Text
        font={SERIF}
        fontSize={0.018}
        color={INK_SOFT}
        letterSpacing={0.4}
        anchorX="center"
        anchorY="middle"
        position={[0, HALF_H - 0.38, 0]}
      >
        S E O U L
      </Text>

      {/* Date — right aligned */}
      <Text
        font={MONO}
        fontSize={0.028}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 0.6, 0]}
      >
        {formatDate(issuedAt)}
      </Text>

      {/* Purchased by */}
      <Text
        font={MONO}
        fontSize={0.022}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 0.6, 0]}
      >
        PURCHASED BY
      </Text>
      <Text
        font={SERIF}
        fontSize={0.05}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 0.7, 0]}
      >
        {invoice.client.name ?? invoice.client.email ?? "—"}
      </Text>
      {invoice.client.handle ? (
        <Text
          font={MONO}
          fontSize={0.024}
          color={INK_FAINT}
          anchorX="left"
          anchorY="middle"
          position={[TEXT_LEFT, HALF_H - 0.78, 0]}
        >
          @{invoice.client.handle}
        </Text>
      ) : null}

      {/* Invoice metadata block */}
      <MetadataRow
        label="Invoice number"
        value={`: ${formatInvoiceNumber(invoice.invoice_number)}`}
        y={HALF_H - 0.96}
      />
      <MetadataRow
        label="Plan"
        value={`: ${invoice.plan.title ?? "Membership"}`}
        y={HALF_H - 1.02}
      />
      {invoice.bank_reference ? (
        <MetadataRow
          label="Reference"
          value={`: ${invoice.bank_reference}`}
          y={HALF_H - 1.08}
        />
      ) : null}

      {/* Line item header */}
      <mesh position={[0, HALF_H - 1.26, 0]}>
        <planeGeometry args={[INNER_W, 0.0025]} />
        <meshBasicMaterial color={RULE} />
      </mesh>
      <Text
        font={MONO}
        fontSize={0.022}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.34, 0]}
      >
        ITEM
      </Text>
      <Text
        font={MONO}
        fontSize={0.022}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.34, HALF_H - 1.34, 0]}
      >
        QTY
      </Text>
      <Text
        font={MONO}
        fontSize={0.022}
        color={INK_FAINT}
        letterSpacing={0.2}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 1.34, 0]}
      >
        AMOUNT
      </Text>

      {/* Line item row */}
      <Text
        font={SERIF}
        fontSize={0.045}
        color={INK}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.46, 0]}
      >
        {invoice.plan.title ?? "Membership"}
      </Text>
      {invoice.plan.description ? (
        <Text
          font={MONO}
          fontSize={0.022}
          color={INK_FAINT}
          maxWidth={0.95}
          lineHeight={1.4}
          anchorX="left"
          anchorY="top"
          position={[TEXT_LEFT, HALF_H - 1.5, 0]}
        >
          {invoice.plan.description}
        </Text>
      ) : null}
      <Text
        font={MONO}
        fontSize={0.028}
        color={INK_SOFT}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.34, HALF_H - 1.46, 0]}
      >
        1
      </Text>
      <Text
        font={SERIF}
        fontSize={0.045}
        color={INK}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT, HALF_H - 1.46, 0]}
      >
        {formatAmount(subtotal, invoice.currency)}
      </Text>

      {/* Total — single grand total, no redundant subtotal/tax when tax is 0 */}
      <mesh position={[0, HALF_H - 1.72, 0]}>
        <planeGeometry args={[INNER_W, 0.0015]} />
        <meshBasicMaterial color={RULE_LIGHT} />
      </mesh>
      <Text
        font={MONO}
        fontSize={0.024}
        color={INK_SOFT}
        letterSpacing={0.2}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, HALF_H - 1.86, 0]}
      >
        TOTAL
      </Text>
      <Text
        font={SERIF}
        fontSize={0.07}
        color={INK}
        anchorX="right"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.05, HALF_H - 1.86, 0]}
      >
        {formatAmount(total, invoice.currency)}
      </Text>
      <Text
        font={MONO}
        fontSize={0.022}
        color={INK_SOFT}
        letterSpacing={0.2}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_RIGHT - 0.04, HALF_H - 1.84, 0]}
      >
        {code}
      </Text>

      {/* Footer */}
      <Text
        font={SERIF}
        fontSize={0.024}
        color={INK_FAINT}
        maxWidth={1.55}
        lineHeight={1.55}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        position={[0, -HALF_H + 0.22, 0]}
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
        fontSize={0.028}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT, y, 0]}
      >
        {label}
      </Text>
      <Text
        font={MONO}
        fontSize={0.028}
        color={INK_SOFT}
        anchorX="left"
        anchorY="middle"
        position={[TEXT_LEFT + 0.34, y, 0]}
      >
        {value}
      </Text>
    </>
  );
}
