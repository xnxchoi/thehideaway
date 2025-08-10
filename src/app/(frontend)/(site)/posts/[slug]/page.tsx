import type {Metadata} from "next";

import {PayloadRedirects} from "@/payload/components/PayloadRedirects";
import {generateMeta} from "@/utilities/generateMeta";
import {queryPostBySlug} from "@/payload/collections/Posts/api/queryPostBySlug";
import {Media} from "@/payload-types";
import {getPayload} from "payload";
import configPromise from "@payload-config";
import config from "@payload-config";
import {getUserServer} from "@/app/(frontend)/(site)/posts/[slug]/getUserServer";
import {RPage} from "@/components/UX/Transition";
import {ProcessedRangy} from "@/components/UX/Highlightr/types";
import {HighlighterProvider} from "@/components/UX/Highlightr/provider";
import {currentUser} from "@/lib/auth/context/servers";
import {Narrateur} from "@/components/UX/Highlightr";

// export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
	const payload = await getPayload({config: configPromise});
	const posts = await payload.find({
		collection: "posts",
		draft: false,
		limit: 1000,
		overrideAccess: true,
		select: {
			slug: true,
		},
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
	const {slug = ""} = await paramsPromise;
	if (slug.length < 1) return <PayloadRedirects url={"/home"} />;
	const payload = await getPayload({config});
	const post = await queryPostBySlug({slug: slug});
	const user = await currentUser();
	if (!post) return <PayloadRedirects url={"/home"} />;
	const citations: ProcessedRangy[] = [];
	if (user) {
		console.log("hey currr", user);
		const ct = await payload.find({
			collection: "citations",
			overrideAccess: true,
			where: {
				and: [
					{
						author: {
							equals: user.id,
						},
					},
					{
						"target.value": {
							equals: post.post.id,
						},
					},
				],
			},
			limit: 100,
			sort: "-createdAt",
			select: {
				selection: true,
				quote: true,
				reference: true,
				createdAt: true,
				memo: true,
				private: true,
				color: true,
				path: true,
			},
		}).then(
			(r) =>
				r.docs.flatMap((r) =>
					r.selection.text
						? {
							...r,
							selection: {
								before: r.selection.before || "",
								after: r.selection.after || "",
								text: r.selection.text,
							},
						}
						: [],
				) satisfies ProcessedRangy[],
		).catch((e) => (payload.logger.error(e), null));
		if (ct) {
			citations.push(...ct);
		}
	} else {
		console.log("lmao no user");
	}

	return (
		<HighlighterProvider target={{
			relationTo: "posts",
			slug,
			author: post.post.author.id,
			value: post.post.id,
		}} highlights={citations}>
			<RPage type={"posts"} slug={[slug]}>
				<div className="flex h-full w-full flex-col items-center justify-center">
					<div className={
						"dark:bg-faded-white bg-faded-black fixed inset-0 z-[0] h-svh w-svw"
					}></div>
					<Narrateur post={post.post} />
				</div>
			</RPage>
		</HighlighterProvider>
	);
}

// queuedIDs={post.post.queuedIDs}

export async function generateMetadata({
	params: paramsPromise,
}: Args): Promise<Metadata> {
	const {slug = ""} = await paramsPromise;
	const post = await queryPostBySlug({slug});

	if (!post || !post.post)
		return {
			title: "The Hideaway",
			description: "The Hideaway",
		};
	return generateMeta({
		doc: {
			title: `${post.post.title} | @${post.post.author.displayUsername}`,
			image:
				(
					post.post.image as Pick<
						Media,
						"url" | "thumbnailURL" | "id" | "filename"
					>
				)?.url ?? undefined,
		},
	});
}
