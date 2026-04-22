"use client";

import { useMemo, type ReactNode } from "react";

import { useRegisterContextMenuContributor } from "../registry/ContributorRegistry";
import type { ContextMenuContributor, ImportFilter } from "../types";
import { clipboardContributor } from "./clipboard";
import {
  createSlashMenuImportContributor,
  type SlashMenuImportOptions
} from "./slashMenuImport";
import {
  createToolbarImportContributor,
  type ToolbarImportOptions
} from "./toolbarImport";
import { transformContributor } from "./transform";

/**
 * Props for `DefaultContributors`. Every default contributor can be opted out
 * of, and the auto-import contributors expose their filter config so consumers
 * can whitelist/blocklist specific keys or attach a predicate.
 */
export interface DefaultContributorsConfig {
  clipboard?: boolean;
  transform?: boolean;

  slashImport?:
    | boolean
    | (SlashMenuImportOptions & {
        /** Convenience alias for `filter`. */
        filter?: ImportFilter<unknown>;
      });

  toolbarImport?:
    | boolean
    | ToolbarImportOptions
    | ReadonlyArray<ToolbarImportOptions>;
}

const ALL_ENABLED: Required<DefaultContributorsConfig> = {
  clipboard: true,
  transform: true,
  slashImport: true,
  toolbarImport: true
};

export interface DefaultContributorsProviderProps extends DefaultContributorsConfig {
  children?: ReactNode;
}

function resolveContributors(
  config: DefaultContributorsConfig
): ContextMenuContributor[] {
  const cfg = { ...ALL_ENABLED, ...config };
  const list: ContextMenuContributor[] = [];

  if (cfg.clipboard) list.push(clipboardContributor);
  if (cfg.transform) list.push(transformContributor);

  if (cfg.slashImport) {
    const opts =
      cfg.slashImport === true
        ? {}
        : (cfg.slashImport as SlashMenuImportOptions);
    list.push(createSlashMenuImportContributor(opts));
  }

  if (cfg.toolbarImport) {
    const sources = Array.isArray(cfg.toolbarImport)
      ? cfg.toolbarImport
      : cfg.toolbarImport === true
        ? [{ source: "inline" as const }]
        : [cfg.toolbarImport as ToolbarImportOptions];
    for (const opts of sources) {
      list.push(createToolbarImportContributor(opts));
    }
  }

  return list;
}

/**
 * Renders hidden registrar components, one per default contributor. Each
 * `<Registrar>` calls `useRegisterContextMenuContributor`, which subscribes
 * on mount and unsubscribes on unmount — so toggling `clipboard: false`
 * (for instance) cleanly removes that contributor without affecting others.
 */
export function DefaultContributorsProvider({
  children,
  ...config
}: DefaultContributorsProviderProps) {
  const contributors = useMemo(
    () => resolveContributors(config),
    // Keys are order-stable and resolveContributors is pure; stringifying the
    // config is the cheapest stable dependency we can build here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(serializableConfig(config))]
  );

  return (
    <>
      {contributors.map((c) => (
        <Registrar key={c.id} contributor={c} />
      ))}
      {children}
    </>
  );
}

function Registrar({ contributor }: { contributor: ContextMenuContributor }) {
  useRegisterContextMenuContributor(contributor);
  return null;
}

/**
 * Strips function-valued keys from the config so it can be JSON-stringified
 * for memoization. Function identity is unstable across renders, so we
 * intentionally ignore it here — changes to filter predicates require
 * remounting the provider.
 */
function serializableConfig(config: DefaultContributorsConfig) {
  const clone: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "function") continue;
    if (v && typeof v === "object") {
      try {
        JSON.stringify(v);
        clone[k] = v;
      } catch {
        clone[k] = "[unserializable]";
      }
    } else {
      clone[k] = v;
    }
  }
  return clone;
}
