"use client";

import type { PublishButtonClientProps } from "payload";

import * as qs from "qs-esm";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  MenuArrow,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger
} from "@/payload/components/Popover";
import { useCourier } from "@/payload/elements/DocumentFields/RP_CourierProvider";
import { Menu } from "@base-ui/react";
import {
  FormSubmit,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useForm,
  useFormModified,
  useHotkey,
  useLocale,
  useModal,
  useOperation,
  useTranslation
} from "@payloadcms/ui";
import { traverseForLocalizedFields } from "@payloadcms/ui/utilities/traverseForLocalizedFields";
import { getTranslation } from "@payloadcms/translations";
import {
  formatAdminURL,
  hasAutosaveEnabled,
  hasLocalizeStatusEnabled,
  hasScheduledPublishEnabled
} from "payload/shared";

export function PublishButton({
  label: labelProp
}: { label?: string } & PublishButtonClientProps) {
  const {
    id,
    collectionSlug,
    docConfig,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
    uploadStatus
  } = useDocumentInfo();

  const { config, getEntityConfig } = useConfig();
  const { submit } = useForm();
  const modified = useFormModified();
  const editDepth = useEditDepth();
  const { code: localeCode } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isModalOpen, toggleModal } = useModal();
  const menuRef = useRef<HTMLDivElement>(null!);
  const setCourierRef = useCourier((r) => r.setButtonRef);
  const courierStatus = useCourier((r) => r.status);
  const setSaving = useCourier((r) => r.setSavingState);
  const drawerSlug = `schedule-publish-${id}`;
  const ref = useRef<HTMLButtonElement>(null!);

  const {
    localization,
    routes: { api },
    serverURL
  } = config;

  const { i18n, t } = useTranslation();
  const label = labelProp || t("version:publishChanges");

  const entityConfig = useMemo(() => {
    if (collectionSlug) {
      return getEntityConfig({ collectionSlug });
    }

    if (globalSlug) {
      return getEntityConfig({ globalSlug });
    }
  }, [collectionSlug, globalSlug, getEntityConfig]);
  useEffect(() => {
    if (ref.current) {
      setCourierRef(ref.current);
    }
  }, [setCourierRef]);
  const hasNewerVersions = unpublishedVersionCount > 0;

  const canPublish =
    hasPublishPermission &&
    (modified || hasNewerVersions || !hasPublishedDoc) &&
    uploadStatus !== "uploading" &&
    courierStatus !== "uploading";
  const schedulePublish =
    typeof entityConfig?.versions?.drafts === "object" &&
    entityConfig?.versions?.drafts.schedulePublish;

  const scheduledPublishEnabled = hasScheduledPublishEnabled(entityConfig!);

  // If autosave is enabled the modified will always be true so only conditionally check on modified state
  const hasAutosave = hasAutosaveEnabled(entityConfig!);

  const canSchedulePublish = Boolean(
    scheduledPublishEnabled &&
    hasPublishPermission &&
    (globalSlug || (collectionSlug && id)) &&
    (hasAutosave || !modified)
  );

  const [hasLocalizedFields, setHasLocalizedFields] = useState(false);

  useEffect(() => {
    const hasLocalizedField = traverseForLocalizedFields(entityConfig!.fields);
    setHasLocalizedFields(hasLocalizedField);
  }, [entityConfig]);

  const isSpecificLocalePublishEnabled =
    localization && hasLocalizedFields && hasPublishPermission;

  const operation = useOperation();

  const disabled = operation === "update" && !modified;

  const saveDraft = useCallback(async () => {
    if (disabled) {
      return;
    }

    const params = qs.stringify(
      {
        depth: 0,
        draft: true,
        "fallback-locale": "null",
        locale: localeCode
      },
      { addQueryPrefix: true }
    );

    let action;
    let method = "POST";

    if (collectionSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/${collectionSlug}${id ? `/${id}` : ""}${params}`
      });
      if (id) {
        method = "PATCH";
      }
    }

    if (globalSlug) {
      action = formatAdminURL({
        apiRoute: api,
        path: `/globals/${globalSlug}${params}`
      });
    }

    await submit({
      action,
      method,
      overrides: {
        _status: "draft"
      },
      skipValidation: true
    });
  }, [disabled, localeCode, collectionSlug, globalSlug, submit, api, id]);

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ["s"] }, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (courierStatus === "uploading") {
      return;
    }
    if (saveDraft && hasAutosave) {
      void saveDraft();
    }
  });
  const localizeStatusEnabled = hasLocalizeStatusEnabled(entityConfig!);

  const publish = useCallback(async () => {
    if (uploadStatus === "uploading" || courierStatus === "uploading") {
      return;
    }
    setSaving(true);

    const params = qs.stringify(
      {
        depth: 0,
        locale: localeCode,
        ...(localizeStatusEnabled && { publishAllLocales: true })
      },
      { addQueryPrefix: true }
    );

    const action = formatAdminURL({
      apiRoute: api,
      path: `${
        globalSlug
          ? `/globals/${globalSlug}`
          : `/${collectionSlug}${id ? `/${id}` : ""}`
      }${params}` as `/${string}`
    });

    const result = await submit({
      action,
      overrides: {
        _status: "published"
      }
    });
    setSaving(false);

    if (result) {
      setUnpublishedVersionCount(0);
      setMostRecentVersionIsAutosaved(false);
      setHasPublishedDoc(true);
    }
  }, [
    uploadStatus,
    courierStatus,
    setSaving,
    localeCode,
    localizeStatusEnabled,
    api,
    globalSlug,
    collectionSlug,
    id,
    submit,
    setUnpublishedVersionCount,
    setMostRecentVersionIsAutosaved,
    setHasPublishedDoc
  ]);

  const publishSpecificLocale = useCallback(
    async (locale: string) => {
      if (uploadStatus === "uploading" || courierStatus === "uploading") {
        return;
      }
      const params = qs.stringify(
        {
          depth: 0,
          locale,
          publishSpecificLocale: locale
        },
        { addQueryPrefix: true }
      );

      const pathSegment = globalSlug
        ? `/globals/${globalSlug}`
        : `/${collectionSlug}${id ? `/${id}` : ""}`;
      const action = formatAdminURL({
        apiRoute: api,
        path: `${pathSegment}${params}` as `/${string}`
      });

      const result = await submit({
        action,
        overrides: {
          _status: "published"
        }
      });

      if (result) {
        setUnpublishedVersionCount(0);
        setMostRecentVersionIsAutosaved(false);
        setHasPublishedDoc(true);
      }
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      setHasPublishedDoc,
      setMostRecentVersionIsAutosaved,
      setUnpublishedVersionCount,
      submit,
      uploadStatus,
      courierStatus,
      serverURL
    ]
  );

  // Publish to all locales unless there are localized fields AND defaultLocalePublishOption is 'active'
  const isDefaultPublishAll =
    !isSpecificLocalePublishEnabled ||
    (localization && localization?.defaultLocalePublishOption !== "active");

  const activeLocale =
    localization &&
    localization?.locales.find((locale) =>
      typeof locale === "string"
        ? locale === localeCode
        : locale.code === localeCode
    );

  const activeLocaleLabel =
    activeLocale && getTranslation(activeLocale.label, i18n);

  if (!hasPublishPermission) {
    return null;
  }
  const publishAll =
    !localization ||
    (localization && localization.defaultLocalePublishOption !== "active");

  const defaultPublish = publishAll
    ? publish
    : () =>
        publishSpecificLocale(activeLocale ? activeLocale.code || "en" : "en");
  const defaultLabel = publishAll
    ? label
    : t("version:publishIn", { locale: activeLocaleLabel });

  const secondaryPublish = publishAll
    ? () =>
        publishSpecificLocale(activeLocale ? activeLocale.code || "en" : "en")
    : publish;
  const secondaryLabel = publishAll
    ? t("version:publishIn", { locale: activeLocaleLabel })
    : t("version:publishAllLocales");

  if (!hasPublishPermission) {
    return null;
  }

  return (
    <Fragment>
      <div
        className={
          "flex h-full items-center gap-0 bg-muted-faded-background/30"
        }
      >
        <FormSubmit
          className={
            "border-px h-12! rounded-r-xs! border-r! border-solid! border-r-muted-faded-foreground/40! bg-muted-faded-foreground/80! text-sm!"
          }
          buttonId="action-save"
          disabled={!canPublish}
          ref={ref}
          enableSubMenu={canSchedulePublish}
          onClick={
            isDefaultPublishAll
              ? publish
              : () =>
                  publishSpecificLocale(
                    activeLocale ? activeLocale.code || "en" : "en"
                  )
          }
          size="medium"
          type="button"
        >
          {localization ? defaultLabel : label}
        </FormSubmit>
        {(isSpecificLocalePublishEnabled || canSchedulePublish) && (
          <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <MenuTrigger className={"h-fit rounded-r-2xl px-1"} />
            <Menu.Portal>
              <Menu.Positioner className="outline-none" sideOffset={10}>
                <MenuPopup>
                  <MenuArrow />
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column"
                    }}
                    ref={menuRef}
                  >
                    {canSchedulePublish && (
                      <MenuItem
                        id="schedule-publish"
                        onClick={() => [toggleModal(drawerSlug), close()]}
                      >
                        {t("version:schedulePublish")}
                      </MenuItem>
                    )}
                    <MenuSeparator />
                    {isSpecificLocalePublishEnabled && (
                      <MenuItem id="publish-locale" onClick={secondaryPublish}>
                        {secondaryLabel}
                      </MenuItem>
                    )}
                  </div>
                </MenuPopup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
      </div>
      {/* ScheduleDrawer omitted: Payload 3.88 DatePicker `library.scss`
          (`//` comments + `@layer`) crashes Next's sass→CSS pipeline and
          poisons the whole /vault compile. Re-enable when that file is
          valid CSS or the pin moves off 3.88.0. */}
    </Fragment>
  );
}
