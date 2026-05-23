import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./page.client.tsx", import.meta.url), {
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
    getFunctionSource("CredentialStep"),
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

  it("keeps RSVP steps in a single-column tour flow", () => {
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
    expect(source).toContain('advanceTo("reserve")');
    expect(source).toContain("void refetchPasskeys?.()");
  });

  it("uses browser-recognizable fields for the one-time password save step", () => {
    const credentialSource = getFunctionSource("CredentialStep");
    const storeIndex = source.indexOf("await storePasswordCredential");
    const busyIndex = source.indexOf("setCredentialBusy(true)");
    expect(credentialSource).toContain('name="username"');
    expect(credentialSource).toContain('autoComplete="username"');
    expect(credentialSource).toContain('name="password"');
    expect(credentialSource).toContain('autoComplete="new-password"');
    expect(credentialSource).toContain('type="text"');
    expect(credentialSource).toContain("copyPassword");
    expect(source).toContain("authClient.signIn.email");
    expect(source).toContain("fetchOptions: { throw: true }");
    expect(credentialSource).not.toContain(
      'type={revealed ? "text" : "password"}'
    );
    expect(credentialSource).toContain("onContinue");
    expect(storeIndex).toBeGreaterThan(-1);
    expect(busyIndex).toBeGreaterThan(storeIndex);
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

  it("asks for the bank sender name before purchase", () => {
    const reserveSource = getFunctionSource("ReserveView");

    expect(source).toContain("sender_name");
    expect(reserveSource).toContain('t("senderLabel")');
    expect(reserveSource).toContain('t("senderHint")');
    expect(reserveSource).toContain('t("senderPlaceholder")');
    expect(reserveSource).toContain("!senderName.trim()");
  });
});
