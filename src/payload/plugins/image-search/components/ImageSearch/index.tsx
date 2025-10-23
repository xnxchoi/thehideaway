"use client";

import {
  Button,
  Drawer,
  useConfig,
  useModal,
  useUploadControls
} from "@payloadcms/ui";
import { useCallback } from "react";

import { SearchImages } from "../SearchImages";
import { useImageSearcher } from "@/payload/providers/Admins";

export const searchImagesDrawerSlug = "search-images";

export const ImageSearch = () => {
  const { setUploadControlFileName, setUploadControlFileUrl } =
    useUploadControls();

  const { config } = useConfig();

  const { openModal, closeModal } = useModal();

  const handleSearchSubmit = useCallback(
    ({ url, id }: { url: string; id: string }) => {
      if (!url || !id) {
        return;
      }

      setUploadControlFileUrl(url);
      setUploadControlFileName(`unsplash-${id}`);
      closeModal(searchImagesDrawerSlug);
    },
    [setUploadControlFileUrl, setUploadControlFileName, closeModal]
  );

  return (
    <>
      |
      <Button
        buttonStyle="pill"
        size="small"
        onClick={() => openModal(searchImagesDrawerSlug)}
      >
        Search images
      </Button>
      <Drawer slug={searchImagesDrawerSlug}>
        <SearchImages
          serverURL={config.serverURL}
          api={config.routes.api}
          onSelect={handleSearchSubmit}
        />
      </Drawer>
    </>
  );
};
