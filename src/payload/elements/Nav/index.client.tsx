"use client";

import type { groupNavItems } from "@payloadcms/ui/shared";
import type { NavPreferences } from "payload";

import { getTranslation } from "@payloadcms/translations";
import {
  BrowseByFolderButton,
  NavGroup,
  useConfig,
  useTranslation
} from "@payloadcms/ui";
import { EntityType } from "@payloadcms/ui/shared";
import { usePathname } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React, { Fragment } from "react";
import { Link } from "@/components/UX/Link/Link";
const baseClass = "nav";

/**
 * @internal
 */
export const DefaultNavClient: React.FC<{
  groups: ReturnType<typeof groupNavItems>;
  navPreferences: NavPreferences;
}> = ({ groups, navPreferences }) => {
  const pathname = usePathname();

  const {
    config: {
      admin: {
        routes: { browseByFolder: foldersRoute }
      },
      folders,
      routes: { admin: adminRoute }
    }
  } = useConfig();

  const { i18n } = useTranslation();

  const folderURL = formatAdminURL({
    adminRoute,
    path: foldersRoute
  });

  const viewingRootFolderView = pathname.startsWith(folderURL);

  return (
    <Fragment>
      {folders && folders.browseByFolder && (
        <BrowseByFolderButton active={viewingRootFolderView} />
      )}
      {groups.map(({ entities, label }, key) => {
        return (
          <NavGroup
            isOpen={navPreferences?.groups?.[label]?.open}
            key={key}
            label={label}
          >
            {entities.map(({ slug, type, label }, i) => {
              const href =
                type === EntityType.collection
                  ? formatAdminURL({
                      adminRoute,
                      path: `/collections/${slug}`
                    })
                  : formatAdminURL({ adminRoute, path: `/globals/${slug}` });
              const id =
                type === EntityType.collection
                  ? `nav-${slug}`
                  : `nav-global-${slug}`;

              const isActive =
                pathname.startsWith(href) &&
                ["/", undefined].includes(pathname[href.length]);

              const Label = (
                <>
                  {isActive && (
                    <div className={`${baseClass}__link-indicator`} />
                  )}
                  <span className={`${baseClass}__link-label`}>
                    {getTranslation(label, i18n)}
                  </span>
                </>
              );

              // If the URL matches the link exactly
              if (pathname === href) {
                return (
                  <div className={`${baseClass}__link`} id={id} key={i}>
                    {Label}
                  </div>
                );
              }

              return (
                <Link
                  className={`${baseClass}__link`}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={false}
                >
                  {Label}
                </Link>
              );
            })}
          </NavGroup>
        );
      })}
    </Fragment>
  );
};
