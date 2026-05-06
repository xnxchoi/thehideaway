// features/rp-image/hooks/useRPImageQuery.ts
import {
  processFetchedImage,
  processImageForNode
} from "@/blocks/ImageBlock/Comp/hooks/image-processors";
import { RPFetchError } from "@/payload/fields/Article/Cover/ImageNode/utils/errors";
import {
  $createRPImageNode,
  $isRPImageNode
} from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import {
  RP_ImageData,
  UploadedImageBlock
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {
  FetchedImageDoc,
  ImageCollectionSlug,
  ProcessedImageDoc,
  RalueAsDataWithRelation,
  RalueWithRelation,
  RenderImageFields
} from "@/types/collections/image-collections";
import { ImageMetadata } from "@/types/ImageCollections/schema";
import { imageSelect } from "@/types/payload-api-selects";
import { getClientSideURL } from "@/utilities/getURL";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { $getNodeByKey } from "@payloadcms/richtext-lexical/lexical";
import { stringify } from "qs-esm";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";

export const useQueryForImageNode = ({
  relationTo,
  value,
  uuid,
  initialData
}: {
  relationTo: ImageCollectionSlug;
  value?: string;
  uuid: string;
  initialData?: UploadedImageBlock;
}) => {
  const serverURL = getClientSideURL();

  // Optimization: Memoize the query string itself to prevent stringify on every render
  const queryString = useMemo(
    () =>
      stringify(
        {
          select: imageSelect()
        },
        { addQueryPrefix: true }
      ),
    []
  );
  const queryFn = useCallback(
    async ({ value }: { value: string }) => {
      const res = await fetch(
        `${serverURL}/api/${relationTo}/${value}${queryString}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" }
        }
      );
      if (res.ok) {
        // Return RAW data here. Processing happens in 'select'.
        const r = (await res.json()) as FetchedImageDoc;
        const { image, doc } = processImageForNode({
          doc: r,
          relationTo,
          value
        });
        return { image, doc };
      }
      if (res.status === 404) {
        throw new RPFetchError("This image could not be found.", 404);
      }
      if (res.status === 403) {
        throw new RPFetchError(
          "You do not have permission to view this image.",
          403
        );
      }
      throw new RPFetchError(`Server error (${res.status})`, res.status);
    },
    [queryString, relationTo, serverURL]
  );

  return useQuery({
    queryKey: [
      "rp-image",
      {
        uuid
      }
    ],
    queryFn: value ? () => queryFn({ value }) : skipToken,
    retry: (failureCount, error) => {
      // Don't retry on 404s (it won't magically appear)
      if (error instanceof RPFetchError && error.statusCode === 404)
        return false;
      return failureCount < 2;
    },
    staleTime: Infinity,
    ...((initialData && {
      placeholderData: {
        image: {
          ...initialData,
          darkmode: initialData.darkmode || false,
          src: initialData.src || ""
        },
        doc: {
          ...initialData,
          darkmode: initialData.darkmode || false,
          sizes: undefined,
          src: initialData.src || "",
          url: initialData.src || ""
        }
      }
    }) ||
      {})
  });
};
// 1. QUERY: Fetch Image Data
export const useRPImageQuery = ({
  doc,
  nodeKey,
  initialData
}: {
  doc: RalueWithRelation;
  nodeKey?: string;
  initialData?: FetchedImageDoc;
}) => {
  const serverURL = getClientSideURL();
  const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0);

  // Optimization: Memoize the query string itself to prevent stringify on every render
  const [params, setParams] = useState({
    select: imageSelect()
  });

  const bustCache = useCallback(() => {
    setParams((prev) => ({ ...prev, cacheBust }));
    dispatchCacheBust();
  }, [cacheBust, dispatchCacheBust]);

  const a = useQuery({
    queryKey: [
      "rp-image",
      {
        doc,
        nodeKey
      },
      params
    ],
    queryFn: async ({
      queryKey
    }: {
      queryKey: [
        string,
        { doc: RalueWithRelation; nodeKey?: string },
        typeof params
      ];
    }) => {
      const [
        _,
        {
          doc: { value, relationTo },
          nodeKey
        },
        para
      ] = queryKey;
      const res = await fetch(
        `${serverURL}/api/${relationTo}/${value}${stringify({ ...para }, { addQueryPrefix: true })}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" }
        }
      );
      if (res.ok) {
        // Return RAW data here. Processing happens in 'select'.
        return (await res.json()) as FetchedImageDoc;
      }
      if (res.status === 404) {
        throw new RPFetchError("This image could not be found.", 404);
      }
      if (res.status === 403) {
        throw new RPFetchError(
          "You do not have permission to view this image.",
          403
        );
      }
      throw new RPFetchError(`Server error (${res.status})`, res.status);
    }, // 2. process logic: Transforms Raw -> UI View Model
    select: (data): Omit<RenderImageFields, "src"> & { src: string } => {
      try {
        return processFetchedImage(data);
      } catch (err) {
        // Determine if it's our RPFetchError or a code error
        if (err instanceof RPFetchError) throw err;
        throw new RPFetchError("Failed to process image data");
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 404s (it won't magically appear)
      if (error instanceof RPFetchError && error.statusCode === 404)
        return false;
      return failureCount < 2;
    },
    initialData: initialData,
    enabled: !!doc.value,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  return {
    ...a,
    bustCache
  };
};
export type ImageSaveParams = {
  file: File;
  meta: ImageMetadata;
  relationTo: ImageCollectionSlug;
  nodeKey: string;
};
export type UploadResult = RalueAsDataWithRelation & {
  nodeKey: string;
  processed: ProcessedImageDoc;
  existed?: boolean;
};
// 2. MUTATION: Upload File
export const useRPUploadMutation = () => {
  const [editor] = useLexicalComposerContext();
  const serverURL = getClientSideURL();
  const uploadResults = useRef<UploadResult[]>([]);
  const qc = useQueryClient();
  const [onSuccess, _setOnSuccess] = useState<
    | ((props: {
        relationTo: ImageCollectionSlug;
        value: ProcessedImageDoc;
        nodeKey: string;
      }) => void)
    | null
  >(null);
  const [onCancel, _setOnFailure] = useState<
    ((formID: string, error?: Error | null) => void) | null
  >(null);
  const setOnSuccess = useCallback(
    (
      callback:
        | ((props: {
            relationTo: ImageCollectionSlug;
            value: ProcessedImageDoc;
            nodeKey: string;
          }) => void)
        | null
    ) => {
      _setOnSuccess(callback);
    },
    []
  );
  const setOnCancel = useCallback(
    (callback: ((formID: string, error?: Error | null) => void) | null) => {
      _setOnFailure(callback);
    },
    []
  );
  const {
    data,
    isSuccess,
    status,
    isError,
    error,
    variables,
    mutate,
    isIdle,
    reset: _reset
  } = useMutation({
    mutationFn: async ({
      file,
      meta: metaFromProps,
      relationTo: collection,
      nodeKey: formID
    }: ImageSaveParams): Promise<UploadResult> => {
      const { id, ...meta } = metaFromProps;
      const formData = new FormData();

      formData.append("file", file);

      // We might need to append other fields depending on your collection requirements
      formData.append("_payload", JSON.stringify(meta));
      const existed = !!id;
      const res = await fetch(
        `${serverURL}/api/${collection}${!!id ? "/" + id : ""}`,
        {
          method: existed ? "PATCH" : "POST",
          body: formData,
          headers: { Accept: "application/json" },
          credentials: "include"
        }
      );
      if (!res.ok) {
        // Handle Payload-specific error validation format
        const json = await res.json().catch(() => ({}));
        const serverMsg = json.errors?.[0]?.message;

        if (res.status === 413) throw new RPFetchError("File is too large.");
        if (serverMsg) throw new RPFetchError(serverMsg); // Trust server validation msg? Maybe.

        throw new RPFetchError(
          "Upload failed due to server error.",
          res.status
        );
      }
      const rawResponse = await res.json();
      // PROCESS DATA IMMEDIATELY
      // This ensures the component never touches the raw structure
      let processed: ProcessedImageDoc;
      try {
        processed = processFetchedImage(rawResponse.doc);
        const value = { ...processed } as RalueAsDataWithRelation["value"];
        return {
          existed,
          nodeKey: formID,
          processed,
          value,
          relationTo: collection
        };
      } catch (e) {
        if (e instanceof RPFetchError) throw e;
        if (e instanceof Error) {
          console.error(
            "Failed to process image data from server response. This should never happen.",
            e.message
          );
        } else {
          console.error(
            "Failed to process image data from server response. This should never happen.",
            rawResponse
          );
        }
        throw new RPFetchError(
          "Upload successful, but the server response was invalid."
        );
      }
    },

    onSettled: (data, error, variables, onMutateResult, context) => {
      if (error) {
        onCancel?.(variables.nodeKey, error);
      } else if (!!data) {
        const { nodeKey, value, relationTo } = data;
        if (data.existed) {
          const {
            alt,
            src,
            sizes,
            caption,
            blurDataUrl,
            darkmode,
            height,
            width
          } = data.processed satisfies RenderImageFields;
          qc.setQueryData(
            [
              "rp-image",
              {
                value: data.value.id,
                relationTo
              }
            ],
            {
              alt,
              src,
              sizes,
              caption,
              blurDataUrl,
              darkmode,
              height,
              width
            }
          );
          qc.setQueryData(
            [
              "rp-image",
              {
                nodeKey
              }
            ],
            {
              alt,
              src,
              sizes,
              caption,
              blurDataUrl,
              darkmode,
              height,
              width
            }
          );
        }
        uploadResults.current.push(data);
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if (node) {
            const replacerData = {
              relationTo,
              value: value.id,
              ...value,
              id: uuidv7(),
              width: value.width || undefined,
              height: value.height || undefined,
              sizes: undefined,
              span: 640
            };
            if ($isRPImageNode(node)) {
              const nodeData = node.getData();
              if (nodeData.pending) {
                if ("value" in nodeData) {
                  node.setData({
                    ...nodeData,
                    ...replacerData,
                    pending: undefined
                  } as RP_ImageData);
                  return;
                }
              }
            }
            node.replace(
              $createRPImageNode({
                data: replacerData
              })
            );
          }
        });
      }
    }
  });
  const reset = useCallback(() => {
    setOnCancel(null);
    setOnSuccess(null);
    uploadResults.current = [];
    _reset();
  }, [_reset, setOnCancel, setOnSuccess]);

  return {
    reset,
    mutate,
    data,
    variables,
    status,
    isSuccess,
    isError,
    error,
    isIdle,
    setOnSuccess,
    setOnCancel,
    onSuccess,
    onCancel
  };
};
