"use client";
import type {
	ClientUser,
	Data,
	SanitizedCollectionConfig,
	SanitizedCollectionPermission,
	SanitizedGlobalPermission
} from "payload";

import {getTranslation} from "@payloadcms/translations";
import {formatAdminURL} from "payload/shared";
import {type FC, Fragment, type ReactNode, useEffect, useRef, useState} from "react";

import {
	Gutter,
	Locked,
	MoveDocToFolder,
	PreviewButton,
	RenderCustomComponent,
	SaveDraftButton,
	useConfig,
	useEditDepth,
	useFormInitializing,
	useFormProcessing,
	useTranslation
} from "@payloadcms/ui";

import {Button} from "@/components/ui/button";
import Link from "next/link";

import {useDomCursor} from "@/components/core/cursorWrapper";
import {cn} from "@/lib/utils";
import {Autosave} from "@/payload/elements/Autosave";
import {DeleteDocument} from "@/payload/elements/DeleteDocument";
import {DuplicateDocument} from "@/payload/elements/DuplicateDocument";
import {PublishButton} from "@/payload/elements/PublishButton/publishClient";
import {RestoreButton} from "@/payload/elements/RestoreButton";
import {RP_SaveButton} from "@/payload/elements/SaveButton/SaveClient";
import {Status} from "@/payload/elements/Status";
import {SidebarControls} from "@/payload/fields/SidebarControls/client";
import {useVaultSidebar} from "@/payload/providers/Admins";
import {Menu} from "@base-ui/react";
import {LivePreviewToggler} from "@payloadcms/ui/elements/LivePreview/Toggler";
import {PermanentlyDeleteButton} from "@payloadcms/ui/elements/PermanentlyDeleteButton";
import {formatDate} from "@payloadcms/ui/shared";
import {useLenis} from "lenis/react";
import {AnimatePresence} from "motion/react";
import type {
	DocumentDrawerContextType
} from "node_modules/@payloadcms/ui/dist/elements/DocumentDrawer/Provider";
import {
	useLivePreviewContext
} from "node_modules/@payloadcms/ui/dist/providers/LivePreview/context";
import {MenuArrow, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "../../components/Popover";
import {CopyLocaleData} from "../CopyLocaleData";
import "./index.scss";

const baseClass = "doc-controls";

export const DocumentControls: FC<{
  readonly apiURL: string;
  readonly BeforeDocumentControls?: ReactNode;
  readonly customComponents?: {
    readonly PreviewButton?: ReactNode;
    readonly PublishButton?: ReactNode;
    readonly SaveButton?: ReactNode;
    readonly SaveDraftButton?: ReactNode;
  };
  readonly data?: Data;
  readonly disableActions?: boolean;
  readonly disableCreate?: boolean;
  readonly EditMenuItems?: ReactNode;
  readonly hasPublishPermission?: boolean;
  readonly hasSavePermission?: boolean;
  readonly id?: number | string;
  readonly isAccountView?: boolean;
  readonly isEditing?: boolean;
  readonly isInDrawer?: boolean;
  readonly isTrashed?: boolean;
  readonly onDelete?: DocumentDrawerContextType["onDelete"];
  readonly onDrawerCreateNew?: () => void;
  /* Only available if `redirectAfterDuplicate` is `false` */
  readonly onDuplicate?: DocumentDrawerContextType["onDuplicate"];
  readonly onRestore?: DocumentDrawerContextType["onRestore"];
  readonly onSave?: DocumentDrawerContextType["onSave"];
  readonly onTakeOver?: () => void;
  readonly permissions:
    | null
    | SanitizedCollectionPermission
    | SanitizedGlobalPermission;
  readonly readOnlyForIncomingUser?: boolean;
  readonly redirectAfterDelete?: boolean;
  readonly redirectAfterDuplicate?: boolean;
  readonly redirectAfterRestore?: boolean;
  readonly slug: SanitizedCollectionConfig["slug"];
  readonly user?: ClientUser;
}> = (props) => {
  const {
    id,
    slug,
    BeforeDocumentControls,
    customComponents: {
      PreviewButton: CustomPreviewButton,
      PublishButton: CustomPublishButton,
      SaveButton: CustomSaveButton,
      SaveDraftButton: CustomSaveDraftButton
    } = {},
    data,
    disableActions,
    disableCreate,
    EditMenuItems,
    hasSavePermission,
    isAccountView,
    isEditing,
    isInDrawer,
    isTrashed,
    onDelete,
    onDrawerCreateNew,
    onDuplicate,
    onRestore,
    onTakeOver,
    permissions,
    readOnlyForIncomingUser,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    user
  } = props;
  const { onMouseEnter, onMouseLeave } = useDomCursor({});
  const { i18n, t } = useTranslation();
  const editDepth = useEditDepth();
  const hasSidebar = useVaultSidebar((r) => r.enabled);
  const { config, getEntityConfig } = useConfig();
  const lenis = useLenis();
  const collectionConfig = getEntityConfig({ collectionSlug: slug });

  const globalConfig = getEntityConfig({ globalSlug: slug });

  const { isLivePreviewEnabled } = useLivePreviewContext();

  const dateFormat = config.admin.dateFormat;
  const localization = config.localization;
  const adminRoute = config.routes.admin;
  // Settings these in state to avoid hydration issues if there is a mismatch between the server and client
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");

  const processing = useFormProcessing();
  const initializing = useFormInitializing();

  useEffect(() => {
    if (data?.updatedAt) {
      setUpdatedAt(
        formatDate({ date: data.updatedAt, i18n, pattern: dateFormat })
      );
    }
    if (data?.createdAt) {
      setCreatedAt(
        formatDate({ date: data.createdAt, i18n, pattern: dateFormat })
      );
    }
  }, [data, i18n, dateFormat]);

  const hasCreatePermission =
    permissions && "create" in permissions && permissions.create;

  const hasDeletePermission =
    permissions && "delete" in permissions && permissions.delete;

  const showDotMenu = Boolean(
    collectionConfig &&
      id &&
      !disableActions &&
      (hasCreatePermission || hasDeletePermission)
  );
  const [showMenu, setShowMenu] = useState(
    showDotMenu && !readOnlyForIncomingUser
  );
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const mes = showDotMenu && !readOnlyForIncomingUser;
    setShowMenu(mes);
    !mes && setMenuOpen(false);
  }, [readOnlyForIncomingUser, showDotMenu]);

  const menuRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    !showMenu && lenis?.start();
  }, [lenis, showMenu]);
  const unsavedDraftWithValidations =
    !id &&
    collectionConfig?.versions?.drafts &&
    collectionConfig.versions?.drafts.validate;

  const collectionConfigDrafts = collectionConfig?.versions?.drafts;
  const globalConfigDrafts = globalConfig?.versions?.drafts;

  const autosaveEnabled =
    (collectionConfigDrafts && collectionConfigDrafts?.autosave) ||
    (globalConfigDrafts && globalConfigDrafts?.autosave);

  const collectionAutosaveEnabled =
    collectionConfigDrafts && collectionConfigDrafts?.autosave;
  const globalAutosaveEnabled =
    globalConfigDrafts && globalConfigDrafts?.autosave;

  const showSaveDraftButton =
    (collectionAutosaveEnabled &&
      collectionConfigDrafts.autosave !== false &&
      collectionConfigDrafts.autosave.showSaveDraftButton === true) ||
    (globalAutosaveEnabled &&
      globalConfigDrafts.autosave !== false &&
      globalConfigDrafts.autosave.showSaveDraftButton === true);

  const showCopyToLocale =
    localization && !collectionConfig?.admin?.disableCopyToLocale;

  const showFolderMetaIcon = collectionConfig && collectionConfig.folders;
  const showLockedMetaIcon = user && readOnlyForIncomingUser;

  return (
    <>
      <Gutter className={baseClass}>
        <div
          className={cn(`${baseClass}__wrapper`)}
          style={{
            zIndex: 10003
          }}
          id="estate-document-controls"
        >
          <div className={`${baseClass}__content`}>
            {showLockedMetaIcon || showFolderMetaIcon ? (
              <div className={`${baseClass}__meta-icons`}>
                {showLockedMetaIcon && (
                  <Locked
                    className={`${baseClass}__locked-controls`}
                    user={user}
                  />
                )}
                {showFolderMetaIcon && config.folders && !isTrashed && (
                  <MoveDocToFolder
                    folderCollectionSlug={config.folders.slug}
                    folderFieldName={config.folders.fieldName}
                  />
                )}
              </div>
            ) : null}
            <ul className={`${baseClass}__meta`}>
              {collectionConfig && !isEditing && !isAccountView && (
                <li className={`${baseClass}__list-item`}>
                  <p className={`${baseClass}__value`}>
                    {i18n.t("general:creatingNewLabel", {
                      label: getTranslation(
                        collectionConfig?.labels?.singular ??
                          i18n.t("general:document"),
                        i18n
                      )
                    })}
                  </p>
                </li>
              )}
              {(collectionConfig?.versions?.drafts ||
                globalConfig?.versions?.drafts) && (
                <Fragment>
                  {(globalConfig || (collectionConfig && isEditing)) && (
                    <li
                      className={[
                        `${baseClass}__status`,
                        `${baseClass}__list-item`
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <Status />
                    </li>
                  )}
                  {hasSavePermission &&
                    autosaveEnabled &&
                    !unsavedDraftWithValidations &&
                    !isTrashed && (
                      <li className={`${baseClass}__list-item`}>
                        <Autosave
                          collection={collectionConfig}
                          global={globalConfig}
                          id={id}
                          publishedDocUpdatedAt={data?.createdAt}
                        />
                      </li>
                    )}
                </Fragment>
              )}
              {collectionConfig?.timestamps && (isEditing || isAccountView) && (
                <Fragment>
                  <li
                    className={[
                      `${baseClass}__list-item`,
                      `${baseClass}__value-wrap`
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={data?.updatedAt ? updatedAt : ""}
                  >
                    <p className={`${baseClass}__label`}>
                      {i18n.t(
                        isTrashed ? "general:deleted" : "general:lastModified"
                      )}
                      :&nbsp;
                    </p>

                    {data?.updatedAt && (
                      <p className={`${baseClass}__value`}>{updatedAt}</p>
                    )}
                  </li>
                  <li
                    className={[
                      `${baseClass}__list-item`,
                      `${baseClass}__value-wrap`
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={data?.createdAt ? createdAt : ""}
                  >
                    <p className={`${baseClass}__label`}>
                      {i18n.t("general:created")}:&nbsp;
                    </p>
                    {data?.createdAt && (
                      <p className={`${baseClass}__value`}>{createdAt}</p>
                    )}
                  </li>
                </Fragment>
              )}
            </ul>
          </div>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__controls`}>
              {BeforeDocumentControls}
              {isLivePreviewEnabled && !isInDrawer && <LivePreviewToggler />}
              {(collectionConfig?.admin.preview ||
                globalConfig?.admin.preview) && (
                <RenderCustomComponent
                  CustomComponent={CustomPreviewButton}
                  Fallback={<PreviewButton />}
                />
              )}
              {hasSavePermission && !isTrashed && (
                <Fragment>
                  {collectionConfig?.versions?.drafts ||
                  globalConfig?.versions?.drafts ? (
                    <Fragment>
                      {(unsavedDraftWithValidations ||
                        !autosaveEnabled ||
                        (autosaveEnabled && showSaveDraftButton)) && (
                        <RenderCustomComponent
                          CustomComponent={CustomSaveDraftButton}
                          Fallback={<SaveDraftButton />}
                        />
                      )}
                      <RenderCustomComponent
                        CustomComponent={CustomPublishButton}
                        Fallback={<PublishButton />}
                      />
                    </Fragment>
                  ) : (
                    <RenderCustomComponent
                      CustomComponent={CustomSaveButton}
                      Fallback={<RP_SaveButton />}
                    />
                  )}
                </Fragment>
              )}
              {id && hasDeletePermission && isTrashed && (
                <PermanentlyDeleteButton
                  buttonId="action-permanently-delete"
                  collectionSlug={collectionConfig?.slug}
                  id={typeof id === "string" ? id : id.toString()}
                  onDelete={onDelete}
                  redirectAfterDelete={redirectAfterDelete}
                  singularLabel={collectionConfig?.labels?.singular}
                />
              )}
              {hasSavePermission && isTrashed && (
                <RestoreButton
                  buttonId="action-restore"
                  collectionSlug={collectionConfig?.slug}
                  id={id ? (typeof id === "string" ? id : id.toString()) : ""}
                  onRestore={onRestore}
                  redirectAfterRestore={redirectAfterRestore}
                  singularLabel={collectionConfig?.labels?.singular}
                />
              )}
              {user && readOnlyForIncomingUser && (
                <Button id="take-over" onClick={onTakeOver} type="button">
                  {t("general:takeOver")}
                </Button>
              )}
            </div>
            {showMenu && (
              <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <MenuTrigger
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  disabled={initializing || processing}
                />
                <Menu.Portal>
                  <Menu.Positioner className="outline-none" sideOffset={10}>
	                  <MenuPopup className={"p-0 py-3"}>
                      <MenuArrow />
                      <div className={"flex flex-col"} ref={menuRef}>
                        {showCopyToLocale && (
                          <MenuItem
                            className={
                              "py-2 text-faded-foreground/90! outline-none! hover:text-faded-background!"
                            }
                          >
                            <CopyLocaleData />
                          </MenuItem>
                        )}
                        <MenuSeparator />

                        {hasCreatePermission && (
                          <Fragment>
                            {!disableCreate && (
                              <>
                                <MenuItem
                                  className={"py-2 text-faded-foreground!"}
                                >
                                  {editDepth > 1 ? (
                                    <Button
                                      id="action-create"
                                      className={cn(
                                        "w-full! appearance-none border-none! bg-transparent! p-0! font-sans! text-faded-foreground/90! outline-none! hover:text-faded-background!"
                                      )}
                                      onClick={onDrawerCreateNew}
                                      data-themed="color, border-color, background-color, outline-color,box-shadow"
                                    >
                                      {i18n.t("general:createNew")}
                                    </Button>
                                  ) : (
                                    <Link
                                      className={
                                        "decoration-none w-full appearance-none border-none! bg-transparent! px-2! font-sans! text-inherit!"
                                      }
                                      data-themed="color, border-color, background-color, outline-color,box-shadow"
                                      prefetch={false}
                                      href={formatAdminURL({
                                        adminRoute,
                                        path: `/collections/${collectionConfig?.slug}/create`
                                      })}
                                      id="action-create"
                                    >
                                      {i18n.t("general:createNew")}
                                    </Link>
                                  )}
                                </MenuItem>
                                <MenuSeparator />
                              </>
                            )}

                            {id &&
                              collectionConfig.disableDuplicate !== true &&
                              isEditing && (
                                <>
                                  <MenuItem
                                    className={
                                      "py-2 font-sans! text-faded-foreground/90! hover:text-faded-background!"
                                    }
                                  >
                                    <DuplicateDocument
                                      id={`${id}`}
                                      onDuplicate={onDuplicate}
                                      redirectAfterDuplicate={
                                        redirectAfterDuplicate
                                      }
                                      singularLabel={
                                        collectionConfig?.labels?.singular
                                      }
                                      slug={collectionConfig?.slug}
                                    />
                                  </MenuItem>
                                </>
                              )}
                          </Fragment>
                        )}
                        {id && hasDeletePermission && (
                          <>
                            <MenuSeparator />
                            <MenuItem
                              className={
                                "py-2 font-sans! text-faded-foreground/90! hover:text-faded-background!"
                              }
                            >
                              <DeleteDocument
                                buttonId="action-delete"
                                collectionSlug={collectionConfig?.slug}
                                id={id.toString()}
                                onDelete={onDelete}
                                redirectAfterDelete={redirectAfterDelete}
                                singularLabel={
                                  collectionConfig?.labels?.singular
                                }
                                useAsTitle={collectionConfig?.admin?.useAsTitle}
                              />
                            </MenuItem>
                          </>
                        )}

                        {EditMenuItems && (
                          <>
                            <MenuSeparator />
                            <MenuItem>{EditMenuItems}</MenuItem>
                          </>
                        )}
                      </div>
                    </MenuPopup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            )}
            <div
              className={
                "flex w-fit transition-all duration-150 ease-out-power2"
              }
            >
              <AnimatePresence mode="popLayout">
                {hasSidebar && <SidebarControls />}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className={`${baseClass}__divider`} />
      </Gutter>
    </>
  );
};
