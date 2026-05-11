"use client";

import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Admin-only Refund action rendered in the `/vault` Tickets edit view.
 *
 * Reads the current ticket state from the form (status, paid) and the
 * document id, then POSTs to `/api/tickets/refund` — which computes the
 * refund percent from `/refund`'s published schedule, marks the ticket
 * `canceled`, mails the attendee, and drops an in-app notification.
 *
 * Only renders when the ticket is in a refundable state — paid + not
 * already canceled/used. Otherwise it shows a single muted line of
 * status text so admins still see *why* the action isn't available.
 */
export function RefundAction() {
  const { id } = useDocumentInfo();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [overridePercent, setOverridePercent] = useState<string>("");

  const status = useFormFields(([fields]) =>
    typeof fields?.status?.value === "string" ? fields.status.value : null
  );
  const paid = useFormFields(([fields]) => Boolean(fields?.paid?.value));

  const refundable = paid && status !== "canceled" && status !== "used";

  if (!id) {
    return (
      <p
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          color: "var(--theme-elevation-500)",
          margin: 0
        }}
      >
        Save the ticket first to enable refunds.
      </p>
    );
  }

  if (!refundable) {
    let reason = "Refund unavailable.";
    if (!paid) reason = "Ticket is unpaid — nothing to refund.";
    else if (status === "canceled") reason = "Ticket already canceled.";
    else if (status === "used") reason = "Ticket already used at the door.";
    return (
      <p
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          color: "var(--theme-elevation-500)",
          margin: 0
        }}
      >
        {reason}
      </p>
    );
  }

  const submit = (): void => {
    const override =
      overridePercent.trim() !== ""
        ? Number.parseInt(overridePercent.trim(), 10)
        : undefined;
    if (
      override !== undefined &&
      (Number.isNaN(override) || override < 0 || override > 100)
    ) {
      toast.error("Override percent must be a whole number between 0 and 100.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/tickets/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: String(id),
            ...(override !== undefined ? { override_percent: override } : {})
          })
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          refund_amount?: number;
          refund_percent?: number;
        } | null;
        if (!res.ok || !json?.ok) {
          toast.error(`Refund failed: ${json?.error ?? res.statusText}`);
          return;
        }
        toast.success(
          `Refund issued: ₩${(json.refund_amount ?? 0).toLocaleString("ko-KR")} (${json.refund_percent ?? 0}%).`
        );
        // Reload so the form reflects the new status from the server.
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch (err) {
        toast.error(`Refund failed: ${(err as Error).message}`);
      }
    });
  };

  if (!confirming) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn--style-primary"
          style={{
            alignSelf: "flex-start",
            background: "var(--theme-error-500, #b91c1c)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          Refund ticket
        </button>
        <p
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            color: "var(--theme-elevation-500)",
            margin: 0,
            lineHeight: 1.5
          }}
        >
          Computes the refund percent from the published schedule (`/refund`)
          based on days until the event, marks the ticket canceled, and emails
          the attendee. The bank-side reversal must still be processed manually
          until PortOne is wired in.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        border: "1px solid var(--theme-elevation-200)",
        borderRadius: 4
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          lineHeight: 1.5
        }}
      >
        This will cancel the ticket and email the attendee. Continue?
      </p>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontFamily: "ui-monospace, monospace",
          fontSize: 11
        }}
      >
        <span style={{ color: "var(--theme-elevation-500)" }}>
          Override percent (optional, 0–100). Leave blank to use the schedule.
        </span>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={overridePercent}
          onChange={(e) => setOverridePercent(e.target.value)}
          placeholder="schedule"
          style={{
            padding: "6px 8px",
            border: "1px solid var(--theme-elevation-200)",
            borderRadius: 4,
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            width: 140
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          style={{
            background: "var(--theme-error-500, #b91c1c)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.6 : 1
          }}
        >
          {pending ? "Refunding…" : "Confirm refund"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setOverridePercent("");
          }}
          disabled={pending}
          style={{
            background: "transparent",
            color: "var(--theme-elevation-700)",
            border: "1px solid var(--theme-elevation-200)",
            padding: "8px 16px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: pending ? "not-allowed" : "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default RefundAction;
