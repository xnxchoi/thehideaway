"use client";
import { createContext, useContext, type ReactNode } from "react";

const TransitionReadinessContext = createContext(false);

/** Startup readiness only: navigation transitions do not change this value. */
export function TransitionReadinessProvider({
  ready,
  children
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return (
    <TransitionReadinessContext.Provider value={ready}>
      {ready ? (
        children
      ) : (
        <div inert style={{ display: "contents" }}>
          {children}
        </div>
      )}
    </TransitionReadinessContext.Provider>
  );
}

export function useTransitionReady() {
  return useContext(TransitionReadinessContext);
}
