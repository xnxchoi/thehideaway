import { describe, expect, it } from "vitest";
import { canUpdateUserRoleField } from "./user-role-access";

describe("Users role field access", () => {
  it.each(["admin", "editor", "cofounder"])(
    "allows an active %s after collection-level target checks",
    (role) => {
      expect(
        canUpdateUserRoleField({
          req: { context: {}, user: { role, banned: false } }
        } as never)
      ).toBe(true);
    }
  );

  it("denies ordinary and banned staff users", () => {
    expect(
      canUpdateUserRoleField({
        req: { context: {}, user: { role: "author", banned: false } }
      } as never)
    ).toBe(false);
    expect(
      canUpdateUserRoleField({
        req: { context: {}, user: { role: "editor", banned: true } }
      } as never)
    ).toBe(false);
  });

  it("allows trusted internal updates", () => {
    expect(
      canUpdateUserRoleField({
        req: { context: { overrideAccess: true }, user: null }
      } as never)
    ).toBe(true);
  });
});
