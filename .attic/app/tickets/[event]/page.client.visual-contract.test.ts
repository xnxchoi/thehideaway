import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.client.tsx", import.meta.url), {
  encoding: "utf8"
});
const actionSource = readFileSync(new URL("./actions.ts", import.meta.url), {
  encoding: "utf8"
});

const getFunctionSource = (name: string) => {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) throw new Error(`Missing function ${name}`);
  const nextFunction = source.indexOf("\nfunction ", start + 1);
  return source.slice(
    start,
    nextFunction === -1 ? source.length : nextFunction
  );
};

describe("Day n Night RSVP visual contract", () => {
  const stageSource = getFunctionSource("DayNNightRsvpStage");
  const stepSources = [
    getFunctionSource("ContactStep"),
    getFunctionSource("PasskeyStep"),
    getFunctionSource("NameStep"),
    getFunctionSource("PurchasedView"),
    getFunctionSource("ReserveView")
  ].join("\n");

  it("does not use a grid texture in the RSVP stage", () => {
    expect(stageSource).not.toContain("repeating-linear-gradient");
    expect(stageSource).not.toContain("IMG_8543");
  });

  it("follows the RegistrationTour centered step stage", () => {
    expect(stageSource).toContain('perspective: "1500px"');
    expect(stageSource).toContain("max-w-[460px]");
    expect(stageSource).not.toContain("max-w-xl");
  });

  it("keeps RSVP steps in a compact tour flow", () => {
    expect(stepSources).not.toContain("lg:grid-cols");
    expect(stepSources).not.toContain("xl:grid-cols");
    expect(stepSources).toContain("flex w-full flex-col gap-8");
  });

  it("requires an explicit passkey step before reserve", () => {
    const passkeySource = getFunctionSource("PasskeyStep");
    expect(passkeySource).toContain(
      'useTranslations("Event.Rsvp.steps.passkey")'
    );
    expect(passkeySource).toContain("onCreate");
    expect(passkeySource).toContain("onContactSupport");
    expect(passkeySource).not.toContain("forgot-password");
  });

  it("moves to reserve after successful passkey verification", () => {
    expect(source).toContain("authClient.passkey.addPasskey");
    expect(source).toContain("setPasskeyCreated(true)");
    expect(source).toContain('advanceTo("reserve")');
    expect(source).not.toContain("setInterval");
    expect(source).not.toContain("void refetchPasskeys?.()");
  });

  it("uses browser-recognizable fields for user-created ticket passwords", () => {
    const contactSource = getFunctionSource("ContactStep");
    const storeIndex = source.indexOf("await storePasswordCredential");
    const signInIndex = source.indexOf("authClient.signIn.email");
    expect(contactSource).toContain('name="username"');
    expect(contactSource).toContain('autoComplete="username"');
    expect(contactSource).toContain('name="password"');
    expect(contactSource).toContain('autoComplete="new-password"');
    expect(contactSource).toContain('type="password"');
    expect(source).toContain("authClient.signIn.email");
    expect(source).toContain("fetchOptions: { throw: true }");
    expect(source).toContain("prepareDayNNightPurchaserAction");
    expect(storeIndex).toBeGreaterThan(-1);
    expect(storeIndex).toBeGreaterThan(signInIndex);
  });

  it("does not attach a new password to an existing account by email alone", () => {
    const existingGuardIndex = actionSource.indexOf("if (existing?.id)");
    const createUserIndex = actionSource.indexOf("payload.create");
    const hashIndex = actionSource.indexOf("hashPassword(input.password)");

    expect(actionSource).toContain('reason: "existing-account-login-required"');
    expect(existingGuardIndex).toBeGreaterThan(-1);
    expect(createUserIndex).toBeGreaterThan(existingGuardIndex);
    expect(hashIndex).toBeGreaterThan(existingGuardIndex);
  });

  it("separates first and last name before account creation", () => {
    const nameSource = getFunctionSource("NameStep");

    expect(nameSource).toContain('autoComplete="given-name"');
    expect(nameSource).toContain('autoComplete="family-name"');
    expect(nameSource).toContain('t("firstNameLabel")');
    expect(nameSource).toContain('t("lastNameLabel")');
    expect(source).toContain("firstName: purchaserFirstName.trim()");
    expect(source).toContain("lastName: purchaserLastName.trim()");
  });

  it("uses a support modal instead of direct support mailto links", () => {
    const contactSource = getFunctionSource("ContactStep");
    const passkeySource = getFunctionSource("PasskeyStep");
    const purchasedSource = getFunctionSource("PurchasedView");
    const supportModalSource = getFunctionSource("ContactSupportModal");
    const combinedSupportButtons = [
      contactSource,
      passkeySource,
      purchasedSource
    ].join("\n");

    expect(combinedSupportButtons).toContain("onContactSupport");
    expect(combinedSupportButtons).not.toContain("supportHref");
    expect(supportModalSource).toContain("CONTACT_CHANNELS.map");
    expect(source).toContain("tel:+821046379289");
    expect(source).toContain("tel:+821025296700");
    expect(source).toContain("mailto:seanschoi@hideawayseoul.com");
    expect(source).toContain("https://www.instagram.com/geekid/");
  });

  it("offers a Toss payment deep link with a copied transfer fallback", () => {
    const purchasedSource = getFunctionSource("PurchasedView");

    expect(source).toContain("buildTossPaymentHref");
    expect(source).toContain("supertoss://send?");
    expect(source).toContain("accountNo: BANK.accountNoDigits");
    expect(source).toContain("memo");
    expect(purchasedSource).toContain('data-testid="ticket-make-payment"');
    expect(purchasedSource).toContain("navigator.clipboard.writeText");
    expect(purchasedSource).toContain("paymentClipboardText");
    expect(purchasedSource).not.toContain('t("payment.memo")');
    expect(purchasedSource).toContain('t("payment.sender")');
  });

  it("lets purchasers mark the transfer as sent after payment", () => {
    const purchasedSource = getFunctionSource("PurchasedView");

    expect(source).toContain("/api/tickets/payment-submitted");
    expect(source).toContain("payment_submitted_at");
    expect(source).toContain("paymentSubmitBusy");
    expect(purchasedSource).toContain('data-testid="ticket-payment-submitted"');
    expect(purchasedSource).toContain(
      'data-testid="ticket-payment-photo-request"'
    );
    expect(purchasedSource).toContain('t("paymentSubmitted.cta")');
    expect(purchasedSource).toContain('t("paymentSubmitted.doneTitle")');
    expect(purchasedSource).toContain('t("paymentSubmitted.photoTitle")');
    expect(purchasedSource).toContain("onPaymentSubmitted");
    expect(purchasedSource).toContain("onContactSupport");
  });

  it("gives the Day n Night purchase screen a navigation rail after price", () => {
    const reserveSource = getFunctionSource("ReserveView");

    expect(source).toContain("const storyHref = useStepFlow ?");
    expect(reserveSource).toContain("navLinks");
    expect(reserveSource).toContain('aria-label={t("navigationLabel")}');
    expect(reserveSource).toContain('data-testid="reserve-nav-my-tickets"');
    expect(reserveSource).toContain('data-testid="reserve-nav-story"');
    expect(reserveSource).toContain('data-testid="reserve-nav-contact"');
    expect(reserveSource).toContain('t("nav.myTickets")');
    expect(reserveSource).toContain('t("nav.story")');
    expect(reserveSource).toContain('t("nav.contact")');
  });

  it("asks for the bank sender name before purchase", () => {
    const reserveSource = getFunctionSource("ReserveView");

    expect(source).toContain("sender_name");
    expect(reserveSource).toContain('t("senderLabel")');
    expect(reserveSource).toContain('t("senderHint")');
    expect(reserveSource).toContain('t("senderPlaceholder")');
    expect(reserveSource).toContain("!senderName.trim()");
  });
});
