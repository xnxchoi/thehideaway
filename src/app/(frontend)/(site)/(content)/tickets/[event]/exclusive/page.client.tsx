"use client";

import { useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";

interface ExclusiveLink {
  label: string;
  url: string;
  type: string;
}

interface DeliveryAddress {
  recipient_name?: string | null;
  address?: string | null;
  phone?: string | null;
  submitted_at?: string | null;
}

interface Props {
  eventName: string;
  eventSlug: string;
  eventDate: string | null;
  eventLocation: string | null;
  isAttendee: boolean;
  exclusiveLinks: ExclusiveLink[];
  goodsDropEnabled: boolean;
  ticketId: string | null;
  existingDelivery: DeliveryAddress | null;
}

export function ExclusiveContentClient({
  eventName,
  eventSlug,
  eventDate,
  eventLocation,
  isAttendee,
  exclusiveLinks,
  goodsDropEnabled,
  ticketId,
  existingDelivery
}: Props) {
  return (
    <RPage type="me" slug={["tickets", eventSlug, "exclusive"]}>
      <section className="mx-auto w-full max-w-7xl px-6 pt-16 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
        {!isAttendee ? (
          <NotAttendeeView eventName={eventName} />
        ) : (
          <AttendeeView
            eventName={eventName}
            eventDate={eventDate}
            eventLocation={eventLocation}
            exclusiveLinks={exclusiveLinks}
            goodsDropEnabled={goodsDropEnabled}
            ticketId={ticketId}
            existingDelivery={existingDelivery}
          />
        )}
      </section>

      <TicketBottomBar
        eyebrow={isAttendee ? "You were there" : "Exclusive"}
        title={eventName}
        rightAction={{ label: "← My tickets", href: "/tickets/my" }}
      />
    </RPage>
  );
}

function NotAttendeeView({ eventName }: { eventName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 font-mono text-5xl opacity-10">○</span>
      <p className="text-base font-light text-foreground/70">
        This page is for attendees only.
      </p>
      <p className="mt-1.5 max-w-md font-mono text-[11px] text-muted-foreground/50">
        Only people who were checked in at {eventName} can see this content.
      </p>
    </div>
  );
}

function AttendeeView({
  eventName,
  eventDate,
  eventLocation,
  exclusiveLinks,
  goodsDropEnabled,
  ticketId,
  existingDelivery
}: {
  eventName: string;
  eventDate: string | null;
  eventLocation: string | null;
  exclusiveLinks: ExclusiveLink[];
  goodsDropEnabled: boolean;
  ticketId: string | null;
  existingDelivery: DeliveryAddress | null;
}) {
  const dateDisplay = eventDate
    ? (() => {
        try {
          return new Date(eventDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        } catch {
          return eventDate;
        }
      })()
    : null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20">
      <div>
        {dateDisplay ? (
          <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
            {dateDisplay}
            {eventLocation ? ` · ${eventLocation}` : ""}
          </p>
        ) : null}

        <div className="mt-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            From the night
          </p>
          {exclusiveLinks.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:gap-4">
              {exclusiveLinks.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-sm border border-border/20 px-5 py-4 transition-colors hover:border-border/50"
                  >
                    <p className="text-sm font-light tracking-tight">
                      {l.label}
                    </p>
                    <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                      {l.type === "form" ? "Form →" : "Open →"}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 max-w-md font-mono text-[11px] text-muted-foreground/50">
              Photos, recordings, and messages from the night will appear here
              when ready.
            </p>
          )}
        </div>
      </div>

      {goodsDropEnabled && ticketId ? (
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <DeliveryForm
            ticketId={ticketId}
            existingDelivery={existingDelivery}
          />
        </aside>
      ) : null}
    </div>
  );
}

function DeliveryForm({
  ticketId,
  existingDelivery
}: {
  ticketId: string;
  existingDelivery: DeliveryAddress | null;
}) {
  const [recipient, setRecipient] = useState(
    existingDelivery?.recipient_name ?? ""
  );
  const [address, setAddress] = useState(existingDelivery?.address ?? "");
  const [phone, setPhone] = useState(existingDelivery?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(
    Boolean(existingDelivery?.submitted_at)
  );
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    if (!recipient.trim() || !address.trim() || !phone.trim()) {
      setErr("All fields are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tickets/delivery-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          recipient_name: recipient.trim(),
          address: address.trim(),
          phone: phone.trim()
        })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setErr(`Submission failed: ${out.error ?? res.status}`);
        setBusy(false);
        return;
      }
      setSubmitted(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border/20 p-6 xl:p-8">
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Goods drop
      </p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
        Tell us where to send your free goods.
      </p>

      {submitted ? (
        <div className="mt-6 rounded-sm border border-border/20 p-5">
          <p className="font-mono text-[11px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
            Address received
          </p>
          <p className="mt-3 text-sm">
            {recipient}
            <br />
            {address}
            <br />
            {phone}
          </p>
        </div>
      ) : (
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FormField
            id="recipient"
            label="Recipient name"
            value={recipient}
            onChange={setRecipient}
          />
          <FormField
            id="address"
            label="Address"
            value={address}
            onChange={setAddress}
            multiline
          />
          <FormField
            id="phone"
            label="Phone"
            value={phone}
            onChange={setPhone}
          />

          {err ? (
            <p
              role="alert"
              className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
            >
              {err}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  multiline = false
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const inputClass =
    "w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none";
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}
