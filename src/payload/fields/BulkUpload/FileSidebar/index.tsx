"use client";

import { Button } from "@/payload/elements/Button/Button";
import { Pill } from "@/payload/elements/Pill";
import { useBulkUpload } from "@/payload/fields/BulkUpload";
import { Actions } from "@/payload/fields/BulkUpload/ActionsBar";
import { AddFilesView } from "@/payload/fields/BulkUpload/AddFilesView";
import { useFormsManager } from "@/payload/fields/BulkUpload/FormsManager";
import {
  AnimateHeight,
  ChevronIcon,
  Drawer,
  ErrorPill,
  SelectInput,
  ShimmerEffect,
  Thumbnail,
  useConfig,
  useModal,
  useTranslation,
  useWindowInfo,
  XIcon
} from "@payloadcms/ui";
import { createThumbnail } from "node_modules/@payloadcms/ui/dist/elements/Thumbnail/createThumbnail";
import { isImage } from "payload/shared";
import { useCallback, useEffect, useState } from "react";

const addMoreFilesDrawerSlug = "bulk-upload-drawer--add-more-files";

const baseClass = "file-selections";

export function FileSidebar() {
  const {
    activeIndex,
    addFiles,
    forms,
    isInitializing,
    removeFile,
    setActiveIndex,
    totalErrorCount
  } = useFormsManager();
  const { initialFiles, initialForms, maxFiles } = useBulkUpload();
  const { i18n, t } = useTranslation();
  const { closeModal, openModal } = useModal();
  const [showFiles, setShowFiles] = useState(false);
  const { breakpoints } = useWindowInfo();

  const handleRemoveFile = useCallback(
    (indexToRemove: number) => {
      removeFile(indexToRemove);
    },
    [removeFile]
  );

  const handleAddFiles = useCallback(
    (filelist: FileList) => {
      void addFiles(filelist);
      closeModal(addMoreFilesDrawerSlug);
    },
    [addFiles, closeModal]
  );

  const getFileSize = useCallback((file: File) => {
    const size = file.size;
    const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    const decimals = i > 1 ? 1 : 0;
    const formattedSize =
      (size / Math.pow(1024, i)).toFixed(decimals) +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i];
    return formattedSize;
  }, []);

  const totalFileCount = isInitializing
    ? (initialFiles?.length ?? initialForms?.length)
    : forms.length;

  const {
    collectionSlug: bulkUploadCollectionSlug,
    selectableCollections,
    setCollectionSlug
  } = useBulkUpload();

  const { getEntityConfig } = useConfig();

  return (
    <div
      className={[baseClass, showFiles && `${baseClass}__showingFiles`]
        .filter(Boolean)
        .join(" ")}
    >
      {breakpoints.m && showFiles ? (
        <div className={`${baseClass}__mobileBlur`} />
      ) : null}
      <div className={`${baseClass}__header`}>
        {(selectableCollections?.length || 0) > 1 && (
          <SelectInput
            className={`${baseClass}__collectionSelect`}
            isClearable={false}
            name="groupBy"
            onChange={(e) => {
              const val: string =
                typeof e === "object" && "value" in e
                  ? (e?.value as string)
                  : (e as unknown as string);
              setCollectionSlug(val);
            }}
            options={
              selectableCollections?.map((coll) => {
                const config = getEntityConfig({ collectionSlug: coll });
                return { label: config.labels.singular, value: config.slug };
              }) || []
            }
            path="groupBy"
            required
            value={bulkUploadCollectionSlug}
          />
        )}
        <div className={`${baseClass}__headerTopRow`}>
          <div className={`${baseClass}__header__text`}>
            <ErrorPill count={totalErrorCount!} i18n={i18n} withMessage />
            <p>
              <strong
                title={`${totalFileCount} ${t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")}`}
              >
                {totalFileCount}{" "}
                {t(
                  totalFileCount > 1
                    ? "upload:filesToUpload"
                    : "upload:fileToUpload"
                )}
              </strong>
            </p>
          </div>

          <div className={`${baseClass}__header__actions`}>
            {(
              typeof maxFiles === "number" ? totalFileCount < maxFiles : true
            ) ? (
              <Pill
                className={`${baseClass}__header__addFile`}
                onClick={() => openModal(addMoreFilesDrawerSlug)}
                size="small"
              >
                {t("upload:addFile")}
              </Pill>
            ) : null}
            <Button
              buttonStyle="transparent"
              className={`${baseClass}__toggler`}
              onClick={() => setShowFiles((prev) => !prev)}
            >
              <span className={`${baseClass}__toggler__label`}>
                <strong
                  title={`${totalFileCount} ${t(totalFileCount > 1 ? "upload:filesToUpload" : "upload:fileToUpload")}`}
                >
                  {totalFileCount}{" "}
                  {t(
                    totalFileCount > 1
                      ? "upload:filesToUpload"
                      : "upload:fileToUpload"
                  )}
                </strong>
              </span>
              <ChevronIcon direction={showFiles ? "down" : "up"} />
            </Button>

            <Drawer gutter={false} Header={null} slug={addMoreFilesDrawerSlug}>
              <AddFilesView
                onCancel={() => closeModal(addMoreFilesDrawerSlug)}
                onDrop={handleAddFiles}
              />
            </Drawer>
          </div>
        </div>

        <div className={`${baseClass}__header__mobileDocActions`}>
          <Actions />
        </div>
      </div>

      <div className={`${baseClass}__animateWrapper`}>
        <AnimateHeight height={!breakpoints.m || showFiles ? "auto" : 0}>
          <div className={`${baseClass}__filesContainer`}>
            {isInitializing &&
            forms.length === 0 &&
            ((initialFiles?.length || 0) > 0 || initialForms?.length > 0)
              ? (initialFiles ? Array.from(initialFiles) : initialForms).map(
                  (file, index) => (
                    <ShimmerEffect
                      animationDelay={`calc(${index} * ${60}ms)`}
                      height="35px"
                      key={index}
                    />
                  )
                )
              : null}
            {forms.map(({ errorCount, formID, formState }, index) => {
              const currentFile =
                (formState?.file?.value as File) || ({} as File);

              return (
                <div
                  className={[
                    `${baseClass}__fileRowContainer`,
                    index === activeIndex &&
                      `${baseClass}__fileRowContainer--active`,
                    errorCount &&
                      errorCount > 0 &&
                      `${baseClass}__fileRowContainer--error`
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={formID}
                >
                  <button
                    className={`${baseClass}__fileRow`}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <SidebarThumbnail file={currentFile} formID={formID} />
                    <div className={`${baseClass}__fileDetails`}>
                      <p
                        className={`${baseClass}__fileName`}
                        title={currentFile.name}
                      >
                        {currentFile.name || t("upload:noFile")}
                      </p>
                    </div>
                    {currentFile instanceof File ? (
                      <p className={`${baseClass}__fileSize`}>
                        {getFileSize(currentFile)}
                      </p>
                    ) : null}
                    <div
                      className={`${baseClass}__remove ${baseClass}__remove--underlay`}
                    >
                      <XIcon />
                    </div>

                    {errorCount ? (
                      <ErrorPill
                        className={`${baseClass}__errorCount`}
                        count={errorCount}
                        i18n={i18n}
                      />
                    ) : null}
                  </button>

                  <button
                    aria-label={t("general:remove")}
                    className={`${baseClass}__remove ${baseClass}__remove--overlay`}
                    onClick={() => handleRemoveFile(index)}
                    type="button"
                  >
                    <XIcon />
                  </button>
                </div>
              );
            })}
          </div>
        </AnimateHeight>
      </div>
    </div>
  );
}

function SidebarThumbnail({ file, formID }: { file: File; formID: string }) {
  const [thumbnailURL, setThumbnailURL] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function generateThumbnail() {
      setIsLoading(true);
      setThumbnailURL(null);

      try {
        if (isImage(file.type)) {
          const url = await createThumbnail(file);
          if (!isCancelled) {
            setThumbnailURL(url);
          }
        } else {
          setThumbnailURL(null);
        }
      } catch (_) {
        if (!isCancelled) {
          setThumbnailURL(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void generateThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  if (isLoading) {
    return (
      <ShimmerEffect
        className={`${baseClass}__thumbnail-shimmer`}
        disableInlineStyles
      />
    );
  }

  return (
    <Thumbnail
      className={`${baseClass}__thumbnail`}
      fileSrc={thumbnailURL!}
      key={`${formID}-${thumbnailURL || "placeholder"}`}
    />
  );
}
