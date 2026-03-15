"use client";

import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";

// ─── Registration Tour ────────────────────────────────────────────────────────

export type RegistrationStep =
  | "welcome"
  | "identity"   // firstName + lastName (required)
  | "bio"        // bio textarea (optional)
  | "details"    // location + link (optional)
  | "complete";

export type PendingFields = {
  needsIdentity: boolean; // firstName or lastName missing
};

const REG_STEPS: RegistrationStep[] = [
  "welcome",
  "identity",
  "bio",
  "details",
  "complete",
];

// ─── Interface Guide ──────────────────────────────────────────────────────────

export type TourTarget = {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  placement?: "top" | "bottom" | "left" | "right";
};

export const INTERFACE_TARGETS: TourTarget[] = [
  {
    id: "side-drawer",
    label: "Side Panel",
    description: "Quick access to navigation and your music player.",
    shortcut: "⌘B",
    placement: "right",
  },
  {
    id: "controlbar",
    label: "Control Bar",
    description: "Search, switch themes, and manage your session.",
    shortcut: "⌘K",
    placement: "top",
  },
  {
    id: "side-notch",
    label: "Edge Notch",
    description: "Peek the side panel without fully opening it.",
    placement: "right",
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export type TourStore = {
  // registration
  regActive: boolean;
  regStep: RegistrationStep;
  regSteps: RegistrationStep[];
  regPending: PendingFields;
  regSubmitting: boolean;
  regDismissed: boolean;

  openRegistrationTour: (pending: PendingFields) => void;
  closeRegistrationTour: () => void;
  dismissRegistrationTour: () => void;
  regNext: () => void;
  regPrev: () => void;
  regGoTo: (step: RegistrationStep) => void;
  setRegSubmitting: (v: boolean) => void;

  // interface guide
  ifActive: boolean;
  ifIndex: number;
  ifTargets: TourTarget[];

  openInterfaceTour: () => void;
  closeInterfaceTour: () => void;
  ifNext: () => void;
  ifPrev: () => void;
  ifGoTo: (index: number) => void;
};

export const createTourStore = () =>
  createStore<TourStore>()(
    subscribeWithSelector((set, get) => ({
      // ── Registration ──────────────────────────────────────────────────────
      regActive: false,
      regStep: "welcome",
      regSteps: REG_STEPS,
      regPending: { needsIdentity: false },
      regSubmitting: false,
      regDismissed: false,

      openRegistrationTour: (pending) =>
        set({
          regActive: true,
          regDismissed: false,
          regStep: "welcome",
          regSteps: REG_STEPS,
          regPending: pending,
        }),

      closeRegistrationTour: () => set({ regActive: false }),

      dismissRegistrationTour: () =>
        set({ regActive: false, regDismissed: true }),

      regNext: () => {
        const { regSteps, regStep } = get();
        const i = regSteps.indexOf(regStep);
        if (i < regSteps.length - 1) set({ regStep: regSteps[i + 1] });
      },

      regPrev: () => {
        const { regSteps, regStep } = get();
        const i = regSteps.indexOf(regStep);
        if (i > 0) set({ regStep: regSteps[i - 1] });
      },

      regGoTo: (step) => set({ regStep: step }),

      setRegSubmitting: (v) => set({ regSubmitting: v }),

      // ── Interface Guide ───────────────────────────────────────────────────
      ifActive: false,
      ifIndex: 0,
      ifTargets: INTERFACE_TARGETS,

      openInterfaceTour: () => set({ ifActive: true, ifIndex: 0 }),

      closeInterfaceTour: () => set({ ifActive: false, ifIndex: 0 }),

      ifNext: () => {
        const { ifIndex, ifTargets } = get();
        if (ifIndex < ifTargets.length - 1) set({ ifIndex: ifIndex + 1 });
        else get().closeInterfaceTour();
      },

      ifPrev: () => {
        const { ifIndex } = get();
        if (ifIndex > 0) set({ ifIndex: ifIndex - 1 });
      },

      ifGoTo: (index) =>
        set({
          ifIndex: Math.max(0, Math.min(index, INTERFACE_TARGETS.length - 1)),
        }),
    }))
  );
