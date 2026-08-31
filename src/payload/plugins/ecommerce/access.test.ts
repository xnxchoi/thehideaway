import { describe, expect, it } from "vitest";

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
  isEcommerceAdmin
} from "./access";

function accessArgs(role: string | null, id = "user-1") {
  return {
    req: {
      user: role ? { id, role } : null
    }
  };
}

describe("ecommerce access adapters", () => {
  it("treats locker admin as plugin admin", () => {
    expect(isEcommerceAdmin(accessArgs("admin") as never)).toBe(true);
    expect(isEcommerceAdmin(accessArgs("editor") as never)).toBe(false);
    expect(isEcommerceAdmin(accessArgs("user") as never)).toBe(false);
    expect(isEcommerceAdmin(accessArgs(null) as never)).toBe(false);
  });

  it("treats any logged-in user as authenticated", () => {
    expect(isAuthenticated(accessArgs("user") as never)).toBe(true);
    expect(isAuthenticated(accessArgs("admin") as never)).toBe(true);
    expect(isAuthenticated(accessArgs(null) as never)).toBe(false);
  });

  it("treats authenticated non-admins as customers", () => {
    expect(isCustomer(accessArgs("user") as never)).toBe(true);
    expect(isCustomer(accessArgs("resident") as never)).toBe(true);
    expect(isCustomer(accessArgs("admin") as never)).toBe(false);
    expect(isCustomer(accessArgs(null) as never)).toBe(false);
  });

  it("lets admins read any document and owners read their own via customer", () => {
    expect(isDocumentOwner(accessArgs("admin") as never)).toBe(true);
    expect(isDocumentOwner(accessArgs("user", "cust-9") as never)).toEqual({
      customer: { equals: "cust-9" }
    });
    expect(isDocumentOwner(accessArgs(null) as never)).toBe(false);
  });

  it("lets admins bypass published status and otherwise requires published", () => {
    expect(adminOrPublishedStatus(accessArgs("admin") as never)).toBe(true);
    expect(adminOrPublishedStatus(accessArgs("user") as never)).toEqual({
      _status: { equals: "published" }
    });
    expect(adminOrPublishedStatus(accessArgs(null) as never)).toEqual({
      _status: { equals: "published" }
    });
  });

  it("limits field-level admin access to admins", () => {
    expect(adminOnlyFieldAccess(accessArgs("admin") as never)).toBe(true);
    expect(adminOnlyFieldAccess(accessArgs("user") as never)).toBe(false);
  });
});
