"use client";

import { useSyncExternalStore } from "react";
import type { TransitionDecision } from "./pageGroups";

export type TransitionDevEntry = {
  id: string;
  ts: number;
  fromHref: string;
  toHref: string;
  decision: TransitionDecision;
};

const MAX_ENTRIES = 25;

let entries: TransitionDevEntry[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function recordTransitionDecision(input: {
  fromHref: string;
  toHref: string;
  decision: TransitionDecision;
}): void {
  const next: TransitionDevEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    ts: Date.now(),
    fromHref: input.fromHref,
    toHref: input.toHref,
    decision: input.decision
  };
  entries = [next, ...entries].slice(0, MAX_ENTRIES);
  emit();
}

export function clearTransitionDevHistory(): void {
  entries = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TransitionDevEntry[] {
  return entries;
}

const EMPTY: TransitionDevEntry[] = [];
function getServerSnapshot(): TransitionDevEntry[] {
  return EMPTY;
}

export function useTransitionDevHistory(): TransitionDevEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
