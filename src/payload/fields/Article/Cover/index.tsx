import type {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {getServerSideURL} from "@/utilities/getURL";
import {FilterOptionsResult, type UploadFieldServerProps, Where} from "payload";
import {CoverImageClient} from "./coverClient";
import {randomNumber} from "@/utilities/randomNumber";
import {getFallbackFromUnsplash} from "@/payload/collections/Media/hooks/getFallbackFromUnsplash";
import {
	ImageProvider,
	ProcessedImageDoc,
	RalueAsDataWithRelation,
	RalueWithRelation
} from "@/types/collections/imageCollections";
import {imageSelect} from "@/types/payload-api-selects";
import {UnsplashFetchResult} from "@/payload/collections/Media/hooks/types";

type Prop = Omit<UploadFieldServerProps, "value"> & {
	relationTo?: ImageCollectionSlug[];
	value?: null | RalueAsDataWithRelation | RalueWithRelation;
};
export default async function CoverImageServerComponent(props: Prop) {
	const {
		user,
		field: {validate, relationTo: rt},
		clientField: field,
		value,
		path,
		payload,
		permissions
	} = props;
	const relationTo = Array.isArray(rt) ? rt : [rt];

	if (!user) return <></>;
	const serverURL = getServerSideURL();
	const whereBase: Where & { and: Where[] } = {
		and: [
			{
				filesize: {
					less_than: 2560000
				}
			},

			{
				mimeType: {
					contains: "image"
				}
			}
		]
	};
	const filterOptions = relationTo.reduce((prev, next) => {
		const whereQuery = whereBase;
		if (next === "userMedia") {
			whereQuery.and.push({
				author: {
					equals: user.id
				}
			});
		}
		return {
			...prev,
			[next]: whereQuery
		}

	}, {} as FilterOptionsResult)

	let imageValue: null | RalueAsDataWithRelation = null;
	let fallbackValue: undefined | UnsplashFetchResult;
	if (value) {
		const res = await payload.findByID({
			collection: value.relationTo,
			id: typeof value.value === "string" ? value.value : value.value.id,
			select: imageSelect()
		}).then(r => {
			const {src, url} = r;
			if (!!src && !!url) {
				return {
					...r,
					src,
					url,
					source: {
						identifier: r.id,
						provider: "local" as ImageProvider
					}
				}
			}
			return null;
		})
		if (res) {
			imageValue = {
				relationTo: value.relationTo,
				value: res
			};
		}
	} else {
		const assetCount = await payload.count({
			collection: "assets", where: whereBase
		}).then((r) => r.totalDocs).catch((e) => {
			payload.logger.error({
				message: "Failed to get asset count", error: e
			});
			return 0;
		});

		if (assetCount > 0) {
			const lastPages: number[] = [];
			let target: ProcessedImageDoc | null = null;
			while (target === null && lastPages.length < assetCount && lastPages.length < 10) {
				let page: number | null = null;
				let cnt = 0;
				while (page === null && cnt < 2) {
					cnt++;
					const tempPage = randomNumber(0, assetCount);
					if (lastPages.indexOf(tempPage) < 0) {
						page = tempPage;
						lastPages.push(tempPage);
					}
				}
				if (page) {
					const res = await payload.find({
						collection: "assets",
						where: whereBase,
						limit: 1,
						page,
						select: imageSelect(),
					});
					if (res.docs.length > 0) {
						const tempTarget = res.docs[0];
						const {src, url, source} = tempTarget;
						if (!!src && !!url) {
							target = {
								...tempTarget,
								src,
								url,
								source: {
									identifier: tempTarget.id,
									provider: "local"
								}
							};
						}
					}
				}

			}
			if (target) {
				imageValue = {
					relationTo: "assets",
					value: target
				}
			} else {
				imageValue = null
			}
		}
		if (!imageValue) {
			fallbackValue = await getFallbackFromUnsplash().catch((e) => {
				payload.logger.error({
					message: "error attempting to fetch fallback from unsplash", error: e
				});
				return null;
			});
		}
	}
	return (
		<CoverImageClient
			path={path}
			filterOptions={filterOptions} user={{
			name: user.name || "",
			id: user.id,
			slug: ("slug" in user && user.slug) || "",
			image: ("image" in user && user.image) || ""
		}}
			relationTo={relationTo as ImageCollectionSlug[]}
			serverURL={serverURL}
			field={field}
			value={imageValue?.value} fallback={fallbackValue}
		/>
	);
}
