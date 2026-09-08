import { describe, expect, it } from "vitest";
import { SIGN_UP_FIELDS } from "./sign-up-fields";

describe("sign-up fields", () => {
  it("does not treat email or password as additional fields", () => {
    expect(SIGN_UP_FIELDS).not.toContain("email");
    expect(SIGN_UP_FIELDS).not.toContain("password");
    expect(SIGN_UP_FIELDS).toContain("name");
  });
});
