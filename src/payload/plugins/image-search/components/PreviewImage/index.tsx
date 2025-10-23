"use client";

import "./index.scss";

import { Button, useModal, useTranslation } from "@payloadcms/ui";

import type { ProviderResult } from "../../classes/Provider";
import type { TranslationsKeys, TranslationsObject } from "../../translations";
import Image from "next/image";

const baseClass = "preview-image";

type PreviewImageProps = {
  slug: string;
  selectedImage: ProviderResult | null;
  onSelect: ({
    id,
    url,
    download
  }: {
    id: string;
    url: string;
    download?: string;
  }) => void;
};

export const PreviewImage = (props: PreviewImageProps) => {
  const { slug, selectedImage, onSelect } = props;

  const { closeModal } = useModal();

  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  if (!selectedImage) {
    return null;
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h2>{t("imageSearch:previewImage")}</h2>
        <div className={`${baseClass}__actions`}>
          <Button
            aria-label={t("general:cancel")}
            buttonStyle="secondary"
            className={`${baseClass}__cancel`}
            onClick={() => closeModal(slug)}
          >
            {t("general:cancel")}
          </Button>
          <Button
            aria-label={t("imageSearch:selectImage")}
            buttonStyle="primary"
            className={`${baseClass}__select`}
            onClick={() =>
              onSelect({
                id: selectedImage.id,
                url: selectedImage.urls.original,
                download: selectedImage.urls?.downloadLocation
              })
            }
          >
            {t("imageSearch:selectImage")}
          </Button>
        </div>
      </div>
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__image`}>
          <Image src={selectedImage.urls.original} alt={selectedImage.alt} />
        </div>
      </div>
    </div>
  );
};
