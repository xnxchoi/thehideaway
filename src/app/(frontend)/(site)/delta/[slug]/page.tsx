import {getPayload} from "payload";
import configPromise from "@payload-config";
import {draftMode} from "next/headers";
import {notFound} from "next/navigation";

export const dynamic = "force-static";
export const revalidate = 600;
export const generateStaticParams = async () => {
	const payload = await getPayload({config: configPromise});

	const delta = await payload.find({
		collection: "delta",

		limit: 1000,
		pagination: false,
		where: {
			_status: {
				equals: "published",
			},
		},
		select: {
			slug: true,
		},
	});
	const deltaSlug = delta.docs.map((delta) => ({
		slug: delta.slug,
	}));

	return [...deltaSlug];
};
type Args = {
	params: Promise<{
		slug: string;
	}>;
};
export default async function DeltaPage({params}: Args) {
	const {slug} = await params;
	const payload = await getPayload({config: configPromise});
	const enabledDrafts = await draftMode();

	const deltas = await payload.find({
		collection: "delta",
		draft: enabledDrafts.isEnabled,
		where: {
			slug: {
				equals: slug,
			},
		},
		select: {
			slug: true,
			title: true,
			content: true,
			author: true,
			tags: true,
			category: true,
		},
	});
	if (!deltas.docs.length) {
		notFound();
	}
	const deltaData = deltas.docs[0]!;
	return <div>{deltaData.title}</div>;
}

export async function generateMetadata({params}: Args) {
	const {slug} = await params;
	const payload = await getPayload({config: configPromise});
	const enabledDrafts = await draftMode();
	const deltas = await payload.find({
		collection: "delta",
		draft: enabledDrafts.isEnabled,
		where: {
			slug: {
				equals: slug,
			},
		},
		select: {
			title: true,
		},
		limit: 1,
		overrideAccess: true,
	});
	if (!deltas.docs.length) {
		return {
			title: "404",
			description: "Not Found",
		};
	}
	const deltaData = deltas.docs[0]!;
	return {
		title: `${deltaData.title} | Delta `,
		description: deltaData.title,
	};
}
