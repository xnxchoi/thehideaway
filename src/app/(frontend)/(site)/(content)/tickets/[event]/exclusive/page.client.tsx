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

const PAGE_CONTAINER: React.CSSProperties = {
  width: "100%",
  maxWidth: "var(--maxContainerWidth, 1440px)"
};

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
      <div
        className="mx-auto px-6 pt-12 pb-32 sm:px-10 lg:px-16 2xl:px-20"
        style={PAGE_CONTAINER}
      >
        <Link
          href="/tickets/my"
          className="mb-10 inline-block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
        >
          ← My tickets
        </Link>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          You had to be there
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight xl:text-3xl">
          This page is for attendees only.
        </h1>
        <p
          className="mt-3 font-mono text-[11px] text-muted-foreground/60"
          style={{ width: "min(60ch, 100%)" }}
        >
          Only people who were checked in at {eventName} can see this content.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto px-6 pt-12 pb-24 sm:px-10 lg:px-16 2xl:px-20"
      style={PAGE_CONTAINER}
    >
      <Link
        href="/tickets/my"
        className="mb-10 inline-block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
      >
        ← My tickets
      </Link>

      <header className="border-b border-border/20 pb-10">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          You were there
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-5xl 2xl:text-6xl">
          {eventName}
        </h1>
        {dateDisplay ? (
          <p className="mt-4 font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
            {dateDisplay}
            {eventLocation ? ` · ${eventLocation}` : ""}
          </p>
        ) : null}
      </header>

      <div className="grid gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16 xl:gap-20 mt-12">
        <section>
          {exclusiveLinks.length > 0 ? (
            <>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                From the night
              </p>
              <ul
                className="mt-4 grid gap-3 xl:gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"
                }}
              >
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 font-mono text-5xl opacity-10">○</span>
              <p className="text-base font-light text-foreground/70">
                Nothing posted yet
              </p>
              <p
                className="mt-1.5 font-mono text-[11px] text-muted-foreground/50"
                style={{ width: "min(40ch, 100%)" }}
              >
                Photos, recordings, and messages from the night will appear here
                when ready.
              </p>
            </div>
          )}
        </section>

        {goodsDropEnabled && ticketId ? (
          <aside className="lg:sticky lg:top-24 lg:self-start">
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
                    className="w-full border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
                  >
                    {busy ? "Submitting…" : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
