"use client";

import { useFormModified } from "@payloadcms/ui";
import { useEffect, useRef } from "react";

const DEV_LEAVE_DEBOUNCE_MS = 100;

// Toggle: when true, dev swaps Payload's LeaveWithoutSaving for a throttled
// beforeunload-only guard. HMR full reloads during edits otherwise spam dozens
// of native "Leave site?" modals in rapid succession.
export const IS_DEV_LEAVE_DEBOUNCE_ENABLED =
  process.env.NODE_ENV === "development";

export function DevThrottledLeaveGuard() {
  const modified = useFormModified();
  const lastPromptRef = useRef(0);

  useEffect(() => {
    if (!modified) return;

    const handler = (event: BeforeUnloadEvent) => {
      const now = Date.now();
      if (now - lastPromptRef.current < DEV_LEAVE_DEBOUNCE_MS) return;
      lastPromptRef.current = now;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [modified]);

  return null;
}
