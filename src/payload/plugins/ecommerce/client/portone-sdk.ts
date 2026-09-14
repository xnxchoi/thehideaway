declare global {
  interface Window {
    PortOne?: { requestPayment?: (payload: unknown) => Promise<unknown> };
  }
}

/** Failed and timed-out loads are removed so an explicit retry can create a fresh script. */
export function loadPortOneSdk(sdkVersion: "v2" | "global"): Promise<void> {
  if (window.PortOne?.requestPayment) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-portone-sdk="${sdkVersion}"]`
    );
    const script = existing ?? document.createElement("script");
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
    };
    const failed = () => {
      cleanup();
      script.remove();
      reject(new Error("portone-sdk-unavailable"));
    };
    const loaded = () => {
      if (!window.PortOne?.requestPayment) {
        failed();
        return;
      }
      cleanup();
      resolve();
    };
    const timeout = setTimeout(failed, 15_000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (!existing) {
      script.src =
        sdkVersion === "v2"
          ? "https://cdn.portone.io/v2/browser-sdk.js"
          : "https://cdn.portone.cloud/global-sdk/v1/portone.js";
      script.async = true;
      script.dataset.portoneSdk = sdkVersion;
      document.head.appendChild(script);
    }
  });
}
