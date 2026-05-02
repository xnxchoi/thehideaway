"use client";

import { useState } from "react";
import Link from "next/link";

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
  eventDate,
  eventLocation,
  isAttendee,
  exclusiveLinks,
  goodsDropEnabled,
  ticketId,
  existingDelivery
}: Props) {
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

  const submit = async () => {
    if (!ticketId || busy) return;
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

  if (!isAttendee) {
    return (
      <main className="mx-auto max-w-md px-6 py-32" data-theme="dark">
        <Link
          href="/tickets/my"
          className="mb-10 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
        >
          ← My tickets
        </Link>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          You had to be there
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight">
          This page is for attendees only.
        </h1>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          Only people who were checked in at {eventName} can see this content.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-24" data-theme="dark">
      <Link
        href="/tickets/my"
        className="mb-10 inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
      >
        ← My tickets
      </Link>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        You were there
      </p>
      <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-4xl">
        {eventName}
      </h1>
      {dateDisplay ? (
        <p className="mt-4 font-mono text-[11px] tracking-widest text-foreground/70 uppercase">
          {dateDisplay}
          {eventLocation ? ` · ${eventLocation}` : ""}
        </p>
      ) : null}

      {exclusiveLinks.length > 0 ? (
        <section className="mt-12 border-t border-border/20 pt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            From the night
          </p>
          <ul className="mt-4 space-y-3">
            {exclusiveLinks.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-sm border border-border/20 px-5 py-4 transition-colors hover:border-border/50"
                >
                  <p className="text-sm font-light tracking-tight">{l.label}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                    {l.type === "form" ? "Form →" : "Open →"}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {goodsDropEnabled && ticketId ? (
        <section className="mt-12 border-t border-border/20 pt-8">
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
              <div>
                <label
                  htmlFor="recipient"
                  className="mb-1 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase"
                >
                  Recipient name
                </label>
                <input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="mb-1 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase"
                >
                  Phone
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
                />
              </div>

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
                className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
              >
                {busy ? "Submitting…" : "Submit"}
              </button>
            </form>
          )}
        </section>
      ) : null}
    </main>
  );
}
