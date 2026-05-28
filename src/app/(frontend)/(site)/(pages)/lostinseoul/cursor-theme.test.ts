import { describe, expect, it } from "vitest";
import {
  getLostCursorSurfaceTheme,
  getLostPageCursorTheme,
  isLostCursorTheme,
  resolveLostCursorTheme
} from "./cursor-theme";

describe("lostinseoul cursor theme resolution", () => {
  it("keeps the cursor opposite the document theme by default", () => {
    expect(getLostPageCursorTheme("light")).toBe("dark");
    expect(getLostPageCursorTheme("dark")).toBe("light");
    expect(getLostPageCursorTheme(null)).toBe("light");
  });

  it("lets dark lostinseoul surfaces request a light cursor", () => {
    expect(
      resolveLostCursorTheme({
        bagOpen: false,
        pageTheme: "dark",
        pointTheme: "light",
        videoOpen: false
      })
    ).toBe("light");
  });

  it("keeps overlay states above point and page themes", () => {
    expect(
      resolveLostCursorTheme({
        bagOpen: true,
        pageTheme: "dark",
        pointTheme: "dark",
        videoOpen: false
      })
    ).toBe("light");
    expect(
      resolveLostCursorTheme({
        bagOpen: false,
        pageTheme: "dark",
        pointTheme: "dark",
        videoOpen: true
      })
    ).toBe("light");
  });

  it("guards dataset values before applying them to the cursor store", () => {
    expect(isLostCursorTheme("light")).toBe(true);
    expect(isLostCursorTheme("dark")).toBe(true);
    expect(isLostCursorTheme("paper")).toBe(false);
    expect(isLostCursorTheme(undefined)).toBe(false);
  });

  it("ignores the body-level cursor theme when looking for local surfaces", () => {
    expect(getLostCursorSurfaceTheme("light", false)).toBe("light");
    expect(getLostCursorSurfaceTheme("dark", false)).toBe("dark");
    expect(getLostCursorSurfaceTheme("light", true)).toBeNull();
    expect(getLostCursorSurfaceTheme("paper", false)).toBeNull();
  });
});
