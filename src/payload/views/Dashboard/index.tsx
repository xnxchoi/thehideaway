/**
 * Interim /vault home: Drafts / Recent / Locked queues.
 * Bird's-eye dashboard (views, comments, likes, reader, tier, subscription)
 * is deferred until admin is end-to-end functional. See readmes/VAULT.md.
 */
import type { groupNavItems } from "@payloadcms/ui/shared";
import type {
  AdminViewServerPropsOnly,
  ClientUser,
  CollectionSlug,
  Locale,
  Payload
} from "payload";

import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";

import {
  formatWorkDate,
  loadVaultHomeCatalog,
  readVaultHomeString,
  vaultHomeLocale,
  type VaultWorkRow
} from "./home";
import { loadVaultHomeWork } from "./work";
import "./index.scss";

const baseClass = "rp-vault-home";

export type DashboardViewClientProps = {
  locale: Locale;
};

export type DashboardViewServerPropsOnly = {
  globalData: Array<{
    data: {
      _isLocked: boolean;
      _lastEditedAt: string;
      _userEditing: ClientUser | number | string;
    };
    lockDuration?: number;
    slug: string;
  }>;
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: ComponentType;
  navGroups?: ReturnType<typeof groupNavItems>;
} & AdminViewServerPropsOnly;

export type DashboardViewServerProps = DashboardViewClientProps &
  DashboardViewServerPropsOnly;

export async function DefaultDashboard(props: DashboardViewServerProps) {
  const { initPageResult, payload, user } = props;
  if (!user) {
    return redirect("/check-in");
  }

  const adminRoute = payload.config.routes.admin;
  const req = initPageResult?.req;
  const locale = vaultHomeLocale(
    props.locale?.code ?? initPageResult?.locale?.code
  );
  const catalog = await loadVaultHomeCatalog(locale);
  const t = (key: string) => readVaultHomeString(catalog, key);
  const work = await loadVaultHomeWork({
    adminRoute,
    find: async (args) => {
      const result = await payload.find({
        collection: args.collection as CollectionSlug,
        depth: args.depth,
        draft: args.draft,
        limit: args.limit,
        overrideAccess: args.overrideAccess,
        req,
        select: args.select,
        sort: args.sort,
        user: req?.user ?? user,
        where: args.where
      } as Parameters<Payload["find"]>[0]);
      return { docs: result.docs as Record<string, unknown>[] };
    },
    user: req?.user ?? user
  });

  return (
    <div className={baseClass}>
      <h1 className={`${baseClass}__title`}>{t("title")}</h1>
      {work.errors.length > 0 ? (
        <p className={`${baseClass}__error`} role="alert">
          {t("loadError")}
        </p>
      ) : null}
      <div className={`${baseClass}__bays`}>
        <WorkSection
          empty={t("emptyDrafts")}
          heading={t("drafts")}
          rows={work.drafts}
          showStatus
          t={t}
        />
        <WorkSection
          empty={t("emptyRecent")}
          heading={t("recent")}
          rows={work.recent}
          showStatus
          t={t}
        />
        <WorkSection
          empty={t("emptyLocked")}
          heading={t("locked")}
          rows={work.locked}
          showLockedBy
          t={t}
        />
      </div>
    </div>
  );
}

function WorkSection({
  empty,
  heading,
  rows,
  showLockedBy,
  showStatus,
  t
}: {
  empty: string;
  heading: string;
  rows: VaultWorkRow[];
  showLockedBy?: boolean;
  showStatus?: boolean;
  t: (key: string, values?: { collection?: string }) => string;
}) {
  const columnCount = 3 + (showStatus ? 1 : 0) + (showLockedBy ? 1 : 0);
  const headingId = `${baseClass}-${heading.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className={`${baseClass}__section`} aria-labelledby={headingId}>
      <h2 className={`${baseClass}__heading`} id={headingId}>
        {heading}
      </h2>
      <table aria-labelledby={headingId}>
        <thead>
          <tr>
            <th scope="col">{t("columns.title")}</th>
            <th scope="col">{t("columns.collection")}</th>
            {showStatus ? <th scope="col">{t("columns.status")}</th> : null}
            {showLockedBy ? <th scope="col">{t("columns.lockedBy")}</th> : null}
            <th scope="col">{t("columns.updated")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={`${baseClass}__empty`} colSpan={columnCount}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${row.collection}-${row.id}`}>
                <td>
                  <Link className={`${baseClass}__row-link`} href={row.href}>
                    <span className={`${baseClass}__row-title`}>{row.title}</span>
                  </Link>
                </td>
                <td>{t(`collections.${row.collection}`)}</td>
                {showStatus ? (
                  <td>{row.status ? t(`status.${row.status}`) : ""}</td>
                ) : null}
                {showLockedBy ? <td>{row.lockedBy ?? ""}</td> : null}
                <td>{formatWorkDate(row.updatedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
