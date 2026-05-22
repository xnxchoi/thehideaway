"use client";

import { useEffect } from "react";

export function DayNNightTicketRedirect() {
  useEffect(() => {
    window.location.replace("/day-n-night");
  }, []);

  return null;
}
