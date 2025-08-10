import type {Metadata} from "next/types";
import {getPayload} from "payload";
import config from "@payload-config";
import React from "react";

import type {CardPostData} from "@/payload/components/Card";
import {CollectionArchive} from "@/payload/components/CollectionArchive";
import {Search} from "@/payload/search/Component";

import PageClient from "./page.client";

type Args = {
	searchParams: Promise<{
		q: string;
	}>;
};
export default async function Page({
	searchParams: searchParamsPromise,
}: Args) {
	const {q: query} = await searchParamsPromise;
	const payload = await getPayload({config});

	const posts = await payload.find({
		collection: "search",
		depth: 1,
		limit: 12,
		select: {
			title: true,
			slug: true,
			categories: true,
			meta: true,
		}, // pagination: false reduces overhead if you don't need totalDocs
		pagination: false,
		...(query
			? {
				where: {
					or: [
						{
							title: {
								like: query,
							},
						},
						{
							"meta.description": {
								like: query,
							},
						},
						{
							"meta.title": {
								like: query,
							},
						},
						{
							slug: {
								like: query,
							},
						},
					],
				},
			}
			: {}),
	});

	return (
		<PageClient>
			<div className="container mb-16">
				<div className="prose dark:prose-invert max-w-none">
					<h1 className="sr-only">Search</h1>
					<Search />
				</div>
			</div>
			{posts.totalDocs > 0 ? (
				<CollectionArchive posts={posts.docs as unknown as CardPostData[]} />
			) : (
				<div className="container">No results found.</div>
			)}
			s
		</PageClient>
	);
}

export function generateMetadata(): Metadata {
	return {
		title: `The Hideaway Search`,
	};
}
