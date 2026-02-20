import {getPayload} from "payload";
import configPromise from "@payload-config";
import {draftMode} from "next/headers";
import {notFound} from "next/navigation";

export const generateStaticParams = async () => {
	const payload = await getPayload({config: configPromise});

	const surfs = await payload.find({
		collection: "surf",

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
	const surfSlug = surfs.docs.map((s) => ({
		slug: s.slug,
	}));

	return [...surfSlug];
};
type Args = {
	params: Promise<{
		slug: string;
	}>;
};
export default async function SurfPage({params}: Args) {
	const {slug} = await params;
	const enabledDrafts = await draftMode();
	const surfs = await getSurf({slug, draft: enabledDrafts.isEnabled});

	if (!surfs.docs.length) {
		notFound();
	}
	const surfsData = surfs.docs[0]!;
	return <div>{surfsData.title}</div>;
}

async function getSurf({draft, slug}: { slug: string; draft: boolean; }) {
	"use cache"
	const payload = await getPayload({config: configPromise});
	const surfs = await payload.find({
		collection: "surf",
		draft,
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
	return surfs;
}

export async function generateMetadata({params}: Args) {
	const {slug} = await params;
	const payload = await getPayload({config: configPromise});
	const enabledDrafts = await draftMode();
	const surfs = await payload.find({
		collection: "surf",
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
	if (!surfs.docs.length) {
		return {
			title: "404",
			description: "Not Found",
		};
	}
	const surfData = surfs.docs[0]!;
	return {
		title: `${surfData.title} | Surf `,
		description: surfData.title,
	};
}
