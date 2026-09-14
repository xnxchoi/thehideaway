import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPortOneSdk } from "./portone-sdk";
class Script extends EventTarget {
  src = "";
  async = false;
  dataset: Record<string, string> = {};
  remove() {
    scripts = scripts.filter((script) => script !== this);
  }
}
let scripts: Script[];
beforeEach(() => {
  scripts = [];
  vi.useFakeTimers();
  vi.stubGlobal("window", {});
  vi.stubGlobal("document", {
    querySelector: () => scripts[0] ?? null,
    createElement: () => new Script(),
    head: { appendChild: (script: Script) => scripts.push(script) }
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("PortOne SDK loading", () => {
  it("removes a failed script and succeeds on an explicit retry", async () => {
    const first = loadPortOneSdk("v2");
    const rejected = expect(first).rejects.toThrow("portone-sdk-unavailable");
    scripts[0].dispatchEvent(new Event("error"));
    await rejected;
    expect(scripts).toHaveLength(0);
    const retry = loadPortOneSdk("v2");
    expect(scripts).toHaveLength(1);
    window.PortOne = { requestPayment: vi.fn() };
    scripts[0].dispatchEvent(new Event("load"));
    await expect(retry).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("bounds a load which never fires an event and permits retry", async () => {
    const pending = loadPortOneSdk("v2");
    const rejected = expect(pending).rejects.toThrow("portone-sdk-unavailable");
    await vi.advanceTimersByTimeAsync(15000);
    await rejected;
    expect(scripts).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects a loaded script which did not register requestPayment", async () => {
    const pending = loadPortOneSdk("v2");
    const rejected = expect(pending).rejects.toThrow("portone-sdk-unavailable");
    scripts[0].dispatchEvent(new Event("load"));
    await rejected;
    expect(scripts).toHaveLength(0);
  });
});
