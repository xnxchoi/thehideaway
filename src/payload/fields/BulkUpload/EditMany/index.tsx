"use client";

import {
  Drawer,
  DrawerToggler,
  EditDepthProvider,
  useAuth,
  useTranslation
} from "@payloadcms/ui";
import type { ClientCollectionConfig } from "payload";
import { FC } from "react";

import { useFormsManager } from "../FormsManager/index";
import { EditManyBulkUploadsDrawerContent } from "./DrawerContent";
import "./index.scss";

export const baseClass = "edit-many-bulk-uploads";

export type EditManyBulkUploadsProps = {
  readonly collection: ClientCollectionConfig;
};

export const EditManyBulkUploads: FC<EditManyBulkUploadsProps> = (props) => {
  const { collection: { slug } = {}, collection } = props;

  const { permissions } = useAuth();

  const { t } = useTranslation();
  const { forms } = useFormsManager(); // Access forms managed in bulk uploads

  const collectionPermissions = permissions?.collections?.[slug!];
  const hasUpdatePermission = collectionPermissions?.update;

  const drawerSlug = `edit-${slug}-bulk-uploads`;

  if (!hasUpdatePermission) {
    return null;
  }

  return (
    <div className={baseClass}>
      <DrawerToggler
        aria-label={t("general:editAll")}
        className={`${baseClass}__toggle`}
        slug={drawerSlug}
      >
        {t("general:editAll")}
      </DrawerToggler>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <EditManyBulkUploadsDrawerContent
            collection={collection}
            drawerSlug={drawerSlug}
            forms={forms}
          />
        </Drawer>
      </EditDepthProvider>
    </div>
  );
};
