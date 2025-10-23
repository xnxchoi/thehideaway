import type { EntityToGroup } from "@payloadcms/ui/shared";
import type { NavGroupPreferences, PayloadRequest, ServerProps } from "payload";

import { Logout } from "@payloadcms/ui";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import { EntityType, groupNavItems } from "@payloadcms/ui/shared";
import React from "react";

import { NavWrapper } from "./NavWrapper/index";

const baseClass = "nav";

import { getNavPrefs } from "./getNavPrefs";
import { DefaultNavClient } from "./index.client";

export type NavProps = {
  req?: PayloadRequest;
} & ServerProps;

export const DefaultNav: React.FC<NavProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities
  } = props;

  if (!payload?.config || !req || !permissions || !visibleEntities) {
    return null;
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks, logout }
    },
    collections,
    globals
  } = payload.config;

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection
            }) satisfies EntityToGroup
        ),
      ...globals
        .filter(({ slug }) => visibleEntities.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global
            }) satisfies EntityToGroup
        )
    ],
    permissions,
    i18n
  );

  const navPreferences = (await getNavPrefs(req)) || {
    open: false,
    groups: groups.reduce((prev, current) => {
      if (current.label) {
        return {
          ...prev,
          [current.label]: { open: true }
        };
      }
      return { ...prev };
    }, {} as NavGroupPreferences)
  };

  const LogoutComponent = RenderServerComponent({
    clientProps: {
      documentSubViewType,
      viewType
    },
    Component: logout?.Button,
    Fallback: Logout,
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user
    }
  });

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType
          },
          Component: beforeNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user
          }
        })}
        <DefaultNavClient groups={groups} navPreferences={navPreferences} />
        {RenderServerComponent({
          clientProps: {
            documentSubViewType,
            viewType
          },
          Component: afterNavLinks,
          importMap: payload.importMap,
          serverProps: {
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user
          }
        })}
        <div className={`${baseClass}__controls`}>{LogoutComponent}</div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <svg
            aria-hidden={true}
            role="graphics-symbol"
            viewBox={"0 0 20 20"}
            style={{
              width: 22,
              height: 22,
              display: "block",
              fill: "oklch(var(--faded-fg)/1)",
              flexShrink: 0
            }}
          >
            <path d="M2.275 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 5m0 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 10m.625 4.375a.625.625 0 1 0 0 1.25h14.2a.625.625 0 1 0 0-1.25z"></path>
          </svg>
        </div>
      </div>
    </NavWrapper>
  );
};
