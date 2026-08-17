"use client";

import { useState } from "react";
import { RPage } from "src/components/UX/Transition";
import { TicketBottomBar } from "src/components/UX/Ticket/TicketBottomBar";
import { TextBlurIn } from "src/components/UX/Tour/TextBlurIn";
import { MotionPillButton } from "src/components/core/Button";
import { SPRING_EASE } from "src/constants/animations";
import { cn } from "src/lib/utils";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";

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
      <section className="relative z-[100] mx-auto w-full max-w-7xl px-6 pt-16 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
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
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <m.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="mb-4 block font-mono text-5xl"
      >
        ○
      </m.span>
      <p className="text-base font-light text-foreground/70">
        This page is for attendees only.
      </p>
      <p className="mt-1.5 max-w-md font-mono text-[11px] text-muted-foreground/50">
        Only people who were checked in at {eventName} can see this content.
      </p>
    </m.div>
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
    <m.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        ...SPRING_EASE.power3.out,
        visualDuration: 0.55
      }}
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20"
    >
      <div>
        {dateDisplay ? (
          <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
            {dateDisplay}
            {eventLocation ? ` · ${eventLocation}` : ""}
          </p>
        ) : null}

        <TextBlurIn
          as="h1"
          text={eventName}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.5rem)" }}
          className="mt-3 leading-[1.1] font-light tracking-tight"
          stagger={0.04}
          delay={0.15}
          yOffset={6}
          blurAmount={6}
          duration={0.75}
        />

        <div className="mt-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            From the night
          </p>
          {exclusiveLinks.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:gap-3">
              {exclusiveLinks.map((l, i) => (
                <m.li
                  key={l.url}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3 + i * 0.06,
                    type: "spring",
                    ...SPRING_EASE.power2.out
                  }}
                >
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group relative flex items-center justify-between gap-4 rounded-lg px-4 py-3.5 transition-colors",
                      "bg-foreground/[0.025] dark:bg-foreground/[0.03]",
                      "hover:bg-foreground/[0.05] dark:hover:bg-foreground/[0.07]"
                    )}
                  >
                    <span className="text-sm font-light tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
                      {l.label}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase transition-colors group-hover:text-muted-foreground/80">
                      {l.type === "form" ? "Form →" : "Open →"}
                    </span>
                  </a>
                </m.li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 max-w-md font-mono text-[11px] text-muted-foreground/50">
              No photos, recordings, or messages are available.
            </p>
          )}
        </div>
      </div>

      {goodsDropEnabled && ticketId ? (
        <m.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <DeliveryForm
            ticketId={ticketId}
            existingDelivery={existingDelivery}
          />
        </m.aside>
      ) : null}
    </m.div>
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
    <div
      className={cn(
        "relative rounded-2xl p-6 xl:p-8",
        "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
        "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/55 uppercase">
        Goods drop
      </p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
        Tell us where to send your free goods.
      </p>

      <AnimatePresence mode="wait">
        {submitted ? (
          <m.div
            key="submitted"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative mt-6 rounded-lg px-4 py-4",
              "bg-foreground/[0.025] dark:bg-foreground/[0.03]"
            )}
          >
            <p className="font-mono text-[11px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
              Address received
            </p>
            <p className="mt-3 text-sm leading-relaxed font-light text-foreground/80">
              {recipient}
              <br />
              {address}
              <br />
              {phone}
            </p>
          </m.div>
        ) : (
          <m.form
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
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
              <m.p
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
              >
                {err}
              </m.p>
            ) : null}

            <MotionPillButton
              type="submit"
              size="md"
              disabled={busy}
              className="w-full bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Submit"}
            </MotionPillButton>
          </m.form>
        )}
      </AnimatePresence>
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
