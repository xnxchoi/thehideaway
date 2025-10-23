"use client";

import { Fragment, useCallback, type FC } from "react";
import {
  useForm,
  useConfig,
  useDocumentInfo,
  useTranslation,
  useLocale,
  useModal,
  Button,
  toast,
  ConfirmationModal
} from "@payloadcms/ui";

import { requests } from "@payloadcms/ui/utilities/api";

const baseClass = "status";

export const Status: FC = () => {
  const {
    id,
    collectionSlug,
    docPermissions,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount
  } = useDocumentInfo();

  const { toggleModal } = useModal();

  const {
    config: {
      routes: { api },
      serverURL
    }
  } = useConfig();

  const { reset: resetForm } = useForm();
  const { code: locale } = useLocale();
  const { i18n, t } = useTranslation();

  const unPublishModalSlug = `confirm-un-publish-${id}`;
  const revertModalSlug = `confirm-revert-${id}`;

  const statusToRender: "changed" | "draft" | "published" = !hasPublishedDoc
    ? "draft"
    : unpublishedVersionCount > 0
      ? "changed"
      : "published";

  const displayStatusKey = isTrashed
    ? hasPublishedDoc
      ? "previouslyPublished"
      : "previouslyDraft"
    : statusToRender;

  const performAction = useCallback(
    async (action: "revert" | "unpublish") => {
      const url = collectionSlug
        ? `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}&fallback-locale=null&depth=0`
        : `${serverURL}${api}/globals/${globalSlug}?locale=${locale}&fallback-locale=null&depth=0`;
      const method = collectionSlug ? "patch" : "post";
      const body =
        action === "unpublish"
          ? {
              _status: "draft"
            }
          : await requests
              .get(url, {
                headers: {
                  "Accept-Language": i18n.language,
                  "Content-Type": "application/json"
                }
              })
              .then((res) => res.json());

      const res = await requests[method](url, {
        body: JSON.stringify(body),
        headers: {
          "Accept-Language": i18n.language,
          "Content-Type": "application/json"
        }
      });

      if (res.status === 200) {
        let data;
        const json = await res.json();

        if (globalSlug) {
          data = json.result;
        } else if (collectionSlug) {
          data = json.doc;
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        resetForm(data);
        toast.success(json.message);
        incrementVersionCount();
        setMostRecentVersionIsAutosaved(false);

        if (action === "unpublish") {
          setHasPublishedDoc(false);
        } else if (action === "revert") {
          setUnpublishedVersionCount(0);
        }
      } else {
        try {
          const json = await res.json();
          if (json.errors?.[0]?.message) {
            toast.error(json.errors[0].message);
          } else if (json.error) {
            toast.error(json.error);
          } else {
            toast.error(t("error:unPublishingDocument"));
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          toast.error(t("error:unPublishingDocument"));
        }
      }
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      i18n.language,
      incrementVersionCount,
      locale,
      resetForm,
      serverURL,
      setUnpublishedVersionCount,
      setMostRecentVersionIsAutosaved,
      t,
      setHasPublishedDoc
    ]
  );

  const canUpdate = docPermissions?.update;

  if (statusToRender) {
    return (
      <div
        className={baseClass}
        title={`${t("version:status")}: ${t(`version:${displayStatusKey}`)}`}
      >
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__label`}>
            {t("version:status")}:&nbsp;
          </span>
          <span className={`${baseClass}__value`}>
            {t(`version:${displayStatusKey}`)}
          </span>
          {!isTrashed && canUpdate && statusToRender === "published" && (
            <Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                id={`action-unpublish`}
                onClick={() => toggleModal(unPublishModalSlug)}
              >
                {t("version:unpublish")}
              </Button>
              <ConfirmationModal
                body={t("version:aboutToUnpublish")}
                confirmingLabel={t("version:unpublishing")}
                heading={t("version:confirmUnpublish")}
                modalSlug={unPublishModalSlug}
                onConfirm={() => performAction("unpublish")}
              />
            </Fragment>
          )}
          {!isTrashed &&
            canUpdate &&
            hasPublishedDoc &&
            statusToRender === "changed" && (
              <Fragment>
                &nbsp;&mdash;&nbsp;
                <Button
                  buttonStyle="none"
                  className={`${baseClass}__action`}
                  id="action-revert-to-published"
                  onClick={() => toggleModal(revertModalSlug)}
                >
                  {t("version:revertToPublished")}
                </Button>
                <ConfirmationModal
                  body={t("version:aboutToRevertToPublished")}
                  confirmingLabel={t("version:reverting")}
                  heading={t("version:confirmRevertToSaved")}
                  modalSlug={revertModalSlug}
                  onConfirm={() => performAction("revert")}
                />
              </Fragment>
            )}
        </div>
      </div>
    );
  }

  return null;
};
