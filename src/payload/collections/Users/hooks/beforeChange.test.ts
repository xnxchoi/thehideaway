import { describe, expect, it } from "vitest";
import { beforeChangeUsers } from "./beforeChange";

const originalDoc = {
  firstName: "Original",
  lastName: "Member",
  name: "Original Member"
};

describe("Users name synchronization", () => {
  it("keeps name aligned when first or last name changes", async () => {
    await expect(
      beforeChangeUsers({
        operation: "update",
        originalDoc,
        data: { firstName: "Updated" }
      } as never)
    ).resolves.toMatchObject({
      firstName: "Updated",
      lastName: "Member",
      name: "Updated Member"
    });
  });

  it("preserves submitted non-name fields without mutating the input", async () => {
    const data = { bio: "New bio" };

    const result = await beforeChangeUsers({
      operation: "update",
      originalDoc,
      data
    } as never);

    expect(result).toMatchObject({
      bio: "New bio",
      firstName: "Original",
      lastName: "Member",
      name: "Original Member"
    });
    expect(data).toEqual({ bio: "New bio" });
  });
});
