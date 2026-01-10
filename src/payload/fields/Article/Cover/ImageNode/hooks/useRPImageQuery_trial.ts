import {processFetchedImage} from "@/payload/fields/Article/Cover/ImageNode/hooks/image-processors";
import {RPFetchError} from "@/payload/fields/Article/Cover/ImageNode/utils/errors";
import {
	FetchedImageDoc,
	ImageCollectionSlug,
	ProcessedImageDoc,
	RalueAsDataWithRelation,
	RalueWithRelation,
	RenderImageFields
} from "@/types/collections/image-collections";
import {ImageMetadata} from "@/types/ImageCollections/schema";
import {imageSelect} from "@/types/payload-api-selects";
import {getClientSideURL} from "@/utilities/getURL";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {stringify} from "qs-esm";
import {useCallback, useReducer, useRef, useState} from "react";

// 1. QUERY: Fetch Image Data
export const useRPImageQuery = ({
	                                doc,
	                                nodeKey,
	                                initialData
                                }: {
	                                doc: RalueWithRelation;
	                                nodeKey?: string;
	                                initialData?: FetchedImageDoc
                                }
) => {
	const serverURL = getClientSideURL();
	const [cacheBust, dispatchCacheBust] = useReducer((state) => state + 1, 0)

	// Optimization: Memoize the query string itself to prevent stringify on every render
	const [params, setParams] = useState({
		select: imageSelect()

	})

	const bustCache = useCallback(() => {
		setParams(prev => ({...prev, cacheBust}))
		dispatchCacheBust()
	}, [cacheBust, dispatchCacheBust])

	const a = useQuery({
		queryKey: ["rp-image", {
			doc,
			nodeKey,
		},
			params,],
		queryFn: async ({queryKey}: {
			queryKey: [string, { doc: RalueWithRelation; nodeKey?: string }, typeof params]
		}) => {
			const [_, {doc: {value, relationTo}, nodeKey}, para] = queryKey;
			const res = await fetch(`${serverURL}/api/${relationTo}/${value}${stringify({...para}, {addQueryPrefix: true})}`, {
				credentials: "include",
				headers: {Accept: "application/json"}
			})
			if (res.ok) {
				// Return RAW data here. Processing happens in 'select'.
				return await res.json() as FetchedImageDoc;

			}
			if (res.status === 404) {
				throw new RPFetchError("This image could not be found.", 404);
			}
			if (res.status === 403) {
				throw new RPFetchError("You do not have permission to view this image.", 403);
			}
			throw new RPFetchError(`Server error (${res.status})`, res.status);
		},// 2. process logic: Transforms Raw -> UI View Model
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
			if (error instanceof RPFetchError && error.statusCode === 404) return false;
			return failureCount < 2;
		}, initialData: initialData,
		enabled: !!doc.value,
		staleTime: 1000 * 60 * 5, // 5 minutes
	})
	return {
		...a,
		bustCache
	}
}
export type ImageSaveParams = {
	file: File;
	meta: ImageMetadata;
	relationTo: ImageCollectionSlug;
	formID: string
}
export type UploadResult = RalueAsDataWithRelation & {
	formID: string;
	processed: ProcessedImageDoc
	existed?: boolean;
}
// 2. MUTATION: Upload File
export const useRPUploadMutation = () => {
	const serverURL = getClientSideURL();
	const uploadResults = useRef<UploadResult[]>([]);
	const qc = useQueryClient();
	const [onSuccess, _setOnSuccess] = useState<((props: {
		relationTo: ImageCollectionSlug;
		value: ProcessedImageDoc;
		formID: string
	}) => void) | null>(null)
	const [onCancel, _setOnFailure] = useState<((formID: string, error?: Error | null) => void) | null>(null)
	const setOnSuccess = useCallback((callback: ((props: {
		relationTo: ImageCollectionSlug;
		value: ProcessedImageDoc;
		formID: string
	}) => void) | null) => {
		_setOnSuccess(callback)

	}, [])
	const setOnCancel = useCallback((callback: ((formID: string, error?: Error | null) => void) | null) => {
		_setOnFailure(callback)
	}, [])
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
			                   formID
		                   }: ImageSaveParams): Promise<UploadResult> => {
			const {
				id,
				...meta
			} = metaFromProps;
			const formData = new FormData();

			formData.append("file", file);

			// We might need to append other fields depending on your collection requirements
			formData.append("_payload", JSON.stringify(meta));
			const existed = !!id;
			const res
				= await fetch(`${serverURL}/api/${collection}${!!id ? "/" + id : ""}`, {
				method: existed ? "PATCH" : "POST",
				body: formData,
				headers: {Accept: "application/json"},
				credentials: "include"
			});
			if (!res.ok) {
				// Handle Payload-specific error validation format
				const json = await res.json().catch(() => ({}));
				const serverMsg = json.errors?.[0]?.message;

				if (res.status === 413) throw new RPFetchError("File is too large.");
				if (serverMsg) throw new RPFetchError(serverMsg); // Trust server validation msg? Maybe.

				throw new RPFetchError("Upload failed due to server error.", res.status);
			}
			const rawResponse = await res.json();
			// PROCESS DATA IMMEDIATELY
			// This ensures the component never touches the raw structure
			let processed: ProcessedImageDoc;
			try {
				processed = processFetchedImage(rawResponse.doc);
				const value = {...processed} as RalueAsDataWithRelation["value"]
				return {
					existed,
					formID,
					processed,
					value,
					relationTo: collection,
				};
			} catch (e) {
				if (e instanceof RPFetchError) throw e;
				if (e instanceof Error) {
					console.error(
						"Failed to process image data from server response. This should never happen.",
						e.message
					)
				} else {
					console.error(
						"Failed to process image data from server response. This should never happen.",
						rawResponse
					)
				}
				throw new RPFetchError("Upload successful, but the server response was invalid.");
			}
		},
		onSettled: (data, error, variables, onMutateResult, context) => {
			if (error || !data) {
				onCancel?.(variables.formID, error)
			} else {
				const {formID, value, relationTo} = data;
				if (data.existed) {
					const {
						alt,
						src,
						sizes,
						caption,
						blurDataUrl,
						darkmode, height, width,
					} = data.processed satisfies RenderImageFields;
					qc.setQueryData(["rp-image", {

						value: data.value.id,
						relationTo
					}], {
						alt,
						src,
						sizes,
						caption,
						blurDataUrl,
						darkmode, height, width,
					})
				}
				uploadResults.current.push(data);
				onSuccess?.({formID, value, relationTo})
			}
		}
	});
	const reset = useCallback(() => {
		setOnCancel(null)
		setOnSuccess(null)
		uploadResults.current = [];
		_reset()
	}, [_reset, setOnCancel, setOnSuccess])

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
	}
};
