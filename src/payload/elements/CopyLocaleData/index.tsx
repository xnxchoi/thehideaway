"use client";

import { getTranslation } from "@payloadcms/translations";
import { useRouter } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode
} from "react";

import {
  CheckboxField,
  SelectInput,
  useConfig,
  useDocumentInfo,
  useFormModified,
  useModal,
  toast,
  useLocale,
  useRouteTransition,
  useServerFunctions,
  useTranslation
} from "@payloadcms/ui";

import { DrawerHeader } from "@payloadcms/ui/elements/BulkUpload/Header";
import { Drawer } from "@/components/ui/vaul";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const baseClass = "copy-locale-data";

const drawerSlug = "copy-locale";
export type LocaleCopyModalStates = {
  setOpen: (open: boolean) => void;
  open: boolean;
  toggle: () => void;
};
const LCMCtx = createContext<LocaleCopyModalStates>(null!);
export const LocaleDataCopyProvider = ({
  children
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const toggleDrawer = useCallback(() => setOpen((r) => !r), []);
  return (
    <LCMCtx.Provider value={{ open, setOpen, toggle: toggleDrawer }}>
      {children}
    </LCMCtx.Provider>
  );
};
const useLCM = <T,>(selector: (store: LocaleCopyModalStates) => T) => {
  const c = useContext(LCMCtx);
  if (!c) throw new Error("useLCM must be used within LCMCtx provider");
  return selector(c);
};
export const CopyLocaleData: FC = () => {
  const {
    config: {
      localization,
      routes: { admin },
      serverURL
    }
  } = useConfig();
  const { code } = useLocale();
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const toggleDrawer = useLCM((r) => r.toggle);
  const modified = useFormModified();
  const { i18n, t } = useTranslation();
  if (!id && !globalSlug) {
    console.log("nope for copylocale");
    return null;
  }

  return (
    <Button
      id={`${baseClass}__button`}
      className={cn(
        "appearance-none border-none bg-transparent text-inherit! outline-none"
      )}
      onClick={() => {
        if (modified) {
          toast.info(t("general:unsavedChanges"));
        } else {
          console.log("clicked copy");
          // toggleModal(drawerSlug);
          toggleDrawer();
        }
      }}
    >
      {t("localization:copyToLocale")}
    </Button>
  );
};
export const CopyLocaleDataDrawer = () => {
  const {
    config: {
      localization,
      routes: { admin },
      serverURL
    }
  } = useConfig();
  const { code } = useLocale();
  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const { i18n, t } = useTranslation();

  const { toggleModal } = useModal();
  const { copyDataFromLocale } = useServerFunctions();
  const router = useRouter();
  const { startRouteTransition } = useRouteTransition();
  const open = useLCM((r) => r.open);
  const setOpen = useLCM((r) => r.setOpen);
  const toggleDrawer = useLCM((r) => r.toggle);
  const localeOptions = useMemo(
    () =>
      (localization &&
        localization.locales.map((locale) => ({
          label: locale.label,
          value: locale.code
        }))) ||
      [],
    [localization]
  );

  const localeOptionsWithoutCurrent = useMemo(
    () => localeOptions.filter((locale) => locale.value !== code),
    [localeOptions, code]
  );

  const getLocaleLabel = useCallback(
    (code: string) => {
      const locale =
        localization && localization.locales.find((l) => l.code === code);
      return locale && locale.label ? getTranslation(locale.label, i18n) : code;
    },
    [i18n, localization]
  );

  const [copying, setCopying] = useState(false);
  const [toLocale, setToLocale] = useState<null | string>(null);
  const [fromLocale, setFromLocale] = useState<null | string>(code);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  useEffect(() => {
    if (fromLocale !== code) {
      setFromLocale(code);
    }
  }, [code, fromLocale]);
  useEffect(() => {
    if (!open) {
      setCopying(false);
    }
  }, [open]);
  const copyLocaleData = useCallback(
    async ({ from, to }: { from: string; to: string }) => {
      console.log("copylocaledata");
      setCopying(true);

      try {
        await copyDataFromLocale({
          collectionSlug,
          docID: id,
          fromLocale: from,
          globalSlug,
          overrideData: overwriteExisting,
          toLocale: to
        });

        setCopying(false);

        startRouteTransition(() =>
          router.push(
            formatAdminURL({
              adminRoute: admin,
              path: `/${collectionSlug ? `collections/${collectionSlug}/${id}` : `globals/${globalSlug}`}`,
              serverURL
            }) + `?locale=${to}`
          )
        );

        // toggleModal(drawerSlug);
        toggleDrawer();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
    [
      copyDataFromLocale,
      collectionSlug,
      id,
      globalSlug,
      overwriteExisting,
      startRouteTransition,
      toggleDrawer,
      router,
      admin,
      serverURL
    ]
  );
  return (
    <Drawer.Root
      direction={"right"}
      open={open}
      onOpenChange={setOpen}
      modal={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          role="button"
          className={"inset-0 z-99998 bg-faded-background/30"}
          style={{
            inset: 0,
            zIndex: 99998,
            backdropFilter: "blur(1px)",
            backgroundColor: "oklch(from var(--faded-black) l c h/.3)",
            position: "fixed"
          }}
        />
        <Drawer.Content
          className={cn(
            "fixed top-3 right-3 bottom-3 left-auto z-[99999] w-[45vw] outline-none",
            baseClass
          )}
          style={
            {
              zIndex: 99999,
              top: "8px",
              right: "8px",
              bottom: "8px",
              left: "auto",
              width: "45vw",
              height: "auto",
              outline: "none",
              position: "fixed",
              "--initial-transform": "calc(100% + 8px)"
            } as CSSProperties
          }
        >
          <div
            className={
              "flex h-full w-full flex-col rounded-[12px] bg-faded-background"
            }
            style={{
              padding: "12px 20px",
              display: "flex",
              height: "100%",
              width: "100%",
              overflow: "hidden",
              flexDirection: "column",
              overflowY: "auto",
              borderRadius: "12px",
              backgroundColor: "oklch(from var(--faded-bg) l c h/.8)",
              backdropFilter: "blur(8px)",
              fontFamily: "var(--font-sans)"
            }}
          >
            <Drawer.Title>
              <DrawerHeader
                onClose={() => {
                  console.log("header closez");
                  // toggleModal(drawerSlug);
                  toggleDrawer();
                }}
                title={t("localization:copyToLocale")}
              />
            </Drawer.Title>
            <div className={`${baseClass}__sub-header`}>
              <span>
                {fromLocale && toLocale ? (
                  <div>
                    {t("localization:copyFromTo", {
                      from: getLocaleLabel(fromLocale),
                      to: getLocaleLabel(toLocale)
                    })}
                  </div>
                ) : (
                  t("localization:selectLocaleToCopy")
                )}
              </span>
              <Button
                disabled={!fromLocale || !toLocale}
                onClick={
                  toLocale && fromLocale
                    ? async () => {
                        if (fromLocale === toLocale) {
                          toast.error(t("localization:cannotCopySameLocale"));
                          return;
                        }
                        if (!copying) {
                          await copyLocaleData({
                            from: fromLocale,
                            to: toLocale
                          });
                        }
                      }
                    : undefined
                }
              >
                {copying ? t("general:copying") + "..." : t("general:copy")}
              </Button>
            </div>
            {toLocale && fromLocale && (
              <div className={`${baseClass}__content`}>
                <SelectInput
                  label={t("localization:copyFrom")}
                  name={"fromLocale"}
                  onChange={(selectedOption) => {
                    if (Array.isArray(selectedOption)) {
                      return;
                    }
                    if (
                      selectedOption?.value &&
                      typeof selectedOption.value === "string"
                    ) {
                      setFromLocale(selectedOption.value);
                    }
                  }}
                  options={localeOptions}
                  path="fromLocale"
                  readOnly
                  value={fromLocale}
                />
                <SelectInput
                  label={t("localization:copyTo")}
                  name="toLocale"
                  onChange={(selectedOption) => {
                    if (Array.isArray(selectedOption)) {
                      return;
                    }
                    if (
                      selectedOption?.value &&
                      typeof selectedOption.value === "string"
                    ) {
                      setToLocale(selectedOption.value);
                    }
                  }}
                  options={localeOptionsWithoutCurrent}
                  path="toLocale"
                  value={toLocale}
                />
                <CheckboxField
                  checked={overwriteExisting}
                  field={{
                    name: "overwriteExisting",
                    label: t("general:overwriteExistingData")
                  }}
                  onChange={() => setOverwriteExisting(!overwriteExisting)}
                  path={"overwriteExisting"}
                />
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
