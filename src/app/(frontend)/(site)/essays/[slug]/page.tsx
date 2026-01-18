import {Narrateur} from "@/components/UX/Highlightr";
import {PrevNext} from "@/components/UX/Highlightr/prevNext";
import {RPage} from "@/components/UX/Transition";
import {queryPostBySlug} from "@/payload/collections/Posts/api/queryPostBySlug";
import {PayloadRedirects} from "@/payload/components/PayloadRedirects";
import {generateMeta} from "@/utilities/generateMeta";
import {getServerSideURL} from "@/utilities/getURL";
import configPromise from "@payload-config";
import type {Metadata} from "next";
import {cacheLife} from "next/cache";
import {getPayload} from "payload";
import PageClient from "./page.client";
// export const dynamic = "force-static";

export async function generateStaticParams() {
	const payload = await getPayload({config: configPromise});
	const posts = await payload.find({
		collection: "posts",
		draft: false,
		limit: 1000,
		overrideAccess: false,
		select: {
			slug: true
		},
		user: null
	});

	const postSlug = posts.docs.map(({slug, id}) => {
		return {slug: slug};
	});
	return [...postSlug];
}

type Args = {
	params: Promise<{
		slug?: string;
	}>;
};

export default async function Post({params: paramsPromise}: Args) {
	"use cache"
	cacheLife("hours")
	const {slug = ""} = await paramsPromise;
	if (slug.length < 1) return <PayloadRedirects url={"/home"}/>;
	const p = await queryPostBySlug({slug});
	if (!p) return <PayloadRedirects url={"/home"}/>;
	const {post, prev, next} = p;

	return (
		<RPage type={"posts"} slug={[slug]} key={slug}>
			<PageClient post={post}>
				<Narrateur post={post}/>
			</PageClient>
			<div
				className={
					"fixed inset-0 z-0 h-svh w-svw bg-faded-black dark:bg-faded-white"
				}
			></div>
			{<PrevNext prev={prev} next={next}/>}
		</RPage>
	);
}

// queuedIDs={post.post.queuedIDs}

export async function generateMetadata({
	                                       params: paramsPromise
                                       }: Args): Promise<Metadata> {
	const {slug = ""} = await paramsPromise;
	const p = await queryPostBySlug({slug});
	if (!p)
		return {
			title: "The Hideaway",
			description: "The Hideaway"
		};
	const {post} = p;
	const {author, title, image} = post;
	return generateMeta({
		doc: {
			title: `${title} | @${author.name}`,
			image: !!image ? (image.value.thumbnailURL || image.value.url) : null
		}
	});
}
