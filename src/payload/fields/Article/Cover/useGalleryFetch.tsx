"use client";

import type {CompilationsSelect} from "@/payload-types"
import {useInfiniteQuery, useQueries} from "@tanstack/react-query";
import type {Sort, TypedCollectionSelect, Where} from "payload";
import {stringify} from "qs-esm";
import {useCallback, useMemo} from "react";
import { PayloadFindFetch } from "@types/payload-api-helpers";
import {
  FetchedImageDoc,
  ImageCollectionSlug,
  RalueAsDataWithRelation,
  RalueWithRelation,
  RenderImageFields
} from "@types/collections/image-collections";
import { imageSelect } from "@types/payload-api-selects";
import {getClientSideURL} from "@/utilities/getURL";

export const useGallery = ({type = "unsplash", query = {}, limit = 8, page = 1}: {
	type?: "unsplash" | ImageCollectionSlug;
	query?: Where;
	limit?: number;
	page?: number;
	sort?: Sort
}) => {
	const siteURL = getClientSideURL();
	const baseURL = useMemo(() => {
		switch (type) {
			case "unsplash":
				return "https://api.unsplash.com/";
			default:
				return `${siteURL}/api/${type}`
		}
	}, [siteURL, type])
	const perPage = useMemo(() => (type === "unsplash" ? {per_page: limit} : {limit})
		, [limit, type])
}
export const useUnsplashFetch = () => {

}
export const useGalleryFetch = (enabled = false) => {
	const whereComp = useMemo(() => ({
		imagePicker: {
			equals: true
		}
	} as Where), [])
	const selectComp = useMemo(() => ({
		items: true, title: true
	}) as CompilationsSelect, [])

	const where = useMemo(
		() =>
			({
				and: [
					{
						mimeType: {
							contains: "image/"
						}
					},
					{
						filesize: {
							less_than: 1024 * 1024 * 4
						}
					}
				]
			}) as Where,
		[]
	);
	const select: TypedCollectionSelect["assets"] = useMemo(
		() => ({
			id: true,
			thumbnailURL: true,
			blurDataUrl: true,
			mimeType: true,
			filename: true,
			url: true,

			alt: true,
			caption: true
		}),
		[]
	);
	const compQuery: {
		where: Where;
		depth: number;
		limit: number;
		select: TypedCollectionSelect["compilations"];
	} = useMemo(
		() => ({
			where: whereComp,
			depth: 1,
			limit: 5,
			select: selectComp
		}),
		[whereComp, selectComp]
	);
	const query: {
		where: Where;
		sort: string;
		limit: number;
		select: TypedCollectionSelect["assets"];
	} = useMemo(
		() => ({
			where,
			sort: "-createdAt",
			limit: 6,
			select
		}),
		[where, select]
	);
	const fetchCompilations = useCallback(async ({pageParam}: { pageParam: number | null }) => {
		const res = await fetch(`/api/compilations${stringify(compQuery, {addQueryPrefix: true})}${(pageParam && `&page=${pageParam}`) || ""}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}, credentials: "include"
		});
		if (res.ok) {
			const data = await res.json() as PayloadFindFetch<{
				id: string;
				title: string;
				items: Array<{ relationTo: "assets"; value: FetchedImageDoc }>
			}>
			console.log("data:", data)
			const {
				hasNextPage,
				hasPrevPage,
				limit,
				nextPage,
				page,
				pagingCounter,
				prevPage,
				totalDocs,
				totalPages
			} = data;
			const docs = data.docs.map(v => ({
					title: v.title,
					id: v.id,
					items: v.items.flatMap((rv) => {
						const r = rv.value;
						const {relationTo} = rv;
						const src = r.src;
						if (!src) {
							return [];
						}
						const {alt, caption, thumbnailURL} = r;
						const fields: RenderImageFields = {
							caption,
							darkmode: r.darkmode,
							height: r.height,
							width: r.width,
							blurDataUrl: r.blurDataUrl,
							alt,
							src,
						};
						return {
							value: {
								relationTo, value: v.id,
							}, data: fields
						};
					})
				}

			));
			return {
				docs,
				hasNextPage,
				hasPrevPage,
				limit,
				nextPage,
				page,
				pagingCounter,
				prevPage,
				totalDocs,
				totalPages
			};
		}
		;
		throw new Error("Failed to fetch compilations")
	}, [compQuery])
	const fetchFromAsset = useCallback(
		async ({pageParam}: { pageParam: number | null }) => {
			const res = await fetch(
				`/api/assets${stringify(query, {addQueryPrefix: true})}${(pageParam && `&page=${pageParam}`) || ""}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json"
					},
					credentials: "include"
				}
			);
			if (res.ok) {
				const data = (await res.json()) as {
					docs: {
						id: string;
						alt: string;
						caption?: string | null;
						url?: string | null;
						thumbnailURL?: string | null;
						filename?: string | null;
						mimeType?: string | null;
					}[];
					hasNextPage: boolean;
					hasPrevPage: boolean;
					limit: number;
					nextPage: number | null;
					page: number;
					pagingCounter: number;
					prevPage: number | null;
					totalDocs: number;
					totalPages: number;
				};
				const {
					hasNextPage,
					hasPrevPage,
					limit,
					nextPage,
					page,
					pagingCounter,
					prevPage,
					totalDocs,
					totalPages
				} = data;
				const docs = data.docs.flatMap((r) => {
					const src = r.url;
					if (!src) {
						return [];
					}
					const {filename, alt, caption, thumbnailURL} = r;
					if (!thumbnailURL) {
						return [];
					}
					return {
						src,
						caption,
						alt,
						thumbnailURL
					};
				});
				return {
					docs,
					hasNextPage,
					hasPrevPage,
					limit,
					nextPage,
					page,
					pagingCounter,
					prevPage,
					totalDocs,
					totalPages
				};
			}
			throw new Error("Failed to fetch assets");
		},
		[query]
	);
	const queryfns = useInfiniteQuery({
		queryKey: ["gallery"],
		queryFn: fetchCompilations,
		enabled,
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages) => lastPage.nextPage,
		getPreviousPageParam: (firstPage, pages) => firstPage.prevPage,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false
	});

	return queryfns;
};
export const useParallelImageFetch = ({
	                                      enabled,
	                                      targets
                                      }: {
	enabled: boolean;
	targets: RalueWithRelation[]
}) => {
	const select = useMemo(() => imageSelect(), [])

	const fetchFn = useCallback(async ({queryKey}: {
		queryKey: [string, { relationTo: ImageCollectionSlug; value: string }]
	}) => {
		const [_, {relationTo: collection, value}] = queryKey;
		const res = await fetch(`/api/${collection}/${value}${stringify({select}, {addQueryPrefix: true})}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json"
			}, credentials: "include"
		})
		if (res.ok) {
			const data = await res.json() as FetchedImageDoc;
			if (!data.url) {
				throw new Error("Failed to fetch image")
			}
			return {
				relationTo: collection,
				value: data
			} as RalueAsDataWithRelation
		}
		throw new Error("Failed to fetch gallery item")
	}, [select])
	const queries = useQueries(({
		queries: targets.map(v => ({
			queryKey: ["imageFetch", {
				relationTo: v.relationTo as ImageCollectionSlug,
				value: v.value
			}] as [string, RalueWithRelation],
			queryFn: fetchFn,
			enabled,
			staleTime: Infinity,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false
		}))
	}))
	return {queries}

}