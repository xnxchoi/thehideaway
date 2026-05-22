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
    getFunctionSource("OtpStep"),
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

  it("uses a segmented OTP input for the verification code", () => {
    const otpSource = getFunctionSource("OtpStep");
    expect(otpSource).toContain("<InputOTP");
    expect(otpSource).toContain("<InputOTPSlot");
    expect(otpSource).toContain("maxLength={6}");
    expect(otpSource).not.toContain('id="otp-code"\n              type="text"');
  });
});
