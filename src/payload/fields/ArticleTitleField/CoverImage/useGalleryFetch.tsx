"use client";

import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import type {Where, TypedCollectionSelect} from "payload";
import {stringify} from "qs-esm";
import {useCallback, useEffect, useMemo, useState} from "react";

export const useGalleryFetch = (enabled = false) => {
	const where = useMemo(() => ({
		and: [{
			mimeType: {
				contains: "image/"
			}
		}, {
			filesize: {
				less_than: 1024 * 1024 * 4
			}
		}]
	}) as Where, []);
	const select: TypedCollectionSelect["assets"] = useMemo(() => ({
		id: true, thumbnailURL: true, blurDataUrl: true, mimeType: true, filename: true,

		alt: true, caption: true
	}), []);
	const query: {
		where: Where; sort: string; limit: number; select: TypedCollectionSelect["assets"];
	} = useMemo(() => ({
		where, sort: "-createdAt", limit: 6, select
	}), [where, select]);
	const fetchFromAsset = useCallback(async ({pageParam}: { pageParam: number | null }) => {
		const res = await fetch(
			`/api/userMedia${stringify(query, {addQueryPrefix: true})}${(pageParam && `&page=${pageParam}`) || ""}`, {
				method: "GET", headers: {
					"Content-Type": "application/json"
				}, credentials: "include"
			});
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
			return data;
		}
		throw new Error("Failed to fetch assets");
	}, [query]);
	const queryfns = useInfiniteQuery({
		queryKey: ["gallery"],
		queryFn: fetchFromAsset,
		enabled,
		initialPageParam: 0,
		getNextPageParam: (lastPage, pages) => lastPage.nextPage,
		getPreviousPageParam: (firstPage, pages) => firstPage.prevPage,
		staleTime: Infinity
	});

	return queryfns;
};
