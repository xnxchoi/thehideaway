"use client";

import { useEffect } from "react";

import { LOST_PENDING_PAYMENT_STORAGE_KEY } from "@/lib/lost-commerce/payment-recovery";

export function ClearPendingProductPayment() {
  useEffect(() => {
    sessionStorage.removeItem(LOST_PENDING_PAYMENT_STORAGE_KEY);
  }, []);
  return null;
}
